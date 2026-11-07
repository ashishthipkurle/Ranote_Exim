"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  ChevronRight,
  Activity,
  RefreshCw,
  Wind,
  Anchor,
  Globe,
  Layers,
} from "lucide-react";
import {
  authFetch,
  formatCurrency,
  timeAgo,
  getInitials,
  formatNumber,
} from "@/lib/api-utils";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

const ShipTrackingMap = dynamic(
  () => import("@/components/dashboard/ShipTrackingMap"),
  { ssr: false }
);

interface ExporterStats {
  totalProducts: number;
  activeOrders: number;
  totalRevenue: number;
  totalShipments: number;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  totalPrice: number;
  orderStatus: string;
  status?: string;
  createdAt: string;
  product: { name: string; category?: string };
  buyer?: { name: string; businessName: string | null; country: string | null };
  importer?: { name: string; businessName: string | null; country: string | null };
}

interface CategoryRevenue {
  category?: string;
  name?: string;
  revenue?: number;
  spent?: number;
  productCount?: number;
  orderCount?: number;
}

interface Partner {
  id: string;
  name: string;
  businessName: string | null;
  country: string | null;
  verified: boolean;
  orderCount: number;
  totalValue: number;
}

interface LiveRoute {
  id: string;
  fromPort: string;
  toPort: string;
  type: "ocean" | "air" | "land";
  status: string;
  vessel?: string;
  cargo?: string;
  lat?: number;
  lng?: number;
  lastLocation?: string;
  importer?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRONICS: "#C4912A",
  MACHINES: "#6B6A66",
  CHEMICALS: "#0B7A57",
  TEXTILES: "#7A560A",
  MEDICAL: "#0B7A57",
  HANDICRAFTS: "#C4912A",
  FOOD: "#B8861A",
  AUTOMOTIVE: "#4A483F",
  CONSTRUCTION: "#6B6A66",
  AGRICULTURE: "#0B7A57",
  OTHER: "#6B6A66",
};

