"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { authFetch } from "@/lib/api-utils";
import { Globe, RefreshCw, Ship, Plane, Anchor } from "lucide-react";
import { useTheme } from "next-themes";
import "leaflet/dist/leaflet.css";

// ── Types ────────────────────────────────────────────────────────────────────
interface LiveRoute {
 id: string;
 fromPort: string;
 toPort: string;
 type: "ocean" | "air" | "land";
 status: string;
 vessel?: string;
 cargo?: string;
 lat?: number;
 lng?: number;
 lastLocation?: string;
 importer?: string;
}

// ── Port coordinates for mapping port codes to real lat/lng ──────────────────
const PORT_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
 MUMBAI: { lat: 19.08, lng: 72.88, name: "Mumbai" },
 NHAVA_SHEVA: { lat: 18.95, lng: 72.95, name: "JNPT Nhava Sheva" },
 DELHI: { lat: 28.61, lng: 77.10, name: "Delhi" },
 CHENNAI: { lat: 13.08, lng: 80.28, name: "Chennai" },
 KOLKATA: { lat: 22.57, lng: 88.37, name: "Kolkata" },
 KANDLA: { lat: 23.00, lng: 70.22, name: "Kandla" },
 COCHIN: { lat: 9.96, lng: 76.27, name: "Kochi" },
 VIZAG: { lat: 17.70, lng: 83.32, name: "Visakhapatnam" },
 BENGALURU: { lat: 12.97, lng: 77.59, name: "Bangalore" },
 DUBAI: { lat: 25.20, lng: 55.30, name: "Dubai" },
 JEDDAH: { lat: 21.48, lng: 39.17, name: "Jeddah" },
 SINGAPORE: { lat: 1.29, lng: 103.82, name: "Singapore" },
 HONG_KONG: { lat: 22.32, lng: 114.16, name: "Hong Kong" },
 SHANGHAI: { lat: 31.23, lng: 121.47, name: "Shanghai" },
 TOKYO: { lat: 35.68, lng: 139.69, name: "Tokyo" },
 BUSAN: { lat: 35.10, lng: 129.05, name: "Busan" },
 ROTTERDAM: { lat: 51.93, lng: 4.48, name: "Rotterdam" },
 HAMBURG: { lat: 53.55, lng: 9.99, name: "Hamburg" },
 ANTWERP: { lat: 51.22, lng: 4.40, name: "Antwerp" },
 LONDON: { lat: 51.51, lng: -0.12, name: "London" },
 NEW_YORK: { lat: 40.71, lng: -74.01, name: "New York" },
 LOS_ANGELES: { lat: 34.05, lng: -118.24, name: "Los Angeles" },
 MOMBASA: { lat: -4.06, lng: 39.67, name: "Mombasa" },
 LAGOS: { lat: 6.45, lng: 3.38, name: "Lagos" },
 SYDNEY: { lat: -33.87, lng: 151.21, name: "Sydney" },
 COLOMBO: { lat: 6.92, lng: 79.84, name: "Colombo" },
 BANGKOK: { lat: 13.75, lng: 100.52, name: "Bangkok" },
};

