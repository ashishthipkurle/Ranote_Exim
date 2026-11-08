"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { useFormat } from "@/lib/i18n/format";

interface Stats {
  shipments: number;
  volume: number;
  countries: number;
  products: number;
  users: number;
  latency: string;
  uptime: string;
}

function AnimatedStat({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { formatCompact } = useFormat();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!value) {
      setDisplayValue(0);
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    // Ease-out function for smooth deceleration
    const easeOutQuad = (t: number) => t * (2 - t);
    const duration = 1500; // 1.5 seconds
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuad(progress);

      setDisplayValue(Math.floor(easedProgress * (end - start) + start));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  return (
    <>
      {formatCompact(displayValue)}
      {suffix}
    </>
  );
}

export default function StatsBar() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      const startTime = performance.now();
      try {
        const res = await fetch("/api/public/stats", { cache: "no-store" });
        const clientRoundtripMs = Math.round(performance.now() - startTime);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (!data.latency) {
            data.latency = `${(clientRoundtripMs / 1000).toFixed(2)}s`;
          }
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-16 bg-background border-b border-border relative reveal-on-scroll active">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="text-center md:text-left border-r border-border last:border-0 pr-4 group hover:bg-muted p-4 rounded transition-colors">
          <h3 className="text-4xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {stats ? (
              <AnimatedStat
                value={stats.shipments}
                suffix={stats.shipments >= 100 ? "+" : ""}
              />
            ) : (
              0
            )}
          </h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            {t("stats.shipments", "Shipments Tracked")}
          </p>
        </div>
        <div className="text-center md:text-left border-r border-border last:border-0 pr-4 group hover:bg-muted p-4 rounded transition-colors">
          <h3 className="text-4xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            $
            {stats ? (
              <AnimatedStat
                value={stats.volume}
                suffix={stats.volume >= 1000000 ? "+" : ""}
              />
            ) : (
              0
            )}
          </h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            {t("stats.volume", "Trade Volume")}
          </p>
        </div>
        <div className="text-center md:text-left border-r border-border last:border-0 pr-4 group hover:bg-muted p-4 rounded transition-colors">
          <h3 className="text-4xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {stats ? (
              <AnimatedStat
                value={stats.countries}
                suffix={stats.countries >= 50 ? "+" : ""}
              />
            ) : (
              0
            )}
          </h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            {t("stats.countries", "Countries Served")}
          </p>
        </div>
        <div className="text-center md:text-left pr-4 group hover:bg-muted p-4 rounded transition-colors">
          <h3 className="text-4xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
            {stats?.latency || "0.01s"}
          </h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            {t("stats.latency", "Data Latency")}
          </p>
        </div>
      </div>
    </section>
  );
}
