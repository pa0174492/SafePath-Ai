"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Navigation, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Radio, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  Flame, 
  Hospital, 
  Building2, 
  CheckCircle2, 
  PhoneCall, 
  Share2, 
  Activity, 
  Footprints, 
  Eye, 
  ChevronRight, 
  Bell, 
  Sparkles,
  ArrowRight,
  Maximize2
} from "lucide-react";
import { 
  fetchNearestSafeHavens, 
  triggerSOSAlert, 
  fetchSafeHavens, 
  SafeHaven, 
  Coordinate 
} from "@/lib/api";

// Sound synthesis using Web Audio API (Zero external assets needed)
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playRadarPing() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  playWarningChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = "sawtooth";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(520, now);
      osc2.frequency.setValueAtTime(650, now);
      osc1.frequency.setValueAtTime(440, now + 0.2);
      osc2.frequency.setValueAtTime(550, now + 0.2);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {}
  }

  playSiren() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      
      // Siren wobble
      for (let i = 0; i < 4; i++) {
        osc.frequency.setValueAtTime(700, now + i * 0.4);
        osc.frequency.linearRampToValueAtTime(1100, now + i * 0.4 + 0.2);
        osc.frequency.linearRampToValueAtTime(700, now + i * 0.4 + 0.4);
      }
      
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.6);
    } catch (e) {}
  }
}

const soundSynth = new SoundSynthesizer();

interface RoutePoint {
  lat: number;
  lon: number;
  name: string;
  isLit: boolean;
}

interface NearbyThreat {
  id: string;
  name: string;
  type: "BLACKSPOT" | "UNLIT_STREET" | "HAZARD";
  distanceMeters: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  description: string;
  mitigation: string;
}

