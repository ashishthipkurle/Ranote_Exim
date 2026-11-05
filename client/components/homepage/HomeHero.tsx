"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/client";

export default function HomeHero() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const globesRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number>(0);

  // Parallax Scroll Effect for the realistic globe images
  // Optimised for iPad: uses only GPU-composited properties (transform, opacity)
  // with requestAnimationFrame throttling and cached DOM queries.
  useEffect(() => {
    if (!sectionRef.current) return;
    // Cache globe elements once — avoids querySelectorAll on every scroll tick
    globesRef.current = Array.from(
      sectionRef.current.querySelectorAll<HTMLElement>(".parallax-globe")
    );

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      rafRef.current = requestAnimationFrame(() => {
        ticking = false;

        const globes = globesRef.current;
        const section = sectionRef.current;
        if (globes.length === 0 || !section) return;

        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // How far the section has scrolled past the top of the viewport.
        const scrolled = Math.max(0, -rect.top);

        // translateY simulates the old backgroundPosition shift, but is GPU-composited
        const translateY = Math.min(scrolled * 0.04, 80); // capped to prevent over-scroll
        const rotation = scrolled * -0.02;
        const scale = 1.05 + scrolled * 0.0003;

        for (let i = 0; i < globes.length; i++) {
          const globe = globes[i];
          // translate3d promotes to its own compositor layer — no paint/layout
          globe.style.transform = `translate3d(0, ${-translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`;

          if (globe.id === "hero-globe-dark") {
            globe.style.opacity =
              scrolled > viewportHeight
                ? "0.6"
                : String(
                    Math.min(1, Math.max(0.6, 0.9 - scrolled * 0.0003))
                  );
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <header
      ref={sectionRef}
      className="relative min-h-[calc(100vh-3.5rem)] min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center overflow-hidden pt-8 sm:pt-10 md:pt-12 lg:pt-14 pb-10 sm:pb-12 md:pb-16 bg-background transition-colors duration-500"
    >
      <div className="absolute inset-0 z-0">

        {/* Light Mode Realistic Globe — GPU-promoted layer, no CSS transitions on transform */}
        <div
          className="parallax-globe absolute inset-[-10%] bg-[url('/assets/globe_light_theme.png')] bg-cover bg-[center_12%] dark:hidden opacity-100"
          id="hero-globe-light"
          aria-hidden="true"
          style={{ willChange: "transform", contain: "layout style", backfaceVisibility: "hidden" }}
        />

        {/* Dark Mode Realistic Globe — GPU-promoted layer, no CSS transitions on transform */}
        <div
          className="parallax-globe absolute inset-[-10%] hidden dark:block bg-[url('/assets/globe_dark_theme.avif')] bg-cover bg-[center_12%] opacity-90"
          id="hero-globe-dark"
          aria-hidden="true"
          style={{ willChange: "transform, opacity", contain: "layout style", backfaceVisibility: "hidden" }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:from-background-dark/90 dark:via-transparent dark:to-background-dark transition-colors duration-500 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent dark:from-background-dark/80 dark:via-transparent dark:to-background-dark/80 transition-colors duration-500 pointer-events-none" aria-hidden="true" />
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse transition-opacity duration-500 opacity-20 dark:opacity-100 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-1/3 right-1/4 w-[35rem] h-[35rem] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[140px] transition-opacity duration-500 opacity-20 dark:opacity-100 pointer-events-none" aria-hidden="true" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center justify-center h-full my-auto">

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-5 tracking-tight leading-[1.08] drop-shadow-2xl transition-colors duration-500 flex flex-col items-center gap-1 sm:gap-2">
          <span>{t("hero.title_part1", "EXPORTING INDIA'S QUALITY")}</span>
          <span className="gradient-text-gold text-glow relative inline-block">
            {t("hero.title_part2", "TO THE WORLD")}
            <svg
              className="absolute -bottom-2 w-full h-3 text-[#D4AF37] opacity-60"
              fill="none"
              viewBox="0 0 200 9"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.00025 6.99999C44.7571 2.29657 122.373 -3.10271 197.986 6.99999"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-800 dark:text-slate-200 max-w-3xl mx-auto mb-3 sm:mb-4 leading-relaxed font-medium drop-shadow-xl transition-colors duration-500">
          {t("hero.subtitle", "RANOTE EXIM is an Indian Merchant Exporter and Global Sourcing Partner, connecting international buyers with quality products and reliable suppliers across India.")}
        </p>

        <p className="text-sm sm:text-base md:text-lg text-foreground font-medium max-w-3xl mx-auto mb-6 sm:mb-8 tracking-wider transition-colors duration-500">
          {t("hero.features", "QUALITY SOURCING | EXPORT SUPPORT | GLOBAL TRADE")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-lg mx-auto">
          <Link
            className="w-full sm:w-1/2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 sm:py-4 px-6 rounded-xl primary-glow transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2 group flowing-border primary-glow-hover shadow-[0_0_40px_-10px_rgba(19,91,236,0.6)] hover:shadow-[0_0_60px_-10px_rgba(19,91,236,0.8)] hover:-translate-y-1"
            href="/products"
          >
            {t("hero.cta_start", "Request a Quote")}
            <span className="material-icons group-hover:translate-x-1 transition-transform text-sm">arrow_forward</span>
          </Link>
          <Link
            className="w-full sm:w-1/2 hover:bg-background/80 dark:hover:bg-white/10 text-foreground font-semibold py-3.5 sm:py-4 px-6 rounded-xl transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2 border border-border hover:border-border/80 hover:-translate-y-1 bg-background/40 backdrop-blur-xl shadow-lg"
            href="/products"
          >
            <span className="material-icons text-primary text-xl">shopping_cart</span>
            {t("hero.cta_buy", "Explore Products")}
          </Link>
        </div>
      </div>


    </header>
  );
}
