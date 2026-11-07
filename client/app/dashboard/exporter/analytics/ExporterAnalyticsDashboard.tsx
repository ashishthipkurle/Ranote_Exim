"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Package, ShoppingCart, Globe,
  DollarSign, Download, RefreshCw, Filter, ChevronDown,
  ArrowDownRight, BarChart2, Activity,
  CreditCard, Truck, CheckCircle2, Clock, XCircle, AlertCircle,
  Layers, type LucideIcon,
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  avgOrderValue: number;
  conversionRate: string;
  revenueGrowth: number;
  orderGrowth: number;
  totalProducts: number;
  availableProducts: number;
  monthlyRevenue: { month: string; revenue: number; orderCount: number }[];
  revenueByCategory: { category: string; revenue: number; orderCount: number }[];
  topProducts: { id: string; name: string; category: string; revenue: number; orderCount: number }[];
  geographicData: { country: string; orderCount: number; revenue: number }[];
  paymentBreakdown: { PAID: number; PENDING: number; FAILED: number; REFUNDED: number };
  paidRevenue: number;
  pendingRevenue: number;
  orderStatusBreakdown: {
    PENDING: number; CONFIRMED: number; PROCESSING: number;
    SHIPPED: number; DELIVERED: number; CANCELLED: number;
  };
  shipmentBreakdown: {
    PREPARING: number; IN_TRANSIT: number; CUSTOMS: number;
    OUT_FOR_DELIVERY: number; DELIVERED: number; RETURNED: number;
  };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TIMEFRAMES = ["1M", "3M", "6M", "1Y", "ALL"] as const;
type Timeframe = typeof TIMEFRAMES[number];

const RANOTE_PALETTE = [
  "#C4912A", // gold
  "#0B7A57", // mint green
  "#EBC964", // light gold
  "#7A560A", // dark gold
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#6B6A66", // muted ink
];

const CATEGORY_LABELS: Record<string, string> = {
  CHEMICALS: "Chemicals", MACHINES: "Machinery", TEXTILES: "Textiles",
  MEDICAL: "Medical", HANDICRAFTS: "Handicrafts", FOOD: "Food & Beverage",
  ELECTRONICS: "Electronics", AUTOMOTIVE: "Automotive",
  CONSTRUCTION: "Construction", AGRICULTURE: "Agriculture", OTHER: "Other",
};

function fCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fNum(n: number) { return new Intl.NumberFormat("en-US").format(n); }
function fMonth(iso: string) {
  const d = new Date(iso + "-01");
  return `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#F0ECE0] rounded-[16px] px-4 py-3 shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[#6B6A66] font-medium capitalize">{p.name}:</span>
          <span style={{ color: p.color }}>
            {p.name === "revenue" || p.name === "Revenue" || p.name === "paidRevenue"
              ? fCurrency(p.value)
              : fNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <p className="text-sm font-bold text-[#15130D]">No Data Recorded</p>
      <p className="text-xs text-[#6B6A66] mt-1 max-w-xs">{message}</p>
    </div>
  );
}

function KpiCard({
  label, value, sub, trend, icon: Icon, fillRatio = 0,
}: {
  label: string; value: string; sub: string; trend?: number;
  icon: LucideIcon; fillRatio?: number;
}) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
          <Icon className="w-5 h-5 stroke-[1.8]" />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${
            isPositive ? "bg-[#E2F5EE] text-[#0B7A57]" : "bg-red-50 text-red-600"
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3 stroke-[2]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2]" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">{label}</p>
        <p className="text-[36px] md:text-[40px] font-extrabold leading-none text-[#15130D]">{value}</p>
        <p className="text-xs text-[#6B6A66] mt-2.5">{sub}</p>
      </div>
      {fillRatio > 0 && (
        <div className="mt-4 h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#C4912A] to-[#EBC964]"
            style={{ width: `${Math.min(100, Math.max(0, fillRatio * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 sm:p-8 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">{title}</h3>
      {subtitle && <p className="text-xs text-[#6B6A66] mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function ExporterAnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("6M");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [activeMetric, setActiveMetric] = useState<"revenue" | "orderCount">("revenue");
  const [chartMode, setChartMode] = useState<"area" | "bar">("area");

  const availableCategories = useMemo(() => {
    return ["ALL", ...data.revenueByCategory.map((c) => c.category)];
  }, [data.revenueByCategory]);

  const filteredMonthly = useMemo(() => {
    const all = data.monthlyRevenue;
    const sliceMap: Record<Timeframe, number> = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, ALL: all.length };
    return all.slice(-Math.min(sliceMap[timeframe], all.length)).map((m) => ({
      ...m,
      label: fMonth(m.month),
    }));
  }, [data.monthlyRevenue, timeframe]);

  const filteredCategories = useMemo(() => {
    if (categoryFilter === "ALL") return data.revenueByCategory;
    return data.revenueByCategory.filter((c) => c.category === categoryFilter);
  }, [data.revenueByCategory, categoryFilter]);

  const paymentDonutData = useMemo(
    () => [
      { name: "Paid", value: data.paymentBreakdown.PAID, color: "#0B7A57" },
      { name: "Pending", value: data.paymentBreakdown.PENDING, color: "#C4912A" },
      { name: "Failed", value: data.paymentBreakdown.FAILED, color: "#ef4444" },
      { name: "Refunded", value: data.paymentBreakdown.REFUNDED, color: "#6B6A66" },
    ].filter((d) => d.value > 0),
    [data.paymentBreakdown]
  );

  const orderStatusData = useMemo(
    () => [
      { name: "Delivered", value: data.orderStatusBreakdown.DELIVERED, fill: "#0B7A57" },
      { name: "Shipped", value: data.orderStatusBreakdown.SHIPPED, fill: "#C4912A" },
      { name: "Processing", value: data.orderStatusBreakdown.PROCESSING, fill: "#EBC964" },
      { name: "Confirmed", value: data.orderStatusBreakdown.CONFIRMED, fill: "#7A560A" },
      { name: "Pending", value: data.orderStatusBreakdown.PENDING, fill: "#FBF1D6" },
      { name: "Cancelled", value: data.orderStatusBreakdown.CANCELLED, fill: "#ef4444" },
    ].filter((d) => d.value > 0),
    [data.orderStatusBreakdown]
  );

  const maxGeo = Math.max(...data.geographicData.map((g) => g.revenue), 1);

  const handleExport = useCallback(() => {
    window.print();
  }, []);

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
              Trade Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Export Analytics
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Real-time performance metrics, trade routes, and order velocity
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Pills */}
          <div className="flex items-center bg-[#F4F4F7] p-1 border border-[#F0ECE0] rounded-full">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  timeframe === tf
                    ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm"
                    : "text-[#6B6A66] hover:text-[#15130D]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExport}
            className="btn-gold-primary"
          >
            <Download className="w-4 h-4 stroke-[2]" />
            Export Report
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="TOTAL REVENUE" icon={DollarSign}
          value={fCurrency(data.totalRevenue)} sub="All-time contract earnings" trend={data.revenueGrowth}
          fillRatio={1}
        />
        <KpiCard
          label="TOTAL ORDERS" icon={ShoppingCart}
          value={fNum(data.totalOrders)} sub={`${data.paidOrders} verified paid orders`} trend={data.orderGrowth}
          fillRatio={data.totalOrders > 0 ? data.paidOrders / data.totalOrders : 0}
        />
        <KpiCard
          label="AVG. ORDER VALUE" icon={TrendingUp}
          value={fCurrency(data.avgOrderValue)} sub="Average wholesale ticket size"
        />
        <KpiCard
          label="PRODUCTS LISTED" icon={Package}
          value={fNum(data.totalProducts)} sub={`${data.availableProducts} available in catalog`}
          fillRatio={data.totalProducts > 0 ? data.availableProducts / data.totalProducts : 0}
        />
      </div>

      {/* ─── Revenue Trend Chart ─── */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
              {activeMetric === "revenue" ? "REVENUE TRENDS" : "ORDER VOLUME"}
            </h3>
            <p className="text-xs text-[#6B6A66] mt-0.5">
              {filteredMonthly.length > 0
                ? `From ${filteredMonthly[0].label} to ${filteredMonthly[filteredMonthly.length - 1].label}`
                : "No telemetry recorded"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-[#F4F4F7] p-1 border border-[#F0ECE0] rounded-full">
              {(["revenue", "orderCount"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeMetric === m
                      ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm"
                      : "text-[#6B6A66] hover:text-[#15130D]"
                  }`}
                >
                  {m === "revenue" ? "Revenue" : "Orders"}
                </button>
              ))}
            </div>
            <div className="flex bg-[#F4F4F7] p-1 border border-[#F0ECE0] rounded-full">
              <button
                onClick={() => setChartMode("area")}
                className={`p-1.5 rounded-full transition-all ${
                  chartMode === "area" ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm" : "text-[#6B6A66]"
                }`}
              >
                <Activity className="w-3.5 h-3.5 stroke-[2]" />
              </button>
              <button
                onClick={() => setChartMode("bar")}
                className={`p-1.5 rounded-full transition-all ${
                  chartMode === "bar" ? "bg-[#FBF1D6] text-[#7A560A] shadow-sm" : "text-[#6B6A66]"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-72">
          {filteredMonthly.length === 0 ? (
            <EmptyChart icon={Activity} message="No revenue data available for selected timeframe." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "area" ? (
                <AreaChart data={filteredMonthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C4912A" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#FFFBF2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#6B6A66", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis
                    tick={{ fill: "#6B6A66", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={75}
                    tickFormatter={(v) => activeMetric === "revenue" ? fCurrency(v) : fNum(v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#C4912A', strokeOpacity: 0.3, strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone" dataKey={activeMetric}
                    name={activeMetric === "revenue" ? "revenue" : "orders"}
                    stroke="#C4912A"
                    strokeWidth={2.5} fill="url(#goldGradAnalytics)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#C4912A" }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={filteredMonthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#6B6A66", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis
                    tick={{ fill: "#6B6A66", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={75}
                    tickFormatter={(v) => activeMetric === "revenue" ? fCurrency(v) : fNum(v)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#FBF1D6", opacity: 0.4, radius: 8 } as any} />
                  <Bar
                    dataKey={activeMetric} name={activeMetric === "revenue" ? "revenue" : "orders"}
                    fill="#C4912A" radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* ── Row: Category + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category breakdown */}
        <Card className="lg:col-span-5">
          <CardHeader title="CATEGORY BREAKDOWN" subtitle="Revenue distribution across export lines" />
          {filteredCategories.length === 0 ? (
            <EmptyChart icon={Layers} message="No category data recorded." />
          ) : (
            <>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredCategories} cx="50%" cy="50%"
                      innerRadius={65} outerRadius={95} paddingAngle={3}
                      dataKey="revenue" nameKey="category"
                      stroke="none"
                    >
                      {filteredCategories.map((_, i) => (
                        <Cell key={i} fill={RANOTE_PALETTE[i % RANOTE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0];
                      return (
                        <div className="bg-white border border-[#F0ECE0] rounded-[16px] px-4 py-2.5 shadow-lg">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                            {p.name ? (CATEGORY_LABELS[p.name as string] ?? p.name) : "Unknown"}
                          </p>
                          <p className="text-sm font-extrabold text-[#15130D]">{fCurrency(p.value as number)}</p>
                          <p className="text-xs text-[#6B6A66] mt-0.5">{p.payload.orderCount} orders</p>
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {filteredCategories.map((c, i) => {
                  const total = filteredCategories.reduce((a, x) => a + x.revenue, 0);
                  const pct = total > 0 ? ((c.revenue / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={c.category} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFFBF2] transition-colors">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: RANOTE_PALETTE[i % RANOTE_PALETTE.length] }} />
                      <span className="text-xs font-bold text-[#15130D] flex-1">{CATEGORY_LABELS[c.category] ?? c.category}</span>
                      <span className="text-[11px] text-[#6B6A66]">({c.orderCount})</span>
                      <span className="text-xs font-extrabold text-[#15130D] w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-7">
          <CardHeader title="TOP PRODUCTS" subtitle="Highest generating products by volume" />
          {data.topProducts.length === 0 ? (
            <EmptyChart icon={Package} message="No product records available." />
          ) : (
            <div className="space-y-4">
              {data.topProducts.map((p, i) => {
                const maxRev = Math.max(...data.topProducts.map((x) => x.revenue), 1);
                const pct = (p.revenue / maxRev) * 100;
                return (
                  <div key={p.id} className="p-3.5 rounded-[18px] border border-[#F0ECE0] bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[10px] bg-[#FBF1D6] text-[#7A560A] font-extrabold text-xs flex items-center justify-center">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm text-[#15130D] font-bold">{p.name}</p>
                          <p className="text-[11px] text-[#6B6A66]">
                            {CATEGORY_LABELS[p.category] ?? p.category} · {p.orderCount} orders
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-extrabold text-[#15130D]">{fCurrency(p.revenue)}</p>
                    </div>
                    <div className="h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#C4912A] to-[#EBC964]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Geographic Breakdown ── */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
            <Globe className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
              GEOGRAPHIC DISTRIBUTION
            </h3>
            <p className="text-xs text-[#6B6A66]">Active corridors across {data.geographicData.length} countries</p>
          </div>
        </div>

        {data.geographicData.length === 0 ? (
          <EmptyChart icon={Globe} message="No geographic records yet." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div style={{ height: Math.max(data.geographicData.length * 48, 260) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.geographicData} layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6B6A66", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={fCurrency} />
                  <YAxis type="category" dataKey="country" tick={{ fill: "#15130D", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#FBF1D6", opacity: 0.3, radius: 4 }} />
                  <Bar dataKey="revenue" name="revenue" radius={[0, 6, 6, 0]} fill="#C4912A" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {data.geographicData.map((g, i) => (
                <div
                  key={g.country}
                  className="flex items-center gap-3.5 p-3 rounded-[16px] border border-[#F0ECE0] bg-white hover:bg-[#FFFBF0] transition-colors"
                >
                  <div className="w-8 h-8 rounded-[10px] bg-[#FBF1D6] text-[#7A560A] font-extrabold text-xs flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#15130D] truncate">{g.country}</p>
                    <p className="text-[11px] text-[#6B6A66]">{g.orderCount} shipments</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-[#15130D]">{fCurrency(g.revenue)}</p>
                    <p className="text-[11px] text-[#0B7A57] font-bold">{((g.revenue / maxGeo) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
