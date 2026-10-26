"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Shield, 
  Map, 
  GitCompare, 
  Sparkles, 
  Activity, 
  Accessibility, 
  CloudSun, 
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MapPin,
  ExternalLink,
  Layers,
  AlertTriangle,
  Radio,
  Key,
  ShieldAlert
} from "lucide-react";
import { ApiKeyModal } from "@/components/ApiKeyModal";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);


  useEffect(() => {
    fetch("http://localhost:8000/api/v1/health")
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(true));

    const handleOpen = () => setApiKeyModalOpen(true);
    window.addEventListener("safepath:open_apikeys", handleOpen);
    return () => window.removeEventListener("safepath:open_apikeys", handleOpen);
  }, []);

  const navItems = [
    { href: "/map", label: "Map & Navigation", icon: Map, badge: "Live" },
    { href: "/guardian", label: "Route Guardian", icon: Shield, badge: "Live GPS", isNew: true },
    { href: "/safehavens", label: "Emergency SOS", icon: ShieldAlert, badge: "24/7 SOS" },
    { href: "/incidents", label: "Hazard Reports", icon: AlertTriangle, badge: "Live Feed" },
    { href: "/hotspots", label: "Accident Hotspots", icon: Radio, badge: "Radar AI" },
    { href: "/context", label: "Live Context", icon: CloudSun, badge: "Real-Time" },
    { href: "/compare", label: "Pareto Compare", icon: GitCompare },
    { href: "/counterfactual", label: "What-If Studio", icon: Sparkles },
    { href: "/resilience", label: "Resilience Matrix", icon: Activity },
    { href: "/accessibility", label: "Accessibility ML", icon: Accessibility },
    { href: "/research", label: "Research Dashboard", icon: BarChart3 },
  ];

  const cityPresets = [
    { name: "KITS Warangal (TS)", lat: 18.0542, lon: 79.5357, tag: "warangal_kits" },
    { name: "Kakatiya Univ (Warangal)", lat: 18.0195, lon: 79.5532, tag: "warangal_ku" },
    { name: "Bengaluru Tech", lat: 12.9716, lon: 77.5946, tag: "bengaluru" },
    { name: "Hyderabad Cyber", lat: 17.4435, lon: 78.3772, tag: "hyderabad" },
    { name: "New Delhi Central", lat: 28.6139, lon: 77.2090, tag: "delhi" },
  ];

  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileOpen(false);
    if (pathname === href) {
      e.preventDefault();
      return;
    }
    // Set immediate visual loading state
    setNavigatingHref(href);
    // Unconditional guaranteed browser navigation (bypasses any RSC or unmount freezes)
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      window.location.href = href;
    }
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      return;
    }
    setNavigatingHref("/");
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      window.location.href = "/";
    }
  };

  const handleCitySelect = (preset: typeof cityPresets[0]) => {
    setMobileOpen(false);
    if (pathname === "/map") {
      window.dispatchEvent(new CustomEvent("safepath:select_city", { detail: preset }));
    } else {
      setNavigatingHref("/map");
      window.location.href = `/map?lat=${preset.lat}&lon=${preset.lon}&city=${preset.tag}`;
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <a 
          href="/" 
          onClick={handleBrandClick} 
          className="flex items-center space-x-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm pointer-events-none">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="pointer-events-none">
            <span className="font-bold text-sm tracking-tight text-slate-900">
              SafePath<span className="text-blue-600">AI</span>
            </span>
            <span className="text-[10px] text-slate-500 block leading-none font-medium">India Navigation</span>
          </div>
        </a>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[60] bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <a 
            href="/" 
            onClick={handleBrandClick}
            className="flex items-center space-x-3 overflow-hidden cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0 flex items-center justify-center text-white shadow-md shadow-blue-500/20 pointer-events-none">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            {!collapsed && (
              <div className="min-w-0 pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    SafePath<span className="text-blue-600 font-extrabold">AI</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    IN 🇮🇳
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 truncate block font-medium">
                  Urban Mobility Research
                </span>
              </div>
            )}
          </a>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                Navigation
              </div>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isNavigating = navigatingHref === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer select-none ${
                      collapsed ? "justify-center" : "justify-between"
                    } ${
                      isActive || isNavigating
                        ? "bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pointer-events-none">
                      {isNavigating ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0" />
                      ) : (
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors pointer-events-none ${
                            isActive ? "text-blue-600 stroke-[2.2]" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                      )}
                      {!collapsed && <span className="truncate pointer-events-none">{item.label}</span>}
                    </div>
                    {!collapsed && item.badge && !isNavigating && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 pointer-events-none ${
                        item.badge === "Live GPS"
                          ? "bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs font-extrabold"
                          : item.badge === "24/7 SOS"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {item.badge === "Live GPS" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />}
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* India Regional Focus Presets */}
          {!collapsed && (
            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between select-none">
                <span>India Regions</span>
                <MapPin className="w-3 h-3 text-slate-400" />
              </div>
              <div className="space-y-1">
                {cityPresets.map((city) => (
                  <button
                    key={city.tag}
                    onClick={() => handleCitySelect(city)}
                    className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs text-left text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pointer-events-none" />
                    <span className="truncate pointer-events-none">{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map Technology Badge */}
          {!collapsed && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Free Map Engines</span>
                </span>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded">0 Cost</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Powered by OpenStreetMap, CartoDB, Nominatim & OSRM Foot Routing.
              </p>
            </div>
          )}
        </div>

        {/* Footer Status & API Key Widget */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
          {/* API Keys Configuration Button */}
          <button
            onClick={() => {
              setApiKeyModalOpen(true);
              setMobileOpen(false);
            }}
            title="Configure Mapbox / ORS / Google API Keys"
            className={`w-full flex items-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all font-semibold text-xs shadow-2xs cursor-pointer select-none ${
              collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
            }`}
          >
            <div className="flex items-center space-x-2 pointer-events-none">
              <Key className="w-4 h-4 text-blue-600 flex-shrink-0" />
              {!collapsed && <span>API Keys Setup</span>}
            </div>
            {!collapsed && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 border border-blue-200 font-bold pointer-events-none">
                Configure
              </span>
            )}
          </button>

          {!collapsed ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  FastAPI Engine
                </span>
                <span className="font-semibold text-emerald-700">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Mode</span>
                <span className="font-semibold text-blue-600">LIVE ROUTING</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="FastAPI Engine Online">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* Global API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />
    </>
  );
}

