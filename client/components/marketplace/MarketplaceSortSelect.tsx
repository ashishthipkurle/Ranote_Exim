"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

export default function MarketplaceSortSelect({ currentSort = "newest" }: { currentSort?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((s) => s.value === currentSort) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (sortVal: string) => {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (sortVal === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sortVal);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-[44px] px-4 rounded-[14px] bg-white border border-[#ECE7DA] hover:border-[#C4912A] text-[#15130D] text-[14px] font-[700] flex items-center gap-2 shadow-sm transition-colors active:scale-95"
      >
        <ArrowUpDown className="w-4 h-4 text-[#C4912A]" />
        <span>Sort: {selectedOption.label}</span>
        <ChevronDown className={cn("w-4 h-4 text-[#6B6A66] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-[#F0ECE0] rounded-[16px] shadow-[0_18px_40px_-20px_rgba(80,60,10,0.35)] py-1.5 z-50 animate-in fade-in zoom-in-95">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === (currentSort || "newest");
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-xs font-[600] flex items-center justify-between transition-colors",
                  isSelected
                    ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                    : "text-[#4A483F] hover:bg-[#F7F5F0] hover:text-[#15130D]"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#7A560A]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

