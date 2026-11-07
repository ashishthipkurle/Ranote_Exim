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
  Clock,
  RotateCcw,
  Gauge,
  HardDriveDownload,
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
    <div className="space-y-6 w-full">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#F0ECE0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#FBF1D6] text-[#7A560A]">
              Platform Controls
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
              Site Experience
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#15130D]">
            Home Page Changes
          </h1>
          <p className="text-sm text-[#6B6A66] mt-0.5">
            Configure homepage media, hero behavior, and loading speed optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="btn-cream-secondary"
            title="Refresh status"
          >
            <RotateCcw className={`w-4 h-4 stroke-[1.8] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-primary"
          >
            <ExternalLink className="w-4 h-4 stroke-[1.8]" />
            Preview Homepage
          </a>
        </div>
      </div>

      {/* ─── Hero Video Toggle Card ─── */}
      <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0 shadow-sm">
              {showHeroVideo ? (
                <Video className="w-6 h-6 stroke-[1.8]" />
              ) : (
                <VideoOff className="w-6 h-6 stroke-[1.8]" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h2 className="text-base md:text-lg font-extrabold tracking-wider uppercase text-[#15130D]">
                  Hero Section Video
                </h2>
                {showHeroVideo ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                    ON (Video Visible)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#F7F5F0] text-[#6B6A66]">
                    <Zap className="w-3.5 h-3.5 stroke-[2]" />
                    OFF (Fast Mode Active)
                  </span>
                )}
              </div>

              <p className="text-sm text-[#4A483F] leading-relaxed max-w-2xl">
                Control whether visitors see the full-screen interactive scrollytelling video at the very top of the homepage.
              </p>

              <div className="mt-3 text-xs text-[#6B6A66] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#C4912A] shrink-0 stroke-[1.8]" />
                <span>
                  {showHeroVideo ? (
                    <>
                      <strong>Currently ON:</strong> Desktop and tablet visitors will view the scrollytelling video animation at the very top before reaching the main hero content.
                    </>
                  ) : (
                    <>
                      <strong>Currently OFF (Fast Mode):</strong> The top video is hidden. Users jump straight into the hero section and navbar immediately, saving ~15MB data and loading much faster.
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Toggle Switch Button ─── */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66]">
                {showHeroVideo ? "Turn Off" : "Turn On"}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={showHeroVideo}
                disabled={loading || saving}
                onClick={() => handleToggle(!showHeroVideo)}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none disabled:opacity-50 ${
                  showHeroVideo ? "bg-[#C4912A]" : "bg-[#ECE7DA]"
                }`}
              >
                <span className="sr-only">Toggle Hero Video</span>
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                    showHeroVideo ? "translate-x-8" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {lastUpdated && (
              <span className="text-[11px] text-[#6B6A66]">
                Last changed: {new Date(lastUpdated).toLocaleTimeString()} ({new Date(lastUpdated).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Performance Comparison Cards ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#C4912A] stroke-[1.8]" />
          <h3 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
            Performance & Speed Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Load Speed */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Clock className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                {!showHeroVideo ? "Lightning Fast" : "Standard"}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
              First Screen Render
            </p>
            <div className="text-[38px] font-extrabold leading-none text-[#15130D]">
              {!showHeroVideo ? "~0.3s" : "~2.1s"}
            </div>
            <p className="text-xs text-[#6B6A66] mt-3 leading-relaxed">
              {!showHeroVideo
                ? "Directly loads Navbar + Hero text with zero delay."
                : "Preloads canvas context and initial video frame before displaying."}
            </p>
          </div>

          {/* Card 2: Bandwidth Download */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <HardDriveDownload className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                {!showHeroVideo ? "Saved 15MB" : "Heavy Media"}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
              Data Transferred
            </p>
            <div className="text-[38px] font-extrabold leading-none text-[#15130D]">
              {!showHeroVideo ? "< 1.2 MB" : "~16.5 MB"}
            </div>
            <p className="text-xs text-[#6B6A66] mt-3 leading-relaxed">
              {!showHeroVideo
                ? "Bypasses the full MP4 video and 75 extracted frame bitmaps."
                : "Streams video asset to generate frame-by-frame scrubbing."}
            </p>
          </div>

          {/* Card 3: Tablet & Mobile UX */}
          <div className="rounded-[24px] border border-[#F0ECE0] bg-gradient-to-b from-white to-[#FFFBF0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center">
                <Zap className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-[#E2F5EE] text-[#0B7A57]">
                {!showHeroVideo ? "Smoothest" : "Interactive"}
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6A66] mb-1">
              Device Responsiveness
            </p>
            <div className="text-[38px] font-extrabold leading-none text-[#15130D]">
              {!showHeroVideo ? "100% Smooth" : "Heavy Scroll"}
            </div>
            <p className="text-xs text-[#6B6A66] mt-3 leading-relaxed">
              {!showHeroVideo
                ? "No scroll locking, no 4000px scroll container, perfect on iPad/Tablets."
                : "Engaging 3D scroll story suitable for high-power desktop devices."}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Helpful Guide & Notes ─── */}
      <div className="rounded-[24px] border border-[#F0ECE0] bg-[#FFFBF2] p-6 flex flex-col md:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-[14px] bg-[#FBF1D6] text-[#C4912A] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 stroke-[1.8]" />
        </div>
        <div className="space-y-1 text-sm">
          <h4 className="text-xs md:text-sm font-extrabold tracking-wider uppercase text-[#15130D]">
            How This Setting Works
          </h4>
          <p className="text-xs text-[#4A483F] leading-relaxed">
            When you switch the button to <strong>OFF</strong>, the server stops sending the top video element to visitors. The homepage opens immediately with your company brand logo, navigation links, and the &ldquo;EXPORTING INDIA&apos;S QUALITY TO THE WORLD&rdquo; hero banner. Any visitor who visits the site will immediately get the fastest possible load speed.
          </p>
        </div>
      </div>
    </div>
  );
}
