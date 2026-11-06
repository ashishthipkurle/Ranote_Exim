import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/analytics — Analytics data for the authenticated user
export async function GET(request: NextRequest) {
 try {
 const { auth, error: authError } = await getApiAuthContext(request);
 if (authError || !auth) {
 return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 if (auth.role === 'EXPORTER' || auth.role === 'ADMIN') {
  const isOwner = auth.role !== 'ADMIN';
  const productWhere = isOwner ? { exporterId: auth.userId } : {};
  const orderWhere = isOwner ? { product: { exporterId: auth.userId } } : {};
  const paidOrderWhere = isOwner
    ? { product: { exporterId: auth.userId }, paymentStatus: { in: ['PAID', 'PARTIAL'] } }
    : { paymentStatus: { in: ['PAID', 'PARTIAL'] } };

  // Get products count, orders received, and category breakdown
  const [totalProducts, totalOrders, paidOrders, revenueByCategory, monthlyRevenue] = await Promise.all([
    prisma.product.count({ where: productWhere }),
    prisma.order.count({ where: orderWhere }),
    prisma.order.count({ where: paidOrderWhere }),
    // Revenue grouped by product category
    isOwner
      ? (prisma.$queryRaw`
          SELECT p.category, COALESCE(SUM(o."totalPrice"), 0) as revenue, COUNT(o.id) as "orderCount"
          FROM products p
          LEFT JOIN orders o ON o."productId" = p.id AND o."paymentStatus" IN ('PAID', 'PARTIAL')
          WHERE p."exporterId" = ${auth.userId}
          GROUP BY p.category
          ORDER BY revenue DESC
        ` as Promise<Array<{ category: string; revenue: number; orderCount: number }>>)
      : (prisma.$queryRaw`
          SELECT p.category, COALESCE(SUM(o."totalPrice"), 0) as revenue, COUNT(o.id) as "orderCount"
          FROM products p
          LEFT JOIN orders o ON o."productId" = p.id AND o."paymentStatus" IN ('PAID', 'PARTIAL')
          GROUP BY p.category
          ORDER BY revenue DESC
        ` as Promise<Array<{ category: string; revenue: number; orderCount: number }>>),
    // Monthly revenue for last 6 months
    isOwner
      ? (prisma.$queryRaw`
          SELECT 
          DATE_TRUNC('month', o."createdAt") as month,
          COALESCE(SUM(o."totalPrice"), 0) as revenue,
          COUNT(o.id) as "orderCount"
          FROM orders o
          JOIN products p ON o."productId" = p.id
          WHERE p."exporterId" = ${auth.userId}
          AND o."paymentStatus" IN ('PAID', 'PARTIAL')
          AND o."createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', o."createdAt")
          ORDER BY month ASC
        ` as Promise<Array<{ month: Date; revenue: number; orderCount: number }>>)
      : (prisma.$queryRaw`
          SELECT 
          DATE_TRUNC('month', o."createdAt") as month,
          COALESCE(SUM(o."totalPrice"), 0) as revenue,
          COUNT(o.id) as "orderCount"
          FROM orders o
          JOIN products p ON o."productId" = p.id
          WHERE o."paymentStatus" IN ('PAID', 'PARTIAL')
          AND o."createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', o."createdAt")
          ORDER BY month ASC
        ` as Promise<Array<{ month: Date; revenue: number; orderCount: number }>>),
  ]);

 const conversionRate = totalProducts > 0 ? ((paidOrders / totalProducts) * 100).toFixed(1) : '0.0';

 return NextResponse.json({
 role: 'EXPORTER',
 totalProducts,
 totalOrders,
 paidOrders,
 conversionRate: `${conversionRate}%`,
 revenueByCategory: (revenueByCategory || []).map((r) => ({
 category: r.category,
 revenue: Number(r.revenue),
 orderCount: Number(r.orderCount),
 })),
 monthlyRevenue: (monthlyRevenue || []).map((m) => ({
 month: m.month,
 revenue: Number(m.revenue),
 orderCount: Number(m.orderCount),
 })),
 });
 }

 if (auth.role === 'IMPORTER' || auth.role === 'ADMIN') {
 const [
 totalOrders,
 totalShipments,
 activeShipments,
 customsHolds,
 totalSpent,
 uniqueRegions,
 monthlySpend,
 supplierBreakdown,
 categorySpending,
 ] = await Promise.all([
 prisma.order.count({ where: { buyerId: auth.userId } }),
 prisma.shipment.count({ where: { order: { buyerId: auth.userId } } }),
 prisma.shipment.count({
 where: {
 order: { buyerId: auth.userId },
 currentStatus: { in: ['PREPARING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
 },
 }),
 prisma.shipment.count({
 where: {
 order: { buyerId: auth.userId },
 currentStatus: 'CUSTOMS',
 },
 }),
 prisma.order.aggregate({
 where: { buyerId: auth.userId, paymentStatus: { in: ['PAID', 'PARTIAL'] } },
 _sum: { totalPrice: true },
 }),
 // Unique origin countries from products ordered
 prisma.$queryRaw`
 SELECT COUNT(DISTINCT p."originCountry") as count
 FROM orders o
 JOIN products p ON o."productId" = p.id
 WHERE o."buyerId" = ${auth.userId}
 ` as Promise<Array<{ count: number }>>,
 // Monthly spending for last 6 months
 prisma.$queryRaw`
 SELECT 
 DATE_TRUNC('month', o."createdAt") as month,
 COALESCE(SUM(o."totalPrice"), 0) as spent,
 COUNT(o.id) as "orderCount"
 FROM orders o
 WHERE o."buyerId" = ${auth.userId}
 AND o."paymentStatus" IN ('PAID', 'PARTIAL')
 AND o."createdAt" >= NOW() - INTERVAL '6 months'
 GROUP BY DATE_TRUNC('month', o."createdAt")
 ORDER BY month ASC
 ` as Promise<Array<{ month: Date; spent: number; orderCount: number }>>,
 // Supplier breakdown (who they buy from most)
 prisma.$queryRaw`
 SELECT 
 u.name as supplier,
 u."businessName",
 COALESCE(SUM(o."totalPrice"), 0) as spent,
 COUNT(o.id) as "orderCount"
 FROM orders o
 JOIN products p ON o."productId" = p.id
 JOIN users u ON p."exporterId" = u.id
 WHERE o."buyerId" = ${auth.userId}
 AND o."paymentStatus" IN ('PAID', 'PARTIAL')
 GROUP BY u.id, u.name, u."businessName"
 ORDER BY spent DESC
 LIMIT 5
 ` as Promise<Array<{ supplier: string; businessName: string | null; spent: number; orderCount: number }>>,
 // Spending by category
 prisma.$queryRaw`
 SELECT 
 p.category,
 COALESCE(SUM(o."totalPrice"), 0) as spent,
 COUNT(o.id) as "orderCount"
 FROM orders o
 JOIN products p ON o."productId" = p.id
 WHERE o."buyerId" = ${auth.userId}
 AND o."paymentStatus" IN ('PAID', 'PARTIAL')
 GROUP BY p.category
 ORDER BY spent DESC
 ` as Promise<Array<{ category: string; spent: number; orderCount: number }>>,
 ]);

 return NextResponse.json({
 role: 'IMPORTER',
 totalOrders,
 totalShipments,
 activeShipments,
 customsHolds,
 totalSpent: totalSpent._sum.totalPrice ?? 0,
 activeRegions: Number(uniqueRegions?.[0]?.count ?? 0),
 monthlySpend: (monthlySpend || []).map((m) => ({
 month: m.month,
 spent: Number(m.spent),
 orderCount: Number(m.orderCount),
 })),
 supplierBreakdown: (supplierBreakdown || []).map((s) => ({
 name: s.businessName || s.supplier,
 spent: Number(s.spent),
 orderCount: Number(s.orderCount),
 })),
 categorySpending: (categorySpending || []).map((c) => ({
 category: c.category,
 spent: Number(c.spent),
 orderCount: Number(c.orderCount),
 })),
 });
 }

 return NextResponse.json({ error: 'Invalid role for analytics' }, { status: 400 });
 } catch (error) {
 console.error('Analytics error:', error);
 return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
 }
}
