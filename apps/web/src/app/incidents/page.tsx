"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";


import { 
  AlertTriangle, 
  Plus, 
  ThumbsUp, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Moon, 
  Accessibility, 
  Filter, 
  Search, 
  Radio, 
  Flame, 
  Building2, 
  ShieldAlert, 
  Sparkles,
  ArrowRight,
  Eye,
  Send,
  X
} from "lucide-react";
import { 
  fetchIncidentFeed, 
  reportIncident, 
  upvoteIncident, 
  IncidentReport, 
  IncidentCreateRequest, 
  Coordinate 
} from "@/lib/api";

export default function IncidentsPage() {
  const [cityTag, setCityTag] = useState("warangal_kits");
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // New Report Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("BROKEN_LIGHT");
  const [newSeverity, setNewSeverity] = useState("HIGH");
  const [newLocationName, setNewLocationName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsWheelchairBlocker, setNewIsWheelchairBlocker] = useState(false);
  const [newIsNightHazard, setNewIsNightHazard] = useState(true);
  const [newRecommendedAction, setNewRecommendedAction] = useState("");
  const [customCoord, setCustomCoord] = useState<Coordinate | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});

  const cityOptions = [
    { tag: "warangal_kits", name: "🎓 KITS College (Warangal)", lat: 18.0542, lon: 79.5357, defaultLoc: "Near KITS College Gate, Yerragattu Hill Road" },
    { tag: "warangal_ku", name: "🏛️ Kakatiya Univ (Warangal)", lat: 18.0195, lon: 79.5532, defaultLoc: "Kakatiya University 1st Gate, Hanamkonda" },
    { tag: "hyderabad", name: "🏙️ Hyderabad (Cyberabad)", lat: 17.4435, lon: 78.3772, defaultLoc: "Hitec City Cyber Towers Crossroad" },
    { tag: "bengaluru", name: "🌆 Bengaluru (Central)", lat: 12.9716, lon: 77.5946, defaultLoc: "MG Road Metro Concourse Pedestrian Way" },
    { tag: "delhi", name: "🏛️ New Delhi (Central)", lat: 28.6139, lon: 77.2090, defaultLoc: "Janpath Inner Circle Pedestrian Arcade" }
  ];

  const currentCity = cityOptions.find(c => c.tag === cityTag) || cityOptions[0];

  const categoryOptions = [
    { id: "ALL", label: "All Hazards" },
    { id: "BROKEN_LIGHT", label: "Broken Streetlights" },
    { id: "MISSING_CURB_RAMP", label: "Missing Curb Ramps" },
    { id: "WATERLOGGING", label: "Waterlogging & Flooding" },
    { id: "ROAD_DAMAGE", label: "Road Damage & Potholes" },
    { id: "BLOCKED_SIDEWALK", label: "Blocked Sidewalks" },
    { id: "UNSAFE_CROSSING", label: "Unsafe Crossings" },
    { id: "STRAY_ANIMALS", label: "Stray Animals" }
  ];

  const severityOptions = ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"];

  const loadFeed = async (city: string) => {
    setLoading(true);
    try {
      const feed = await fetchIncidentFeed(city);
      setIncidents(feed);
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(cityTag);
    const interval = setInterval(() => {
      loadFeed(cityTag);
    }, 10000);
    return () => clearInterval(interval);
  }, [cityTag]);

  const handleCityChange = (newTag: string) => {
    setCityTag(newTag);
  };

  const handleUpvote = async (id: string) => {
    setUpvotingIds(prev => ({ ...prev, [id]: true }));
    // Optimistic UI update
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          upvotes: inc.upvotes + 1,
          verified_by_users: inc.verified_by_users + 1
        };
      }
      return inc;
    }));

    try {
      await upvoteIncident(id);
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setUpvotingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocationName.trim()) return;

    setSubmitting(true);
    try {
      const payload: IncidentCreateRequest = {
        title: newTitle,
        category: newCategory,
        severity: newSeverity,
        city_tag: cityTag,
        coordinate: customCoord || { lat: currentCity.lat, lon: currentCity.lon },
        location_name: newLocationName,
        description: newDescription,
        is_wheelchair_blocker: newIsWheelchairBlocker,
        is_night_hazard: newIsNightHazard,
        affected_radius_m: 45.0,
        recommended_action: newRecommendedAction || undefined
      };

      const created = await reportIncident(payload);
      setIncidents(prev => [created, ...prev]);
      setReportModalOpen(false);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewLocationName("");
      setNewRecommendedAction("");
    } catch (err) {
      console.error("Failed to report incident:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesCategory = selectedCategory === "ALL" || inc.category === selectedCategory;
    const matchesSeverity = selectedSeverity === "ALL" || inc.severity === selectedSeverity;
    const matchesQuery = searchQuery === "" ||
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSeverity && matchesQuery;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH": return "bg-amber-100 text-amber-800 border-amber-300";
      case "MODERATE": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-xs font-mono text-indigo-300">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Real-Time Crowdsourced Geospatial Hazards</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Community Road Hazard & Incident Reporter
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Enables pedestrians, students, and citizens to crowdsource unlit corridors, open trenches, missing curb ramps, 
              and waterlogged crossings. Community verifications feed directly into the dynamic risk engine (R_robust & CVaR 95%).
            </p>
          </div>

          <div>
            <button
              onClick={() => {
                setNewLocationName(currentCity.defaultLoc);
                setReportModalOpen(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all border border-indigo-400"
            >
              <Plus className="w-5 h-5" />
              <span>REPORT NEW HAZARD</span>
            </button>
          </div>
        </div>
      </div>

      {/* City Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Target Region / Campus</span>
            <span className="text-sm font-bold text-slate-900">{currentCity.name}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cityOptions.map((c) => (
            <button
              key={c.tag}
              onClick={() => handleCityChange(c.tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                cityTag === c.tag
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Active Reports</span>
          <span className="text-2xl font-black font-mono text-slate-900">{incidents.length}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">In selected radius</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-rose-600 block">Critical Hazards</span>
          <span className="text-2xl font-black font-mono text-rose-700">
            {incidents.filter(i => i.severity === "CRITICAL").length}
          </span>
          <span className="text-[11px] text-rose-600 mt-1 block">Immediate safety threat</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-purple-600 block">Wheelchair Blockers</span>
          <span className="text-2xl font-black font-mono text-purple-700">
            {incidents.filter(i => i.is_wheelchair_blocker).length}
          </span>
          <span className="text-[11px] text-purple-600 mt-1 block">Zero ramp / deep drop</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-amber-600 block">Night-Time Hazards</span>
          <span className="text-2xl font-black font-mono text-amber-700">
            {incidents.filter(i => i.is_night_hazard).length}
          </span>
          <span className="text-[11px] text-amber-600 mt-1 block">Pitch dark / lux &lt; 2.0</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categoryOptions.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports or streets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span>Filter Severity:</span>
          {severityOptions.map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedSeverity === sev
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Feed Cards */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Retrieving live crowdsourced hazard reports...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No active hazards reported in this category</p>
          <p className="text-xs text-slate-500">Commuters report no obstacles matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIncidents.map((incident) => {
            const sevBadge = getSeverityBadge(incident.severity);

            return (
              <div
                key={incident.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black border ${sevBadge}`}>
                        {incident.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {incident.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(incident.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{incident.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-start space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{incident.location_name}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {incident.description}
                  </p>

                  {/* Badges for Night / Wheelchair */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {incident.is_wheelchair_blocker && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                        <Accessibility className="w-3 h-3" />
                        <span>Impassable for Wheelchair</span>
                      </span>
                    )}

                    {incident.is_night_hazard && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                        <Moon className="w-3 h-3" />
                        <span>Severe Night Hazard (Unlit)</span>
                      </span>
                    )}

                    {incident.status === "VERIFIED" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified by {incident.verified_by_users} Commuters</span>
                      </span>
                    )}
                  </div>

                  {incident.recommended_action && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      <strong>Caution / Mitigation:</strong> {incident.recommended_action}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Reported by: <strong>{incident.reported_by}</strong>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpvote(incident.id)}
                      disabled={upvotingIds[incident.id]}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-200 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Verify / Upvote ({incident.upvotes})</span>
                    </button>

                    <Link
                      href={`/map?lat=${incident.coordinate.lat}&lon=${incident.coordinate.lon}&name=${encodeURIComponent(incident.title)}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center space-x-1 transition-colors"
                    >
                      <span>View on Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-indigo-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Report Road Obstacle / Hazard</h3>
                  <p className="text-xs text-slate-500">Submitted directly to dynamic route risk index</p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hazard Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Broken solar light / Open trench before gate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hazard Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="BROKEN_LIGHT">Broken Streetlight</option>
                    <option value="MISSING_CURB_RAMP">Missing Curb Ramp</option>
                    <option value="WATERLOGGING">Waterlogging & Flooding</option>
                    <option value="ROAD_DAMAGE">Road Damage / Pothole</option>
                    <option value="BLOCKED_SIDEWALK">Blocked Sidewalk</option>
                    <option value="UNSAFE_CROSSING">Unsafe Crossing</option>
                    <option value="STRAY_ANIMALS">Stray Animals</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="CRITICAL">CRITICAL (Impassable / Danger)</option>
                    <option value="HIGH">HIGH (Major Obstacle)</option>
                    <option value="MODERATE">MODERATE (Slowdown)</option>
                    <option value="LOW">LOW (Minor Inconvenience)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Location / Landmark Description</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && "geolocation" in navigator) {
                        setIsGettingLocation(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setCustomCoord({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                            setNewLocationName(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
                            setIsGettingLocation(false);
                          },
                          (err) => {
                            console.warn("Location error:", err);
                            setIsGettingLocation(false);
                          }
                        );
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{isGettingLocation ? "Pinpointing..." : customCoord ? "✓ GPS Tagged" : "Use Live GPS"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Street name or landmark"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain condition, dimensions, and visibility drop..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsWheelchairBlocker}
                    onChange={(e) => setNewIsWheelchairBlocker(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800">Completely blocks wheelchair or stroller passage</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsNightHazard}
                    onChange={(e) => setNewIsNightHazard(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800">Severe hazard during nightfall (Pitch dark / no ambient light)</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Recommended Detour / Action (Optional)</label>
                <input
                  type="text"
                  value={newRecommendedAction}
                  onChange={(e) => setNewRecommendedAction(e.target.value)}
                  placeholder="e.g. Cross via opposite sidewalk or carry flashlight"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Hazard Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
