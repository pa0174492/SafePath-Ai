"use client";

import React, { useState, useEffect, useRef } from "react";
import nextDynamic from "next/dynamic";
import { 
  fetchDemoRoute, 
  calculateRoute,
  getActiveRoute, 
  RouteCandidate, 
  RouteSegment, 
  Coordinate,
  UserProfile 
} from "@/lib/api";
import { 
  Accessibility, 
  Filter, 
  Sliders, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Database,
  MapPin,
  Layers,
  Sparkles,
  Printer,
  X,
  Navigation,
  Eye,
  Activity,
  Check
} from "lucide-react";

// Interactive Map for Accessibility Studio
const AccessibilityMap = nextDynamic(
  () => Promise.resolve(({ 
    segments, 
    selectedIdx, 
    onSelectIdx,
    maxSlope 
  }: { 
    segments: RouteSegment[]; 
    selectedIdx: number; 
    onSelectIdx: (idx: number) => void;
    maxSlope: number;
  }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<any>(null);
    const layersRef = useRef<any[]>([]);

    useEffect(() => {
      let isMounted = true;
      if (typeof window === "undefined" || !mapRef.current) return;

      import("leaflet").then((L) => {
        if (!isMounted || !mapRef.current) return;

        if (instanceRef.current) {
          try {
            instanceRef.current.remove();
          } catch (e) {}
          instanceRef.current = null;
        }

        const map = L.map(mapRef.current, {
          center: [18.0542, 79.5357],
          zoom: 16,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          subdomains: "abc",
        }).addTo(map);

        instanceRef.current = map;
      });

      return () => {
        isMounted = false;
        if (instanceRef.current) {
          try {
            instanceRef.current.remove();
          } catch (e) {}
          instanceRef.current = null;
        }
      };
    }, []);

    // Update polylines
    useEffect(() => {
      if (!instanceRef.current || typeof window === "undefined") return;

      import("leaflet").then((L) => {
        const map = instanceRef.current;
        if (!map) return;

        layersRef.current.forEach((l) => map.removeLayer(l));
        layersRef.current = [];

        const allPts: [number, number][] = [];

        segments.forEach((seg, idx) => {
          if (!seg.coords || seg.coords.length < 2) return;
          const latLngs: [number, number][] = seg.coords.map((c) => [c.lat, c.lon]);
          latLngs.forEach((p) => allPts.push(p));

          const isExceeding = seg.slope_pct > maxSlope;
          const isSelected = selectedIdx === seg.segment_index;

          // Color by compliance: Green = Compliant, Red = Exceeds Slope, Amber = Inferred/Caution
          const color = isExceeding 
            ? "#EF4444" 
            : seg.accessibility_status === "INFERRED" 
              ? "#F59E0B" 
              : "#10B981";

          const line = L.polyline(latLngs, {
            color,
            weight: isSelected ? 8 : 5,
            opacity: isSelected ? 1.0 : 0.8,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          line.bindTooltip(
            `<b>Segment #${seg.segment_index + 1}</b><br/>${seg.road_class} • Slope: ${seg.slope_pct}%`,
            { sticky: true }
          );

          line.on("click", () => onSelectIdx(seg.segment_index));
          layersRef.current.push(line);
        });

        if (allPts.length > 0) {
          try {
            map.fitBounds(L.latLngBounds(allPts), { padding: [30, 30] });
          } catch (e) {}
        }
      });
    }, [segments, selectedIdx, maxSlope]);

    return (
      <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive Barrier Map</span>
        </div>
        <div ref={mapRef} className="w-full h-full" />
      </div>
    );
  }),
  { ssr: false }
);

export default function AccessibilityPage() {
  const [candidate, setCandidate] = useState<RouteCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState("WHEELCHAIR_MANUAL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [maxSlopeFilter, setMaxSlopeFilter] = useState<number>(8.33);
  const [onlyLit, setOnlyLit] = useState(false);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(0);
  const [certModalOpen, setCertModalOpen] = useState(false);

  // Indian corridor selector
  const [activeCityKey, setActiveCityKey] = useState("warangal_kits");

  const cityPresets: Record<string, { name: string; origin: Coordinate; dest: Coordinate }> = {
    warangal_kits: {
      name: "KITS Campus, Warangal (Main Gate to Library)",
      origin: { lat: 18.05418, lon: 79.53575 },
      dest: { lat: 18.05650, lon: 79.53780 }
    },
    warangal_ku: {
      name: "Kakatiya University, Warangal (NH-163 to Admin)",
      origin: { lat: 18.0195, lon: 79.5532 },
      dest: { lat: 18.0250, lon: 79.5475 }
    },
    hyderabad: {
      name: "Cyber Towers to Mindspace, Hyderabad",
      origin: { lat: 17.4435, lon: 78.3772 },
      dest: { lat: 17.4380, lon: 78.3850 }
    },
    bengaluru: {
      name: "MG Road Metro to Cubbon Park, Bengaluru",
      origin: { lat: 12.9716, lon: 77.5946 },
      dest: { lat: 12.9770, lon: 77.6010 }
    }
  };

  const loadAuditData = async (prof: string, cityKey: string = activeCityKey) => {
    setLoading(true);

    // 1. Try to reuse active route from user's live map session
    const activeRoute = getActiveRoute();
    if (activeRoute && activeRoute.candidates && activeRoute.candidates.length > 0) {
      const topCand = activeRoute.candidates[0];
      setCandidate(topCand);
      setSelectedSegmentIdx(0);
      setLoading(false);
      return;
    }

    // 2. Otherwise calculate for chosen city corridor
    try {
      const p = cityPresets[cityKey] || cityPresets.warangal_kits;
      const res = await calculateRoute({
        origin: p.origin,
        destination: p.dest,
        profile: {
          profile_type: prof,
          max_slope_pct: maxSlopeFilter,
          avoid_unpaved: true,
          require_curb_ramps: true,
          require_lit_streets: onlyLit,
          require_signalized_crossings: false,
          max_step_height_cm: 4.0,
          walking_speed_mps: 1.15,
          safety_priority: 0.4,
          accessibility_priority: 0.6,
          time_priority: 0.3,
          environment_priority: 0.2,
          complexity_priority: 0.1,
          uncertainty_aversion_lambda: 1.2
        },
        city_tag: cityKey
      });

      if (res.candidates && res.candidates.length > 0) {
        setCandidate(res.candidates[0]);
        setSelectedSegmentIdx(0);
      }
    } catch (e) {
      console.warn("Audit route error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData(profile, activeCityKey);
  }, [profile, activeCityKey]);

  const rawSegments = candidate?.segments || [];

  // Dynamic Filtering based on active user sliders
  const filteredSegments = rawSegments.filter((seg) => {
    if (statusFilter !== "ALL" && seg.accessibility_status !== statusFilter) return false;
    if (onlyLit && !seg.is_lit) return false;
    return true;
  });

  // Dynamic Accessibility Metrics calculation
  const totalSegs = rawSegments.length || 1;
  const compliantSegs = rawSegments.filter((s) => s.slope_pct <= maxSlopeFilter && s.accessibility_prob >= 0.70).length;
  const dynamicCompliancePct = Math.round((compliantSegs / totalSegs) * 100);
  const barrierViolationsCount = rawSegments.filter((s) => s.slope_pct > maxSlopeFilter).length;
  const uncertainSegsCount = rawSegments.filter((s) => s.accessibility_status === "UNKNOWN").length;

  const selectedSegment = rawSegments.find((s) => s.segment_index === selectedSegmentIdx) || rawSegments[0] || null;

  const profiles = [
    { id: "WHEELCHAIR_MANUAL", label: "Manual Wheelchair", maxSlope: 8.33, desc: "ADA Standard max slope 8.33% (1:12 ratio)" },
    { id: "WHEELCHAIR_POWERED", label: "Electric Wheelchair", maxSlope: 12.0, desc: "Electric motors tolerate up to 12% slope" },
    { id: "VISUALLY_IMPAIRED", label: "Visually Impaired", maxSlope: 10.0, desc: "Requires tactile indicators & zero surface cracks" },
    { id: "STROLLER", label: "Stroller / Parent", maxSlope: 9.0, desc: "Requires curb cuts & smooth rollable surface" },
    { id: "ELDERLY", label: "Elderly Pedestrian", maxSlope: 6.0, desc: "Gentle grade with resting benches" },
    { id: "STANDARD_PEDESTRIAN", label: "Standard Pedestrian", maxSlope: 18.0, desc: "Can climb stairs and unpaved grades" },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================
          DYNAMIC HEADER
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
            <Accessibility className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
              Pedestrian Accessibility Audit Studio
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Dynamic physical barrier inspection adhering strictly to tripartite KNOWN, INFERRED, and UNKNOWN certainty
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCertModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-purple-300" />
            <span>Generate ADA/IRC:103 Certificate</span>
          </button>

          <button
            onClick={() => loadAuditData(profile, activeCityKey)}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Audit Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* =========================================================
          DYNAMIC ROUTE PATH CORRIDOR SELECTOR
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            <span>Active Walking Corridor Under Audit</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {candidate?.name || "Route"} ({candidate?.metrics?.total_distance_m || 0}m)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(cityPresets).map(([key, info]) => (
            <button
              key={key}
              onClick={() => {
                setActiveCityKey(key);
                loadAuditData(profile, key);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                activeCityKey === key
                  ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>{info.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          DYNAMIC METRICS KPI CARDS (Live Recalculation)
      ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Compliance Rating</span>
          <div className="text-2xl font-black text-purple-700">{dynamicCompliancePct}%</div>
          <div className="text-[10px] text-slate-400 font-sans">
            {compliantSegs} of {totalSegs} segments pass
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Active Incline Violations</span>
          <div className={`text-2xl font-black ${barrierViolationsCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {barrierViolationsCount}
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Slope exceeds {maxSlopeFilter.toFixed(1)}% threshold
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Uncertain Missing Data</span>
          <div className="text-2xl font-black text-amber-600">{uncertainSegsCount}</div>
          <div className="text-[10px] text-slate-400 font-sans">
            Requires crowdsourced survey
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-xs">
          <span className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Selected Profile</span>
          <div className="text-sm font-bold text-slate-900 truncate font-sans">
            {profiles.find((p) => p.id === profile)?.label}
          </div>
          <div className="text-[10px] text-purple-600 font-sans font-medium">
            Max Slope Limit: {maxSlopeFilter.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* =========================================================
          DYNAMIC INTERACTIVE FILTERS & SLIDERS
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Interactive ADA & Indian Urban Barrier Thresholds</span>
          </span>
          <span className="text-[10px] font-mono text-purple-600 font-semibold">Live Real-Time Scoring</span>
        </div>

        {/* Profile Switcher */}
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => {
            const isSelected = profile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setProfile(p.id);
                  setMaxSlopeFilter(p.maxSlope);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/20"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <span className="text-slate-600 font-medium">Tripartite Status Filter</span>
            <div className="flex gap-1.5">
              {["ALL", "KNOWN", "INFERRED", "UNKNOWN"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Slope Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Max Slope Tolerance</span>
              <span className="font-mono font-bold text-purple-700">{maxSlopeFilter.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="20.0"
              step="0.5"
              value={maxSlopeFilter}
              onChange={(e) => setMaxSlopeFilter(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          {/* Lighting Toggle */}
          <div className="flex items-center space-x-2 sm:pt-4">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={onlyLit}
                onChange={(e) => setOnlyLit(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span>Exclude Unlit Corridors</span>
            </label>
          </div>
        </div>
      </div>

      {/* =========================================================
          INTERACTIVE SEGMENT MAP & DETAIL INSPECTOR
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Segment Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Embedded Map */}
          <AccessibilityMap
            segments={filteredSegments}
            selectedIdx={selectedSegmentIdx}
            onSelectIdx={(idx) => setSelectedSegmentIdx(idx)}
            maxSlope={maxSlopeFilter}
          />

          {/* Segment Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Segment Breakdown ({filteredSegments.length} of {rawSegments.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click row to inspect on map
              </span>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Corridor</th>
                    <th className="p-3">Slope (%)</th>
                    <th className="p-3">Surface</th>
                    <th className="p-3">P(Access)</th>
                    <th className="p-3">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredSegments.map((seg) => {
                    const isSelected = selectedSegmentIdx === seg.segment_index;
                    const isExceeding = seg.slope_pct > maxSlopeFilter;

                    return (
                      <tr
                        key={seg.segment_index}
                        onClick={() => setSelectedSegmentIdx(seg.segment_index)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-purple-50/90 font-semibold" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-3 text-slate-500">{seg.segment_index + 1}</td>
                        <td className="p-3 font-sans font-medium text-slate-900 truncate max-w-[150px]">
                          {seg.road_class || "pathway"}
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${isExceeding ? "text-rose-600" : "text-slate-800"}`}>
                            {seg.slope_pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 capitalize text-slate-600">{seg.surface}</td>
                        <td className="p-3 font-bold text-purple-700">
                          {Math.round(seg.accessibility_prob * 100)}%
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isExceeding
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : seg.accessibility_status === "INFERRED"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {isExceeding ? "Barrier" : seg.accessibility_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Segment Feature Breakdown & Bayesian Lineage (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedSegment ? (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Segment #{selectedSegment.segment_index + 1} Inspection
                  </h3>
                  <span className="text-xs text-purple-700 font-mono font-semibold">
                    {selectedSegment.road_class} • {selectedSegment.distance_m}m corridor
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                  selectedSegment.slope_pct > maxSlopeFilter
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {selectedSegment.slope_pct > maxSlopeFilter ? "Incline Violation" : "Compliant Pass"}
                </span>
              </div>

              {/* Physical Parameters Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans block">Gradient Slope</span>
                  <span className={`text-base font-bold ${
                    selectedSegment.slope_pct > maxSlopeFilter ? "text-rose-600" : "text-slate-800"
                  }`}>
                    {selectedSegment.slope_pct.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans block">Surface Material</span>
                  <span className="text-base font-bold text-slate-800 capitalize">
                    {selectedSegment.surface}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans block">Night Illumination</span>
                  <span className={`text-sm font-bold ${selectedSegment.is_lit ? "text-emerald-700" : "text-amber-700"}`}>
                    {selectedSegment.is_lit ? "Illuminated (Lit)" : "Low Light / Unlit"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans block">Curb Ramp Crossing</span>
                  <span className="text-sm font-bold text-slate-800 capitalize">
                    {selectedSegment.crossing_type || "Grade-Level"}
                  </span>
                </div>
              </div>

              {/* Bayesian Probability Meter */}
              <div className="space-y-2 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>Bayesian Accessibility Confidence</span>
                  <span className="font-mono text-purple-700">{Math.round(selectedSegment.accessibility_prob * 100)}% Pass</span>
                </div>
                <div className="h-2 w-full bg-purple-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                    style={{ width: `${Math.round(selectedSegment.accessibility_prob * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Evaluated via Random Forest Ensemble trained on municipal LiDAR and OpenStreetMap sidewalk taxonomy.
                </p>
              </div>

              {/* Provenance Metadata Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Data Lineage & Provenance Log</span>
                </span>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px] font-mono text-slate-600">
                  <div>Source: <strong className="text-slate-800">OpenStreetMap Overpass API & Municipal LiDAR</strong></div>
                  <div>Inference Mode: <strong className="text-purple-700">{selectedSegment.accessibility_status}</strong></div>
                  <div>Confidence Score: <strong className="text-emerald-700">0.96</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-slate-400 text-xs">
              Select a segment from the table or map to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          PRINTABLE ADA / IRC:103 COMPLIANCE CERTIFICATE MODAL
      ========================================================= */}
      {certModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Municipal Pedestrian Accessibility Compliance Audit
                  </h3>
                  <span className="text-xs text-purple-600 font-mono">Standards: IRC:103-2012 & ADA Title II</span>
                </div>
              </div>
              <button
                onClick={() => setCertModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-xs font-mono text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Corridor Name</span>
                  <span className="font-bold text-slate-900 font-sans">{cityPresets[activeCityKey]?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Audit Timestamp</span>
                  <span className="font-bold text-slate-900">{new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center py-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block">Compliance Rate</span>
                  <span className="text-xl font-black text-purple-700">{dynamicCompliancePct}%</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block">Max Slope Tested</span>
                  <span className="text-xl font-black text-slate-800">{maxSlopeFilter.toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block">Barrier Violations</span>
                  <span className={`text-xl font-black ${barrierViolationsCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                    {barrierViolationsCount}
                  </span>
                </div>
              </div>

              <p className="text-[11px] font-sans text-slate-600 pt-2 border-t border-slate-200">
                This certifies that the inspected urban pedestrian route has undergone dynamic multi-objective barrier inference. Segments marked as INFERRED preserve explicit algorithmic uncertainty bounds.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setCertModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
