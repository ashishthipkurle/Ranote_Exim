import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/finance — Financial summary for the authenticated user
export async function GET(request: NextRequest) {
 try {
 const { auth, error: authError } = await getApiAuthContext(request);
 if (authError || !auth) {
 return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 if (auth.role === 'EXPORTER') {
 const [paidRevenue, pendingRevenue, recentOrders, lastPaidOrder] = await Promise.all([
 prisma.order.aggregate({
 where: { product: { exporterId: auth.userId }, paymentStatus: 'PAID' },
 _sum: { totalPrice: true },
 }),
 prisma.order.aggregate({
 where: {
 product: { exporterId: auth.userId },
 paymentStatus: { in: ['PENDING', 'PARTIAL'] },
 orderStatus: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
 },
 _sum: { totalPrice: true },
 }),
 prisma.order.findMany({
 where: { product: { exporterId: auth.userId } },
 include: {
 product: { select: { name: true } },
 buyer: { select: { name: true, businessName: true } },
 },
 orderBy: { createdAt: 'desc' },
 take: 5,
 }),
 prisma.order.findFirst({
 where: { product: { exporterId: auth.userId }, paymentStatus: 'PAID' },
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
 status: o.paymentStatus,
 orderStatus: o.orderStatus,
 product: o.product.name,
 buyer: o.buyer?.businessName || o.buyer?.name || 'Buyer',
 date: o.createdAt,
 })),
 });
 }

 if (auth.role === 'IMPORTER' || auth.role === 'ADMIN') {
 const [totalSpent, pendingPayments, recentOrders, user] = await Promise.all([
 prisma.order.aggregate({
 where: { buyerId: auth.userId, paymentStatus: 'PAID' },
 _sum: { totalPrice: true },
 }),
 prisma.order.aggregate({
 where: { buyerId: auth.userId, paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
 _sum: { totalPrice: true },
 }),
 prisma.order.findMany({
 where: { buyerId: auth.userId },
 include: {
 product: {
 select: {
 name: true,
 exporter: { select: { name: true, businessName: true } },
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

 // Calculate monthly spending for the last 6 months
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
 for (let i = 0; i < 6; i++) {
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
 estTaxLiability: totalSpentVal * 0.1,
 monthlyBudget: user?.budgetLimit ?? 0,
 currentMonthSpending,
 spendingHistory: Object.entries(spendingByMonth).reverse().map(([month, amount]) => ({ month, amount })),
 recentInvoices: recentOrders.map((o) => ({
 id: o.id,
 orderNumber: o.orderNumber,
 amount: o.totalPrice,
 status: o.paymentStatus,
 orderStatus: o.orderStatus,
 product: o.product.name,
 seller: o.product.exporter.businessName || o.product.exporter.name,
 date: o.createdAt,
 })),
 });
 }

 return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
 } catch (error) {
 console.error('Finance error:', error);
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}

// PUT /api/dashboard/finance — Update monthly budget
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

 await prisma.user.update({
 where: { id: auth.userId },
 data: { budgetLimit: monthlyBudget },
 });

 return NextResponse.json({ message: 'Budget updated successfully' });
 } catch (error) {
 console.error('Budget update error:', error);
 return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
 }
}
