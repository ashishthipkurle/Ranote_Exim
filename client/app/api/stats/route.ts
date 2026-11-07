import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/stats — Dashboard statistics for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || auth.role.toLowerCase();
    const supabase = createAdminClient();

    if (scope === 'importer') {
      const isOwner = auth.role !== 'ADMIN';
      try {
        let orderQuery = supabase
          .from('orders')
          .select('id, totalPrice, orderStatus, paymentStatus, createdAt, product:products(category)')
          .order('createdAt', { ascending: false });

        if (isOwner) {
          orderQuery = orderQuery.eq('buyerId', auth.userId);
        }

        const { data: orders = [] } = await orderQuery;
        const totalOrders = orders?.length || 0;
        const paidOrders = orders?.filter((o: any) => ['PAID', 'PARTIAL'].includes(o.paymentStatus)) || [];
        const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + (Number(o.totalPrice) || 0), 0);
        const pendingOrders = orders?.filter((o: any) => ['QUOTE_REQUESTED', 'PO_RAISED', 'PAYMENT_CONFIRMED', 'PROCESSING'].includes(o.orderStatus)).length || 0;

        const categoryMap = new Map<string, number>();
        paidOrders.forEach((o: any) => {
          const cat = o.product?.category || 'OTHER';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + (Number(o.totalPrice) || 0));
        });

        const categories = Array.from(categoryMap.entries()).map(([name, spent]) => ({ name, spent }));

        return NextResponse.json({
          totalOrders,
          activeShipments: 0,
          totalSpent,
          pendingOrders,
          monthlySpending: [],
          categories,
        }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
      } catch (err) {
        return NextResponse.json({ totalOrders: 0, activeShipments: 0, totalSpent: 0, pendingOrders: 0, monthlySpending: [], categories: [] });
      }
    }

    if (scope === 'exporter') {
      const isOwner = auth.role !== 'ADMIN';
      try {
        let prodQuery = supabase.from('products').select('*', { count: 'exact', head: true }).is('deletedAt', null);
        if (isOwner) {
          prodQuery = prodQuery.eq('exporterId', auth.userId);
        }
        const { count: prodCount } = await prodQuery;

        let ordQuery = supabase.from('orders').select('totalPrice, orderStatus, paymentStatus');
        if (isOwner) {
          ordQuery = ordQuery.eq('sellerId', auth.userId);
        }
        const { data: orders = [] } = await ordQuery;

        const totalProducts = prodCount || 0;
        const activeOrders = orders?.filter((o: any) => ['QUOTE_REQUESTED', 'PO_RAISED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.orderStatus)).length || 0;
        const totalRevenue = orders?.reduce((acc: number, o: any) => acc + (Number(o.totalPrice) || 0), 0) || 0;

        return NextResponse.json({
          totalProducts,
          activeOrders,
          totalRevenue,
          totalShipments: 0,
        }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
      } catch (err) {
        return NextResponse.json({ totalProducts: 0, activeOrders: 0, totalRevenue: 0, totalShipments: 0 });
      }
    }

    if (scope === 'admin' || auth.role === 'ADMIN') {
      try {
        const [uRes, pRes, oRes] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).is('deletedAt', null),
          supabase.from('orders').select('totalPrice'),
        ]);

        const totalUsers = uRes.count || 0;
        const totalProducts = pRes.count || 0;
        const totalOrders = oRes.data?.length || 0;
        const totalRevenue = oRes.data?.reduce((acc: number, o: any) => acc + (Number(o.totalPrice) || 0), 0) || 0;

        return NextResponse.json({
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
          activeShipments: 0,
          recentOrders: totalOrders,
        });
      } catch (err) {
        return NextResponse.json({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0, activeShipments: 0, recentOrders: 0 });
      }
    }

    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
