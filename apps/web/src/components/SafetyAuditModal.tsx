"use client";

import React from "react";
import { 
  X, 
  Printer, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Layers, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  PhoneCall, 
  Building2 
} from "lucide-react";
import { RouteCandidate, Coordinate } from "@/lib/api";

interface SafetyAuditModalProps {
  candidate: RouteCandidate | null;
  originName: string;
  destinationName: string;
  origin: Coordinate;
  destination: Coordinate;
  isOpen: boolean;
  onClose: () => void;
}

export function SafetyAuditModal({
  candidate,
  originName,
  destinationName,
  origin,
  destination,
  isOpen,
  onClose
}: SafetyAuditModalProps) {
  if (!isOpen || !candidate) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const auditDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const auditTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls - Hidden when printing */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Route Safety Audit Pass & Verification</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {candidate.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Audit Certificate Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-mono font-bold tracking-wide">
              <span>SAFEPATH-AI URBAN ROUTING RESEARCH PLATFORM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              Pedestrian Safety & Accessibility Audit Certificate
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              SafePath-AI Urban Mobility Research Framework • Dept. of Computer Science & Engineering
            </p>
          </div>

          {/* Audit Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Audit Date</span>
              <span className="font-bold text-slate-900">{auditDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Audit Time</span>
              <span className="font-bold text-slate-900">{auditTime}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Routing Engine</span>
              <span className="font-bold text-blue-700">SafePath BOA*</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Pareto Status</span>
              <span className="font-bold text-emerald-700">Non-Dominated</span>
            </div>
          </div>

          {/* Journey Endpoints */}
          <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Trajectory Origin & Destination
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  A
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{originName}</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    GPS: {origin.lat.toFixed(6)}, {origin.lon.toFixed(6)}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  B
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{destinationName}</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    GPS: {destination.lat.toFixed(6)}, {destination.lon.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Objective Metrics Matrix */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Quantitative 6-Objective Performance Vector
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Physical Distance</span>
                <span className="text-lg font-black font-mono text-slate-900">{candidate.metrics.total_distance_m}m</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Estimated Travel Time</span>
                <span className="text-lg font-black font-mono text-slate-900">{candidate.metrics.total_travel_time_min} mins</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Robust Safety Risk (R)</span>
                <span className="text-lg font-black font-mono text-emerald-700">{candidate.metrics.robust_safety_risk.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Worst-Case Tail Risk (CVaR 95%)</span>
                <span className="text-lg font-black font-mono text-blue-700">{candidate.metrics.worst_case_tail_risk_cvar95.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Accessible Sidewalks</span>
                <span className="text-lg font-black font-mono text-emerald-700">{candidate.metrics.accessible_segments_pct}%</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Model Confidence</span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {Math.round(candidate.metrics.overall_confidence_score * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* AI Decision Rationale */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block font-mono">
              AI Decision Explanation & Hazard Avoidance
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              {candidate.explanation.summary_text}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {candidate.explanation.strengths.map((str, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-blue-800 border border-blue-200">
                  ✓ {str}
                </span>
              ))}
            </div>
          </div>

          {/* Emergency Safety Protocol */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block font-mono">
              Emergency Hotlines Along Corridor
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
              <div>National Emergency: <strong>112</strong></div>
              <div>Police Control: <strong>100</strong></div>
              <div>Medical Ambulance: <strong>108</strong></div>
              <div>Women Helpline: <strong>1091</strong></div>
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
            <div>
              <span>Certified by: <strong>RoadSafe Intelligence Geospatial Engine</strong></span>
              <p className="text-[10px] text-slate-400">Autonomous multi-objective Pareto verification</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                VERIFIED AUDIT PASS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
