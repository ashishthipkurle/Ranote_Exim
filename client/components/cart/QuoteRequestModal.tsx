'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Loader2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { clearCart, CartItem } from '@/lib/cart';

interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  productsById: Record<string, { id: string; name: string }>;
  onSuccess?: () => void;
}

export default function QuoteRequestModal({
  open,
  onClose,
  items,
  productsById,
  onSuccess,
}: QuoteRequestModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  useEffect(() => {
    if (user) {
      const u = user as any;
      if (u.name) setClientName(u.name);
      if (u.email) setClientEmail(u.email);
      if (u.phone) setClientPhone(u.phone);
      if (u.businessName) setBusinessName(u.businessName);
    }
  }, [user]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error('Please enter your Name and Email to receive the quotation.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
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
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearCart();
        toast.success('Quotation request submitted! Our export team will send you custom pricing.');
        onSuccess?.();
        onClose();
      } else {
        toast.error('Failed to submit quote request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to communicate with server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
  );
}

