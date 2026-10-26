"use client";

import React, { useEffect, useRef, useState } from "react";
import { RouteCandidate, Coordinate } from "@/lib/api";
import { 
  ArrowLeftRight, 
  Link as LinkIcon, 
  Unlink, 
  Maximize2, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Accessibility, 
  MapPin, 
  Layers, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye
} from "lucide-react";

interface DualRouteCompareMapProps {
  routeA: RouteCandidate;
  routeB: RouteCandidate;
  allCandidates: RouteCandidate[];
  onSelectRouteA: (route: RouteCandidate) => void;
  onSelectRouteB: (route: RouteCandidate) => void;
  origin?: Coordinate;
  destination?: Coordinate;
}

const ROUTE_THEMES: Record<string, { color: string; label: string; badge: string }> = {
  "SafePath-BOA*": { color: "#2563EB", label: "SafePath BOA*", badge: "bg-blue-600 text-white" },
  "Baseline-Dijkstra-B0": { color: "#F59E0B", label: "Shortest Direct", badge: "bg-amber-600 text-white" },
  "SafePath-GuardianSecurity": { color: "#10B981", label: "Guardian Security", badge: "bg-emerald-600 text-white" },
  "SafePath-UniversalAccess": { color: "#8B5CF6", label: "Universal Access", badge: "bg-purple-600 text-white" },
  "SafePath-EcoShield": { color: "#06B6D4", label: "Eco-Shield", badge: "bg-cyan-600 text-white" },
  "SafePath-MaxAccessibility": { color: "#8B5CF6", label: "Max Accessibility", badge: "bg-purple-600 text-white" },
};

const DEFAULT_THEME = { color: "#3B82F6", label: "Alternative Route", badge: "bg-blue-600 text-white" };