export default function ExporterDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState<ExporterStats | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [categories, setCategories] = useState<CategoryRevenue[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Map state
  type FilterMode = "all" | "russia" | "europe" | "usa" | "africa" | "asia";
  const [mapFilter, setMapFilter] = useState<FilterMode>("all");
  const [apiRoutes, setApiRoutes] = useState<LiveRoute[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const FILTER_CFG: Record<FilterMode, { label: string; color: string; icon: string }> = {
    all: { label: "All Routes", color: "#C4912A", icon: "🌐" },
    russia: { label: "Russia", color: "#C4912A", icon: "🇷🇺" },
    europe: { label: "Europe", color: "#0B7A57", icon: "🇪🇺" },
    usa: { label: "USA", color: "#7A560A", icon: "🇺🇸" },
    africa: { label: "Africa", color: "#C4912A", icon: "🌍" },
    asia: { label: "Asia", color: "#0B7A57", icon: "🌏" },
  };

  useEffect(() => {
    Promise.all([
      authFetch<ExporterStats>("/api/stats?scope=exporter"),
      authFetch<{ orders: OrderItem[] }>("/api/orders?limit=6"),
      authFetch<{ categories: CategoryRevenue[] }>("/api/dashboard/categories"),
      authFetch<{ partners: Partner[] }>("/api/dashboard/directory?role=IMPORTER&limit=5"),
      authFetch<{ routes: LiveRoute[] }>("/api/shipments/active"),
    ])
      .then(([stats, ordersResp, catResp, dirResp, shipmentsResp]) => {
        setData(stats);
        setOrders(ordersResp.orders ?? []);
        setCategories(catResp.categories ?? []);
        setPartners(dirResp.partners ?? []);
        setApiRoutes(shipmentsResp?.routes ?? []);
      })
      .catch((err) => console.error("Exporter Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: t("dashboard_main.total_products", "TOTAL PRODUCTS"),
      value: String(data?.totalProducts ?? 0),
      sub: t("dashboard_main.all_products_label", "ALL PRODUCTS"),
      icon: <Package className="w-5 h-5 text-[#C4912A]" />,
      href: "/dashboard/exporter/inventory",
      bar: Math.min(((data?.totalProducts ?? 0) / 50) * 100, 100) || 75,
      trend: t("status.live", "LIVE"),
      isMint: true,
    },
    {
      label: t("dashboard_main.total_revenue", "TOTAL REVENUE"),
      value: `$${(data?.totalRevenue ?? 0).toLocaleString()}`,
      sub: t("period.all", "ALL TIME"),
      icon: <DollarSign className="w-5 h-5 text-[#C4912A]" />,
      href: "/dashboard/exporter/analytics",
      bar: 65,
      trend: "+12.5%",
      isMint: false,
    },
    {
      label: t("dashboard_main.active_orders", "ACTIVE ORDERS"),
      value: String(data?.activeOrders ?? (data as any)?.totalOrders ?? 0),
      sub: t("dashboard_main.in_progress", "IN PROGRESS"),
      icon: <ShoppingCart className="w-5 h-5 text-[#C4912A]" />,
      href: "/dashboard/exporter/orders",
      bar: Math.min(((data?.activeOrders ?? 0) / 20) * 100, 100) || 60,
      trend: t("status.active", "ACTIVE"),
      isMint: false,
    },
    {
      label: t("dashboard_main.total_shipments", "TOTAL SHIPMENTS"),
      value: String(data?.totalShipments ?? (data as any)?.activeShipments ?? 0),
      sub: t("period.all", "ALL TIME"),
      icon: <Truck className="w-5 h-5 text-[#C4912A]" />,
      href: "/dashboard/exporter/orders",
      bar: 40,
      trend: t("period.all", "ALL TIME"),
      isMint: false,
    },
  ];

  const maxCatRevenue = Math.max(
    ...categories.map((c) => Number(c.revenue || c.spent || 0)),
    1
  );
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* ── Page Header: Title + Subtitle ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] md:text-[34px] font-[800] tracking-tight text-[#15130D]">
              {isAdmin
                ? t("dashboard_main.admin_dashboard", "ADMIN DASHBOARD")
                : t("dashboard_main.exporter_dashboard", "EXPORTER DASHBOARD")}
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-[800] uppercase tracking-wider bg-[#FEE4E2] text-[#B42318] border border-[#B42318]/20">
                <span className="size-1.5 rounded-full bg-[#B42318]" />
                {t("dashboard_main.admin_mode", "ADMIN MODE")}
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B6A66] mt-1">
            {isAdmin
              ? t("dashboard_main.admin_subtitle", "Platform oversight, system telemetry, and administrative control center.")
              : t("dashboard_main.exporter_subtitle", "Global trade network, active shipments, and real-time order transmissions.")}
          </p>
        </div>
      </div>

      {/* ── 4 KPI Cards: White to #FFFBF0 gradient, 1px #F0ECE0 border, radius 24, soft shadow ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 cursor-pointer block group"
            style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center transition-transform group-hover:scale-105">
                {s.icon}
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-[700] uppercase tracking-wider",
                  s.isMint
                    ? "bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20"
                    : "bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]"
                )}
              >
                {s.isMint && <span className="size-1.5 rounded-full bg-[#0B7A57] animate-pulse" />}
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

      {/* ── Trade Network Map + Real-time Transmissions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_1fr] gap-[20px]">
        {/* Map Card */}
        <div
          className="border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm flex flex-col h-[520px] overflow-hidden"
          style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0]">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#C4912A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-[800] text-[#15130D]">
                    {t("dashboard_main.global_trade_network", "India Global Trade Network")}
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-[700] uppercase tracking-wider border ${
                    apiRoutes.length > 0
                      ? "bg-[#E2F5EE] text-[#0B7A57] border-[#0B7A57]/20"
                      : "bg-[#F7F5F0] text-[#6B6A66] border-[#ECE7DA]"
                  }`}>
                    <span className={`size-1.5 rounded-full ${apiRoutes.length > 0 ? "bg-[#0B7A57] animate-pulse" : "bg-[#6B6A66]"}`} />
                    {apiRoutes.length > 0 ? t("status.live", "LIVE") : t("status.standby", "STANDBY")}
                  </span>
                </div>
                <p className="text-xs text-[#6B6A66] mt-0.5">
                  {apiRoutes.length > 0
                    ? `${apiRoutes.length} ${t("dashboard_main.active_routes", "Active Routes")}`
                    : t("dashboard_main.no_active_routes", "0 Active Routes")}
                </p>
              </div>
            </div>

            {/* Map Filters - Normal case 13px / 600 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.entries(FILTER_CFG) as [FilterMode, typeof FILTER_CFG[FilterMode]][]).map(
                ([mode, cfg]) => {
                  const isActive = mapFilter === mode;
                  const labelText = mode === "all" ? t("filter.all", "All") : t(`dashboard_main.hub_regions.${mode}`, cfg.label);
                  return (
                    <button
                      key={mode}
                      onClick={() => setMapFilter(mode)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-[13px] font-[600] transition-all",
                        isActive
                          ? "bg-[#15130D] text-white shadow-sm"
                          : "bg-[#F7F5F0] text-[#6B6A66] hover:bg-[#ECE7DA]/60 border border-[#ECE7DA]"
                      )}
                    >
                      {labelText}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden rounded-[18px] mt-4 border border-[#F0ECE0]">
            <ShipTrackingMap filter={mapFilter} routes={apiRoutes} />
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-[#6B6A66] flex-wrap">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#C4912A]" /> {t("dashboard_main.india_export_hubs", "India Export Hubs")}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#0B7A57]" /> {t("dashboard_main.destination_ports", "Destination Ports")}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#D97706] animate-pulse" /> {t("dashboard_main.telemetry_active", "Active Telemetry / Vessels")}
            </span>
          </div>
        </div>

        {/* Transmissions Card */}
        <div
          className="border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm flex flex-col h-[520px]"
          style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0]">
            <div>
              <h2 className="text-sm font-[800] text-[#15130D] uppercase tracking-wider">
                {t("dashboard_main.transmissions", "TRANSMISSIONS")}
              </h2>
              <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                {t("dashboard_main.realtime_stream", "REAL-TIME STREAM")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-[700] uppercase tracking-wider bg-[#E2F5EE] text-[#0B7A57] border border-[#0B7A57]/20">
              <Activity className="size-3 animate-pulse" />
              {t("status.live", "LIVE")}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mt-4 custom-scrollbar pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-[16px] bg-[#FBF1D6] animate-pulse border border-[#ECE7DA]"
                />
              ))
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
                <p className="text-xs font-[700] uppercase tracking-wider text-[#6B6A66]">
                  {t("dashboard_main.no_transmissions", "No transmissions yet")}
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/exporter/orders`}
                  className="flex items-center justify-between p-3.5 rounded-[16px] bg-white hover:bg-[#FFFBF2] border border-[#F0ECE0] hover:border-[#C4912A]/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-[12px] bg-[#FBF1D6] text-[#7A560A] font-extrabold flex items-center justify-center text-xs shrink-0">
                      {getInitials(order.product?.name || "Order")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#15130D] truncate group-hover:text-[#C4912A] transition-colors">
                        {order.product?.name || "Product Order"}
                      </p>
                      <p className="text-[10px] font-medium text-[#6B6A66] mt-0.5">
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-[#15130D]">
                      {formatCurrency(order.totalPrice)}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#F7F5F0] text-[#6B6A66] border border-[#ECE7DA]">
                      {order.orderStatus || order.status || t("status.confirmed", "CONFIRMED")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/dashboard/exporter/orders"
            className="mt-4 w-full h-11 bg-[#FBF1D6] hover:bg-[#F5E6BF] text-[#7A560A] font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2"
          >
            <span>{t("dashboard_main.view_all_transmissions", "View All Transmissions")}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Sector Revenue & Strategic Nodes Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
        {/* Sector Revenue */}
        <div
          className="border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm"
          style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0] mb-6">
            <div>
              <h2 className="text-sm font-[800] text-[#15130D] uppercase tracking-wider">
                {t("dashboard_main.sector_revenue", "SECTOR REVENUE")}
              </h2>
              <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                {t("dashboard_main.distribution_by_industry", "DISTRIBUTION BY INDUSTRY")}
              </p>
            </div>
            <Link
              href="/dashboard/exporter/analytics"
              className="text-xs font-bold text-[#7A560A] hover:text-[#C4912A] flex items-center gap-1"
            >
              {t("sidebar.analytics", "Analytics")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-5">
            {categories.length === 0 ? (
              <p className="text-xs text-[#6B6A66] py-6 text-center">
                No sector revenue recorded yet.
              </p>
            ) : (
              categories.slice(0, 5).map((c, idx) => {
                const catName = c?.category || c?.name || "General";
                const catRevenue = Number(c?.revenue || c?.spent || 0);
                const pct = maxCatRevenue > 0 ? Math.round((catRevenue / maxCatRevenue) * 100) : 0;
                return (
                  <div key={c?.category || c?.name || idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#15130D] uppercase tracking-wider">
                        {String(catName || "").replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-[#7A560A]">
                        {formatCurrency(catRevenue)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#F0ECE0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 5)}%`,
                          background: `linear-gradient(90deg, #C4912A 0%, #EBC964 100%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Strategic Nodes */}
        <div
          className="border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm"
          style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0] mb-4">
            <div>
              <h2 className="text-sm font-[800] text-[#15130D] uppercase tracking-wider">
                {t("dashboard_main.strategic_nodes", "STRATEGIC NODES")}
              </h2>
              <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
                {t("dashboard_main.verified_counterparts", "VERIFIED GLOBAL COUNTERPARTS")}
              </p>
            </div>
            <Link
              href="/dashboard/exporter/directory"
              className="text-xs font-bold text-[#7A560A] hover:text-[#C4912A] flex items-center gap-1"
            >
              {t("dashboard_main.directory", "Directory")} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F0ECE0] pb-2 text-[10px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66]">
                  <th className="pb-3">{t("dashboard_main.buyer_entity", "Buyer Entity")}</th>
                  <th className="pb-3">{t("dashboard_main.country", "Country")}</th>
                  <th className="pb-3">{t("dashboard_main.orders", "Orders")}</th>
                  <th className="pb-3 text-right">{t("dashboard_main.value", "Value")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE0] text-xs">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#6B6A66]">
                      No buyers registered yet.
                    </td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FFFBF2] transition-colors">
                      <td className="py-3 font-bold text-[#15130D]">
                        {p.businessName || p.name}
                      </td>
                      <td className="py-3 text-[#6B6A66]">{p.country || "Global"}</td>
                      <td className="py-3 font-semibold text-[#15130D]">{p.orderCount}</td>
                      <td className="py-3 text-right font-bold text-[#7A560A]">
                        {formatCurrency(p.totalValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
