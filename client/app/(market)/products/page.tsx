import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractTaxonomyFromProducts, getPrismaMarketFilters, extractProductMeta } from "@/lib/categories";
import EmptyState from "@/components/ui/EmptyState";
import ImporterSidebar from "@/components/importer/ImporterSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardScaler } from "@/components/dashboard/DashboardScaler";
import PageTransition from "@/components/ui/PageTransition";
import { getServerAuthContext } from "@/lib/auth-server";
import { isB2CActive } from "@/lib/trade-mode";
import AddToCartButton from "@/components/marketplace/AddToCartButton";

export const dynamic = "force-dynamic";

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const start = Date.now();
  console.log("[Products Page] Starting render at:", new Date(start).toLocaleTimeString());

  const categoryParam = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined;
  const subCategoryParam = typeof resolvedParams.subCategory === "string" ? resolvedParams.subCategory : undefined;
  const companyParam = typeof resolvedParams.company === "string" 
    ? resolvedParams.company 
    : (typeof resolvedParams.brand === "string" ? resolvedParams.brand : undefined);
  const searchQuery = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
  const originParam = typeof resolvedParams.origin === "string" ? resolvedParams.origin : undefined;
  const minPriceParam = typeof resolvedParams.minPrice === "string" ? parseFloat(resolvedParams.minPrice) : undefined;
  const maxPriceParam = typeof resolvedParams.maxPrice === "string" ? parseFloat(resolvedParams.maxPrice) : undefined;
  const sortParam = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "newest";
  const page = typeof resolvedParams.page === "string" ? Math.max(1, parseInt(resolvedParams.page)) : 1;
  const limit = 30;

  const auth = await getServerAuthContext();
  const role = auth?.role || "USER";
  const b2cActive = isB2CActive();

  // Build Prisma where clause with Category, SubCategory & Company
  const where: Prisma.ProductWhereInput = { available: true };

  const marketFilter = getPrismaMarketFilters({
    categoryParam,
    subCategoryParam,
    companyParam,
  });
  if (marketFilter && Object.keys(marketFilter).length > 0) {
    Object.assign(where, marketFilter);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    where.OR = [
      { name: { contains: searchQuery.trim(), mode: "insensitive" } },
      { description: { contains: searchQuery.trim(), mode: "insensitive" } },
    ];
  }

  if (originParam && originParam.trim().length > 0) {
    where.originCountry = { contains: originParam.trim(), mode: "insensitive" };
  }

  if (minPriceParam && !isNaN(minPriceParam)) {
    where.price = { ...(where.price as Record<string, number> || {}), gte: minPriceParam };
  }
  if (maxPriceParam && !isNaN(maxPriceParam)) {
    where.price = { ...(where.price as Record<string, number> || {}), lte: maxPriceParam };
  }

  // Sort
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sortParam === "price_asc") orderBy = { price: "asc" };
  else if (sortParam === "price_desc") orderBy = { price: "desc" };
  else if (sortParam === "name") orderBy = { name: "asc" };

  type ProductWithExporter = {
    id: string;
    name: string;
    price: number;
    regularPrice: number;
    originCountry: string;
    category: string;
    certifications?: string[];
    images: string[];
    stockQty: number;
    unit: string;
    exporter: { name: string | null; businessName: string | null; country: string | null };
    reviews: { rating: number }[];
  };
  let products: ProductWithExporter[] = [];
  let total = 0;
  let allProductCategories: Array<{ id?: string; name?: string | null; category?: string | null; certifications?: string[] | null }> = [];

  try {
    const [fetchedProducts, fetchedTotal, fetchedCategories] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          price: true,
          regularPrice: true,
          originCountry: true,
          category: true,
          certifications: true,
          images: true,
          stockQty: true,
          unit: true,
          exporter: { select: { name: true, businessName: true, country: true } },
        } as any,
      }) as unknown as Promise<ProductWithExporter[]>,
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: { available: true },
        select: { id: true, name: true, category: true, certifications: true },
      })
    ]);

    products = fetchedProducts;
    total = fetchedTotal;
    allProductCategories = fetchedCategories || [];

    products = products.map((p) => ({
      ...p,
      price: role === "IMPORTER" ? p.price : (p.regularPrice || p.price),
      reviews: []
    }));
  } catch (error) {
    console.error("Failed to fetch products from Prisma:", error);
    products = [];
  }

  const end = Date.now();
  console.log(`[Products Page] Rendered ${products.length} products in ${end - start}ms`);

  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: categoryParam,
      subCategory: subCategoryParam,
      company: companyParam,
      search: searchQuery,
      origin: originParam,
      minPrice: minPriceParam?.toString(),
      maxPrice: maxPriceParam?.toString(),
      sort: sortParam !== "newest" ? sortParam : undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  // Extract full taxonomy from products
  const taxonomy = extractTaxonomyFromProducts(allProductCategories);
  const visibleCategories = taxonomy.categories;
  
  // Filter sub-categories relevant to active category or all
  const relevantSubCategories = categoryParam 
    ? taxonomy.subCategories.filter(s => s.categoryKey.toUpperCase() === categoryParam.toUpperCase())
    : taxonomy.subCategories;

  const relevantCompanies = taxonomy.companies;
  const hasActiveFilters = Boolean(categoryParam || subCategoryParam || companyParam || searchQuery || originParam);

  return (
    <SidebarProvider className="fixed inset-0 z-40 bg-board">
      <DashboardScaler targetWidth={1440}>
        <div className="flex flex-col h-full w-full bg-board transition-colors duration-300 overflow-hidden shadow-2xl relative">
          <div className="flex-shrink-0 z-50 w-full bg-board border-b border-border/50 dark:border-white/10 shadow-sm relative">
            <DashboardHeader />
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            <ImporterSidebar basePath="/dashboard/importer">
              <div className="flex flex-col py-2 space-y-6">
                
                {/* Active Filters Clear Bar */}
                {hasActiveFilters && (
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Filters</span>
                      <Link
                        href="/products"
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        Clear All
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {categoryParam && (
                        <Link
                          href={buildUrl({ category: undefined, subCategory: undefined, page: undefined })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          {categoryParam.replace("CUSTOM_CAT:", "")} <span className="text-slate-400">×</span>
                        </Link>
                      )}
                      {subCategoryParam && (
                        <Link
                          href={buildUrl({ subCategory: undefined, page: undefined })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border text-[10px] font-medium text-blue-700 dark:text-blue-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          {subCategoryParam} <span className="text-slate-400">×</span>
                        </Link>
                      )}
                      {companyParam && (
                        <Link
                          href={buildUrl({ company: undefined, page: undefined })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border text-[10px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          {companyParam} <span className="text-slate-400">×</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Categories Section */}
                <div>
                  <div className="mb-2 flex items-center justify-between py-1 rounded-lg">
                    <h3 className="font-headline font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Categories</h3>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <Link
                      href={buildUrl({ category: undefined, subCategory: undefined, page: undefined })}
                      className={`flex items-center justify-between px-2 py-2 rounded-lg transition-all group ${!categoryParam ? "bg-primary/5 text-primary font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-primary"}`}
                    >
                      <div className="flex items-center min-w-0">
                        <span className="material-symbols-outlined mr-3 text-[20px]">auto_awesome</span>
                        <span className="font-headline font-semibold text-sm uppercase tracking-tight truncate">All Products</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{allProductCategories.length}</span>
                    </Link>

                    {visibleCategories.map((cat) => {
                      const isActive = categoryParam === cat.key;
                      return (
                        <Link
                          key={cat.key}
                          href={buildUrl({ category: isActive ? undefined : cat.key, subCategory: undefined, page: undefined })}
                          className={`flex items-center justify-between px-2 py-2 rounded-lg transition-all group ${isActive ? "bg-primary/5 text-primary font-bold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          <div className="flex items-center min-w-0">
                            <span className="material-symbols-outlined mr-3 text-[20px]">{cat.icon}</span>
                            <span className="font-headline font-semibold text-sm uppercase tracking-tight truncate">{cat.label}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono ml-2">{cat.count}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Categories Section (if any exist) */}
                {relevantSubCategories.length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="mb-2 flex items-center justify-between py-1 rounded-lg">
                      <h3 className="font-headline font-semibold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">layers</span> Sub-Categories
                      </h3>
                      {subCategoryParam && (
                        <Link href={buildUrl({ subCategory: undefined, page: undefined })} className="text-[9px] text-primary hover:underline">
                          Clear
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {relevantSubCategories.map((sub) => {
                        const isActive = subCategoryParam === sub.name;
                        return (
                          <Link
                            key={sub.name}
                            href={buildUrl({ subCategory: isActive ? undefined : sub.name, page: undefined })}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${
                              isActive 
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900"
                            }`}
                          >
                            <span className="truncate">{sub.name}</span>
                            <span className="text-[10px] opacity-70 ml-1.5 font-mono">{sub.count}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Companies / Brands Section (if any exist) */}
                {relevantCompanies.length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="mb-2 flex items-center justify-between py-1 rounded-lg">
                      <h3 className="font-headline font-semibold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">apartment</span> Brands / Companies
                      </h3>
                      {companyParam && (
                        <Link href={buildUrl({ company: undefined, page: undefined })} className="text-[9px] text-primary hover:underline">
                          Clear
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {relevantCompanies.map((comp) => {
                        const isActive = companyParam === comp.name;
                        return (
                          <Link
                            key={comp.name}
                            href={buildUrl({ company: isActive ? undefined : comp.name, page: undefined })}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${
                              isActive 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" 
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900"
                            }`}
                          >
                            <span className="truncate">{comp.name}</span>
                            <span className="text-[10px] opacity-70 ml-1.5 font-mono">{comp.count}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </ImporterSidebar>
            
            <SidebarInset className="overflow-hidden">
              <div className="w-full h-full overflow-y-auto custom-scrollbar bg-surface">
                <PageTransition>
                  <div className="w-full px-0 py-2 sm:py-4 md:py-6 lg:px-4">
                  
                    {/* ─── Product Grid ─── */}
                    <div className="w-full">
                      {products.length === 0 ? (
                        <div className="py-20 text-center">
                          <EmptyState
                            iconName="searchX"
                            title="No Listings Found"
                            description="We couldn't find any products matching your current category, sub-category, or company filters. Try broadening your selection."
                            actionLabel="Clear all filters"
                            href="/products"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-t border-l border-border/50">
                          {products.map((product) => {
                            const image = product.images?.[0] ?? null;
                            const meta = extractProductMeta(product);
                            const reviewsCount = product.reviews?.length || 0;
                            const averageRating = reviewsCount > 0 
                              ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount 
                              : 0;
                            const ratingDisplay = averageRating > 0 ? averageRating.toFixed(1) : "0.0";
                            const fullStars = Math.floor(averageRating);
                            const hasHalfStar = averageRating - fullStars >= 0.5;

                            return (
                              <div key={product.id} className="group relative bg-white dark:bg-card p-2 md:p-3 hover:shadow-md transition-shadow duration-300 border-r border-b border-border/50 flex flex-col justify-between">
                                <div>
                                  {/* Wishlist Heart */}
                                  <div className="absolute top-2 right-2 z-10 cursor-pointer p-1 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                    <span className="material-symbols-outlined text-gray-400 hover:text-red-500 transition-colors text-[20px] md:text-[22px]">favorite_border</span>
                                  </div>

                                  <Link href={`/products/${product.id}`} className="block">
                                    {/* Card Image */}
                                    <div className="relative mb-2 overflow-hidden bg-transparent aspect-square flex items-center justify-center">
                                      {image ? (
                                        <Image
                                          src={image}
                                          alt={product.name}
                                          fill
                                          sizes="(max-width:640px) 100vw,(max-width:1280px) 50vw,33vw"
                                          className="object-contain transition-transform duration-700 group-hover:scale-105"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                          <span className="material-symbols-outlined text-6xl">inventory_2</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Brand & Subcategory Badges */}
                                    <div className="flex flex-wrap items-center gap-1 mb-1">
                                      {meta.company ? (
                                        <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] md:text-[10px] rounded font-bold border border-emerald-200 dark:border-emerald-800">
                                          {meta.company}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] md:text-[11px] text-[#2874f0] dark:text-blue-400 font-semibold">#BestSeller</span>
                                      )}

                                      {meta.subCategory && (
                                        <span className="inline-block bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[9px] md:text-[10px] rounded font-medium border border-blue-200 dark:border-blue-800 truncate max-w-[120px]">
                                          {meta.subCategory}
                                        </span>
                                      )}
                                    </div>

                                    {/* Card Body */}
                                    <div>
                                      <h2 className="text-[11px] sm:text-xs md:text-sm font-medium text-foreground/90 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                        {product.name}
                                      </h2>
                                      
                                      {/* Ratings */}
                                      <div className="flex items-center gap-1 mt-1.5">
                                        <div className="flex items-center text-[#388e3c]">
                                          {[...Array(5)].map((_, i) => {
                                            if (i < fullStars) return <span key={i} className="material-symbols-outlined text-[12px] md:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>;
                                            if (i === fullStars && hasHalfStar) return <span key={i} className="material-symbols-outlined text-[12px] md:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>;
                                            return <span key={i} className="material-symbols-outlined text-[12px] md:text-[14px]">star</span>;
                                          })}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground ml-0.5">({ratingDisplay})</span>
                                        {averageRating >= 4.5 && (
                                          <span className="ml-1 bg-green-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wider">Top</span>
                                        )}
                                      </div>

                                      {/* Price or B2B Wholesale Indicator */}
                                      {b2cActive ? (
                                        <>
                                          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                                            {product.regularPrice > product.price ? (
                                              <>
                                                <span className="text-[#388e3c] font-bold text-xs md:text-sm">
                                                  ↓{Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)}%
                                                </span>
                                                <span className="text-muted-foreground line-through text-xs md:text-sm">
                                                  {formatMoney(product.regularPrice)}
                                                </span>
                                              </>
                                            ) : null}
                                            <span className="font-bold text-sm md:text-base text-foreground">
                                              {formatMoney(product.price)}
                                            </span>
                                          </div>

                                          <div className="mt-1.5">
                                            <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 text-[9px] md:text-[10px] rounded font-semibold border border-green-200 dark:border-green-800">
                                              Hot Deal
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="mt-2 pt-1.5 border-t border-border/40">
                                          <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                                              <span className="material-symbols-outlined text-[13px]">request_quote</span>
                                              Wholesale Quote
                                            </span>
                                            {product.price > 0 ? (
                                              <span className="text-[11px] text-foreground font-bold font-mono">
                                                Ref ${product.price}
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-muted-foreground font-mono">On Demand</span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                </div>

                                {!b2cActive && (
                                  <div className="mt-3 pt-1">
                                    <AddToCartButton
                                      productId={product.id}
                                      quantity={1}
                                      label="Add to Quote"
                                      className="w-full h-8 text-[11px] font-bold rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all shadow-none"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-20">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Link
                              key={p}
                              href={buildUrl({ page: p.toString() })}
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-headline font-bold transition-all ${p === page ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground"}`}
                            >
                              {p}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PageTransition>
              </div>
            </SidebarInset>
          </div>
        </div>
      </DashboardScaler>
    </SidebarProvider>
  );
}
