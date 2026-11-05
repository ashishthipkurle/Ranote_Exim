import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiAuthContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
 try {
 const { auth, error: authError } = await getApiAuthContext(req);
 if (authError || !auth) {
 return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 if (auth.role !== 'EXPORTER' && auth.role !== 'ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 // Build query - only active shipments for this exporter
 const where: any = {
 currentStatus: { in: ['IN_TRANSIT', 'CUSTOMS'] },
 };

 if (auth.role === 'EXPORTER') {
 where.order = { sellerId: auth.userId };
 }

 const shipments = await prisma.shipment.findMany({
 where,
 include: {
 statusHistory: {
 orderBy: { createdAt: 'desc' },
 take: 1,
 },
 order: {
 include: {
 product: { select: { name: true, category: true } },
 buyer: { select: { businessName: true, name: true, country: true } }
 }
 }
 }
 });

 // Map to the format our frontend expects
 const routes = shipments.map((s: any) => {
 const latestEvent = s.statusHistory?.[0];
 const buyerName = s.order?.buyer?.businessName || s.order?.buyer?.name || 'Unknown';
 return {
 id: s.id,
 fromPort: s.origin || 'MUMBAI',
 toPort: s.destination || 'ROTTERDAM',
 type: 'ocean' as const,
 status: 'active',
 vessel: s.courierId || s.trackingNumber || 'Unknown Vessel',
 cargo: s.order?.product?.name || 'General Cargo',
 progress: latestEvent?.latitude ? undefined : 0.35,
 lat: latestEvent?.latitude ?? undefined,
 lng: latestEvent?.longitude ?? undefined,
 lastLocation: latestEvent?.location || undefined,
 importer: buyerName,
 };
 });

 return NextResponse.json({ routes, total: routes.length });
 } catch (error: any) {
 console.error('Active shipments error:', error?.message || error);
 return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
 }
}
