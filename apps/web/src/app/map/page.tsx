"use client";

import React, { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { 
  RouteResponse, 
  RouteCandidate, 
  RouteSegment, 
  calculateRoute, 
  searchPlacesInIndia,
  FREE_MAP_APIS_INFO,
  Coordinate, 
  UserProfile,
  TransitMode
} from "@/lib/api";

import { ProvenanceModal } from "@/components/ProvenanceModal";
import { ProjectSidewalkModal } from "@/components/ProjectSidewalkModal";
import { 
  Navigation, 
  Sliders, 
  Shield, 
  Clock, 
  Accessibility, 
  Layers, 
  Sparkles, 
  Database, 
  RotateCcw,
  RotateCw,
  Check,
  Search,
  MapPin,
  ArrowUpDown,
  BookOpen,
  X,
  ExternalLink,
  ChevronRight,
  Compass,
  AlertTriangle,
  Lightbulb,
  Key,
  Footprints,
  Printer,
  ShieldCheck,
  Car,
  Bike,
  Gauge,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Cpu
} from "lucide-react";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { SafeWalkHud } from "@/components/SafeWalkHud";
import { SafetyAuditModal } from "@/components/SafetyAuditModal";

// Dynamically import RealMapViewer with SSR disabled to prevent Leaflet window errors
const RealMapViewer = nextDynamic(
  () => import("@/components/RealMapViewer").then((mod) => mod.RealMapViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[640px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Initializing OpenStreetMap & CartoDB Tiles...</span>
      </div>
    )
  }
);

export default function MapPage() {
  // Origin & Destination in India (Default: Kakatiya Institute of Technology & Science, Warangal, TS)
  const [origin, setOrigin] = useState<Coordinate>({ lat: 18.0541786, lon: 79.5357460 });
  const [originName, setOriginName] = useState("KITS Entrance Gate, Warangal (TS)");
  
  const [destination, setDestination] = useState<Coordinate>({ lat: 18.0565, lon: 79.5378 });
  const [destinationName, setDestinationName] = useState("KITS Central Library & CSE, Warangal (TS)");

  // Intermediate Waypoints (Google Navigation style multi-stop routing)
  const [waypoints, setWaypoints] = useState<{ id: string; name: string; coord: Coordinate }[]>([]);

  const [selectionMode, setSelectionMode] = useState<"origin" | "destination" | "waypoint" | "view">("origin");

  // Search autocomplete states
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [originResults, setOriginResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [destResults, setDestResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  // Transit Mode (Walk vs Vehicle Routing)
  const [transitMode, setTransitMode] = useState<TransitMode>("WALK");

  // Modals
  const [apiGuideOpen, setApiGuideOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [sidewalkModalOpen, setSidewalkModalOpen] = useState(false);

  // Routing states
  const [response, setResponse] = useState<RouteResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RouteCandidate | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [loading, setLoading] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  // Turn-by-Turn Safe Walk HUD & Safety Audit States
  const [walkHudOpen, setWalkHudOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // Profile & Priority States
  const [profileType, setProfileType] = useState("WHEELCHAIR_MANUAL");
  const [lambdaUncertainty, setLambdaUncertainty] = useState(1.5);
  const [safetyPriority, setSafetyPriority] = useState(0.8);
  const [accessPriority, setAccessPriority] = useState(0.8);

  const cityPresets = [
    {
      name: "🎓 KITS College (Warangal)",
      tag: "warangal_kits",
      oName: "KITS Entrance Gate, Warangal (TS)",
      oLat: 18.0541786,
      oLon: 79.5357460,
      dName: "KITS Central Library & CSE, Warangal (TS)",
      dLat: 18.0565,
      dLon: 79.5378
    },
    {
      name: "🏛️ Kakatiya University (Warangal)",
      tag: "warangal_ku",
      oName: "Kakatiya University Main Gate",
      oLat: 18.0195,
      oLon: 79.5532,
      dName: "KU Central Library & Admin Block",
      dLat: 18.0245,
      dLon: 79.5560
    },
    {
      name: "🏢 Bengaluru Tech Corridor",
      tag: "bengaluru",
      oName: "Cubbon Park / High Court",
      oLat: 12.9763,
      oLon: 77.5929,
      dName: "MG Road Metro Station",
      dLat: 12.9755,
      dLon: 77.6066
    },
    {
      name: "🏛️ Hyderabad Cyberabad",
      tag: "hyderabad",
      oName: "HITEC City Cyber Towers",
      oLat: 17.4504,
      oLon: 78.3808,
      dName: "Mindspace Tech Gateway",
      dLat: 17.4399,
      dLon: 78.3812
    },
    {
      name: "🇮🇳 New Delhi Central",
      tag: "delhi",
      oName: "Connaught Place Inner Circle",
      oLat: 28.6315,
      oLon: 77.2167,
      dName: "India Gate Boulevard",
      dLat: 28.6129,
      dLon: 77.2295
    }
  ];

  // Listen to custom event from Sidebar
  useEffect(() => {
    const handleSidebarCity = (e: any) => {
      const preset = cityPresets.find(p => p.tag === e.detail.tag);
      if (preset) applyPreset(preset);
    };
    window.addEventListener("safepath:select_city", handleSidebarCity);
    return () => window.removeEventListener("safepath:select_city", handleSidebarCity);
  }, []);

  const applyPreset = (preset: typeof cityPresets[0]) => {
    setOrigin({ lat: preset.oLat, lon: preset.oLon });
    setOriginName(preset.oName);
    setDestination({ lat: preset.dLat, lon: preset.dLon });
    setDestinationName(preset.dName);
    recompute(preset.oLat, preset.oLon, preset.dLat, preset.dLon, profileType, preset.tag, waypoints.map(w => w.coord), transitMode);
  };

  const recompute = async (
    oLat: number = origin.lat,
    oLon: number = origin.lon,
    dLat: number = destination.lat,
    dLon: number = destination.lon,
    prof: string = profileType,
    cityTag: string = "warangal_kits",
    wps: Coordinate[] = waypoints.map((w) => w.coord),
    mode: TransitMode = transitMode
  ) => {
    setLoading(true);
    try {
      const payload = {
        origin: { lat: oLat, lon: oLon },
        destination: { lat: dLat, lon: dLon },
        waypoints: wps,
        transit_mode: mode,
        profile: {
          profile_type: prof,
          max_slope_pct: prof.includes("WHEELCHAIR") ? 8.33 : 15.0,
          avoid_unpaved: true,
          require_curb_ramps: true,
          require_lit_streets: false,
          require_signalized_crossings: false,
          max_step_height_cm: 5.0,
          walking_speed_mps: 1.15,
          safety_priority: safetyPriority,
          accessibility_priority: accessPriority,
          time_priority: 0.5,
          environment_priority: 0.4,
          complexity_priority: 0.3,
          uncertainty_aversion_lambda: lambdaUncertainty
        },
        departure_time: new Date().toISOString(),
        city_tag: cityTag
      };

      const data = await calculateRoute(payload);
      setResponse(data);
      if (data.candidates && data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
        setSelectedSegment(data.candidates[0].segments[0] || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recompute();
  }, []);

  // Handle map click origin
  const handleMapSetOrigin = (coord: Coordinate) => {
    setOrigin(coord);
    setOriginName(`Coord: ${coord.lat.toFixed(5)}, ${coord.lon.toFixed(5)}`);
    recompute(coord.lat, coord.lon, destination.lat, destination.lon, profileType, "warangal_kits");
  };

  // Handle map click destination
  const handleMapSetDestination = (coord: Coordinate) => {
    setDestination(coord);
    setDestinationName(`Coord: ${coord.lat.toFixed(5)}, ${coord.lon.toFixed(5)}`);
    recompute(origin.lat, origin.lon, coord.lat, coord.lon, profileType, "warangal_kits");
  };

  // Handle map click waypoint
  const handleMapSetWaypoint = (coord: Coordinate) => {
    const newWp = {
      id: `wp-${Date.now()}`,
      name: `Stop #${waypoints.length + 1} (${coord.lat.toFixed(4)}, ${coord.lon.toFixed(4)})`,
      coord
    };
    const updated = [...waypoints, newWp];
    setWaypoints(updated);
    recompute(origin.lat, origin.lon, destination.lat, destination.lon, profileType, "warangal_kits", updated.map(w => w.coord));
  };

  // Swap Origin and Destination
  const handleSwap = () => {
    const tempCoord = origin;
    const tempName = originName;
    setOrigin(destination);
    setOriginName(destinationName);
    setDestination(tempCoord);
    setDestinationName(tempName);
    recompute(destination.lat, destination.lon, tempCoord.lat, tempCoord.lon);
  };

  // Nominatim Search for Origin
  const handleSearchOrigin = async (text: string) => {
    setOriginQuery(text);
    if (text.length >= 2) {
      setIsSearchingOrigin(true);
      const results = await searchPlacesInIndia(text);
      setOriginResults(results);
      setIsSearchingOrigin(false);
    } else {
      setOriginResults([]);
    }
  };

  // Nominatim Search for Destination
  const handleSearchDest = async (text: string) => {
    setDestQuery(text);
    if (text.length >= 2) {
      setIsSearchingDest(true);
      const results = await searchPlacesInIndia(text);
      setDestResults(results);
      setIsSearchingDest(false);
    } else {
      setDestResults([]);
    }
  };

  const profiles = [
    { id: "WHEELCHAIR_MANUAL", label: "Wheelchair (Manual)", maxSlope: 8.33 },
    { id: "WHEELCHAIR_POWER", label: "Wheelchair (Power)", maxSlope: 10.0 },
    { id: "STROLLER", label: "Stroller / Luggage", maxSlope: 10.0 },
    { id: "STANDARD", label: "Standard Pedestrian", maxSlope: 15.0 },
    { id: "LOW_MOBILITY", label: "Low Mobility / Senior", maxSlope: 6.0 },
    { id: "VISUAL_ASSIST", label: "Visual Assistance", maxSlope: 12.0 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: India Urban Navigation & Free APIs Guide Button */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200 shadow-xs">
            <Navigation className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">India Pedestrian Mobility & Spatial Navigation</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Real OSM & OSRM Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Click anywhere on the map or type to select Source (A) & Destination (B) points.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Project Sidewalk DINOv2 AI Model Button */}
          <button
            onClick={() => setSidewalkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs border border-blue-700/50"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Sidewalk AI Surface Tagger</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">HF</span>
          </button>

          {/* API Keys Setup Button */}
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-blue-200 shadow-2xs"
          >
            <Key className="w-3.5 h-3.5 text-blue-600" />
            <span>API Keys Setup</span>
          </button>

          {/* Free APIs Info Button */}
          <button
            onClick={() => setApiGuideOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Free Map APIs Guide</span>
          </button>

          {/* Reload / Reset Map View Button */}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("safepath:reload_map"));
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-200 shadow-2xs"
            title="Reload and fix map view if tiles are loading slowly or stuck"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Reload Map</span>
          </button>

          {/* Recompute Button */}
          <button
            onClick={() => recompute()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Optimizing..." : "Recompute Safe Route"}</span>
          </button>
        </div>
      </div>

      {/* India Regional Presets Bar */}
      <div className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center space-x-2 overflow-x-auto shadow-xs text-xs font-medium">
        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider px-2 flex-shrink-0 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Hubs:</span>
        </span>
        {cityPresets.map((preset) => (
          <button
            key={preset.tag}
            onClick={() => applyPreset(preset)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all flex-shrink-0 text-slate-700"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Transit Mode Selection Bar (Walk vs Vehicle Routing with Road Safety) */}
      <div className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1 shrink-0">
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Mode:</span>
          </span>
          
          {[
            { id: "WALK" as TransitMode, label: "Safe Walk & Roll", icon: "🚶", desc: "Sidewalks & Accessible Crossings" },
            { id: "TWO_WHEELER" as TransitMode, label: "Two-Wheeler", icon: "🏍️", desc: "Motorbike / Scooter Safe Path" },
            { id: "FOUR_WHEELER" as TransitMode, label: "Four-Wheeler", icon: "🚗", desc: "Car / Cab Direct Road" },
            { id: "AUTO_RICKSHAW" as TransitMode, label: "Auto-Rickshaw", icon: "🛺", desc: "3-Wheeler Urban Corridor" },
          ].map((m) => {
            const isActive = transitMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setTransitMode(m.id);
                  recompute(origin.lat, origin.lon, destination.lat, destination.lon, profileType, "warangal_kits", waypoints.map(w => w.coord), m.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Vehicle Road Safety Status Badge */}
        {transitMode !== "WALK" && selectedCandidate && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-800">
              Road Safety Score: <b>{selectedCandidate.metrics.vehicle_safety_score ?? 92}/100</b>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-mono text-[11px]">
              {selectedCandidate.metrics.traffic_congestion_index || "Free Flow"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-mono text-[11px]">
              OSRM Driving Core
            </span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Search Inputs & Mobility Configuration */}
        <div className="lg:col-span-3 space-y-4">
          {/* Source & Destination Search Card */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Waypoints</span>
              </span>
              <button
                onClick={handleSwap}
                title="Swap Source and Destination"
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Source Input */}
            <div className="relative space-y-1">
              <label className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Source / Origin (Pin A)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type address or click map..."
                  value={originQuery || originName}
                  onChange={(e) => handleSearchOrigin(e.target.value)}
                  onFocus={() => setSelectionMode("origin")}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-7 transition-all font-medium text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>

              {/* Origin Autocomplete Results */}
              {originResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {originResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setOrigin({ lat: r.lat, lon: r.lon });
                        setOriginName(r.name);
                        setOriginQuery("");
                        setOriginResults([]);
                        recompute(r.lat, r.lon, destination.lat, destination.lon);
                      }}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 transition-colors text-slate-700"
                    >
                      <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.lat.toFixed(4)}, {r.lon.toFixed(4)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Intermediate Waypoints (Google Navigation Multi-Stop) */}
            {waypoints.map((wp, idx) => (
              <div key={wp.id} className="relative space-y-1 pt-1 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Stop #{idx + 1}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = waypoints.filter((_, i) => i !== idx);
                      setWaypoints(updated);
                      recompute(origin.lat, origin.lon, destination.lat, destination.lon, profileType, "warangal_kits", updated.map(w => w.coord));
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={wp.name}
                    readOnly
                    onClick={() => setSelectionMode("waypoint")}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer"
                  />
                  <MapPin className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-2.5" />
                </div>
              </div>
            ))}

            {/* Add Waypoint Button */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const newLat = +((origin.lat + destination.lat) / 2 + 0.0008 * (waypoints.length + 1)).toFixed(6);
                  const newLon = +((origin.lon + destination.lon) / 2 + 0.0008 * (waypoints.length + 1)).toFixed(6);
                  const newWp = {
                    id: `wp-${Date.now()}`,
                    name: `Stop #${waypoints.length + 1} (${newLat.toFixed(4)}, ${newLon.toFixed(4)})`,
                    coord: { lat: newLat, lon: newLon }
                  };
                  const updated = [...waypoints, newWp];
                  setWaypoints(updated);
                  setSelectionMode("waypoint");
                  recompute(origin.lat, origin.lon, destination.lat, destination.lon, profileType, "warangal_kits", updated.map(w => w.coord));
                }}
                className="w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 transition-all text-[11px] font-semibold flex items-center justify-center space-x-1.5"
              >
                <span>+ Add Stop (Waypoint)</span>
              </button>
            </div>

            {/* Destination Input */}
            <div className="relative space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Destination (Pin B)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type destination in India..."
                  value={destQuery || destinationName}
                  onChange={(e) => handleSearchDest(e.target.value)}
                  onFocus={() => setSelectionMode("destination")}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none pr-7 transition-all font-medium text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>

              {/* Destination Autocomplete Results */}
              {destResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {destResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDestination({ lat: r.lat, lon: r.lon });
                        setDestinationName(r.name);
                        setDestQuery("");
                        setDestResults([]);
                        recompute(origin.lat, origin.lon, r.lat, r.lon);
                      }}
                      className="w-full text-left p-2.5 hover:bg-rose-50 transition-colors text-slate-700"
                    >
                      <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.lat.toFixed(4)}, {r.lon.toFixed(4)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobility Profile (Walk) OR Vehicle Road Safety Telemetry (Vehicle Modes) */}
          {transitMode !== "WALK" ? (
            <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span>Vehicle Safety Telemetry</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {transitMode.replace("_", " ")}
                </span>
              </div>

              {/* Telemetry Metric Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block font-semibold">ROAD SAFETY</span>
                  <span className="text-base font-bold text-emerald-600">
                    {selectedCandidate?.metrics.vehicle_safety_score ?? 92}/100
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block font-semibold">SAFE SPEED</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {selectedSegment?.vehicle_speed_kmh || 40} km/h
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block font-semibold">CONGESTION</span>
                  <span className="font-bold text-blue-600">
                    {selectedCandidate?.metrics.traffic_congestion_index || "Free Flow"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-sans block font-semibold">DEFECT RADAR</span>
                  <span className="font-bold text-amber-600 font-mono">
                    {selectedCandidate?.metrics.surface_defect_count || 0} Avoided
                  </span>
                </div>
              </div>

              {/* Surface Vision AI & Road Context Note */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Real-Time Hazard Filter</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Active DINOv2 surface tagger screens road edges for severe potholes, loose gravel, and narrow lanes to prevent skids and vehicular damage.
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Road Safety Sensitivity (Lambda) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Risk Avoidance Sensitivity (λ)</span>
                  <span className="font-mono font-bold text-blue-600">{lambdaUncertainty.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={lambdaUncertainty}
                  onChange={(e) => setLambdaUncertainty(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  Cost = Travel_Time + {lambdaUncertainty.toFixed(1)}·(Pothole_Risk + Road_Roughness)
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Pedestrian Profile</span>
              </div>

              <div className="space-y-1.5">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProfileType(p.id);
                      recompute(origin.lat, origin.lon, destination.lat, destination.lon, p.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      profileType === p.id
                        ? "bg-blue-50 border-blue-300 text-blue-800 font-semibold shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{p.label}</span>
                    {profileType === p.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>

              <hr className="border-slate-100" />

              {/* Robust Risk Lambda Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Uncertainty Aversion (λ)</span>
                  <span className="font-mono font-bold text-blue-600">{lambdaUncertainty.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={lambdaUncertainty}
                  onChange={(e) => setLambdaUncertainty(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  R_robust = μ_risk + {lambdaUncertainty.toFixed(1)}·σ_risk
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Real Interactive Map */}
        <div className="lg:col-span-6">
          <RealMapViewer
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            onSetOrigin={handleMapSetOrigin}
            onSetDestination={handleMapSetDestination}
            onSetWaypoint={handleMapSetWaypoint}
            candidate={selectedCandidate}
            alternatives={response?.candidates || []}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
            selectedSegment={selectedSegment}
            onSelectSegment={(seg) => setSelectedSegment(seg)}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            onOpenApiKeys={() => setApiKeyModalOpen(true)}
          />
        </div>

        {/* Right Panel: Pareto Candidates & Directions Breakdown */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pareto Candidates ({response?.candidates.length || 0})</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {response?.execution_time_ms || 14}ms
              </span>
            </div>

            {/* Candidate Route Selectors */}
            <div className="space-y-2">
              {response?.candidates.map((c) => {
                const isSelected = selectedCandidate?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-400 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate pr-2">{c.name}</span>
                      <span className="text-[9px] font-mono text-blue-700 px-1.5 py-0.5 rounded bg-white border border-blue-200 font-medium flex-shrink-0">
                        {c.algorithm_tag}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono pt-1">
                      <div className="p-1 rounded bg-white border border-slate-200">
                        <span className="text-[8px] text-slate-400 block font-sans">TIME</span>
                        <span className="font-bold text-slate-900">{c.metrics.total_travel_time_min}m</span>
                      </div>
                      <div className="p-1 rounded bg-white border border-slate-200">
                        <span className="text-[8px] text-slate-400 block font-sans">DIST</span>
                        <span className="font-bold text-slate-900">{c.metrics.total_distance_m}m</span>
                      </div>
                      <div className="p-1 rounded bg-white border border-slate-200">
                        <span className="text-[8px] text-slate-400 block font-sans">ACCESS</span>
                        <span className="font-bold text-emerald-600">{c.metrics.accessible_segments_pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons for selected candidate */}
            {selectedCandidate && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => setWalkHudOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
                >
                  <Footprints className="w-4 h-4" />
                  <span>Start Safe Walk (Voice HUD)</span>
                </button>

                <Link
                  href="/guardian"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs border border-slate-700"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Activate Route Guardian (Live Watch)</span>
                </Link>

                <button
                  onClick={() => setAuditModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Safety Audit & Trip Pass</span>
                </button>
              </div>
            )}
          </div>

          {/* Turn-by-Turn Segment & Maneuver Inspection */}
          {selectedCandidate && selectedCandidate.segments.length > 0 && (
            <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>
                    {transitMode !== "WALK" ? "Turn-by-Turn Directions" : "Route Segments"} ({selectedCandidate.segments.length})
                  </span>
                </span>
                <button
                  onClick={() => setProvenanceOpen(true)}
                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 normal-case font-medium"
                >
                  <span>Lineage</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {selectedCandidate.segments.map((seg, idx) => {
                  const isSegSelected = selectedSegment?.segment_index === seg.segment_index;
                  return (
                    <div
                      key={seg.segment_index}
                      onClick={() => setSelectedSegment(seg)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSegSelected
                          ? "bg-blue-50/90 border-blue-400 shadow-2xs ring-1 ring-blue-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          {seg.maneuver_type?.includes("right") ? (
                            <CornerUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : seg.maneuver_type?.includes("left") ? (
                            <CornerUpLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className="truncate">
                            {seg.turn_instruction || `Step #${idx + 1}`}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {seg.distance_m}m • {Math.round(seg.estimated_duration_s)}s
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-0.5">
                        {transitMode !== "WALK" ? (
                          <>
                            <span>Speed: <b className="text-slate-700">{seg.vehicle_speed_kmh || 35} km/h</b></span>
                            <span>Width: <b>{seg.road_width_m || 7.0}m</b></span>
                            <span className="font-semibold text-emerald-600">
                              {seg.traffic_level || "Free Flow"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>Slope: <b>{seg.slope_pct}%</b></span>
                            <span>Access: <b>{Math.round(seg.accessibility_prob * 100)}%</b></span>
                            <span className={seg.is_lit ? "text-amber-600" : "text-purple-600 font-semibold"}>
                              {seg.is_lit ? "Lit" : "Unlit"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Project Sidewalk AI Surface Defect Alert Tag */}
                      {seg.surface_defect_tags && seg.surface_defect_tags.length > 0 && !seg.surface_defect_tags.includes("NULL") && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200/60 flex items-center gap-1 text-[10px] text-rose-700 font-medium">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">
                            Sidewalk AI: {seg.surface_defect_tags.join(", ")} ({seg.pothole_risk_pct || 15}% hazard)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Free Map APIs & Providers Modal */}
      {apiGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200">
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Free Map APIs & Public Endpoints</h2>
                  <p className="text-xs text-slate-500">Zero Cost • No API Key or Credit Card Required</p>
                </div>
              </div>
              <button
                onClick={() => setApiGuideOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              SafePath-AI is completely architected around free, open-access public geospatial infrastructure.
              You do not need to purchase Google Maps or Mapbox licenses. The following APIs are integrated:
            </p>

            <div className="space-y-3">
              {FREE_MAP_APIS_INFO.map((api, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="text-sm">{api.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {api.cost}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{api.description}</p>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-blue-700 break-all select-all">
                    {api.endpoint}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <span className="font-semibold text-slate-700">How to use:</span>
                    <span>{api.whereToGet}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setApiGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Done / Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provenance Data Lineage Modal */}
      {selectedCandidate && (
        <ProvenanceModal
          isOpen={provenanceOpen}
          onClose={() => setProvenanceOpen(false)}
          candidate={selectedCandidate}
        />
      )}

      {/* Turn-by-Turn Safe Walk HUD */}
      {selectedCandidate && (
        <SafeWalkHud
          candidate={selectedCandidate}
          isOpen={walkHudOpen}
          onClose={() => setWalkHudOpen(false)}
          onSelectSegment={(seg) => setSelectedSegment(seg)}
        />
      )}

      {/* Safety Audit & Trip Pass Certificate */}
      {selectedCandidate && (
        <SafetyAuditModal
          candidate={selectedCandidate}
          originName={originName}
          destinationName={destinationName}
          origin={origin}
          destination={destination}
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
        />
      )}

      {/* API Keys Configuration Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />

      {/* Project Sidewalk AI Hugging Face Surface Problem Scanner Modal */}
      <ProjectSidewalkModal
        isOpen={sidewalkModalOpen}
        onClose={() => setSidewalkModalOpen(false)}
        candidate={selectedCandidate}
      />
    </div>
  );
}

