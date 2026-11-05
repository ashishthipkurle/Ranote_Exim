"use client";

import React from "react";
import { useTradeMode } from "@/hooks/useTradeMode";
import { ShoppingBag, Briefcase, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

export default function TradeModeToggle() {
  const { b2cActive, loading, toggleTradeMode } = useTradeMode();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${b2cActive ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>
              {b2cActive ? <ShoppingBag className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Website Trade Model (B2B vs B2C)
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                b2cActive
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
              }`}
            >
              {b2cActive ? "B2C Retail Active" : "Pure B2B Wholesale"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            {b2cActive
              ? "B2C is ON: Public retail prices are visible and users can check out directly using the payment gateway."
              : "B2C is OFF (B2B Only): Product prices and payment gateway are hidden. Buyers add items to cart and submit Quotation Requests for export pricing."}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {b2cActive ? "B2C Retail Mode" : "B2B Quotation Mode"}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              {b2cActive ? "Prices & Payment Enabled" : "Prices & Payment Hidden"}
            </span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => toggleTradeMode(!b2cActive)}
            className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
              b2cActive ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
            role="switch"
            aria-checked={b2cActive}
          >
            <span className="sr-only">Toggle B2C Mode</span>
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                b2cActive ? "translate-x-8 text-amber-600" : "translate-x-0 text-slate-400"
              }`}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : b2cActive ? (
                "B2C"
              ) : (
                "B2B"
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
