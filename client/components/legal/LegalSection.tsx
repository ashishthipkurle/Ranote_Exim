"use client";

import React from "react";
import { LegalSection as LegalSectionType } from "@/content/legal/types";
import { renderWithPlaceholders } from "./Placeholder";

interface LegalSectionProps {
  section: LegalSectionType;
  index: number;
}

export default function LegalSection({ section, index }: LegalSectionProps) {
  return (
    <section
      id={section.slug}
      style={{ scrollMarginTop: "88px" }}
      className="pb-10 mb-10 border-b border-[#F0ECE0] last:border-b-0 last:pb-0 last:mb-0"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="size-[34px] rounded-[10px] bg-[#FBF1D6] text-[#7A560A] font-[800] text-[13px] flex items-center justify-center shrink-0 select-none">
          {String(index + 1).padStart(2, "0")}
        </div>
        <h2 className="text-[20px] font-[800] tracking-[-0.01em] text-[#15130D]">
          {renderWithPlaceholders(section.title)}
        </h2>
      </div>

      {/* Section Content */}
      <div className="space-y-4">
        {section.blocks.map((block, bIdx) => {
          if (typeof block === "string") {
            return (
              <p
                key={bIdx}
                className="text-[15px] leading-[1.7] text-[#3A382F]"
              >
                {renderWithPlaceholders(block)}
              </p>
            );
          }

          if (block.type === "bullets") {
            return (
              <ul key={bIdx} className="space-y-2.5 my-3 pl-1">
                {block.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-3 text-[15px] leading-[1.7] text-[#3A382F]">
                    <span className="size-[7px] rounded-full bg-[#C4912A] shrink-0 mt-[10px]" />
                    <div className="flex-1">
                      {renderWithPlaceholders(item)}
                    </div>
                  </li>
                ))}
              </ul>
            );
          }

          return null;
        })}
      </div>
    </section>
  );
}

