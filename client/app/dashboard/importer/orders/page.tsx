import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { formatCurrency } from "@/lib/api-utils";
import OrdersList from "@/components/dashboard/OrdersList";

export const dynamic = 'force-dynamic';

export default async function ImporterOrdersPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");
  if (auth.role !== "IMPORTER" && auth.role !== "ADMIN") {
    redirect(`/dashboard/${auth.role.toLowerCase()}`);
  }

  let orders: any[] = [];
  let totalSpent = 0;
  
  try {
    orders = await prisma.order.findMany({
      where: { buyerId: auth.userId },
      include: {
        product: {
          include: { exporter: { select: { id: true, name: true, businessName: true, country: true } } },
        },
        seller: { select: { id: true, name: true, businessName: true, country: true } },
        shipment: { include: { statusHistory: { orderBy: { createdAt: 'desc' } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const paidOrders = await prisma.order.findMany({
      where: { 
        buyerId: auth.userId,
        paymentStatus: { in: ["PAID", "PARTIAL"] }
      },
      select: { totalPrice: true }
    });
    
    totalSpent = paidOrders.reduce((acc, o) => acc + o.totalPrice, 0);
  } catch (e) {
    console.warn("Failed to fetch orders (DB may be unavailable):", e);
  }

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Procurement Log
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              All Orders
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            My Orders
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            {orders.length} {orders.length === 1 ? "order" : "orders"} · {formatCurrency(totalSpent)} total spent
          </p>
        </div>

        <Link
          href="/products"
          className="btn-gold-primary"
        >
          <ShoppingCart className="w-4 h-4 stroke-[2]" />
          Browse Products
        </Link>
      </div>

      <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
        <OrdersList initialOrders={orders} />
      </div>
    </div>
  );
}
