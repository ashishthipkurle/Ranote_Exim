'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Send, FileText, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { getCart, removeFromCart, updateQuantity, CartItem as CartItemType, clearCart } from '@/lib/cart';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useTradeMode } from '@/hooks/useTradeMode';
import { useAuth } from '@/components/auth/AuthProvider';

type ProductInfo = {
  id: string;
  name: string;
  images: string[];
  category?: string;
  minOrderQty?: number;
};

export default function CartSheet({ customTrigger }: { customTrigger?: React.ReactNode } = {}) {
  const { user } = useAuth();
  const { b2cActive } = useTradeMode();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [productsById, setProductsById] = useState<Record<string, ProductInfo>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Quote form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  // Pre-fill user profile info
  useEffect(() => {
    if (user) {
      const u = user as any;
      if (u.name) setClientName(u.name);
      if (u.email) setClientEmail(u.email);
      if (u.phone) setClientPhone(u.phone);
      if (u.businessName) setBusinessName(u.businessName);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setItems(getCart());
    }
  }, [isOpen]);

  useEffect(() => {
    const updateCart = () => setItems(getCart());
    window.addEventListener('renote-cart-updated', updateCart);
    updateCart();
    return () => window.removeEventListener('renote-cart-updated', updateCart);
  }, []);

  // Fetch product metadata for items in cart
  useEffect(() => {
    const fetchProductDetails = async () => {
      const missingIds = items
        .map((i) => i.productId)
        .filter((id) => !productsById[id]);

      if (missingIds.length === 0) return;

      const next = { ...productsById };
      for (const id of missingIds) {
        try {
          const res = await fetch(`/api/products/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.product) {
              next[id] = {
                id: data.product.id,
                name: data.product.name,
                images: data.product.images || [],
                category: data.product.category,
                minOrderQty: data.product.minOrderQty,
              };
            }
          }
        } catch {
          // ignore error
        }
      }
      setProductsById(next);
    };

    if (items.length > 0) {
      void fetchProductDetails();
    }
  }, [items]);

  const handleUpdateQuantity = (id: string, q: number) => {
    updateQuantity(id, q);
    setItems(getCart());
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    setItems(getCart());
    toast.success('Item removed from cart');
  };

  const handleOpenQuoteModal = () => {
    if (items.length === 0) {
      toast.error('Your quotation list is empty.');
      return;
    }
    setIsQuoteModalOpen(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error('Please enter your Name and Email to receive the quotation.');
      return;
    }

    setSubmittingQuote(true);
    try {
      const quotePayload = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim() || undefined,
        businessName: businessName.trim() || undefined,
        notes: [
          destinationPort ? `Destination: ${destinationPort}` : '',
          quoteNotes ? `Notes: ${quoteNotes}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
        items: items.map((item) => ({
          productId: item.productId,
          name: productsById[item.productId]?.name || `Product (${item.productId.slice(0, 8)})`,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/whatsapp/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload),
      });

      if (res.ok) {
        clearCart();
        setItems([]);
        setIsQuoteModalOpen(false);
        setIsOpen(false);
        toast.success('Quotation request submitted! Our export team will send you custom pricing.');
      } else {
        toast.error('Failed to submit quote request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with server.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {customTrigger ? (
            customTrigger
          ) : (
            <Button variant="ghost" size="icon" className="relative group">
              <ShoppingCart className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground font-black text-[10px] flex items-center justify-center rounded-full animate-in zoom-in shadow-lg">
                  {totalItems}
                </span>
              )}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md bg-background border-border dark:border-white/5 p-0 flex flex-col backdrop-blur-3xl">
          <SheetHeader className="p-6 border-b border-border dark:border-white/5 bg-background/40">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground dark:text-white flex items-center gap-2 tracking-tighter uppercase font-black">
                {b2cActive ? (
                  <>
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    Your Cart
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 text-primary" />
                    Quotation Cart
                  </>
                )}
              </SheetTitle>
              {!b2cActive && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  B2B Wholesale
                </span>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-card dark:bg-white/5 border border-border dark:border-white/5 rounded-lg flex items-center justify-center mb-6 text-muted-foreground shadow-2xl">
                  <ShoppingCart className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-xl font-black text-foreground dark:text-white uppercase tracking-tighter mb-2">
                  Cart is empty
                </h3>
                <p className="text-muted-foreground text-xs uppercase tracking-widest leading-relaxed max-w-[220px] mb-8 font-bold opacity-60">
                  {b2cActive
                    ? "You haven't added any items to your cart yet."
                    : 'Add products with requested quantities to request a bulk wholesale quotation.'}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-border dark:border-white/10 text-muted-foreground hover:text-foreground dark:hover:text-white rounded-xl shadow-lg"
                >
                  <Link href="/products" onClick={() => setIsOpen(false)}>
                    Browse Products
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const prod = productsById[item.productId];
                  const img = prod?.images?.[0];
                  return (
                    <div
                      key={item.productId}
                      className="flex gap-4 p-4 rounded-xl border border-border dark:border-white/5 bg-card/60 backdrop-blur-xl shadow-sm transition-all hover:border-primary/40"
                    >
                      <div className="w-16 h-16 relative bg-background rounded-lg border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {img ? (
                          <Image src={img} alt={prod?.name || 'Product'} fill className="object-contain p-1" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-muted-foreground opacity-30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-foreground dark:text-white font-semibold text-xs leading-snug line-clamp-2">
                            {prod?.name || `Product ${item.productId.slice(0, 8)}...`}
                          </h4>
                          <p className="text-muted-foreground text-[10px] mt-0.5">
                            {b2cActive ? 'Direct Retail Item' : 'Bulk Wholesale Quotation'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 bg-background dark:bg-black/50 rounded-lg p-1 border border-border">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground bg-card rounded transition-all active:scale-95"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-foreground w-7 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground bg-card rounded transition-all active:scale-95"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <SheetFooter className="p-6 border-t border-border dark:border-white/5 bg-background/60 backdrop-blur-3xl">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-foreground font-black text-lg uppercase tracking-tight">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium text-center">
                  {b2cActive
                    ? 'Transit logistics calculated at checkout'
                    : 'Wholesale prices quoted per container / volume'}
                </p>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-12 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent transition-all"
                  >
                    <Link href="/cart" onClick={() => setIsOpen(false)}>
                      View Cart
                    </Link>
                  </Button>

                  {b2cActive ? (
                    <Button
                      asChild
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                    >
                      <Link href="/checkout" onClick={() => setIsOpen(false)}>
                        Checkout
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleOpenQuoteModal}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      Ask for Quotation
                    </Button>
                  )}
                </div>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Quote Request Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Request Wholesale Quotation</h3>
                  <p className="text-xs text-muted-foreground">Receive formal exporter pricing & port terms</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
              <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Products in Quote ({items.length})
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-muted-foreground pr-1 custom-scrollbar">
                  {items.map((i) => (
                    <div key={i.productId} className="flex justify-between items-center py-0.5">
                      <span className="truncate pr-2">
                        {productsById[i.productId]?.name || `Product ${i.productId.slice(0, 8)}`}
                      </span>
                      <span className="font-bold text-primary font-mono shrink-0">x{i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="buyer@company.com"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Company / Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Global Imports LLC"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Destination Country & Port</label>
                <input
                  type="text"
                  value={destinationPort}
                  onChange={(e) => setDestinationPort(e.target.value)}
                  placeholder="e.g. Jebel Ali, Dubai / Hamburg, Germany"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Notes / Requirements</label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Packaging specifications, target delivery timeline, certifications..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="flex-1 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingQuote}
                  className="flex-1 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
                >
                  {submittingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Quotation Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
