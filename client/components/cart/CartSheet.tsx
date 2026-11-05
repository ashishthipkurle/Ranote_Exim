'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Send } from 'lucide-react';
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
import QuoteRequestModal from '@/components/cart/QuoteRequestModal';

type ProductInfo = {
  id: string;
  name: string;
  images: string[];
  category?: string;
  minOrderQty?: number;
};

export default function CartSheet({ customTrigger }: { customTrigger?: React.ReactNode } = {}) {
  const { b2cActive } = useTradeMode();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [productsById, setProductsById] = useState<Record<string, ProductInfo>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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
    // Close the cart drawer immediately so it doesn't block or sit behind the modal
    setIsOpen(false);
    setIsQuoteModalOpen(true);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {customTrigger ? (
            customTrigger
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full w-10 h-10 border-border bg-background hover:bg-muted"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Button>
          )}
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 z-50">
          <SheetHeader className="p-6 border-b border-border/50 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-headline font-bold text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {b2cActive ? 'Your Shopping Cart' : 'Quotation Cart'}
              </SheetTitle>
              {!b2cActive && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  B2B Wholesale
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalItems === 0
                ? 'Your list is empty'
                : `${totalItems} ${totalItems === 1 ? 'item' : 'items'} ready for review`}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">No Items Added</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    {b2cActive
                      ? 'Explore our catalog to find verified global export products.'
                      : 'Add products with requested quantities to request a bulk wholesale quotation.'}
                  </p>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  size="sm"
                  asChild
                  className="mt-2"
                >
                  <Link href="/products">Browse Marketplace</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => {
                const product = productsById[item.productId];
                const image = product?.images?.[0] || '';

                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-3 rounded-xl border border-border/40 hover:border-border transition-all bg-card/50"
                  >
                    <div className="w-16 h-16 rounded-lg bg-muted border border-border/50 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                      {image ? (
                        <Image
                          src={image}
                          alt={product?.name || 'Product'}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {product?.name || 'Loading details...'}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {b2cActive ? 'Direct Retail Item' : 'Bulk Wholesale Quotation'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden h-7">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-muted-foreground/60 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <SheetFooter className="p-6 border-t border-border/50 bg-muted/20">
              <div className="w-full space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-foreground uppercase tracking-wider">Total Items</span>
                    <span className="font-bold font-mono text-sm">{totalItems}</span>
                  </div>
                  {!b2cActive && (
                    <p className="text-[10px] text-muted-foreground text-center italic">
                      Wholesale prices quoted per container / volume
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    asChild
                    onClick={() => setIsOpen(false)}
                    className="flex-1 h-12 rounded-lg font-bold text-xs uppercase tracking-wider"
                  >
                    <Link href="/cart">View Cart</Link>
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

      {/* Quote Request Modal portaled directly to document.body */}
      <QuoteRequestModal
        open={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        items={items}
        productsById={productsById}
        onSuccess={() => setItems([])}
      />
    </>
  );
}
