export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/orders — List orders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noShipment = searchParams.get('noShipment') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const where: any = {};

    // Scope orders based on role
    if (auth.role === 'EXPORTER') {
      where.sellerId = auth.userId;
      // Exclude incomplete checkout orders — only show paid/confirmed orders
      where.orderStatus = { not: 'CHECKOUT' };
    } else if (auth.role === 'IMPORTER' || auth.role === 'CONSUMER' || auth.role === 'USER') {
      where.buyerId = auth.userId;
    }
    // ADMIN sees all

    // Filter to orders without shipments (for creating new shipments)
    if (noShipment) {
      where.shipment = null;
    }

    let orders: any[] = [];

    // 1. Try fast Supabase REST first (HTTPS port 443 - zero socket issues)
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('orders')
        .select(`
          *,
          product:products(id, name, category, images),
          buyer:users!orders_buyerId_fkey(id, name, businessName, country, email),
          seller:users!orders_sellerId_fkey(id, name, businessName, country)
        `)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (auth.role === 'EXPORTER') {
        query = query.eq('sellerId', auth.userId).neq('orderStatus', 'CHECKOUT');
      } else if (auth.role === 'IMPORTER' || auth.role === 'CONSUMER' || auth.role === 'USER') {
        query = query.eq('buyerId', auth.userId);
      }

      const { data, error } = await query;
      if (data && !error) {
        orders = data.map((o: any) => ({
          ...o,
          product: Array.isArray(o.product) ? o.product[0] : o.product || { name: 'Export Item' },
          buyer: Array.isArray(o.buyer) ? o.buyer[0] : o.buyer,
          seller: Array.isArray(o.seller) ? o.seller[0] : o.seller,
        }));
      }
    } catch {
      // Supabase REST error, fallback to Prisma below
    }

    // 2. Fallback to Prisma if Supabase returned empty
    if (orders.length === 0) {
      try {
        orders = (await Promise.race([
          prisma.order.findMany({
            where,
            include: {
              product: {
                select: { id: true, name: true, category: true, images: true },
              },
              buyer: {
                select: { id: true, name: true, businessName: true, country: true, email: true },
              },
              seller: {
                select: { id: true, name: true, businessName: true, country: true },
              },
              shipment: {
                select: { id: true, trackingNumber: true, currentStatus: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
        ])) as any[];
      } catch {
        orders = [];
      }
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('List orders error:', error);
    return NextResponse.json({ orders: [] });
  }
}
