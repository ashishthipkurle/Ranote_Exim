"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateQuotationStatus } from "./actions";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function QuotationStatusButtons({
  quoteId,
  quotationId,
  currentStatus,
}: {
  quoteId?: string;
  quotationId?: string;
  currentStatus: string;
  clientEmail?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const targetId = quotationId || quoteId || "";

  const handleUpdate = (newStatus: string) => {
    if (!targetId) return;
    startTransition(async () => {
      const res = await updateQuotationStatus(targetId, newStatus);
      if (res?.success) {
        toast.success(`Quotation status updated to ${newStatus}`);
      } else {
        toast.error(res?.error || "Failed to update quotation");
      }
    });
  };

  return (
    <div className="mt-1 flex items-center flex-wrap gap-2">
      <Link
        href="/dashboard/exporter/directory"
        className="text-[10px] uppercase font-bold text-[#7A560A] bg-[#FBF1D6] hover:bg-[#F5E6BF] px-3 py-1.5 rounded-full transition-all inline-flex items-center gap-1 shadow-sm"
      >
        <Send className="w-3 h-3 text-[#C4912A]" />
        Send Quote via Buyers
      </Link>

      {currentStatus !== "RESPONDED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleUpdate("RESPONDED")}
          className="text-[10px] uppercase font-bold text-[#0B7A57] bg-[#E2F5EE] hover:bg-[#D4EFE4] px-3 py-1.5 rounded-full transition-all disabled:opacity-50 inline-flex items-center gap-1"
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Mark Responded
        </button>
      )}

      {currentStatus !== "CLOSED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleUpdate("CLOSED")}
          className="text-[10px] uppercase font-bold text-[#6B6A66] bg-[#F7F5F0] hover:bg-[#ECE7DA] px-3 py-1.5 rounded-full transition-all disabled:opacity-50 inline-flex items-center gap-1"
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Mark Closed
        </button>
      )}
    </div>
  );
}
