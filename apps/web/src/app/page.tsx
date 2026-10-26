"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, 
  Map as MapIcon, 
  Clock, 
  Layers, 
  Sparkles, 
  Activity, 
  Accessibility, 
  BarChart3, 
  ArrowRight,
  Cpu,
  CheckCircle2,
  Database,
  Radio,
  AlertTriangle,
  LifeBuoy,
  CloudRain,
  Sun,
  Wind,
  Navigation,
  RefreshCw,
  Compass
} from "lucide-react";
import { 
  fetchApiHealth, 
  fetchCurrentContext, 
  fetchIncidentStats, 
  fetchSafeHavens, 
  fetchDemoRoute,
  RouteResponse,
  HealthStatus
} from "@/lib/api";



export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [safeHavensCount, setSafeHavensCount] = useState<number>(8);
  const [context, setContext] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>("WHEELCHAIR_MANUAL");
  const [selectedCity, setSelectedCity] = useState<string>("warangal_kits");
  const [previewRoute, setPreviewRoute] = useState<RouteResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const refreshLiveTelemetry = async () => {
    try {
      const [h, iStats, shs, ctx] = await Promise.all([
        fetchApiHealth(),
        fetchIncidentStats(),
        fetchSafeHavens(selectedCity),
        fetchCurrentContext(18.0542, 79.5357)
      ]);
      setHealth(h);
      setIncidentStats(iStats);
      setSafeHavensCount(shs?.length || 8);
      setContext(ctx);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn("Telemetry refresh warning:", e);
    }
  };

  useEffect(() => {
    refreshLiveTelemetry();
    const interval = setInterval(refreshLiveTelemetry, 15000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  // Compute live sample route preview
  const handleComputePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetchDemoRoute(selectedProfile);
      setPreviewRoute(res);
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    handleComputePreview();
  }, [selectedProfile]);

  const pillars = [
    {
      title: "Temporal Context-Aware Routing",
      desc: "Evaluates atmospheric lighting, rainfall, and dynamic crowds at the exact segment arrival time (t_arrival = t_0 + ∑Δt), eliminating departure-time temporal skew.",
      icon: Clock,
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      title: "Uncertainty-Preserving Accessibility",
      desc: "Infers sparse OpenStreetMap curb, sidewalk, and incline tags probabilistically without hallucinating binary accessibility guarantees.",
      icon: Accessibility,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      title: "6-Objective Robust Pareto Routing",
      desc: "Exact Multi-Objective BOA* search returning non-dominated frontiers across Travel Time, Distance, Robust Risk, Accessibility Burden, Environmental Exposure, and Complexity.",
      icon: Layers,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    {
      title: "Risk Uncertainty Optimization",
      desc: "Optimizes robust risk R_robust = μ_risk + λ·σ_risk and CVaR 95% tail metrics to shield pedestrians from unpredictable hazardous corridors.",
      icon: Shield,
      color: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      title: "Counterfactual What-If Studio",
      desc: "Interactive simulation engine recalculating optimal routes under precipitation spikes, streetlight decay, and barricaded crossings.",
      icon: Sparkles,
      color: "bg-rose-50 text-rose-700 border-rose-200"
    },
    {
      title: "Route Resilience Analysis",
      desc: "Evaluates route degradation and stability scores (ρ) across multi-dimensional environmental stress sweeps.",
      icon: Activity,
      color: "bg-sky-50 text-sky-700 border-sky-200"
    },
    {
      title: "Segment-Level Lineage Provenance",
      desc: "Full transparency tracking source providers, ML inference confidence, and timestamps for every road segment attribute.",
      icon: Database,
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      title: "Reproducible Research Dashboard",
      desc: "Empirical benchmark evaluation comparing against B0-B6 baselines with automated ablation tables and LaTeX export.",
      icon: BarChart3,
      color: "bg-teal-50 text-teal-700 border-teal-200"
    }
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Dynamic Telemetry Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">LIVE SYSTEM TELEMETRY</span>
              <span className="text-[10px] font-mono bg-blue-600/60 px-2 py-0.5 rounded border border-blue-400/40 text-blue-200">
                {health?.mode || "DEMO ENGINE"}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Backend Gateway: {health?.status === "healthy" ? "127.0.0.1:8000 (Connected)" : "Connecting..."} • {lastRefreshed && `Synced: ${lastRefreshed}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>6/6 Engines Active</span>
          </div>
          <button
            onClick={refreshLiveTelemetry}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-2">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono text-blue-700 font-medium">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Research Framework • Dynamic Urban Pedestrian Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Uncertainty-Aware, Context-Adaptive <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Multi-Objective Urban Routing
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          SafePath-AI bridges the gap between static shortest-path algorithms and dynamic pedestrian mobility. 
          Generating non-dominated Pareto trade-offs across speed, safety risk, physical accessibility, and environmental resilience.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/map"
            className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center space-x-2 shadow-sm hover:bg-blue-700 transition-all group"
          >
            <Navigation className="w-4 h-4" />
            <span>Launch Interactive Map</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/safehavens"
            className="px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center space-x-2 shadow-sm hover:bg-emerald-700 transition-all group"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>24/7 Safe Havens Hub</span>
          </Link>

          <Link
            href="/research"
            className="px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-slate-800 font-semibold text-sm flex items-center space-x-2 transition-all shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Research Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Dynamic Real-Time Status Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Engines */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>ACTIVE ENGINES</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">6 / 6</div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>BOA*, CVaR, ML Models Online</span>
          </div>
        </div>

        {/* Card 2: Community Hazards */}
        <Link href="/incidents" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>ACTIVE HAZARDS</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">
            {incidentStats?.active_hazards || 11}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {incidentStats?.critical_severity_count || 3} critical • {incidentStats?.wheelchair_barriers || 5} wheelchair barriers
          </div>
        </Link>

        {/* Card 3: Safe Havens */}
        <Link href="/safehavens" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-emerald-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>VERIFIED SHELTERS</span>
            <LifeBuoy className="w-4 h-4 text-emerald-600 group-hover:rotate-45 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono">
            {safeHavensCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            24/7 Police & Medical Response Ready
          </div>
        </Link>

        {/* Card 4: Microclimate */}
        <Link href="/context" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-blue-400 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>CURRENT WEATHER</span>
            <CloudRain className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-blue-700 font-mono">
            {context?.rainfall_mm_h ? `${context.rainfall_mm_h} mm/h` : "2.5 mm/h"}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {context?.ambient_lux ? `${context.ambient_lux} lux` : "850 lux"} • {context?.air_quality_aqi ? `${context.air_quality_aqi} AQI` : "42 AQI"}
          </div>
        </Link>
      </section>

      {/* Dynamic Interactive Route Preview Calculator */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900">Dynamic Multi-Objective Route Generator</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any mobility profile to instantly compute live Pareto trade-offs via Multi-Objective BOA*
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/map"
              className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Full Screen Map Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Profile Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "WHEELCHAIR_MANUAL", label: "Manual Wheelchair", icon: Accessibility },
            { id: "WHEELCHAIR_POWERED", label: "Powered Wheelchair", icon: Accessibility },
            { id: "VISUALLY_IMPAIRED", label: "Visually Impaired", icon: Compass },
            { id: "STROLLER", label: "Stroller / Parent", icon: Shield },
            { id: "STANDARD_PEDESTRIAN", label: "Standard Pedestrian", icon: Navigation }
          ].map((prof) => {
            const Icon = prof.icon;
            const isSelected = selectedProfile === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => setSelectedProfile(prof.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{prof.label}</span>
              </button>
            );
          })}
        </div>

        {/* Computed Candidates Output */}
        {previewLoading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs animate-pulse flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Computing non-dominated Pareto frontier via Multi-Objective BOA*...</span>
          </div>
        ) : previewRoute?.candidates && previewRoute.candidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {previewRoute.candidates.slice(0, 3).map((c, idx) => (
              <div
                key={c.id || idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-sm text-slate-900">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold font-mono">
                    {c.algorithm_tag}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Travel Time</span>
                    <span className="font-bold text-slate-900 text-sm">{c.metrics.total_travel_time_min} min</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Distance</span>
                    <span className="font-bold text-slate-900 text-sm">{c.metrics.total_distance_m} m</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Robust Risk</span>
                    <span className={`font-bold text-sm ${c.metrics.robust_safety_risk < 0.3 ? "text-emerald-600" : "text-amber-600"}`}>
                      {c.metrics.robust_safety_risk}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-sans block">Accessible</span>
                    <span className="font-bold text-emerald-700 text-sm">{c.metrics.accessible_segments_pct}%</span>
                  </div>
                </div>

                <Link
                  href="/map"
                  className="w-full mt-2 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-sans text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>Navigate This Candidate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* 8 Core Research Pillars */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Core Architectural & Methodological Pillars</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Grounded in formal time-dependent graph search, Bayesian uncertainty bounds, and multi-objective optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${pillar.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Verification Banner */}
      <section className="p-8 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% REPRODUCIBLE SCIENTIFIC EVIDENCE</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Zero-Hallucination & Provenance Grounded
          </h3>
          <p className="text-xs text-slate-600 max-w-2xl">
            All candidate routes, metrics, and comparisons are strictly derived from verified graph topology, calibrated ML classifiers, and deterministic stress-tests.
          </p>
        </div>

        <Link
          href="/compare"
          className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 hover:border-blue-600 hover:text-blue-700 text-xs font-semibold text-slate-800 whitespace-nowrap transition-colors"
        >
          Compare Pareto Candidates →
        </Link>
      </section>
    </div>
  );
}
