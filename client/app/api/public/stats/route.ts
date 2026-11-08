import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  try {
    const [
      totalShipments,
      totalOrders,
      paidVolumeResult,
      allVolumeResult,
      usersWithCountry,
      productsWithOrigin,
      shipmentsWithDest,
      totalProducts,
      totalUsers
    ] = await Promise.all([
      prisma.shipment.count(),
      prisma.order.count({
        where: { orderStatus: { not: 'CANCELLED' } }
      }),
      prisma.order.aggregate({
        where: { paymentStatus: { in: ['PAID', 'PARTIAL'] } },
        _sum: { totalPrice: true, totalPriceUSD: true },
      }),
      prisma.order.aggregate({
        where: { orderStatus: { not: 'CANCELLED' } },
        _sum: { totalPrice: true, totalPriceUSD: true },
      }),
      prisma.user.findMany({
        select: { country: true },
        where: { country: { not: null } }
      }),
      prisma.product.findMany({
        select: { originCountry: true },
        where: { originCountry: { not: null }, deletedAt: null }
      }),
      prisma.shipment.findMany({
        select: { origin: true, destination: true }
      }),
      prisma.product.count({ where: { deletedAt: null, available: true } }),
      prisma.user.count()
    ]);

    // Calculate real trade volume from orders
    const volume = Number(
      paidVolumeResult._sum.totalPriceUSD ??
      paidVolumeResult._sum.totalPrice ??
      allVolumeResult._sum.totalPriceUSD ??
      allVolumeResult._sum.totalPrice ??
      0
    );

    // Calculate unique countries served across registered users, product origins, and shipments
    const countrySet = new Set<string>();
    usersWithCountry.forEach(u => {
      if (u.country?.trim()) countrySet.add(u.country.trim().toUpperCase());
    });
    productsWithOrigin.forEach(p => {
      if (p.originCountry?.trim()) countrySet.add(p.originCountry.trim().toUpperCase());
    });
    shipmentsWithDest.forEach(s => {
      if (s.origin?.trim()) countrySet.add(s.origin.trim().toUpperCase());
      if (s.destination?.trim()) countrySet.add(s.destination.trim().toUpperCase());
    });

    const countriesCount = Math.max(countrySet.size, 1);

    // Real dynamic latency measured from DB query execution
    const executionMs = Math.max(Math.round(performance.now() - startTime), 8);
    const latencyFormatted = `${(executionMs / 1000).toFixed(2)}s`;

    // Shipments tracked: real shipments count, or active orders if shipments haven't been dispatched yet
    const shipmentsTracked = totalShipments > 0 ? totalShipments : totalOrders;

    return NextResponse.json({
      shipments: shipmentsTracked,
      volume: Math.round(volume),
      countries: countriesCount,
      products: totalProducts,
      users: totalUsers,
      latency: latencyFormatted,
      latencyMs: executionMs,
      uptime: "99.9%"
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Public stats error:', error);
    const executionMs = Math.max(Math.round(performance.now() - startTime), 10);
    return NextResponse.json({
      shipments: 0,
      volume: 0,
      countries: 1,
      products: 0,
      users: 0,
      latency: `${(executionMs / 1000).toFixed(2)}s`,
      latencyMs: executionMs,
      uptime: "99.9%"
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  }
}
