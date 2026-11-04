"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";
// We use dynamic import for the GIF to avoid hydration mismatches if needed, but standard import is fine.
import loadingGif from "@/assests/Transparent loading gif.gif";

export default function CinematicPreloader() {
  const pathname = usePathname();

  // Route determining logic
  const isDashboard = pathname ? pathname.startsWith("/dashboard") : false;
  const isMarketplace = pathname ? pathname.startsWith("/products") : false;
  const isAuth = pathname === "/login" || pathname === "/register";
  const isHome = pathname === "/";
  const isMajorRoute = isHome || isMarketplace || isDashboard || isAuth;

  // "ssr-blocking" -> "evaluating" -> "cinematic" | "gif" | "finished"
  const [status, setStatus] = useState<"ssr-blocking" | "cinematic" | "gif" | "finished">(
    isMajorRoute ? "ssr-blocking" : "finished"
  );

  const [activeTexts, setActiveTexts] = useState<string[]>(["ENTERING", "RANOTE EXIM", "PORTAL"]);

  // We rely on CSS to provide the background color
  const bgClass = "bg-white dark:bg-[#050505]";

  // Track the previous pathname to detect genuine SPA navigations
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!isMajorRoute) return;

    const isInitialRender = previousPathname.current === null;
    const isPathnameChanged = previousPathname.current !== null && previousPathname.current !== pathname;

    // Update the ref to current pathname
    previousPathname.current = pathname;

    // React 18 Strict Mode fires `useEffect` twice. If the pathname hasn't actually changed,
    // and it's not the initial setup, we should completely ignore this execution.
    if (!isInitialRender && !isPathnameChanged) {
      return;
    }

    let isReload = false;
    if (isInitialRender) {
      // Only read performance API on the explicit first page load
      const entries = performance.getEntriesByType("navigation");
      isReload = entries.length > 0 && (entries[0] as PerformanceNavigationTiming).type === "reload";
    }

    // Since we ignore non-path-change re-renders, if it's NOT the initial render,
    // it MUST be a genuine path change (SPA navigation), so isReload will be false.

    if (isReload) {
      setStatus("gif");
    } else {
      // Set the appropriate cinematic texts based on the route
      let texts = ["ENTERING", "RANOTE EXIM", "PORTAL"];
      if (isHome) texts = ["ENTERING", "RANOTE EXIM", "YOUR TRADING PARTNER"];
      else if (isMarketplace) texts = ["ENTERING", "RANOTE EXIM", "MARKET PLACER"];
      else if (pathname?.startsWith("/dashboard/exporter")) {
        const parts = pathname.split("/");
        const subPage = parts.length > 3 ? parts[parts.length - 1] : "Dashboard";
        const pageTitle = subPage.replace(/-/g, " ").toUpperCase();
        texts = ["ENTERING", "RANOTE EXIM", pageTitle];
      }
      else if (pathname?.startsWith("/dashboard/importer")) {
        const parts = pathname.split("/");
        const subPage = parts.length > 3 ? parts[parts.length - 1] : "Dashboard";
        const pageTitle = subPage.replace(/-/g, " ").toUpperCase();
        texts = ["ENTERING", "RANOTE EXIM", pageTitle];
      }
      else if (isAuth) texts = ["ENTERING", "RANOTE EXIM", "AUTHENTICATION"];

      setActiveTexts(texts);
      setStatus("cinematic");
    }
  }, [pathname, isMajorRoute, isHome, isMarketplace, isAuth]);

  // Cinematic GSAP Controller
  useEffect(() => {
    if (status !== "cinematic") return;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const timeoutId = setTimeout(() => setStatus("finished"), 15000); // 15s failsafe

    const tl = gsap.timeline({
      onComplete: () => {
        clearTimeout(timeoutId);
        setStatus("finished");
      }
    });

    // Reset positions
    gsap.set(".text-reveal-item", { y: "110%", opacity: 0 });
    gsap.set(".shutter-panel", { yPercent: 0 });

    tl.addLabel("start", 0.4);

    // Text Animation In
    tl.to(".text-reveal-item", {
      opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: "expo.out",
    }, "start");

    // Progress Bar
    tl.to("#loader-progress", {
      width: "100%", duration: 1.5, ease: "power2.inOut"
    }, "start+=0.5");

    tl.addLabel("exit", "+=0.3");

    // Text Animation Out
    tl.to(".text-reveal-item", {
      y: -120, opacity: 0, duration: 0.8, stagger: 0.1, ease: "expo.in"
    }, "exit");

    tl.to("#loader-bar-container", {
      opacity: 0, duration: 0.3
    }, "exit");

    // Handle Split Split
    if (pathname === "/") {
      tl.addLabel("wait-for-video", "exit+=0.5");
      tl.call(() => {
        // Wait for the video's first frame to be ready
        if (!(window as any).homeVideoReady) {
          tl.pause();
          let resumed = false;
          const resume = () => {
            if (resumed) return;
            resumed = true;
            window.removeEventListener('home-video-ready', resume);
            tl.play();
          };
          window.addEventListener('home-video-ready', resume);
          // Failsafe: don't let the preloader get stuck forever on slow devices (iPad)
          setTimeout(resume, 3000);
        }
      }, undefined, "wait-for-video");

      // Home Page Split (slightly slower/more cinematic)
      tl.to("#shutter-top", {
        yPercent: -100, duration: 1.8, ease: "power4.inOut"
      }, "wait-for-video+=0.1");

      tl.to("#shutter-bottom", {
        yPercent: 100, duration: 1.8, ease: "power4.inOut"
      }, "<");
    } else {
      // General Page Split
      tl.to("#shutter-top", {
        yPercent: -100, duration: 1.2, ease: "power4.inOut"
      }, "exit+=0.5");

      tl.to("#shutter-bottom", {
        yPercent: 100, duration: 1.2, ease: "power4.inOut"
      }, "<");
    }

    return () => {
      clearTimeout(timeoutId);
      tl.kill();
    };
  }, [status, pathname]);

  // GIF Controller
  useEffect(() => {
    if (status !== "gif") return;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const timeoutId = setTimeout(() => {
      gsap.to("#gif-loader-container", {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => setStatus("finished")
      });
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [status]);

  // Cleanup overflow on finish
  useEffect(() => {
    if (status === "finished") {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      // Cleanup the global CSS block just in case
      document.documentElement.classList.remove('is-home', 'is-preloading');
    }
  }, [status]);

  if (status === "finished") return null;

  // IMPORTANT: We render the shutter panels ALWAYS from the very first SSR render.
  // This is what prevents the flash! We don't wait for 'mounted'.

  // The overlay becomes transparent during 'cinematic' mode so the shutters can reveal the page underneath
  const overlayClass = status === "cinematic" ? "bg-transparent" : bgClass;

  return (
    <div
      id="preloader-overlay"
      className={`${overlayClass} transition-colors duration-200`}
      style={{ position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none' }}
    >
      <style>{`
        .text-reveal-mask { overflow: hidden; display: inline-block; }
        .shutter-panel {
          position: absolute; left: 0; width: 100%; height: 55dvh; height: 55vh; z-index: 10000;
        }
        @supports (height: 1dvh) {
          .shutter-panel { height: 55dvh; }
        }
        .shutter-top { top: 0; }
        .shutter-bottom { bottom: 0; }
      `}</style>

      {/* 
        We render the shutters in ALL states (including SSR). 
        In "gif" and "ssr-blocking" states, they just sit there providing a solid background. 
      */}
      <div className={`shutter-panel shutter-top ${bgClass}`} id="shutter-top"></div>
      <div className={`shutter-panel shutter-bottom ${bgClass}`} id="shutter-bottom"></div>

      {/* Layer for Cinematic Text */}
      {status === "cinematic" && (
        <div className="absolute inset-0 z-[10002] flex flex-col items-center justify-center p-4">
          <div className="relative z-[10002] text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 w-full max-w-[100vw] px-4 overflow-hidden">
              {activeTexts.map((text, i) => (
                <div key={i} className="text-reveal-mask text-center max-w-full">
                  <h1 className={`text-reveal-item font-sans font-black tracking-tight opacity-0 uppercase whitespace-normal break-words max-w-[90vw] ${i === 1 ? 'text-xl sm:text-2xl md:text-5xl lg:text-6xl text-[#D4AF37] md:border-x-4 border-y-4 md:border-y-0 border-[#D4AF37] px-2 md:px-6 py-2 md:py-0' :
                    'text-lg sm:text-xl md:text-3xl lg:text-4xl text-foreground/40'
                    }`}>
                    {text}
                  </h1>
                </div>
              ))}
            </div>

            <div className="mt-12 w-48 h-px bg-[#D4AF37]/10 mx-auto relative overflow-hidden" id="loader-bar-container">
              <div className="absolute inset-y-0 left-0 bg-[#D4AF37] w-0" id="loader-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* Layer for GIF Loader */}
      {(status === "gif" || status === "ssr-blocking") && (
        <div id="gif-loader-container" className="absolute inset-0 z-[10002] flex flex-col items-center justify-center transition-opacity duration-300">
          {/* We only render the *content* of the GIF loader after we decide it's a GIF to avoid a sudden jump, 
              or we could render it instantly. Let's render it instantly so it's flush. */}
          <div className="flex flex-col items-center justify-center">
            <Image
              src={loadingGif}
              alt="Loading..."
              className="w-40 h-40 md:w-56 md:h-56 object-contain opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
              priority
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
