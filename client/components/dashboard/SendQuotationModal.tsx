'use client';

import React, { useState, useEffect } from 'react';
import { FileText, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductOption {
  id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
}

interface SendQuotationModalProps {
  open: boolean;
  onClose: () => void;
  buyer: { id: string; name: string; country?: string | null } | null;
  onQuotationSent?: (order: any) => void;
}

export default function SendQuotationModal({
  open,
  onClose,
  buyer,
  onQuotationSent,
}: SendQuotationModalProps) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [totalPrice, setTotalPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('INR');
  const [terms, setTerms] = useState('FOB Nhava Sheva / Mumbai Port. Lead time 14 days.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingProducts(true);
      fetch('/api/products')
        .then((r) => r.json())
        .then((data) => {
          if (data?.products) {
            setProducts(data.products);
            if (data.products.length > 0 && !selectedProductId) {
              setSelectedProductId(data.products[0].id);
            }
          }
        })
        .catch((err) => console.error('Failed to load products', err))
        .finally(() => setLoadingProducts(false));
    }
  }, [open]);

  if (!open || !buyer) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!totalPrice || Number(totalPrice) <= 0) {
      toast.error('Please enter a valid quoted total price');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/quotations/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: buyer.id,
          productId: selectedProductId,
          quantity: Number(quantity) || 1,
          totalPrice: Number(totalPrice),
          unitPrice: Number(totalPrice) / (Number(quantity) || 1),
          currency,
          notes: terms.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Formal quotation sent to ${buyer.name}!`);
        onQuotationSent?.(data.order);
        onClose();
      } else {
        toast.error(data.error || 'Failed to transmit quotation');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error transmitting quotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Send Official Quotation</h3>
              <p className="text-xs text-muted-foreground">
                Issuing wholesale offer to <span className="font-semibold text-foreground">{buyer.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Product <span className="text-red-500">*</span>
            </label>
            {loadingProducts ? (
              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading inventory...
              </div>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit || 'Units'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quantity ({selectedProduct?.unit || 'Units'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Total Quoted Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  {currency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 50000"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full text-xs pl-7 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Calculated Unit Rate</label>
              <div className="px-3 py-2.5 rounded-lg bg-muted/40 border border-border text-xs font-mono font-bold text-foreground">
                {totalPrice && Number(totalPrice) > 0
                  ? `${currency} ${(Number(totalPrice) / quantity).toFixed(2)} / unit`
                  : '—'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Export Terms & Delivery Timeline
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. CIF Hamburg, packaging in corrugated master boxes, delivery within 14 days."
              className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Transmit Quotation Offer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
