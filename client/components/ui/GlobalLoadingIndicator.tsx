"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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

    // Intercept Next.js client-side React Server Component (RSC) route fetches immediately at 0ms
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as any)?.url;
        if (url) {
          const isRsc =
            url.includes("_rsc=") ||
            (init?.headers &&
              ((typeof (init.headers as any).get === "function" && (init.headers as any).get("RSC")) ||
                (init.headers as any)["RSC"] ||
                (init.headers as any)["rsc"]));

          if (isRsc) {
            startLoading();
          }
        }
      } catch {}
      return originalFetch.apply(this, arguments as any);
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
      window.fetch = originalFetch;
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      cleanupTimers();
    };
  }, [startLoading, stopLoading, cleanupTimers]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[999999] pointer-events-none transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        background: "linear-gradient(90deg, #D4AF37 0%, #F59E0B 50%, #FBBF24 100%)",
        boxShadow: "0 0 12px rgba(212, 175, 55, 0.9), 0 0 6px rgba(212, 175, 55, 0.6)",
      }}
    />
  );
}

export default function GlobalLoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <GlobalLoadingIndicatorInner />
    </Suspense>
  );
}