export function DualRouteCompareMap({
  routeA,
  routeB,
  allCandidates,
  onSelectRouteA,
  onSelectRouteB,
  origin,
  destination,
}: DualRouteCompareMapProps) {
  const containerRefA = useRef<HTMLDivElement>(null);
  const containerRefB = useRef<HTMLDivElement>(null);
  const mapA = useRef<any>(null);
  const mapB = useRef<any>(null);

  const layersA = useRef<any[]>([]);
  const layersB = useRef<any[]>([]);

  const [mapsReady, setMapsReady] = useState(false);
  const [syncViews, setSyncViews] = useState(true);
  const isSyncingRef = useRef(false);

  // Initialize both maps
  useEffect(() => {
    let isMounted = true;
    if (typeof window === "undefined" || !containerRefA.current || !containerRefB.current) return;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRefA.current || !containerRefB.current) return;

      // Clean existing
      if (mapA.current) {
        try { mapA.current.remove(); } catch (e) {}
        mapA.current = null;
      }
      if (mapB.current) {
        try { mapB.current.remove(); } catch (e) {}
        mapB.current = null;
      }

      const centerLat = origin?.lat || 18.0542;
      const centerLon = origin?.lon || 79.5357;

      const initMap = (container: HTMLDivElement) => {
        const map = L.map(container, {
          center: [centerLat, centerLon],
          zoom: 16,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          subdomains: "abc",
        }).addTo(map);

        return map;
      };

      const m1 = initMap(containerRefA.current);
      const m2 = initMap(containerRefB.current);

      mapA.current = m1;
      mapB.current = m2;

      // Sync views handlers
      const handleMoveA = () => {
        if (!syncViews || isSyncingRef.current || !mapB.current) return;
        isSyncingRef.current = true;
        mapB.current.setView(m1.getCenter(), m1.getZoom(), { animate: false });
        isSyncingRef.current = false;
      };

      const handleMoveB = () => {
        if (!syncViews || isSyncingRef.current || !mapA.current) return;
        isSyncingRef.current = true;
        m1.setView(mapB.current.getCenter(), mapB.current.getZoom(), { animate: false });
        isSyncingRef.current = false;
      };

      m1.on("move", handleMoveA);
      m2.on("move", handleMoveB);

      setMapsReady(true);

      setTimeout(() => {
        try {
          m1.invalidateSize();
          m2.invalidateSize();
        } catch (e) {}
      }, 300);
    });

    return () => {
      isMounted = false;
      if (mapA.current) {
        try { mapA.current.remove(); } catch (e) {}
        mapA.current = null;
      }
      if (mapB.current) {
        try { mapB.current.remove(); } catch (e) {}
        mapB.current = null;
      }
    };
  }, []);

  // Render Routes on both maps
  useEffect(() => {
    if (!mapsReady || !mapA.current || !mapB.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const renderRouteOnMap = (
        map: any,
        route: RouteCandidate,
        layersStore: React.MutableRefObject<any[]>,
        isBaselineHazardous: boolean
      ) => {
        // Clear old layers
        layersStore.current.forEach((l) => map.removeLayer(l));
        layersStore.current = [];

        if (!route) return;

        const theme = ROUTE_THEMES[route.algorithm_tag] || DEFAULT_THEME;

        // Extract coordinates
        let latLngs: [number, number][] = [];
        if (route.geometry_geojson?.geometry?.coordinates) {
          latLngs = route.geometry_geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
        } else if (route.segments && route.segments.length > 0) {
          route.segments.forEach((s) => {
            if (s.coords) {
              s.coords.forEach((c) => latLngs.push([c.lat, c.lon]));
            }
          });
        }

        if (latLngs.length < 2) return;

        // 1. Shadow casing
        const casing = L.polyline(latLngs, {
          color: "#FFFFFF",
          weight: 9,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        layersStore.current.push(casing);

        // 2. Primary line
        const polyline = L.polyline(latLngs, {
          color: theme.color,
          weight: 6,
          opacity: 1.0,
          dashArray: isBaselineHazardous ? "7 7" : undefined,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        layersStore.current.push(polyline);

        // 3. Start Pin
        const startIcon = L.divIcon({
          className: "compare-pin",
          html: `<div style="width: 28px; height: 28px; border-radius: 9999px; background: #10B981; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px;">A</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const startMarker = L.marker(latLngs[0], { icon: startIcon }).addTo(map);
        startMarker.bindPopup(`<b>Origin</b><br>${route.name} Departure`);
        layersStore.current.push(startMarker);

        // 4. End Pin
        const endIcon = L.divIcon({
          className: "compare-pin",
          html: `<div style="width: 28px; height: 28px; border-radius: 9999px; background: #EF4444; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px;">B</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map);
        endMarker.bindPopup(`<b>Destination</b><br>${route.name} Arrival`);
        layersStore.current.push(endMarker);

        // 5. Route-Specific Annotations / Waypoint Flags
        if (isBaselineHazardous) {
          // Add Warning Hazard flags along the hazardous route
          const midIdx1 = Math.floor(latLngs.length * 0.4);
          const midIdx2 = Math.floor(latLngs.length * 0.7);

          const hazardIcon1 = L.divIcon({
            className: "hazard-pin",
            html: `<div style="padding: 3px 8px; border-radius: 9999px; background: #DC2626; color: white; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; white-space: nowrap;">⚠️ Pitch-Dark Alley (0 Lux)</div>`,
            iconAnchor: [60, 10],
          });
          const hazMarker1 = L.marker(latLngs[midIdx1], { icon: hazardIcon1 }).addTo(map);
          layersStore.current.push(hazMarker1);

          if (route.metrics.potential_barrier_count > 0 && latLngs[midIdx2]) {
            const hazardIcon2 = L.divIcon({
              className: "hazard-pin",
              html: `<div style="padding: 3px 8px; border-radius: 9999px; background: #D97706; color: white; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; white-space: nowrap;">⛔ Missing Curb Ramp</div>`,
              iconAnchor: [60, 10],
            });
            const hazMarker2 = L.marker(latLngs[midIdx2], { icon: hazardIcon2 }).addTo(map);
            layersStore.current.push(hazMarker2);
          }
        } else {
          // Add Safety / Infrastructure Assurance badges along SafePath route
          const midIdx = Math.floor(latLngs.length * 0.5);
          const safeIcon = L.divIcon({
            className: "safe-pin",
            html: `<div style="padding: 3px 8px; border-radius: 9999px; background: #059669; color: white; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px; white-space: nowrap;">🛡️ 100% Lit LED Boulevard</div>`,
            iconAnchor: [70, 10],
          });
          const safeMarker = L.marker(latLngs[midIdx], { icon: safeIcon }).addTo(map);
          layersStore.current.push(safeMarker);
        }

        // Fit Bounds
        try {
          const bounds = L.latLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {}
      };

      const isBBaseline = routeB?.algorithm_tag?.includes("Dijkstra") || (routeB?.metrics?.robust_safety_risk || 0) > 0.4;
      const isABaseline = routeA?.algorithm_tag?.includes("Dijkstra") || (routeA?.metrics?.robust_safety_risk || 0) > 0.4;

      renderRouteOnMap(mapA.current, routeA, layersA, isABaseline);
      renderRouteOnMap(mapB.current, routeB, layersB, isBBaseline);
    });
  }, [mapsReady, routeA, routeB]);

  const handleSwap = () => {
    onSelectRouteA(routeB);
    onSelectRouteB(routeA);
  };

  const handleResetZoom = () => {
    if (!mapA.current || !mapB.current || typeof window === "undefined") return;
    import("leaflet").then((L) => {
      const getCoords = (r: RouteCandidate): [number, number][] => {
        if (r.geometry_geojson?.geometry?.coordinates) {
          return r.geometry_geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
        }
        return [];
      };
      const ptsA = getCoords(routeA);
      const ptsB = getCoords(routeB);
      const allPts: [number, number][] = [...ptsA, ...ptsB];
      if (allPts.length > 0) {
        const bounds = L.latLngBounds(allPts);
        mapA.current.fitBounds(bounds, { padding: [50, 50] });
        mapB.current.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  };

  const themeA = ROUTE_THEMES[routeA?.algorithm_tag] || DEFAULT_THEME;
  const themeB = ROUTE_THEMES[routeB?.algorithm_tag] || DEFAULT_THEME;

  return (
    <div className="space-y-3">
      {/* Top Floating Controls Bar */}
      <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Side-by-Side Spatial Dual Map</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono font-bold">
            Split Comparison
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSyncViews(!syncViews)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              syncViews
                ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {syncViews ? <LinkIcon className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
            <span>{syncViews ? "Views Synchronized" : "Independent Views"}</span>
          </button>

          <button
            onClick={handleSwap}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Swap Map A and Map B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Swap Routes</span>
          </button>

          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs transition-all cursor-pointer"
            title="Reset Both Zooms"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dual Side-by-Side Map Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* =========================================================
            MAP A (LEFT)
        ========================================================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-blue-500 shadow-md bg-slate-100 h-[460px] flex flex-col">
          {/* Map Header Overlay */}
          <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: themeA.color }} />
              <select
                value={routeA?.id}
                onChange={(e) => {
                  const found = allCandidates.find((c) => c.id === e.target.value);
                  if (found) onSelectRouteA(found);
                }}
                className="bg-transparent font-bold text-slate-900 text-xs truncate focus:outline-none cursor-pointer"
              >
                {allCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    Route A: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold">
                {routeA?.metrics.total_travel_time_min}m
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                Risk {routeA?.metrics.robust_safety_risk.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Floating Live Badge Bottom Left */}
          <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Map A: {routeA?.algorithm_tag}</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-400">{routeA?.metrics.accessible_segments_pct}% Access</span>
          </div>

          <div ref={containerRefA} className="w-full h-full" />
        </div>

        {/* =========================================================
            MAP B (RIGHT)
        ========================================================= */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500 shadow-md bg-slate-100 h-[460px] flex flex-col">
          {/* Map Header Overlay */}
          <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: themeB.color }} />
              <select
                value={routeB?.id}
                onChange={(e) => {
                  const found = allCandidates.find((c) => c.id === e.target.value);
                  if (found) onSelectRouteB(found);
                }}
                className="bg-transparent font-bold text-slate-900 text-xs truncate focus:outline-none cursor-pointer"
              >
                {allCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    Route B: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold">
                {routeB?.metrics.total_travel_time_min}m
              </span>
              <span className={`px-2 py-0.5 rounded-lg font-bold ${
                (routeB?.metrics.robust_safety_risk || 0) > 0.4
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700"
              }`}>
                Risk {routeB?.metrics.robust_safety_risk.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Floating Live Badge Bottom Left */}
          <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Map B: {routeB?.algorithm_tag}</span>
            <span className="text-slate-400">|</span>
            <span className={
              (routeB?.metrics.robust_safety_risk || 0) > 0.4 ? "text-amber-300" : "text-emerald-400"
            }>
              {(routeB?.metrics.robust_safety_risk || 0) > 0.4 ? "⚠️ High Risk Exposure" : "Low Exposure"}
            </span>
          </div>

          <div ref={containerRefB} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
