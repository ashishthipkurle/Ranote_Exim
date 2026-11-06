import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/directory/[partnerId] — Get trade history with a specific partner
export async function GET(
  request: NextRequest,
  { params }: { params: { partnerId: string } }
) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnerId } = params;

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, businessName: true, role: true },
    });

    if (!partner) {
      return NextResponse.json({ orders: [] });
    }

    const isPartnerSeller = partner.role === 'EXPORTER' || partner.role === 'ADMIN';
    const isAuthBuyer = auth.role === 'IMPORTER' || auth.role === 'CONSUMER' || auth.role === 'USER';

    const whereClause: any = (isPartnerSeller && isAuthBuyer)
      ? { buyerId: auth.userId, sellerId: partnerId }
      : (auth.role === 'ADMIN')
      ? { OR: [{ buyerId: partnerId }, { sellerId: partnerId }] }
      : { buyerId: partnerId, sellerId: auth.userId };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            name: true,
            category: true,
            images: true,
            unit: true,
            exporter: { select: { name: true, businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Directory trade history error:', error);
    return NextResponse.json({ error: 'Failed to fetch trade history' }, { status: 500 });
  }
}
