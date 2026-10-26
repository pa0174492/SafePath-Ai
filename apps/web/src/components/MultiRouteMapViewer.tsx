"use client";

import React, { useEffect, useRef, useState } from "react";
import { RouteCandidate, Coordinate } from "@/lib/api";
import { Layers, MapPin, Navigation, Eye, CheckCircle2, Shield, Clock, Compass } from "lucide-react";

interface MultiRouteMapViewerProps {
  candidates: RouteCandidate[];
  selectedCandidateId: string | null;
  onSelectCandidate: (cand: RouteCandidate) => void;
  origin?: Coordinate;
  destination?: Coordinate;
}

const ROUTE_COLORS: Record<string, { color: string; border: string; bg: string; name: string }> = {
  "SafePath-BOA*": { color: "#2563EB", border: "border-blue-500", bg: "bg-blue-50 text-blue-700", name: "SafePath BOA*" },
  "Baseline-Dijkstra-B0": { color: "#F59E0B", border: "border-amber-500", bg: "bg-amber-50 text-amber-700", name: "Direct Shortest" },
  "SafePath-GuardianSecurity": { color: "#10B981", border: "border-emerald-500", bg: "bg-emerald-50 text-emerald-700", name: "Guardian Security" },
  "SafePath-UniversalAccess": { color: "#8B5CF6", border: "border-purple-500", bg: "bg-purple-50 text-purple-700", name: "Universal Access" },
  "SafePath-EcoShield": { color: "#06B6D4", border: "border-cyan-500", bg: "bg-cyan-50 text-cyan-700", name: "Eco-Shield" },
};

const DEFAULT_COLOR = { color: "#3B82F6", border: "border-blue-500", bg: "bg-blue-50 text-blue-700", name: "Alternative" };

export function MultiRouteMapViewer({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  origin,
  destination
}: MultiRouteMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }

      // Default center around KITS Warangal or first candidate
      let centerLat = 18.0542;
      let centerLon = 79.5357;
      if (origin) {
        centerLat = origin.lat;
        centerLon = origin.lon;
      }

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Free reliable OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: "abc",
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 300);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polylines and Markers whenever candidates or selectedCandidateId changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear previous layers
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      const allLatLngs: [number, number][] = [];

      // Plot all candidate routes
      candidates.forEach((cand, idx) => {
        const colorCfg = ROUTE_COLORS[cand.algorithm_tag] || DEFAULT_COLOR;
        const isSelected = selectedCandidateId ? cand.id === selectedCandidateId : idx === 0;

        // Extract coordinates from geometry_geojson or segments
        let latLngs: [number, number][] = [];
        if (cand.geometry_geojson?.geometry?.coordinates) {
          latLngs = cand.geometry_geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        } else if (cand.segments && cand.segments.length > 0) {
          cand.segments.forEach((s) => {
            if (s.coords) {
              s.coords.forEach((c) => latLngs.push([c.lat, c.lon]));
            }
          });
        }

        if (latLngs.length < 2) return;

        latLngs.forEach((pt) => allLatLngs.push(pt));

        // Draw shadow/casing line for selected route
        if (isSelected) {
          const casing = L.polyline(latLngs, {
            color: "#FFFFFF",
            weight: 9,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          layersRef.current.push(casing);
        }

        // Draw primary polyline
        const line = L.polyline(latLngs, {
          color: colorCfg.color,
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 1.0 : 0.65,
          dashArray: cand.algorithm_tag.includes("Dijkstra") ? "6 6" : undefined,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        line.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 11px; font-weight: bold; padding: 2px;">
            <div style="color: ${colorCfg.color}; font-weight: 800;">${cand.name}</div>
            <div style="color: #475569;">${cand.metrics.total_travel_time_min} min • ${cand.metrics.total_distance_m}m • Risk ${cand.metrics.robust_safety_risk.toFixed(2)}</div>
          </div>`,
          { sticky: true, opacity: 0.95 }
        );

        line.on("click", () => {
          onSelectCandidate(cand);
        });

        if (isSelected) {
          line.bringToFront();
        }

        layersRef.current.push(line);
      });

      // Plot Start Marker (Origin)
      const firstCoord = allLatLngs[0] || (origin ? [origin.lat, origin.lon] : null);
      if (firstCoord) {
        const startIcon = L.divIcon({
          className: "custom-map-pin",
          html: `<div style="width: 24px; height: 24px; border-radius: 9999px; background: #10B981; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const startMarker = L.marker(firstCoord, { icon: startIcon }).addTo(map);
        startMarker.bindPopup("<b>Origin Point</b>");
        markersRef.current.push(startMarker);
      }

      // Plot End Marker (Destination)
      const lastCoord = allLatLngs[allLatLngs.length - 1] || (destination ? [destination.lat, destination.lon] : null);
      if (lastCoord) {
        const endIcon = L.divIcon({
          className: "custom-map-pin",
          html: `<div style="width: 24px; height: 24px; border-radius: 9999px; background: #EF4444; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">B</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const endMarker = L.marker(lastCoord, { icon: endIcon }).addTo(map);
        endMarker.bindPopup("<b>Destination Point</b>");
        markersRef.current.push(endMarker);
      }

      // Fit map bounds to show all candidates
      if (allLatLngs.length > 0) {
        try {
          const bounds = L.latLngBounds(allLatLngs);
          map.fitBounds(bounds, { padding: [40, 40] });
        } catch (e) {}
      }
    });
  }, [mapReady, candidates, selectedCandidateId]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 select-none">
      {/* Map Header Floating Overlay */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-md">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">Pareto Route Overlay</span>
          <span className="text-[10px] font-mono text-slate-500">({candidates.length} Paths Plotted)</span>
        </div>
      </div>

      {/* Interactive Floating Route Selector Legend */}
      <div className="absolute top-4 right-4 z-[400] hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md">
        {candidates.map((cand, idx) => {
          const cfg = ROUTE_COLORS[cand.algorithm_tag] || DEFAULT_COLOR;
          const isSelected = selectedCandidateId ? cand.id === selectedCandidateId : idx === 0;
          return (
            <button
              key={cand.id}
              onClick={() => onSelectCandidate(cand)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected 
                  ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-800" 
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span>{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
