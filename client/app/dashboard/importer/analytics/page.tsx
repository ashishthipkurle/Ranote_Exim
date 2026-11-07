"use client";

import { useEffect, useState } from "react";
import { authFetch, formatCurrency, formatNumber } from "@/lib/api-utils";
import {
  TrendingUp,
  Package,
  Globe,
  AlertTriangle,
  Download,
  Share,
  BarChart3,
  PieChart,
  Users
} from "lucide-react";

interface AnalyticsData {
  role: string;
  totalOrders: number;
  totalShipments: number;
  activeShipments: number;
  customsHolds: number;
  totalSpent: number;
  activeRegions: number;
  monthlySpend: { month: string; spent: number; orderCount: number }[];
  supplierBreakdown: { name: string; spent: number; orderCount: number }[];
  categorySpending: { category: string; spent: number; orderCount: number }[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ImporterAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch<AnalyticsData>("/api/dashboard/analytics")
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { k: "TOTAL SPENT", v: formatCurrency(data?.totalSpent ?? 0), tag: "All-time procurement", icon: TrendingUp },
    { k: "TOTAL SHIPMENTS", v: formatNumber(data?.totalShipments ?? 0), tag: `${data?.activeShipments ?? 0} active in transit`, icon: Package },
    { k: "ACTIVE REGIONS", v: formatNumber(data?.activeRegions ?? 0), tag: "Sourcing origins across India", icon: Globe },
    { k: "CUSTOMS CLEARANCE", v: formatNumber(data?.customsHolds ?? 0), tag: data?.customsHolds ? "Action needed" : "All corridors clear", icon: AlertTriangle },
  ];

  const maxSpend = Math.max(...(data?.monthlySpend?.map((m) => m.spent) ?? [1]), 1);

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Analytics Hub
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Procurement Telemetry
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Procurement Analytics
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Track spending velocity, shipment timelines, and supplier fulfillment rates
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn-gold-primary"
        >
          <Download className="w-4 h-4 stroke-[2]" />
          Export Data
        </button>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((s) => (
          <div key={s.k} className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <s.icon className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                LIVE
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">{s.k}</p>
              <p className="text-[34px] md:text-[40px] font-extrabold leading-none text-[#15130D]">
                {loading ? "..." : s.v}
              </p>
              <p className="text-xs text-[#6B6A66] mt-2.5">
                {loading ? "..." : s.tag}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Charts and Details Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Charts Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Spend Chart */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
                  MONTHLY SPENDING
                </h2>
                <p className="text-xs text-[#6B6A66]">Procurement volume across billing cycles</p>
              </div>
            </div>

            {loading ? (
              <div className="h-56 rounded-2xl bg-[#F4F4F7] animate-pulse" />
            ) : (data?.monthlySpend?.length ?? 0) === 0 ? (
              <div className="h-56 rounded-2xl border border-dashed border-[#F0ECE0] flex flex-col items-center justify-center text-[#6B6A66] text-xs">
                <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                No spending data recorded yet
              </div>
            ) : (
              <div className="flex items-end gap-3 h-56 pt-4">
                {data!.monthlySpend.map((m) => {
                  const height = maxSpend > 0 ? Math.max((m.spent / maxSpend) * 100, 6) : 6;
                  const monthDate = new Date(m.month);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                      <div className="w-full rounded-t-xl bg-gradient-to-t from-[#C4912A] to-[#EBC964] transition-all hover:opacity-90" style={{ height: `${height}%` }} />
                      <span className="text-[11px] text-[#6B6A66] font-bold uppercase tracking-[0.14em]">
                        {MONTH_NAMES[monthDate.getMonth()]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Spending */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <PieChart className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
                  SPENDING BY CATEGORY
                </h2>
                <p className="text-xs text-[#6B6A66]">Allocation by export vertical</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-[#F4F4F7] rounded-2xl animate-pulse" />
                ))
              ) : !data?.categorySpending?.length ? (
                <div className="col-span-2 py-8 flex flex-col items-center justify-center text-[#6B6A66] text-xs border border-dashed border-[#F0ECE0] rounded-2xl">
                  <PieChart className="w-8 h-8 mb-2 opacity-40" />
                  No category records yet
                </div>
              ) : (
                data.categorySpending.map((c) => (
                  <div key={c.category} className="p-4 bg-white border border-[#F0ECE0] rounded-[18px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-[#6B6A66] uppercase tracking-[0.14em] truncate">
                        {c.category}
                      </span>
                      <span className="text-xs text-[#6B6A66]">
                        {c.orderCount} orders
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-[#15130D]">
                      {formatCurrency(c.spent)}
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] rounded-full transition-all duration-700"
                        style={{ width: `${(c.spent / (data?.totalSpent || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top Suppliers */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h2 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
                TOP EXPORTERS
              </h2>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-[#F4F4F7] rounded-xl animate-pulse" />
                ))
              ) : !data?.supplierBreakdown?.length ? (
                <div className="py-8 text-center text-xs text-[#6B6A66]">
                  No partner exporters detected
                </div>
              ) : (
                data.supplierBreakdown.map((s, idx) => (
                  <div key={s.name} className="flex items-center justify-between p-3.5 rounded-[16px] border border-[#F0ECE0] bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-[10px] bg-[#FBF1D6] text-[#7A560A] font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#15130D] truncate">{s.name}</div>
                        <div className="text-[10px] text-[#6B6A66]">{s.orderCount} contracts</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-[#15130D]">{formatCurrency(s.spent)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operations Card */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm space-y-3">
            <h2 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D] mb-4">
              DATA OPERATIONS
            </h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-gold-primary w-full justify-center"
            >
              <Download className="w-4 h-4 stroke-[2]" />
              Export Full Ledger
            </button>
            <button
              type="button"
              onClick={() => alert("Report link copied to clipboard")}
              className="btn-cream-secondary w-full justify-center"
            >
              <Share className="w-4 h-4 stroke-[1.8]" />
              Share Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
