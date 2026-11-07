"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  CreditCard,
  Clock,
  Package,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { authFetch, formatCurrency, formatNumber, timeAgo } from "@/lib/api-utils";
import { cn } from "@/lib/utils";

interface ImporterStats {
  totalOrders: number;
  pendingOrders: number;
  activeShipments: number;
  totalSpent: number;
  categories?: { name: string; spent: number }[];
}

interface Order {
  id: string;
  orderNumber: string;
  totalPrice: number;
  orderStatus: string;
  status?: string;
  createdAt: string;
  product?: { name: string };
  seller?: { name: string; businessName: string | null };
}

export default function ImporterDashboard() {
  const [data, setData] = useState<ImporterStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch<ImporterStats>("/api/stats?scope=importer"),
      authFetch<{ orders: Order[] }>("/api/orders?limit=6"),
    ])
      .then(([stats, ordersResp]) => {
        setData(stats);
        setOrders(ordersResp.orders ?? []);
      })
      .catch((err) => console.error("Importer Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "ACTIVE SHIPMENTS",
      value: String(data?.activeShipments ?? 0),
      sub: "IN TRANSIT",
      trend: "LIVE",
      trendMint: true,
      icon: <Truck className="w-5 h-5 text-[#C4912A]" />,
      bar: data ? Math.min((data.activeShipments / Math.max(data.totalOrders, 1)) * 100, 100) : 50,
      href: "/dashboard/importer/orders",
    },
    {
      label: "TOTAL SPENT",
      value: formatCurrency(data?.totalSpent ?? 0),
      sub: "ALL TIME",
      trend: "+8.4%",
      trendMint: false,
      icon: <CreditCard className="w-5 h-5 text-[#C4912A]" />,
      bar: 70,
      href: "/dashboard/importer/finance",
    },
    {
      label: "PENDING ORDERS",
      value: String(data?.pendingOrders ?? 0),
      sub: "AWAITING CONFIRMATION",
      trend: "IN REVIEW",
      trendMint: false,
      icon: <Clock className="w-5 h-5 text-[#C4912A]" />,
      bar: data ? Math.min((data.pendingOrders / Math.max(data.totalOrders, 1)) * 100, 100) : 30,
      href: "/dashboard/importer/orders",
    },
    {
      label: "TOTAL ORDERS",
      value: formatNumber(data?.totalOrders ?? 0),
      sub: "LIFETIME PURCHASES",
      trend: "ALL TIME",
      trendMint: false,
      icon: <Package className="w-5 h-5 text-[#C4912A]" />,
      bar: 60,
      href: "/dashboard/importer/orders",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[34px] font-[800] tracking-tight text-[#15130D]">
            IMPORTER DASHBOARD
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Global sourcing operations, active overseas shipments, and verified supplier orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-[800] uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
            <span className="size-1.5 rounded-full bg-[#0B7A57] animate-pulse" />
            OPERATIONAL
          </span>
        </div>
      </div>

      {/* ── 4 KPI Cards: White to #FFFBF0 gradient, 1px #F0ECE0 border, radius 24, soft shadow ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer block group"
            style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center transition-transform group-hover:scale-105">
                {s.icon}
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-[800] uppercase tracking-wider",
                  s.trendMint
                    ? "bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20"
                    : "bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]"
                )}
              >
                {s.trendMint && <span className="size-1.5 rounded-full bg-current" />}
                {s.trend}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
                {s.label}
              </p>
              {loading ? (
                <div className="h-[44px] w-24 bg-[#FBF1D6] rounded-[10px] animate-pulse my-1" />
              ) : (
                <p className="text-[44px] font-[800] leading-none text-[#15130D] tracking-[-0.02em]">
                  {s.value}
                </p>
              )}
              <p className="text-[11px] font-[700] text-[#6B6A66] uppercase tracking-[0.14em] mt-3">
                {s.sub}
              </p>
            </div>

            {/* 6px Progress Bar: gold gradient on #F0ECE0 */}
            <div className="mt-4">
              <div className="h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] rounded-full transition-all duration-700"
                  style={{ width: `${s.bar}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Content Grid: Recent Orders + Procurement Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0] mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider">
                RECENT ORDERS
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                ACTIVE SHIPMENTS & IMPORT SHIPMENTS
              </p>
            </div>
            <Link
              href="/dashboard/importer/orders"
              className="text-xs font-bold text-[#7A560A] hover:text-[#C4912A] flex items-center gap-1"
            >
              All Orders <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F0ECE0] pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE0] text-xs">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6B6A66]">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#FFFBF2] transition-colors">
                      <td className="py-3.5 font-bold text-[#15130D]">
                        {o.orderNumber || o.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 font-semibold text-[#15130D]">
                        {o.product?.name || "Global Trade Asset"}
                      </td>
                      <td className="py-3.5 text-[#6B6A66]">{timeAgo(o.createdAt)}</td>
                      <td className="py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]">
                          {o.orderStatus || o.status || "CONFIRMED"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-[#7A560A]">
                        {formatCurrency(o.totalPrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Sourcing Hub */}
        <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0] mb-5">
              <div>
                <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider">
                  SOURCING ACTIONS
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                  COMMUNICATION & LOGISTICS
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/importer/directory"
                className="flex items-center justify-between p-4 rounded-[16px] bg-white hover:bg-[#FFFBF2] border border-[#F0ECE0] hover:border-[#C4912A]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[12px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center font-bold">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#15130D] group-hover:text-[#C4912A] transition-colors">
                      Exporters Directory
                    </p>
                    <p className="text-[10px] text-[#6B6A66]">
                      Connect directly with verified suppliers
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[#6B6A66] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard/importer/finance"
                className="flex items-center justify-between p-4 rounded-[16px] bg-white hover:bg-[#FFFBF2] border border-[#F0ECE0] hover:border-[#C4912A]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[12px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center font-bold">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#15130D] group-hover:text-[#C4912A] transition-colors">
                      Financial Invoices
                    </p>
                    <p className="text-[10px] text-[#6B6A66]">
                      Review LC, invoices & payment milestones
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[#6B6A66] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/dashboard/importer/directory"
              className="w-full h-11 bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_4px_14px_rgba(196,145,42,0.25)] hover:shadow-[0_6px_20px_rgba(196,145,42,0.35)] transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Verified Exporters</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
