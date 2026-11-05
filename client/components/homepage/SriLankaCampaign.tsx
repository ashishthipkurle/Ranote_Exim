"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * SriLankaCampaign — Premium campaign section with a real generated map
 * image of India + Sri Lanka, overlaid with an animated SVG shipping route
 * arc from Mumbai to Colombo.
 *
 * The map image is a pre-generated dark-themed visualization placed in
 * /assets/india_srilanka_map.jpg. The animated route, city markers,
 * and labels are rendered as an SVG overlay on top.
 */

// Positions calibrated to the generated map image (percentage-based)
const MUMBAI = { x: 32, y: 56 };
const COLOMBO = { x: 53, y: 88 };

// SVG viewBox-relative arc path from Mumbai to Colombo
const ROUTE_PATH = `M ${MUMBAI.x} ${MUMBAI.y} C ${MUMBAI.x - 15} ${MUMBAI.y + 18}, ${COLOMBO.x - 18} ${COLOMBO.y - 15}, ${COLOMBO.x} ${COLOMBO.y}`;

export default function SriLankaCampaign() {
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 relative z-20 overflow-hidden border-t border-border bg-[#0a0e17]"
    >
      {/* Full-width dark cinematic background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(255,153,51,0.06)_0%,_transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* ─── Left: Text Content ─── */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {/* Flag indicators — using colored badges instead of emojis (Windows doesn't render flag emojis) */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <div className="w-6 h-4 rounded-sm overflow-hidden flex flex-shrink-0">
                  <div className="w-full h-[33%] bg-[#FF9933]" />
                  <div className="w-full h-[34%] bg-white" />
                  <div className="w-full h-[33%] bg-[#138808]" />
                </div>
                <span className="text-white/70 text-xs font-bold uppercase tracking-widest">
                  India
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <div className="w-8 h-px bg-gradient-to-r from-[#FF9933] to-[#8D153A]" />
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#8D153A]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <div className="w-6 h-4 rounded-sm overflow-hidden bg-[#8D153A] flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 bg-[#EB7400] rounded-sm" />
                </div>
                <span className="text-white/70 text-xs font-bold uppercase tracking-widest">
                  Sri Lanka
                </span>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tight leading-[1.05]">
              SOURCE FROM{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#138808]">
                INDIA
              </span>
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white/80 mb-10 tracking-tight leading-[1.1]">
              FOR YOUR{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EB7400] to-[#8D153A]">
                SRI LANKAN
              </span>{" "}
              BUSINESS
            </h2>

            <p className="text-lg text-white/50 mb-4 leading-relaxed max-w-xl mx-auto lg:mx-0">
              RANOTE EXIM helps Sri Lankan businesses explore selected products
              and sourcing opportunities from India.
            </p>
            <p className="text-lg text-white/50 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Share your requirement and let us explore suitable Indian sourcing
              options for your business.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF9933] to-[#EB7400] hover:from-[#FFa94d] hover:to-[#FF8C00] text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-base shadow-[0_0_40px_-10px_rgba(255,153,51,0.5)] hover:shadow-[0_0_60px_-10px_rgba(255,153,51,0.7)] hover:-translate-y-1 uppercase tracking-wider"
            >
              Request a Sri Lanka Quote
              <span className="material-icons text-xl">east</span>
            </Link>
          </motion.div>

          {/* ─── Right: Real Map with Animated Route Overlay ─── */}
          <motion.div
            className="flex-1 w-full max-w-[800px] xl:max-w-[900px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1.25 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div 
              className="relative w-full aspect-[4/3] md:aspect-[1/1]"
              style={{
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)'
              }}
            >
              {/* Real map image */}
              <Image
                src="/assets/india_srilanka_map.jpg"
                alt="India to Sri Lanka trade route map"
                fill
                className="object-cover"
                unoptimized
              />

              {/* Animated SVG overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="slRouteGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#FF9933" />
                    <stop offset="100%" stopColor="#8D153A" />
                  </linearGradient>
                  <filter id="slRouteGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="slCityGlow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Dashed background route */}
                <path
                  d={ROUTE_PATH}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  fill="none"
                />

                {/* Animated glowing route */}
                <motion.path
                  d={ROUTE_PATH}
                  stroke="url(#slRouteGrad)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#slRouteGlow)"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: [0, 1] } : {}}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1.5,
                  }}
                />

                {/* Traveling dot along route */}
                {isInView && (
                  <circle r="1.2" fill="white" filter="url(#slCityGlow)">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path={ROUTE_PATH}
                    />
                  </circle>
                )}

                {/* Mumbai city marker */}
                <circle
                  cx={MUMBAI.x}
                  cy={MUMBAI.y}
                  r="1.5"
                  fill="#FF9933"
                  filter="url(#slCityGlow)"
                />
                {isInView && (
                  <motion.circle
                    cx={MUMBAI.x}
                    cy={MUMBAI.y}
                    r="1.5"
                    fill="none"
                    stroke="#FF9933"
                    strokeWidth="0.4"
                    animate={{ r: [1.5, 5], opacity: [0.7, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeOut",
                    }}
                  />
                )}
                <text
                  x={MUMBAI.x + 3}
                  y={MUMBAI.y - 2}
                  fill="rgba(255,153,51,0.9)"
                  fontSize="2.8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  letterSpacing="0.5"
                >
                  MUMBAI
                </text>

                {/* Colombo city marker */}
                <circle
                  cx={COLOMBO.x}
                  cy={COLOMBO.y}
                  r="1.5"
                  fill="#8D153A"
                  filter="url(#slCityGlow)"
                />
                {isInView && (
                  <motion.circle
                    cx={COLOMBO.x}
                    cy={COLOMBO.y}
                    r="1.5"
                    fill="none"
                    stroke="#8D153A"
                    strokeWidth="0.4"
                    animate={{ r: [1.5, 5], opacity: [0.7, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                  />
                )}
                <text
                  x={COLOMBO.x + 3}
                  y={COLOMBO.y + 1}
                  fill="rgba(141,21,58,0.9)"
                  fontSize="2.8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  letterSpacing="0.5"
                >
                  COLOMBO
                </text>
              </svg>

              {/* Subtle gradient overlays for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-transparent to-transparent opacity-30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0a0e17] opacity-20 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