// ── Fallback Trade Network SVG Component ─────────────────────────────────────
export function MapFallback({ footerText = "Air 1 / Ocean 2 / Ports 6 / All shipments" }: { footerText?: string }) {
  return (
    <div className="relative w-full h-full min-h-[360px] bg-[#FFFCF4] flex flex-col justify-between overflow-hidden select-none">
      {/* Dotted Grid Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.25" fill="#ECE7DA" />
          </pattern>
          <linearGradient id="route-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4912A" />
            <stop offset="100%" stopColor="#EBC964" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />




      </svg>

      <div />

      {/* Bottom controls & Legend */}
      <div className="relative z-10 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wider bg-[#15130D] text-white shadow-sm">
            <span className="size-2 rounded-full bg-[#C4912A]" />
            India Hubs
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wider bg-[#15130D] text-white shadow-sm">
            <span className="size-2 rounded-full bg-[#EBC964]" />
            Air Freight
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-[700] uppercase tracking-wider bg-[#15130D] text-white shadow-sm">
            <span className="size-2 rounded-full bg-[#0B7A57]" />
            Ocean Cargo
          </span>
        </div>

        <div className="pt-2 border-t border-[#F0ECE0] flex items-center justify-between text-[11px] font-[700] uppercase tracking-[0.14em] text-[#6B6A66]">
          <span>{footerText}</span>
          <span className="text-[#0B7A57] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#0B7A57] animate-pulse" />
            TELEMETRY ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}

// ── The actual Leaflet map (loaded dynamically to avoid SSR) ────────────────
function LeafletMapInner({ routes, theme, onError }: { routes: LiveRoute[], theme?: string; onError?: () => void }) {
 const mapRef = useRef<any>(null);
 const [L, setL] = useState<any>(null);
 const [mapReady, setMapReady] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
   let active = true;
   // Dynamically import Leaflet on client
   import("leaflet")
     .then((leaflet) => {
       const leafletObj = leaflet.default || leaflet;
       
       // Critical Leaflet DOM unmount patch:
       // When navigating between pages (e.g. to /inventory), Leaflet transitions may fire on unmounted DOM panes.
       // Safely return Point(0, 0) instead of throwing: Cannot read properties of undefined (reading '_leaflet_pos')
       if (leafletObj?.DomUtil?.getPosition) {
         const originalGetPosition = leafletObj.DomUtil.getPosition;
         leafletObj.DomUtil.getPosition = function (el: any) {
           if (!el) {
             return leafletObj.point ? leafletObj.point(0, 0) : { x: 0, y: 0 };
           }
           try {
             return originalGetPosition.call(leafletObj.DomUtil, el) || (leafletObj.point ? leafletObj.point(0, 0) : { x: 0, y: 0 });
           } catch {
             return leafletObj.point ? leafletObj.point(0, 0) : { x: 0, y: 0 };
           }
         };
       }

       if (active) setL(leafletObj);
     })
     .catch((err) => {
       console.warn("Leaflet dynamic import failed, activating visual trade fallback:", err);
       onError?.();
     });

   return () => {
     active = false;
   };
 }, [onError]);

 useEffect(() => {
 if (!L || !containerRef.current || mapReady) return;

 // Fix Leaflet default icon issue in webpack/next.js
 delete (L.Icon.Default.prototype as any)._getIconUrl;
 L.Icon.Default.mergeOptions({
 iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
 iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
 shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
 });

 // Create map centered on Indian Ocean
    const container = containerRef.current;
    const map = L.map(container, {
      center: [20.59, 78.96],
      zoom: 3,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      worldCopyJump: false,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    // Clean minimal tiles: Esri Gray Canvas (100% free, no API key, zero watermark)
    const isDark = theme === "dark";
    const cartoApiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

    // Use Carto ONLY if an explicit API key was provided; otherwise use Esri Gray Canvas
    const primaryTileUrl = cartoApiKey
      ? (isDark
        ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?api_key=${cartoApiKey}`
        : `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?api_key=${cartoApiKey}`)
      : (isDark
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}");

    const fallbackTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const tileOptions = {
      maxZoom: 16,
      attribution: '&copy; Esri &copy; OpenStreetMap contributors',
    };

    const tileLayer = L.tileLayer(primaryTileUrl, tileOptions);
    let fallbackTriggered = false;
    tileLayer.on("tileerror", () => {
      if (!fallbackTriggered) {
        fallbackTriggered = true;
        try {
          console.warn("[ShipTrackingMap] Primary tile failed, switching to OpenStreetMap fallback");
          tileLayer.setUrl(fallbackTileUrl);
        } catch {}
      }
    });
    tileLayer.addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    // Multiple layout passes to guarantee all tiles are fetched and rendered
    map.invalidateSize();
    const t1 = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 150);
    const t2 = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 500);

    // Continuous observation of parent resizing
    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        try { map.invalidateSize(); } catch {}
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      try {
        map.stop();
        map.off();
        map.remove();
      } catch {
        // Graceful unmount
      }
      mapRef.current = null;
      setMapReady(false);
    };
  }, [L, theme]); // theme added to trigger tile update

 // Draw routes when data changes
 useEffect(() => {
 if (!L || !mapRef.current || !mapReady) return;
 const map = mapRef.current;

 // Clear existing layers (except the tile layer)
 map.eachLayer((layer: any) => {
 if (layer._url) return; // skip tile layer
 map.removeLayer(layer);
 });

 if (routes.length === 0) {
    try { map.setView([20.59, 78.96], 3); } catch {}
    return;
  }

 const allLatLngs: [number, number][] = [];

 routes.forEach((route) => {
 const from = PORT_COORDS[route.fromPort];
 const to = PORT_COORDS[route.toPort];
 if (!from && !to) return;

 const fromLatLng: [number, number] = from
 ? [from.lat, from.lng]
 : [20, 73]; // Default to Mumbai area
 const toLatLng: [number, number] = to
 ? [to.lat, to.lng]
 : [52, 4]; // Default to Rotterdam

 allLatLngs.push(fromLatLng, toLatLng);

 // Route color - Use a bold contrast (Primary for light, White for dark)
 const originColor = theme === "dark" ? "#F59E0B" : "#C4912A";
  const destColor = theme === "dark" ? "#10B981" : "#0B7A57";
  const color = originColor;

 // Origin port marker (Primary for India)
 const originIcon = L.divIcon({
 className: "",
 html: `<div style="
 width: 14px; height: 14px; border-radius: 50%;
 background: ${color};
 border: 2px solid white;
 box-shadow: 0 0 12px ${color}66;
 "></div>`,
 iconSize: [14, 14],
 iconAnchor: [7, 7],
 });
 L.marker(fromLatLng, { icon: originIcon })
 .addTo(map)
 .bindPopup(`
 <div style="font-family:'Sora', sans-serif; font-size:11px; padding: 4px;">
 <b style="color:${originColor}; display: block; margin-bottom: 4px; text-transform: uppercase;">📦 India Export Hub</b>
 <b style="font-size: 13px;">${from?.name || route.fromPort}</b><br/>
 Cargo: ${route.cargo || "N/A"}<br/>
 Vessel: ${route.vessel || "N/A"}
 </div>
 `);

 // Destination port marker
 const destIcon = L.divIcon({
 className: "",
 html: `<div style="
 width: 12px; height: 12px; border-radius: 50%;
 background: ${color};
 border: 2px solid white;
 box-shadow: 0 0 10px ${color}88;
 "></div>`,
 iconSize: [12, 12],
 iconAnchor: [6, 6],
 });
 L.marker(toLatLng, { icon: destIcon })
 .addTo(map)
 .bindPopup(`
 <div style="font-family:'Sora', sans-serif; font-size:11px; padding: 4px;">
 <b style="color:${destColor}; display: block; margin-bottom: 4px; text-transform: uppercase;">🏁 Destination Port</b>
 <b style="font-size: 13px;">${to?.name || route.toPort}</b><br/>
 Buyer: ${route.importer || "N/A"}
 </div>
 `);

 // Ship current position (if GPS available)
 if (route.lat && route.lng) {
 const shipLatLng: [number, number] = [route.lat, route.lng];
 allLatLngs.push(shipLatLng);

 const shipIcon = L.divIcon({
 className: "",
 html: `<div style="position:relative">
 <div style="
 width: 20px; height: 20px; border-radius: 50%;
 background: radial-gradient(circle, #fff 20%, ${color} 60%, transparent 100%);
 box-shadow: 0 0 20px ${color};
 animation: pulse 2s infinite;
 "></div>
 <div style="
 position:absolute; top:-1px; left:-1px;
 width: 22px; height: 22px; border-radius: 50%;
 border: 1.5px solid ${color};
 animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
 "></div>
 </div>`,
 iconSize: [20, 20],
 iconAnchor: [10, 10],
 });

 L.marker(shipLatLng, { icon: shipIcon })
 .addTo(map)
 .bindPopup(`
 <div style="font-family:'Sora', sans-serif; font-size:11px; padding: 4px;">
 <b style="color:${color}; display: block; margin-bottom: 4px; text-transform: uppercase;">🚢 Vessel Position</b>
 <b style="font-size: 13px;">${route.vessel || "Unknown Vessel"}</b><br/>
 Location: ${route.lastLocation || "At Sea"}<br/>
 Lat: ${route.lat.toFixed(4)}° Lng: ${route.lng.toFixed(4)}°<br/>
 Cargo: ${route.cargo || "N/A"}<br/>
 Destination: ${to?.name || route.toPort}
 </div>
 `);
 }
 });

 // Fit map bounds to show all points without animated transitions that can leak on unmount
 if (allLatLngs.length > 1) {
 const bounds = L.latLngBounds(allLatLngs);
 map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5, animate: false });
 }
 }, [L, routes, mapReady, theme]);

 return (
 <>
 <style jsx global>{`
 @keyframes pulse {
 0%, 100% { opacity: 1; transform: scale(1); }
 50% { opacity: 0.7; transform: scale(1.2); }
 }
 @keyframes ping {
 0% { transform: scale(1); opacity: 0.8; }
 75%, 100% { transform: scale(2.5); opacity: 0; }
 }
 .leaflet-popup-content-wrapper {
 background: white !important;
 color: #000000 !important;
 border: 1px solid rgba(0, 0, 0, 0.1) !important;
 border-radius: 12px !important;
 box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
 padding: 0 !important;
 }
 .dark .leaflet-popup-content-wrapper {
 background: #0a0a0a !important;
 color: #ffffff !important;
 border: 1px solid rgba(255, 255, 255, 0.1) !important;
 box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
 }
 .leaflet-popup-content {
 margin: 12px !important;
 width: auto !important;
 }
 .leaflet-popup-tip {
 background: white !important;
 }
 .dark .leaflet-popup-tip {
 background: #0a0a0a !important;
 }
 .leaflet-control-zoom a {
 background: white !important;
 color: #333 !important;
 border-color: #eee !important;
 }
 .dark .leaflet-control-zoom a {
 background: #111 !important;
 color: #eee !important;
 border-color: #222 !important;
 }
 .leaflet-control-zoom a:hover {
 background: #f5f5f5 !important;
 }
 .dark .leaflet-control-zoom a:hover {
 background: #222 !important;
 }

 .leaflet-container {
 width: 100% !important;
 height: 100% !important;
 background: transparent !important;
 z-index: 1 !important;
 }
 `}</style>
 <div
 ref={containerRef}
 className="absolute inset-0 z-0 bg-transparent"
 />
 </>
 );
}

