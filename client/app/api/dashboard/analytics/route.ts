import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/analytics — Analytics telemetry for B2B Export-Import
export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await getApiAuthContext(request);
    if (authError || !auth) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role === 'EXPORTER' || auth.role === 'ADMIN') {
      const isOwner = auth.role !== 'ADMIN';
      const orderFilter = isOwner
        ? {
            OR: [
              { sellerId: auth.userId },
              { product: { exporterId: auth.userId } },
            ],
          }
        : {};

      try {
        const [totalProducts, allOrders, allShipments, quoteCount] = await Promise.all([
          prisma.product.count({
            where: isOwner ? { exporterId: auth.userId, deletedAt: null } : { deletedAt: null },
          }),
          prisma.order.findMany({
            where: orderFilter,
            select: {
              id: true,
              totalPrice: true,
              orderStatus: true,
              paymentStatus: true,
              createdAt: true,
              product: { select: { id: true, name: true, category: true, hsCode: true } },
              buyer: { select: { id: true, name: true, businessName: true, country: true } },
            },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.shipment.findMany({
            where: isOwner ? { order: orderFilter } : {},
            select: { id: true, currentStatus: true, destination: true, createdAt: true },
          }),
          prisma.quotationRequest.count().catch(() => 0),
        ]);

        const totalOrders = allOrders.length;
        const paidOrdersList = allOrders.filter((o) => ['PAID', 'PARTIAL'].includes(o.paymentStatus));
        const paidOrders = paidOrdersList.length;
        const totalRevenue = paidOrdersList.reduce((acc, o) => acc + o.totalPrice, 0);

        // Category breakdown
        const categoryMap = new Map<string, { revenue: number; orderCount: number }>();
        for (const o of allOrders) {
          const cat = o.product?.category || 'OTHER';
          const prev = categoryMap.get(cat) || { revenue: 0, orderCount: 0 };
          const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? o.totalPrice : 0;
          categoryMap.set(cat, {
            revenue: prev.revenue + val,
            orderCount: prev.orderCount + 1,
          });
        }
        const revenueByCategory = Array.from(categoryMap.entries())
          .map(([category, v]) => ({ category, revenue: v.revenue, orderCount: v.orderCount }))
          .sort((a, b) => b.revenue - a.revenue);

        // Monthly breakdown (last 6 months)
        const monthlyMap = new Map<string, { revenue: number; orderCount: number }>();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toISOString().slice(0, 7); // YYYY-MM
          monthlyMap.set(key, { revenue: 0, orderCount: 0 });
        }
        for (const o of allOrders) {
          const key = o.createdAt.toISOString().slice(0, 7);
          if (monthlyMap.has(key)) {
            const prev = monthlyMap.get(key)!;
            const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? o.totalPrice : 0;
            monthlyMap.set(key, {
              revenue: prev.revenue + val,
              orderCount: prev.orderCount + 1,
            });
          }
        }
        const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, v]) => ({
          month: `${month}-01`,
          revenue: v.revenue,
          orderCount: v.orderCount,
        }));

        // Geographic breakdown
        const geoMap = new Map<string, { orderCount: number; revenue: number }>();
        for (const o of allOrders) {
          const country = o.buyer?.country || 'International';
          const prev = geoMap.get(country) || { orderCount: 0, revenue: 0 };
          const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? o.totalPrice : 0;
          geoMap.set(country, {
            orderCount: prev.orderCount + 1,
            revenue: prev.revenue + val,
          });
        }
        const geographicData = Array.from(geoMap.entries())
          .map(([country, v]) => ({ country, ...v }))
          .sort((a, b) => b.revenue - a.revenue);

        // RFQ / Quote Conversion Rate: Quotations/Orders converted to confirmed PO or Paid
        const quoteBase = Math.max(totalOrders, quoteCount, 1);
        const conversionRate = totalOrders > 0
          ? `${Math.min(100, ((paidOrders / quoteBase) * 100)).toFixed(1)}%`
          : '0.0%';

        return NextResponse.json({
          role: 'EXPORTER',
          totalProducts,
          totalOrders,
          paidOrders,
          totalRevenue,
          conversionRate,
          activeShipments: allShipments.filter((s) => ['PREPARING', 'IN_TRANSIT', 'CUSTOMS'].includes(s.currentStatus)).length,
          revenueByCategory,
          monthlyRevenue,
          geographicData,
        });
      } catch (prismaErr) {
        console.warn('[Analytics Exporter] Prisma failed, using Supabase fallback...', prismaErr);
        const supabase = createAdminClient();
        const [pRes, oRes, sRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).is('deletedAt', null),
          supabase
            .from('orders')
            .select('id, totalPrice, orderStatus, paymentStatus, createdAt, product:products(category), buyer:users!buyerId(country)')
            .order('createdAt', { ascending: true }),
          supabase.from('shipments').select('id, currentStatus'),
        ]);

        const orders = oRes.data || [];
        const totalProducts = pRes.count || 0;
        const totalOrders = orders.length;
        const paidOrdersList = orders.filter((o: any) => ['PAID', 'PARTIAL'].includes(o.paymentStatus));
        const paidOrders = paidOrdersList.length;
        const totalRevenue = paidOrdersList.reduce((acc: number, o: any) => acc + (Number(o.totalPrice) || 0), 0);

        const categoryMap = new Map<string, { revenue: number; orderCount: number }>();
        orders.forEach((o: any) => {
          const cat = o.product?.category || 'OTHER';
          const prev = categoryMap.get(cat) || { revenue: 0, orderCount: 0 };
          const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? Number(o.totalPrice) || 0 : 0;
          categoryMap.set(cat, { revenue: prev.revenue + val, orderCount: prev.orderCount + 1 });
        });

        const conversionRate = totalOrders > 0 ? `${((paidOrders / totalOrders) * 100).toFixed(1)}%` : '0.0%';

        return NextResponse.json({
          role: 'EXPORTER',
          totalProducts,
          totalOrders,
          paidOrders,
          totalRevenue,
          conversionRate,
          activeShipments: (sRes.data || []).filter((s: any) => ['PREPARING', 'IN_TRANSIT', 'CUSTOMS'].includes(s.currentStatus)).length,
          revenueByCategory: Array.from(categoryMap.entries()).map(([category, v]) => ({ category, ...v })),
          monthlyRevenue: [],
          geographicData: [],
        });
      }
    }

    if (auth.role === 'IMPORTER' || auth.role === 'ADMIN') {
      try {
        const [
          totalOrders,
          allShipments,
          totalSpentAgg,
          importerOrders,
        ] = await Promise.all([
          prisma.order.count({ where: { buyerId: auth.userId } }),
          prisma.shipment.findMany({
            where: { order: { buyerId: auth.userId } },
            select: { id: true, currentStatus: true, origin: true, destination: true },
          }),
          prisma.order.aggregate({
            where: { buyerId: auth.userId, paymentStatus: { in: ['PAID', 'PARTIAL'] } },
            _sum: { totalPrice: true },
          }),
          prisma.order.findMany({
            where: { buyerId: auth.userId },
            select: {
              id: true,
              totalPrice: true,
              paymentStatus: true,
              orderStatus: true,
              createdAt: true,
              product: {
                select: {
                  name: true,
                  category: true,
                  originCountry: true,
                  exporter: { select: { id: true, name: true, businessName: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          }),
        ]);

        const activeShipments = allShipments.filter((s) =>
          ['PREPARING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.currentStatus)
        ).length;
        const customsHolds = allShipments.filter((s) => s.currentStatus === 'CUSTOMS').length;

        // Unique sourcing regions
        const regionsSet = new Set<string>();
        importerOrders.forEach((o) => {
          if (o.product?.originCountry) regionsSet.add(o.product.originCountry);
        });

        // Monthly spend (last 6 months)
        const monthlyMap = new Map<string, { spent: number; orderCount: number }>();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toISOString().slice(0, 7);
          monthlyMap.set(key, { spent: 0, orderCount: 0 });
        }

        importerOrders.forEach((o) => {
          const key = o.createdAt.toISOString().slice(0, 7);
          if (monthlyMap.has(key)) {
            const prev = monthlyMap.get(key)!;
            const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? o.totalPrice : 0;
            monthlyMap.set(key, {
              spent: prev.spent + val,
              orderCount: prev.orderCount + 1,
            });
          }
        });

        const monthlySpend = Array.from(monthlyMap.entries()).map(([month, v]) => ({
          month: `${month}-01`,
          spent: v.spent,
          orderCount: v.orderCount,
        }));

        // Top Exporter Partners
        const supplierMap = new Map<string, { spent: number; orderCount: number }>();
        importerOrders.forEach((o) => {
          const supName = o.product?.exporter?.businessName || o.product?.exporter?.name || 'Verified Supplier';
          const prev = supplierMap.get(supName) || { spent: 0, orderCount: 0 };
          const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? o.totalPrice : 0;
          supplierMap.set(supName, {
            spent: prev.spent + val,
            orderCount: prev.orderCount + 1,
          });
        });

        const supplierBreakdown = Array.from(supplierMap.entries())
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 5);

        // Spending by category
        const catMap = new Map<string, { spent: number; orderCount: number }>();
        importerOrders.forEach((o) => {
          const cat = o.product?.category || 'OTHER';
          const prev = catMap.get(cat) || { spent: 0, orderCount: 0 };
          const val = ['PAID', 'PARTIAL'].includes(o.paymentStatus) ? o.totalPrice : 0;
          catMap.set(cat, {
            spent: prev.spent + val,
            orderCount: prev.orderCount + 1,
          });
        });

        const categorySpending = Array.from(catMap.entries())
          .map(([category, v]) => ({ category, ...v }))
          .sort((a, b) => b.spent - a.spent);

        return NextResponse.json({
          role: 'IMPORTER',
          totalOrders,
          totalShipments: allShipments.length,
          activeShipments,
          customsHolds,
          totalSpent: totalSpentAgg._sum.totalPrice ?? 0,
          activeRegions: Math.max(regionsSet.size, 1),
          monthlySpend,
          supplierBreakdown,
          categorySpending,
        });
      } catch (prismaErr) {
        console.warn('[Analytics Importer] Prisma failed, using Supabase fallback...', prismaErr);
        const supabase = createAdminClient();
        const [oRes, sRes] = await Promise.all([
          supabase
            .from('orders')
            .select('id, totalPrice, orderStatus, paymentStatus, createdAt, product:products(name, category, originCountry, exporter:users!exporterId(name, businessName))')
            .eq('buyerId', auth.userId),
          supabase.from('shipments').select('id, currentStatus'),
        ]);

        const orders = oRes.data || [];
        const paidOrders = orders.filter((o: any) => ['PAID', 'PARTIAL'].includes(o.paymentStatus));
        const totalSpent = paidOrders.reduce((acc: number, o: any) => acc + (Number(o.totalPrice) || 0), 0);
        const allShipments = sRes.data || [];

        return NextResponse.json({
          role: 'IMPORTER',
          totalOrders: orders.length,
          totalShipments: allShipments.length,
          activeShipments: allShipments.filter((s: any) => ['PREPARING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.currentStatus)).length,
          customsHolds: allShipments.filter((s: any) => s.currentStatus === 'CUSTOMS').length,
          totalSpent,
          activeRegions: 1,
          monthlySpend: [],
          supplierBreakdown: [],
          categorySpending: [],
        });
      }
    }

    return NextResponse.json({ error: 'Invalid role for analytics' }, { status: 400 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
