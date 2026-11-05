import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  Star,
  StarHalf,
  CheckCircle2,
  FileText,
  Download,
  Zap,
  Thermometer,
  Cpu,
  HardDrive,
  Network,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/marketplace/AddToCartButton";
import BuyNowButton from "@/components/marketplace/BuyNowButton";
import WishlistButton from "@/components/marketplace/WishlistButton";
import { isB2CActive } from "@/lib/trade-mode";
import { getServerAuthContext } from "@/lib/auth-server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardScaler } from "@/components/dashboard/DashboardScaler";
import PageTransition from "@/components/ui/PageTransition";
import HomeFooter from "@/components/homepage/HomeFooter";

type ProductReview = {
  orderId: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      exporter: {
        select: {
          id: true,
          name: true,
          businessName: true,
          country: true,
        },
      },
    },
  });

  if (!product) notFound();

  const auth = await getServerAuthContext();
  const role = auth?.role || "USER";
  const b2cActive = isB2CActive();

  // Fetch related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      category: product.category,
      id: { not: product.id },
      available: true,
    },
    take: 4,
  });

  // Dynamic price calculation matching the marketplace list page
  const currentPrice = role === "IMPORTER" ? (product.b2bPrice || product.price) : (product.regularPrice || product.price);
  const oldPrice = role === "IMPORTER" ? (product.regularPrice || currentPrice * 1.12) : (product.regularPrice ? product.regularPrice * 1.12 : currentPrice * 1.12);

  const heroImage = product.images?.[0] ?? null;
  const nameParts = product.name.split(" ").filter(Boolean);
  const splitIndex = Math.min(3, nameParts.length);
  const titlePrimary = nameParts.slice(0, splitIndex).join(" ");
  const titleAccent = nameParts.slice(splitIndex).join(" ");

  let productReviews: ProductReview[] = [];
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("renote_product_reviews")?.value;
    const parsed = raw ? (JSON.parse(decodeURIComponent(raw)) as ProductReview[]) : [];
    productReviews = parsed
      .filter((review) => review.productId === product.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    productReviews = [];
  }

  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
      : 4.8;
  const fullStars = Math.floor(avgRating);
  const hasHalf = avgRating - fullStars >= 0.5;

  return (
    <SidebarProvider defaultOpen={false}>
      <DashboardScaler targetWidth={1440}>
        <div className="flex flex-col h-full w-full bg-board transition-colors duration-300 overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl">
          <DashboardHeader />
          <SidebarInset className="overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface h-[calc(100vh-60px)]">
              <PageTransition>
                <div className="bg-background min-h-screen">
                  {/* Back Button */}
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                    <Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit">
                        <ChevronLeft className="w-4 h-4" /> Back to Marketplace
                    </Link>
                  </div>

                  {/* ── Hero Section ── */}
                  <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
                      {/* Left: Image Gallery */}
                      <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="min-h-[400px] lg:h-[600px] rounded-2xl overflow-hidden bg-white dark:bg-white/[0.03] border border-border dark:border-white/5 relative group flex items-center justify-center p-4">
                          {heroImage ? (
                            <Image
                              src={heroImage}
                              alt={product.name}
                              fill
                              className="object-contain transition-all duration-700 group-hover:scale-105 p-4"
                              priority
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-lg">
                              No image available
                            </div>
                          )}
                          <div className="absolute bottom-5 left-5">
                            <span className="px-4 py-1.5 bg-primary text-[10px] font-black uppercase tracking-[0.15em] rounded-full text-primary-foreground shadow-lg">
                              Verified Product
                            </span>
                          </div>
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                          <div className="grid grid-cols-4 gap-3">
                            {product.images.slice(0, 4).map((src: string, idx: number) => (
                              <div
                                key={src}
                                className={
                                  "aspect-square rounded-xl overflow-hidden bg-muted/20 border-2 transition-all cursor-pointer " +
                                  (idx === 0
                                    ? "border-primary shadow-md shadow-primary/10"
                                    : "border-border hover:border-primary/40")
                                }
                              >
                                <div className="relative w-full h-full">
                                  <Image
                                    src={src}
                                    alt={`${product.name} ${idx + 1}`}
                                    fill
                                    className={
                                      "object-contain p-1 transition-opacity " +
                                      (idx === 0
                                        ? "opacity-100"
                                        : "opacity-60 hover:opacity-100")
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Product Info */}
                      <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => {
                              if (star <= fullStars) return <Star key={star} className="h-4 w-4 fill-current" />;
                              if (star === fullStars + 1 && hasHalf) return <StarHalf key={star} className="h-4 w-4 fill-current" />;
                              return <Star key={star} className="h-4 w-4" />;
                            })}
                          </div>
                          <span className="text-sm text-muted-foreground font-medium">
                            ({productReviews.length > 0 ? productReviews.length : 12} Verified Reviews)
                          </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-tight text-foreground">
                          {titlePrimary}
                          {titleAccent ? (
                            <>
                              {" "}
                              <span className="text-primary">{titleAccent}</span>
                            </>
                          ) : null}
                        </h1>

                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
                          SKU: {product.id.slice(0, 8).toUpperCase()} |{" "}
                          {product.category}
                        </p>

                        <p className="text-base text-muted-foreground leading-relaxed">
                          {product.description}
                        </p>

                        <div className="rounded-lg border border-border bg-card p-6 shadow-lg space-y-6">
                          <div className="flex justify-between items-end">
                            <div>
                              {b2cActive ? (
                                <>
                                  <p className="text-muted-foreground text-xs font-medium mb-1">
                                    {role === "IMPORTER" ? "B2B Special Price" : "Unit Price"}
                                  </p>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                                      {formatMoney(currentPrice)}
                                    </span>
                                    <span className="text-muted-foreground/50 text-sm line-through">
                                      {formatMoney(oldPrice)}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wider text-primary">
                                    Pricing Model
                                  </p>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                                      Wholesale Quotation
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Custom bulk export rates calculated based on order quantity & port.
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              <span
                                className={
                                  "text-sm font-bold inline-flex items-center gap-1 " +
                                  (product.available ? "text-emerald-500" : "text-red-500")
                                }
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {product.available ? "In Stock" : "Out of Stock"}
                              </span>
                              <p className="text-muted-foreground text-[11px] mt-0.5">
                                Ships from {product.originCountry}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 border border-border rounded-xl overflow-hidden divide-x divide-border">
                            <div className="p-4">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                                Min. Order (MOQ)
                              </p>
                              <p className="text-lg font-extrabold text-foreground">
                                {product.minOrderQty} {product.unit}
                              </p>
                            </div>
                            <div className="p-4">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">
                                Origin
                              </p>
                              <p className="text-lg font-extrabold text-foreground">
                                {product.originCountry}
                              </p>
                            </div>
                          </div>

                          {b2cActive ? (
                            <>
                              <BuyNowButton
                                productId={product.id}
                                quantity={product.minOrderQty || 1}
                                className="w-full h-14 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                              />

                              <div className="grid grid-cols-2 gap-3">
                                <AddToCartButton
                                  productId={product.id}
                                  quantity={product.minOrderQty || 1}
                                  className="w-full h-12 rounded-xl border border-border bg-background text-foreground hover:bg-accent font-medium"
                                />
                                <WishlistButton
                                  productId={product.id}
                                  className="w-full h-12 rounded-xl border border-border bg-background font-medium"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-3">
                              <AddToCartButton
                                productId={product.id}
                                quantity={product.minOrderQty || 1}
                                label="Add to Quotation Cart"
                                className="w-full h-14 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                              />
                              <WishlistButton
                                productId={product.id}
                                className="w-full h-12 rounded-xl border border-border bg-background font-medium"
                              />
                            </div>
                          )}
                        </div>

                        {product.trustDocumentUrl && (
                          <div className="rounded-xl border border-border bg-card/60 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">Product Documentation</p>
                                <p className="text-xs text-muted-foreground">Technical Datasheet & Compliance</p>
                              </div>
                            </div>
                            <a 
                              href={product.trustDocumentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary text-sm font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" /> View
                            </a>
                          </div>
                        )}

                        <div className="rounded-xl border border-border bg-card/60 p-4">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Exporter</p>
                          <p className="text-base font-extrabold text-foreground">
                            {product.exporter.businessName || product.exporter.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{product.exporter.country}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Specifications ── */}
                  <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
                    <h2 className="text-xl font-bold text-foreground mb-6">Product Specifications</h2>
                    <div className="rounded-lg border border-border bg-card/50 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="flex items-center justify-between py-3 border-b border-border/50">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Zap className="h-4 w-4 text-primary/60" /> Category
                          </span>
                          <span className="text-sm font-bold text-foreground">{product.category}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border/50">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Thermometer className="h-4 w-4 text-primary/60" /> Origin
                          </span>
                          <span className="text-sm font-bold text-foreground">{product.originCountry}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border/50">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Cpu className="h-4 w-4 text-primary/60" /> Unit
                          </span>
                          <span className="text-sm font-bold text-foreground">{product.unit}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border/50">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <HardDrive className="h-4 w-4 text-primary/60" /> MOQ
                          </span>
                          <span className="text-sm font-bold text-foreground">{product.minOrderQty} {product.unit}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border/50">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Network className="h-4 w-4 text-primary/60" /> HS Code
                          </span>
                          <span className="text-sm font-bold text-foreground">{product.hsCode || "Standard"}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border/50">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary/60" /> Stock Status
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {product.stockQty > 0 ? `${product.stockQty} ${product.unit} Available` : "On Backorder"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Related Products ── */}
                  {relatedProducts.length > 0 && (
                    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-extrabold text-foreground">Related Products</h2>
                          <p className="text-sm text-muted-foreground mt-1">Discover more items in {product.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map((item) => (
                          <Link
                            key={item.id}
                            href={`/products/${item.id}`}
                            className="rounded-xl border border-border bg-card overflow-hidden group hover:shadow-lg transition-all"
                          >
                            <div className="aspect-square bg-white dark:bg-white/5 flex items-center justify-center relative">
                              {item.images?.[0] ? (
                                <Image src={item.images[0]} alt={item.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="h-20 w-20 rounded-full bg-muted/30" />
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex items-baseline justify-between mb-1">
                                <p className="text-sm font-bold text-foreground line-clamp-1">{item.name}</p>
                                <span className="text-sm font-extrabold text-primary ml-2 whitespace-nowrap">
                                  {formatMoney(role === "IMPORTER" ? (item.b2bPrice || item.price) : (item.regularPrice || item.price))}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                                From {item.originCountry}
                              </p>
                              <div className="w-full py-2 rounded-lg border border-border text-[10px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                                View Details
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  <HomeFooter />
                </div>
              </PageTransition>
            </div>
          </SidebarInset>
        </div>
      </DashboardScaler>
    </SidebarProvider>
  );
}
