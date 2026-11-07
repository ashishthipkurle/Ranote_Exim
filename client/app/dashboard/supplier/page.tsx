"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Handshake,
  Boxes,
  FolderTree,
  CreditCard,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/api-utils";
import { cn } from "@/lib/utils";

interface SupplierStats {
  totalExporters: number;
  totalProducts: number;
  activeOrders: number;
  revenue: number;
  revenueChange: number;
}

export default function SupplierDashboard() {
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch or mock supplier telemetry
    const timer = setTimeout(() => {
      setStats({
        totalExporters: 12,
        totalProducts: 48,
        activeOrders: 5,
        revenue: 128500,
        revenueChange: 12.5,
      });
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      label: "EXPORTERS CONNECTED",
      value: String(stats?.totalExporters ?? 0),
      sub: "ACTIVE NETWORK",
      trend: "VERIFIED",
      trendMint: true,
      icon: <Handshake className="w-5 h-5 text-[#C4912A]" />,
      bar: 75,
      href: "/dashboard/supplier/exporters",
    },
    {
      label: "SUPPLY REVENUE",
      value: formatCurrency(stats?.revenue ?? 0),
      sub: "ALL TIME",
      trend: "+12.5%",
      trendMint: false,
      icon: <CreditCard className="w-5 h-5 text-[#C4912A]" />,
      bar: 68,
      href: "/dashboard/supplier/finance",
    },
    {
      label: "ACTIVE ORDERS",
      value: String(stats?.activeOrders ?? 0),
      sub: "IN FULFILLMENT",
      trend: "ACTIVE",
      trendMint: false,
      icon: <FolderTree className="w-5 h-5 text-[#C4912A]" />,
      bar: 50,
      href: "/dashboard/supplier/orders",
    },
    {
      label: "CATALOG ITEMS",
      value: formatNumber(stats?.totalProducts ?? 0),
      sub: "OFFERED GOODS",
      trend: "LIVE",
      trendMint: true,
      icon: <Boxes className="w-5 h-5 text-[#C4912A]" />,
      bar: 85,
      href: "/dashboard/supplier/products",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[34px] font-[800] tracking-tight text-[#15130D]">
            SUPPLIER DASHBOARD
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Distribution network, inventory supply, and active exporter fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-[800] uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
            <span className="size-1.5 rounded-full bg-[#0B7A57] animate-pulse" />
            INTELLIGENCE NODE ACTIVE
          </span>
        </div>
      </div>

      {/* ── 4 KPI Cards: White to #FFFBF0 gradient, 1px #F0ECE0 border, radius 24, soft shadow ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {statCards.map((s) => (
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

      {/* ── Content Grid: Orders + Strategic Hub ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Supply Deliveries */}
        <div className="lg:col-span-2 bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0] mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider">
                SUPPLY FULFILLMENT
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                ACTIVE SHIPMENTS TO EXPORTERS
              </p>
            </div>
            <Link
              href="/dashboard/supplier/orders"
              className="text-xs font-bold text-[#7A560A] hover:text-[#C4912A] flex items-center gap-1"
            >
              All Supply Orders <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F0ECE0] pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                  <th className="pb-3">Batch ID</th>
                  <th className="pb-3">Item Category</th>
                  <th className="pb-3">Target Exporter</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE0] text-xs">
                <tr className="hover:bg-[#FFFBF2] transition-colors">
                  <td className="py-3.5 font-bold text-[#15130D]">SPL-9281</td>
                  <td className="py-3.5 font-semibold text-[#15130D]">Organic Areca Raw Leaf</td>
                  <td className="py-3.5 text-[#6B6A66]">Ranote Global Hub</td>
                  <td className="py-3.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
                      DISPATCHED
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-[#7A560A]">$14,200</td>
                </tr>
                <tr className="hover:bg-[#FFFBF2] transition-colors">
                  <td className="py-3.5 font-bold text-[#15130D]">SPL-9104</td>
                  <td className="py-3.5 font-semibold text-[#15130D]">CNC Precision Disc Rotor</td>
                  <td className="py-3.5 text-[#6B6A66]">Alpha Exim Tech</td>
                  <td className="py-3.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]">
                      PREPARING
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-[#7A560A]">$32,800</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Exporters Hub Card */}
        <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0] mb-5">
              <div>
                <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider">
                  DEALER RELATIONS
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                  COMMUNICATION & LOGISTICS
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/supplier/exporters"
                className="flex items-center justify-between p-4 rounded-[16px] bg-white hover:bg-[#FFFBF2] border border-[#F0ECE0] hover:border-[#C4912A]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[12px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center font-bold">
                    <Handshake className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#15130D] group-hover:text-[#C4912A] transition-colors">
                      Exporters Hub
                    </p>
                    <p className="text-[10px] text-[#6B6A66]">
                      Manage partner connections & supply lines
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[#6B6A66] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard/supplier/products"
                className="flex items-center justify-between p-4 rounded-[16px] bg-white hover:bg-[#FFFBF2] border border-[#F0ECE0] hover:border-[#C4912A]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[12px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center font-bold">
                    <Boxes className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#15130D] group-hover:text-[#C4912A] transition-colors">
                      Supply Inventory
                    </p>
                    <p className="text-[10px] text-[#6B6A66]">
                      Update batch availability & dispatch items
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-[#6B6A66] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/dashboard/supplier/exporters"
              className="w-full h-11 bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_4px_14px_rgba(196,145,42,0.25)] hover:shadow-[0_6px_20px_rgba(196,145,42,0.35)] transition-all flex items-center justify-center gap-2"
            >
              <span>Connect with New Exporters</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
