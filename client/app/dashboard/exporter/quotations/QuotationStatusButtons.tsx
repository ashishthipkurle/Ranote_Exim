"use client";

import { useTransition } from "react";
import { updateQuotationStatus } from "./actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function QuotationStatusButtons({
  quoteId,
  currentStatus,
}: {
  quoteId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (newStatus: string) => {
    startTransition(async () => {
      const res = await updateQuotationStatus(quoteId, newStatus);
      if (res?.success) {
        toast.success(`Quotation status updated to ${newStatus}`);
      } else {
        toast.error(res?.error || "Failed to update quotation");
      }
    });
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      {currentStatus !== "RESPONDED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleUpdate("RESPONDED")}
          className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors disabled:opacity-50 inline-flex items-center"
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
          className="text-[10px] uppercase font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors disabled:opacity-50 inline-flex items-center"
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
          Mark Closed
        </button>
      )}
    </div>
  );
}

