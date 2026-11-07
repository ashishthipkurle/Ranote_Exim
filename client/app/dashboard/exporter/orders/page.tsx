export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { OrderStatus } from "@prisma/client";
import OrdersTable from "./OrdersTable";
import { HeaderActions } from "./HeaderActions";

export default async function ExporterOrdersPage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");
  if (auth.role !== "EXPORTER" && auth.role !== "ADMIN") {
    redirect(`/dashboard/${auth.role.toLowerCase()}`);
  }

  const page = parseInt(
    typeof resolvedSearchParams.page === "string"
      ? resolvedSearchParams.page
      : "1"
  );
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = auth.role === "ADMIN" ? { orderStatus: { not: 'CHECKOUT' } } : { sellerId: auth.userId, orderStatus: { not: 'CHECKOUT' } };

  if (resolvedSearchParams.status && resolvedSearchParams.status !== "ALL") {
    const s = Array.isArray(resolvedSearchParams.status)
      ? resolvedSearchParams.status[0]
      : resolvedSearchParams.status;
    let status = (s || "").toUpperCase();
    if (status === "PENDING") status = "QUOTE_REQUESTED";
    if (Object.values(OrderStatus).includes(status as any)) {
      where.orderStatus = status as OrderStatus;
    }
  }

  if (
    typeof resolvedSearchParams.search === "string" &&
    resolvedSearchParams.search
  ) {
    const search = resolvedSearchParams.search;
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { buyer: { name: { contains: search, mode: "insensitive" } } },
      { buyer: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  let orders: any[] = [];
  let transportMethods: any[] = [];
  let total = 0;
  let statusCounts = { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0 };

  try {
    [orders, total, transportMethods] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, category: true, images: true } },
          buyer: { select: { id: true, name: true, businessName: true, country: true, email: true } },
          shipment: { include: { transportMethod: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.transportMethod.findMany({
        where: auth.role === "ADMIN" ? {} : { exporterId: auth.userId },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const baseWhere: any = auth.role === "ADMIN" ? { orderStatus: { not: 'CHECKOUT' as const } } : { sellerId: auth.userId, orderStatus: { not: 'CHECKOUT' as const } };
    const [allCount, pendingCount, procCount, shippedCount, delivCount] =
      await Promise.all([
        prisma.order.count({ where: baseWhere }),
        prisma.order.count({
          where: { ...baseWhere, orderStatus: { in: ["QUOTE_REQUESTED"] } },
        }),
        prisma.order.count({
          where: { ...baseWhere, orderStatus: { in: ["QUOTE_CONFIRMED", "PROCESSING"] } },
        }),
        prisma.order.count({ where: { ...baseWhere, orderStatus: "SHIPPED" } }),
        prisma.order.count({ where: { ...baseWhere, orderStatus: "DELIVERED" } }),
      ]);

    statusCounts = { all: allCount, pending: pendingCount, processing: procCount, shipped: shippedCount, delivered: delivCount };
  } catch (e: any) {
    console.error("Failed to fetch exporter orders:", e);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Trade Fulfilment
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Order Lifecycle
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Orders
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            {statusCounts.all} total orders · {statusCounts.pending} pending · {statusCounts.processing} in progress
          </p>
        </div>
        <HeaderActions />
      </div>

      <div className="space-y-6">
        <OrdersTable orders={orders} counts={statusCounts} transportMethods={transportMethods} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-6">
            <Link
              href={`?${new URLSearchParams({ ...resolvedSearchParams, page: (page - 1).toString() })}`}
              className={`btn-cream-secondary !h-10 !px-4 text-xs ${
                page <= 1 ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2]" /> Previous
            </Link>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <Link
                      key={p}
                      href={`?${new URLSearchParams({ ...resolvedSearchParams, page: p.toString() })}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                        page === p
                          ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] shadow-sm"
                          : "bg-[#F4F4F7] text-[#15130D] hover:bg-[#FBF1D6]"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                }
                if (p === page - 2 || p === page + 2) {
                  return <span key={p} className="text-[#6B6A66] px-1 text-xs">...</span>;
                }
                return null;
              })}
            </div>
            <Link
              href={`?${new URLSearchParams({ ...resolvedSearchParams, page: (page + 1).toString() })}`}
              className={`btn-cream-secondary !h-10 !px-4 text-xs ${
                page >= totalPages ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              Next <ArrowRight className="w-4 h-4 stroke-[2]" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
