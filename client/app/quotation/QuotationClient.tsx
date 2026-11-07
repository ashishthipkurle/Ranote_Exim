"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Minus, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";
import { DashboardScaler } from "@/components/dashboard/DashboardScaler";
import { ExtractedCategory, resolveProductCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  certifications?: string[];
  originCountry: string;
};

type QuoteItem = {
  product: Product;
  quantity: number;
};

export default function QuotationClient({
  products,
  categories,
  isLoggedIn,
  user,
}: {
  products: Product[];
  categories: ExtractedCategory[];
  isLoggedIn: boolean;
  user: { name: string; email: string; phone?: string; businessName?: string } | null;
}) {
  const router = useRouter();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => {
      const resolved = resolveProductCategory(p);
      return resolved.key === selectedCategory;
    });
  }, [products, selectedCategory]);

  const updateQuantity = (product: Product, delta: number) => {
    setQuoteItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter((item) => item.product.id !== product.id);
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      if (delta > 0) {
        return [...prev, { product, quantity: delta }];
      }
      return prev;
    });
  };

  const getQuantity = (productId: string) => {
    const item = quoteItems.find((item) => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleRequestQuote = () => {
    if (quoteItems.length === 0) return;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    let message = `Hello Ranote Exim,`;

    if (user) {
      const clientName = user.name || "A client";
      const businessInfo = user.businessName ? ` from ${user.businessName}` : "";
      message += `%0A%0AThis is ${clientName}${businessInfo} (${user.email}).`;
    }

    message += "%0AI would like to request a quotation for the following products:%0A%0A";

    quoteItems.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name} (Qty: ${item.quantity})%0A`;
    });

    message += "%0APlease provide the best possible rates.";

    // Send the data to our Next.js backend API
    fetch("/api/whatsapp/send-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: user?.name || "A client",
        clientEmail: user?.email,
        clientPhone: user?.phone,
        businessName: user?.businessName,
        items: quoteItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
        })),
      }),
    }).catch((err) => console.error("Failed to send quote", err));

    setShowSuccessModal(true);
    setQuoteItems([]);
  };

  return (
    <SidebarProvider className="fixed inset-0 z-40 bg-board">
      <DashboardScaler targetWidth={1440}>
        <div className="flex flex-col h-full w-full bg-board transition-colors duration-300 overflow-hidden shadow-2xl relative">
          {/* Marketplace-standard Top Header */}
          <div className="flex-shrink-0 z-50 w-full bg-board border-b border-border/50 dark:border-white/10 shadow-sm relative">
            <DashboardHeader />
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Left Sidebar: Categories matching Marketplace */}
            <Sidebar className="bg-transparent border-none">
              <SidebarContent className="bg-transparent px-3 pt-3 no-scrollbar overflow-y-auto">
                <div className="flex flex-col py-2">
                <div className="mb-2 flex items-center justify-between py-1 px-1">
                  <h3 className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66]">
                    Categories
                  </h3>
                </div>

                <div className="flex flex-col space-y-[2px]">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "h-[42px] px-3 rounded-[14px] text-[14px] font-[600] flex items-center w-full transition-colors",
                      !selectedCategory
                        ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                        : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                    )}
                  >
                    <span className={cn("material-symbols-outlined mr-3 text-[18px]", !selectedCategory ? "text-[#C4912A]" : "text-[#6B6A66]")}>auto_awesome</span>
                    <span className="truncate">
                      All Products
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(isActive ? null : cat.key)}
                        className={cn(
                          "h-[42px] px-3 rounded-[14px] text-[14px] font-[600] flex items-center w-full transition-colors",
                          isActive
                            ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                            : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                        )}
                      >
                        <span className={cn("material-symbols-outlined mr-3 text-[18px]", isActive ? "text-[#C4912A]" : "text-[#6B6A66]")}>{cat.icon}</span>
                        <span className="truncate">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SidebarContent>
          </Sidebar>

            {/* Main Content Area */}
            <SidebarInset className="flex-1 flex flex-col h-full overflow-hidden bg-board relative">
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 custom-scrollbar">
                {/* Back Button & Title Header */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-card hover:bg-primary/10 border border-border/50 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Request a Quotation</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      Select products and quantities to request a bulk quote.
                    </p>
                  </div>
                </div>

                {/* Two-Column Grid: Products (Left) + Quotation List (Right) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-12">
                  {/* Products Grid */}
                  <div className="xl:col-span-8 2xl:col-span-9">
                    {filteredProducts.length === 0 ? (
                      <div className="py-20 text-center bg-card rounded-xl border border-border/50">
                        <p className="text-muted-foreground">No products found in this category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-0 border-t border-l border-border/50 bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm">
                        {filteredProducts.map((product) => {
                          const qty = getQuantity(product.id);
                          const image = product.images?.[0] ?? null;
                          return (
                            <div
                              key={product.id}
                              className="group relative p-3 hover:shadow-md transition-shadow duration-300 border-r border-b border-border/50 flex flex-col h-full bg-white dark:bg-card"
                            >
                              {/* Wishlist Heart */}
                              <div className="absolute top-2 right-2 z-10 cursor-pointer p-1 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                <span className="material-symbols-outlined text-gray-400 hover:text-red-500 transition-colors text-[20px] md:text-[22px]">
                                  favorite_border
                                </span>
                              </div>

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

                              {/* Tags */}
                              <p className="text-[10px] md:text-[11px] text-[#2874f0] dark:text-blue-400 font-semibold mb-1">
                                #BestSeller
                              </p>

                              {/* Body */}
                              <div className="flex flex-col flex-grow">
                                <h2 className="text-[11px] sm:text-xs md:text-sm font-medium text-foreground/90 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                  {product.name}
                                </h2>

                                <div className="flex items-center gap-1 mt-1.5">
                                  <div className="flex items-center text-[#388e3c]">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className="material-symbols-outlined text-[12px] md:text-[14px]"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                      >
                                        star
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-1 flex items-baseline gap-2">
                                  <span className="text-sm md:text-base font-bold text-foreground">
                                    ${product.price}
                                  </span>
                                </div>

                                <div className="mt-2 mb-4">
                                  <span className="inline-block text-[8px] md:text-[9px] font-bold text-[#388e3c] bg-[#388e3c]/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    Hot Deal
                                  </span>
                                </div>

                                <div className="mt-auto pt-2">
                                  {qty === 0 ? (
                                    <button
                                      onClick={() => updateQuantity(product, 1)}
                                      className="w-full py-2 rounded-lg border border-primary/20 text-primary font-semibold hover:bg-primary hover:text-white transition-colors text-xs"
                                    >
                                      Add to Quote
                                    </button>
                                  ) : (
                                    <div className="flex items-center justify-between bg-primary/10 rounded-lg p-1 border border-primary/20">
                                      <button
                                        onClick={() => updateQuantity(product, -1)}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="font-bold text-sm w-8 text-center">{qty}</span>
                                      <button
                                        onClick={() => updateQuantity(product, 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sticky Quotation Panel (Right) */}
                  <div className="xl:col-span-4 2xl:col-span-3 sticky top-4">
                    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
                      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary" />
                        Your Quotation List
                      </h2>

                      {quoteItems.length === 0 ? (
                        <div className="text-center py-10">
                          <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                            <Plus className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            Your quote list is empty. Add products to request a bulk quote.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-6 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                          {quoteItems.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex justify-between items-start gap-3 pb-3 border-b border-border/50 last:border-0"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs text-foreground truncate">
                                  {item.product.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs font-semibold text-primary">Qty: {item.quantity}</p>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <p className="text-xs text-muted-foreground">${item.product.price} / ea</p>
                                </div>
                              </div>
                              <button
                                onClick={() => updateQuantity(item.product, -item.quantity)}
                                className="text-xs text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors flex-shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        disabled={quoteItems.length === 0}
                        onClick={handleRequestQuote}
                        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95 flex items-center justify-center gap-2 text-sm"
                      >
                        Submit Quotation Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </div>
        </div>
      </DashboardScaler>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-center text-foreground mb-3">Authentication Required</h3>
            <p className="text-center text-muted-foreground mb-8 text-sm">
              You must be logged in or signed up to request a quotation. This ensures our team can reach out to you properly.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/login?callbackUrl=/quotation"
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-center hover:bg-primary/90 transition-colors"
              >
                Login / Sign Up
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full bg-transparent border border-border text-foreground font-semibold py-3.5 rounded-xl text-center hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-center text-foreground mb-3">Inquiry Sent!</h3>
            <p className="text-center text-muted-foreground mb-8 text-sm leading-relaxed">
              Our admin team has received your quotation request and will connect with you shortly through a call or message for further processing.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-center hover:bg-primary/90 transition-colors"
            >
              Okay, Thanks!
            </button>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
