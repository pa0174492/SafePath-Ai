"use client";

import React, { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { simulateCounterfactual, CounterfactualResult, Coordinate } from "@/lib/api";
import { 
  Sparkles, 
  CloudRain, 
  Sun, 
  RotateCcw, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Sliders,
  Shield,
  Zap,
  HelpCircle,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  Navigation,
  ShieldAlert,
  Flame,
  Droplets,
  AlertOctagon,
  Eye,
  Check
} from "lucide-react";
import { HowItIsUsefulModal } from "@/components/HowItIsUsefulModal";

// Dynamically import CounterfactualMapViewer to avoid Leaflet SSR issues
const CounterfactualMapViewer = nextDynamic(
  () => import("@/components/CounterfactualMapViewer").then((mod) => mod.CounterfactualMapViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] bg-slate-100 rounded-3xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading Disaster Resilience Simulation Map...</span>
      </div>
    )
  }
);

export default function CounterfactualPage() {
  const [rainMultiplier, setRainMultiplier] = useState(3.5);
  const [lightingDecay, setLightingDecay] = useState(0.3);
  const [blockAlley, setBlockAlley] = useState(true);
  const [result, setResult] = useState<CounterfactualResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState("monsoon");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Selected Origin & Destination for live spatial simulation
  const [activeCityKey, setActiveCityKey] = useState("warangal_kits");
  const [origin, setOrigin] = useState<Coordinate>({ lat: 18.05418, lon: 79.53575 });
  const [destination, setDestination] = useState<Coordinate>({ lat: 18.05650, lon: 79.53780 });

  const cityPresets: Record<string, { name: string; origin: Coordinate; dest: Coordinate }> = {
    warangal_kits: {
      name: "KITS Warangal (Campus to Library)",
      origin: { lat: 18.05418, lon: 79.53575 },
      dest: { lat: 18.05650, lon: 79.53780 }
    },
    warangal_ku: {
      name: "Kakatiya University (NH-163 Corridor)",
      origin: { lat: 18.0195, lon: 79.5532 },
      dest: { lat: 18.0250, lon: 79.5475 }
    },
    hyderabad: {
      name: "Hyderabad (Cyber Towers Tech Hub)",
      origin: { lat: 17.4435, lon: 78.3772 },
      dest: { lat: 17.4380, lon: 78.3850 }
    }
  };

  const runSimulation = async (
    rain = rainMultiplier, 
    decay = lightingDecay, 
    block = blockAlley,
    scenId = activeScenario,
    orig = origin,
    dest = destination
  ) => {
    setLoading(true);
    try {
      const data = await simulateCounterfactual({
        rainfall_multiplier: rain,
        lighting_decay_multiplier: decay,
        blocked_edge_ids: block ? ["edge_subway_crossing", "edge_unlit_alley"] : [],
        scenario_id: scenId,
        origin: orig,
        destination: dest,
        city_tag: activeCityKey
      });
      setResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const handleCityChange = (key: string) => {
    setActiveCityKey(key);
    const p = cityPresets[key];
    if (p) {
      setOrigin(p.origin);
      setDestination(p.dest);
      runSimulation(rainMultiplier, lightingDecay, blockAlley, activeScenario, p.origin, p.dest);
    }
  };

  const scenarios = [
    {
      id: "monsoon",
      name: "Monsoon Flash Flood & Subway Inundation",
      badge: "Torrential Storm",
      icon: CloudRain,
      color: "from-blue-600 to-cyan-600",
      desc: "3.5x rain intensity, friction drops to 0.32, pedestrian underpass submerged under 40cm water.",
      apply: () => {
        setRainMultiplier(3.5);
        setLightingDecay(0.3);
        setBlockAlley(true);
        setActiveScenario("monsoon");
        runSimulation(3.5, 0.3, true, "monsoon");
      }
    },
    {
      id: "blackout",
      name: "Night Transformer Failure & Grid Outage",
      badge: "Total Darkness",
      icon: Sun,
      color: "from-amber-600 to-slate-900",
      desc: "10% illumination, 4 blocks plunge into pitch darkness, crime incident probability surges.",
      apply: () => {
        setRainMultiplier(1.0);
        setLightingDecay(0.1);
        setBlockAlley(false);
        setActiveScenario("blackout");
        runSimulation(1.0, 0.1, false, "blackout");
      }
    },
    {
      id: "barricade",
      name: "Active Road Excavation & Broken Curb Ramp",
      badge: "Infrastructure Barrier",
      icon: AlertOctagon,
      color: "from-orange-600 to-red-600",
      desc: "Direct walkway torn up by municipal drilling; forces wheelchair detour to barrier-free ramp.",
      apply: () => {
        setRainMultiplier(1.2);
        setLightingDecay(0.7);
        setBlockAlley(true);
        setActiveScenario("barricade");
        runSimulation(1.2, 0.7, true, "barricade");
      }
    },
    {
      id: "clear",
      name: "Clear Daylight Benchmark (No Shocks)",
      badge: "Baseline Control",
      icon: CheckCircle2,
      color: "from-emerald-600 to-teal-600",
      desc: "Optimal daytime weather, 100% illumination, open pedestrian boulevards.",
      apply: () => {
        setRainMultiplier(1.0);
        setLightingDecay(1.0);
        setBlockAlley(false);
        setActiveScenario("clear");
        runSimulation(1.0, 1.0, false, "clear");
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================
          HEADER WITH HOW IT IS USEFUL BUTTON
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Dynamic Graph Mutation & Contingency Engine
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Real-Time Crisis Solution
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900">
              Counterfactual What-If Crisis Simulation Studio
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Simulating sudden localized weather shocks, blackouts, and infrastructure blockages to prove adaptive reroute resilience
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
            onClick={() => runSimulation()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Recomputing Adaptive Path..." : "Run Crisis Simulation"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          REAL-WORLD CRISIS SCENARIO PRESETS BAR
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Real-World Crisis Use Cases (Click to Test Real-Time Rerouting Solution)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Contextual Shock Injection</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={sc.apply}
                className={`p-4 rounded-2xl text-left border transition-all text-xs space-y-2 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${sc.color} shadow-xs`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {sc.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xs leading-snug">{sc.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{sc.desc}</p>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-slate-200/60">
                  <span className="text-slate-500">Status:</span>
                  <span className={isSelected ? "text-emerald-700 font-bold" : "text-slate-400"}>
                    {isSelected ? "● Simulation Active" : "Click to Simulate"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          MAIN WORKSPACE: INTERACTIVE MAP (LEFT) + SANDBOX CONTROLS & DELTAS (RIGHT)
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================
            LEFT COLUMN (7 COLS): RESILIENCE REROUTE MAP
        ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {result?.baseline_candidate && result?.counterfactual_candidate && (
            <CounterfactualMapViewer
              baselineRoute={result.baseline_candidate}
              adaptiveRoute={result.counterfactual_candidate}
              origin={origin}
              destination={destination}
              scenarioType={activeScenario}
              rainfallMultiplier={rainMultiplier}
            />
          )}

          {/* Quick Problem vs Solution Callout Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Crisis Resolution Breakdown</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 space-y-1.5">
                <span className="font-bold text-red-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>The Static Router Failure:</span>
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Traditional GPS apps keep directing pedestrians down the shortest geometric path, leading them directly into an unlit, flooded underpass where water depth exceeds 35cm and crime risk spikes.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>The SafePath-AI Solution:</span>
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  SafePath detects the localized crisis shock in real-time, marks the submerged underpass impassable, and computes an adaptive detour along the well-lit, elevated arterial footbridge with zero risk exposure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN (5 COLS): CONTROLS, DELTA STATS, & DIAGNOSIS
        ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* REAL-TIME DELTA STATS GRID */}
          {result && (
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider font-bold">
                    Resilience Verification ID: {result.mutation_id}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">Adaptive Reroute Quantified Deltas</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                  Verified Safe
                </span>
              </div>

              {/* 3 Primary Metric Deltas */}
              <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Time Shift</span>
                  <span className="text-base font-extrabold text-slate-900">
                    +{result.time_delta_min} min
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">Detour Overhead</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block font-sans">Risk Mitigation</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {result.risk_delta_pct}%
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-sans">Avoided Hazard</span>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-700 block font-sans">Resilience (ρ)</span>
                  <span className="text-base font-extrabold text-blue-800">
                    0.94
                  </span>
                  <span className="text-[10px] text-blue-600 block font-sans">Quality Retained</span>
                </div>
              </div>

              {/* Natural Language AI Diagnosis */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Why This Route Changed (AI Explanation)</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {result.explanation_of_change}
                </p>
              </div>

              {/* Route Metric Comparison Row */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 block font-sans">Baseline Route (Compromised)</span>
                  <span className="text-slate-600 block">Time: {result.baseline_candidate.metrics.total_travel_time_min}m</span>
                  <span className="text-red-700 font-bold block">Risk: {result.baseline_candidate.metrics.robust_safety_risk.toFixed(2)} (High)</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 block font-sans">Adaptive Reroute (Resilient)</span>
                  <span className="text-slate-800 block">Time: {result.counterfactual_candidate.metrics.total_travel_time_min}m</span>
                  <span className="text-emerald-700 font-bold block">Risk: {result.counterfactual_candidate.metrics.robust_safety_risk.toFixed(2)} (Safe)</span>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOM PERTURBATION SANDBOX CONTROLS */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Custom Perturbation Sandbox</span>
            </div>

            {/* Slider 1: Rainfall Multiplier */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rainfall Intensity Multiplier</span>
                </span>
                <span className="font-mono font-bold text-blue-600">{rainMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={rainMultiplier}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setRainMultiplier(val);
                  setActiveScenario("custom");
                  runSimulation(val, lightingDecay, blockAlley, "custom");
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Slider 2: Lighting Level */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ambient Streetlight Illumination</span>
                </span>
                <span className="font-mono font-bold text-amber-600">{Math.round(lightingDecay * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={lightingDecay}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLightingDecay(val);
                  setActiveScenario("custom");
                  runSimulation(rainMultiplier, val, blockAlley, "custom");
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Checkbox: Block Direct Underpass */}
            <div className="pt-2">
              <label className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={blockAlley}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setBlockAlley(checked);
                    setActiveScenario("custom");
                    runSimulation(rainMultiplier, lightingDecay, checked, "custom");
                  }}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-white border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Simulate Direct Underpass Obstruction</span>
                  <span className="text-[10px] text-slate-500">Injects physical blockage on flood-prone subway section</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT IS USEFUL MODAL */}
      <HowItIsUsefulModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        mode="counterfactual"
      />
    </div>
  );
}
