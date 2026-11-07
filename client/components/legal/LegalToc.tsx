"use client";

import React, { useEffect, useState } from "react";
import { LegalSection } from "@/content/legal/types";
import { cn } from "@/lib/utils";
import { List, X } from "lucide-react";

interface LegalTocProps {
  sections: LegalSection[];
}

export default function LegalToc({ sections }: LegalTocProps) {
  const [activeSlug, setActiveSlug] = useState<string>(sections[0]?.slug || "");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // Pick the top visible entry
        const topEntry = visibleEntries.reduce((prev, curr) =>
          prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
        );
        setActiveSlug(topEntry.target.id);
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "-90px 0px -60% 0px",
      threshold: [0, 0.2, 0.5],
    });

    sections.forEach((s) => {
      const el = document.getElementById(s.slug);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (slug: string) => {
    setActiveSlug(slug);
    setIsSheetOpen(false);
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${slug}`);
    }
  };

  return (
    <>
      {/* ── DESKTOP TOC (>= 900px): 236px, Transparent, Sticky ── */}
      <aside
        aria-label="Table of contents"
        className="hidden min-[900px]:flex flex-col w-[236px] shrink-0 sticky top-[88px] max-h-[calc(100vh-108px)] select-none overflow-y-auto no-scrollbar pr-3 pt-2"
      >
        <div className="mb-3 px-3">
          <span className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66]">
            ON THIS PAGE
          </span>
        </div>

        <nav className="flex flex-col space-y-[2px]">
          {sections.map((section, idx) => {
            const isActive = activeSlug === section.slug;
            return (
              <a
                key={section.slug}
                href={`#${section.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(section.slug);
                }}
                className={cn(
                  "min-h-[44px] px-[14px] py-[10px] rounded-[14px] text-[14px] font-[600] flex items-center gap-2.5 transition-colors duration-150 leading-snug",
                  isActive
                    ? "bg-[#FBF1D6] text-[#7A560A] font-[700] shadow-none"
                    : "text-[#4A483F] hover:bg-[rgba(251,241,214,0.55)] hover:text-[#15130D]"
                )}
                aria-current={isActive ? "location" : undefined}
              >
                <span
                  className={cn(
                    "text-[11px] font-[800] shrink-0 w-5",
                    isActive ? "text-[#C4912A]" : "text-[#6B6A66]"
                  )}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="truncate">{section.title}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* ── MOBILE / TABLET STICKY PILL (< 900px) ── */}
      <div className="min-[900px]:hidden sticky top-[68px] z-30 py-2.5 bg-[#F4F4F7]/95 backdrop-blur-md -mx-3 px-3 sm:-mx-6 sm:px-6 mb-4 border-b border-[#ECE7DA]/70 flex items-center justify-between">
        <button
          onClick={() => setIsSheetOpen(true)}
          className="h-10 px-4 rounded-full bg-white border border-[#ECE7DA] shadow-sm text-xs font-[700] text-[#7A560A] flex items-center gap-2 hover:bg-[#FBF1D6] transition-colors"
          aria-expanded={isSheetOpen}
        >
          <List className="w-4 h-4 text-[#C4912A]" />
          <span>On this page: <strong className="text-[#15130D]">{sections.find(s => s.slug === activeSlug)?.title || "Overview"}</strong></span>
        </button>
      </div>

      {/* ── MOBILE BOTTOM SHEET (< 900px) ── */}
      {isSheetOpen && (
        <div className="min-[900px]:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-[#14120B]/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-[28px] max-h-[80vh] flex flex-col p-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE0]">
              <span className="text-xs font-[800] uppercase tracking-[0.14em] text-[#6B6A66]">
                ON THIS PAGE
              </span>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="size-8 rounded-full bg-[#F7F5F0] flex items-center justify-center text-[#6B6A66] hover:text-[#15130D]"
                aria-label="Close table of contents"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto py-3 space-y-1 custom-scrollbar">
              {sections.map((section, idx) => {
                const isActive = activeSlug === section.slug;
                return (
                  <button
                    key={section.slug}
                    onClick={() => scrollTo(section.slug)}
                    className={cn(
                      "w-full text-left min-h-[44px] px-3.5 py-2.5 rounded-[14px] text-sm font-[600] flex items-center gap-3 transition-colors",
                      isActive
                        ? "bg-[#FBF1D6] text-[#7A560A] font-[700]"
                        : "text-[#4A483F] hover:bg-[#F7F5F0]"
                    )}
                  >
                    <span className="text-xs font-bold text-[#C4912A] w-5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

