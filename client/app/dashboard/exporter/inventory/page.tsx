export const dynamic = 'force-dynamic';
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Package, TrendingUp, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { Prisma } from "@prisma/client";
import { createAdminClient } from "@/lib/supabase/server";
import InventoryTable from "./InventoryTable";

const CATEGORY_MAP: Record<string, string> = {
  'CHEMICALS': 'Chemicals',
  'MACHINES': 'Machines',
  'TEXTILES': 'Textiles',
  'MEDICAL': 'Medical',
  'ELECTRONICS': 'Electronics',
  'AGRICULTURE': 'Agri',
  'CONSTRUCTION': 'Construction',
  'HANDICRAFTS': 'Handicrafts',
  'FOOD': 'Food',
  'AUTOMOTIVE': 'Automotive',
  'COSMETICS': 'Cosmetics',
  'PLASTICS': 'Plastics',
  'ENERGY': 'Energy',
  'LOGISTICS': 'Logistics',
  'PACKAGING': 'Packaging',
  'METALS': 'Metals',
  'LEATHER': 'Leather',
  'FURNITURE': 'Furniture',
  'TOYS': 'Toys',
  'SPORTS': 'Sports',
  'OTHER': 'Other',
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
}

export default async function ExporterInventoryPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; status?: string; page?: string };
}) {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login");
  if (auth.role !== "EXPORTER" && auth.role !== "ADMIN") {
    redirect(`/dashboard/${auth.role.toLowerCase()}`);
  }

  const page = parseInt(searchParams.page || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = auth.role === "ADMIN" ? {} : { exporterId: auth.userId };

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  if (searchParams.category) {
    const prismaCat = CATEGORY_MAP[searchParams.category] || searchParams.category;
    where.category = prismaCat as any;
  }

  if (searchParams.status === "ACTIVE") {
    where.available = true;
  } else if (searchParams.status === "INACTIVE") {
    where.available = false;
  }

  let products: any[] = [];
  let total = 0;
  let categoriesData: Array<{ name: string; productCount: number; revenue: number }> = [];
  let totalListed = 0;
  let totalAvailable = 0;
  let totalValue = 0;

  try {
    const supabase = createAdminClient();

    // 1. Fetch summary stats for all exporter products over HTTPS REST (instant ~15ms)
    let summaryQuery = supabase
      .from("products")
      .select("id, category, available, price, minOrderQty")
      .is("deletedAt", null);

    if (auth.role !== "ADMIN") {
      summaryQuery = summaryQuery.eq("exporterId", auth.userId);
    }

    const { data: allSummary } = await summaryQuery;

    if (allSummary) {
      totalListed = allSummary.length;
      totalAvailable = allSummary.filter((p: any) => p.available).length;
      totalValue = allSummary.reduce(
        (acc: number, p: any) => acc + (Number(p.price) || 0) * (Number(p.minOrderQty) || 1),
        0
      );

      const catMap = new Map<string, number>();
      allSummary.forEach((p: any) => {
        if (p.category) {
          catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
        }
      });

      categoriesData = Array.from(catMap.entries()).map(([name, productCount]) => ({
        name,
        productCount,
        revenue: 0,
      }));
    }

    // 2. Paginated and filtered inventory query over HTTPS REST
    let invQuery = supabase
      .from("products")
      .select("*", { count: "exact" })
      .is("deletedAt", null);

    if (auth.role !== "ADMIN") {
      invQuery = invQuery.eq("exporterId", auth.userId);
    }

    if (searchParams.search && searchParams.search.trim()) {
      const q = searchParams.search.trim();
      invQuery = invQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (searchParams.category) {
      const prismaCat = CATEGORY_MAP[searchParams.category] || searchParams.category;
      invQuery = invQuery.eq("category", prismaCat);
    }

    if (searchParams.status === "ACTIVE") {
      invQuery = invQuery.eq("available", true);
    } else if (searchParams.status === "INACTIVE") {
      invQuery = invQuery.eq("available", false);
    }

    invQuery = invQuery.order("createdAt", { ascending: false }).range(skip, skip + limit - 1);

    const { data: invProducts, count: invCount } = await invQuery;

    if (invProducts) {
      products = invProducts.map((p: any) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : [],
        certifications: Array.isArray(p.certifications) ? p.certifications : [],
      }));
      total = invCount ?? products.length;
    }
  } catch (err: any) {
    console.error("[Inventory Page] Supabase fetch error:", err?.message);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      {/* ── Page Header: Title + Subtitle + Action Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D] uppercase">
            Inventory Management
          </h1>
          <p className="text-sm text-[#6B6A66] mt-1">
            Manage your product listings, stock levels, and marketplace presence from a single dashboard.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/exporter/inventory/add"
            className="h-11 px-6 rounded-full bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-bold text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(196,145,42,0.25)] hover:shadow-[0_6px_20px_rgba(196,145,42,0.35)] transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#15130D]" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* ── Stats Cards: White to #FFFBF0 gradient, 1px #F0ECE0 border, radius 24 ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {[
          { label: "TOTAL PRODUCTS", value: String(totalListed), icon: Package, sub: "ALL LISTINGS" },
          { label: "ACTIVE LISTINGS", value: String(totalAvailable), icon: ShieldCheck, sub: "READY FOR EXPORT" },
          { label: "INVENTORY VALUE", value: formatMoney(totalValue), icon: TrendingUp, sub: "ESTIMATED ASSET YIELD" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-5"
          >
            <div className="size-14 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
              <s.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                {s.label}
              </p>
              <p className="text-[36px] md:text-[40px] font-extrabold leading-none text-[#15130D] tracking-tight mt-1">
                {s.value}
              </p>
              <p className="text-[10px] font-semibold text-[#6B6A66] uppercase tracking-wider mt-1.5">
                {s.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Catalog Table Card ── */}
      <div className="bg-gradient-to-b from-white to-[#FFFBF0] rounded-[24px] border border-[#F0ECE0] shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0]">
          <div>
            <h2 className="text-sm font-extrabold text-[#15130D] uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C4912A]" />
              Product Catalog
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mt-0.5">
              {total} TOTAL ITEMS IN SYSTEM
            </p>
          </div>
        </div>

        <InventoryTable
          products={products}
          availableCategories={categoriesData.map((c) => c.name)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-[#F0ECE0]">
            <Link
              href={`?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() })}`}
              className={`h-10 px-4 rounded-full border border-[#ECE7DA] text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                page <= 1 ? "opacity-30 pointer-events-none" : "hover:bg-[#FBF1D6] text-[#7A560A]"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </Link>

            <div className="flex items-center gap-1.5 mx-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isCurrent = page === p;
                return (
                  <Link
                    key={p}
                    href={`?${new URLSearchParams({ ...searchParams, page: p.toString() })}`}
                    className={`size-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] shadow-sm"
                        : "border border-[#ECE7DA] text-[#6B6A66] hover:bg-[#FBF1D6] hover:text-[#7A560A]"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            <Link
              href={`?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() })}`}
              className={`h-10 px-4 rounded-full border border-[#ECE7DA] text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                page >= totalPages ? "opacity-30 pointer-events-none" : "hover:bg-[#FBF1D6] text-[#7A560A]"
              }`}
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
