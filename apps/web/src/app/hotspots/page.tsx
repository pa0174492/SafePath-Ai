"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";


import { 
  AlertTriangle, 
  Radio, 
  Shield,
  ShieldAlert, 
  ShieldCheck, 
  Navigation, 
  Layers, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  RotateCw, 
  Flame, 
  Activity, 
  Sliders, 
  MapPin, 
  Clock, 
  CloudRain, 
  Sun, 
  Moon, 
  ChevronRight, 
  Info, 
  Zap, 
  Filter, 
  CheckCircle2,
  X,
  Compass,
  ArrowRight
} from "lucide-react";

interface Coordinate {
  lat: number;
  lon: number;
}

interface CollisionStats {
  pedestrian: number;
  two_wheeler: number;
  four_wheeler: number;
  heavy_vehicle: number;
  fatalities: number;
  severe_injuries: number;
  total_accidents_annual: number;
}

interface AccidentHotspot {
  id: string;
  name: string;
  city_tag: string;
  coordinate: Coordinate;
  radius_m: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  kde_density_score: number;
  dbscan_cluster_id: string;
  morth_blackspot_code?: string;
  collision_stats: CollisionStats;
  peak_danger_hours: string;
  weather_sensitivity: string;
  road_geometry: string;
  contributing_factors: string[];
  recommended_mitigations: string[];
  pulse_speed_sec: number;
  created_by_user?: boolean;
}

interface StreamingAlert {
  alert_id: string;
  timestamp: string;
  hotspot_id: string;
  hotspot_name: string;
  severity: string;
  event_type: string;
  confidence: number;
  description: string;
  speed_drop_kmh?: number;
}

interface AvoidanceSimulationResult {
  status: string;
  intercepted_blackspots_count: number;
  intercepted_blackspots: string[];
  naive_direct_route: {
    name: string;
    distance_m: number;
    travel_time_min: number;
    accident_exposure_score: number;
    blackspot_traversals: number;
    path_risk_label: string;
    coordinates: Coordinate[];
  };
  safepath_avoidance_route: {
    name: string;
    distance_m: number;
    travel_time_min: number;
    accident_exposure_score: number;
    blackspot_traversals: number;
    path_risk_label: string;
    coordinates: Coordinate[];
  };
  tradeoff_summary: {
    risk_reduction_pct: number;
    added_time_min: number;
    added_distance_m: number;
    verdict: string;
  };
}

