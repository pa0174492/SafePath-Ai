"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Cpu,
  Database,
  Calculator,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  Code,
  Copy,
  ExternalLink,
  Download,
  BookOpen,
  Sparkles,
  Server,
  Terminal,
  ChevronRight,
  Zap,
  Eye,
  Sliders,
  MapPin,
  Check,
  FileText
} from "lucide-react";

export default function TechnicalDocsPage() {
  const [activeTab, setActiveTab] = useState<"workflow" | "techstack" | "data" | "algorithms" | "api">("workflow");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [sliderSlope, setSliderSlope] = useState<number>(4.0);
  const [selectedSchema, setSelectedSchema] = useState<string>("RouteCandidate");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  // Tobler's hiking speed computation
  const baseSpeed = 1.2; // m/s
  const slopeDecimal = sliderSlope / 100.0;
  const speedDecay = Math.max(0.3, baseSpeed * Math.exp(-3.0 * Math.max(0.0, slopeDecimal - 0.02)));
  const speedKmh = (speedDecay * 3.6).toFixed(1);

  const techStackData = [
    {
      category: "Frontend Application Tier",
      items: [
        { name: "Next.js 14", version: "14.2.5", role: "App Router Full-Stack Framework", rationale: "Server-side rendering, zero-config route handling, fast page transitions, and optimized Webpack/SWC bundling." },
        { name: "React 18", version: "18.3.1", role: "Declarative Component Engine", rationale: "Concurrent state management, responsive DOM reconciliation, and seamless Leaflet map synchronization." },
        { name: "TypeScript", version: "5.5.4", role: "Static Type Verification", rationale: "Guarantees end-to-end data contract integrity between FastAPI Pydantic models and frontend state." },
        { name: "Leaflet", version: "1.9.4", role: "Interactive Client-Side Mapping", rationale: "Ultra-fast zero-API-key client mapping engine for multi-route GeoJSON polylines and custom SVG pulse beacons." },
        { name: "Tailwind CSS", version: "3.4.7", role: "Design System & Utility Styling", rationale: "Engineered responsive glassmorphism aesthetic, accessible contrast tokens, and cohesive color palette." },
        { name: "Recharts", version: "2.12.7", role: "Scientific Data Visualization", rationale: "Renders multi-objective Pareto trade-off scatter matrices, hypervolume radars, and elevation profiles." }
      ]
    },
    {
      category: "Backend Gateway & Optimization Tier",
      items: [
        { name: "Python", version: "3.12.4", role: "Primary Computational Runtime", rationale: "High-performance scientific computing runtime with native asyncio and modern type hinting." },
        { name: "FastAPI", version: "0.111.0", role: "Asynchronous ASGI API Gateway", rationale: "Blazing fast throughput, native OpenAPI/Swagger generation, and automated Pydantic serialization." },
        { name: "Pydantic", version: "v2 (2.13)", role: "Data Validation & Schema Engine", rationale: "Strict JSON parsing, runtime type safety, and automatic REST serialization of 6-objective vector models." },
        { name: "NetworkX", version: "3.3.0", role: "Geospatial Graph Topology", rationale: "Topologically indexed multi-graph models, fast neighbor expansions, and bidirectional street networks." },
        { name: "NumPy & SciPy", version: "1.26.4 / 1.13.1", role: "Vectorized Math & Statistical Distributions", rationale: "Vectorized 6D cost evaluations, Gaussian distribution integrals, and CVaR 95% tail-risk derivations." },
        { name: "Scikit-Learn", version: "1.5.1", role: "Calibrated Epistemic ML Classifiers", rationale: "Supervised inference of missing sidewalk attributes with Expected Calibration Error (ECE) and Brier scores." },
        { name: "Uvicorn", version: "0.30.1", role: "Production ASGI Server", rationale: "Asynchronous HTTP/1.1 and WebSocket networking handling high concurrent simulation requests." }
      ]
    },
    {
      category: "Geospatial & Dynamic Telemetry Providers",
      items: [
        { name: "OSRM Foot API", version: "v5.24", role: "Global Pedestrian Network Engine", rationale: "Free, open-source worldwide road network solver used to fetch real walkable geometries without API keys." },
        { name: "Open-Meteo", version: "v1 REST", role: "Live Meteorological Stream", rationale: "Provides real-time precipitation rate (mm/h), ambient temperature, humidity, and cloud cover without keys." },
        { name: "CartoDB Positron", version: "Tiles", role: "High-Legibility Basemap", rationale: "Minimalist cartographic basemap designed specifically for visual contrast against colored safety risk corridors." },
        { name: "Nominatim", version: "v1 API", role: "Forward/Reverse Geocoding", rationale: "OpenStreetMap name resolution for Indian campuses (KITS Warangal, KU) and global urban landmarks." },
        { name: "MoRTH Blackspot Registry", version: "National Taxonomy", role: "Collision Analysis Dataset", rationale: "Classifies high-fatality junctions, blind turns, and uncontrolled crossings in the Accident Hotspots radar." }
      ]
    }
  ];

  const schemasData: Record<string, { desc: string; json: string }> = {
    RouteCandidate: {
      desc: "Complete non-dominated Pareto candidate route containing metrics, segment breakdowns, GeoJSON, and explainability records.",
      json: `{
  "id": "cand-pareto-01",
  "algorithm_tag": "SafePath-BOA*",
  "name": "Robust Balanced Safe Path",
  "is_pareto_optimal": true,
  "dominates_count": 3,
  "dominated_by_count": 0,
  "metrics": {
    "total_travel_time_min": 14.8,
    "total_distance_m": 1050.0,
    "mean_safety_risk": 0.16,
    "robust_safety_risk": 0.22,
    "worst_case_tail_risk_cvar95": 0.28,
    "accessibility_burden": 0.28,
    "environmental_exposure": 1.15,
    "route_complexity_score": 2.0,
    "overall_confidence_score": 0.94,
    "accessible_segments_pct": 92.5
  },
  "segments": [
    {
      "segment_index": 0,
      "edge_id": "edge_MainGate_Admin",
      "distance_m": 125.0,
      "estimated_duration_s": 98.2,
      "expected_arrival_time": "2026-10-27T18:32:00Z",
      "road_class": "footway",
      "surface": "paving_stones",
      "slope_pct": 1.2,
      "is_lit": true,
      "accessibility_prob": 0.98,
      "accessibility_status": "KNOWN",
      "lux_at_arrival": 45.0,
      "rainfall_at_arrival_mm_h": 0.0
    }
  ],
  "geometry_geojson": {
    "type": "Feature",
    "geometry": { "type": "LineString", "coordinates": [[79.5357, 18.0542], [79.5370, 18.0555]] }
  }
}`
    },
    ContextSnapshot: {
      desc: "Real-time fused environmental, atmospheric, and solar illuminance state evaluated at spatial coordinates.",
      json: `{
  "timestamp": "2026-10-27T18:30:00Z",
  "rainfall_mm_h": 0.0,
  "temperature_c": 28.5,
  "visibility_km": 9.5,
  "ambient_lux": 38.0,
  "air_quality_aqi": 42.0,
  "is_dark": false,
  "solar_elevation_deg": 2.5,
  "road_friction_mu": 0.82,
  "crowd_density_index": 0.45,
  "source": "SafePath Real-Time Solar & Sensor Fusion"
}`
    },
    UserProfile: {
      desc: "User mobility and vulnerability profile declaring accessibility limits, walking speed, and priority weights.",
      json: `{
  "profile_type": "WHEELCHAIR_MANUAL",
  "max_slope_pct": 8.33,
  "avoid_unpaved": true,
  "require_curb_ramps": true,
  "require_lit_streets": true,
  "walking_speed_mps": 1.0,
  "safety_priority": 0.8,
  "accessibility_priority": 0.9,
  "time_priority": 0.3,
  "uncertainty_aversion_lambda": 1.5
}`
    },
    IncidentReport: {
      desc: "Crowdsourced pedestrian hazard report documenting unlit streets, blocked sidewalks, and road hazards.",
      json: `{
  "id": "inc-wgl-01",
  "title": "Unlit Broken Streetlight Corridor",
  "category": "BROKEN_LIGHT",
  "severity": "HIGH",
  "status": "VERIFIED",
  "city_tag": "warangal_kits",
  "coordinate": { "lat": 18.0552, "lon": 79.5368 },
  "location_name": "KITS West Campus Access Lane",
  "upvotes": 18,
  "is_night_hazard": true,
  "affected_radius_m": 40.0
}`
    },
    SafeHaven: {
      desc: "Verified 24/7 emergency shelter, police station, or hospital providing immediate pedestrian assistance.",
      json: `{
  "id": "sh-wgl-01",
  "name": "Hasanparthy Police Station",
  "type": "POLICE_STATION",
  "city_tag": "warangal_kits",
  "coordinate": { "lat": 18.0625, "lon": 79.5310 },
  "emergency_phone": "0870-2444100 / 100",
  "operating_hours": "24/7",
  "is_verified_247": true,
  "average_response_time_min": 4
}`
    }
  };

  const apiEndpoints = [
    { method: "POST", path: "/api/v1/route", title: "Compute Multi-Objective Route", desc: "Computes non-dominated Pareto frontier paths balancing time, safety, accessibility, and environmental exposure.", sample: 'curl -X POST "http://localhost:8000/api/v1/route" -H "Content-Type: application/json" -d \'{"origin":{"lat":18.0542,"lon":79.5357},"destination":{"lat":18.0600,"lon":79.5420},"profile":{"profile_type":"WHEELCHAIR_MANUAL","max_slope_pct":8.33}}\'' },
    { method: "GET", path: "/api/v1/context/current", title: "Live Solar & Weather Telemetry", desc: "Returns real-time precipitation, temperature, humidity, astronomical solar elevation angle, and ambient lux.", sample: 'curl -X GET "http://localhost:8000/api/v1/context/current?lat=18.0542&lon=79.5357"' },
    { method: "GET", path: "/api/v1/safehavens/nearest", title: "Nearest 24/7 Safe Havens", desc: "Finds verified police stations, hospital ERs, and security kiosks sorted by walking distance.", sample: 'curl -X GET "http://localhost:8000/api/v1/safehavens/nearest?lat=18.0542&lon=79.5357&radius_m=3000"' },
    { method: "POST", path: "/api/v1/safehavens/sos", title: "Dispatch Emergency SOS Alert", desc: "Triggers immediate emergency SOS broadcast alert with GPS coordinates and WhatsApp share link.", sample: 'curl -X POST "http://localhost:8000/api/v1/safehavens/sos" -H "Content-Type: application/json" -d \'{"coordinate":{"lat":18.0542,"lon":79.5357},"emergency_type":"PANIC_SOS"}\'' },
    { method: "GET", path: "/api/v1/hotspots", title: "Accident Hotspots Radar", desc: "Retrieves audited vehicular/pedestrian blackspots with Kernel Density Estimation (KDE) scores.", sample: 'curl -X GET "http://localhost:8000/api/v1/hotspots?city_tag=warangal_kits"' },
    { method: "POST", path: "/api/v1/hotspots/avoid-route", title: "Compute Collision Bypass Route", desc: "Generates a buffered avoidance bypass route evading all collision clusters and blind turns.", sample: 'curl -X POST "http://localhost:8000/api/v1/hotspots/avoid-route" -H "Content-Type: application/json" -d \'{"origin":{"lat":18.0542,"lon":79.5357},"destination":{"lat":18.0620,"lon":79.5450},"avoid_hotspots":true}\'' },
    { method: "GET", path: "/api/v1/incidents", title: "Crowdsourced Hazard Feed", desc: "Lists active crowdsourced pedestrian incidents (broken lighting, blocked sidewalks, waterlogging).", sample: 'curl -X GET "http://localhost:8000/api/v1/incidents?city_tag=warangal_kits"' },
    { method: "POST", path: "/api/v1/counterfactual/simulate", title: "Simulate Urban Stress Scenario", desc: "Simulates 'What-If' conditions (e.g. +50% rain, streetlamp outages, blocked crossings) and returns deltas.", sample: 'curl -X POST "http://localhost:8000/api/v1/counterfactual/simulate" -H "Content-Type: application/json" -d \'{"rainfall_multiplier":2.0,"lighting_decay_multiplier":0.5}\'' },
    { method: "POST", path: "/api/v1/resilience/analyze", title: "Analyze Route Resilience Matrix", desc: "Executes 4 parameterized stress tests to compute stability score (ρ) and degradation percentage.", sample: 'curl -X POST "http://localhost:8000/api/v1/resilience/analyze" -H "Content-Type: application/json" -d \'{"city_tag":"warangal_kits"}\'' },
    { method: "GET", path: "/api/v1/research/baselines", title: "Research Benchmark Results", desc: "Returns empirical performance metrics across 6 baseline algorithms tested over 100 urban OD pairs.", sample: 'curl -X GET "http://localhost:8000/api/v1/research/baselines"' },
    { method: "GET", path: "/api/v1/health", title: "System Health & Uptime", desc: "Returns API operational status, cached graph counts, and active environment mode.", sample: 'curl -X GET "http://localhost:8000/api/v1/health"' }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-indigo-200">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Master Technical Architecture & Data Engineering Specification</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-mono">v1.0.0</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            SafePath-AI Technical Manual & System Blueprint
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Exhaustive architectural breakdown of the SafePath-AI pedestrian routing platform: how dynamic segment arrival contexts work, full technology stack justification, tripartite epistemic data models, mathematical formulations, and complete REST API contracts.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
            >
              <Compass className="w-4 h-4" />
              <span>Launch Live Map</span>
            </Link>
            <a
              href="http://localhost:8000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/15"
            >
              <ExternalLink className="w-4 h-4 text-indigo-300" />
              <span>Interactive Swagger API Docs</span>
            </a>
            <div className="text-xs text-slate-400 flex items-center gap-2 ml-auto">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>FastAPI Backend Gateway Active on Port 8000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-medium">
        {[
          { id: "workflow", label: "1. How It Works & Workflow", icon: Layers },
          { id: "techstack", label: "2. Technology Stack", icon: Cpu },
          { id: "data", label: "3. Data Engineering & Schemas", icon: Database },
          { id: "algorithms", label: "4. Mathematical Formulations", icon: Calculator },
          { id: "api", label: "5. REST API Directory", icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-indigo-700 shadow-sm font-semibold border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HOW IT WORKS & WORKFLOW */}
      {activeTab === "workflow" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Executive Overview Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">End-to-End System Workflow</h2>
                <p className="text-sm text-slate-500">How data moves from the user request through context fusion to optimal multi-objective paths</p>
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed">
              SafePath-AI discards the traditional single-objective vehicular paradigm in favor of an **uncertainty-aware, context-adaptive multi-objective optimization engine**. Rather than collapsing travel time and risk into an arbitrary scalar formula, it treats walking pedestrians as autonomous multi-criteria agents navigating a dynamic physical and social environment.
            </p>

            {/* Step-by-Step Interactive Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {[
                {
                  step: "01",
                  title: "Profile & Query Ingestion",
                  desc: "User selects origin/destination and configures mobility constraints (Standard, Wheelchair Manual/Power, Stroller, Elderly, Visual Assist).",
                  icon: Compass,
                  color: "border-blue-200 bg-blue-50/50 text-blue-700"
                },
                {
                  step: "02",
                  title: "Spatial Geodesic Snapping",
                  desc: "Origin and destination are snapped to closest walkable network nodes via Haversine distance, or passed to LiveOSRMEngine for real Indian coordinates.",
                  icon: MapPin,
                  color: "border-purple-200 bg-purple-50/50 text-purple-700"
                },
                {
                  step: "03",
                  title: "Solar & Weather Context",
                  desc: "Astronomical solar zenith calculator evaluates solar elevation and ambient lux, while Open-Meteo provides precipitation rates (mm/h).",
                  icon: Clock,
                  color: "border-amber-200 bg-amber-50/50 text-amber-700"
                },
                {
                  step: "04",
                  title: "Epistemic ML Inference",
                  desc: "Sidewalk attributes are mapped into KNOWN, INFERRED, or UNKNOWN with calibrated probability bounds and Brier scores (<0.08).",
                  icon: Cpu,
                  color: "border-emerald-200 bg-emerald-50/50 text-emerald-700"
                },
                {
                  step: "05",
                  title: "Segment Arrival Timeline",
                  desc: "Walking speed is dynamically modulated by slope using Tobler's function. Conditions are evaluated at the exact arrival time of each street segment.",
                  icon: Activity,
                  color: "border-cyan-200 bg-cyan-50/50 text-cyan-700"
                },
                {
                  step: "06",
                  title: "6D Vector Edge Costing",
                  desc: "Every edge calculates a 6-objective vector: [Travel Time, Distance, Robust Risk, Accessibility Burden, Env Exposure, Complexity].",
                  icon: Calculator,
                  color: "border-indigo-200 bg-indigo-50/50 text-indigo-700"
                },
                {
                  step: "07",
                  title: "BOA* Pareto Optimization",
                  desc: "Bicriterion Optimal A* evaluates non-dominated paths, pruning dominated candidates and calculating CVaR 95% tail-risk bounds.",
                  icon: Sparkles,
                  color: "border-rose-200 bg-rose-50/50 text-rose-700"
                },
                {
                  step: "08",
                  title: "Client HUD & Guardian",
                  desc: "Candidate routes render on Leaflet maps with natural-language provenance. Route Guardian tracks real-time GPS proximity to safe havens.",
                  icon: Shield,
                  color: "border-teal-200 bg-teal-50/50 text-teal-700"
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className={`p-5 rounded-2xl border ${item.color} flex flex-col justify-between space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                        STEP {item.step}
                      </span>
                      <Icon className="w-5 h-5 opacity-80" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subsystems Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Server className="w-5 h-5" />
                <span>1. Routing Core Engine</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contains <strong>ParetoBOARouter</strong>, <strong>RobustParetoEngine</strong>, and <strong>LiveOSRMEngine</strong>. Orchestrates graph caches, expands non-dominated labels in priority queues, computes CVaR 95% tail metrics, and handles What-If counterfactual mutations.
              </p>
              <div className="text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                services/routing/algorithms/pareto_boa.py<br />
                services/routing/router.py
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Cpu className="w-5 h-5" />
                <span>2. ML & Context Engine</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates missing sidewalk attributes using calibrated logistic classifiers, decomposes static vs temporal vs incident hazards into mean risk and standard deviation ($\mu, \sigma$), and computes solar zenith illumination physics.
              </p>
              <div className="text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                services/ml_engine/accessibility_model.py<br />
                services/context_engine/dynamic_context.py
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold">
                <Shield className="w-5 h-5" />
                <span>3. Live Safety & SafeHavens</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maintains verified 24/7 safe haven registries (police stations, emergency rooms), handles live crowdsourced incident reports, calculates Kernel Density Estimation (KDE) collision radar hotspots, and drives the GPS Route Guardian.
              </p>
              <div className="text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                apps/api/routers/safehavens.py<br />
                apps/api/routers/hotspots.py
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNOLOGY STACK */}
      {activeTab === "techstack" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Complete Technology Stack Matrix</h2>
                <p className="text-sm text-slate-500">Every library, framework, and service justified by architectural necessity</p>
              </div>
            </div>

            <div className="space-y-8">
              {techStackData.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>{section.category}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-indigo-700">
                              {item.version}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-500 mt-1">{item.role}</div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                          {item.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA ENGINEERING & SCHEMAS */}
      {activeTab === "data" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Data Sources and Pipelines */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Data Ingestion Pipelines & Tripartite Modeling</h2>
                <p className="text-sm text-slate-500">How raw spatial, topographical, and environmental datasets are fused without false promises</p>
              </div>
            </div>

            {/* Tripartite Model Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-blue-50 to-amber-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>The Tripartite Epistemic Data Rule (KNOWN vs INFERRED vs UNKNOWN)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Most navigation apps make a dangerous assumption: if OpenStreetMap has no tag for curb ramps or stairs, they assume the sidewalk is completely flat and wheelchair-accessible. SafePath-AI strictly forbids this assumption through quantitative epistemic uncertainty handling:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. KNOWN (Confidence &ge; 0.95)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Verified ground truth directly mapped in official surveys or explicit OSM tags (<code className="font-mono text-emerald-800">kerb=lowered</code>, <code className="font-mono text-emerald-800">incline=2%</code>). No estimation applied.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-700 text-xs uppercase tracking-wider">
                    <Cpu className="w-4 h-4" />
                    <span>2. INFERRED (0.35 &le; Conf &lt; 0.95)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Predicted probabilistically via calibrated machine learning models. Confidence interval and Brier calibration scores are attached to the provenance audit record.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-700 text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>3. UNKNOWN (Conf &lt; 0.35)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    High epistemic ambiguity. Segments are flagged explicitly to the pedestrian as unconfirmed, triggering risk aversion penalties ($\lambda$) instead of giving false guarantees.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Schema Viewer */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Interactive Data Contract & Pydantic Schema Viewer</h3>
                <span className="text-xs text-slate-400">Strict Pydantic v2 Type Definitions</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.keys(schemasData).map((sKey) => (
                  <button
                    key={sKey}
                    onClick={() => setSelectedSchema(sKey)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                      selectedSchema === sKey
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {sKey}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 relative group">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>{schemasData[selectedSchema].desc}</span>
                  <button
                    onClick={() => copyToClipboard(schemasData[selectedSchema].json, selectedSchema)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  >
                    {copiedEndpoint === selectedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEndpoint === selectedSchema ? "Copied" : "Copy Schema"}</span>
                  </button>
                </div>
                <pre className="pt-3 leading-relaxed text-indigo-300">{schemasData[selectedSchema].json}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MATHEMATICAL FORMULATIONS */}
      {activeTab === "algorithms" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Mathematical Formulations & Optimization Algorithms</h2>
                <p className="text-sm text-slate-500">Mathematical models governing velocity, arrival timeline, risk variance, and Pareto dominance</p>
              </div>
            </div>

            {/* Interactive Tobler Slope Calculator */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>1. Tobler&apos;s Hiking Function with Sidewalk Gradient Scaling</span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Formula: <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">v(s) = v_0 * exp(-3.0 * max(0, s - 0.02))</code>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-indigo-600 font-mono">{speedDecay.toFixed(2)} m/s</div>
                  <div className="text-xs text-slate-500 font-mono">{speedKmh} km/h (Base: 4.3 km/h)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Simulate Sidewalk Slope Gradient: <strong>{sliderSlope.toFixed(1)}%</strong></span>
                  <span className={sliderSlope > 8.33 ? "text-rose-600 font-bold" : "text-emerald-600 font-semibold"}>
                    {sliderSlope > 8.33 ? "⚠️ Exceeds ADA Wheelchair Standard (8.33%)" : "✓ Within ADA Wheelchair Standard"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="18.0"
                  step="0.5"
                  value={sliderSlope}
                  onChange={(e) => setSliderSlope(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Core Math Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>2. Dynamic Segment Arrival Time Propagation</span>
                </h4>
                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800">
                  t_arrival(e_k) = t_0 + &sum; (d_j / v(s_j))
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lighting, rain, and crowd density are computed for edge $e_k$ at the exact predicted minute of arrival, completely eliminating departure-time temporal skew.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>3. Robust Risk with Uncertainty Penalty (&lambda;)</span>
                </h4>
                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800">
                  R_robust(e) = &mu;_risk(e) + &lambda; * &sigma;_risk(e)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Separates expected risk ($\mu$) from epistemic variance ($\sigma$) induced by unlit corridors and missing surveys. High $\lambda$ directs vulnerable pedestrians away from volatile paths.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>4. Conditional Value-at-Risk (CVaR-95% Tail Risk)</span>
                </h4>
                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800">
                  CVaR_0.95 = &mu;_risk + 2.063 * &sigma;_risk
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Measures the expected risk exposure in the worst 5% of environmental scenarios, protecting pedestrians from low-probability catastrophic hazards (e.g., sudden violent muggings in unlit alleys).
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>5. Bicriterion Optimal A* (BOA*) Dominance</span>
                </h4>
                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800">
                  u &prec; v &hArr; (&forall; i, u_i &le; v_i) &and; (&exist; j, u_j &lt; v_j)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vector dominance pruning across the 6-objective cost vector. Any path label dominated across all 6 dimensions is aggressively pruned, returning the exact Pareto frontier.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REST API DIRECTORY */}
      {activeTab === "api" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Complete REST API Specification</h2>
                  <p className="text-sm text-slate-500">FastAPI backend gateway endpoint directory on port 8000</p>
                </div>
              </div>
              <a
                href="http://localhost:8000/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all"
              >
                <span>Interactive Swagger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-4">
              {apiEndpoints.map((ep, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                        ep.method === "POST" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-bold text-slate-900 font-mono">{ep.path}</code>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{ep.title}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{ep.desc}</p>

                  <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] flex items-center justify-between gap-3 overflow-x-auto">
                    <span className="truncate">{ep.sample}</span>
                    <button
                      onClick={() => copyToClipboard(ep.sample, ep.path)}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-[10px]"
                    >
                      {copiedEndpoint === ep.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEndpoint === ep.path ? "Copied" : "Copy cURL"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer / Offline Artifact Link */}
      <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Local Markdown Reference Document Available at: <code className="font-mono font-bold text-slate-900">docs/TECHNICAL_SPECIFICATION.md</code></span>
        </div>
        <Link
          href="/research"
          className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-all"
        >
          <span>View Empirical Benchmarks & Ablation Studies</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
