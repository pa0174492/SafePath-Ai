"use client";

import React, { useState } from "react";
import { 
  X, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Sparkles, 
  Clock, 
  Accessibility, 
  Compass, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  UserCheck, 
  Building2, 
  Lightbulb,
  ExternalLink
} from "lucide-react";

interface HowItIsUsefulModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "compare" | "counterfactual";
}

export function HowItIsUsefulModal({ isOpen, onClose, mode }: HowItIsUsefulModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "personas" | "problem" | "math">("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {mode === "compare" ? "Side-by-Side Pareto Engine" : "Resilience & Crisis Simulation"}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-World Impact Case
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white">
                {mode === "compare" 
                  ? "How Side-by-Side Route Comparison Solves Real-World Problems" 
                  : "How Counterfactual Simulation Solves Real-Time Crises"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "overview", label: "Executive Summary", icon: Sparkles },
            { id: "problem", label: "The Real Problem Solved", icon: AlertTriangle },
            { id: "personas", label: "User Personas & Impact", icon: UserCheck },
            { id: "math", label: "Scientific & System Advantage", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-white shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-blue-900 text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>The Fundamental Question Answered</span>
                </span>
                <p className="leading-relaxed">
                  {mode === "compare"
                    ? "Standard navigation platforms (Google Maps, Apple Maps) answer only one question: 'What is the fastest way from A to B?' They treat a pitch-black deserted alleyway with a 40% crime risk identically to a brightly lit, CCTV-monitored university boulevard if the alley is 45 seconds shorter. SafePath-AI provides side-by-side transparency, letting you see the exact human cost of saving 90 seconds."
                    : "Standard GPS systems are completely static: if a sudden cloudburst inundates an underpass or a transformer blowout plunges 4 blocks into darkness, traditional maps continue guiding pedestrians right into the hazard. SafePath-AI's Counterfactual Engine simulates localized disruptions before or during travel, proving how dynamically recomputing non-dominated paths protects human life."}
                </p>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    {mode === "compare" ? "Transparent Trade-Offs" : "Pre-Trip Stress Testing"}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mode === "compare"
                      ? "Quantifies trade-offs precisely: +1.8 minutes longer (+11%), but -78% lower incident risk, 100% lit streets, and 0 wheelchair barriers."
                      : "Walkers, parents, or university night escorts can test scenarios: 'What if it rains 3x harder at 10 PM?' to evaluate route resilience before stepping outside."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Accessibility className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    {mode === "compare" ? "Accessibility Assurance" : "Disaster Barrier Avoidance"}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mode === "compare"
                      ? "Reveals hidden physical barriers that standard maps miss: curbs without ramps, slope gradients >8.33%, and unpaved muddy footpaths."
                      : "Identifies single-point-of-failure bottlenecks (like low subways or unlit construction zones) where vulnerable individuals could become trapped."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    {mode === "compare" ? "Personal Security" : "Actionable Contingency"}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mode === "compare"
                      ? "Integrates real-time incident reports, street lighting lux, and 24/7 security booth proximity into a robust risk metric (R)."
                      : "Generates instant detour guidance that maintains high elevation, active surveillance, and reliable emergency safe havens."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "problem" && (
            <div className="space-y-4">
              <div className="border border-red-200 bg-red-50/70 p-4 rounded-2xl space-y-2 text-red-950">
                <span className="font-bold flex items-center gap-1.5 text-red-900 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>The 'Shortest Distance Blindness' Crisis</span>
                </span>
                <p className="text-xs leading-relaxed text-red-900/90">
                  Every year, thousands of pedestrians—particularly solo women, students, and persons with disabilities—face harassment, accidents, or physical obstruction because conventional routing engines are blind to contextual safety factors:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-red-900/80">
                  <li><strong>The Dark Alley Shortcut:</strong> Traditional algorithms recommend unlit 50-meter alleys over illuminated main avenues just to shave 30 seconds of travel time.</li>
                  <li><strong>The Surprise Staircase:</strong> A wheelchair user is guided down a direct route only to encounter a 4-step barrier with no curb ramp.</li>
                  <li><strong>The Static Weather Trap:</strong> Rain starts 10 minutes into a 25-minute journey, turning an unpaved pedestrian trail into an impassable mud basin.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>How SafePath-AI Fixes This</span>
                </span>
                <p className="text-xs leading-relaxed">
                  SafePath-AI replaces scalarized single-number optimization with <strong>Multi-Objective Bicriterion Optimal A* (BOA*)</strong>. Instead of picking one 'best' route, it computes the mathematically complete non-dominated Pareto frontier:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs">
                    <span className="font-bold text-slate-800 block">1. Vector Optimization</span>
                    <span className="text-slate-600">Travel time, robust safety risk, worst-case CVaR 95%, accessibility burden, and environmental exposure are treated as equal vector dimensions.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs">
                    <span className="font-bold text-slate-800 block">2. Segment Arrival Context</span>
                    <span className="text-slate-600">Evaluates lighting, precipitation, and traffic at the exact moment you reach each street segment, not when you leave your house.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "personas" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">01</span>
                  <h4 className="font-bold text-slate-900 text-sm">Late-Night Student & Solo Commuter</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Scenario:</strong> Walking back to campus hostel from Kakatiya University or KITS Warangal at 10:30 PM.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="text-emerald-700 font-bold block">SafePath Value:</span>
                  <span>Selects 'Guardian Security Route' with 100% continuous streetlights, verified police emergency kiosks, and active storefronts. Avoids unlit shortcut alleys.</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">02</span>
                  <h4 className="font-bold text-slate-900 text-sm">Wheelchair & Stroller User</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Scenario:</strong> Navigating from Hyderabad Metro station to Mindspace office with a manual wheelchair.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="text-purple-700 font-bold block">SafePath Value:</span>
                  <span>Enforces slope threshold &lt; 2.5%, predicts missing OSM curb ramp tags with calibrated Bayesian confidence, and guarantees zero stair barriers.</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">03</span>
                  <h4 className="font-bold text-slate-900 text-sm">City Transportation Planner & Municipal Auditor</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Scenario:</strong> Auditing pedestrian corridor vulnerabilities across Warangal and Hyderabad.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="text-blue-700 font-bold block">SafePath Value:</span>
                  <span>Runs counterfactual storm simulations to identify which pedestrian corridors suffer catastrophic accessibility collapse during monsoons.</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">04</span>
                  <h4 className="font-bold text-slate-900 text-sm">University Security & Campus Escort Dispatch</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Scenario:</strong> Campus security providing live safety guidance to students during localized events or outages.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="text-emerald-700 font-bold block">SafePath Value:</span>
                  <span>Simulates localized corridor barricades in real-time, verifying that safe escort routes remain open with verified camera coverage.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "math" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="uppercase text-[10px] tracking-wider text-blue-400">Exact Mathematical Vector Comparison</span>
                  <span>Algorithm: BOA*</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-300">
                  <code>C(P) = [ T(P), D(P), R_robust(P), CVaR_95(P), B_access(P), E_env(P) ]</code>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed font-sans">
                  Unlike traditional routers that multiply weights together into a single arbitrary number, SafePath preserves the multi-dimensional cost vector. A route is included on the Pareto frontier if and only if no other route is strictly better in all dimensions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Robust Risk Metric (R_robust)</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    <code>R_robust = μ_risk + λ * σ_risk</code> where λ represents user uncertainty aversion. If lighting or crime risk on a dark street has high variance, it is penalized severely to prevent false safety guarantees.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resilience Index (ρ)</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Calculates how well a route maintains hypervolume when subjected to external perturbations like 3.5x rain or 90% lighting decay without catastrophic detours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            SafePath-AI Urban Mobility Research • MIT License
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Got it, Back to App
          </button>
        </div>
      </div>
    </div>
  );
}