const CITY_HUBS = [
  { tag: "warangal_kits", name: "KITS College (Warangal)", lat: 18.0550, lon: 79.5365, zoom: 16 },
  { tag: "warangal_ku", name: "Kakatiya Univ (Warangal)", lat: 18.0195, lon: 79.5540, zoom: 16 },
  { tag: "hyderabad", name: "Hyderabad Cyberabad", lat: 17.4450, lon: 78.3790, zoom: 15 },
  { tag: "bengaluru", name: "Bengaluru Tech Corridor", lat: 12.9200, lon: 77.6220, zoom: 15 },
  { tag: "delhi", name: "New Delhi Ring Road", lat: 28.7250, lon: 77.1620, zoom: 15 },
];

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<AccidentHotspot[]>([]);
  const [selectedCity, setSelectedCity] = useState("warangal_kits");
  const [selectedHotspot, setSelectedHotspot] = useState<AccidentHotspot | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Radio Wave & Map Visualization Controls
  const [showWaves, setShowWaves] = useState(true);
  const [showRadiusCircles, setShowRadiusCircles] = useState(true);
  const [timeContext, setTimeContext] = useState<"day" | "dusk" | "night">("night");
  const [weatherCondition, setWeatherCondition] = useState<"clear" | "rain">("clear");

  // User "Define Hotspot on Map" state
  const [isDefiningOnMap, setIsDefiningOnMap] = useState(false);
  const [newHotspotCoords, setNewHotspotCoords] = useState<Coordinate | null>(null);
  const [newHotspotName, setNewHotspotName] = useState("");
  const [newHotspotSeverity, setNewHotspotSeverity] = useState<"CRITICAL" | "HIGH" | "MODERATE">("HIGH");
  const [newHotspotRadius, setNewHotspotRadius] = useState<number>(140);
  const [newHotspotGeometry, setNewHotspotGeometry] = useState("Blind Curve / High-Speed Lane");
  const [newHotspotNotes, setNewHotspotNotes] = useState("");
  const [isSavingHotspot, setIsSavingHotspot] = useState(false);

  // Streaming Telemetry Feed
  const [streamActive, setStreamActive] = useState(true);
  const [streamingAlerts, setStreamingAlerts] = useState<StreamingAlert[]>([]);

  // Avoidance Simulation
  const [isSimulatingAvoidance, setIsSimulatingAvoidance] = useState(false);
  const [simulationResult, setSimulationResult] = useState<AvoidanceSimulationResult | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const circlesLayerRef = useRef<any>(null);
  const routesLayerRef = useRef<any>(null);
  const tempMarkerRef = useRef<any>(null);

  // Fetch hotspots from API
  const fetchHotspots = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8000/api/v1/hotspots?city_tag=${selectedCity}`);
      if (res.ok) {
        const data = await res.json();
        setHotspots(data);
        if (data.length > 0 && !selectedHotspot) {
          setSelectedHotspot(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load hotspots:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, selectedHotspot]);

  // Fetch streaming telemetry
  const fetchStreamingAlerts = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/hotspots/stream");
      if (res.ok) {
        const data = await res.json();
        setStreamingAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch stream:", err);
    }
  }, []);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  // Streaming interval
  useEffect(() => {
    fetchStreamingAlerts();
    if (!streamActive) return;
    const interval = setInterval(() => {
      fetchStreamingAlerts();
    }, 4500);
    return () => clearInterval(interval);
  }, [streamActive, fetchStreamingAlerts]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!leafletMapRef.current) {
        const currentHub = CITY_HUBS.find((h) => h.tag === selectedCity) || CITY_HUBS[0];
        const map = L.map(mapContainerRef.current, {
          center: [currentHub.lat, currentHub.lon],
          zoom: currentHub.zoom,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Standard OpenStreetMap Tiles (verified 100% working)
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        const circlesLayer = L.layerGroup().addTo(map);
        const routesLayer = L.layerGroup().addTo(map);

        markersLayerRef.current = markersLayer;
        circlesLayerRef.current = circlesLayer;
        routesLayerRef.current = routesLayer;
        leafletMapRef.current = map;

        // Map click handler for user-defined hotspots
        map.on("click", (e: any) => {
          window.dispatchEvent(new CustomEvent("safepath:map_clicked_hotspot", { 
            detail: { lat: e.latlng.lat, lon: e.latlng.lng } 
          }));
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  // Listen for map click during "Define on Map" mode
  useEffect(() => {
    const handleMapClick = (e: any) => {
      if (!isDefiningOnMap) return;
      const { lat, lon } = e.detail;
      setNewHotspotCoords({ lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lon.toFixed(6)) });

      // Drop temporary preview marker
      import("leaflet").then((L) => {
        if (!leafletMapRef.current) return;
        if (tempMarkerRef.current) {
          leafletMapRef.current.removeLayer(tempMarkerRef.current);
        }
        const tempIcon = L.divIcon({
          className: "temp-hotspot-pin",
          html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold animate-bounce">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        tempMarkerRef.current = L.marker([lat, lon], { icon: tempIcon }).addTo(leafletMapRef.current);
      });
    };

    window.addEventListener("safepath:map_clicked_hotspot", handleMapClick);
    return () => window.removeEventListener("safepath:map_clicked_hotspot", handleMapClick);
  }, [isDefiningOnMap]);

  // Update map center when city hub changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const hub = CITY_HUBS.find((h) => h.tag === selectedCity);
    if (hub) {
      leafletMapRef.current.setView([hub.lat, hub.lon], hub.zoom, { animate: true });
    }
  }, [selectedCity]);

  // Render Circular Radio Waves & Hotspots on Map
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current || !circlesLayerRef.current) return;

    import("leaflet").then((L) => {
      markersLayerRef.current.clearLayers();
      circlesLayerRef.current.clearLayers();

      const filtered = hotspots.filter((h) => {
        if (severityFilter !== "ALL" && h.severity !== severityFilter) return false;
        return true;
      });

      filtered.forEach((h) => {
        const isSelected = selectedHotspot?.id === h.id;

        // Color coding
        let waveColorClass = "wave-critical";
        let hexColor = "#ef4444";
        let glowColor = "rgba(239, 68, 68, 0.4)";
        let badgeBg = "bg-rose-500";

        if (h.severity === "HIGH") {
          waveColorClass = "wave-high";
          hexColor = "#f97316";
          glowColor = "rgba(249, 115, 22, 0.4)";
          badgeBg = "bg-amber-500";
        } else if (h.severity === "MODERATE") {
          waveColorClass = "wave-moderate";
          hexColor = "#eab308";
          glowColor = "rgba(234, 179, 8, 0.4)";
          badgeBg = "bg-yellow-500";
        } else if (h.severity === "LOW") {
          waveColorClass = "wave-low";
          hexColor = "#06b6d4";
          glowColor = "rgba(6, 182, 212, 0.4)";
          badgeBg = "bg-cyan-500";
        }

        // Pulse speed adjusted by time of day & weather
        let pulseDuration = h.pulse_speed_sec;
        if (timeContext === "night") pulseDuration *= 0.75; // Faster emergency pulse at night
        if (weatherCondition === "rain") pulseDuration *= 0.85;

        // 1. Geographic Hazard Buffer Circle
        if (showRadiusCircles) {
          const circle = L.circle([h.coordinate.lat, h.coordinate.lon], {
            radius: h.radius_m,
            color: hexColor,
            weight: isSelected ? 2.5 : 1.5,
            dashArray: "4, 6",
            fillColor: hexColor,
            fillOpacity: isSelected ? 0.18 : 0.08,
          });
          circle.on("click", () => setSelectedHotspot(h));
          circlesLayerRef.current.addLayer(circle);
        }

        // 2. Dynamic Circular Radio Waves (Radar Ripple Effect)
        if (showWaves) {
          const waveHtml = `
            <div class="radio-wave-wrapper ${waveColorClass} ${isSelected ? 'is-selected' : ''}" style="--pulse-speed: ${pulseDuration}s;">
              <div class="radio-ring ring-1"></div>
              <div class="radio-ring ring-2"></div>
              <div class="radio-ring ring-3"></div>
              <div class="beacon-core ${badgeBg} ${isSelected ? 'ring-4 ring-white shadow-2xl scale-125' : 'shadow-lg'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="beacon-label">${h.name.split(" ")[0]}</div>
            </div>
          `;

          const radioIcon = L.divIcon({
            className: "leaflet-radio-wave-marker",
            html: waveHtml,
            iconSize: [60, 60],
            iconAnchor: [30, 30],
          });

          const marker = L.marker([h.coordinate.lat, h.coordinate.lon], { icon: radioIcon });
          marker.on("click", () => {
            setSelectedHotspot(h);
            leafletMapRef.current.setView([h.coordinate.lat, h.coordinate.lon], 17, { animate: true });
          });
          markersLayerRef.current.addLayer(marker);
        }
      });
    });
  }, [hotspots, selectedHotspot, severityFilter, showWaves, showRadiusCircles, timeContext, weatherCondition]);

  // Render Avoidance Simulation Routes
  useEffect(() => {
    if (!leafletMapRef.current || !routesLayerRef.current) return;

    import("leaflet").then((L) => {
      routesLayerRef.current.clearLayers();

      if (!simulationResult) return;

      // 1. Naive Direct Route (Red dashed)
      const naiveCoords = simulationResult.naive_direct_route.coordinates.map((c) => [c.lat, c.lon] as [number, number]);
      const naiveLine = L.polyline(naiveCoords as any, {
        color: "#ef4444",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.8,
      }).addTo(routesLayerRef.current);

      // 2. Safe Avoidance Route (Emerald/Blue solid with glow)
      const avoidCoords = simulationResult.safepath_avoidance_route.coordinates.map((c) => [c.lat, c.lon] as [number, number]);
      const avoidLineGlow = L.polyline(avoidCoords as any, {
        color: "#38bdf8",
        weight: 8,
        opacity: 0.4,
      }).addTo(routesLayerRef.current);

      const avoidLine = L.polyline(avoidCoords as any, {
        color: "#2563eb",
        weight: 4.5,
        opacity: 0.95,
      }).addTo(routesLayerRef.current);

      // Pin A (Origin)
      const originCoord = naiveCoords[0];
      const pinAIcon = L.divIcon({
        className: "custom-pin",
        html: `<div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">A</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(originCoord as any, { icon: pinAIcon }).addTo(routesLayerRef.current);

      // Pin B (Destination)
      const destCoord = naiveCoords[naiveCoords.length - 1];
      const pinBIcon = L.divIcon({
        className: "custom-pin",
        html: `<div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">B</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(destCoord as any, { icon: pinBIcon }).addTo(routesLayerRef.current);

      // Fit bounds to show route
      const group = L.featureGroup([naiveLine, avoidLine]);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.2));
    });
  }, [simulationResult]);

  // Handle Save New Hotspot
  const handleCreateHotspot = async () => {
    if (!newHotspotCoords || !newHotspotName.trim()) {
      alert("Please enter a name and click on the map to define the location.");
      return;
    }

    try {
      setIsSavingHotspot(true);
      const payload = {
        name: newHotspotName.trim(),
        city_tag: selectedCity,
        coordinate: newHotspotCoords,
        radius_m: newHotspotRadius,
        severity: newHotspotSeverity,
        road_geometry: newHotspotGeometry,
        notes: newHotspotNotes.trim() || undefined,
      };

      const res = await fetch("http://localhost:8000/api/v1/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setHotspots([created, ...hotspots]);
        setSelectedHotspot(created);
        setIsDefiningOnMap(false);
        setNewHotspotCoords(null);
        setNewHotspotName("");
        if (tempMarkerRef.current && leafletMapRef.current) {
          leafletMapRef.current.removeLayer(tempMarkerRef.current);
          tempMarkerRef.current = null;
        }
      } else {
        alert("Failed to save hotspot on server.");
      }
    } catch (err) {
      console.error("Error creating hotspot:", err);
    } finally {
      setIsSavingHotspot(false);
    }
  };

  // Run Route Avoidance Simulation
  const handleRunAvoidanceSimulation = async () => {
    try {
      setIsSimulatingAvoidance(true);
      const hub = CITY_HUBS.find((h) => h.tag === selectedCity) || CITY_HUBS[0];
      
      // Select appropriate origin and destination across known blackspot
      let origin: Coordinate;
      let dest: Coordinate;

      if (selectedCity === "warangal_kits") {
        origin = { lat: 18.0538, lon: 79.5348 }; // KITS Gate
        dest = { lat: 18.0585, lon: 79.5395 };   // Beyond Blind Curve
      } else if (selectedCity === "warangal_ku") {
        origin = { lat: 18.0160, lon: 79.5510 };
        dest = { lat: 18.0240, lon: 79.5570 };
      } else {
        origin = { lat: hub.lat - 0.005, lon: hub.lon - 0.005 };
        dest = { lat: hub.lat + 0.005, lon: hub.lon + 0.005 };
      }

      const res = await fetch("http://localhost:8000/api/v1/hotspots/simulate-avoidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: dest,
          city_tag: selectedCity,
          avoid_hotspots: true,
          buffer_factor: 1.35,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      }
    } catch (err) {
      console.error("Error running simulation:", err);
    } finally {
      setIsSimulatingAvoidance(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Embedded Styles for Circular Radio Wave Animations */}
      <style jsx global>{`
        @keyframes radio-ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0.95;
          }
          40% {
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.8);
            opacity: 0;
          }
        }

        .radio-wave-wrapper {
          position: relative;
          width: 60px;
          height: 60px;
          cursor: pointer;
        }

        .radio-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          pointer-events: none;
        }

        .wave-critical .radio-ring {
          border: 2.5px solid #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }
        .wave-high .radio-ring {
          border: 2.5px solid #f97316;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
        }
        .wave-moderate .radio-ring {
          border: 2px solid #eab308;
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.4);
        }
        .wave-low .radio-ring {
          border: 1.5px solid #06b6d4;
        }

        .ring-1 {
          animation: radio-ripple var(--pulse-speed, 2s) infinite cubic-bezier(0.1, 0.6, 0.3, 1);
        }
        .ring-2 {
          animation: radio-ripple var(--pulse-speed, 2s) infinite cubic-bezier(0.1, 0.6, 0.3, 1) calc(var(--pulse-speed, 2s) * 0.33);
        }
        .ring-3 {
          animation: radio-ripple var(--pulse-speed, 2s) infinite cubic-bezier(0.1, 0.6, 0.3, 1) calc(var(--pulse-speed, 2s) * 0.66);
        }

        .beacon-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .beacon-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.85);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          margin-top: 2px;
        }

        .is-selected .beacon-core {
          transform: translate(-50%, -50%) scale(1.3);
          border: 2px solid #ffffff;
        }

        /* Leaflet tile preflight fix */
        .leaflet-container img,
        .leaflet-tile,
        .leaflet-tile-container img {
          max-width: none !important;
          max-height: none !important;
        }
      `}</style>

      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Radio className="w-5 h-5 stroke-[2.2] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Accident Hotspots & Predictive Radar AI
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  MoRTH Blackspot Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Spatio-Temporal KDE & DBSCAN Clustering • Pulsing Circular Radio Wave Hazard Zones • Active Safe Avoidance Routing
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Define on Map Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsDefiningOnMap(!isDefiningOnMap);
                if (isDefiningOnMap) {
                  setNewHotspotCoords(null);
                  if (tempMarkerRef.current && leafletMapRef.current) {
                    leafletMapRef.current.removeLayer(tempMarkerRef.current);
                    tempMarkerRef.current = null;
                  }
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                isDefiningOnMap 
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-1 animate-pulse" 
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-emerald-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isDefiningOnMap ? "Defining on Map (Click Location)" : "Define Hotspot on Map"}</span>
            </button>

            {/* Simulate Avoidance Route */}
            <button
              type="button"
              onClick={handleRunAvoidanceSimulation}
              disabled={isSimulatingAvoidance}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isSimulatingAvoidance ? "animate-spin" : ""}`} />
              <span>{isSimulatingAvoidance ? "Simulating..." : "Simulate Hotspot Avoidance Route"}</span>
            </button>

            {/* Launch Route Guardian */}
            <Link
              href="/guardian"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch Route Guardian</span>
            </Link>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchHotspots}
              title="Refresh Hotspot Registry"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Quick Hub Selector Bar */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between overflow-x-auto text-xs pb-0.5">
          <div className="flex items-center space-x-2 shrink-0 pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Regional Hub:
            </span>
            {CITY_HUBS.map((hub) => (
              <button
                key={hub.tag}
                type="button"
                onClick={() => {
                  setSelectedCity(hub.tag);
                  setSimulationResult(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCity === hub.tag
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {hub.name}
              </button>
            ))}
          </div>

          {/* Environmental Conditions Stress Toggles */}
          <div className="flex items-center space-x-2 shrink-0 pl-2 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Condition:</span>
            <button
              type="button"
              onClick={() => setTimeContext(timeContext === "night" ? "day" : "night")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center space-x-1 border ${
                timeContext === "night"
                  ? "bg-indigo-900 text-indigo-100 border-indigo-700"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {timeContext === "night" ? <Moon className="w-3 h-3 text-indigo-300" /> : <Sun className="w-3 h-3 text-amber-500" />}
              <span>{timeContext === "night" ? "Night (Unlit Stress)" : "Daylight"}</span>
            </button>

            <button
              type="button"
              onClick={() => setWeatherCondition(weatherCondition === "rain" ? "clear" : "rain")}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center space-x-1 border ${
                weatherCondition === "rain"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <CloudRain className="w-3 h-3" />
              <span>{weatherCondition === "rain" ? "Monsoon (+Slipperiness)" : "Dry"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Map & Radio Waves Canvas (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative w-full h-[580px] lg:h-[620px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            {/* Map Definition Active Instruction Banner */}
            {isDefiningOnMap && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border border-emerald-400 animate-bounce">
                <MapPin className="w-4 h-4" />
                <span>
                  {newHotspotCoords 
                    ? `Location locked (${newHotspotCoords.lat}, ${newHotspotCoords.lon}). Fill details below!` 
                    : "Click any point on the road to mark an accident-prone blackspot!"}
                </span>
              </div>
            )}

            {/* Map Top-Right Overlay Controls */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
              <button
                type="button"
                onClick={() => setShowWaves(!showWaves)}
                className={`px-2 py-1 rounded-lg font-medium flex items-center space-x-1 transition-colors ${
                  showWaves ? "bg-rose-50 text-rose-700 font-bold border border-rose-200" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-rose-600" />
                <span>Radio Waves</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRadiusCircles(!showRadiusCircles)}
                className={`px-2 py-1 rounded-lg font-medium flex items-center space-x-1 transition-colors ${
                  showRadiusCircles ? "bg-blue-50 text-blue-700 font-bold border border-blue-200" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Radius Buffers</span>
              </button>

              {/* Severity Filter Dropdown */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Risk</option>
                <option value="MODERATE">Moderate</option>
              </select>
            </div>

            {/* Leaflet Map DOM Element */}
            <div ref={mapContainerRef} className="w-full h-full cursor-crosshair z-0" />

            {/* Avoidance Route Comparison Floating Tray */}
            {simulationResult && (
              <div className="absolute bottom-3 inset-x-3 z-[1000] bg-white/95 backdrop-blur-xl border border-slate-200 p-3.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    <span className="text-xs font-bold text-slate-900">
                      SafePath-AI Avoidance vs Unchecked Commercial GPS Path
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulationResult(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Naive Path */}
                  <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200">
                    <div className="flex items-center justify-between font-bold text-rose-800">
                      <span>Commercial GPS Path</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">Direct</span>
                    </div>
                    <div className="mt-1 text-[11px] text-rose-700 space-y-0.5">
                      <div>Distance: <b>{simulationResult.naive_direct_route.distance_m}m</b> ({simulationResult.naive_direct_route.travel_time_min}m)</div>
                      <div className="text-rose-900 font-bold">Traverses {simulationResult.naive_direct_route.blackspot_traversals} Fatal Blackspots</div>
                    </div>
                  </div>

                  {/* Safe Avoidance Path */}
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200">
                    <div className="flex items-center justify-between font-bold text-blue-800">
                      <span>SafePath-AI Radar Path</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">Safe Avoid</span>
                    </div>
                    <div className="mt-1 text-[11px] text-blue-700 space-y-0.5">
                      <div>Distance: <b>{simulationResult.safepath_avoidance_route.distance_m}m</b> ({simulationResult.safepath_avoidance_route.travel_time_min}m)</div>
                      <div className="text-emerald-700 font-bold">Zero Blackspot Intersections</div>
                    </div>
                  </div>

                  {/* Trade-off Verdict */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-center">
                    <div className="text-[11px] font-bold text-emerald-800">
                      Hazard Exposure Reduction: <span className="text-base font-extrabold text-emerald-600">-{simulationResult.tradeoff_summary.risk_reduction_pct}%</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Marginal Walk Time: +{simulationResult.tradeoff_summary.added_time_min} min (+{simulationResult.tradeoff_summary.added_distance_m}m)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Define New Hotspot Floating Modal (When User Clicks Map) */}
            {isDefiningOnMap && newHotspotCoords && (
              <div className="absolute top-14 inset-x-3 z-[1100] p-4 bg-white/98 backdrop-blur-xl rounded-2xl border-2 border-emerald-500 shadow-2xl animate-in fade-in slide-in-from-top-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Define New Accident Hotspot / Hazard Zone</h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Pinned at Lat {newHotspotCoords.lat}, Lon {newHotspotCoords.lon}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewHotspotCoords(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hotspot / Corridor Landmark Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Parkal Road Blind Curve #2, Girls Hostel Turn"
                    value={newHotspotName}
                    onChange={(e) => setNewHotspotName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Severity Level:</label>
                  <select
                    value={newHotspotSeverity}
                    onChange={(e) => setNewHotspotSeverity(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium bg-white"
                  >
                    <option value="CRITICAL">Critical Blackspot (Red)</option>
                    <option value="HIGH">High Risk Hazard (Orange)</option>
                    <option value="MODERATE">Moderate / Near-Miss (Yellow)</option>
                  </select>
                </div>

                {/* Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-700">Radius Buffer:</label>
                    <span className="font-mono text-emerald-600 font-bold">{newHotspotRadius}m</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="10"
                    value={newHotspotRadius}
                    onChange={(e) => setNewHotspotRadius(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Road Geometry */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Road Geometry / Hazard:</label>
                  <input
                    type="text"
                    placeholder="e.g. Uncontrolled 4-Way Junction, Blind Hill Crest"
                    value={newHotspotGeometry}
                    onChange={(e) => setNewHotspotGeometry(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contributing Factor / Notes:</label>
                  <input
                    type="text"
                    placeholder="e.g. High truck speed, missing crosswalk, zero lighting"
                    value={newHotspotNotes}
                    onChange={(e) => setNewHotspotNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-3.5 flex justify-end items-center space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewHotspotCoords(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateHotspot}
                  disabled={isSavingHotspot}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>{isSavingHotspot ? "Broadcasting Radar..." : "Broadcast Radar Wave on Map"}</span>
                </button>
              </div>
              </div>
            )}
          </div>

          {/* Real-time Streaming Telemetry Feed Ticker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${streamActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Live Road Accident Telemetry & Near-Miss Stream
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  {streamActive ? "STREAMING ACTIVE" : "PAUSED"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStreamActive(!streamActive)}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                {streamActive ? "Pause Feed" : "Resume Stream"}
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {streamingAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-slate-800 truncate">{alert.hotspot_name}:</span>
                    <span className="text-slate-600 truncate">{alert.description}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {alert.speed_drop_kmh && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                        -{alert.speed_drop_kmh} km/h ABS
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Hotspot Inspector & Spatial Intelligence (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Selected Hotspot Intelligence Dossier */}
          {selectedHotspot ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      selectedHotspot.severity === 'CRITICAL' 
                        ? 'bg-rose-100 text-rose-800' 
                        : selectedHotspot.severity === 'HIGH' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedHotspot.severity} BLACKSPOT
                    </span>
                    {selectedHotspot.morth_blackspot_code && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 text-slate-600 font-bold">
                        {selectedHotspot.morth_blackspot_code}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-900 mt-1 leading-snug">
                    {selectedHotspot.name}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">KDE Density</span>
                  <span className="text-base font-black text-rose-600 leading-none">
                    {selectedHotspot.kde_density_score.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Annual Collision Breakdown Cards */}
              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Annual Crashes</span>
                  <span className="text-base font-black text-slate-800">
                    {selectedHotspot.collision_stats.total_accidents_annual}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                  <span className="text-[9px] uppercase font-bold text-rose-500 block">Fatalities</span>
                  <span className="text-base font-black text-rose-700">
                    {selectedHotspot.collision_stats.fatalities}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[9px] uppercase font-bold text-amber-600 block">Severe Injuries</span>
                  <span className="text-base font-black text-amber-800">
                    {selectedHotspot.collision_stats.severe_injuries}
                  </span>
                </div>
              </div>

              {/* Vehicle / User Split */}
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Vulnerable Casualty Distribution:
                </span>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Pedestrian: <b className="text-blue-600">{selectedHotspot.collision_stats.pedestrian}</b></span>
                  <span>Two-Wheeler: <b className="text-amber-600">{selectedHotspot.collision_stats.two_wheeler}</b></span>
                  <span>Multi-Car: <b>{selectedHotspot.collision_stats.four_wheeler}</b></span>
                </div>
              </div>

              {/* Spatial Attributes */}
              <div className="space-y-2 text-xs mb-3">
                <div className="flex items-start space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Peak Danger Hours: </span>
                    <span className="text-slate-600">{selectedHotspot.peak_danger_hours}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <CloudRain className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Weather Sensitivity: </span>
                    <span className="text-slate-600">{selectedHotspot.weather_sensitivity}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Road Geometry: </span>
                    <span className="text-slate-600">{selectedHotspot.road_geometry}</span>
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Primary Contributing Factors:
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {selectedHotspot.contributing_factors.map((f, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Engineering Mitigations */}
              <div className="pt-2.5 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  SafePath-AI Recommended Mitigations:
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {selectedHotspot.recommended_mitigations.map((m, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User hotspot deletion if custom */}
              {selectedHotspot.created_by_user && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`http://localhost:8000/api/v1/hotspots/${selectedHotspot.id}`, { method: "DELETE" });
                      setHotspots(hotspots.filter((h) => h.id !== selectedHotspot.id));
                      setSelectedHotspot(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User Defined Hotspot</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Select any circular radio wave marker on the map to inspect blackspot intelligence.</p>
            </div>
          )}

          {/* Hotspot Registry Explorer List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-900">
                Monitored Blackspots ({hotspots.length})
              </span>
              <span className="text-[10px] text-slate-400">Click to focal zoom</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-60 pr-1">
              {hotspots.map((h) => {
                const isSelected = selectedHotspot?.id === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setSelectedHotspot(h);
                      if (leafletMapRef.current) {
                        leafletMapRef.current.setView([h.coordinate.lat, h.coordinate.lon], 17, { animate: true });
                      }
                    }}
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-rose-50 border border-rose-200 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${h.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span className="font-bold text-slate-900 truncate">{h.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {h.road_geometry} • Radius: {h.radius_m}m
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-rose-600 block">
                        KDE {h.kde_density_score.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {h.collision_stats.fatalities} fatal
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
