"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: (keys: { mapboxToken?: string; orsKey?: string; googleKey?: string }) => void;
}

export function ApiKeyModal({ isOpen, onClose, onKeysUpdated }: ApiKeyModalProps) {
  const [mapboxKey, setMapboxKey] = useState("");
  const [orsKey, setOrsKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [weatherKey, setWeatherKey] = useState("");

  const [showKeys, setShowKeys] = useState<{ [k: string]: boolean }>({});
  const [validating, setValidating] = useState<{ [k: string]: boolean }>({});
  const [validationStatus, setValidationStatus] = useState<{ [k: string]: { valid: boolean; message: string } | null }>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing keys from localStorage and Backend
  useEffect(() => {
    if (!isOpen) return;

    // Load from localStorage first
    const savedMapbox = localStorage.getItem("safepath_mapbox_token") || "";
    const savedOrs = localStorage.getItem("safepath_ors_key") || "";
    const savedGoogle = localStorage.getItem("safepath_google_key") || "";
    const savedWeather = localStorage.getItem("safepath_weather_key") || "";

    if (savedMapbox) setMapboxKey(savedMapbox);
    if (savedOrs) setOrsKey(savedOrs);
    if (savedGoogle) setGoogleKey(savedGoogle);
    if (savedWeather) setWeatherKey(savedWeather);

    // Sync with backend /api/v1/config/keys
    fetch("http://localhost:8000/api/v1/config/keys")
      .then((res) => res.json())
      .then((data) => {
        if (data?.providers) {
          if (!savedMapbox && data.providers.mapbox?.configured) {
            // Backend has key
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const testKey = async (provider: string, key: string) => {
    if (!key.trim()) {
      setValidationStatus((prev) => ({
        ...prev,
        [provider]: { valid: false, message: "Please enter a key to test." }
      }));
      return;
    }

    setValidating((prev) => ({ ...prev, [provider]: true }));
    setValidationStatus((prev) => ({ ...prev, [provider]: null }));

    try {
      const res = await fetch("http://localhost:8000/api/v1/config/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: key })
      });
      const result = await res.json();
      setValidationStatus((prev) => ({ ...prev, [provider]: result }));
    } catch (err: any) {
      setValidationStatus((prev) => ({
        ...prev,
        [provider]: { valid: false, message: "Validation check failed to reach server." }
      }));
    } finally {
      setValidating((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = async () => {
    // 1. Save to browser localStorage
    if (mapboxKey.trim()) localStorage.setItem("safepath_mapbox_token", mapboxKey.trim());
    else localStorage.removeItem("safepath_mapbox_token");

    if (orsKey.trim()) localStorage.setItem("safepath_ors_key", orsKey.trim());
    else localStorage.removeItem("safepath_ors_key");

    if (googleKey.trim()) localStorage.setItem("safepath_google_key", googleKey.trim());
    else localStorage.removeItem("safepath_google_key");

    if (weatherKey.trim()) localStorage.setItem("safepath_weather_key", weatherKey.trim());
    else localStorage.removeItem("safepath_weather_key");

    // 2. Persist to Backend & .env file
    try {
      await fetch("http://localhost:8000/api/v1/config/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapbox_api_key: mapboxKey.trim(),
          openrouteservice_api_key: orsKey.trim(),
          google_maps_api_key: googleKey.trim(),
          openweather_api_key: weatherKey.trim()
        })
      });
    } catch (e) {}

    // 3. Notify parent components to reload map layers
    if (onKeysUpdated) {
      onKeysUpdated({
        mapboxToken: mapboxKey.trim() || undefined,
        orsKey: orsKey.trim() || undefined,
        googleKey: googleKey.trim() || undefined
      });
    }

    window.dispatchEvent(
      new CustomEvent("safepath:apikeys_updated", {
        detail: { 
          mapboxToken: mapboxKey.trim(),
          googleKey: googleKey.trim(),
          orsKey: orsKey.trim(),
          weatherKey: weatherKey.trim()
        }
      })
    );

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetToFree = () => {
    setMapboxKey("");
    setOrsKey("");
    setGoogleKey("");
    setWeatherKey("");
    localStorage.removeItem("safepath_mapbox_token");
    localStorage.removeItem("safepath_ors_key");
    localStorage.removeItem("safepath_google_key");
    localStorage.removeItem("safepath_weather_key");

    fetch("http://localhost:8000/api/v1/config/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapbox_api_key: "",
        openrouteservice_api_key: "",
        google_maps_api_key: "",
        openweather_api_key: ""
      })
    }).catch(() => {});

    window.dispatchEvent(
      new CustomEvent("safepath:apikeys_updated", { 
        detail: { mapboxToken: "", googleKey: "", orsKey: "", weatherKey: "" } 
      })
    );
    if (onKeysUpdated) onKeysUpdated({});
    setValidationStatus({});
  };


  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Key className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Manage Map & Geospatial API Keys</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Custom Setup
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Put your personal API keys below to unlock Mapbox Satellite HD, custom routing, and radar overlays.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Mode Guarantee Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start space-x-3 text-xs text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-semibold text-emerald-950">Zero-API-Key Mode Always Active</p>
            <p className="text-emerald-700 text-[11px]">
              If you don&apos;t have any API keys, the application automatically runs on 100% free OpenStreetMap & CartoDB tiles with zero cost.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* 1. Mapbox Token */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <label className="text-xs font-bold text-slate-900">Mapbox Access Token</label>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                  Unlocks Satellite HD & Vector
                </span>
              </div>
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Get Free Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.mapbox ? "text" : "password"}
                  placeholder="pk.eyJ1..."
                  value={mapboxKey}
                  onChange={(e) => setMapboxKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none pr-9 transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, mapbox: !prev.mapbox }))}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.mapbox ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => testKey("mapbox", mapboxKey)}
                disabled={validating.mapbox}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {validating.mapbox ? "Testing..." : "Test Token"}
              </button>
            </div>

            {/* Validation Message */}
            {validationStatus.mapbox && (
              <div
                className={`p-2.5 rounded-xl text-[11px] flex items-center space-x-2 ${
                  validationStatus.mapbox.valid
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {validationStatus.mapbox.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{validationStatus.mapbox.message}</span>
              </div>
            )}
          </div>

          {/* 2. OpenRouteService Key */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <label className="text-xs font-bold text-slate-900">OpenRouteService (ORS) API Key</label>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                  Pedestrian Routing
                </span>
              </div>
              <a
                href="https://openrouteservice.org/dev/#/signup"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.ors ? "text" : "password"}
                  placeholder="5b3ce3597851110001cf6248..."
                  value={orsKey}
                  onChange={(e) => setOrsKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-9 transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, ors: !prev.ors }))}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.ors ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => testKey("openrouteservice", orsKey)}
                disabled={validating.openrouteservice}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {validating.openrouteservice ? "Testing..." : "Test Key"}
              </button>
            </div>

            {validationStatus.openrouteservice && (
              <div
                className={`p-2.5 rounded-xl text-[11px] flex items-center space-x-2 ${
                  validationStatus.openrouteservice.valid
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {validationStatus.openrouteservice.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{validationStatus.openrouteservice.message}</span>
              </div>
            )}
          </div>

          {/* 3. Google Maps API Key */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <label className="text-xs font-bold text-slate-900">Google Maps Platform Key</label>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                  Google Layers
                </span>
              </div>
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Google Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.google ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none pr-9 transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, google: !prev.google }))}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.google ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => testKey("google", googleKey)}
                disabled={validating.google}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {validating.google ? "Testing..." : "Test Key"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetToFree}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Free Mode</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved & Activated!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Apply Keys</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
