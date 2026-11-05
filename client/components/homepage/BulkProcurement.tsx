import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShieldCheck, Check, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

export default function BulkProcurement() {
  const { t } = useTranslation();
  const bulkSectionRef = useRef<HTMLElement>(null);
  const bulkHeadingRef = useRef<HTMLDivElement>(null);
  const bulkMainCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (bulkSectionRef.current && bulkHeadingRef.current && bulkMainCardRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: bulkSectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(
        bulkHeadingRef.current,
        { scale: 0.5, y: 100, opacity: 0, rotationX: 45 },
        { scale: 1, y: 0, opacity: 1, rotationX: 0, duration: 1, ease: "elastic.out(1, 0.5)" }
      )
        .fromTo(
          bulkMainCardRef.current,
          { x: -200, opacity: 0, rotationY: 45 },
          { x: 0, opacity: 1, rotationY: 0, duration: 0.8, ease: "power3.out" },
          "-=0.6"
        );
    }
  }, []);

  return (
    <section ref={bulkSectionRef} className="relative z-20 overflow-hidden border-b border-slate-200 dark:border-white/5" style={{ perspective: "1500px" }}>
      {/* Split Background */}
      <div className="absolute inset-0 flex flex-col lg:flex-row pointer-events-none -z-10 bg-background">
        <div
          className="w-full lg:w-1/2 h-full relative"
          style={{
            WebkitMaskImage: "linear-gradient(to right, black 70%, transparent 100%)",
            maskImage: "linear-gradient(to right, black 70%, transparent 100%)",
          }}
        >
          <Image src="/bulk-warehouse.png" alt="Warehouse Operations" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-background/60 lg:hidden"></div>
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-background to-transparent opacity-80"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div ref={bulkHeadingRef} className="text-center mb-16 opacity-0">
          <span className="text-primary text-sm font-bold uppercase tracking-widest mb-2 block">{t("bulk.badge", "Enterprise Sourcing")}</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {t("bulk.title_part1", "BULK PROCUREMENT")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">{t("bulk.title_part2", "SOLUTIONS")}</span>
          </h2>
        </div>
        <div className="flex justify-end pr-0 lg:pr-8">
          <div ref={bulkMainCardRef} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-8 md:p-10 rounded-2xl border border-white/50 dark:border-white/10 relative overflow-hidden shadow-2xl opacity-0 flex flex-col justify-center max-w-md w-full">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center mb-6 shadow-sm relative z-10">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37] stroke-[1.5]" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 relative z-10">{t("bulk.card_title", "RELIABLE INDIAN SOURCING")}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8 max-w-sm relative z-10">
              {t("bulk.card_desc", "We work with suitable Indian manufacturers and suppliers based on product requirements, specifications, quantity, quality expectations and export feasibility.")}
            </p>
            <ul className="space-y-4 mb-8 relative z-10">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 stroke-[3] mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{t("bulk.list_item1_title", "SUPPLIER IDENTIFICATION")}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block">{t("bulk.list_item1_desc", "Identify suitable sourcing options in India.")}</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 stroke-[3] mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{t("bulk.list_item2_title", "QUALITY COORDINATION")}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block">{t("bulk.list_item2_desc", "Coordinate product specifications and quality requirements.")}</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0 stroke-[3] mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{t("bulk.list_item3_title", "EXPORT SUPPORT")}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 block">{t("bulk.list_item3_desc", "Support documentation and shipment coordination for export orders.")}</span>
                </div>
              </li>
            </ul>
            <div className="mt-auto relative z-10">
              <Link href="/products" className="bg-[#D4AF37] hover:bg-[#B8962E] text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 flex items-center gap-2 group/btn max-w-max text-sm shadow-xl shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 hover:-translate-y-1">
                {t("bulk.button", "Request Bulk Quote")}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
