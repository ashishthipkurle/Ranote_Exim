"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function startGlobalLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:loading:start"));
  }
}

export function stopGlobalLoading() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:loading:stop"));
  }
}

function GlobalLoadingIndicatorInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
  }, []);

  const startLoading = useCallback(() => {
    cleanupTimers();

    setIsLoading(true);
    setVisible(true);
    setProgress(20);

    // Incrementally simulate progress while page is loading
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + 15;
        if (prev < 75) return prev + 8;
        if (prev < 90) return prev + 2;
        return prev;
      });
    }, 200);

    // Failsafe timeout after 8 seconds
    safetyTimeoutRef.current = setTimeout(() => {
      stopLoading();
    }, 8000);
  }, [cleanupTimers]);

  const stopLoading = useCallback(() => {
    cleanupTimers();

    setProgress(100);

    // Wait a brief moment at 100% so the user sees completion, then fade out
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setIsLoading(false);
      setProgress(0);

      // Clean up any navigating flags on links
      if (typeof document !== "undefined") {
        document.querySelectorAll("[data-navigating]").forEach((el) => {
          el.removeAttribute("data-navigating");
        });
      }
    }, 200);
  }, [cleanupTimers]);

  // When pathname or searchParams change, the navigation has completed
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  // Global listeners for link clicks, history navigation, and custom events
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Skip hash anchors, mailto, tel, downloads, target="_blank", or modifier clicks
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.getAttribute("target") === "_blank" ||
        target.hasAttribute("download") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const targetUrl = new URL(target.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Skip external domains
        if (targetUrl.origin !== currentUrl.origin) return;

        // Skip exact same URL with hash
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash
        ) {
          return;
        }

        // Prevent repeated multi-clicks while navigation is already in progress
        if (target.getAttribute("data-navigating") === "true") {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Mark this link as navigating to block multiple clicks
        target.setAttribute("data-navigating", "true");

        // Start top progress bar and feedback immediately
        startLoading();
      } catch {
        // invalid URL, ignore
      }
    };

    // Monkey-patch history methods for programmatic router.push navigations
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      startLoading();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      startLoading();
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => {
      startLoading();
    };

    const handleCustomStart = () => startLoading();
    const handleCustomStop = () => stopLoading();

    // Attach listeners
    document.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("app:loading:start", handleCustomStart);
    window.addEventListener("app:loading:stop", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("app:loading:start", handleCustomStart);
      window.removeEventListener("app:loading:stop", handleCustomStop);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      cleanupTimers();
    };
  }, [startLoading, stopLoading, cleanupTimers]);

  if (!visible) return null;

  return (
    <>
      {/* Top Gold Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] z-[999999] pointer-events-none transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          background: "linear-gradient(90deg, #D4AF37 0%, #F59E0B 50%, #FBBF24 100%)",
          boxShadow: "0 0 12px rgba(212, 175, 55, 0.9), 0 0 6px rgba(212, 175, 55, 0.6)",
        }}
      />

      {/* Centered Loading Indicator Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/25 dark:bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150 cursor-wait">
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 text-slate-900 dark:text-white shadow-2xl shadow-black/30 ring-1 ring-black/5 dark:ring-white/10 animate-in zoom-in-95 duration-150 select-none">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin absolute" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Loading...
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Please wait a moment
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function GlobalLoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <GlobalLoadingIndicatorInner />
    </Suspense>
  );
}
