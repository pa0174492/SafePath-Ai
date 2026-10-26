"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";


import { 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  Share2, 
  AlertTriangle, 
  Hospital, 
  Building2, 
  ShieldCheck, 
  Pill, 
  Flame, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Battery,
  Search,
  Radio,
  ArrowRight,
  Check
} from "lucide-react";
import { 
  fetchNearestSafeHavens, 
  fetchSafeHavens, 
  triggerSOSAlert, 
  fetchActiveSOSAlerts,
  resolveSOSAlert,
  ActiveSOSBeacon,
  SafeHaven, 
  Coordinate 
} from "@/lib/api";

export default function SafeHavensPage() {
  const [cityTag, setCityTag] = useState("warangal_kits");
  const [userCoord, setUserCoord] = useState<Coordinate>({ lat: 18.0542, lon: 79.5357 });
  const [userLocationName, setUserLocationName] = useState("KITS Campus & Hanamkonda");
  const [shelters, setShelters] = useState<SafeHaven[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Live Active SOS Emergency Beacons Network
  const [activeAlerts, setActiveAlerts] = useState<ActiveSOSBeacon[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // SOS Emergency States
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosEmergencyType, setSosEmergencyType] = useState<"PANIC_SOS" | "MEDICAL_EMERGENCY" | "TRAFFIC_ACCIDENT" | "HARASSMENT">("PANIC_SOS");
  const [userName, setUserName] = useState("Pedestrian User");
  const [isTriggeringSos, setIsTriggeringSos] = useState(false);
  const [sosResponse, setSosResponse] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const cityOptions = [
    { tag: "warangal_kits", name: "🎓 KITS College (Warangal)", lat: 18.0542, lon: 79.5357, label: "KITS Campus & Hanamkonda" },
    { tag: "warangal_ku", name: "🏛️ Kakatiya Univ (Warangal)", lat: 18.0195, lon: 79.5532, label: "KU Campus & Vidyaranyapuri" },
    { tag: "hyderabad", name: "🏙️ Hyderabad (Cyberabad)", lat: 17.4435, lon: 78.3772, label: "HITEC City & Gachibowli" },
    { tag: "bengaluru", name: "🌆 Bengaluru (Central)", lat: 12.9716, lon: 77.5946, label: "MG Road & Indiranagar" },
    { tag: "delhi", name: "🏛️ New Delhi (Central)", lat: 28.6139, lon: 77.2090, label: "Connaught Place & India Gate" }
  ];

  const emergencyHelplines = [
    { title: "National Emergency Service", number: "112", desc: "All-in-one Police, Fire & Medical dispatch nationwide", badge: "24/7 Universal" },
    { title: "Police Control Room", number: "100", desc: "Immediate police response & mobile patrol dispatch", badge: "Immediate" },
    { title: "Medical Emergency & Ambulance", number: "108", desc: "Government emergency life-support ambulance service", badge: "Free Ambulance" },
    { title: "Women in Distress Helpline", number: "1091", desc: "Dedicated women protection & Disha / She-Team rapid unit", badge: "Confidential" },
    { title: "National Highway Accident Helpline", number: "1073", desc: "MoRTH highway emergency recovery & ambulance", badge: "Highway SOS" },
    { title: "Child Helpline", number: "1098", desc: "Emergency assistance for minors and school pedestrians", badge: "Toll-Free" }
  ];

  const shelterTypes = [
    { id: "ALL", label: "All Shelters", icon: ShieldCheck },
    { id: "POLICE_STATION", label: "Police & Security", icon: Building2 },
    { id: "HOSPITAL_EMERGENCY", label: "24/7 Hospitals", icon: Hospital },
    { id: "TRANSIT_SECURITY", label: "Transit Security", icon: Navigation },
    { id: "PHARMACY_247", label: "24/7 Pharmacies", icon: Pill }
  ];

  const loadShelters = async (city: string, coord: Coordinate) => {
    setLoading(true);
    try {
      const res = await fetchNearestSafeHavens(coord.lat, coord.lon, 10000, city);
      setShelters(res.nearest_safe_havens);
    } catch (err) {
      console.error("Failed to load safe havens:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveAlerts = async (city?: string) => {
    try {
      const alerts = await fetchActiveSOSAlerts(city);
      setActiveAlerts(alerts);
    } catch (e) {
      console.warn("Failed loading active alerts:", e);
    }
  };

  useEffect(() => {
    loadShelters(cityTag, userCoord);
    loadActiveAlerts(cityTag);

    const interval = setInterval(() => {
      loadActiveAlerts(cityTag);
    }, 8000);
    return () => clearInterval(interval);
  }, [cityTag, userCoord]);

  const handleCityChange = (newTag: string) => {
    const found = cityOptions.find(c => c.tag === newTag);
    if (found) {
      setCityTag(found.tag);
      setUserCoord({ lat: found.lat, lon: found.lon });
      setUserLocationName(found.label);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    // Optimistic UI update
    setActiveAlerts(prev => prev.map(a => a.alert_id === alertId ? { ...a, status: "RESOLVED" as const, responder_note: "Resolved by user" } : a));
    try {
      await resolveSOSAlert(alertId);
    } catch (e) {
      console.warn("Failed resolving alert:", e);
    }
  };

  const handleTriggerSOS = async () => {
    setIsTriggeringSos(true);
    try {
      const resp = await triggerSOSAlert({
        user_name: userName,
        coordinate: userCoord,
        city_tag: cityTag,
        emergency_type: sosEmergencyType,
        battery_percentage: 84
      });
      setSosResponse(resp);
      loadActiveAlerts(cityTag);
    } catch (err) {
      console.error("SOS trigger error:", err);
    } finally {
      setIsTriggeringSos(false);
    }
  };

  const filteredShelters = shelters.filter(sh => {
    const matchesType = selectedType === "ALL" || sh.type === selectedType;
    const matchesQuery = searchQuery === "" || 
      sh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sh.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  const getShelterIcon = (type: string) => {
    switch (type) {
      case "POLICE_STATION": return Building2;
      case "HOSPITAL_EMERGENCY": return Hospital;
      case "TRANSIT_SECURITY": return Navigation;
      case "PHARMACY_247": return Pill;
      case "FIRE_STATION": return Flame;
      default: return ShieldCheck;
    }
  };

  const getShelterBadgeColor = (type: string) => {
    switch (type) {
      case "POLICE_STATION": return "bg-blue-100 text-blue-800 border-blue-200";
      case "HOSPITAL_EMERGENCY": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "TRANSIT_SECURITY": return "bg-purple-100 text-purple-800 border-purple-200";
      case "PHARMACY_247": return "bg-teal-100 text-teal-800 border-teal-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-rose-900/40 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs font-mono text-rose-300">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>24/7 Verified Safe Haven Radar & Emergency Broadcast</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Emergency SOS & Safe Havens Hub
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Provides immediate emergency dispatch, verified 24/7 security shelters (Police Posts, Level-1 Trauma Bays, 
              Campus Clinics), and direct WhatsApp live coordinates broadcast for pedestrians and commuters under threat.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                setSosResponse(null);
                setSosModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center space-x-3 shadow-lg shadow-rose-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all border border-rose-400 animate-pulse"
            >
              <ShieldAlert className="w-5 h-5 stroke-[2.3]" />
              <span>TRIGGER ONE-TAP PANIC SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* City & Location Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Target Region / Campus</span>
            <span className="text-sm font-bold text-slate-900">{userLocationName}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cityOptions.map((c) => (
            <button
              key={c.tag}
              onClick={() => handleCityChange(c.tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                cityTag === c.tag
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Universal Emergency Hotlines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900">Immediate Emergency Helplines (Direct Dial)</h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Toll-free 24/7 across India</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {emergencyHelplines.map((line, idx) => (
            <a
              key={idx}
              href={`tel:${line.number}`}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block group-hover:text-rose-600 transition-colors">
                    {line.title}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{line.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {line.badge}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xl font-mono font-black text-rose-600 tracking-wider">
                  {line.number}
                </span>
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center space-x-1 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Real-Time Active Emergency SOS Beacons Network */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <Radio className={`w-5 h-5 ${activeAlerts.some(a => a.status !== "RESOLVED") ? "text-red-600 animate-pulse" : "text-slate-400"}`} />
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Live Active Emergency SOS Beacons</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeAlerts.some(a => a.status !== "RESOLVED") 
                    ? "bg-red-50 text-red-700 border border-red-200 animate-pulse" 
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {activeAlerts.filter(a => a.status !== "RESOLVED").length} ACTIVE BROADCASTS
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Synchronized live responder feed for rapid mutual aid and police dispatch
              </p>
            </div>
          </div>

          <button
            onClick={() => loadActiveAlerts(cityTag)}
            className="p-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Refresh Live Feed</span>
          </button>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 font-medium">
            No active SOS broadcasts in this sector. All corridors clear.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((alert) => {
              const isResolved = alert.status === "RESOLVED";
              return (
                <div
                  key={alert.alert_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isResolved 
                      ? "bg-slate-50 border-slate-200 opacity-75" 
                      : "bg-red-50/60 border-red-200 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isResolved ? "bg-slate-200 text-slate-600" : "bg-red-600 text-white shadow-sm animate-pulse"
                      }`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900">{alert.user_name}</h4>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            isResolved 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-red-600 text-white"
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                          {alert.location_name || `GPS (${alert.coordinate.lat.toFixed(4)}, ${alert.coordinate.lon.toFixed(4)})`}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
                          <span>Battery: {alert.battery_percentage ?? 80}%</span>
                          <span>•</span>
                          <span>{alert.emergency_type.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>

                    {!isResolved && (
                      <button
                        onClick={() => handleResolveAlert(alert.alert_id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs transition-all flex items-center gap-1 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark Safe</span>
                      </button>
                    )}
                  </div>

                  {alert.responder_note && (
                    <div className="mt-3 p-2 bg-white/80 border border-slate-200/80 rounded-lg text-[10px] text-slate-700 flex items-center justify-between">
                      <span className="truncate"><strong>Status:</strong> {alert.responder_note}</span>
                      <a
                        href={`https://maps.google.com/?q=${alert.coordinate.lat},${alert.coordinate.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 shrink-0 ml-2"
                      >
                        Pin <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safe Haven Directory */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Verified 24/7 Safe Shelters Nearby</span>
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by walking proximity from your current coordinates
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search shelters or landmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {shelterTypes.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Shelters Grid */}
        {loading ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Scanning spatial index for verified safe havens...</p>
          </div>
        ) : filteredShelters.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No safe shelters match your query in this area</p>
            <p className="text-xs text-slate-500">Try changing the shelter category filter or expanding your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredShelters.map((shelter) => {
              const Icon = getShelterIcon(shelter.type);
              const badgeClass = getShelterBadgeColor(shelter.type);

              return (
                <div
                  key={shelter.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeClass}`}>
                            {shelter.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-semibold border border-emerald-200 flex items-center space-x-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>24/7 Verified</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{shelter.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-start space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{shelter.address}</span>
                      </p>
                    </div>

                    {/* Proximity Pill */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Distance</span>
                        <span className="font-mono font-bold text-slate-900">
                          {shelter.distance_m ? `${shelter.distance_m}m` : "Within 1.5 km"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Walking Time</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {shelter.estimated_walking_min ? `~${shelter.estimated_walking_min} mins` : "~5 mins"}
                        </span>
                      </div>
                    </div>

                    {/* Features checklist */}
                    {shelter.security_features.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                          Security Highlights
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {shelter.security_features.slice(0, 3).map((feat, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={`tel:${shelter.emergency_phone.split("/")[0].trim()}`}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                      <span>{shelter.emergency_phone.split("/")[0].trim()}</span>
                    </a>

                    <Link
                      href={`/map?lat=${shelter.coordinate.lat}&lon=${shelter.coordinate.lon}&name=${encodeURIComponent(shelter.name)}`}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Route Here</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency SOS Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Trigger Emergency SOS Broadcast</h3>
                  <span className="text-xs text-rose-600 font-medium font-mono">Live GPS Location Sharing</span>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {!sosResponse ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Name / Identifier</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Enter full name or roll number"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nature of Emergency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "PANIC_SOS", label: "🚨 Threat / Panic SOS" },
                      { id: "HARASSMENT", label: "🛡️ Street Harassment" },
                      { id: "MEDICAL_EMERGENCY", label: "🏥 Medical Crisis" },
                      { id: "TRAFFIC_ACCIDENT", label: "💥 Collision / Crash" }
                    ].map((em) => (
                      <button
                        key={em.id}
                        onClick={() => setSosEmergencyType(em.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                          sosEmergencyType === em.id
                            ? "bg-rose-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {em.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-500">Current Coordinates:</span>
                    <span className="font-bold text-slate-800">{userCoord.lat.toFixed(4)}, {userCoord.lon.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-500">Device Battery Telemetry:</span>
                    <span className="font-bold text-emerald-700">84% Optimal</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTriggerSOS}
                    disabled={isTriggeringSos}
                    className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-rose-900/30 transition-all"
                  >
                    {isTriggeringSos ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Broadcasting to Emergency Radar...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>DISPATCH INSTANT EMERGENCY SOS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-sm">Emergency Broadcast Active</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed font-mono">
                    Alert ID: <strong>{sosResponse.alert_id}</strong> • Transmitted via SafePath Emergency Gateway.
                  </p>
                </div>

                {/* Nearest Safe Shelter card */}
                {sosResponse.nearest_shelter && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                      Nearest Safe Shelter Target
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{sosResponse.nearest_shelter.name}</h4>
                    <p className="text-xs text-slate-600">{sosResponse.nearest_shelter.address}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <span className="font-mono text-emerald-700 font-bold">
                        Walking Distance: {sosResponse.nearest_shelter.distance_m || 240}m (~{sosResponse.nearest_shelter.estimated_walking_min || 3} min)
                      </span>
                      <a
                        href={`tel:${sosResponse.nearest_shelter.emergency_phone.split("/")[0].trim()}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold text-xs flex items-center space-x-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call Shelter</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* WhatsApp One-Click Emergency Link */}
                <div className="space-y-2">
                  <a
                    href={sosResponse.whatsapp_share_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Live Emergency Link on WhatsApp</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="tel:112"
                      className="py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Dial 112 Emergency</span>
                    </a>

                    <Link
                      href={`/map?lat=${sosResponse.nearest_shelter.coordinate.lat}&lon=${sosResponse.nearest_shelter.coordinate.lon}&name=${encodeURIComponent(sosResponse.nearest_shelter.name)}`}
                      className="py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate to Shelter</span>
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => setSosModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Close Emergency Modal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