export default function RouteGuardianPage() {
  const [cityTag, setCityTag] = useState("warangal_kits");
  const [isWalking, setIsWalking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [useDeviceGps, setUseDeviceGps] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0); // 0 to 100%
  const [currentSpeed, setCurrentSpeed] = useState(4.2); // km/h
  const [currentLux, setCurrentLux] = useState(45);
  const [activeThreats, setActiveThreats] = useState<NearbyThreat[]>([]);
  const [nearestHavens, setNearestHavens] = useState<SafeHaven[]>([]);
  const [loadingHavens, setLoadingHavens] = useState(false);
  
  // LifeGuard Safety Check-in states
  const [checkInIntervalMin, setCheckInIntervalMin] = useState(2);
  const [secondsUntilCheckIn, setSecondsUntilCheckIn] = useState(120);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInGraceSeconds, setCheckInGraceSeconds] = useState(30);

  // SOS Emergency States
  const [sosActive, setSosActive] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosResponse, setSosResponse] = useState<any>(null);

  // Pre-configured route waypoints for selected city
  const cityConfigs: Record<string, {
    name: string;
    origin: string;
    dest: string;
    coords: RoutePoint[];
    blackspots: { id: string; name: string; lat: number; lon: number; severity: "CRITICAL" | "HIGH"; desc: string; mit: string }[];
  }> = {
    warangal_kits: {
      name: "Warangal (KITS Campus & Yerragattu Hill)",
      origin: "KITS Entrance Gate, Warangal",
      dest: "KITS Central Library & Research Center",
      coords: [
        { lat: 18.05418, lon: 79.53575, name: "KITS Main Gate Entrance", isLit: true },
        { lat: 18.05480, lon: 79.53630, name: "Campus Administration Corridor", isLit: true },
        { lat: 18.05540, lon: 79.53690, name: "West Access Turn (Near Yerragattu Blind Curve)", isLit: false },
        { lat: 18.05600, lon: 79.53740, name: "Civil & Mech Workshop Walkway", isLit: true },
        { lat: 18.05650, lon: 79.53780, name: "KITS Central Library Quadrangle", isLit: true }
      ],
      blackspots: [
        {
          id: "bs-wgl-01",
          name: "Parkal Road Blind Curve (MoRTH TS-WGL-04)",
          lat: 18.0556,
          lon: 79.5372,
          severity: "CRITICAL",
          desc: "Uncontrolled blind curve with heavy transit freight and student crossing spike.",
          mit: "Use the protected western illuminated sidewalk; do not cross at the apex."
        },
        {
          id: "bs-wgl-02",
          name: "Yerragattu Hill Crest High-Speed Zone",
          lat: 18.0580,
          lon: 79.5385,
          severity: "HIGH",
          desc: "Steep crest gradient with high-speed commuter two-wheelers.",
          mit: "Maintain 1.5m buffer from carriage edge."
        }
      ]
    },
    warangal_ku: {
      name: "Warangal (Kakatiya University Campus)",
      origin: "KU Main Entrance Arch, NH-163",
      dest: "University Administrative Building",
      coords: [
        { lat: 18.0195, lon: 79.5532, name: "KU Main Gate", isLit: true },
        { lat: 18.0210, lon: 79.5515, name: "University Library Avenue", isLit: true },
        { lat: 18.0230, lon: 79.5495, name: "North Perimeter Lane", isLit: false },
        { lat: 18.0250, lon: 79.5475, name: "Administrative Quadrangle", isLit: true }
      ],
      blackspots: [
        {
          id: "bs-ku-01",
          name: "KU Bypass Highway Junction",
          lat: 18.0215,
          lon: 79.5520,
          severity: "CRITICAL",
          desc: "High fatality intersection connecting Hanamkonda & Parkal bypass.",
          mit: "Cross strictly under signalized green phase at pedestrian box."
        }
      ]
    },
    hyderabad: {
      name: "Hyderabad (HITEC City Cyber Corridor)",
      origin: "HITEC City Cyber Towers Crossroad",
      dest: "Mindspace Tech Park Pedestrian Walkway",
      coords: [
        { lat: 17.4435, lon: 78.3772, name: "Cyber Towers Junction", isLit: true },
        { lat: 17.4420, lon: 78.3800, name: "Inorbit Mall Access Road", isLit: true },
        { lat: 17.4395, lon: 78.3825, name: "Durgam Cheruvu Connector", isLit: false },
        { lat: 17.4380, lon: 78.3850, name: "Mindspace West Gate", isLit: true }
      ],
      blackspots: [
        {
          id: "bs-hyd-01",
          name: "Cyber Towers Flyover Merge",
          lat: 17.4440,
          lon: 78.3780,
          severity: "HIGH",
          desc: "Blind spot under metro viaduct with rapid lane cutting.",
          mit: "Stick to grade-separated elevated skywalk."
        }
      ]
    },
    bengaluru: {
      name: "Bengaluru (MG Road & Brigade Cross)",
      origin: "MG Road Metro Concourse",
      dest: "Cubbon Park North Pavilion",
      coords: [
        { lat: 12.9716, lon: 77.5946, name: "MG Road Station Concourse", isLit: true },
        { lat: 12.9730, lon: 77.5970, name: "Brigade Road Crossing", isLit: true },
        { lat: 12.9750, lon: 77.5990, name: "Kasturba Road Edge", isLit: false },
        { lat: 12.9770, lon: 77.6010, name: "Cubbon Park Entrance", isLit: true }
      ],
      blackspots: [
        {
          id: "bs-blr-01",
          name: "Brigade Road Rapid Crossing",
          lat: 12.9735,
          lon: 77.5975,
          severity: "CRITICAL",
          desc: "Dense traffic with narrow curbside refuges.",
          mit: "Use subway passage under MG Road."
        }
      ]
    },
    delhi: {
      name: "New Delhi (Connaught Place Inner Circle)",
      origin: "Rajiv Chowk Metro Gate 7",
      dest: "Barakhamba Road Arcade",
      coords: [
        { lat: 28.6139, lon: 77.2090, name: "Janpath Entrance", isLit: true },
        { lat: 28.6200, lon: 77.2140, name: "Radial Road 4 Arcade", isLit: true },
        { lat: 28.6250, lon: 77.2190, name: "Outer Circle Crossing", isLit: false },
        { lat: 28.6300, lon: 77.2240, name: "Barakhamba Terminal", isLit: true }
      ],
      blackspots: [
        {
          id: "bs-del-01",
          name: "Outer Circle High-Speed Merge",
          lat: 28.6260,
          lon: 77.2200,
          severity: "CRITICAL",
          desc: "Unsignalized multilane arterial with night heavy truck entry.",
          mit: "Use pedestrian underpass."
        }
      ]
    }
  };

  const currentConfig = cityConfigs[cityTag] || cityConfigs.warangal_kits;

  // Calculate current interpolated pedestrian position
  const getInterpolatedCoord = useCallback((pct: number): Coordinate => {
    const coords = currentConfig.coords;
    if (pct <= 0) return { lat: coords[0].lat, lon: coords[0].lon };
    if (pct >= 100) return { lat: coords[coords.length - 1].lat, lon: coords[coords.length - 1].lon };
    
    const segmentCount = coords.length - 1;
    const totalProg = (pct / 100.0) * segmentCount;
    const segIdx = Math.min(Math.floor(totalProg), segmentCount - 1);
    const segFrac = totalProg - segIdx;
    
    const p1 = coords[segIdx];
    const p2 = coords[segIdx + 1];
    return {
      lat: p1.lat + (p2.lat - p1.lat) * segFrac,
      lon: p1.lon + (p2.lon - p1.lon) * segFrac
    };
  }, [currentConfig]);

  const currentCoord = getInterpolatedCoord(walkProgress);

  // Haversine distance helper
  const haversineDistMeters = (c1: Coordinate, c2: Coordinate) => {
    const R = 6371000;
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLon = ((c2.lon - c1.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Load Safe Havens near current position
  const refreshHavens = async () => {
    setLoadingHavens(true);
    try {
      const res = await fetchNearestSafeHavens(currentCoord.lat, currentCoord.lon, 6000, cityTag);
      setNearestHavens(res.nearest_safe_havens);
    } catch (e) {
      console.warn("Haven fetch error:", e);
    } finally {
      setLoadingHavens(false);
    }
  };

  useEffect(() => {
    refreshHavens();
  }, [cityTag]);

  // Real-time threat calculation relative to current position
  useEffect(() => {
    const detected: NearbyThreat[] = [];

    // Check accident blackspots
    currentConfig.blackspots.forEach((bs) => {
      const dist = Math.round(haversineDistMeters(currentCoord, { lat: bs.lat, lon: bs.lon }));
      if (dist <= 250) {
        detected.push({
          id: bs.id,
          name: bs.name,
          type: "BLACKSPOT",
          distanceMeters: dist,
          severity: bs.severity,
          description: bs.desc,
          mitigation: bs.mit
        });
      }
    });

    // Check lighting along current segment
    const segmentCount = currentConfig.coords.length - 1;
    const segIdx = Math.min(Math.floor((walkProgress / 100.0) * segmentCount), segmentCount);
    const activePt = currentConfig.coords[segIdx];
    if (activePt && !activePt.isLit) {
      detected.push({
        id: "threat-light",
        name: "Unlit Street Section / Broken Luminaire Corridor",
        type: "UNLIT_STREET",
        distanceMeters: 0,
        severity: "HIGH",
        description: "Zero municipal lighting recorded. Blind corners and low surveillance.",
        mitigation: "Activate mobile flashlight and stay close to primary roadway curb."
      });
      setCurrentLux(12);
    } else {
      setCurrentLux(85);
    }

    detected.sort((a, b) => a.distanceMeters - b.distanceMeters);
    setActiveThreats(detected);

    // Audio chime if critical threat within 80m
    const immediateDanger = detected.find(d => d.distanceMeters < 80);
    if (immediateDanger && soundEnabled) {
      soundSynth.playRadarPing();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
    }
  }, [walkProgress, cityTag, currentCoord, soundEnabled]);

  // Real-Time Simulation Interval
  useEffect(() => {
    if (!isWalking) return;
    const timer = setInterval(() => {
      setWalkProgress((prev) => {
        if (prev >= 100) {
          setIsWalking(false);
          if (soundEnabled) soundSynth.playRadarPing();
          return 100;
        }
        // Advance by ~1.5% per tick (~3 meters)
        return Math.min(100, prev + 1.2);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWalking, soundEnabled]);

  // LifeGuard Safety Check-in Timer Loop
  useEffect(() => {
    if (!isWalking) return;
    const checkInTimer = setInterval(() => {
      setSecondsUntilCheckIn((prev) => {
        if (prev <= 1) {
          // Open Check-in Modal
          setCheckInModalOpen(true);
          setCheckInGraceSeconds(30);
          if (soundEnabled) soundSynth.playWarningChime();
          return checkInIntervalMin * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(checkInTimer);
  }, [isWalking, checkInIntervalMin, soundEnabled]);

  // Check-In Grace Countdown (Auto SOS trigger if ignored)
  useEffect(() => {
    if (!checkInModalOpen) return;
    const graceTimer = setInterval(() => {
      setCheckInGraceSeconds((prev) => {
        if (prev <= 1) {
          // Auto trigger SOS!
          handleTriggerSOS("UNRESPONSIVE_CHECKIN");
          setCheckInModalOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(graceTimer);
  }, [checkInModalOpen]);

  // Device GPS Watcher (if requested)
  useEffect(() => {
    if (!useDeviceGps || typeof window === "undefined" || !("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // In device mode, progress isn't synthetic
        setCurrentSpeed(Math.round((pos.coords.speed || 1.2) * 3.6));
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [useDeviceGps]);

  // Trigger SOS Beacon
  const handleTriggerSOS = async (type: string = "PANIC_SOS") => {
    setSosActive(true);
    setSosModalOpen(true);
    if (soundEnabled) soundSynth.playSiren();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 800]);
    }

    try {
      const res = await triggerSOSAlert({
        user_name: "SafePath Pedestrian",
        coordinate: currentCoord,
        city_tag: cityTag,
        emergency_type: type as any,
        battery_percentage: 78
      });
      setSosResponse(res);
    } catch (e) {
      console.error("SOS failed:", e);
    }
  };

  const handleAcknowledgeSafe = () => {
    setCheckInModalOpen(false);
    setSecondsUntilCheckIn(checkInIntervalMin * 60);
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Remaining ETA Calculation
  const totalMeters = 750;
  const remainingMeters = Math.max(0, Math.round(totalMeters * (1 - walkProgress / 100.0)));
  const remainingMin = Math.max(1, Math.round(remainingMeters / (1.16 * 60)));

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-Time Guardian Status */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Subtle animated background radar pulse */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        {sosActive && (
          <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-none" />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
              sosActive 
                ? "bg-red-600 animate-bounce" 
                : isWalking 
                  ? "bg-emerald-600 shadow-emerald-500/20" 
                  : "bg-blue-600 shadow-blue-500/20"
            }`}>
              {sosActive ? (
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Shield className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight">
                  Route Guardian: Real-Time Pedestrian Safety Watch
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  sosActive
                    ? "bg-red-500 text-white animate-pulse"
                    : isWalking 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isWalking ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`} />
                  {sosActive ? "EMERGENCY SOS ACTIVE" : isWalking ? "LIVE ROUTE MONITORING" : "STANDBY"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Active Proximity Radar • Dead-Man LifeGuard Timer • High-Risk Blackspot Alerts
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Audible Radar Chimes" : "Enable Audible Radar Chimes"}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                soundEnabled 
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                  : "bg-slate-800/50 border-slate-800 text-slate-500"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* City Hub Preset Selector */}
            <select
              value={cityTag}
              onChange={(e) => {
                setCityTag(e.target.value);
                setWalkProgress(0);
                setIsWalking(false);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="warangal_kits">🎓 KITS College (Warangal)</option>
              <option value="warangal_ku">🏛️ Kakatiya Univ (Warangal)</option>
              <option value="hyderabad">🏙️ Hyderabad (Cyberabad)</option>
              <option value="bengaluru">🌆 Bengaluru (Central)</option>
              <option value="delhi">🏛️ New Delhi (Central)</option>
            </select>

            {/* Walk Simulation / Live Toggle */}
            <button
              onClick={() => setIsWalking(!isWalking)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                isWalking
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              }`}
            >
              {isWalking ? (
                <>
                  <Pause className="w-4 h-4" /> Pause Walk
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Safe Walk
                </>
              )}
            </button>

            {/* Instant 1-Tap SOS Panic Button */}
            <button
              onClick={() => handleTriggerSOS("PANIC_SOS")}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all border border-red-500/40 active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              PANIC SOS
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry HUD + Interactive Live Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Telemetry & Threat Radar (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-Time Telemetry Dashboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Pedestrian Telemetry HUD
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>GPS:</span>
                <span className="font-semibold text-slate-800">
                  {currentCoord.lat.toFixed(5)}, {currentCoord.lon.toFixed(5)}
                </span>
              </div>
            </div>

            {/* Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Walking Speed
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold font-mono text-slate-900">{currentSpeed}</span>
                  <span className="text-[11px] font-semibold text-slate-500">km/h</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">Pacing Normal</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Distance to Dest
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold font-mono text-slate-900">{remainingMeters}</span>
                  <span className="text-[11px] font-semibold text-slate-500">meters</span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold block">ETA ~{remainingMin} min</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ambient Lux (Light)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold font-mono text-slate-900">{currentLux}</span>
                  <span className="text-[11px] font-semibold text-slate-500">lux</span>
                </div>
                <span className={`text-[10px] font-bold block ${
                  currentLux < 30 ? "text-rose-600 font-bold" : "text-emerald-600"
                }`}>
                  {currentLux < 30 ? "⚠️ Darkness Risk" : "Illuminated"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  LifeGuard Timer
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-extrabold font-mono ${
                    secondsUntilCheckIn < 30 ? "text-rose-600 animate-pulse" : "text-slate-900"
                  }`}>
                    {formatMinSec(secondsUntilCheckIn)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">Until Safety Check</span>
              </div>
            </div>

            {/* Route Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-blue-600" />
                  Route Progress along Pareto Safe Path
                </span>
                <span className="font-mono text-blue-600 font-bold">{Math.round(walkProgress)}% Completed</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 relative"
                  style={{ width: `${walkProgress}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="truncate max-w-[200px]">{currentConfig.origin}</span>
                <span className="truncate max-w-[200px] text-right">{currentConfig.dest}</span>
              </div>
            </div>
          </div>

          {/* Real-Time Proximity Threat Radar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className={`w-4 h-4 ${activeThreats.length > 0 ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Real-Time Proximity Threat & Blackspot Radar
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                activeThreats.length > 0 
                  ? "bg-red-50 text-red-700 border border-red-200" 
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {activeThreats.length} THREATS WITHIN 250M
              </span>
            </div>

            {activeThreats.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center space-x-3 text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">Clear Perimeter</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    No active accident blackspots or unlit street corridors within 250 meters of your current position.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeThreats.map((threat) => (
                  <div
                    key={threat.id}
                    className={`p-4 rounded-xl border transition-all ${
                      threat.distanceMeters <= 80
                        ? "bg-red-50/70 border-red-200 shadow-xs"
                        : "bg-amber-50/50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          threat.severity === "CRITICAL"
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-amber-600 text-white"
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{threat.name}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/80 border text-slate-700">
                              {threat.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            {threat.description}
                          </p>
                          <div className="mt-2 text-[10px] font-semibold text-blue-700 bg-white/60 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            <span>Recommended: {threat.mitigation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-extrabold font-mono text-slate-900 block">
                          {threat.distanceMeters}m
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Proximity</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Safe Havens & LifeGuard Config (1 Col) */}
        <div className="space-y-6">
          {/* LifeGuard Dead-Man Check-In Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  LifeGuard Safety Check-in
                </h3>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Automatic dead-man monitor. If you are unresponsive during solo travel, emergency contacts and campus security are dispatched.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 block">
                Safety Check Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 5].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setCheckInIntervalMin(mins);
                      setSecondsUntilCheckIn(mins * 60);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      checkInIntervalMin === mins
                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* Test Check-in trigger */}
            <button
              onClick={() => {
                setCheckInModalOpen(true);
                setCheckInGraceSeconds(30);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500" /> Test Check-in Prompt
            </button>
          </div>

          {/* Nearest 24/7 Verified Safe Havens */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Nearest Safe Havens
                </h3>
              </div>
              <Link
                href="/safehavens"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingHavens ? (
              <div className="py-6 text-center text-xs text-slate-400 font-mono">
                Locating 24/7 shelters...
              </div>
            ) : nearestHavens.length === 0 ? (
              <div className="py-4 text-xs text-slate-500 text-center">
                No safe havens found within 6km.
              </div>
            ) : (
              <div className="space-y-3">
                {nearestHavens.slice(0, 3).map((haven) => (
                  <div
                    key={haven.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                          {haven.type === "HOSPITAL_EMERGENCY" ? (
                            <Hospital className="w-3.5 h-3.5" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{haven.name}</h4>
                          <span className="text-[10px] text-slate-500 block">{haven.address}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold font-mono text-blue-600">
                          {haven.distance_m || 300}m
                        </span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          ~{haven.estimated_walking_min || 3} min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                      <a
                        href={`tel:${haven.emergency_phone.split("/")[0].trim()}`}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" /> Call {haven.emergency_phone.split("/")[0].trim()}
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${haven.coordinate.lat},${haven.coordinate.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        Navigate <Navigation className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LifeGuard Confirmation Modal */}
      {checkInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center font-bold">
                <Bell className="w-6 h-6 stroke-[2.5] animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  LifeGuard Safety Check-in
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Periodic security confirmation
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you walking safely? Please confirm your status. If no response within{" "}
              <span className="font-bold text-red-600 font-mono text-sm">{checkInGraceSeconds}s</span>,
              an emergency SOS beacon will be broadcast to national helplines and your designated contacts.
            </p>

            {/* Grace countdown bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                style={{ width: `${(checkInGraceSeconds / 30) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAcknowledgeSafe}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" /> I Am Safe
              </button>

              <button
                onClick={() => {
                  setCheckInModalOpen(false);
                  handleTriggerSOS("PANIC_SOS");
                }}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
              >
                <ShieldAlert className="w-4 h-4" /> Need Help (SOS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Activated Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-500 space-y-5 animate-in zoom-in duration-200">
            <div className="flex items-center space-x-3.5 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 stroke-[2.5] animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  🚨 EMERGENCY SOS BROADCAST ACTIVE
                </h3>
                <span className="text-xs text-red-600 font-bold font-mono">
                  DISPATCHED TO EMERGENCY RESPONDER NETWORK
                </span>
              </div>
            </div>

            {sosResponse ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Alert ID:</span>
                    <span className="font-bold text-slate-900">{sosResponse.alert_id}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GPS Coordinates:</span>
                    <span className="font-bold text-slate-900">
                      {currentCoord.lat.toFixed(5)}, {currentCoord.lon.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Nearest Refuge:</span>
                    <span className="font-bold text-blue-600">
                      {sosResponse.nearest_shelter?.name}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs leading-relaxed">
                  <strong>Emergency Hotline 112:</strong> Immediate PCR patrol van and ambulance alerted. Keep your phone screen illuminated.
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href={sosResponse.whatsapp_share_url}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <Share2 className="w-4 h-4" /> Share on WhatsApp
                  </a>

                  <a
                    href="tel:112"
                    className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
                  >
                    <PhoneCall className="w-4 h-4" /> Call 112 Direct
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                Transmitting emergency packet...
              </div>
            )}

            <button
              onClick={() => {
                setSosModalOpen(false);
                setSosActive(false);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Close Emergency Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
