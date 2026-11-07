"use client";

import React from "react";

interface PlaceholderProps {
  children: React.ReactNode;
}

export function PlaceholderChip({ children }: PlaceholderProps) {
  return (
    <mark className="inline-flex items-center px-2 py-0.5 mx-1 rounded-[6px] text-xs font-mono font-bold bg-[#FBF1D6] text-[#7A560A] border border-[#C4912A]/40 tracking-wide select-none">
      [{children}]
    </mark>
  );
}

/**
 * Parses a string and renders any [[text]] as a PlaceholderChip
 */
export function renderWithPlaceholders(text: string): React.ReactNode {
  if (!text || !text.includes("[[")) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  const regex = /\[\[(.*?)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <PlaceholderChip key={match.index}>
        {match[1]}
      </PlaceholderChip>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

/**
 * Checks whether a document or string has any [[placeholders]]
 */
export function hasPlaceholders(data: any): boolean {
  const json = JSON.stringify(data);
  return json.includes("[[");
}

/**
 * Development Warning Banner if placeholders exist
 */
export function DevPlaceholderBanner({ count }: { count: number }) {
  if (process.env.NODE_ENV === "production" || count === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 p-4 rounded-[16px] bg-[#FEF6EE] border border-[#F38744]/40 text-[#B54708] flex items-center gap-3 text-xs md:text-sm font-semibold shadow-sm"
    >
      <span className="material-symbols-outlined text-[20px] text-[#F38744]">
        warning
      </span>
      <div className="flex-1">
        <span className="font-extrabold uppercase tracking-wider text-[11px] block">
          Development Notice: Unfinalized Placeholders Detected
        </span>
        This legal draft contains {count} placeholder item(s) formatted as <code className="bg-[#FBF1D6] text-[#7A560A] px-1 py-0.5 rounded font-mono text-xs">[[placeholder]]</code>. Production builds will fail until all placeholders are resolved.
      </div>
    </div>
  );
}