// ── Main Export ──────────────────────────────────────────────────────────────
export default function ShipTrackingMap({ 
 filter = "all", 
 routes: externalRoutes,
}: { 
 filter?: string; 
 routes?: LiveRoute[]; 
}) {
 const [internalRoutes, setInternalRoutes] = useState<LiveRoute[]>([]);
 const [loading, setLoading] = useState(!externalRoutes);
 const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
 const [refreshKey, setRefreshKey] = useState(0);
 const { resolvedTheme } = useTheme();
 const [mapError, setMapError] = useState(false);

 useEffect(() => {
 if (externalRoutes) {
 setInternalRoutes(externalRoutes);
 setLoading(false);
 return;
 }
 setLoading(true);
 authFetch<{ routes: LiveRoute[]; total: number }>("/api/shipments/active")
 .then((d) => {
 if (d?.routes) {
 setInternalRoutes(d.routes);
 setLastUpdate(new Date());
 }
 })
 .catch((err) => {
 console.error("[ShipMap] Failed to load routes:", err);
 setInternalRoutes([]);
 })
 .finally(() => setLoading(false));
 }, [refreshKey, externalRoutes]);

 const displayRoutes = useMemo(() => {
 if (filter === "all") return internalRoutes;
 return internalRoutes.filter(r => {
 const port = r.toPort.toLowerCase();
 if (filter === "russia") return port.includes("russia");
 if (filter === "europe") return port.includes("london") || port.includes("rotterdam") || port.includes("antwerp") || port.includes("hamburg");
 if (filter === "usa") return port.includes("new_york") || port.includes("los_angeles");
 if (filter === "asia") return port.includes("singapore") || port.includes("shanghai") || port.includes("tokyo") || port.includes("busan") || port.includes("bangkok") || port.includes("hong_kong");
 if (filter === "africa") return port.includes("mombasa") || port.includes("lagos");
 return true;
 });
 }, [internalRoutes, filter]);

 return (
 <div className="w-full h-full flex flex-col rounded-lg overflow-hidden bg-card dark:bg-[#050505]/40 border border-border dark:border-white/5 shadow-sm dark:shadow-none">
 {/* Header */}
 {!externalRoutes && (
 <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 z-20 relative border-b border-border dark:border-white/5 bg-background/50 dark:bg-transparent backdrop-blur-sm">
 <div className="flex items-center gap-3">
 <Globe className="w-4 h-4 text-primary flex-shrink-0" />
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-[14px] font-black text-foreground dark:text-white tracking-tight">
 India Global Trade Network
 </h2>
 <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
 internalRoutes.length > 0
 ? "bg-primary/10 border-primary/20 text-primary"
 : "bg-neutral-500/12 border-neutral-500/30 text-neutral-400"
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
 internalRoutes.length > 0 ? "bg-primary" : "bg-neutral-400"
 }`} />
 {internalRoutes.length > 0 ? "LIVE" : "NO ROUTES"}
 </span>
 </div>
 <p className="text-[10px] text-muted-foreground mt-0.5">
 {internalRoutes.length} active route{internalRoutes.length !== 1 ? "s" : ""}
 {lastUpdate && <span> · {lastUpdate.toLocaleTimeString()}</span>}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setRefreshKey((n) => n + 1)}
 className="w-8 h-8 flex items-center justify-center rounded-lg bg-background dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-all"
 title="Refresh"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
 </button>
 </div>
 </div>
 )}

 {/* Map */}
 <div className="flex-1 relative min-h-0">

 {internalRoutes.length === 0 && !loading ? (
 <div className="absolute inset-0 flex items-center justify-center z-10">
 <div className="text-center space-y-3">
 <Ship className="w-10 h-10 text-muted-foreground/30 mx-auto" />
 <p className="text-muted-foreground text-sm font-black">No active shipments to track</p>
 <p className="text-muted-foreground/40 text-[10px] uppercase tracking-widest">Routes will appear here when you ship goods</p>
 </div>
 </div>
 ) : null}

 {loading ? (
 <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 dark:bg-background/40 backdrop-blur-sm">
 <div className="text-center space-y-3">
 <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
 <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Loading live tracking...</p>
 </div>
 </div>
 ) : null}

 {mapError ? (
 <MapFallback />
 ) : (
 <LeafletMapInner key={resolvedTheme} routes={displayRoutes} theme={resolvedTheme} onError={() => setMapError(true)} />
 )}
 </div>

 {/* Footer stats */}
 {!externalRoutes && (
 <div className="flex-shrink-0 flex items-center justify-between px-5 py-2 border-t border-border dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/50 dark:bg-transparent backdrop-blur-sm">
 <div className="flex items-center gap-4">
 <span className="flex items-center gap-1">
 <Plane className="w-3 h-3" />
 Air {internalRoutes.filter((r) => r.type === "air").length}
 </span>
 <span className="flex items-center gap-1">
 <Anchor className="w-3 h-3" />
 Ocean {internalRoutes.filter((r) => r.type === "ocean").length}
 </span>
 </div>
 <span className="opacity-40">
 Only showing your active shipments
 </span>
 </div>
 )}
 </div>
 );
}
