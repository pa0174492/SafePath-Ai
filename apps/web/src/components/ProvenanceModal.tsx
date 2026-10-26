"use client";

import React from "react";
import { RouteCandidate, RouteProvenanceRecord } from "@/lib/api";
import { X, Database, ShieldAlert, CheckCircle2, HelpCircle, Layers, Cpu, Clock } from "lucide-react";

interface ProvenanceModalProps {
  candidate: RouteCandidate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProvenanceModal({ candidate, isOpen, onClose }: ProvenanceModalProps) {
  if (!isOpen || !candidate) return null;

  const allRecords: RouteProvenanceRecord[] = candidate.segments.flatMap((s) => s.provenance);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Route Provenance & Data Lineage</h2>
              <p className="text-xs text-slate-500 font-mono">ID: {candidate.id} • {candidate.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 p-6 border-b border-slate-200 bg-white">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-600 text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Segments Analyzed</span>
            </div>
            <span className="text-xl font-bold font-mono text-slate-900">{candidate.segments.length}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-600 text-xs mb-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Confidence</span>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-700">
              {Math.round(candidate.metrics.overall_confidence_score * 100)}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-600 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Temporal Evaluation</span>
            </div>
            <span className="text-sm font-semibold font-mono text-slate-900">Segment Arrival ETA</span>
          </div>
        </div>

        {/* Scrollable Records */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Segment Attribute Provenance Log
          </h3>

          {allRecords.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No explicit provenance records attached.</p>
          ) : (
            allRecords.slice(0, 20).map((rec, idx) => {
              const isKnown = rec.status === "KNOWN";
              const isInferred = rec.status === "INFERRED";

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-colors flex items-start justify-between text-xs shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 font-mono uppercase">
                        {rec.attribute_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          isKnown
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isInferred
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    <p className="text-slate-600">{rec.details || "Verified spatial attribute"}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                      <span>Source: <strong className="text-slate-700">{rec.source}</strong></span>
                      {rec.model_version && (
                        <span>Model: <strong className="text-slate-700">{rec.model_version}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-blue-600">
                      {Math.round(rec.confidence * 100)}% conf
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
}
