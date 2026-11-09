"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, CheckCircle2, Sliders, ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  const [currentPrefs, setCurrentPrefs] = useState<{
    essential: boolean;
    preferences: boolean;
    analytics: boolean;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)ranote_cookie_consent=([^;]*)/);
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        setCurrentPrefs(parsed);
      } else {
        const local = localStorage.getItem("cookie-consent");
        if (local) {
          setCurrentPrefs(JSON.parse(local));
        }
      }
    } catch {}
  }, []);

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent("open-cookie-settings"));
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#15130D] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A560A] hover:underline mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <div className="size-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
            <Cookie className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7A560A]">
              Compliance &amp; Transparency
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#15130D]">
              Cookie Policy
            </h1>
          </div>
        </div>

        <p className="text-sm text-[#6B6A66] mb-8">
          Last revised: March 2026 · Official Global Trade Security &amp; Telemetry Guidelines
        </p>

        {/* Current Status Card */}
        <div className="p-6 rounded-[24px] border border-[#ECE7DA] bg-gradient-to-b from-white to-[#FFFBF2] shadow-sm mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#0B7A57]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B7A57]">
                Your Current Settings
              </span>
            </div>
            <p className="text-sm font-extrabold text-[#15130D]">
              Essential: Active · Preferences: {currentPrefs?.preferences ? "Accepted" : "Restricted"} · Analytics: {currentPrefs?.analytics ? "Accepted" : "Restricted"}
            </p>
            {currentPrefs?.timestamp && (
              <p className="text-xs text-[#6B6A66] mt-1">
                Recorded: {new Date(currentPrefs.timestamp).toLocaleString()}
              </p>
            )}
          </div>

          <button
            onClick={openSettings}
            className="btn-gold-primary shrink-0 self-start sm:self-center"
          >
            <Sliders className="w-4 h-4 stroke-[2]" />
            Change Cookie Settings
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-8 text-sm leading-relaxed text-[#4A483F]">
          <section className="p-6 rounded-[20px] bg-white border border-[#ECE7DA]">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#15130D] mb-3">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small, encrypted cryptographic strings and text files stored in your web browser. They allow our global B2B trade platform to verify your authentication identity, prevent cross-site request forgery (CSRF), remember wholesale catalog preferences, and measure system latency without tracking sensitive personal identification without your permission.
            </p>
          </section>

          <section className="p-6 rounded-[20px] bg-white border border-[#ECE7DA]">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#15130D] mb-4">
              2. Cookies Deployed on Ranote Exim
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-[14px] bg-[#FFFBF2] border border-[#F0ECE0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#15130D]">
                    Essential &amp; Authentication Cookies
                  </span>
                  <span className="text-[10px] font-extrabold text-[#0B7A57] bg-[#E2F5EE] px-2 py-0.5 rounded-full">
                    Strictly Necessary
                  </span>
                </div>
                <p className="text-xs text-[#6B6A66]">
                  Key examples: <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#ECE7DA]">ranote_cookie_consent</code>, <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-[#ECE7DA]">sb-*-auth-token</code>.
                  Required to authenticate trade sessions, protect API requests, and safeguard escrow accounts.
                </p>
              </div>

              <div className="p-4 rounded-[14px] bg-[#FFFBF2] border border-[#F0ECE0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#15130D]">
                    Trade Preference Cookies
                  </span>
                  <span className="text-[10px] font-extrabold text-[#7A560A] bg-[#FBF1D6] px-2 py-0.5 rounded-full">
                    Customizable
                  </span>
                </div>
                <p className="text-xs text-[#6B6A66]">
                  Preserves your selected wholesale trade currency (USD, INR, EUR, etc.), language translation, and dashboard UI layout.
                </p>
              </div>

              <div className="p-4 rounded-[14px] bg-[#FFFBF2] border border-[#F0ECE0]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#15130D]">
                    Analytics Telemetry
                  </span>
                  <span className="text-[10px] font-extrabold text-[#7A560A] bg-[#FBF1D6] px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-[#6B6A66]">
                  Collects anonymous speed benchmarks, WebSocket ping latency, and page responsiveness to optimize global network routing across continents.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-[20px] bg-white border border-[#ECE7DA]">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#15130D] mb-3">
              3. Managing and Withdrawing Consent
            </h2>
            <p className="mb-4">
              You can adjust or revoke your cookie choices at any time by clicking the button above or using the consent preference controller in the platform footer. When non-essential cookies are declined, our system automatically removes tracking tokens and prevents third-party telemetry scripts from firing.
            </p>
            <button
              onClick={openSettings}
              className="btn-cream-secondary"
            >
              <Sliders className="w-4 h-4 stroke-[1.8]" />
              Open Cookie Controller
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
