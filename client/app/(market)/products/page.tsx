import Image from "next/image";
import Link from "next/link";
import { extractTaxonomyFromProducts, extractProductMeta } from "@/lib/categories";
import EmptyState from "@/components/ui/EmptyState";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar";
import PageTransition from "@/components/ui/PageTransition";
import { getServerAuthContext } from "@/lib/auth-server";
import { isB2CActive } from "@/lib/trade-mode";
import AddToCartButton from "@/components/marketplace/AddToCartButton";
import WishlistButton from "@/components/marketplace/WishlistButton";
import MarketplaceSortSelect from "@/components/marketplace/MarketplaceSortSelect";
import MarketplaceFilterToggle from "@/components/marketplace/MarketplaceFilterToggle";
import { getMarketplaceProducts, ProductWithExporter } from "@/lib/products-server";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

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

  const { products, total, allProductCategories } = await getMarketplaceProducts({
    categoryParam,
    subCategoryParam,
    companyParam,
    searchQuery,
    originParam,
    minPriceParam,
    maxPriceParam,
    sortParam,
    page,
    limit,
    role,
  });

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
  
  const hasActiveFilters = Boolean(categoryParam || subCategoryParam || companyParam || searchQuery || originParam);

  // Active Category Name
  const activeCategoryItem = visibleCategories.find((c) => c.key === categoryParam);
  const categoryDisplayName = activeCategoryItem
    ? activeCategoryItem.label
    : categoryParam
    ? String(categoryParam).replace("CUSTOM_CAT:", "")
    : "All Products";

  const activeFilterCount =
    Number(Boolean(categoryParam)) +
    Number(Boolean(subCategoryParam)) +
    Number(Boolean(companyParam)) +
    Number(Boolean(searchQuery)) +
    Number(Boolean(originParam));

  return (
    <SidebarProvider>
      <div className="app h-screen flex flex-col bg-[#F4F4F7] overflow-hidden" style={{ height: "100vh" }}>
        <DashboardHeader />

        <div className="body flex-1 min-h-0 flex relative">
          <Sidebar className="bg-transparent border-none">
            <SidebarContent className="bg-transparent px-3 pt-3 no-scrollbar overflow-y-auto">
              <div className="flex flex-col py-2 space-y-6">
              {/* Active Filters Clear Bar */}
              {hasActiveFilters && (
                <div className="p-2.5 rounded-[14px] bg-[#FFFBF2] border border-[#ECE7DA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-[800] uppercase tracking-wider text-[#7A560A]">
                      Active Filters
                    </span>
                    <Link
                      href="/products"
                      className="text-[10px] font-[700] text-[#7A560A] hover:underline"
                    >
                      Clear All
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {categoryParam && (
                      <Link
                        href={buildUrl({ category: undefined, subCategory: undefined, page: undefined })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#ECE7DA] text-[10px] font-[700] text-[#15130D] hover:bg-[#FEE4E2] hover:text-[#B42318] transition-colors"
                      >
                        {String(categoryParam).replace("CUSTOM_CAT:", "")} <span className="text-[#6B6A66]">×</span>
                      </Link>
                    )}
                    {subCategoryParam && (
                      <Link
                        href={buildUrl({ subCategory: undefined, page: undefined })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#ECE7DA] text-[10px] font-[700] text-[#7A560A] hover:bg-[#FEE4E2] hover:text-[#B42318] transition-colors"
                      >
                        {subCategoryParam} <span className="text-[#6B6A66]">×</span>
                      </Link>
                    )}
                    {companyParam && (
                      <Link
                        href={buildUrl({ company: undefined, page: undefined })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#ECE7DA] text-[10px] font-[700] text-[#0B7A57] hover:bg-[#FEE4E2] hover:text-[#B42318] transition-colors"
                      >
                        {companyParam} <span className="text-[#6B6A66]">×</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Categories Section */}
              <div>
                <div className="mb-2 px-1">
                  <h3 className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66]">
                    CATEGORIES
                  </h3>
                </div>

                <div className="flex flex-col space-y-[2px]">
                  {/* All Products row */}
                  <Link
                    href={buildUrl({ category: undefined, subCategory: undefined, page: undefined })}
                    className={cn(
                      "h-[44px] px-[14px] py-[10px] rounded-[14px] text-[15px] font-[600] flex items-center justify-between transition-colors",
                      !categoryParam
                        ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                        : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                    )}
                  >
                    <div className="flex items-center min-w-0 gap-2.5">
                      <span className={cn("material-symbols-outlined text-[18px]", !categoryParam ? "text-[#C4912A]" : "text-[#6B6A66]")}>
                        auto_awesome
                      </span>
                      <span className="truncate">All Products</span>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-[700] px-2 py-0.5 rounded-full transition-colors",
                        !categoryParam
                          ? "bg-white text-[#7A560A] shadow-sm"
                          : "bg-[#E9E8EE] text-[#4A483F]"
                      )}
                    >
                      {allProductCategories.length}
                    </span>
                  </Link>

                  {/* Individual Categories */}
                  {visibleCategories.map((cat) => {
                    const isActive = Boolean(
                      categoryParam &&
                        (categoryParam.toLowerCase() === cat.key.toLowerCase() ||
                          categoryParam.replace("CUSTOM_CAT:", "").toLowerCase() ===
                            cat.key.replace("CUSTOM_CAT:", "").toLowerCase())
                    );

                    // Sub-categories and brands belonging strictly to this category
                    const catSubCategories = taxonomy.subCategories.filter(
                      (s) =>
                        s.categoryKey.toLowerCase() === cat.key.toLowerCase() ||
                        s.categoryKey.replace("CUSTOM_CAT:", "").toLowerCase() ===
                          cat.key.replace("CUSTOM_CAT:", "").toLowerCase()
                    );

                    const catCompanies = taxonomy.companies.filter(
                      (c) =>
                        c.categoryKey.toLowerCase() === cat.key.toLowerCase() ||
                        c.categoryKey.replace("CUSTOM_CAT:", "").toLowerCase() ===
                          cat.key.replace("CUSTOM_CAT:", "").toLowerCase()
                    );

                    const hasChildren = catSubCategories.length > 0 || catCompanies.length > 0;

                    return (
                      <div key={cat.key} className="flex flex-col">
                        <Link
                          href={buildUrl({
                            category: isActive ? undefined : cat.key,
                            subCategory: undefined,
                            company: undefined,
                            page: undefined,
                          })}
                          className={cn(
                            "h-[44px] px-[14px] py-[10px] rounded-[14px] text-[15px] font-[600] flex items-center justify-between transition-colors",
                            isActive
                              ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                              : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                          )}
                        >
                          <div className="flex items-center min-w-0 gap-2.5">
                            <span
                              className={cn(
                                "material-symbols-outlined text-[18px]",
                                isActive ? "text-[#C4912A]" : "text-[#6B6A66]"
                              )}
                            >
                              {cat.icon}
                            </span>
                            <span className="truncate">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={cn(
                                "text-[11px] font-[700] px-2 py-0.5 rounded-full transition-colors",
                                isActive
                                  ? "bg-white text-[#7A560A] shadow-sm"
                                  : "bg-[#E9E8EE] text-[#4A483F]"
                              )}
                            >
                              {cat.count}
                            </span>
                            {hasChildren && (
                              <span
                                className={cn(
                                  "material-symbols-outlined text-[16px] transition-transform",
                                  isActive ? "rotate-90 text-[#7A560A]" : "text-[#9E9B90]"
                                )}
                              >
                                chevron_right
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Nested Sub-Categories and Brands directly under the selected category */}
                        {isActive && hasChildren && (
                          <div className="ml-3 pl-3 border-l-2 border-[#E7DFCE] dark:border-white/10 my-1.5 space-y-3 py-1 animate-in fade-in duration-200">
                            {/* Category Sub-Categories */}
                            {catSubCategories.length > 0 && (
                              <div>
                                <div className="mb-1 px-1 flex items-center justify-between">
                                  <span className="text-[10px] font-[800] uppercase tracking-[0.14em] text-[#8C8270] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">layers</span>
                                    Sub-Categories
                                  </span>
                                  {subCategoryParam && (
                                    <Link
                                      href={buildUrl({ subCategory: undefined, page: undefined })}
                                      className="text-[10px] font-[700] text-[#7A560A] hover:underline"
                                    >
                                      Clear
                                    </Link>
                                  )}
                                </div>

                                <div className="flex flex-col space-y-[2px] max-h-48 overflow-y-auto no-scrollbar pr-1">
                                  {catSubCategories.map((sub) => {
                                    const isSubActive =
                                      subCategoryParam?.toLowerCase() === sub.name.toLowerCase();
                                    return (
                                      <Link
                                        key={sub.name}
                                        href={buildUrl({
                                          subCategory: isSubActive ? undefined : sub.name,
                                          page: undefined,
                                        })}
                                        className={cn(
                                          "min-h-[32px] px-2.5 py-1 rounded-[10px] text-xs font-[600] flex items-center justify-between transition-colors",
                                          isSubActive
                                            ? "bg-[#FBF1D6] text-[#7A560A] font-[700] shadow-sm"
                                            : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                                        )}
                                      >
                                        <span className="truncate">{sub.name}</span>
                                        <span className="text-[10px] opacity-70 ml-1.5 font-mono">
                                          {sub.count}
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Category Brands */}
                            {catCompanies.length > 0 && (
                              <div>
                                <div className="mb-1 px-1 flex items-center justify-between">
                                  <span className="text-[10px] font-[800] uppercase tracking-[0.14em] text-[#8C8270] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">apartment</span>
                                    Brands
                                  </span>
                                  {companyParam && (
                                    <Link
                                      href={buildUrl({ company: undefined, page: undefined })}
                                      className="text-[10px] font-[700] text-[#7A560A] hover:underline"
                                    >
                                      Clear
                                    </Link>
                                  )}
                                </div>

                                <div className="flex flex-col space-y-[2px] max-h-48 overflow-y-auto no-scrollbar pr-1">
                                  {catCompanies.map((comp) => {
                                    const isCompActive =
                                      companyParam?.toLowerCase() === comp.name.toLowerCase();
                                    return (
                                      <Link
                                        key={comp.name}
                                        href={buildUrl({
                                          company: isCompActive ? undefined : comp.name,
                                          page: undefined,
                                        })}
                                        className={cn(
                                          "min-h-[32px] px-2.5 py-1 rounded-[10px] text-xs font-[600] flex items-center justify-between transition-colors",
                                          isCompActive
                                            ? "bg-[#FBF1D6] text-[#7A560A] font-[700] shadow-sm"
                                            : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                                        )}
                                      >
                                        <span className="truncate">{comp.name}</span>
                                        <span className="text-[10px] opacity-70 ml-1.5 font-mono">
                                          {comp.count}
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </SidebarContent>
          </Sidebar>

          {/* ── Main Content: Floating White Card ── */}
          <main className="main flex-1 min-w-0 min-h-0 overflow-y-auto p-3 md:pt-4 md:pr-5 md:pb-5 md:pl-0 custom-scrollbar">
            <div className="page-card flex flex-col gap-6">
              <PageTransition>
                {/* 1. Breadcrumb: Home / Marketplace */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] font-[600] text-[#6B6A66]">
                  <Link href="/" className="hover:text-[#15130D] transition-colors">
                    Home
                  </Link>
                  <span className="text-[#C4912A]">/</span>
                  <span className="text-[#7A560A] font-[700]">Marketplace</span>
                </nav>

                {/* 2. Title Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0ECE0]">
                  <div>
                    <h1 className="text-[32px] md:text-[38px] font-[800] tracking-[-0.02em] text-[#15130D] leading-tight">
                      Marketplace
                    </h1>
                    <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-1">
                      {total} PRODUCTS · {categoryDisplayName.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MarketplaceFilterToggle activeFilterCount={activeFilterCount} />
                    <MarketplaceSortSelect currentSort={sortParam} />
                  </div>
                </div>

                {/* 3. Product Grid */}
                <div className="w-full mt-2">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                      {products.map((product) => {
                        const image = product.images?.[0] ?? null;
                        const meta = extractProductMeta(product);
                        const reviewsCount = product.reviews?.length || 0;
                        const averageRating =
                          reviewsCount > 0
                            ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount
                            : 0;
                        const ratingDisplay = averageRating > 0 ? averageRating.toFixed(1) : "0.0";
                        const fullStars = Math.floor(averageRating);
                        const hasHalfStar = averageRating - fullStars >= 0.5;

                        return (
                          <div
                            key={product.id}
                            style={{ background: "linear-gradient(160deg, #FFFFFF, #FFFBF0)" }}
                            className="border border-[#F0ECE0] rounded-[24px] p-3.5 shadow-[0_18px_40px_-26px_rgba(80,60,10,0.40)] hover:-translate-y-1 hover:shadow-[0_22px_48px_-24px_rgba(80,60,10,0.48)] transition-all duration-200 flex flex-col justify-between group relative"
                          >
                            <div>
                              {/* Thumbnail Container */}
                              <div className="relative w-full aspect-square rounded-[18px] bg-white border border-[#F0ECE0] overflow-hidden flex items-center justify-center p-3">
                                {/* Wishlist Heart */}
                                <WishlistButton
                                  productId={product.id}
                                  iconOnly
                                  className="absolute top-2.5 right-2.5 size-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#ECE7DA] p-0 flex items-center justify-center shadow-sm z-10"
                                />

                                <Link href={`/products/${product.id}`} className="absolute inset-0 flex items-center justify-center p-3">
                                  {image ? (
                                    <Image
                                      src={image}
                                      alt={product.name}
                                      fill
                                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center text-[#6B6A66]/30">
                                      <span className="material-symbols-outlined text-6xl">inventory_2</span>
                                    </div>
                                  )}
                                </Link>

                                {/* Badge */}
                                {meta.company ? (
                                  <span className="absolute bottom-2.5 left-2.5 bg-[#E2F5EE] text-[#0B7A57] text-[10px] font-[800] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#0B7A57]/20 shadow-sm z-10">
                                    {meta.company}
                                  </span>
                                ) : (
                                  <span className="absolute bottom-2.5 left-2.5 bg-[#FBF1D6] text-[#7A560A] text-[10px] font-[800] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#C4912A]/20 shadow-sm z-10">
                                    Best Seller
                                  </span>
                                )}
                              </div>

                              {/* Details Link */}
                              <Link href={`/products/${product.id}`} className="block mt-3">
                                {meta.subCategory && (
                                  <p className="text-[10px] font-[700] uppercase tracking-wider text-[#7A560A] truncate mb-0.5">
                                    {meta.subCategory}
                                  </p>
                                )}

                                <h2 className="text-[15px] font-[700] text-[#15130D] line-clamp-2 leading-snug group-hover:text-[#C4912A] transition-colors">
                                  {product.name}
                                </h2>

                                {/* Star Ratings & Country Origin */}
                                <div className="flex items-center justify-between text-xs mt-2">
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center text-[#C4912A]">
                                      {[...Array(5)].map((_, i) => {
                                        if (i < fullStars) {
                                          return (
                                            <span key={i} className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                              star
                                            </span>
                                          );
                                        }
                                        if (i === fullStars && hasHalfStar) {
                                          return (
                                            <span key={i} className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                              star_half
                                            </span>
                                          );
                                        }
                                        return (
                                          <span key={i} className="material-symbols-outlined text-[13px]">
                                            star
                                          </span>
                                        );
                                      })}
                                    </div>
                                    <span className="text-[11px] font-[600] text-[#6B6A66]">
                                      ({ratingDisplay})
                                    </span>
                                  </div>

                                  <span className="text-[11px] font-[600] text-[#6B6A66] flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5 text-[#C4912A]" />
                                    {product.originCountry || "India"}
                                  </span>
                                </div>

                                {/* Price & Wholesale Info */}
                                <div className="mt-3 pt-2.5 border-t border-[#F0ECE0] flex items-baseline justify-between">
                                  {b2cActive ? (
                                    <div className="flex items-baseline gap-1.5">
                                      {product.regularPrice > product.price ? (
                                        <span className="text-[#6B6A66] line-through text-xs font-[600]">
                                          {formatMoney(product.regularPrice)}
                                        </span>
                                      ) : null}
                                      <span className="text-[18px] font-[800] text-[#15130D] leading-none">
                                        {formatMoney(product.price)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-full flex items-baseline justify-between">
                                      <span className="text-[10px] font-[800] uppercase tracking-[0.14em] text-[#7A560A]">
                                        Wholesale Quote
                                      </span>
                                      {product.price > 0 ? (
                                        <span className="text-[16px] font-[800] text-[#15130D] leading-none">
                                          Ref ${product.price}
                                        </span>
                                      ) : (
                                        <span className="text-[11px] font-[700] text-[#6B6A66]">
                                          On Demand
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </div>

                            {/* Button Action */}
                            {!b2cActive && (
                              <div className="mt-3 pt-1">
                                <AddToCartButton
                                  productId={product.id}
                                  quantity={1}
                                  label="Add to Quote"
                                  className="btn-gold-primary w-full h-[40px] rounded-[14px] text-xs font-[700] flex items-center justify-center shadow-sm"
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
                    <div className="flex justify-center items-center gap-2 mt-12">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Link
                          key={p}
                          href={buildUrl({ page: p.toString() })}
                          className={cn(
                            "size-10 rounded-[12px] flex items-center justify-center text-xs font-[700] transition-colors",
                            p === page
                              ? "bg-[#FBF1D6] text-[#7A560A] border border-[#C4912A]/30 shadow-sm"
                              : "bg-white text-[#4A483F] border border-[#ECE7DA] hover:bg-[#F7F5F0]"
                          )}
                        >
                          {p}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
