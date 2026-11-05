'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, CheckCircle2, Loader2, X, Send, Building2, MapPin, Phone, Mail, User } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [destinationPort, setDestinationPort] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      const u = user as any;
      if (u.name) setClientName(u.name);
      if (u.email) setClientEmail(u.email);
      if (u.phone) setClientPhone(u.phone);
      if (u.businessName) setBusinessName(u.businessName);
    }
  }, [user]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

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

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-left relative z-10 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-foreground">Request Wholesale Quotation</h3>
              <p className="text-xs text-muted-foreground">Receive formal exporter pricing & port terms</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Products Summary */}
          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/50">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Products in Quote ({items.length})
            </p>
            <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs text-muted-foreground pr-1 custom-scrollbar">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between items-center py-0.5 border-b border-border/30 last:border-0">
                  <span className="truncate pr-2 font-medium">
                    {productsById[i.productId]?.name || `Product ${i.productId.slice(0, 8)}`}
                  </span>
                  <span className="font-bold text-primary font-mono shrink-0">x{i.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3 text-muted-foreground" />
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-muted-foreground" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="buyer@company.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-muted-foreground" />
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                Company / Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Global Imports LLC"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              Destination Country & Port
            </label>
            <input
              type="text"
              value={destinationPort}
              onChange={(e) => setDestinationPort(e.target.value)}
              placeholder="e.g. Jebel Ali, Dubai / Hamburg, Germany / Long Beach, USA"
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Notes / Special Requirements</label>
            <textarea
              rows={2}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="Packaging specifications, target delivery timeline, certifications..."
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl text-xs font-semibold h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 h-11"
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

  return createPortal(modalContent, document.body);
}
