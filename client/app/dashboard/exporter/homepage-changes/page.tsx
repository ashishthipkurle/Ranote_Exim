"use client";

import { useState, useEffect } from "react";
import {
  Video,
  VideoOff,
  Zap,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Info,
  Layers,
  Gauge,
  HardDriveDownload,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function HomePageChangesPage() {
  const [showHeroVideo, setShowHeroVideo] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setShowHeroVideo(data.settings.showHeroVideo);
          setLastUpdated(data.settings.updatedAt);
        }
      } else {
        toast.error("Failed to load homepage settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while loading settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    setSaving(true);
    const previous = showHeroVideo;
    setShowHeroVideo(newValue);

    try {
      const res = await fetch("/api/admin/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showHeroVideo: newValue }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastUpdated(data.settings?.updatedAt || new Date().toISOString());
        toast.success(
          newValue
            ? "Hero video enabled! Visitors will see the full cinematic video."
            : "Hero video disabled! Homepage will now load instantly without the video."
        );
      } else {
        setShowHeroVideo(previous);
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to update homepage settings");
      }
    } catch (err) {
      setShowHeroVideo(previous);
      console.error(err);
      toast.error("Network error while updating settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 w-full px-8 pb-16">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              Admin Portal
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Site Experience
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Home Page Changes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure homepage media, hero behavior, and loading speed optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            Preview Homepage
          </a>
        </div>
      </div>

      {/* ─── Hero Video Toggle Card ─── */}
      <div className="bg-card/60 backdrop-blur-xl border border-border/70 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div
          className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            showHeroVideo ? "bg-emerald-500/10" : "bg-[#D4AF37]/10"
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl border transition-colors duration-300 ${
                showHeroVideo
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
              }`}
            >
              {showHeroVideo ? (
                <Video className="w-8 h-8" />
              ) : (
                <VideoOff className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h2 className="text-xl font-bold text-foreground">
                  Hero Section Video
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wide uppercase flex items-center gap-1.5 border transition-all ${
                    showHeroVideo
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {showHeroVideo ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ON (Video Visible)
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      OFF (Fast Mode Active)
                    </>
                  )}
                </span>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Control whether visitors see the full-screen interactive
                scrollytelling video at the very top of the homepage.
              </p>

              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {showHeroVideo ? (
                    <>
                      <strong>Currently ON:</strong> Desktop and tablet visitors
                      will view the scrollytelling video animation at the very
                      top before reaching the main hero content.
                    </>
                  ) : (
                    <>
                      <strong>Currently OFF (Fast Mode):</strong> The top video
                      is hidden. Users jump straight into the hero section and
                      navbar immediately, saving ~15MB data and loading much faster.
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Toggle Switch Button ─── */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {showHeroVideo ? "Turn Off" : "Turn On"}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={showHeroVideo}
                disabled={loading || saving}
                onClick={() => handleToggle(!showHeroVideo)}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
                  showHeroVideo ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span className="sr-only">Toggle Hero Video</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                    showHeroVideo ? "translate-x-8" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {lastUpdated && (
              <span className="text-[11px] text-muted-foreground/70">
                Last changed: {new Date(lastUpdated).toLocaleTimeString()} (
                {new Date(lastUpdated).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Performance Comparison Cards ─── */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Performance & Speed Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Load Speed */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              !showHeroVideo
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  !showHeroVideo
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {!showHeroVideo ? "Lightning Fast" : "Standard"}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              First Screen Render
            </h4>
            <div className="text-2xl font-black text-foreground">
              {!showHeroVideo ? "~0.3s" : "~2.1s"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {!showHeroVideo
                ? "Directly loads Navbar + Hero text with zero delay."
                : "Preloads canvas context and initial video frame before displaying."}
            </p>
          </div>

          {/* Card 2: Bandwidth Download */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              !showHeroVideo
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  !showHeroVideo
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {!showHeroVideo ? "Saved 15MB" : "Heavy Media"}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Data Transferred
            </h4>
            <div className="text-2xl font-black text-foreground">
              {!showHeroVideo ? "< 1.2 MB" : "~16.5 MB"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {!showHeroVideo
                ? "Bypasses the full MP4 video and 75 extracted frame bitmaps."
                : "Streams video asset to generate frame-by-frame scrubbing."}
            </p>
          </div>

          {/* Card 3: Tablet & Mobile UX */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              !showHeroVideo
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  !showHeroVideo
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {!showHeroVideo ? "Smoothest" : "Interactive"}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Device Responsiveness
            </h4>
            <div className="text-2xl font-black text-foreground">
              {!showHeroVideo ? "100% Smooth" : "Heavy Scroll"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {!showHeroVideo
                ? "No scroll locking, no 4000px scroll container, perfect on iPad/Tablets."
                : "Engaging 3D scroll story suitable for high-power desktop devices."}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Helpful Guide & Notes ─── */}
      <div className="rounded-2xl border border-border/50 bg-accent/20 p-6 flex flex-col md:flex-row items-start gap-4">
        <Sparkles className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <h4 className="font-bold text-foreground">
            How This Setting Works
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            When you switch the button to <strong>OFF</strong>, the server stops
            sending the top video element to visitors. The homepage opens
            immediately with your company brand logo, navigation links, and the
            &ldquo;EXPORTING INDIA&apos;S QUALITY TO THE WORLD&rdquo; hero banner. Any visitor
            who visits the site will immediately get the fastest possible load
            speed.
          </p>
        </div>
      </div>
    </div>
  );
}
