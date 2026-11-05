'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, ArrowRight, MessageSquare, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface QuotationOfferData {
  type: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  notes?: string;
  createdAt?: string;
}

export function parseQuotationOffer(body: string): QuotationOfferData | null {
  if (!body || !body.startsWith('[QUOTATION_OFFER:')) return null;
  try {
    const raw = body.slice('[QUOTATION_OFFER:'.length, body.length - 1);
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export default function QuotationOfferCard({
  offer,
  isBuyer,
  onBargain,
}: {
  offer: QuotationOfferData;
  isBuyer: boolean;
  onBargain?: (text: string) => void;
}) {
  const handleBargainClick = () => {
    const defaultCounter = `Regarding quotation #${offer.orderNumber} for ${offer.productName} (${offer.quantity} ${offer.unit} at ${offer.currency} ${offer.totalPrice}), would it be possible to offer `;
    onBargain?.(defaultCounter);
  };

  const formattedTotal = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(offer.totalPrice);

  const formattedUnit = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.currency || 'INR',
    maximumFractionDigits: 2,
  }).format(offer.unitPrice);

  return (
    <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-primary/[0.04] p-5 shadow-xl space-y-4 my-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Official Quotation
            </span>
            <p className="text-xs font-mono font-bold text-foreground">#{offer.orderNumber}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          Verified Offer
        </span>
      </div>

      {/* Product Details */}
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-xl bg-background border border-border flex-shrink-0 relative overflow-hidden flex items-center justify-center">
          {offer.productImage ? (
            <Image src={offer.productImage} alt={offer.productName} fill className="object-cover" />
          ) : (
            <FileText className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate">{offer.productName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quantity: <span className="font-bold text-foreground">{offer.quantity}</span> {offer.unit}
          </p>
          <p className="text-xs text-muted-foreground">
            Unit Rate: <span className="font-mono font-semibold text-foreground">{formattedUnit}</span>
          </p>
        </div>
      </div>

      {/* Quoted Total Highlight */}
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Total Quoted Amount
        </span>
        <span className="text-lg font-black text-primary font-mono">{formattedTotal}</span>
      </div>

      {/* Terms / Notes */}
      {offer.notes && (
        <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
          <span className="font-semibold text-foreground">Terms: </span>
          {offer.notes}
        </div>
      )}

      {/* Actions */}
      {isBuyer ? (
        <div className="pt-1 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBargainClick}
            className="flex-1 h-11 rounded-xl text-xs font-bold border-primary/30 hover:bg-primary/10 text-foreground flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            Bargain
          </Button>

          <Button
            asChild
            className="flex-1 h-11 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Link href={`/checkout?orderId=${offer.orderId}`}>
              <CreditCard className="w-4 h-4" />
              Accept & Pay
            </Link>
          </Button>
        </div>
      ) : (
        <div className="pt-1 text-center">
          <span className="text-[11px] font-semibold text-muted-foreground inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Quotation submitted. Pending buyer response or checkout.
          </span>
        </div>
      )}
    </div>
  );
}
