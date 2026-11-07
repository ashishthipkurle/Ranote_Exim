"use client";

import React from "react";
import Link from "next/link";
import { LegalDocument } from "@/content/legal/types";
import { useAuth } from "@/components/auth/AuthProvider";
import RanoteLogo from "@/components/ui/RanoteLogo";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import LegalToc from "./LegalToc";
import LegalSummary from "./LegalSummary";
import LegalSection from "./LegalSection";
import LegalContactCard from "./LegalContactCard";
import { DevPlaceholderBanner, hasPlaceholders } from "./Placeholder";
import { cn } from "@/lib/utils";
import { Home, ChevronRight } from "lucide-react";

interface LegalLayoutProps {
  document: LegalDocument;
  pageType: "privacy-policy" | "terms";
  pageTitle: string;
}

export default function LegalLayout({
  document,
  pageType,
  pageTitle,
}: LegalLayoutProps) {
  const { user, loading } = useAuth();
  const placeholderCount = hasPlaceholders(document) ? 1 : 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F4F4F7] text-[#15130D] flex flex-col font-sans selection:bg-[#FBF1D6] selection:text-[#7A560A]">
        {/* Skip to Content for Accessibility */}
      <a
        href="#legal-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#C4912A] text-white font-bold rounded-lg shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ── HEADER ── */}
      {/* If signed in: standard DashboardHeader. If signed out: minimal public header */}
      {!loading && user ? (
        <div className="print:hidden">
          <DashboardHeader />
        </div>
      ) : (
        <header className="print:hidden sticky top-0 z-40 h-[68px] bg-white/95 backdrop-blur-md border-b border-[#ECE7DA] flex items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center" aria-label="Ranote Exim Home">
            <RanoteLogo className="h-8 md:h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="h-9 px-4 rounded-full bg-[#F7F5F0] hover:bg-[#FBF1D6] border border-[#ECE7DA] text-xs font-[700] text-[#7A560A] hover:text-[#15130D] transition-colors flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </header>
      )}

      {/* ── BODY CONTAINER ── */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto p-3 sm:p-5 md:py-6 md:px-8 flex flex-col min-[900px]:flex-row gap-6">
        {/* Left Column: TOC (Desktop sticky / Mobile sheet) */}
        <div className="print:hidden">
          <LegalToc sections={document.sections} />
        </div>

        {/* Main Floating White Card */}
        <main
          id="legal-content"
          className="flex-1 min-w-0 bg-white rounded-[20px] sm:rounded-[28px] shadow-[0_20px_50px_-28px_rgba(80,60,10,0.35)] border border-[#F0ECE0] p-5 sm:p-7 md:p-[28px_40px_44px] transition-all"
        >
          {/* Dev Mode Placeholder Banner */}
          <DevPlaceholderBanner count={placeholderCount} />

          {/* Breadcrumb: Legal / {Page} */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[13px] font-[600] text-[#6B6A66] mb-3 print:hidden"
          >
            <Link
              href="/"
              className="flex items-center gap-1 text-[#6B6A66] hover:text-[#C4912A] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#ECE7DA]" />
            <span className="text-[#6B6A66]">Legal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#ECE7DA]" />
            <span className="text-[#7A560A] font-[700]">{pageTitle}</span>
          </nav>

          {/* Title Row + Real-link Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-[#F0ECE0]">
            <div>
              <h1 className="text-[28px] sm:text-[34px] md:text-[38px] font-[800] tracking-[-0.02em] text-[#15130D] leading-tight">
                {pageTitle}
              </h1>
              <p className="text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66] mt-2">
                LAST UPDATED {document.updatedAt.toUpperCase()} · EFFECTIVE {document.effectiveAt.toUpperCase()} · V{document.version}
              </p>
            </div>

            {/* Two real-link tabs on the right */}
            <nav
              aria-label="Legal document switcher"
              className="flex items-center gap-1.5 p-1 rounded-full bg-[#F7F5F0] border border-[#ECE7DA] shrink-0 self-start md:self-auto print:hidden"
            >
              <Link
                href="/privacy-policy"
                aria-current={pageType === "privacy-policy" ? "page" : undefined}
                className={cn(
                  "h-9 px-4 rounded-full text-xs font-[700] flex items-center transition-all",
                  pageType === "privacy-policy"
                    ? "bg-white text-[#7A560A] shadow-sm font-[800]"
                    : "text-[#6B6A66] hover:text-[#15130D]"
                )}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                aria-current={pageType === "terms" ? "page" : undefined}
                className={cn(
                  "h-9 px-4 rounded-full text-xs font-[700] flex items-center transition-all",
                  pageType === "terms"
                    ? "bg-white text-[#7A560A] shadow-sm font-[800]"
                    : "text-[#6B6A66] hover:text-[#15130D]"
                )}
              >
                Terms & Conditions
              </Link>
            </nav>
          </div>

          {/* 3 Summary Cards */}
          <div className="print:hidden">
            <LegalSummary summary={document.summary} />
          </div>

          {/* Article: Max-Width 780px */}
          <article className="max-w-[780px] legal-article">
            {document.sections.map((section, idx) => (
              <LegalSection
                key={section.slug}
                section={section}
                index={idx}
              />
            ))}

            {/* Grievance & Contact Card */}
            <LegalContactCard
              title={document.contact.title}
              note={document.contact.note}
              officer={document.contact.officer}
            />
          </article>
        </main>
      </div>

      {/* ── PRINT STYLESHEET ── */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, aside, nav, .print\\:hidden {
            display: none !important;
          }
          main {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          article {
            max-width: 100% !important;
          }
          section {
            page-break-inside: avoid;
            border-bottom: 1px solid #ccc !important;
          }
          a[href^="http"]::after {
            content: " (" attr(href) ")";
            font-size: 80%;
            color: #555;
          }
        }
      `}</style>
      </div>
    </SidebarProvider>
  );
}

