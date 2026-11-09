import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/finance — Financial summary for the authenticated user (B2B Trade & Settlement)
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role === 'EXPORTER') {
      try {
        const orderFilter = {
          OR: [
            { sellerId: auth.userId },
            { product: { exporterId: auth.userId } },
          ],
        };

        const [paidRevenue, pendingRevenue, recentOrders, lastPaidOrder] = await Promise.all([
          prisma.order.aggregate({
            where: {
              ...orderFilter,
              paymentStatus: 'PAID',
            },
            _sum: { totalPrice: true },
          }),
          prisma.order.aggregate({
            where: {
              ...orderFilter,
              paymentStatus: { in: ['PENDING', 'PARTIAL'] },
              orderStatus: {
                in: [
                  'QUOTE_CONFIRMED',
                  'PO_RAISED',
                  'PAYMENT_CONFIRMED',
                  'PROCESSING',
                  'SHIPPED',
                  'DELIVERED',
                ],
              },
            },
            _sum: { totalPrice: true },
          }),
          prisma.order.findMany({
            where: orderFilter,
            include: {
              product: { select: { name: true, category: true, hsCode: true } },
              buyer: { select: { name: true, businessName: true, country: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
          prisma.order.findFirst({
            where: { ...orderFilter, paymentStatus: 'PAID' },
            orderBy: { updatedAt: 'desc' },
            select: { totalPrice: true, updatedAt: true },
          }),
        ]);

        return NextResponse.json({
          role: 'EXPORTER',
          available: paidRevenue._sum.totalPrice ?? 0,
          pending: pendingRevenue._sum.totalPrice ?? 0,
          lastPayout: lastPaidOrder?.totalPrice ?? 0,
          lastPayoutDate: lastPaidOrder?.updatedAt ?? null,
          recentInvoices: recentOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            amount: o.totalPrice,
            currency: o.currency || 'USD',
            status: o.paymentStatus,
            orderStatus: o.orderStatus,
            orderType: o.orderType || 'B2B',
            product: o.product?.name || 'Wholesale Goods',
            category: o.product?.category || 'Wholesale',
            hsCode: o.product?.hsCode || '—',
            quantity: o.quantity || 1,
            buyer: o.buyer?.businessName || o.buyer?.name || 'Verified Trade Partner',
            buyerCountry: o.buyer?.country || 'International',
            incoterms: 'FOB / CIF',
            paidAt: o.paymentStatus === 'PAID' ? o.updatedAt : null,
            date: o.createdAt,
          })),
        });
      } catch (prismaErr) {
        console.warn('[Finance Exporter] Prisma query failed, trying Supabase fallback...', prismaErr);
        const supabase = createAdminClient();
        const { data: orders = [] } = await supabase
          .from('orders')
          .select('id, orderNumber, totalPrice, currency, orderStatus, paymentStatus, orderType, quantity, createdAt, updatedAt, product:products(name, category, hsCode), buyer:users!buyerId(name, businessName, country)')
          .or(`sellerId.eq.${auth.userId}`)
          .order('createdAt', { ascending: false });

        const paidList = orders?.filter((o: any) => o.paymentStatus === 'PAID') || [];
        const pendingList = orders?.filter((o: any) =>
          ['PENDING', 'PARTIAL'].includes(o.paymentStatus) &&
          ['QUOTE_CONFIRMED', 'PO_RAISED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.orderStatus)
        ) || [];

        const available = paidList.reduce((sum: number, o: any) => sum + (Number(o.totalPrice) || 0), 0);
        const pending = pendingList.reduce((sum: number, o: any) => sum + (Number(o.totalPrice) || 0), 0);
        const lastPaidOrder = paidList[0];

        return NextResponse.json({
          role: 'EXPORTER',
          available,
          pending,
          lastPayout: Number(lastPaidOrder?.totalPrice || 0),
          lastPayoutDate: lastPaidOrder?.updatedAt || null,
          recentInvoices: (orders || []).slice(0, 10).map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            amount: Number(o.totalPrice) || 0,
            currency: o.currency || 'USD',
            status: o.paymentStatus,
            orderStatus: o.orderStatus,
            orderType: o.orderType || 'B2B',
            product: o.product?.name || 'Wholesale Goods',
            category: o.product?.category || 'Wholesale',
            hsCode: o.product?.hsCode || '—',
            quantity: o.quantity || 1,
            buyer: o.buyer?.businessName || o.buyer?.name || 'Verified Trade Partner',
            buyerCountry: o.buyer?.country || 'International',
            incoterms: 'FOB / CIF',
            paidAt: o.paymentStatus === 'PAID' ? o.updatedAt : null,
            date: o.createdAt,
          })),
        });
      }
    }

    if (auth.role === 'IMPORTER' || auth.role === 'ADMIN') {
      try {
        const [totalSpent, pendingPayments, recentOrders, user] = await Promise.all([
          prisma.order.aggregate({
            where: { buyerId: auth.userId, paymentStatus: 'PAID' },
            _sum: { totalPrice: true },
          }),
          prisma.order.aggregate({
            where: {
              buyerId: auth.userId,
              paymentStatus: { in: ['PENDING', 'PARTIAL'] },
              orderStatus: { in: ['QUOTE_CONFIRMED', 'PO_RAISED', 'PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED'] },
            },
            _sum: { totalPrice: true },
          }),
          prisma.order.findMany({
            where: { buyerId: auth.userId },
            include: {
              product: {
                select: {
                  name: true,
                  category: true,
                  hsCode: true,
                  originCountry: true,
                  exporter: { select: { name: true, businessName: true, country: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
          prisma.user.findUnique({
            where: { id: auth.userId },
            select: { budgetLimit: true },
          }),
        ]);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyOrders = await prisma.order.findMany({
          where: {
            buyerId: auth.userId,
            createdAt: { gte: sixMonthsAgo },
            paymentStatus: 'PAID',
          },
          select: { totalPrice: true, createdAt: true },
        });

        const spendingByMonth: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString('en-US', { month: 'short' });
          spendingByMonth[key] = 0;
        }

        monthlyOrders.forEach((o) => {
          const key = new Date(o.createdAt).toLocaleString('en-US', { month: 'short' });
          if (spendingByMonth[key] !== undefined) {
            spendingByMonth[key] += o.totalPrice;
          }
        });

        const totalSpentVal = totalSpent._sum.totalPrice ?? 0;
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const currentMonthSpending = spendingByMonth[currentMonth] || 0;

        return NextResponse.json({
          role: 'IMPORTER',
          totalBalance: totalSpentVal,
          pendingPayouts: pendingPayments._sum.totalPrice ?? 0,
          estTaxLiability: totalSpentVal * 0.1, // ~10% estimated customs & tariff reserves
          monthlyBudget: user?.budgetLimit ?? 0,
          currentMonthSpending,
          spendingHistory: Object.entries(spendingByMonth).map(([month, amount]) => ({ month, amount })),
          recentInvoices: recentOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            amount: o.totalPrice,
            currency: o.currency || 'USD',
            status: o.paymentStatus,
            orderStatus: o.orderStatus,
            orderType: o.orderType || 'B2B',
            product: o.product?.name || 'Wholesale Goods',
            category: o.product?.category || 'Wholesale',
            hsCode: o.product?.hsCode || '—',
            quantity: o.quantity || 1,
            seller: o.product?.exporter?.businessName || o.product?.exporter?.name || 'Verified Exporter',
            sellerCountry: o.product?.exporter?.country || o.product?.originCountry || 'India',
            incoterms: 'FOB / CIF',
            paidAt: o.paymentStatus === 'PAID' ? o.updatedAt : null,
            date: o.createdAt,
          })),
        });
      } catch (prismaErr) {
        console.warn('[Finance Importer] Prisma query failed, trying Supabase fallback...', prismaErr);
        const supabase = createAdminClient();
        const { data: orders = [] } = await supabase
          .from('orders')
          .select('id, orderNumber, totalPrice, currency, orderStatus, paymentStatus, orderType, quantity, createdAt, updatedAt, product:products(name, category, hsCode, originCountry, exporter:users!exporterId(name, businessName, country))')
          .eq('buyerId', auth.userId)
          .order('createdAt', { ascending: false });

        const paidList = orders?.filter((o: any) => o.paymentStatus === 'PAID') || [];
        const pendingList = orders?.filter((o: any) =>
          ['PENDING', 'PARTIAL'].includes(o.paymentStatus)
        ) || [];

        const totalSpentVal = paidList.reduce((sum: number, o: any) => sum + (Number(o.totalPrice) || 0), 0);
        const pendingPayouts = pendingList.reduce((sum: number, o: any) => sum + (Number(o.totalPrice) || 0), 0);

        const spendingByMonth: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString('en-US', { month: 'short' });
          spendingByMonth[key] = 0;
        }

        paidList.forEach((o: any) => {
          const key = new Date(o.createdAt).toLocaleString('en-US', { month: 'short' });
          if (spendingByMonth[key] !== undefined) {
            spendingByMonth[key] += Number(o.totalPrice) || 0;
          }
        });

        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const currentMonthSpending = spendingByMonth[currentMonth] || 0;

        return NextResponse.json({
          role: 'IMPORTER',
          totalBalance: totalSpentVal,
          pendingPayouts,
          estTaxLiability: totalSpentVal * 0.1,
          monthlyBudget: 0,
          currentMonthSpending,
          spendingHistory: Object.entries(spendingByMonth).map(([month, amount]) => ({ month, amount })),
          recentInvoices: (orders || []).slice(0, 10).map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            amount: Number(o.totalPrice) || 0,
            currency: o.currency || 'USD',
            status: o.paymentStatus,
            orderStatus: o.orderStatus,
            orderType: o.orderType || 'B2B',
            product: o.product?.name || 'Wholesale Goods',
            category: o.product?.category || 'Wholesale',
            hsCode: o.product?.hsCode || '—',
            quantity: o.quantity || 1,
            seller: o.product?.exporter?.businessName || o.product?.exporter?.name || 'Verified Exporter',
            sellerCountry: o.product?.exporter?.country || o.product?.originCountry || 'India',
            incoterms: 'FOB / CIF',
            paidAt: o.paymentStatus === 'PAID' ? o.updatedAt : null,
            date: o.createdAt,
          })),
        });
      }
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Finance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/dashboard/finance — Update monthly procurement budget
export async function PUT(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth || auth.role !== 'IMPORTER') {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { monthlyBudget } = await request.json();
    if (typeof monthlyBudget !== 'number') {
      return NextResponse.json({ error: 'Invalid budget amount' }, { status: 400 });
    }

    try {
      await prisma.user.update({
        where: { id: auth.userId },
        data: { budgetLimit: monthlyBudget },
      });
    } catch {
      const supabase = createAdminClient();
      await supabase.from('users').update({ budgetLimit: monthlyBudget }).eq('id', auth.userId);
    }

    return NextResponse.json({ message: 'Procurement budget updated successfully' });
  } catch (error) {
    console.error('Budget update error:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}
