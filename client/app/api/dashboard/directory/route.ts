import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/directory — Trading partners for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')));
    const requestedRole = (searchParams.get('role') || searchParams.get('target') || '').toUpperCase();

    const isTargetingExporters =
      requestedRole === 'EXPORTER' ||
      requestedRole === 'SELLER' ||
      requestedRole === 'SELLERS' ||
      (!requestedRole && (auth.role === 'IMPORTER' || auth.role === 'CONSUMER' || auth.role === 'USER' || auth.role === 'SUPPLIER'));

    const exporterRoles = ['EXPORTER', 'ADMIN', 'SUPPLIER'];
    const importerRoles = ['IMPORTER', 'CONSUMER', 'USER'];

    let users: any[] = [];
    let totalCount = 0;

    // 1. Try Supabase REST over HTTPS
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('users')
        .select('id, name, businessName, country, verificationStatus, avatar, role, email', { count: 'exact' })
        .is('deletedAt', null);

      if (isTargetingExporters) {
        query = query.in('role', exporterRoles);
      } else {
        query = query.in('role', importerRoles);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,businessName.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const skip = (page - 1) * limit;
      query = query.range(skip, skip + limit - 1);

      const { data, count } = await query;
      if (data) {
        users = data;
        totalCount = count || data.length;
      }
    } catch {
      // Supabase REST error, fall back to Prisma below
    }

    // 2. Prisma fallback if Supabase REST returned empty
    if (users.length === 0) {
      try {
        const where: any = { deletedAt: null };
        if (isTargetingExporters) {
          where.role = { in: exporterRoles };
        } else {
          where.role = { in: importerRoles };
        }
        users = (await Promise.race([
          prisma.user.findMany({
            where,
            select: { id: true, name: true, businessName: true, country: true, verificationStatus: true, avatar: true, role: true, email: true },
            skip: (page - 1) * limit,
            take: limit,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
        ])) as any[];
        totalCount = users.length;
      } catch {
        users = [];
      }
    }

    const partners = users.map((p) => ({
      id: p.id,
      name: p.name || p.businessName || (p.email ? p.email.split('@')[0] : 'Verified Partner'),
      businessName: p.businessName || (p.role === 'ADMIN' ? 'Ranote Exim Verified Partner' : null),
      country: p.country || 'India',
      verificationStatus: p.verificationStatus || 'VERIFIED',
      avatar: p.avatar,
      orderCount: 0,
      totalValue: 0,
      unreadCount: 0,
    }));

    return NextResponse.json({
      role: auth.role,
      partners,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Directory fetch error:', error);
    return NextResponse.json({
      role: 'USER',
      partners: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
  }
}
