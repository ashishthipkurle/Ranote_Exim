"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RanoteLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  showTagline?: boolean;
}

export default function RanoteLogo({
  className = "h-8 md:h-10 w-auto",
  showTagline = true,
  ...props
}: RanoteLogoProps) {
  if (!showTagline) {
    return (
      <svg
        viewBox="0 0 540 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-7 md:h-8 w-auto select-none", className)}
        role="img"
        aria-label="Ranote Exim"
        {...props}
      >
        <text
          x="0"
          y="68"
          fill="#B8861A"
          className="dark:fill-[#EBC964] transition-colors"
          style={{
            fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            fontWeight: 800,
            fontSize: "76px",
            letterSpacing: "0.02em",
          }}
        >
          RANOTE EXIM
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 760 155"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 md:h-10 w-auto select-none", className)}
      role="img"
      aria-label="Ranote Exim - Exporting Excellence. Importing Trust"
      {...props}
    >
      {/* Brand Title: Bold Gold */}
      <text
        x="0"
        y="78"
        fill="#B8861A"
        className="dark:fill-[#EBC964] transition-colors"
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          fontWeight: 800,
          fontSize: "83px",
          letterSpacing: "0.02em",
        }}
      >
        RANOTE EXIM
      </text>

      {/* Tagline: Dark charcoal ink in light mode, clean soft cream in dark mode */}
      <text
        x="2"
        y="144"
        fill="#4A483F"
        className="fill-[#4A483F] dark:fill-[#D8D5CC] transition-colors"
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          fontWeight: 600,
          fontSize: "37.5px",
          letterSpacing: "-0.005em",
        }}
      >
        Exporting Excellence. Importing Trust
      </text>
    </svg>
  );
}

