"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Radio,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/health")
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(true));
  }, []);

  const navItems = [
    { href: "/map", label: "Navigation", icon: Map },
    { href: "/safehavens", label: "Emergency SOS", icon: ShieldAlert },
    { href: "/incidents", label: "Hazard Reports", icon: AlertTriangle },
    { href: "/hotspots", label: "Blackspots", icon: Radio },
    { href: "/compare", label: "Pareto Compare", icon: GitCompare },
    { href: "/counterfactual", label: "What-If Studio", icon: Sparkles },
    { href: "/resilience", label: "Resilience", icon: Activity },
    { href: "/accessibility", label: "Accessibility", icon: Accessibility },
    { href: "/context", label: "Live Context", icon: CloudSun },
    { href: "/research", label: "Research", icon: BarChart3 },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1">
                SafePath<span className="text-blue-600 font-semibold">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider block font-medium">
                Urban Routing Research
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono font-medium text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>DEMO MODE</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
