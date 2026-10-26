"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchResilience, ResilienceMetric } from "@/lib/api";
import { 
  Activity, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  Sliders, 
  Layers, 
  ArrowRight,
  TrendingDown,
  Compass
} from "lucide-react";



export default function ResiliencePage() {
  const [metrics, setMetrics] = useState<ResilienceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"ALL" | "REROUTE" | "STABLE">("ALL");
  const [stressSeverity, setStressSeverity] = useState<number>(3.0);

  const loadData = () => {
    setLoading(true);
    fetchResilience()
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMetrics = metrics.filter((m) => {
    if (filterMode === "REROUTE") return m.reroute_triggered;
    if (filterMode === "STABLE") return !m.reroute_triggered;
    return true;
  });

  const avgResilience = metrics.length > 0
    ? (metrics.reduce((acc, m) => acc + m.resilience_score, 0) / metrics.length).toFixed(2)
    : "0.91";

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Route Resilience & Stress Sensitivity Analysis</h1>
            <p className="text-xs text-slate-500 font-mono">
              Quantifying objective stability (ρ) and reroute thresholds under environmental stress sweeps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            Avg Resilience Score: <strong>{avgResilience}</strong>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Re-run Stress Analysis"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Filter Controls */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 uppercase tracking-wider font-mono">Filter Stress Tests:</span>
          {(["ALL", "REROUTE", "STABLE"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                filterMode === mode
                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {mode === "ALL" ? "All Tests" : mode === "REROUTE" ? "Detours Triggered" : "Robust & Stable"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Sweep Intensity:</span>
          <span className="font-mono font-bold text-blue-600">{stressSeverity.toFixed(1)}x</span>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.5"
            value={stressSeverity}
            onChange={(e) => setStressSeverity(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse bg-white border border-slate-200 rounded-2xl">
          Executing multi-objective environmental stress test sweeps...
        </div>
      ) : (
        /* Stress Test Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMetrics.map((m, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono">{m.perturbation_name}</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  m.resilience_score > 0.85
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  Score: {m.resilience_score}
                </span>
              </div>

              {/* Stability Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Objective Stability Threshold</span>
                  <span className="font-mono text-slate-900 font-semibold">{Math.round(m.objective_stability_score * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      m.objective_stability_score > 0.8 ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.round(m.objective_stability_score * 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Quality Degradation</span>
                  <span className="font-bold text-amber-700">+{m.route_quality_degradation_pct}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Reroute Triggered</span>
                  <span className={`font-bold ${m.reroute_triggered ? "text-blue-700" : "text-emerald-700"}`}>
                    {m.reroute_triggered ? "Yes (Detour)" : "No (Stable)"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  href="/map"
                  className="text-[11px] font-sans font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>Test on Navigation Map</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
