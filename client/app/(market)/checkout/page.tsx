"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { CreditCard, Landmark, Lock, Wallet, Loader2, MapPin, Phone, ChevronRight, ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCart, clearCart, type CartItem } from "@/lib/cart";
import { useAuth } from "@/components/auth/AuthProvider";
import { openRazorpayCheckout, RAZORPAY_KEY_ID, type RazorpayPaymentResponse } from "@/lib/razorpay-client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

function getApiErrorMessage(error: unknown): string | null {
    if (!error || typeof error !== "object") return null;
    const response = (error as { response?: unknown }).response;
    if (!response || typeof response !== "object") return null;
    const data = (response as { data?: unknown }).data;
    if (!data || typeof data !== "object") return null;
    const message = (data as { error?: unknown }).error;
    return typeof message === "string" ? message : null;
}

type Product = {
    id: string;
    name: string;
    price: number;
    b2bPrice?: number;
    b2cPrice?: number;
    regularPrice?: number;
    minOrderQty: number;
    unit: string;
    category?: string;
    originCountry?: string;
    images?: string[];
    exporter?: {
        id: string;
        name?: string | null;
        businessName?: string | null;
        country?: string | null;
    };
};

function formatMoney(amount: number) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

const STEPS = [
    { label: "Shipping", icon: MapPin },
    { label: "Payment", icon: CreditCard },
    { label: "Confirm", icon: CheckCircle2 },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [productsById, setProductsById] = useState<Record<string, Product>>({});
    const [submitting, setSubmitting] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [quotedOrder, setQuotedOrder] = useState<any>(null);
    const [loadingQuotedOrder, setLoadingQuotedOrder] = useState(false);
    const [razorpayPaymentId, setRazorpayPaymentId] = useState<string | null>(null);
    const [paymentReady, setPaymentReady] = useState(false);
    const [isDev, setIsDev] = useState(false);

    // Load Quoted Order if present in URL
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const qOrderId = params.get("orderId");
            if (qOrderId) {
                setOrderId(qOrderId);
                setLoadingQuotedOrder(true);
                fetch(`/api/orders/${qOrderId}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data?.order) {
                            setQuotedOrder(data.order);
                        }
                    })
                    .catch(err => console.error("Failed to load quoted order", err))
                    .finally(() => setLoadingQuotedOrder(false));
            }
        }
    }, []);

    // Step management: 0 = address, 1 = payment, 2 = confirm
    const [step, setStep] = useState(0);

    // Address form state
    const [shippingAddress, setShippingAddress] = useState("");
    const [shippingCity, setShippingCity] = useState("");
    const [shippingCountry, setShippingCountry] = useState("");
    const [shippingZip, setShippingZip] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    
    const [useSavedAddress, setUseSavedAddress] = useState(false);
    const hasSavedAddress = !!(user as any)?.address;

    // Pre-fill from user profile
    useEffect(() => {
        if (user) {
            const u = user as any;
            if (u.address) {
                setShippingAddress(u.address);
                setUseSavedAddress(true);
            }
            if (u.country) setShippingCountry(u.country);
            if (u.phone) setPhoneNumber(u.phone);
            if (u.city) setShippingCity(u.city);
            if (u.zip) setShippingZip(u.zip);
        }
    }, [user]);

    useEffect(() => {
        setItems(getCart());
    }, []);

    useEffect(() => {
        const load = async () => {
            const next: Record<string, Product> = {};
            for (const item of items) {
                try {
                    const res = await axios.get(`/api/products/${item.productId}`);
                    next[item.productId] = res.data.product as Product;
                } catch { /* ignore */ }
            }
            setProductsById(next);
        };
        if (items.length > 0) void load();
    }, [items]);

    const rows = useMemo(() => {
        return items
            .map((i) => ({ item: i, product: productsById[i.productId] ?? null }))
            .filter((r) => r.product);
    }, [items, productsById]);

    const getPrice = (product: Product | null) => {
        if (!product) return 0;
        const isImporter = (user as any)?.defaultRole === "importer" || (user as any)?.role === "IMPORTER";
        return isImporter ? (product.b2bPrice ?? product.price) : (product.regularPrice ?? product.price);
    };

    const total = quotedOrder
        ? quotedOrder.totalPrice
        : rows.reduce((sum, r) => sum + getPrice(r.product) * r.item.quantity, 0);

    const fullAddress = [shippingAddress, shippingCity, shippingZip, shippingCountry].filter(Boolean).join(", ");

    const isAddressValid = useSavedAddress ? true : (
        shippingAddress.trim().length > 3 && 
        shippingCity.trim().length > 1 && 
        shippingZip.trim().length > 2 && 
        shippingCountry.trim().length > 1 && 
        phoneNumber.trim().length > 5
    );

    const saveLocalOrders = () => {
        if (typeof window === "undefined") return [] as string[];
        const storageKey = "renote_local_orders";
        const now = Date.now();
        const createdOrderIds: string[] = [];
        const existingRaw = localStorage.getItem(storageKey);
        const existing = existingRaw ? (JSON.parse(existingRaw) as any[]) : [];
        const sourceRows = items.map((item) => ({ item, product: productsById[item.productId] ?? null }));
        const newOrders = sourceRows.map((row, index) => {
            const id = `local-${now}-${index + 1}`;
            createdOrderIds.push(id);
            return {
                id,
                orderNumber: `ORD-${new Date().getFullYear()}-${String(now + index).slice(-6)}`,
                importerId: (user as any)?.id ?? "local-importer",
                totalPrice: getPrice(row.product) * row.item.quantity,
                currency: "INR",
                orderStatus: "QUOTE_REQUESTED",
                paymentStatus: "PENDING",
                quantity: row.item.quantity,
                productId: row.item.productId,
                createdAt: new Date(now + index).toISOString(),
                updatedAt: new Date(now + index).toISOString(),
                product: {
                    id: row.item.productId,
                    name: row.product?.name ?? `Product`,
                    category: row.product?.category ?? "General",
                    images: row.product?.images ?? [],
                    exporter: {
                        id: row.product?.exporter?.id ?? "local-exporter",
                        name: row.product?.exporter?.name ?? "Exporter",
                        businessName: row.product?.exporter?.businessName ?? "Seller",
                        country: row.product?.exporter?.country ?? "N/A",
                    },
                },
                _local: true,
            };
        });
        if (newOrders.length === 0) return createdOrderIds;
        localStorage.setItem(storageKey, JSON.stringify([...newOrders, ...existing].slice(0, 200)));
        window.dispatchEvent(new Event("renote-orders-updated"));
        return createdOrderIds;
    };

    const startPayment = async () => {
        setSubmitting(true);
        try {
            if (!user) {
                toast.error("Please login to place an order");
                return;
            }
            const orderItems = rows.map(r => ({
                productId: r.item.productId,
                quantity: r.item.quantity
            }));
            const payload = quotedOrder
                ? { orderId: quotedOrder.id, shippingAddress: fullAddress, phone: phoneNumber }
                : { items: orderItems, shippingAddress: fullAddress, phone: phoneNumber };

            const res = await fetch("/api/checkout/create-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to initialize payment");
                return;
            }

            setOrderId(data.orderId);

            // Dev mode: no Razorpay key configured
            if (data.isDev) {
                setIsDev(true);
                setPaymentReady(true);
                toast.success("Development mode — simulate payment");
                return;
            }

            // Open Razorpay checkout popup
            setPaymentReady(true);
            toast.success("Payment session ready");

            await openRazorpayCheckout({
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "Ranote Exim",
                description: quotedOrder
                    ? `Payment for Quoted Order #${quotedOrder.orderNumber}`
                    : `Order payment for ${orderItems.length} item(s)`,
                order_id: data.razorpayOrderId,
                handler: async (response: RazorpayPaymentResponse) => {
                    // Payment succeeded — confirm on server
                    try {
                        await fetch("/api/checkout/confirm", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                orderId: quotedOrder ? quotedOrder.id : undefined,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                validatedItems: data.validatedItems,
                                shippingAddress: data.shippingAddress,
                                phone: data.phone,
                            }),
                        });

                        // Clear cart and update step
                        clearCart();
                        if (typeof window !== 'undefined') window.dispatchEvent(new Event("renote-orders-updated"));
                        setRazorpayPaymentId(response.razorpay_payment_id);
                        setStep(2);
                    } catch (err) {
                        console.error("Confirm error:", err);
                        toast.error("Payment received but confirmation failed. Contact support.");
                    }
                },
                prefill: {
                    email: (user as any)?.email || "",
                    contact: phoneNumber || "",
                    name: (user as any)?.name || (user as any)?.businessName || "",
                },
                theme: {
                    color: "#6366f1", // Indigo to match app's primary
                },
                modal: {
                    ondismiss: () => {
                        toast.info("Payment cancelled");
                        setSubmitting(false);
                    },
                },
            });
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error) ?? "Failed to initialize payment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SidebarProvider>
            <div className="flex flex-col h-dvh w-full bg-background overflow-hidden">
                <DashboardHeader />
                <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
                    <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Complete your order in a few simple steps.
                        </p>
                    </div>
                    <Link href="/cart" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back to cart
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-10 text-center">
                        <p className="text-lg font-semibold">Your cart is empty</p>
                        <p className="text-sm text-muted-foreground mt-1">Add products to your cart first.</p>
                        <Link
                            href="/products"
                            className="inline-flex mt-4 items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                        >
                            Go to Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Step Indicator */}
                            <div className="relative flex items-center justify-between gap-2 py-4">
                                {STEPS.map((s, idx) => {
                                    const isLast = idx === STEPS.length - 1;
                                    const isLineActive = step > idx;
                                    
                                    return (
                                        <div key={s.label} className="relative flex flex-col items-center gap-2 flex-1">
                                            {/* Background Line */}
                                            {!isLast && (
                                                <div 
                                                    className="absolute h-[2px] bg-border z-0" 
                                                    style={{ top: '20px', left: '50%', width: 'calc(100% + 8px)', transform: 'translateY(-50%)' }}
                                                />
                                            )}
                                            {/* Active Line */}
                                            {!isLast && (
                                                <div 
                                                    className="absolute h-[2px] bg-primary z-0 transition-all duration-700 ease-in-out origin-left" 
                                                    style={{ 
                                                        top: '20px',
                                                        left: '50%', 
                                                        width: 'calc(100% + 8px)', 
                                                        transform: `translateY(-50%) scaleX(${isLineActive ? 1 : 0})` 
                                                    }}
                                                />
                                            )}
                                            
                                            <button 
                                                onClick={() => {
                                                    if (idx === 0) setStep(0);
                                                    if (idx === 1 && paymentReady) setStep(1);
                                                }}
                                                disabled={idx === 1 && !paymentReady}
                                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 outline-none ${
                                                    idx <= step
                                                        ? "bg-primary border-primary text-primary-foreground shadow-lg"
                                                        : "bg-card border-border text-muted-foreground"
                                                } ${(idx === 0 || (idx === 1 && paymentReady)) ? "cursor-pointer hover:scale-105 active:scale-95 hover:ring-4 ring-primary/20" : "cursor-default"}`}
                                            >
                                                <s.icon className="w-4 h-4" />
                                            </button>
                                            <span className={`text-xs font-medium ${idx <= step ? "text-primary" : "text-muted-foreground"}`}>
                                                {s.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Step 0: Shipping Address */}
                            {step === 0 && (
                                <section className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold">Shipping Address</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Where should we deliver your order?
                                        </p>
                                    </div>

                                    {useSavedAddress && hasSavedAddress ? (
                                        <div className="p-4 border border-border rounded-lg bg-muted/20">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{shippingAddress}</p>
                                                    {[shippingCity, shippingZip].filter(Boolean).length > 0 && (
                                                        <p className="text-sm text-muted-foreground">{[shippingCity, shippingZip].filter(Boolean).join(", ")}</p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">{shippingCountry}</p>
                                                    <p className="text-sm text-muted-foreground mt-2">{phoneNumber}</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => setUseSavedAddress(false)}>
                                                    Enter New Address
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Street Address *</label>
                                                <input
                                                    type="text"
                                                    value={shippingAddress}
                                                    onChange={(e) => setShippingAddress(e.target.value)}
                                                    placeholder="123 Main Street, Apt 4B"
                                                    className="mt-1.5 w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City *</label>
                                                <input
                                                    type="text"
                                                    value={shippingCity}
                                                    onChange={(e) => setShippingCity(e.target.value.replace(/[^a-zA-Z\s\-.]/g, ""))}
                                                    placeholder="Mumbai"
                                                    className="mt-1.5 w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ZIP / Postal Code *</label>
                                                <input
                                                    type="text"
                                                    value={shippingZip}
                                                    onChange={(e) => setShippingZip(e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, ""))}
                                                    placeholder="400001"
                                                    className="mt-1.5 w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country *</label>
                                                <input
                                                    type="text"
                                                    value={shippingCountry}
                                                    onChange={(e) => setShippingCountry(e.target.value.replace(/[^a-zA-Z\s\-.]/g, ""))}
                                                    placeholder="India"
                                                    className="mt-1.5 w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number *</label>
                                                <div className="relative mt-1.5">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="tel"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+\-\s()]/g, ""))}
                                                        placeholder="+91 98765 43210"
                                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            {hasSavedAddress && (
                                                <div className="sm:col-span-2 flex justify-end mt-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setUseSavedAddress(true)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => {
                                            if (!isAddressValid) {
                                                toast.error("Please fill in the address and phone number");
                                                return;
                                            }
                                            setStep(1);
                                        }}
                                        className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all hover:opacity-90"
                                    >
                                        Continue to Payment <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </section>
                            )}

                            {/* Step 1: Payment */}
                            {step === 1 && (
                                <section className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6">
                                    {/* Shipping summary */}
                                    <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-primary mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Delivering to</p>
                                                <p className="text-sm text-muted-foreground">{fullAddress}</p>
                                                <p className="text-sm text-muted-foreground">{phoneNumber}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setStep(0)} className="text-xs text-primary hover:underline font-medium">
                                            Change
                                        </button>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold">Payment Method</h2>
                                        <p className="text-sm text-muted-foreground mt-1">All payment methods are handled securely by Razorpay.</p>
                                    </div>

                                    {!paymentReady ? (
                                        <>
                                            {/* Payment method options — handled natively by Razorpay */}
                                            <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-4 text-center">
                                                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <Lock className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">Razorpay Secure Checkout</h3>
                                                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                                        You will be redirected to Razorpay to complete your payment securely using UPI, Cards, Net Banking, or Wallets.
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-12 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg transition-all hover:opacity-90"
                                                disabled={submitting}
                                                onClick={startPayment}
                                            >
                                                {submitting ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                                                ) : (
                                                    `Pay ${formatMoney(total)}`
                                                )}
                                            </Button>
                                        </>
                                    ) : isDev ? (
                                        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
                                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                                                <Lock className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-lg font-bold">Development Mode</h3>
                                            <p className="text-sm text-muted-foreground">
                                                No Razorpay key configured. Click below to simulate a successful payment.
                                            </p>
                                            <Button
                                                onClick={async () => {
                                                    // Simulate confirm API call in dev mode
                                                    try {
                                                        await fetch("/api/checkout/confirm", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            credentials: "include",
                                                            body: JSON.stringify({ orderGroupId: orderId }),
                                                        });
                                                    } catch (e) {
                                                        console.error("Dev confirm error:", e);
                                                    }
                                                    saveLocalOrders();
                                                    router.push('/dashboard/importer/orders');
                                                }}
                                                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
                                            >
                                                Simulate Payment Success
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
                                            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                                <Lock className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-lg font-bold">Razorpay Checkout Opened</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Complete your payment in the Razorpay popup window. If the popup didn't open, please disable your popup blocker and try again.
                                            </p>
                                            <Button
                                                onClick={startPayment}
                                                variant="outline"
                                                disabled={submitting}
                                                className="w-full h-12 font-semibold rounded-xl"
                                            >
                                                {submitting ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Initializing...</>
                                                ) : (
                                                    "Retry Payment"
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-6 pt-2 text-muted-foreground/50">
                                        <div className="flex items-center gap-1.5">
                                            <Lock className="h-3 w-3" />
                                            <span className="text-xs">SSL Encrypted</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Lock className="h-3 w-3" />
                                            <span className="text-xs">Secure Payment</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Step 2: Confirm */}
                            {step === 2 && (
                                <section className="bg-card border border-border rounded-xl p-8 sm:p-12 space-y-6 text-center shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                    
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-6">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                        
                                        <h2 className="text-3xl font-black tracking-tight mb-2">Payment Successful!</h2>
                                        <p className="text-muted-foreground">
                                            Your order has been placed and is being processed.
                                        </p>
                                        
                                        {orderId && (
                                            <div className="mt-6 p-4 rounded-lg bg-muted/40 font-mono text-sm max-w-sm mx-auto text-left flex justify-between">
                                                <span className="text-muted-foreground">Sequence ID:</span> <span className="font-bold">{orderId}</span>
                                            </div>
                                        )}

                                        {razorpayPaymentId && (
                                            <div className="mt-3 p-3 rounded-lg bg-muted/40 font-mono text-xs text-muted-foreground max-w-sm mx-auto text-left flex justify-between">
                                                <span>Payment ID:</span> <span className="font-semibold text-foreground">{razorpayPaymentId}</span>
                                            </div>
                                        )}
                                        
                                        <div className="pt-8 flex flex-col gap-4 max-w-sm mx-auto">
                                            <Button onClick={() => router.push('/dashboard/importer/orders')} className="w-full h-12 text-lg font-bold rounded-lg">
                                                View My Orders
                                            </Button>
                                            <Button onClick={() => router.push('/products')} variant="outline" className="w-full h-12 text-lg font-bold rounded-lg">
                                                Continue Shopping
                                            </Button>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 space-y-5">
                                <h3 className="text-lg font-bold flex items-center justify-between">
                                    <span>{quotedOrder ? "Quotation Summary" : "Order Summary"}</span>
                                    <Lock className="h-3.5 w-3.5 text-primary" />
                                </h3>

                                {loadingQuotedOrder && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Loading quotation details...
                                    </div>
                                )}

                                {quotedOrder && (
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                                        <p className="font-bold text-primary">Quotation #{quotedOrder.orderNumber}</p>
                                        <p className="text-muted-foreground mt-0.5">Wholesale Agreed Rate</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    {quotedOrder ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-lg bg-muted border border-border flex-shrink-0 overflow-hidden relative">
                                                {quotedOrder.product?.images?.[0] ? (
                                                    <Image src={quotedOrder.product.images[0]} alt={quotedOrder.product.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">N/A</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{quotedOrder.product?.name || "Quoted Product"}</p>
                                                <p className="text-xs text-muted-foreground">Qty: {quotedOrder.quantity} {quotedOrder.product?.unit || 'Units'}</p>
                                                {quotedOrder.notes && (
                                                    <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">{quotedOrder.notes}</p>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold">
                                                {formatMoney(quotedOrder.totalPrice)}
                                            </p>
                                        </div>
                                    ) : (
                                        rows.map(({ item, product }) => {
                                            const img = product?.images?.[0] ?? null;
                                            return (
                                                <div key={item.productId} className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-lg bg-muted border border-border flex-shrink-0 overflow-hidden relative">
                                                        {img ? (
                                                            <Image src={img} alt={product?.name ?? "Product"} fill className="object-cover" />
                                                        ) : (
                                                            <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">N/A</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{product?.name ?? item.productId}</p>
                                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold">
                                                        {formatMoney(getPrice(product) * item.quantity)}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="border-t border-border pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{formatMoney(total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium text-emerald-500">Free</span>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Total</span>
                                        <span className="text-2xl font-bold">{formatMoney(total)}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground text-center">
                                    Secure encrypted payment gateway.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
        </div>
        </SidebarProvider>
    );
}
