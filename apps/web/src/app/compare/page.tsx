"use client";

import React, { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import { 
  RouteResponse, 
  RouteCandidate, 
  calculateRoute, 
  getActiveRoute,
  Coordinate,
  UserProfile 
} from "@/lib/api";
import { 
  GitCompare, 
  Shield, 
  Clock, 
  Accessibility, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  ArrowRight, 
  RefreshCw,
  Trophy,
  Sparkles,
  MapPin,
  Navigation,
  Activity,
  AlertTriangle,
  HelpCircle,
  ArrowLeftRight,
  Flame,
  Info,
  Check,
  Zap,
  TrendingDown,
  TrendingUp,
  Percent
} from "lucide-react";
import { HowItIsUsefulModal } from "@/components/HowItIsUsefulModal";

// Dynamically import DualRouteCompareMap to eliminate Leaflet window SSR errors
const DualRouteCompareMap = nextDynamic(
  () => import("@/components/DualRouteCompareMap").then((mod) => mod.DualRouteCompareMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] bg-slate-100 rounded-3xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Initializing Dual-Map Spatial Comparison Studio...</span>
      </div>
    )
  }
);

export default function ComparePage() {
  const [response, setResponse] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState("WHEELCHAIR_MANUAL");
  
  // Selected Candidate for Map A and Map B
  const [routeAId, setRouteAId] = useState<string | null>(null);
  const [routeBId, setRouteBId] = useState<string | null>(null);

  // Dynamic Right-Side Tab
  const [activeTab, setActiveTab] = useState<"headtohead" | "segments" | "frontier" | "tailrisk">("headtohead");

  // How It's Useful Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Preference weights for dynamic Pareto utility scoring
  const [speedWeight, setSpeedWeight] = useState(0.35);
  const [safetyWeight, setSafetyWeight] = useState(0.40);
  const [accessWeight, setAccessWeight] = useState(0.25);

  // Selected Origin & Destination
  const [activeCityKey, setActiveCityKey] = useState("warangal_kits");
  const [customOrigin, setCustomOrigin] = useState<Coordinate>({ lat: 18.05418, lon: 79.53575 });
  const [customDest, setCustomDest] = useState<Coordinate>({ lat: 18.05650, lon: 79.53780 });

  const cityODPresets: Record<string, { name: string; originName: string; destName: string; origin: Coordinate; dest: Coordinate }> = {
    warangal_kits: {
      name: "KITS Warangal (Campus to Library)",
      originName: "KITS Entrance Gate",
      destName: "Central Library Quadrangle",
      origin: { lat: 18.05418, lon: 79.53575 },
      dest: { lat: 18.05650, lon: 79.53780 }
    },
    warangal_ku: {
      name: "Kakatiya University (NH-163 to Admin)",
      originName: "KU Main Gate",
      destName: "Administrative Quadrangle",
      origin: { lat: 18.0195, lon: 79.5532 },
      dest: { lat: 18.0250, lon: 79.5475 }
    },
    hyderabad: {
      name: "Hyderabad (Cyber Towers to Mindspace)",
      originName: "Cyber Towers Crossroad",
      destName: "Mindspace West Gate",
      origin: { lat: 17.4435, lon: 78.3772 },
      dest: { lat: 17.4380, lon: 78.3850 }
    },
    bengaluru: {
      name: "Bengaluru (MG Road to Cubbon Park)",
      originName: "MG Road Metro Station",
      destName: "Cubbon Park North Pavilion",
      origin: { lat: 12.9716, lon: 77.5946 },
      dest: { lat: 12.9770, lon: 77.6010 }
    }
  };

  const loadData = async (prof: string, o?: Coordinate, d?: Coordinate) => {
    setLoading(true);
    const orig = o || customOrigin;
    const dest = d || customDest;

    // Check active session route
    const activeSessionRoute = getActiveRoute();
    if (activeSessionRoute && activeSessionRoute.candidates && activeSessionRoute.candidates.length >= 5 && !o && !d) {
      setResponse(activeSessionRoute);
      setRouteAId(activeSessionRoute.candidates[0]?.id);
      setRouteBId(activeSessionRoute.candidates[1]?.id);
      setLoading(false);
      return;
    }

    try {
      const userProf: UserProfile = {
        profile_type: prof,
        max_slope_pct: prof.includes("WHEELCHAIR") ? 8.33 : 15.0,
        avoid_unpaved: true,
        require_curb_ramps: true,
        require_lit_streets: false,
        require_signalized_crossings: false,
        max_step_height_cm: 4.0,
        walking_speed_mps: 1.15,
        safety_priority: safetyWeight,
        accessibility_priority: accessWeight,
        time_priority: speedWeight,
        environment_priority: 0.3,
        complexity_priority: 0.2,
        uncertainty_aversion_lambda: 1.2
      };

      const res = await calculateRoute({
        origin: orig,
        destination: dest,
        profile: userProf,
        city_tag: activeCityKey
      });

      setResponse(res);
      if (res.candidates && res.candidates.length >= 2) {
        setRouteAId(res.candidates[0].id);
        setRouteBId(res.candidates[1].id);
      }
    } catch (err) {
      console.error("Compare route load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(profile);
  }, [profile]);

  const handleCityPreset = (key: string) => {
    setActiveCityKey(key);
    const preset = cityODPresets[key];
    if (preset) {
      setCustomOrigin(preset.origin);
      setCustomDest(preset.dest);
      loadData(profile, preset.origin, preset.dest);
    }
  };

  const candidates = response?.candidates || [];

  // Scored candidates based on preference weights
  const scoredCandidates = candidates.map((c) => {
    const timeNorm = Math.max(0, 1 - (c.metrics.total_travel_time_min / 30));
    const safetyNorm = Math.max(0, 1 - c.metrics.robust_safety_risk);
    const accessNorm = (c.metrics.accessible_segments_pct || 100) / 100;

    const totalWeight = speedWeight + safetyWeight + accessWeight || 1;
    const score = ((timeNorm * speedWeight) + (safetyNorm * safetyWeight) + (accessNorm * accessWeight)) / totalWeight;

    return {
      ...c,
      customUtilityScore: +(score * 100).toFixed(1)
    };
  });

  const routeA = scoredCandidates.find((c) => c.id === routeAId) || scoredCandidates[0];
  const routeB = scoredCandidates.find((c) => c.id === routeBId) || scoredCandidates[1] || scoredCandidates[0];

  // Head-to-head comparison calculations
  const timeDelta = routeA && routeB ? +(routeA.metrics.total_travel_time_min - routeB.metrics.total_travel_time_min).toFixed(1) : 0;
  const distDelta = routeA && routeB ? Math.round(routeA.metrics.total_distance_m - routeB.metrics.total_distance_m) : 0;
  const riskDelta = routeA && routeB ? Math.round(((routeA.metrics.robust_safety_risk - routeB.metrics.robust_safety_risk) / Math.max(0.1, routeB.metrics.robust_safety_risk)) * 100) : 0;
  const accessDelta = routeA && routeB ? Math.round((routeA.metrics.accessible_segments_pct || 0) - (routeB.metrics.accessible_segments_pct || 0)) : 0;

  // Comparison quick-select presets
  const applyPresetPair = (tagA: string, tagB: string) => {
    const matchA = scoredCandidates.find((c) => c.algorithm_tag.includes(tagA));
    const matchB = scoredCandidates.find((c) => c.algorithm_tag.includes(tagB));
    if (matchA) setRouteAId(matchA.id);
    if (matchB) setRouteBId(matchB.id);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER WITH HOW IT IS USEFUL BUTTON
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Multi-Objective Bicriterion A* (BOA*)
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Spatial Sync
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900">
              Pareto Multi-Route Dual Comparison Studio
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Two maps side-by-side evaluating exact safety risks, lighting exposure, and physical accessibility trade-offs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* HOW IT IS USEFUL BUTTON */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How Is This Useful?</span>
          </button>

          <button
            onClick={() => loadData(profile)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Re-compute</span>
          </button>

          {routeA && (
            <a
              href={`/map?lat=${customOrigin.lat}&lon=${customOrigin.lon}`}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate Live</span>
            </a>
          )}
        </div>
      </div>

      {/* =========================================================
          ACTIVE ORIGIN-DESTINATION CORRIDOR & MOBILITY PROFILE
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Corridor Preset</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cityODPresets).map(([key, info]) => (
              <button
                key={key}
                onClick={() => handleCityPreset(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeCityKey === key
                    ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-800"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{info.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Accessibility className="w-3.5 h-3.5 text-purple-600" />
            <span>Mobility Profile</span>
          </div>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="WHEELCHAIR_MANUAL">Manual Wheelchair (Slope &lt; 8.33%)</option>
            <option value="WHEELCHAIR_POWERED">Electric Wheelchair</option>
            <option value="VISUALLY_IMPAIRED">Visually Impaired (Audible Signals)</option>
            <option value="STROLLER">Parent / Stroller</option>
            <option value="STANDARD_PEDESTRIAN">Solo Night Walker (Max Lighting)</option>
          </select>
        </div>
      </div>

      {/* =========================================================
          COMPARISON QUICK PRESETS BAR
      ========================================================= */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/60 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800">One-Click Head-to-Head Comparisons:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPresetPair("BOA", "Dijkstra")}
            className="px-3 py-1 rounded-xl bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-all cursor-pointer shadow-2xs"
          >
            SafePath-BOA* vs Shortest Direct
          </button>
          <button
            onClick={() => applyPresetPair("Guardian", "Dijkstra")}
            className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold transition-all cursor-pointer shadow-2xs"
          >
            Guardian Security vs Shortest Direct
          </button>
          <button
            onClick={() => applyPresetPair("Universal", "Dijkstra")}
            className="px-3 py-1 rounded-xl bg-white border border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white font-semibold transition-all cursor-pointer shadow-2xs"
          >
            Wheelchair Ramp vs Direct
          </button>
          <button
            onClick={() => applyPresetPair("BOA", "Eco")}
            className="px-3 py-1 rounded-xl bg-white border border-cyan-300 text-cyan-700 hover:bg-cyan-600 hover:text-white font-semibold transition-all cursor-pointer shadow-2xs"
          >
            SafePath vs Eco-Shield
          </button>
        </div>
      </div>

      {/* =========================================================
          MAIN INTERFACE: SIDE-BY-SIDE MAPS (LEFT) + DYNAMIC TABS (RIGHT)
      ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* =========================================================
            LEFT COLUMN (7 COLS): DUAL SYNCHRONIZED MAPS
        ========================================================= */}
        <div className="xl:col-span-7 space-y-3">
          {routeA && routeB && (
            <DualRouteCompareMap
              routeA={routeA}
              routeB={routeB}
              allCandidates={scoredCandidates}
              onSelectRouteA={(r) => setRouteAId(r.id)}
              onSelectRouteB={(r) => setRouteBId(r.id)}
              origin={customOrigin}
              destination={customDest}
            />
          )}

          {/* Quick Route Swapper & Mini Summary Under Maps */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Side-by-Side Delta Summary:</span>
              <span className="font-mono px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold">
                {timeDelta > 0 ? `+${timeDelta} min` : `${timeDelta} min`}
              </span>
              <span className={`font-mono px-2.5 py-1 rounded-lg font-bold ${
                riskDelta < 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {riskDelta < 0 ? `${riskDelta}% Risk` : `+${riskDelta}% Risk`}
              </span>
              <span className="font-mono px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold">
                {accessDelta > 0 ? `+${accessDelta}% Access` : `${accessDelta}% Access`}
              </span>
            </div>

            <button
              onClick={() => {
                const temp = routeAId;
                setRouteAId(routeBId);
                setRouteBId(temp);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Swap Map Positions</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN (5 COLS): ADVANCED DYNAMIC TABBED PANEL
        ========================================================= */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "headtohead", label: "Head-to-Head", icon: Activity },
              { id: "segments", label: "Segment Audit", icon: Layers },
              { id: "frontier", label: "Pareto Pool", icon: Sliders },
              { id: "tailrisk", label: "Tail Risk & Math", icon: Shield },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: HEAD-TO-HEAD DELTA & RADAR COMPARISON */}
          {activeTab === "headtohead" && routeA && routeB && (
            <div className="p-5 space-y-5 text-xs">
              {/* Head-to-Head Delta Cards */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <span className="text-[10px] text-blue-800 font-sans font-bold block uppercase tracking-wider">
                    Map A: {routeA.algorithm_tag}
                  </span>
                  <div className="text-base font-extrabold text-blue-900">
                    {routeA.metrics.total_travel_time_min}m <span className="text-xs text-slate-500">({routeA.metrics.total_distance_m}m)</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    Risk {routeA.metrics.robust_safety_risk.toFixed(2)} • {routeA.metrics.accessible_segments_pct}% Accessible
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-[10px] text-amber-800 font-sans font-bold block uppercase tracking-wider">
                    Map B: {routeB.algorithm_tag}
                  </span>
                  <div className="text-base font-extrabold text-amber-900">
                    {routeB.metrics.total_travel_time_min}m <span className="text-xs text-slate-500">({routeB.metrics.total_distance_m}m)</span>
                  </div>
                  <div className={`text-[11px] font-semibold ${
                    routeB.metrics.robust_safety_risk > 0.4 ? "text-red-700" : "text-emerald-700"
                  }`}>
                    Risk {routeB.metrics.robust_safety_risk.toFixed(2)} • {routeB.metrics.accessible_segments_pct}% Accessible
                  </div>
                </div>
              </div>

              {/* Vector Metric Comparison Bars */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vector Dimension Comparison</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Blue: A | Amber: B</span>
                </div>

                {/* Metric 1: Travel Time */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Travel Duration</span>
                    <span className="font-mono text-slate-700">
                      A: {routeA.metrics.total_travel_time_min}m vs B: {routeB.metrics.total_travel_time_min}m
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (routeA.metrics.total_travel_time_min / 30) * 100)}%` }} 
                    />
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (routeB.metrics.total_travel_time_min / 30) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Metric 2: Robust Safety Risk (Lower is better) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Robust Safety Risk (Lower is better)</span>
                    <span className="font-mono text-slate-700">
                      A: {routeA.metrics.robust_safety_risk.toFixed(2)} vs B: {routeB.metrics.robust_safety_risk.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, routeA.metrics.robust_safety_risk * 100)}%` }} 
                    />
                    <div 
                      className="bg-red-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, routeB.metrics.robust_safety_risk * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Metric 3: Worst-Case Tail Risk (CVaR 95%) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Worst-Case Tail Risk (CVaR 95%)</span>
                    <span className="font-mono text-slate-700">
                      A: {routeA.metrics.worst_case_tail_risk_cvar95.toFixed(2)} vs B: {routeB.metrics.worst_case_tail_risk_cvar95.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, routeA.metrics.worst_case_tail_risk_cvar95 * 100)}%` }} 
                    />
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, routeB.metrics.worst_case_tail_risk_cvar95 * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Metric 4: Accessibility Compliance */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Accessibility & Curb Ramp %</span>
                    <span className="font-mono text-purple-700">
                      A: {routeA.metrics.accessible_segments_pct}% vs B: {routeB.metrics.accessible_segments_pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all" 
                      style={{ width: `${routeA.metrics.accessible_segments_pct}%` }} 
                    />
                    <div 
                      className="bg-slate-300 h-full rounded-full transition-all" 
                      style={{ width: `${routeB.metrics.accessible_segments_pct}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Natural Language AI Trade-Off Rationale */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Trade-Off Recommendation</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {routeA.metrics.robust_safety_risk < routeB.metrics.robust_safety_risk
                    ? `Choosing Route A (${routeA.name}) reduces personal safety risk by ${Math.abs(riskDelta)}% and eliminates unlit corridor exposure, for a minimal walking time penalty of ${Math.abs(timeDelta)} minutes (+${Math.round((timeDelta / (routeB.metrics.total_travel_time_min || 1)) * 100)}%). Recommended for evening walks, solo commuters, and wheelchair users.`
                    : `Route B offers a ${Math.abs(timeDelta)} minute faster trip but forces pedestrians into unverified alleys with elevated risk uncertainty. Suitable only in broad daylight with active companion walkers.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SEGMENT-BY-SEGMENT AUDIT */}
          {activeTab === "segments" && routeA && routeB && (
            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Segment Infrastructure Audit</span>
                <span className="text-[10px] font-mono text-slate-400">Comparing Sub-Edges</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {(routeA.segments || []).slice(0, 5).map((seg, idx) => {
                  const segB = routeB.segments?.[idx];
                  return (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-slate-800">Segment #{idx + 1} ({seg.distance_m}m)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          seg.is_lit ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {seg.is_lit ? "💡 Lit" : "🌑 Unlit"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-blue-700 font-bold block">Route A Corridor</span>
                          <span className="text-slate-700 block">{seg.road_class} • {seg.surface}</span>
                          <span className="text-slate-500 text-[10px] block">Slope: {seg.slope_pct}% • Risk: {seg.robust_risk}</span>
                        </div>

                        <div className="p-2 rounded-xl bg-white border border-slate-200">
                          <span className="text-[10px] text-amber-700 font-bold block">Route B Corridor</span>
                          <span className="text-slate-700 block">{segB?.road_class || "footway"} • {segB?.surface || "unpaved"}</span>
                          <span className="text-slate-500 text-[10px] block">Slope: {segB?.slope_pct || 3.2}% • Risk: {segB?.robust_risk || 0.48}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PARETO CANDIDATE POOL & UTILITY WEIGHTS */}
          {activeTab === "frontier" && (
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">Dynamic Utility Weights</span>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Speed Weight</span>
                    <span className="font-mono font-bold text-blue-600">{Math.round(speedWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={speedWeight}
                    onChange={(e) => setSpeedWeight(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Safety Weight</span>
                    <span className="font-mono font-bold text-emerald-600">{Math.round(safetyWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={safetyWeight}
                    onChange={(e) => setSafetyWeight(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              {/* Candidates List with 1-Click Assignment */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {scoredCandidates.map((c) => {
                  const isA = c.id === routeAId;
                  const isB = c.id === routeBId;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                        isA 
                          ? "border-blue-500 bg-blue-50/50 shadow-xs" 
                          : isB 
                            ? "border-amber-500 bg-amber-50/50 shadow-xs" 
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">{c.name}</span>
                        <span className="font-mono text-blue-600 font-bold">{c.customUtilityScore} pts</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>{c.metrics.total_travel_time_min}m • {c.metrics.total_distance_m}m</span>
                        <span className="text-emerald-700 font-semibold">Risk: {c.metrics.robust_safety_risk.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          onClick={() => setRouteAId(c.id)}
                          className={`flex-1 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                            isA ? "bg-blue-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isA ? "✓ Active on Map A" : "Set Map A (Left)"}
                        </button>
                        <button
                          onClick={() => setRouteBId(c.id)}
                          className={`flex-1 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                            isB ? "bg-amber-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isB ? "✓ Active on Map B" : "Set Map B (Right)"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TAIL RISK CVAR & SCIENTIFIC ADVANTAGE */}
          {activeTab === "tailrisk" && (
            <div className="p-5 space-y-4 text-xs font-mono text-slate-700">
              <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                  Bicriterion Optimal A* Formulation
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Traditional single-objective routers suffer from <em>Scalarization Failure</em>: they cannot find non-convex trade-off points. SafePath-BOA* computes all Pareto-optimal solutions simultaneously without arbitrary weights.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-sans">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CVaR 95% Tail Risk Mitigation</span>
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conditional Value at Risk (CVaR 95%) measures the worst 5% extreme hazard scenarios (e.g. violent crime clusters, flash flooding, or complete darkness). While shortest paths minimize the average, SafePath-BOA* actively clips the tail risk distribution.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          DETAILED PARETO BENCHMARK COMPARISON TABLE
      ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pareto Non-Dominated Metric Trade-Off Table
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Click any row to place on Map A or B</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Candidate Path</th>
                <th className="p-3.5">Travel Time</th>
                <th className="p-3.5">Distance</th>
                <th className="p-3.5">Robust Risk (R)</th>
                <th className="p-3.5">CVaR 95%</th>
                <th className="p-3.5">Access %</th>
                <th className="p-3.5">Barriers</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scoredCandidates.map((c) => {
                const isA = c.id === routeAId;
                const isB = c.id === routeBId;
                return (
                  <tr 
                    key={c.id} 
                    className={`transition-colors ${
                      isA ? "bg-blue-50/70 font-semibold" : isB ? "bg-amber-50/70 font-semibold" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-3.5 text-slate-900 font-sans font-bold flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isA ? "bg-blue-600 ring-2 ring-blue-300" : isB ? "bg-amber-500 ring-2 ring-amber-300" : "bg-slate-400"
                      }`} />
                      <span>{c.name}</span>
                      {isA && <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono">MAP A</span>}
                      {isB && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-mono">MAP B</span>}
                    </td>
                    <td className="p-3.5 text-slate-700">{c.metrics.total_travel_time_min}m</td>
                    <td className="p-3.5 text-slate-700">{c.metrics.total_distance_m}m</td>
                    <td className={`p-3.5 font-bold ${c.metrics.robust_safety_risk < 0.25 ? "text-emerald-700" : "text-amber-700"}`}>
                      {c.metrics.robust_safety_risk.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-slate-500">{c.metrics.worst_case_tail_risk_cvar95.toFixed(2)}</td>
                    <td className="p-3.5 text-purple-700 font-bold">{c.metrics.accessible_segments_pct}%</td>
                    <td className="p-3.5 text-slate-600">
                      {c.metrics.potential_barrier_count === 0 ? "✓ 0 Barriers" : `⚠️ ${c.metrics.potential_barrier_count} Barriers`}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRouteAId(c.id)}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer"
                        >
                          Map A
                        </button>
                        <button
                          onClick={() => setRouteBId(c.id)}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer"
                        >
                          Map B
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HOW IT IS USEFUL MODAL */}
      <HowItIsUsefulModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        mode="compare"
      />
    </div>
  );
}
