"use client";

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { authFetch, formatCurrency } from "@/lib/api-utils";
import {
  Download,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  Globe,
  ShieldCheck,
  ShoppingCart,
  Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Invoice {
  id: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  status: string;
  orderStatus?: string;
  orderType?: string;
  product?: string;
  category?: string;
  hsCode?: string;
  quantity?: number;
  buyer: string;
  buyerCountry?: string;
  incoterms?: string;
  paidAt: string | null;
  date?: string;
}

interface FinanceData {
  role: string;
  available: number;
  pending: number;
  lastPayout: number;
  recentInvoices: Invoice[];
}

interface MonthlyPoint {
  month: string;
  revenue: number;
  orderCount: number;
}

interface AnalyticsData {
  monthlyRevenue: MonthlyPoint[];
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function statusCfg(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID") return { label: "PAID", icon: CheckCircle2, colorClass: "text-[#0B7A57] bg-[#E2F5EE]" };
  if (s === "PENDING") return { label: "PENDING", icon: Clock, colorClass: "text-[#7A560A] bg-[#FBF1D6]" };
  if (s === "PARTIAL") return { label: "PARTIAL", icon: ShieldCheck, colorClass: "text-[#6B6A66] bg-[#F7F5F0]" };
  return { label: s, icon: Circle, colorClass: "text-[#6B6A66] bg-[#F7F5F0]" };
}

function fmtUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function downloadAsFile(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

function buildStatementHTML(invoices: Invoice[], totalRevenue: number): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const rows = invoices.map(inv => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; font-family: monospace; font-weight: bold;">#${inv.orderNumber}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0;">
        <div style="font-weight: 600;">${inv.buyer}</div>
        <div style="font-size: 11px; color: #6B6A66;">${inv.buyerCountry || 'International'}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0;">
        <div>${inv.product || 'Wholesale Commodity'}</div>
        <div style="font-size: 11px; color: #7A560A; font-family: monospace;">HS: ${inv.hsCode || '—'}</div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; font-size: 12px; font-weight: 600;">${inv.incoterms || 'FOB'}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; font-size: 12px;">${fmtDate(inv.paidAt)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0ECE0; text-align: right; font-weight: bold; color: #15130D; font-size: 14px;">${fmtUSD(inv.amount)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ranote Exim - Official Commercial Trade Statement</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #15130D; margin: 40px; background: #fff; line-height: 1.4; }
    .header { border-bottom: 3px solid #C4912A; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0; color: #15130D; font-size: 24px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
    .tagline { margin: 4px 0 0; color: #6B6A66; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { text-align: left; padding: 12px 16px; background: #FFFBF2; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6B6A66; border-bottom: 2px solid #F0ECE0; }
    .total-box { margin-top: 30px; padding: 24px; background: #FFFBF2; border-radius: 16px; border: 1px solid #F0ECE0; display: flex; justify-content: space-between; align-items: center; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #E2F5EE; color: #0B7A57; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">B2B Wholesale Trade & Settlement</span>
      <h1 style="margin-top: 8px;">Ranote Exim · Commercial Export Statement</h1>
      <p class="tagline">Global Trade Treasury & Official Disbursement Record · Generated ${dateStr}</p>
    </div>
    <div style="text-align: right; font-size: 12px; color: #6B6A66;">
      <div>Platform License: <strong>RANOTE-EXIM-GLOBAL</strong></div>
      <div>Settlement Engine: <strong>Automated Escrow & Wire</strong></div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Contract #</th>
        <th>Buyer / Consignee</th>
        <th>Commodity & HS Code</th>
        <th>Incoterms</th>
        <th>Settlement Date</th>
        <th style="text-align: right;">Contract Value (USD)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total-box">
    <div>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6B6A66; font-weight: bold;">Verified Trade Ledger</div>
      <div style="font-size: 13px; color: #15130D; margin-top: 2px;">Total of ${invoices.length} settled wholesale trade contracts</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6B6A66; font-weight: bold;">Total Settled Export Volume</div>
      <div style="font-size: 30px; font-weight: 800; color: #0B7A57; margin-top: 2px;">${fmtUSD(totalRevenue)}</div>
    </div>
  </div>
</body>
</html>`;
}

function FinancialChart({ data }: { data: MonthlyPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 700, h: 260 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: MonthlyPoint } | null>(null);
  const [drawn, setDrawn] = useState(false);

  const measure = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setSize({ w: rect.width, h: 260 });
      }
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t);
  }, []);

  const W = Math.max(size.w, 300);
  const H = size.h;
  const padL = 60, padR = 24, padT = 20, padB = 40;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const pts = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2;
    const maxVal = Math.max(...data.map(m => m.revenue), 1000);
    const y = cH - (d.revenue / maxVal) * cH;
    return { x, y, d };
  });

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp2x = cp1x;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const areaPath = pts.length > 0 ? `${linePath} L ${pts[pts.length - 1].x} ${cH} L ${pts[0].x} ${cH} Z` : "";

  return (
    <div ref={containerRef} className="w-full relative select-none">
      <svg width={W} height={H} className="overflow-visible">
        <defs>
          <linearGradient id="areaGradGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4912A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFBF2" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${padL}, ${padT})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = cH * (1 - r);
            const maxVal = Math.max(...data.map(m => m.revenue), 1000);
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={cW} y2={y} stroke="#F0ECE0" strokeDasharray="3 3" />
                <text x={-12} y={y + 4} textAnchor="end" fill="#6B6A66" fontSize="11" fontWeight="700">
                  {fmtUSD(maxVal * r)}
                </text>
              </g>
            );
          })}

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: drawn ? 1 : 0 }}
            d={areaPath}
            fill="url(#areaGradGold)"
          />

          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            d={linePath}
            stroke="#C4912A"
            strokeWidth="3"
            fill="none"
          />

          {pts.map((p, i) => (
            <g key={i}>
              <text x={p.x} y={cH + 25} textAnchor="middle" fill="#6B6A66" fontSize="11" fontWeight="700">
                {MONTH_SHORT[new Date(p.d.month).getMonth()]}
              </text>
              <circle
                cx={p.x}
                cy={p.y}
                r="20"
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setTooltip({ x: p.x + padL, y: p.y + padT, point: p.d })}
                onMouseLeave={() => setTooltip(null)}
              />
              <motion.circle
                initial={{ r: 0 }}
                animate={{ r: 5 }}
                cx={p.x}
                cy={p.y}
                fill="#C4912A"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          ))}
        </g>
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-[#F0ECE0] p-3.5 rounded-[16px] shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: "translate(-50%, -120%)"
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-0.5">
            {MONTH_SHORT[new Date(tooltip.point.month).getMonth()]} Revenue
          </div>
          <div className="text-lg font-extrabold text-[#15130D]">
            {fmtUSD(tooltip.point.revenue)}
          </div>
          <div className="text-xs text-[#6B6A66] mt-1 flex items-center gap-1.5 font-medium">
            <ShoppingCart className="w-3.5 h-3.5 text-[#C4912A]" />
            {tooltip.point.orderCount} orders
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExporterFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [chartData, setChartData] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch<FinanceData>("/api/dashboard/finance").catch(() => null),
      authFetch<AnalyticsData>("/api/dashboard/analytics").catch(() => null),
    ]).then(([fin, ana]) => {
      if (fin) setData(fin);
      if (ana?.monthlyRevenue) setChartData(ana.monthlyRevenue);
    }).finally(() => setLoading(false));
  }, []);

  const completedTotal = data?.recentInvoices?.filter(i => i.status.toUpperCase() === "PAID").reduce((s, i) => s + i.amount, 0) ?? 0;

  const filteredInvoices = (data?.recentInvoices ?? []).filter(inv => {
    if (statusFilter === "ALL") return true;
    return inv.status.toUpperCase() === statusFilter;
  });

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Treasury Ledger
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Settlement Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Finance Overview
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            {filteredInvoices.length} total invoices · Real-time trade receipts and payout streams
          </p>
        </div>

        <button
          onClick={() => {
            setDownloading(true);
            try {
              const paidInvoices = (data?.recentInvoices ?? []).filter(i => i.status.toUpperCase() === "PAID");
              if (!paidInvoices.length) {
                alert("No completed invoices available to download.");
                return;
              }
              const html = buildStatementHTML(paidInvoices, completedTotal);
              downloadAsFile(html, `Statement_${new Date().toISOString().slice(0, 10)}.html`);
            } finally {
              setTimeout(() => setDownloading(false), 1500);
            }
          }}
          disabled={downloading}
          className="btn-gold-primary"
        >
          {downloading ? <Globe className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 stroke-[2]" />}
          Download Statement
        </button>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { k: "SETTLED EXPORT VOLUME", v: fmtUSD(data?.available || 0), sub: "Verified trade contract earnings", icon: DollarSign, ratio: ((data?.available || 0) / Math.max((data?.available || 0) + (data?.pending || 0) + completedTotal, 1)) },
          { k: "PENDING TRADE ESCROW", v: fmtUSD(data?.pending || 0), sub: "Awaiting port & customs clearance", icon: Clock, ratio: ((data?.pending || 0) / Math.max((data?.available || 0) + (data?.pending || 0) + completedTotal, 1)) },
          { k: "PAID COMMERCIAL INVOICES", v: fmtUSD(completedTotal), sub: "Settled wholesale transactions", icon: ShieldCheck, ratio: (completedTotal / Math.max((data?.available || 0) + (data?.pending || 0) + completedTotal, 1)) },
        ].map((s) => (
          <div key={s.k} className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <s.icon className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                LIVE
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
              {s.k}
            </p>
            <div className="text-[38px] md:text-[44px] font-extrabold leading-none text-[#15130D]">
              {s.v}
            </div>
            <p className="text-xs text-[#6B6A66] mt-3">
              {s.sub}
            </p>
            <div className="mt-4 h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] rounded-full transition-all duration-700"
                style={{ width: `${Math.max(10, Math.min(s.ratio * 100, 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Revenue Intel Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Revenue Chart Section */}
        <div className="xl:col-span-8 rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
                REVENUE CHART
              </h2>
              <p className="text-xs text-[#6B6A66] mt-0.5">Monthly earning performance across global contracts</p>
            </div>
          </div>
          <FinancialChart data={chartData} />
        </div>

        {/* Financial Summary */}
        <div className="xl:col-span-4 rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
            FINANCIAL SUMMARY
          </h3>
          <div className="space-y-3">
            {[
              { l: 'HIGHEST MONTH', v: fmtUSD(Math.max(...chartData.map(d => d.revenue), 0) || 0), i: TrendingUp },
              { l: 'PAYMENT RATE', v: `${data?.recentInvoices?.length ? ((data.recentInvoices.filter((i: any) => i.status.toUpperCase() === 'PAID').length / data.recentInvoices.length) * 100).toFixed(1) : '100.0'}%`, i: ShieldCheck },
              { l: 'LAST SETTLEMENT', v: fmtDate(data?.recentInvoices?.[0]?.paidAt || null), i: Clock },
            ].map(item => (
              <div key={item.l} className="flex items-center gap-3.5 p-3.5 rounded-[18px] border border-[#F0ECE0] bg-white">
                <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
                  <item.i className="w-4 h-4 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">{item.l}</p>
                  <p className="text-sm font-extrabold text-[#15130D] mt-0.5">{item.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Recent Invoices ─── */}
      <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0ECE0] p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
              <FileText className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
                RECENT INVOICES
              </h2>
              <p className="text-xs text-[#6B6A66]">Itemized trade transaction logs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["ALL", "PAID", "PENDING"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
                  statusFilter === s
                    ? "bg-[#FBF1D6] text-[#7A560A]"
                    : "bg-[#F4F4F7] text-[#6B6A66] hover:bg-[#ece7da]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6B6A66]">
            No invoices found for this status.
          </div>
        ) : (
          <div className="divide-y divide-[#F0ECE0]">
            {filteredInvoices.map((inv) => {
              const cfg = statusCfg(inv.status);
              return (
                <div key={inv.id} className="p-5 px-6 hover:bg-[#FFFBF2] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#15130D]">
                          #{inv.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#F4F4F7] text-[#7A560A]">
                          {inv.orderType || "B2B"}
                        </span>
                        {inv.hsCode && inv.hsCode !== "—" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#FFFBF2] border border-[#F0ECE0] text-[#6B6A66]">
                            HS: {inv.hsCode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B6A66] mt-0.5 truncate">
                        {inv.buyer} · {inv.buyerCountry || "International"} · {inv.product || "Wholesale Cargo"} · {fmtDate(inv.paidAt || inv.date || null)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <span className="text-[11px] font-semibold text-[#6B6A66] bg-[#F7F5F0] px-2.5 py-1 rounded-full">
                      {inv.incoterms || "FOB"}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${cfg.colorClass}`}>
                      {cfg.label}
                    </span>
                    <span className="text-base font-extrabold text-[#15130D] min-w-[90px] text-right">
                      {fmtUSD(inv.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
