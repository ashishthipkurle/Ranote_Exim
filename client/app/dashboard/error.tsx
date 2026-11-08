"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  const isNetwork =
    !error.message ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("fetch") ||
    error.message.toLowerCase().includes("failed") ||
    error.message.toLowerCase().includes("econnrefused") ||
    error.message.toLowerCase().includes("load");

  useEffect(() => {
    // Log dashboard specific errors
    console.error("Dashboard Error Caught:", error);

    // If it's a transient network/prefetch error on navigation, attempt one transparent auto-recovery reload
    if (typeof window !== "undefined" && isNetwork) {
      const retryKey = `dash_auto_retry_${window.location.pathname}`;
      const lastRetry = sessionStorage.getItem(retryKey);
      const now = Date.now();

      // Only auto-retry once every 10 seconds to avoid infinite reload loops
      if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
        sessionStorage.setItem(retryKey, now.toString());
        console.log("[DashboardError] Transient network error detected. Performing auto-recovery reload...");
        window.location.reload();
      }
    }
  }, [error, isNetwork]);

  const handleRetry = () => {
    setRetrying(true);
    if (isNetwork) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-card rounded-xl border border-destructive/20 mt-6 mx-6">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-semibold mb-2 text-foreground">Failed to load dashboard data</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We encountered a problem while trying to display this section. This might be due to a temporary network issue or a server error.
      </p>

      <div className="p-4 bg-muted/50 rounded-lg text-left text-sm font-mono overflow-auto max-w-lg mb-8 mx-auto w-full">
        <p className="text-destructive/80 text-xs uppercase font-bold tracking-wider mb-1">Error Details</p>
        <p className="text-muted-foreground truncate">{error.message || "Network or connection error"}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Reloading..." : "Retry Loading"}
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
