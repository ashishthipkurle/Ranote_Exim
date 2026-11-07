"use client";

import React, { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function MarketplaceFilterToggle({
  activeFilterCount = 0,
}: {
  activeFilterCount?: number;
}) {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/products");
  };

  return (
    <button
      type="button"
      onClick={() => setOpenMobile(true)}
      className={cn(
        "h-[44px] px-4 rounded-[14px] bg-white border border-[#ECE7DA] hover:border-[#C4912A] text-[#15130D] text-[14px] font-[700] flex items-center gap-2 shadow-sm transition-colors active:scale-95",
        activeFilterCount > 0 && "border-[#C4912A]/40 bg-[#FFFBF2]"
      )}
    >
      <SlidersHorizontal className="w-4 h-4 text-[#C4912A]" />
      <span>Filters</span>
      {activeFilterCount > 0 && (
        <span className="inline-flex items-center gap-1 bg-[#E2F5EE] text-[#0B7A57] text-[10px] font-[800] px-2 py-0.5 rounded-full border border-[#0B7A57]/20">
          {activeFilterCount}
          <span
            onClick={handleClearAll}
            className="hover:text-red-600 transition-colors cursor-pointer"
            title="Clear all filters"
          >
            ×
          </span>
        </span>
      )}
    </button>
  );
}

