"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Wind, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  RefreshCw, 
  Sliders, 
  Thermometer, 
  Activity,
  AlertTriangle,
  Locate,
  Radio,
  Compass,
  Volume2,
  Droplets,
  Eye,
  CheckCircle2,
  Zap,
  TrendingDown,
  Navigation,
  Sparkles
} from "lucide-react";
import { fetchCurrentContext, fetchIncidentFeed, ContextSnapshot } from "@/lib/api";

export default function ContextPage() {
  const [selectedCity, setSelectedCity] = useState("warangal_kits");
  const [userLocationName, setUserLocationName] = useState("Warangal (KITS Campus & Hasanparthy)");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number }>({ lat: 18.0542, lon: 79.5357 });
  const [isUsingGps, setIsUsingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [context, setContext] = useState<ContextSnapshot | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Dynamic simulation overrides
  const [simRain, setSimRain] = useState<number | null>(null);
  const [simLux, setSimLux] = useState<number | null>(null);
  const [simMinutesAhead, setSimMinutesAhead] = useState<number>(0);

  const cityCoordinates: Record<string, { lat: number; lon: number; name: string; state: string }> = {
    warangal_kits: { lat: 18.0542, lon: 79.5357, name: "KITS Campus, Warangal", state: "Telangana" },
    warangal_ku: { lat: 18.0205, lon: 79.5492, name: "Kakatiya University, Warangal", state: "Telangana" },
    hyderabad: { lat: 17.4435, lon: 78.3772, name: "HITEC Cyberabad, Hyderabad", state: "Telangana" },
    bengaluru: { lat: 12.9716, lon: 77.5946, name: "MG Road & Indiranagar, Bengaluru", state: "Karnataka" },
    delhi: { lat: 28.6139, lon: 77.2090, name: "Connaught Place, New Delhi", state: "Delhi NCR" },
    mumbai: { lat: 18.9220, lon: 72.8347, name: "Marine Drive & Nariman Point, Mumbai", state: "Maharashtra" },
    kadapa_campus: { lat: 14.4754, lon: 78.7738, name: "Kadapa Urban Corridor", state: "Andhra Pradesh" },
    chennai: { lat: 13.0827, lon: 80.2707, name: "Marina Promenade, Chennai", state: "Tamil Nadu" }
  };

  const loadContextData = async (lat: number, lon: number, cityName?: string) => {
    setLoading(true);
    try {
      const [ctx, incs] = await Promise.all([
        fetchCurrentContext(lat, lon),
        fetchIncidentFeed(selectedCity)
      ]);
      setContext(ctx);
      setIncidents(incs || []);
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      if (cityName) setUserLocationName(cityName);
    } catch (e) {
      console.warn("Context fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContextData(currentCoords.lat, currentCoords.lon, userLocationName);
  }, [currentCoords]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadContextData(currentCoords.lat, currentCoords.lon);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentCoords, autoRefresh]);

  // Live GPS Handlers
  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lon = +pos.coords.longitude.toFixed(6);
        setCurrentCoords({ lat, lon });
        setIsUsingGps(true);
        setSelectedCity("custom_gps");
        setUserLocationName(`My Live Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        // Reverse geocode via free Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(",");
              const shortName = parts.slice(0, 3).join(",");
              setUserLocationName(shortName);
            }
          }
        } catch (e) {}
      },
      (err) => {
        setGpsError(`GPS Access Denied: ${err.message}. Using default campus coordinates.`);
        setLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (key: string) => {
    setIsUsingGps(false);
    setSelectedCity(key);
    const info = cityCoordinates[key];
    if (info) {
      setCurrentCoords({ lat: info.lat, lon: info.lon });
      setUserLocationName(`${info.name} (${info.state})`);
      setSimRain(null);
      setSimLux(null);
    }
  };

  // Base values from API
  const baseRain = context?.rainfall_mm_h ?? 0.0;
  const baseLux = context?.ambient_lux ?? 750;
  const baseSolarAngle = context?.solar_elevation_deg ?? 45.0;

  // Active values with simulation & arrival-time forward projection
  // In SafePath-AI, segment arrival time shifts twilight and rain:
  const projectedRainShift = simMinutesAhead > 0 ? Math.sin((simMinutesAhead / 30) * Math.PI) * 4.5 : 0;
  const activeRain = simRain !== null ? simRain : Math.max(0, +(baseRain + projectedRainShift).toFixed(1));

  // Sun elevation drops 0.25 deg per minute in afternoon, shifting lux
  const projectedLuxShift = simMinutesAhead > 0 ? Math.max(0, baseLux - simMinutesAhead * 18) : baseLux;
  const activeLux = simLux !== null ? simLux : Math.max(8, Math.round(projectedLuxShift));
  
  // Real-time Road Friction coefficient μ = 0.85 (dry) -> 0.32 (hydroplaning)
  const roadFrictionMu = +(Math.max(0.32, 0.85 - (activeRain * 0.045))).toFixed(2);
  const frictionDropPct = Math.round(((0.85 - roadFrictionMu) / 0.85) * 100);

  // Solar position calculation for radial gauge
  const solarAngleDeg = Math.max(-25, Math.min(85, baseSolarAngle - (simMinutesAhead * 0.25)));
  const solarGaugePct = Math.max(0, Math.min(100, Math.round(((solarAngleDeg + 25) / 110) * 100)));

  return (
    <div className="space-y-6">
      {/* =========================================================
          CRAZY TELEMETRY HUD HEADER
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-cyan-500/30 p-6 shadow-2xl text-white">
        {/* Futuristic glowing grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.25),rgba(255,255,255,0))]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                REAL-TIME FUSION TELEMETRY
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE OPEN-METEO ACTIVE
              </span>
              {isUsingGps && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-violet-950 text-violet-300 border border-violet-500/40">
                  🛰️ HIGH-ACCURACY GPS
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{userLocationName}</span>
            </h1>

            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>GPS: {currentCoords.lat.toFixed(5)}°N, {currentCoords.lon.toFixed(5)}°E</span>
              <span>•</span>
              <span>Synced: {lastUpdated || "Live"}</span>
              <span>•</span>
              <span className="text-cyan-400">{context?.source || "Multi-Source Sensor Engine"}</span>
            </p>
          </div>

          {/* Action Buttons: Live GPS & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDetectGPS}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Locate className="w-4 h-4 text-white animate-spin" style={{ animationDuration: "3s" }} />
              <span>Use My Live GPS</span>
            </button>

            <button
              onClick={() => loadContextData(currentCoords.lat, currentCoords.lon)}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Live Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            <label className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 w-3.5 h-3.5"
              />
              <span>10s Pulse</span>
            </label>
          </div>
        </div>

        {gpsError && (
          <div className="relative z-10 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* =========================================================
          INDIA REGIONAL FOCUS PILLS
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Indian Urban Research Hub</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Click any location for real-time live weather</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(cityCoordinates).map(([key, info]) => (
            <button
              key={key}
              onClick={() => handleSelectCity(key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                selectedCity === key && !isUsingGps
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{info.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          CRAZY 4-CARD SCIENTIFIC TELEMETRY DISPLAY
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Solar Angle & Ambient Lux Dial */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 border border-amber-500/30 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <Sun className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
              <span>SOLAR ANGLE & LUX</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
              {solarAngleDeg > 0 ? "Above Horizon" : "Night Twilight"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5">
              <span>{activeLux.toLocaleString()}</span>
              <span className="text-xs text-amber-400 font-sans">lux</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Elevation: <strong className="text-amber-300">{solarAngleDeg.toFixed(1)}°</strong> • UV: <strong className="text-amber-300">{context?.uv_index || 4.2}</strong>
            </p>
          </div>

          {/* Graphical Solar Arc Dial */}
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-amber-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${solarGaugePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>-25° (Dusk)</span>
              <span>Horizon 0°</span>
              <span>+85° (Zenith)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Road Friction & Precipitation Meter */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 border border-cyan-500/30 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>ROAD FRICTION (μ)</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              roadFrictionMu < 0.5 
                ? "bg-rose-950 text-rose-300 border-rose-500/40" 
                : "bg-cyan-950 text-cyan-300 border-cyan-500/30"
            }`}>
              {roadFrictionMu < 0.5 ? "SLIP DANGER" : "HIGH TRACTION"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5">
              <span>μ = {roadFrictionMu}</span>
              <span className="text-xs text-cyan-400 font-sans">({activeRain} mm/h)</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Traction Loss: <strong className="text-cyan-300">-{frictionDropPct}%</strong> • Rain: <strong className="text-cyan-300">{activeRain > 0 ? "Wet Pavement" : "Dry"}</strong>
            </p>
          </div>

          {/* Friction bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className={`h-full transition-all duration-500 ${
                  roadFrictionMu < 0.5 ? "bg-rose-500" : "bg-gradient-to-r from-amber-500 to-cyan-400"
                }`}
                style={{ width: `${Math.round((roadFrictionMu / 0.85) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.32 (Ice/Mud)</span>
              <span>0.55 (Wet)</span>
              <span>0.85 (Dry)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Air Quality & Thermal Inhalation */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 border border-emerald-500/30 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <Wind className="w-4 h-4 text-emerald-400" />
              <span>AIR QUALITY & HEAT</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              OPTIMAL
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5">
              <span>{context?.air_quality_aqi || 42}</span>
              <span className="text-xs text-emerald-400 font-sans">AQI</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Temp: <strong className="text-emerald-300">{context?.temperature_c || 28.5}°C</strong> • Humid: <strong className="text-emerald-300">{context?.humidity_pct || 58}%</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${Math.min(100, Math.round(((context?.air_quality_aqi || 42) / 150) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0 (Pristine)</span>
              <span>50 (Good)</span>
              <span>150 (Unhealthy)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Crowd Dynamics & Urban Acoustic Noise */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 border border-violet-500/30 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-violet-400">
              <Volume2 className="w-4 h-4 text-violet-400" />
              <span>URBAN SOUND & CROWD</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
              CAMPUS/STREET
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5">
              <span>{context?.decibel_ambient_db || 52}</span>
              <span className="text-xs text-violet-400 font-sans">dB</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Density: <strong className="text-violet-300">{Math.round((context?.crowd_density_index || 0.38) * 100)}%</strong> • Wind: <strong className="text-violet-300">{context?.wind_speed_kmh || 9.2} km/h</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                style={{ width: `${Math.min(100, Math.round(((context?.decibel_ambient_db || 52) / 90) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>30 dB (Quiet)</span>
              <span>60 dB (Street)</span>
              <span>90 dB (Siren)</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          DYNAMIC ARRIVAL TIMELINE SIMULATOR (Solves Temporal Skew)
      ========================================================= */}
      <div className="bg-slate-950 text-white border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Time-Dependent Segment Arrival Simulator (t_arrival = t0 + Σ Δt_k)</span>
            </div>
            <p className="text-xs text-slate-400">
              SafePath-AI innovation: Evaluates lighting and weather at the <em>exact arrival time</em> at each corridor rather than departure timestamp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800 font-bold">
              +{simMinutesAhead} mins into trip
            </span>
            {simMinutesAhead > 0 && (
              <button
                onClick={() => setSimMinutesAhead(0)}
                className="text-xs font-mono text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset t0
              </button>
            )}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={simMinutesAhead}
            onChange={(e) => setSimMinutesAhead(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {/* 4 Timeline Checkpoint Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { label: "Departure (t0)", minutes: 0, lux: baseLux, rain: baseRain },
              { label: "Segment #2 (+15m)", minutes: 15, lux: Math.max(8, baseLux - 270), rain: +(baseRain + 1.2).toFixed(1) },
              { label: "Segment #4 (+30m)", minutes: 30, lux: Math.max(8, baseLux - 540), rain: +(baseRain + 2.8).toFixed(1) },
              { label: "Destination (+45m)", minutes: 45, lux: Math.max(8, baseLux - 810), rain: +(baseRain + 4.2).toFixed(1) },
            ].map((step, idx) => {
              const isCurrent = simMinutesAhead >= step.minutes && (idx === 3 || simMinutesAhead < [15, 30, 45, 60][idx]);
              return (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent 
                      ? "bg-cyan-950/70 border-cyan-500 shadow-lg shadow-cyan-500/10 text-white" 
                      : "bg-slate-900/60 border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold pb-1 mb-1 border-b border-slate-800/80">
                    <span className={isCurrent ? "text-cyan-300" : "text-slate-300"}>{step.label}</span>
                    <span className="text-[10px]">{step.lux < 50 ? "🌙 Night" : "☀️ Day"}</span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div>Lux: <strong className="text-amber-300">{step.lux} lx</strong></div>
                    <div>Precip: <strong className="text-cyan-300">{step.rain} mm/h</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          INTERACTIVE MICROCLIMATE SIMULATOR
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Environmental Stress Override Sandbox</span>
          </div>
          {(simRain !== null || simLux !== null) && (
            <button
              onClick={() => {
                setSimRain(null);
                setSimLux(null);
              }}
              className="text-[11px] font-mono text-blue-600 hover:underline cursor-pointer"
            >
              Reset to Live Sensors
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Simulate Downpour Intensity</span>
              <span className="font-mono font-bold text-blue-600">{activeRain.toFixed(1)} mm/h</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="40.0"
              step="1.0"
              value={activeRain}
              onChange={(e) => setSimRain(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Simulate Ambient Illumination</span>
              <span className="font-mono font-bold text-amber-600">{activeLux} lux</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={activeLux}
              onChange={(e) => setSimLux(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          ACTIVE GEOSPATIAL HAZARD RADAR FEED
      ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Active Geospatial Hazards & Blackspots in Region ({incidents.length})</span>
          </h2>
          <span className="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Real-Time Radar
          </span>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">No severe municipal hazard alerts in this active corridor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    inc.severity === "CRITICAL" 
                      ? "bg-rose-100 text-rose-700 border border-rose-300"
                      : "bg-amber-100 text-amber-700 border border-amber-300"
                  }`}>
                    {inc.severity} HAZARD
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Radius: {inc.radius_m || 30}m
                  </span>
                </div>

                <p className="font-semibold text-slate-900">{inc.description}</p>

                {inc.coordinate && (
                  <p className="text-[10px] font-mono text-slate-500">
                    Location: {inc.coordinate.lat.toFixed(4)}°N, {inc.coordinate.lon.toFixed(4)}°E
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
