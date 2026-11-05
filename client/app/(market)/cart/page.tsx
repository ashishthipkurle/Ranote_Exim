"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { Minus, Plus, Trash2, Lock, ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

import { getCart, removeFromCart, updateQuantity, type CartItem } from "@/lib/cart";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTradeMode } from "@/hooks/useTradeMode";
import QuoteRequestModal from "@/components/cart/QuoteRequestModal";

type Product = {
 id: string;
 name: string;
 price: number;
 b2bPrice?: number;
 b2cPrice?: number;
 regularPrice?: number;
 originCountry: string;
 images: string[];
 minOrderQty: number;
 unit: string;
};

function formatMoney(amount: number) {
 return new Intl.NumberFormat(undefined, {
 style: "currency",
 currency: "USD",
 maximumFractionDigits: 0,
 }).format(amount);
}

export default function CartPage() {
 const { user } = useAuth();
 const { b2cActive } = useTradeMode();
 const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
 const [items, setItems] = useState<CartItem[]>([]);
 const [productsById, setProductsById] = useState<Record<string, Product>>({});
 const [loading, setLoading] = useState(true);
 const router = useRouter();

 useEffect(() => {
 setItems(getCart());
 }, []);

 useEffect(() => {
 const load = async () => {
 setLoading(true);
 try {
 const next: Record<string, Product> = {};
 for (const item of items) {
 try {
 const res = await axios.get(`/api/products/${item.productId}`);
 next[item.productId] = res.data.product as Product;
 } catch {
 // ignore missing
 }
 }
 setProductsById(next);
 } finally {
 setLoading(false);
 }
 };

 void load();
 }, [items]);

 const rows = useMemo(() => {
 return items
 .map((i) => ({
 item: i,
 product: productsById[i.productId] ?? null,
 }))
 .filter((r) => r.product);
 }, [items, productsById]);

 const getPrice = (product: Product | null) => {
   if (!product) return 0;
   const isImporter = (user as any)?.defaultRole === "importer" || (user as any)?.role === "IMPORTER";
   return isImporter ? (product.b2bPrice ?? product.price) : (product.regularPrice ?? product.price);
 };

 const subtotal = rows.reduce((sum, r) => sum + getPrice(r.product) * r.item.quantity, 0);
 const tax = subtotal * 0.08;
 const total = subtotal + tax;

 return (
  <SidebarProvider>
    <div className="flex flex-col min-h-[100dvh] w-full bg-background">
      <DashboardHeader />
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-8">
          <div className="mb-6">
            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Marketplace
            </Link>
          </div>
 <div className="flex items-center justify-between mb-8 border-b border-border">
 <div className="flex gap-8">
 <button
 type="button"
 className="relative pb-4 text-lg font-extrabold border-b-2 border-primary text-foreground"
 >
 {b2cActive ? "My Shopping Cart" : "My Quotation List"}
 <span className="ml-2 px-2 py-0.5 text-xs bg-primary/15 text-primary rounded-full border border-primary/20">
 {items.length}
 </span>
 </button>
 </div>
 <div className="pb-4 hidden sm:block">
 <p className="text-sm text-muted-foreground ">
   {b2cActive ? "“Free shipping on orders over $5,000”" : "“Custom bulk export rates calculated upon request”"}
 </p>
 </div>
 </div>

 {loading && (
 <div className="rounded-lg border border-border bg-card p-8 text-muted-foreground">
 Loading cart...
 </div>
 )}

 {!loading && items.length === 0 && (
 <div className="rounded-lg border border-border bg-card p-10 text-center">
 <div className="text-lg font-bold">Your cart is empty</div>
 <p className="text-sm text-muted-foreground mt-2">Browse the marketplace to add items.</p>
 <Link
 href="/products"
 className="inline-flex mt-6 h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground"
 >
 Go to Marketplace
 </Link>
 </div>
 )}

 {!loading && items.length > 0 && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 {rows.map(({ item, product }) => {
 if (!product) return null;
 const img = product.images?.[0] ?? null;

 return (
 <div
 key={product.id}
 className="rounded-lg border border-border bg-card/80 dark:bg-card/40 backdrop-blur-sm p-4 flex flex-col sm:flex-row gap-6 hover:bg-accent/30 transition-colors"
 >
 <div className="relative w-full sm:w-48 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-muted border border-border">
 {img ? (
 <Image src={img} alt={product.name} fill className="object-cover" />
 ) : (
 <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
 No image
 </div>
 )}
 </div>

 <div className="flex-1 flex flex-col justify-between">
 <div>
 <div className="flex justify-between items-start gap-4">
 <div>
 <Link
 href={`/products/${product.id}`}
 className="text-lg font-extrabold hover:text-primary"
 >
 {product.name}
 </Link>
 <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
 SKU: {product.id.slice(0, 6).toUpperCase()} •{" "}
 <span className="text-emerald-500">In Stock</span>
 </p>
 </div>
 {b2cActive ? (
   <p className="text-xl font-extrabold">{formatMoney(getPrice(product))}</p>
 ) : (
   <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
     Wholesale Bulk
   </span>
 )}
 </div>
 <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
 Origin {product.originCountry} • MOQ {product.minOrderQty} {product.unit}
 </p>
 </div>

 <div className="flex items-center justify-between mt-6">
 <div className="flex items-center gap-3">
 <div className="flex items-center bg-background/40 border border-border rounded-xl p-1">
                          <button
                            type="button"
                            className="size-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
                            onClick={() => {
                              const moq = product.minOrderQty || 1;
                              const nextQty = Math.max(moq, item.quantity - 1);
                              if (nextQty === item.quantity && item.quantity === moq) {
                                toast.error(`Minimum order for this item is ${moq}`);
                                return;
                              }
                              updateQuantity(product.id, nextQty);
                              setItems(getCart());
                            }}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
 <div className="w-10 text-center text-sm font-black">{item.quantity}</div>
 <button
 type="button"
 className="size-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
 onClick={() => {
 updateQuantity(product.id, item.quantity + 1);
 setItems(getCart());
 }}
 aria-label="Increase quantity"
 >
 <Plus className="h-4 w-4" />
 </button>
 </div>

 </div>

 <button
 type="button"
 className="text-muted-foreground hover:text-destructive transition-colors"
 onClick={() => {
 removeFromCart(product.id);
 setItems(getCart());
 toast.success("Removed from cart");
 }}
 aria-label="Remove"
 >
 <Trash2 className="h-5 w-5" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 <div className="lg:col-span-1">
 <div className="sticky top-28 rounded-lg border border-border bg-card/80 dark:bg-card/40 backdrop-blur-sm p-6">
 {b2cActive ? (
   <>
 <h3 className="text-xl font-extrabold mb-6">Order Summary</h3>

 <div className="space-y-4 mb-6 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Subtotal</span>
 <span className="font-semibold">{formatMoney(subtotal)}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Tax estimate (8%)</span>
 <span className="font-semibold">{formatMoney(tax)}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Secure Shipping</span>
 <span className="text-emerald-500 font-black">FREE</span>
 </div>
 </div>

 <div className="relative mb-6">
 <input
 className="w-full bg-background/40 border border-border rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
 placeholder="Promo Code"
 />
 <button
 type="button"
 className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-primary px-3 py-1.5 hover:bg-primary/10 rounded-lg transition-colors"
 >
 APPLY
 </button>
 </div>

 <div className="pt-6 border-t border-border mb-8">
 <div className="flex justify-between items-center">
 <span className="text-lg font-semibold">Order Total</span>
 <span className="text-3xl font-extrabold text-foreground tracking-tight">
 {formatMoney(total)}
 </span>
 </div>
 </div>

  <button
  onClick={(e) => {
    const invalidItems = rows.filter(r => r.item.quantity < (r.product?.minOrderQty || 1));
    if (invalidItems.length > 0) {
      e.preventDefault();
      toast.error(`Some items do not meet the Minimum Order Quantity (MOQ). Please check your cart.`);
    } else {
      router.push("/checkout");
    }
  }}
  className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
  >
  <Lock className="h-4 w-4" />
  Proceed to Secure Checkout
  </button>

 <p className="mt-4 text-xs text-muted-foreground text-center">
 Checkout flow is UI-first; order creation runs on submit.
 </p>
 </>
 ) : (
 <>
 <div className="flex items-center justify-between mb-6">
   <h3 className="text-xl font-extrabold">Quotation Summary</h3>
   <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
     B2B Wholesale
   </span>
 </div>

 <div className="space-y-4 mb-6 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Total Inquired Units</span>
 <span className="font-semibold">{items.reduce((s, i) => s + i.quantity, 0)} Units</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Product Varieties</span>
 <span className="font-semibold">{rows.length}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Pricing Tier</span>
 <span className="text-primary font-bold">Custom Export Rate</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Freight Logistics</span>
 <span className="text-foreground font-medium">Port-to-Port Quoted</span>
 </div>
 </div>

 <div className="pt-4 border-t border-border mb-6">
   <p className="text-xs text-muted-foreground leading-relaxed">
     Submit your quotation request. Our export administration will review your quantities and send formal rates to your account.
   </p>
 </div>

 <button
 onClick={() => setIsQuoteModalOpen(true)}
 className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
 >
 <Send className="h-4 w-4" />
 Ask for Quotation
 </button>

 <p className="mt-4 text-xs text-muted-foreground text-center">
 You will receive formal quote terms in your buyer account & email.
 </p>
 </>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 <QuoteRequestModal
   open={isQuoteModalOpen}
   onClose={() => setIsQuoteModalOpen(false)}
   items={items}
   productsById={productsById}
   onSuccess={() => setItems([])}
 />
 </SidebarProvider>
 );
}
