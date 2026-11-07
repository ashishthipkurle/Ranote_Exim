"use client";

import React from "react";
import { LegalSummaryItem } from "@/content/legal/types";
import { renderWithPlaceholders } from "./Placeholder";

interface LegalSummaryProps {
  summary: [LegalSummaryItem, LegalSummaryItem, LegalSummaryItem];
}

export default function LegalSummary({ summary }: LegalSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      {summary.map((item, idx) => (
        <div
          key={idx}
          className="border border-[#F0ECE0] rounded-[20px] p-5 shadow-sm transition-all"
          style={{ background: "linear-gradient(160deg, #ffffff, #FFFBF0)" }}
        >
          <div className="size-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center mb-3.5">
            <span className="material-symbols-outlined text-[22px]">
              {item.icon || "verified"}
            </span>
          </div>
          <h3 className="text-[15px] font-[800] text-[#15130D] mb-1.5 leading-snug">
            {renderWithPlaceholders(item.title)}
          </h3>
          <p className="text-[13px] leading-[1.6] text-[#6B6A66]">
            {renderWithPlaceholders(item.description)}
          </p>
        </div>
      ))}
    </div>
  );
}

