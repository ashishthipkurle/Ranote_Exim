import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
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

    // Determine target roles:
    // If explicitly asked for EXPORTER / SELLERS, or if viewer is an IMPORTER / CONSUMER / USER / SUPPLIER:
    // We target Sellers (EXPORTER and ADMIN accounts that sell on the platform)
    const isTargetingExporters =
      requestedRole === 'EXPORTER' ||
      requestedRole === 'SELLER' ||
      requestedRole === 'SELLERS' ||
      (!requestedRole && (auth.role === 'IMPORTER' || auth.role === 'CONSUMER' || auth.role === 'USER' || auth.role === 'SUPPLIER'));

    const targetRoles: Role[] = isTargetingExporters
      ? (['EXPORTER', 'ADMIN'] as Role[])
      : (['IMPORTER', 'CONSUMER', 'USER'] as Role[]);

    const where: any = {
      role: { in: targetRoles },
      id: { not: auth.userId },
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          businessName: true,
          country: true,
          verificationStatus: true,
          avatar: true,
          role: true,
          email: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { businessName: 'asc' },
          { name: 'asc' },
        ],
      }),
      prisma.user.count({ where }),
    ]);

    const partners = await Promise.all(
      users.map(async (p) => {
        const orderWhere = isTargetingExporters
          ? { sellerId: p.id, buyerId: auth.userId }
          : { buyerId: p.id, sellerId: auth.userId };

        const [orderCount, orderAgg, unreadCount] = await Promise.all([
          prisma.order.count({ where: orderWhere }).catch(() => 0),
          prisma.order.aggregate({
            where: orderWhere,
            _sum: { totalPrice: true },
          }).catch(() => ({ _sum: { totalPrice: 0 } })),
          prisma.message.count({
            where: {
              senderId: p.id,
              receiverId: auth.userId,
              isRead: false,
            },
          }).catch(() => 0),
        ]);

        return {
          id: p.id,
          name: p.name || p.businessName || (p.email ? p.email.split('@')[0] : 'Verified Partner'),
          businessName: p.businessName || (p.role === 'ADMIN' ? 'Ranote Exim Verified Partner' : null),
          country: p.country || 'India',
          verificationStatus: p.verificationStatus || 'VERIFIED',
          avatar: p.avatar,
          orderCount: Number(orderCount),
          totalValue: Number(orderAgg?._sum?.totalPrice || 0),
          unreadCount: Number(unreadCount),
        };
      })
    );

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
    return NextResponse.json(
      { error: 'Failed to fetch directory', details: error?.message },
      { status: 500 }
    );
  }
}
