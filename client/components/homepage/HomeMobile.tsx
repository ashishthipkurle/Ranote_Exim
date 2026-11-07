"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Globe, Shield, Zap, Package, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/client";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import RanoteLogo from "@/components/ui/RanoteLogo";

import TrendingCategories from "@/components/ui/TrendingCategories";
import HomeFooter from "@/components/homepage/HomeFooter";
import SriLankaCampaign from "@/components/homepage/SriLankaCampaign";
import CTASection from "@/components/homepage/CTASection";
import HomeHero from "@/components/homepage/HomeHero";

export default function HomeMobile() {
  const { t } = useTranslation();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full bg-background text-foreground overflow-x-hidden">
      {/* ─── Mobile Top Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Ranote Exim Home">
          <RanoteLogo className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-foreground/70">{t("login", "Login")}</Link>
          <Link href="/products" className="bg-primary text-white p-2 rounded-full shadow-lg shadow-primary/20">
            <ShoppingBag className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ─── Mobile Hero Section ─── */}
      <HomeHero />

      {/* ─── Fast Stats Marquee ─── */}
      <div className="w-full bg-card/50 border-y border-border py-4 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-8 whitespace-nowrap animate-[marquee_20s_linear_infinite] px-4 items-center">
          {[
            { label: "Verified Suppliers", val: "10k+" },
            { label: "Global Reach", val: "150+" },
            { label: "Products", val: "1M+" },
            { label: "Secure Payments", val: "100%" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-primary font-black">{stat.val}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">{stat.label}</span>
              <span className="text-muted-foreground/30 mx-4">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Mobile Categories ─── */}
      <section className="py-12 px-4 relative">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Explore Categories</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Global Marketplace</p>
          </div>
          <Link href="/products" className="text-primary text-sm font-semibold flex items-center">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* We can reuse the existing TrendingCategories, but it might need to handle its own mobile view properly. */}
        <div className="w-full">
          <TrendingCategories />
        </div>
      </section>

      {/* ─── Mobile Sri Lanka Campaign ─── */}
      <SriLankaCampaign />

      {/* ─── Mobile Features Grid ─── */}
      <section className="py-12 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Why Ranote Exim?</h2>
          <p className="text-sm text-muted-foreground">Enterprise-grade tools for modern global trade.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            {
              icon: Globe,
              title: "Global Connectivity",
              desc: "Access verified manufacturers and buyers from over 150 countries instantly.",
              color: "text-blue-400",
              bg: "bg-blue-400/10"
            },
            {
              icon: Shield,
              title: "Secure Transactions",
              desc: "Bank-grade security and escrow services ensuring peace of mind.",
              color: "text-amber-400",
              bg: "bg-amber-400/10"
            },
            {
              icon: Zap,
              title: "Automated Logistics",
              desc: "AI-driven freight forwarding and real-time shipment tracking.",
              color: "text-emerald-400",
              bg: "bg-emerald-400/10"
            },
            {
              icon: Package,
              title: "Bulk Procurement",
              desc: "Streamlined RFQ process and bulk pricing negotiation tools.",
              color: "text-purple-400",
              bg: "bg-purple-400/10"
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* ─── Mobile CTA ─── */}
      <CTASection />

      {/* ─── Mobile Footer ─── */}
      <div className="pb-10">
        <HomeFooter />
      </div>

    </div>
  );
}
