import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { createAdminClient } from "@/lib/supabase/server";
import ExporterAnalyticsDashboard from "./ExporterAnalyticsDashboard";

// ─── Server-side data fetching for Exporter B2B Analytics ────────────────────
// Real-time metrics fetched from database with Supabase fallback
export const dynamic = "force-dynamic";

export default async function ExporterAnalyticsPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");
  if (auth.role !== "EXPORTER" && auth.role !== "ADMIN") {
    redirect(`/dashboard/${auth.role.toLowerCase()}`);
  }

  const exporterId = auth.userId;
  const isOwner = auth.role !== "ADMIN";
  const orderFilter = isOwner
    ? {
        OR: [
          { sellerId: exporterId },
          { product: { exporterId } },
        ],
      }
    : {};

  // ── Fetch orders ───────────────────────────────────────────────────────────
  let orders: {
    id: string;
    orderStatus: string;
    paymentStatus: string;
    totalPrice: number;
    quantity: number;
    createdAt: Date;
    product: { id: string; name: string; category: string; price: number };
    buyer: { country: string | null; businessName: string | null; name: string | null };
  }[] = [];

  try {
    orders = await prisma.order.findMany({
      where: orderFilter,
      select: {
        id: true,
        orderStatus: true,
        paymentStatus: true,
        totalPrice: true,
        quantity: true,
        createdAt: true,
        product: { select: { id: true, name: true, category: true, price: true } },
        buyer: { select: { country: true, businessName: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.warn("[Analytics] Prisma orders failed, trying Supabase fallback:", e);
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from("orders")
        .select("id, orderStatus, paymentStatus, totalPrice, quantity, createdAt, product:products(id, name, category, price), buyer:users!buyerId(country, businessName, name)")
        .order("createdAt", { ascending: true });

      if (isOwner) {
        query = query.or(`sellerId.eq.${exporterId}`);
      }

      const { data } = await query;
      if (data) {
        orders = data.map((o: any) => ({
          id: o.id,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          totalPrice: Number(o.totalPrice) || 0,
          quantity: o.quantity || 1,
          createdAt: new Date(o.createdAt),
          product: {
            id: o.product?.id || "",
            name: o.product?.name || "Wholesale Item",
            category: o.product?.category || "OTHER",
            price: Number(o.product?.price) || 0,
          },
          buyer: {
            country: o.buyer?.country || "International",
            businessName: o.buyer?.businessName || null,
            name: o.buyer?.name || "Trade Buyer",
          },
        }));
      }
    } catch (fbErr) {
      console.error("[Analytics] Supabase fallback orders error:", fbErr);
    }
  }

  // ── Fetch products ─────────────────────────────────────────────────────────
  let products: { id: string; name: string; category: string; available: boolean; price: number }[] = [];
  try {
    products = await prisma.product.findMany({
      where: isOwner ? { exporterId, deletedAt: null } : { deletedAt: null },
      select: { id: true, name: true, category: true, available: true, price: true },
    });
  } catch (e) {
    console.warn("[Analytics] Prisma products failed, trying Supabase fallback:", e);
    try {
      const supabase = createAdminClient();
      let query = supabase.from("products").select("id, name, category, available, price").is("deletedAt", null);
      if (isOwner) query = query.eq("exporterId", exporterId);
      const { data } = await query;
      if (data) {
        products = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          available: p.available ?? true,
          price: Number(p.price) || 0,
        }));
      }
    } catch {}
  }

  // ── Fetch shipments ────────────────────────────────────────────────────────
  let shipments: { currentStatus: string; createdAt: Date }[] = [];
  try {
    shipments = await prisma.shipment.findMany({
      where: isOwner ? { order: orderFilter } : {},
      select: { currentStatus: true, createdAt: true },
    });
  } catch (e) {
    console.warn("[Analytics] Prisma shipments failed, trying Supabase fallback:", e);
    try {
      const supabase = createAdminClient();
      const { data } = await supabase.from("shipments").select("currentStatus, createdAt");
      if (data) {
        shipments = data.map((s: any) => ({
          currentStatus: s.currentStatus,
          createdAt: new Date(s.createdAt),
        }));
      }
    } catch {}
  }

  // ── Fetch real RFQ Quotation Requests ──────────────────────────────────────
  let totalQuotes = 0;
  try {
    totalQuotes = await prisma.quotationRequest.count();
  } catch {}

  // ── Derive: Monthly revenue & contract volume ──────────────────────────────
  const monthlyMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    const existing = monthlyMap.get(key) ?? { revenue: 0, orderCount: 0 };
    const paidVal = ["PAID", "PARTIAL"].includes(o.paymentStatus) ? o.totalPrice : 0;
    monthlyMap.set(key, {
      revenue: existing.revenue + paidVal,
      orderCount: existing.orderCount + 1,
    });
  }
  const monthlyRevenue = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  // ── Derive: Revenue by export category ─────────────────────────────────────
  const categoryMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const o of orders) {
    const cat = o.product.category;
    const existing = categoryMap.get(cat) ?? { revenue: 0, orderCount: 0 };
    const paidVal = ["PAID", "PARTIAL"].includes(o.paymentStatus) ? o.totalPrice : 0;
    categoryMap.set(cat, {
      revenue: existing.revenue + paidVal,
      orderCount: existing.orderCount + 1,
    });
  }
  const revenueByCategory = Array.from(categoryMap.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Derive: Top products ───────────────────────────────────────────────────
  const productMap = new Map<string, { name: string; category: string; revenue: number; orderCount: number }>();
  for (const o of orders) {
    const existing = productMap.get(o.product.id) ?? {
      name: o.product.name,
      category: o.product.category,
      revenue: 0,
      orderCount: 0,
    };
    const paidVal = ["PAID", "PARTIAL"].includes(o.paymentStatus) ? o.totalPrice : 0;
    productMap.set(o.product.id, {
      ...existing,
      revenue: existing.revenue + paidVal,
      orderCount: existing.orderCount + 1,
    });
  }
  const topProducts = Array.from(productMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Derive: Geographic trade corridors ─────────────────────────────────────
  const geoMap = new Map<string, { orderCount: number; revenue: number }>();
  for (const o of orders) {
    const country = o.buyer.country ?? "International Trade";
    const existing = geoMap.get(country) ?? { orderCount: 0, revenue: 0 };
    const paidVal = ["PAID", "PARTIAL"].includes(o.paymentStatus) ? o.totalPrice : 0;
    geoMap.set(country, {
      orderCount: existing.orderCount + 1,
      revenue: existing.revenue + paidVal,
    });
  }
  const geographicData = Array.from(geoMap.entries())
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Derive: Payment breakdown ──────────────────────────────────────────────
  const paymentBreakdown = {
    PAID: orders.filter((o) => o.paymentStatus === "PAID").length,
    PENDING: orders.filter((o) => o.paymentStatus === "PENDING" || o.paymentStatus === "PARTIAL").length,
    FAILED: orders.filter((o) => o.paymentStatus === "FAILED").length,
    REFUNDED: orders.filter((o) => o.paymentStatus === "REFUNDED").length,
  };
  const paidRevenue = orders
    .filter((o) => ["PAID", "PARTIAL"].includes(o.paymentStatus))
    .reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingRevenue = orders
    .filter((o) => o.paymentStatus === "PENDING")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  // ── Derive: B2B Order pipeline breakdown ───────────────────────────────────
  const orderStatusBreakdown = {
    PENDING: orders.filter((o) => o.orderStatus === "QUOTE_REQUESTED" || o.orderStatus === "CART" || o.orderStatus === "CHECKOUT").length,
    CONFIRMED: orders.filter((o) => o.orderStatus === "QUOTE_CONFIRMED" || o.orderStatus === "PO_RAISED").length,
    PROCESSING: orders.filter((o) => o.orderStatus === "PAYMENT_CONFIRMED" || o.orderStatus === "PROCESSING").length,
    SHIPPED: orders.filter((o) => o.orderStatus === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.orderStatus === "DELIVERED" || o.orderStatus === "COMPLETED").length,
    CANCELLED: orders.filter((o) => o.orderStatus === "CANCELLED" || o.orderStatus === "PAYMENT_FAILED").length,
  };

  // ── Derive: KPIs (B2B Wholesale / Trade) ────────────────────────────────────
  const totalRevenue = paidRevenue;
  const totalOrders = orders.length;
  const paidOrders = paymentBreakdown.PAID;
  const avgOrderValue = totalOrders > 0 ? (orders.reduce((sum, o) => sum + o.totalPrice, 0) / totalOrders) : 0;

  // Quote-to-Contract Conversion Rate
  const quoteBase = Math.max(totalOrders, totalQuotes, 1);
  const confirmedCount = orderStatusBreakdown.CONFIRMED + orderStatusBreakdown.PROCESSING + orderStatusBreakdown.SHIPPED + orderStatusBreakdown.DELIVERED + paidOrders;
  const conversionRate = totalOrders > 0
    ? `${Math.min(100, (confirmedCount / quoteBase) * 100).toFixed(1)}%`
    : "0.0%";

  // ── Derive: Growth (compare last 30 days vs prior 30 days) ─────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const recentOrders = orders.filter((o) => o.createdAt >= thirtyDaysAgo);
  const priorOrders = orders.filter(
    (o) => o.createdAt >= sixtyDaysAgo && o.createdAt < thirtyDaysAgo
  );
  const recentRevenue = recentOrders
    .filter((o) => ["PAID", "PARTIAL"].includes(o.paymentStatus))
    .reduce((s, o) => s + o.totalPrice, 0);
  const priorRevenue = priorOrders
    .filter((o) => ["PAID", "PARTIAL"].includes(o.paymentStatus))
    .reduce((s, o) => s + o.totalPrice, 0);

  const revenueGrowth =
    priorRevenue > 0
      ? parseFloat((((recentRevenue - priorRevenue) / priorRevenue) * 100).toFixed(1))
      : recentRevenue > 0
      ? 100
      : 0;
  const orderGrowth =
    priorOrders.length > 0
      ? parseFloat(
          (((recentOrders.length - priorOrders.length) / priorOrders.length) * 100).toFixed(1)
        )
      : recentOrders.length > 0
      ? 100
      : 0;

  // ── Shipment status breakdown ──────────────────────────────────────────────
  const shipmentBreakdown = {
    PREPARING: shipments.filter((s) => s.currentStatus === "PREPARING").length,
    IN_TRANSIT: shipments.filter((s) => s.currentStatus === "IN_TRANSIT").length,
    CUSTOMS: shipments.filter((s) => s.currentStatus === "CUSTOMS").length,
    OUT_FOR_DELIVERY: shipments.filter((s) => s.currentStatus === "OUT_FOR_DELIVERY").length,
    DELIVERED: shipments.filter((s) => s.currentStatus === "DELIVERED").length,
    RETURNED: 0,
  };

  // ── Pass structured data to client component ───────────────────────────────
  const analyticsData = {
    // KPIs
    totalRevenue,
    totalOrders,
    paidOrders,
    avgOrderValue,
    conversionRate,
    revenueGrowth,
    orderGrowth,
    totalProducts: products.length,
    availableProducts: products.filter((p) => p.available).length,
    totalQuotes,

    // Charts
    monthlyRevenue,
    revenueByCategory,
    topProducts,
    geographicData,

    // Payment & Treasury
    paymentBreakdown,
    paidRevenue,
    pendingRevenue,

    // B2B Pipeline
    orderStatusBreakdown,
    shipmentBreakdown,
  };

  return <ExporterAnalyticsDashboard data={analyticsData} />;
}
