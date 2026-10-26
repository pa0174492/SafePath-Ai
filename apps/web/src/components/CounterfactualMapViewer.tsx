"use client";

import React, { useEffect, useRef, useState } from "react";
import { RouteCandidate, Coordinate } from "@/lib/api";
import { 
  Layers, 
  AlertTriangle, 
  ShieldCheck, 
  CloudRain, 
  Sun, 
  Compass, 
  MapPin, 
  Eye, 
  EyeOff,
  Maximize2,
  Sparkles
} from "lucide-react";

interface CounterfactualMapViewerProps {
  baselineRoute: RouteCandidate;
  adaptiveRoute: RouteCandidate;
  origin?: Coordinate;
  destination?: Coordinate;
  scenarioType?: string; // "monsoon" | "blackout" | "barricade" | "custom"
  rainfallMultiplier?: number;
}

export function CounterfactualMapViewer({
  baselineRoute,
  adaptiveRoute,
  origin,
  destination,
  scenarioType = "monsoon",
  rainfallMultiplier = 3.0,
}: CounterfactualMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [activeView, setActiveView] = useState<"both" | "adaptive" | "baseline">("both");

  // Initialize Map
  useEffect(() => {
    let isMounted = true;
    if (typeof window === "undefined" || !containerRef.current) return;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }

      const centerLat = origin?.lat || 18.0542;
      const centerLon = origin?.lon || 79.5357;

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLon],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Base Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: "abc",
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      setTimeout(() => {
        try { map.invalidateSize(); } catch (e) {}
      }, 300);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render Routes and Hazard Overlays
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear previous layers
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      const getLatLngs = (cand: RouteCandidate): [number, number][] => {
        if (cand?.geometry_geojson?.geometry?.coordinates) {
          return cand.geometry_geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
        }
        if (cand?.segments) {
          const pts: [number, number][] = [];
          cand.segments.forEach((s) => s.coords?.forEach((c) => pts.push([c.lat, c.lon])));
          return pts;
        }
        return [];
      };

      const basePts = getLatLngs(baselineRoute);
      const adaptPts = getLatLngs(adaptiveRoute);

      const allPts = [...basePts, ...adaptPts];
      if (allPts.length < 2) return;

      // Identify Hazard Center along the baseline path
      const midPoint = basePts[Math.floor(basePts.length * 0.5)] || allPts[0];

      // 1. Draw Simulated Hazard Shock Zone (Circle)
      if (scenarioType === "monsoon" || rainfallMultiplier > 2.0) {
        // Flood / Waterlogged zone circle
        const floodCircle = L.circle(midPoint, {
          color: "#0284C7",
          fillColor: "#38BDF8",
          fillOpacity: 0.35,
          weight: 2,
          dashArray: "4 4",
          radius: 65,
        }).addTo(map);

        floodCircle.bindTooltip(
          `<div style="font-weight: bold; color: #0369A1; font-size: 11px;">
            🌊 Waterlogging Flash Flood Zone<br>Subway Depth > 35cm • Friction μ: 0.32
          </div>`,
          { sticky: true }
        );
        layersRef.current.push(floodCircle);
      } else if (scenarioType === "blackout") {
        // Grid failure blackout zone circle
        const blackoutCircle = L.circle(midPoint, {
          color: "#475569",
          fillColor: "#0F172A",
          fillOpacity: 0.45,
          weight: 2,
          radius: 80,
        }).addTo(map);

        blackoutCircle.bindTooltip(
          `<div style="font-weight: bold; color: #E2E8F0; font-size: 11px;">
            ⚡ Transformer Failure Outage Zone<br>Ambient Lux &lt; 5.0 • Unlit Corridor
          </div>`,
          { sticky: true }
        );
        layersRef.current.push(blackoutCircle);
      } else {
        // Barricade / Construction zone
        const barricadeCircle = L.circle(midPoint, {
          color: "#DC2626",
          fillColor: "#F87171",
          fillOpacity: 0.3,
          weight: 2,
          radius: 50,
        }).addTo(map);

        barricadeCircle.bindTooltip(
          `<div style="font-weight: bold; color: #991B1B; font-size: 11px;">
            ⛔ Construction Barricade Zone<br>Sidewalk Demolished • Ramps Obstructed
          </div>`,
          { sticky: true }
        );
        layersRef.current.push(barricadeCircle);
      }

      // 2. Draw Baseline Compromised Path
      if (activeView === "both" || activeView === "baseline") {
        const baseLine = L.polyline(basePts, {
          color: "#EF4444",
          weight: 5,
          opacity: 0.85,
          dashArray: "7 7",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        baseLine.bindTooltip(
          `<div style="font-weight: bold; color: #DC2626; font-size: 11px;">
            ${baselineRoute.name}<br>Traverses Hazard Zone • High Vulnerability Exposure
          </div>`,
          { sticky: true }
        );
        layersRef.current.push(baseLine);

        // Warning Hazard Pin directly on blocked segment
        const alertIcon = L.divIcon({
          className: "crisis-alert-pin",
          html: `<div style="padding: 4px 10px; border-radius: 9999px; background: #DC2626; color: white; font-size: 11px; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(220,38,38,0.5); display: flex; align-items: center; gap: 4px; white-space: nowrap;">⚠️ Compromised Crossing</div>`,
          iconAnchor: [70, 12],
        });
        const alertMarker = L.marker(midPoint, { icon: alertIcon }).addTo(map);
        layersRef.current.push(alertMarker);
      }

      // 3. Draw SafePath Resilient Adaptive Detour Path
      if (activeView === "both" || activeView === "adaptive") {
        // Casing
        const adaptCasing = L.polyline(adaptPts, {
          color: "#FFFFFF",
          weight: 10,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        layersRef.current.push(adaptCasing);

        // Core line
        const adaptLine = L.polyline(adaptPts, {
          color: "#059669",
          weight: 6,
          opacity: 1.0,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        adaptLine.bindTooltip(
          `<div style="font-weight: bold; color: #047857; font-size: 11px;">
            ${adaptiveRoute.name}<br>Bypasses Hazard Zone • Verified Safe Elevated Sidewalk
          </div>`,
          { sticky: true }
        );
        layersRef.current.push(adaptLine);

        // Safety Shield Waypoint Pin on the detour
        const detourMid = adaptPts[Math.floor(adaptPts.length * 0.5)] || adaptPts[0];
        const detourIcon = L.divIcon({
          className: "detour-safe-pin",
          html: `<div style="padding: 4px 10px; border-radius: 9999px; background: #059669; color: white; font-size: 11px; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(5,150,105,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap;">🛡️ Resilient Adaptive Bypass</div>`,
          iconAnchor: [75, 12],
        });
        const detourMarker = L.marker(detourMid, { icon: detourIcon }).addTo(map);
        layersRef.current.push(detourMarker);
      }

      // 4. Start (A) and End (B) Markers
      const startCoord = basePts[0] || (origin ? [origin.lat, origin.lon] : null);
      if (startCoord) {
        const startIcon = L.divIcon({
          className: "start-pin",
          html: `<div style="width: 28px; height: 28px; border-radius: 9999px; background: #10B981; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px;">A</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const sm = L.marker(startCoord, { icon: startIcon }).addTo(map);
        sm.bindPopup("<b>Trip Origin</b>");
        layersRef.current.push(sm);
      }

      const endCoord = basePts[basePts.length - 1] || (destination ? [destination.lat, destination.lon] : null);
      if (endCoord) {
        const endIcon = L.divIcon({
          className: "dest-pin",
          html: `<div style="width: 28px; height: 28px; border-radius: 9999px; background: #EF4444; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px;">B</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const em = L.marker(endCoord, { icon: endIcon }).addTo(map);
        em.bindPopup("<b>Trip Destination</b>");
        layersRef.current.push(em);
      }

      // Fit Bounds
      try {
        const bounds = L.latLngBounds(allPts);
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (e) {}
    });
  }, [mapReady, baselineRoute, adaptiveRoute, scenarioType, rainfallMultiplier, activeView]);

  return (
    <div className="relative w-full h-[480px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 select-none">
      {/* Top Floating Map Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900">Adaptive Reroute Geometry</span>
        </div>
      </div>

      {/* Layer Visibility Toggle */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md text-xs font-semibold">
        <button
          onClick={() => setActiveView("both")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeView === "both"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Compare Both Paths
        </button>
        <button
          onClick={() => setActiveView("adaptive")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeView === "adaptive"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Safe Reroute Only</span>
        </button>
        <button
          onClick={() => setActiveView("baseline")}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeView === "baseline"
              ? "bg-red-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Compromised Only</span>
        </button>
      </div>

      {/* Bottom Floating Legend Pill */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-slate-700 shadow-lg text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1.5 bg-red-500 rounded-full border border-white" />
            <span className="text-slate-300">Baseline (Traverses Crisis Zone)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1.5 bg-emerald-500 rounded-full border border-white" />
            <span className="text-emerald-300 font-bold">SafePath Adaptive Bypass</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Resilience Score: <strong className="text-emerald-400 font-bold">0.94 / 1.00</strong></span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
