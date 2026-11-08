"use client";


import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { User, LogOut, ShoppingBag, Home, Info, Phone, ChevronDown, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import LogoImg from "@/assests/LOGO.png";
import { useTranslation } from "@/lib/i18n/client";
const ThumbnailImg = "/frames/1.png";


/**
 * ScrollVideoSection — Apple-style scroll-linked video with scrollytelling text.
 *
 * The section is PINNED immediately on mount so no blank gap appears.
 * Frames are extracted in the background and drawn as they become available.
 * Animated text overlays appear and disappear at different scroll positions.
 */

const TOTAL_FRAMES = 75;
const SCROLL_DISTANCE = 3000; // px of scroll for full video playback

// Global cache to persist frames across navigation within the same session (SPA navigation)
const globalFramesCache: ImageBitmap[] = [];
let globalProgressCache = 0;
let isExtractionRunning = false;

/* --- Scrollytelling text data ---
 * Each entry defines a text block that fades in/out at specific scroll progress ranges.
 * `animation` controls the entrance/exit style for each block.
 */
const SCROLL_TEXTS = [
    {
        id: "text-1",
        headline: "Exporting Excellence",
        sub: "Connecting Indian manufacturers to the world's largest markets.",
        start: 0.02,
        end: 0.22,
        animation: "zoom-blur" as const,
        position: "bottom-left" as const,
    },
    {
        id: "text-2",
        headline: "Importing Trust",
        sub: "Verified suppliers · Transparent pricing · Real-time tracking.",
        start: 0.25,
        end: 0.45,
        animation: "flip-up" as const,
        position: "top-right" as const,
    },
    {
        id: "text-3",
        headline: "Global Logistics",
        sub: "Seamless freight, customs clearance, and door-to-door delivery — all automated.",
        start: 0.48,
        end: 0.68,
        animation: "reveal-mask" as const,
        position: "bottom-right" as const,
    },
];

// Position → CSS class map for each text placement
const POS_CLASSES: Record<string, { wrapper: string; align: string }> = {
    "bottom-left": { wrapper: "absolute bottom-12 md:bottom-20 left-6 md:left-16 z-20 pointer-events-none", align: "items-start text-left" },
    "top-right": { wrapper: "absolute top-24 md:top-32 right-6 md:right-16 z-20 pointer-events-none", align: "items-end text-right" },
    "bottom-right": { wrapper: "absolute bottom-12 md:bottom-20 right-6 md:right-16 z-20 pointer-events-none", align: "items-end text-right" },
    "bottom-center": { wrapper: "absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none", align: "items-center text-center" },
};

export default function ScrollVideoSection() {
    const { t } = useTranslation();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const textRefs = useRef<(HTMLDivElement | null)[]>([]);
    const framesRef = useRef<ImageBitmap[]>(globalFramesCache);
    const currentFrameRef = useRef(-1);
    const [progress, setProgress] = useState(0);
    const [failed, setFailed] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, loading: authLoading, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const [hasSeenIntroState, setHasSeenIntroState] = useState(false);

    useEffect(() => {
        setHasSeenIntroState(sessionStorage.getItem("ranote-video-intro-seen") === "true");
        if (globalFramesCache.length >= 2) setLoaded(true);
        if (globalProgressCache > 0) setProgress(globalProgressCache);
    }, []);


    // Cover-draw: scale + center-crop bitmap to fill the canvas
    const drawCover = useCallback(
        (ctx: CanvasRenderingContext2D, img: ImageBitmap) => {
            const cw = ctx.canvas.width;
            const ch = ctx.canvas.height;
            const iw = img.width;
            const ih = img.height;
            const scale = Math.max(cw / iw, ch / ih);
            const sw = cw / scale;
            const sh = ch / scale;
            const sx = (iw - sw) / 2;
            const sy = (ih - sh) / 2;
            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
        },
        []
    );

    // Custom Cursor Logic
    useEffect(() => {
        if (failed) return;
        const section = sectionRef.current;
        const cursor = cursorRef.current;
        if (!section || !cursor) return;

        const xTo = gsap.quickTo(cursor, "x", { duration: 0.4, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.4, ease: "power3" });

        const onMouseMove = (e: MouseEvent) => {
            let zoom = 1;
            if (typeof window !== "undefined") {
                const zoomStr = getComputedStyle(document.body).zoom;
                if (zoomStr && zoomStr !== "normal") {
                    zoom = zoomStr.endsWith("%") ? parseFloat(zoomStr) / 100 : parseFloat(zoomStr);
                }
            }
            xTo((e.clientX / (zoom || 1)) - 48);
            yTo((e.clientY / (zoom || 1)) - 48);
        };

        const onMouseEnter = () => {
            gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });
        };

        const onMouseLeave = () => {
            gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
        };

        section.addEventListener("mousemove", onMouseMove);
        section.addEventListener("mouseenter", onMouseEnter);
        section.addEventListener("mouseleave", onMouseLeave);

        return () => {
            section.removeEventListener("mousemove", onMouseMove);
            section.removeEventListener("mouseenter", onMouseEnter);
            section.removeEventListener("mouseleave", onMouseLeave);
        };
    }, [failed]);

    // Outside click logic for profile dropdown
    useEffect(() => {
        if (!isProfileOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isProfileOpen]);

    // Lock scroll while buffering frames (only if not seen before in this session)
    // FIX: Only lock when the user is actually near the top (viewing the video section).
    // If the browser restores a mid-page scroll position on reload, don't block scrolling.
    // Also includes a safety timeout so scrolling is never permanently blocked.
    useEffect(() => {
        const hasSeenIntro = sessionStorage.getItem("ranote-video-intro-seen") === "true";
        if (progress >= 100 || failed || hasSeenIntro) return;

        // If the user is already scrolled past the video section, skip locking entirely.
        // The wrapper has height SCROLL_DISTANCE + 1000, so if scrollY is past that, they're beyond the video.
        const wrapperEl = wrapperRef.current;
        const isUserPastVideoSection = () => {
            if (!wrapperEl) return false;
            const rect = wrapperEl.getBoundingClientRect();
            // If the top of the wrapper is already well above the viewport, user has scrolled past it
            return rect.bottom < window.innerHeight * 0.5;
        };

        // If user landed mid-page (browser scroll restoration), don't lock at all
        if (isUserPastVideoSection()) return;

        // Safety timeout: force-unlock scrolling after 15 seconds no matter what
        const safetyTimer = setTimeout(() => {
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('keydown', preventKeys);
        }, 15000);

        const preventScroll = (e: Event) => {
            if (window.innerWidth < 768) return; // Don't lock on mobile
            // Allow scroll if progress is significantly along, or if failed
            if (progress >= 100) return;
            // Don't block if user has somehow scrolled past the video section
            if (isUserPastVideoSection()) return;
            e.preventDefault();
        };

        const preventKeys = (e: KeyboardEvent) => {
            if (window.innerWidth < 768) return;
            if (isUserPastVideoSection()) return;
            if (['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
                if (progress < 100) e.preventDefault();
            }
        };

        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        window.addEventListener('keydown', preventKeys, { passive: false });

        return () => {
            clearTimeout(safetyTimer);
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('keydown', preventKeys);
        };
    }, [progress, failed]);

    // ---------- Scrollytelling text animations (separate effect, waits for DOM) ----------
    useEffect(() => {
        if (!loaded || failed) return;

        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        gsap.registerPlugin(ScrollTrigger);

        const textTimelines: gsap.core.Timeline[] = [];

        SCROLL_TEXTS.forEach((item, i) => {
            const el = textRefs.current[i];
            if (!el) return;

            const textTl = gsap.timeline({
                scrollTrigger: {
                    trigger: wrapper,
                    start: `top+=${item.start * SCROLL_DISTANCE} top`,
                    end: `top+=${item.end * SCROLL_DISTANCE} top`,
                    scrub: 0.5,
                },
            });

            // Each text block gets a unique cinematic animation
            switch (item.animation) {
                case "zoom-blur":
                    // Zoom in from far + blur to sharp focus
                    textTl.fromTo(el,
                        { opacity: 0, scale: 0.4, filter: "blur(20px)" },
                        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }
                    );
                    textTl.to(el, { opacity: 1, scale: 1, duration: 0.35 });
                    textTl.to(el, { opacity: 0, scale: 1.15, filter: "blur(12px)", duration: 0.3, ease: "power2.in" });
                    break;

                case "flip-up":
                    // 3D flip rotation from below
                    textTl.fromTo(el,
                        { opacity: 0, rotationX: 90, y: 80, transformPerspective: 800, transformOrigin: "bottom center" },
                        { opacity: 1, rotationX: 0, y: 0, duration: 0.35, ease: "power3.out" }
                    );
                    textTl.to(el, { opacity: 1, rotationX: 0, y: 0, duration: 0.35 });
                    textTl.to(el, { opacity: 0, rotationX: -45, y: -50, duration: 0.3, ease: "power2.in" });
                    break;

                case "reveal-mask":
                    // Clip-path wipe reveal from bottom to top
                    textTl.fromTo(el,
                        { opacity: 0, clipPath: "inset(100% 0% 0% 0%)", y: 30 },
                        { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.35, ease: "power2.out" }
                    );
                    textTl.to(el, { opacity: 1, duration: 0.35 });
                    textTl.to(el, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)", y: -20, duration: 0.3, ease: "power2.in" });
                    break;

                case "grand-scale":
                    // Epic finale — scale up from tiny with dramatic easing
                    textTl.fromTo(el,
                        { opacity: 0, scale: 0.2, y: 60, filter: "blur(15px)" },
                        { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "elastic.out(1, 0.6)" }
                    );
                    textTl.to(el, { opacity: 1, scale: 1, duration: 0.35 });
                    textTl.to(el, { opacity: 0, scale: 1.3, filter: "blur(8px)", duration: 0.25, ease: "power3.in" });
                    break;
            }

            textTimelines.push(textTl);
        });

        // Refresh ScrollTrigger to pick up new triggers
        ScrollTrigger.refresh();

        return () => {
            textTimelines.forEach((tl) => tl.kill());
        };
    }, [loaded, failed]);

    useEffect(() => {
        (window as any).homeVideoReady = false;
        if (failed) return;

        gsap.registerPlugin(ScrollTrigger);

        const canvas = canvasRef.current;
        const section = sectionRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !section || !wrapper) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const frames = framesRef.current;

        // ---------- Resize canvas to viewport ----------
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            const section = sectionRef.current;
            if (!canvas || !section) return;

            let zoom = 1;
            if (typeof window !== "undefined") {
                const zoomStr = getComputedStyle(document.body).zoom;
                if (zoomStr && zoomStr !== "normal") {
                    zoom = zoomStr.endsWith("%") ? parseFloat(zoomStr) / 100 : parseFloat(zoomStr);
                }
            }

            // Force exact layout pixel height via JS to bypass iOS Safari's 100vh/inset-0 scaling bug
            section.style.height = `${window.innerHeight / (zoom || 1)}px`;

            // Use precise container dimensions instead of often bugged window innerHeight in scaled iOS viewports
            const dpr = window.devicePixelRatio || 1;
            canvas.width = section.clientWidth * dpr;
            canvas.height = (window.innerHeight / (zoom || 1)) * dpr;
            // Redraw current frame across resize
            if (currentFrameRef.current >= 0 && currentFrameRef.current < TOTAL_FRAMES) {
                const img = framesRef.current?.[currentFrameRef.current];
                if (img) drawCover(canvas.getContext("2d")!, img);
            }
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // ---------- Draw frame (with nearest-frame fallback for mobile) ----------
        const drawFrame = (index: number) => {
            if (index === currentFrameRef.current) return;
            // If the exact frame exists, draw it
            if (frames[index]) {
                currentFrameRef.current = index;
                drawCover(ctx, frames[index]);
                return;
            }
            // Fallback: find the nearest available frame (fixes mobile stuck-on-one-frame)
            let nearest = -1;
            let minDist = Infinity;
            for (let j = 0; j < frames.length; j++) {
                if (frames[j] && Math.abs(j - index) < minDist) {
                    minDist = Math.abs(j - index);
                    nearest = j;
                }
            }
            if (nearest >= 0 && nearest !== currentFrameRef.current) {
                currentFrameRef.current = nearest;
                drawCover(ctx, frames[nearest]);
            }
        };

        // ---------- 1. Main video scrub timeline ----------
        const frameObj = { frame: 0 };

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapper,
                start: "top top",
                end: `+=${SCROLL_DISTANCE}`,
                scrub: 0.8,
                onUpdate: (self) => {
                    if (self.progress > 0.001) setHasScrolled(true);
                    else if (self.progress <= 0) setHasScrolled(false);
                },
            },
        });

        tl.to(frameObj, {
            frame: TOTAL_FRAMES - 1,
            ease: "none",
            duration: 1,
            onUpdate: () => {
                const idx = Math.floor(frameObj.frame);
                drawFrame(idx);
            },
        });

        // ---------- 2. Extract frames in background ----------
        const extractFrames = async () => {
            // Do not extract frames on small mobile screens (prevent massive memory usage / crashes on iOS Safari)
            if (window.innerWidth < 768) {
                setLoaded(true);
                setProgress(100);
                globalProgressCache = 100;
                sessionStorage.setItem("ranote-video-intro-seen", "true");
                return;
            }

            if (globalFramesCache.length >= TOTAL_FRAMES) {
                setLoaded(true);
                setProgress(100);
                resizeCanvas();
                drawFrame(0);
                return;
            }

            if (isExtractionRunning && globalFramesCache.filter(Boolean).length === 0) {
                // Previous extraction was interrupted (e.g. HMR), reset the flag
                isExtractionRunning = false;
            }

            if (isExtractionRunning) return;
            isExtractionRunning = true;

            const video = document.createElement("video");
            video.style.position = "fixed";
            video.style.top = "0";
            video.style.left = "0";
            video.style.width = "200px";
            video.style.height = "200px";
            video.style.opacity = "0.01";
            video.style.pointerEvents = "none";
            video.style.zIndex = "-9999";
            document.body.appendChild(video);

            video.muted = true;
            video.playsInline = true;
            video.setAttribute("playsinline", "");
            video.setAttribute("webkit-playsinline", ""); // iOS compatibility
            video.preload = "auto";
            video.src = "/videos/Continuous_Shot_Company_Video_Generation.mp4";

            await new Promise<void>((resolve, reject) => {
                if (video.readyState >= 2) {
                    resolve();
                    return;
                }
                const onLoaded = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    // Fallback to Cloudinary CDN if local video fails
                    video.crossOrigin = "anonymous";
                    video.src = "https://res.cloudinary.com/dpy7s0cbs/video/upload/f_auto,q_auto/v1780753542/Continuous_Shot_Company_Video_Generation.mp4";
                    const onFallbackLoaded = () => {
                        cleanupFallback();
                        resolve();
                    };
                    const onFallbackError = () => {
                        cleanupFallback();
                        reject(new Error("Video failed to load"));
                    };
                    const cleanupFallback = () => {
                        video.removeEventListener("loadeddata", onFallbackLoaded);
                        video.removeEventListener("loadedmetadata", onFallbackLoaded);
                        video.removeEventListener("canplay", onFallbackLoaded);
                        video.removeEventListener("error", onFallbackError);
                    };
                    video.addEventListener("loadeddata", onFallbackLoaded);
                    video.addEventListener("loadedmetadata", onFallbackLoaded);
                    video.addEventListener("canplay", onFallbackLoaded);
                    video.addEventListener("error", onFallbackError);
                    video.load();
                };
                const cleanup = () => {
                    video.removeEventListener("loadeddata", onLoaded);
                    video.removeEventListener("loadedmetadata", onLoaded);
                    video.removeEventListener("canplay", onLoaded);
                    video.removeEventListener("error", onError);
                };
                video.addEventListener("loadeddata", onLoaded);
                video.addEventListener("loadedmetadata", onLoaded);
                video.addEventListener("canplay", onLoaded);
                video.addEventListener("error", onError);
                video.load();
            });

            try {
                await video.play();
                video.pause();
            } catch (e) {
                // Ignore autoplay policy errors
            }

            const duration = video.duration || 8;
            const interval = duration / (TOTAL_FRAMES - 1);

            for (let i = 0; i < TOTAL_FRAMES; i++) {
                // If navigation occurred and cleared framesRef, stop extraction
                if (!framesRef.current) break;

                await new Promise<void>((resolve) => {
                    let settled = false;

                    const captureFrame = async () => {
                        if (settled) return;
                        settled = true;
                        video.removeEventListener("seeked", onSeeked);

                        try {
                            // Resize frames to 1080p maximum to save memory (prevents browser crashes/reclaims)
                            const vw = video.videoWidth || 1920;
                            const vh = video.videoHeight || 1080;
                            const targetW = Math.min(1024, vw); // Lowered to 1024 for iOS stability
                            const targetH = Math.round((targetW / vw) * vh);

                            // Safari bug workaround: direct createImageBitmap(video) often yields black frames.
                            // We force drawing to an offscreen canvas first to pull pixels from the decoder.
                            const tmpCanvas = document.createElement("canvas");
                            tmpCanvas.width = targetW;
                            tmpCanvas.height = targetH;
                            const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });
                            if (tmpCtx) {
                                tmpCtx.drawImage(video, 0, 0, targetW, targetH);
                                const bitmap = await createImageBitmap(tmpCanvas);
                                if (framesRef.current) framesRef.current[i] = bitmap;
                                globalFramesCache[i] = bitmap;
                            }
                        } catch (e) {
                            console.error("[ScrollVideo] Capture failed", e);
                        }

                        const p = Math.round(((i + 1) / TOTAL_FRAMES) * 100);
                        setProgress(p);
                        globalProgressCache = p;

                        if (i === 0) {
                            resizeCanvas();
                            drawFrame(0);
                        }

                        if (i === 2 || (i === 0 && TOTAL_FRAMES <= 2)) {
                            setLoaded(true);
                            (window as any).homeVideoReady = true;
                            window.dispatchEvent(new Event('home-video-ready'));
                        }

                        if (i === TOTAL_FRAMES - 1) {
                            sessionStorage.setItem("ranote-video-intro-seen", "true");
                            isExtractionRunning = false;
                        }

                        resolve();
                    };

                    const onSeeked = () => captureFrame();

                    // Timeout: if seeked never fires (common on mobile), force capture after 5s
                    const seekTimeout = setTimeout(() => {
                        if (!settled) {
                            console.warn(`[ScrollVideo] seeked timeout for frame ${i}, forcing capture`);
                            captureFrame();
                        }
                    }, 5000);

                    video.addEventListener("seeked", () => {
                        clearTimeout(seekTimeout);
                        onSeeked();
                    });
                    video.currentTime = Math.min(i * interval, duration - 0.05);
                });
            }

            video.src = "";
            video.load();
            if (video.parentNode) {
                video.parentNode.removeChild(video);
            }

            drawFrame(Math.floor(frameObj.frame));
            ScrollTrigger.refresh();
        };

        extractFrames().catch((err) => {
            console.error("[ScrollVideo] Frame extraction failed:", err);
            setFailed(true);
            isExtractionRunning = false;
        });

        // ---------- 3. Stacked Reveal Transition ----------
        const ctx_reveal = gsap.context(() => {
            // The video section is native CSS fixed, so we do not pin it with GSAP.
            // Pinning it via GSAP would override our manual iOS Javascript heights.
            ScrollTrigger.create({
                trigger: wrapper,
                start: "top top",
                end: `+=${SCROLL_DISTANCE + 1000}`, // SCROLL_DISTANCE for playback + 1000 for reveal

                onUpdate: (self) => {
                    // We can add a slight scale down or blur here if desired
                    if (self.progress > SCROLL_DISTANCE / (SCROLL_DISTANCE + 1000)) {
                        const revealProgress = (self.scroll() - SCROLL_DISTANCE) / 1000;
                        gsap.set(section, {
                            scale: 1 + (revealProgress * 0.05),
                            filter: `blur(${revealProgress * 4}px)`,
                            opacity: 1 - (revealProgress * 0.3)
                        });
                    } else {
                        gsap.set(section, { scale: 1, filter: "blur(0px)", opacity: 1 });
                    }
                }
            });

            // Animate the marketplace content sliding over
            const revealEl = document.getElementById("home-content-reveal");
            gsap.set("#home-content-reveal", { y: "100vh" });
            gsap.fromTo("#home-content-reveal",
                { y: "100vh" },
                {
                    y: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: wrapper,
                        start: `${SCROLL_DISTANCE} top`,
                        end: `${SCROLL_DISTANCE + 1000} top`,
                        scrub: 0.3,
                        onUpdate: (self) => {
                            if (self.progress >= 1 && revealEl) {
                                // Once reveal is complete, we MUST destroy the transform matrix 
                                // otherwise CSS `sticky` positioning fails across the entire page.
                                if (!revealEl.dataset.cleared) {
                                    gsap.set(revealEl, { clearProps: "transform" });
                                    revealEl.dataset.cleared = "true";
                                    window.dispatchEvent(new Event('resize'));
                                    ScrollTrigger.refresh();
                                }
                            } else if (self.progress < 1 && revealEl) {
                                if (revealEl.dataset.cleared) {
                                    delete revealEl.dataset.cleared;
                                }
                            }
                        },
                    }
                }
            );
        }, wrapper);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            tl.kill();
            ctx_reveal.revert();
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, [failed, drawCover]);

    if (failed) return null;

    return (
        <div
            ref={wrapperRef}
            className="bg-black relative z-0"
            style={{
                height: `${SCROLL_DISTANCE + 1000}px`, // Playback distance + reveal distance
            }}
        >
            <section
                ref={sectionRef}
                className="fixed inset-0 w-full bg-black overflow-hidden m-0 p-0 cursor-none"
            >
                <div className="w-full h-full relative overflow-hidden pointer-events-none">

                    {loaded && progress < 100 && !hasSeenIntroState && (
                        <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-64 md:w-80 transition-opacity duration-300">
                            <span className="text-white text-sm uppercase tracking-[0.3em] font-bold animate-pulse">
                                Loading Experience
                            </span>
                            <div className="w-full flex items-center justify-between text-amber-400/80 text-[10px] font-bold tracking-wider mb-[-8px]">
                                <span>{progress}%</span>
                                <span>READY</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-amber-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(251,191,36,0.8)] relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-pulse-glow" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Canvas */}
                    <canvas
                        ref={canvasRef}
                        style={{ display: "block", width: "100%", height: "100%" }}
                    />

                    {/* Thumbnail Image - Visible before scroll */}
                    <AnimatePresence>
                        {!hasScrolled && (
                            <motion.div
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0 }}
                                className="absolute inset-0 z-[5] pointer-events-none"
                            >
                                <Image
                                    src={ThumbnailImg}
                                    alt=""
                                    fill
                                    priority
                                    className="object-cover"
                                    unoptimized
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Immersive Glassmorphism Navigation Bar ─── */}
                    <nav
                        className="hidden md:block absolute top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto cursor-auto"
                        onMouseEnter={() => gsap.to(cursorRef.current, { scale: 0, opacity: 0, duration: 0.2, ease: "power2.out" })}
                        onMouseLeave={() => gsap.to(cursorRef.current, { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(1.7)" })}
                    >
                        <div
                            className="flex items-center gap-2 px-4 lg:px-10 py-1.5"
                            style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                backdropFilter: "blur(24px) saturate(180%)",
                                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                                borderRadius: "24px",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                width: "max-content",
                                maxWidth: "94vw",
                                justifyContent: "space-between",
                                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            {/* Left Side: Navigation Links */}
                            <div className="flex items-center gap-4 lg:gap-8">
                                <Link href="/" className="flex items-center gap-2 group text-white/70 hover:text-white transition-all duration-300">
                                    <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Home</span>
                                </Link>
                                <Link href="/about" className="flex items-center gap-2 group text-white/70 hover:text-white transition-all duration-300">
                                    <Info className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">About</span>
                                </Link>
                            </div>

                            {/* Centerpiece: Marketplace */}
                            <Link
                                href="/products"
                                className="flex items-center gap-2.5 px-4 lg:px-8 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm font-black uppercase tracking-[0.3em] transition-all duration-500 hover:scale-105 group"
                            >
                                <ShoppingBag className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                Marketplace
                            </Link>

                            {/* Right Side: Contact & Auth */}
                            <div className="flex items-center gap-4 lg:gap-8">
                                <Link href="/faq" className="flex items-center gap-2 group text-white/70 hover:text-white transition-all duration-300">
                                    <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Contact</span>
                                </Link>

                                <div className="flex items-center gap-4">
                                    {!authLoading && (
                                        user ? (
                                            <div className="relative" ref={dropdownRef}>
                                                <button
                                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                    className="flex items-center gap-2 group focus:outline-none"
                                                >
                                                    <div className="size-8 rounded-full bg-white/20 ring-1 ring-white/30 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:ring-amber-400/50 transition-all">
                                                        {user.avatar ? (
                                                            <Image src={user.avatar as string} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                                                        ) : (
                                                            <User className="w-4 h-4 text-white" />
                                                        )}
                                                    </div>
                                                    <ChevronDown className={`w-3 h-3 text-white/50 group-hover:text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Profile Dropdown */}
                                                <AnimatePresence>
                                                    {isProfileOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            className="absolute right-0 mt-4 w-48 rounded-lg overflow-hidden"
                                                            style={{
                                                                background: "rgba(0, 0, 0, 0.8)",
                                                                backdropFilter: "blur(12px)",
                                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                                boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                                            }}
                                                        >
                                                            <div className="p-1.5 flex flex-col gap-1">
                                                                <Link
                                                                    href={user.role?.toUpperCase() === "USER" ? "/products" : user.role?.toUpperCase() === "ADMIN" ? "/dashboard/exporter" : `/dashboard/${user.role?.toLowerCase()}`}
                                                                    prefetch={false}
                                                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all group"
                                                                    onClick={() => setIsProfileOpen(false)}
                                                                >
                                                                    <LayoutDashboard className="w-4 h-4 group-hover:text-amber-400" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        logout();
                                                                        setIsProfileOpen(false);
                                                                    }}
                                                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-white/70 hover:text-red-400 transition-all group w-full text-left"
                                                                >
                                                                    <LogOut className="w-4 h-4" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <Link
                                                    href="/login"
                                                    className="text-white/60 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                                >
                                                    Login
                                                </Link>
                                                <Link
                                                    href="/register"
                                                    className="px-6 h-8 flex items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black uppercase tracking-[0.1em] transition-all hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                                                >
                                                    Sign Up
                                                </Link>
                                            </div>
                                        )
                                    )}

                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* Logo Pinned to Corner */}
                    <div className="absolute top-0 left-0 z-10 p-0 m-0">
                        <Image src={LogoImg} alt="Ranote Exim Logo" className="w-[160px] md:w-[220px] lg:w-[280px] h-auto object-contain origin-top-left -ml-4 -mt-6 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.4)]" unoptimized />
                    </div>

                    {/* Scroll-dependent Overlays */}
                    {loaded && (
                        <>
                            {/* --- Scrollytelling Text Overlays --- */}
                            {SCROLL_TEXTS.map((item, i) => {
                                const pos = POS_CLASSES[item.position];
                                return (
                                    <div
                                        key={item.id}
                                        ref={(el) => { textRefs.current[i] = el; }}
                                        className={pos.wrapper}
                                        style={{ opacity: 0, willChange: "transform, opacity, filter" }}
                                    >
                                        <div className={`flex flex-col ${pos.align} max-w-2xl px-6`}>
                                            {/* Decorative accent line */}
                                            <div className="w-14 h-[2px] bg-gradient-to-r from-amber-400/90 to-amber-600/30 mb-4" />
                                            <h2
                                                className="text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-4 tracking-tight leading-[1.05]"
                                                style={{
                                                    textShadow: "0 4px 60px rgba(0,0,0,0.9), 0 0px 120px rgba(0,0,0,0.6)",
                                                }}
                                            >
                                                {item.headline}
                                            </h2>
                                            <p
                                                className="text-base md:text-xl lg:text-2xl text-white/70 font-light leading-relaxed max-w-lg"
                                                style={{
                                                    textShadow: "0 2px 30px rgba(0,0,0,0.8)",
                                                }}
                                            >
                                                {item.sub}
                                            </p>
                                            {/* Bottom accent line */}
                                            <div className="w-14 h-[2px] bg-gradient-to-r from-amber-400/90 to-amber-600/30 mt-4" />
                                        </div>
                                    </div>
                                );
                            })}

                        </>
                    )}

                    {/* Custom Follow Cursor (No Border) */}
                    <div
                        ref={cursorRef}
                        className="fixed top-0 left-0 z-[100] flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-black tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(255,255,255,0.1)] pointer-events-none transition-colors duration-300"
                        style={{ opacity: 0, transform: "scale(0)", willChange: "transform, opacity" }}
                    >
                        {progress < 100 ? `${progress}%` : "Scroll"}
                    </div>
                </div>
            </section>
        </div>
    );
}