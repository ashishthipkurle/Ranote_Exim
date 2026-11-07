"use client";

import React, { useState } from "react";
import { useTradeMode } from "@/hooks/useTradeMode";
import { Briefcase, AlertCircle, Loader2, Check } from "lucide-react";

export default function TradeModeToggle() {
  const { b2cActive, loading, toggleTradeMode } = useTradeMode();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<boolean>(false);

  const handleSelectMode = (enableB2C: boolean) => {
    if (enableB2C === b2cActive) return;
    setTargetMode(enableB2C);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    await toggleTradeMode(targetMode);
  };

  return (
    <>
      <div className="bg-gradient-to-b from-white to-[#FFFBF0] border border-[#F0ECE0] rounded-[24px] p-7 md:p-[28px] shadow-[0_4px_20px_rgba(21,19,13,0.04)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-[48px] h-[48px] rounded-[14px] bg-[#FBF1D6] text-[#7A560A] flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-[20px] font-[800] text-[#15130D] leading-snug">
                    Website Trade Model (B2B vs B2C)
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-[800] uppercase tracking-wider ${
                      b2cActive
                        ? "bg-[#FEF0C7] text-[#B54708] border border-[#FEDF89]"
                        : "bg-[#E2F5EE] text-[#0B7A57] border border-[#BFE8D9]"
                    }`}
                  >
                    {b2cActive ? "B2C RETAIL ACTIVE" : "PURE B2B WHOLESALE"}
                  </span>
                </div>
                <p className="text-[14px] text-[#4A483F] mt-1 max-w-xl leading-relaxed">
                  {b2cActive
                    ? "B2C is ON: Public retail prices are visible and buyers can check out directly via payment gateway."
                    : "B2C is OFF (B2B Only): Product prices and payment gateway are hidden. Buyers add items to cart and submit Quotation Requests for export pricing."}
                </p>
              </div>
            </div>
          </div>

          {/* Right segmented control */}
          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-end gap-2.5 shrink-0">
            <div className="text-left sm:text-right">
              <span className="block text-[13px] font-[700] text-[#15130D]">
                {b2cActive ? "B2C Retail Mode" : "B2B Quotation Mode"}
              </span>
              <span className="block text-[12px] text-[#6B6A66]">
                {b2cActive ? "Prices & payment enabled" : "Prices & payment hidden"}
              </span>
            </div>

            {/* Segmented control [ B2B | B2C ] */}
            <div className="bg-[#F7F5F0] p-1.5 rounded-[16px] border border-[#F0ECE0] inline-flex items-center gap-1 shadow-inner">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectMode(false)}
                className={`h-[40px] px-5 rounded-[12px] text-xs font-[800] transition-all flex items-center gap-1.5 ${
                  !b2cActive
                    ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] shadow-sm"
                    : "text-[#6B6A66] hover:text-[#15130D] hover:bg-white/60"
                }`}
              >
                {!b2cActive && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                B2B
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectMode(true)}
                className={`h-[40px] px-5 rounded-[12px] text-xs font-[800] transition-all flex items-center gap-1.5 ${
                  b2cActive
                    ? "bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] shadow-sm"
                    : "text-[#6B6A66] hover:text-[#15130D] hover:bg-white/60"
                }`}
              >
                {b2cActive && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                B2C
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-[#F0ECE0] p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4D6] text-[#7A560A] flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-[18px] font-[800] text-[#15130D]">
                  Switch Trade Model to {targetMode ? "B2C Retail" : "Pure B2B"}?
                </h4>
                <p className="text-[14px] text-[#4A483F] mt-1.5 leading-relaxed">
                  {targetMode
                    ? "Activating B2C Mode will immediately display unit pricing publicly across the entire marketplace and enable direct online checkout for all buyers."
                    : "Switching to Pure B2B Mode will hide public product prices site-wide and require international buyers to submit quotation requests for export pricing."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0ECE0]">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-[44px] px-5 rounded-[12px] border border-[#F0ECE0] bg-[#F7F5F0] hover:bg-[#F0ECE0] text-[13px] font-[700] text-[#4A483F] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirm}
                className="h-[44px] px-6 rounded-[12px] bg-gradient-to-r from-[#C4912A] to-[#EBC964] text-[#15130D] font-[800] text-[13px] shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
