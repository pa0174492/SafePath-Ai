"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ShieldAlert, 
  Navigation, 
  Sun, 
  CloudRain, 
  Accessibility, 
  Compass, 
  Clock, 
  Activity, 
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { RouteCandidate, RouteSegment } from "@/lib/api";

interface SafeWalkHudProps {
  candidate: RouteCandidate;
  isOpen: boolean;
  onClose: () => void;
  onSelectSegment?: (seg: RouteSegment) => void;
}

export function SafeWalkHud({ candidate, isOpen, onClose, onSelectSegment }: SafeWalkHudProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isAutoWalking, setIsAutoWalking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const segments = candidate.segments;
  const currentSeg = segments[currentStepIdx] || segments[0];

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && !voiceMuted) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech error:", e);
      }
    }
  };

  // Announce first step on open
  useEffect(() => {
    if (isOpen && currentSeg) {
      const warning = !currentSeg.is_lit ? " Attention: low light corridor." : "";
      speakText(`Starting navigation on ${candidate.name}. Proceed ${currentSeg.distance_m} meters.${warning}`);
      if (onSelectSegment) onSelectSegment(currentSeg);
    }
  }, [isOpen]);

  // Auto walk simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoWalking && isOpen) {
      timer = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < segments.length - 1) {
            const nextIdx = prev + 1;
            const nextSeg = segments[nextIdx];
            if (onSelectSegment) onSelectSegment(nextSeg);
            const warning = !nextSeg.is_lit 
              ? " Caution: entering unlit corridor ahead." 
              : nextSeg.slope_pct > 6 
                ? " Caution: steep incline detected." 
                : "";
            speakText(`Step ${nextIdx + 1}: Proceed ${nextSeg.distance_m} meters on ${nextSeg.road_class || "pathway"}.${warning}`);
            return nextIdx;
          } else {
            setIsAutoWalking(false);
            speakText("You have reached your destination safely. SafePath navigation complete.");
            return prev;
          }
        });
      }, 4200);
    }
    return () => clearInterval(timer);
  }, [isAutoWalking, isOpen, segments, voiceMuted]);

  if (!isOpen || !candidate) return null;

  const totalDistance = segments.reduce((sum, s) => sum + s.distance_m, 0);
  const remainingDistance = segments.slice(currentStepIdx).reduce((sum, s) => sum + s.distance_m, 0);
  const progressPct = Math.round(((totalDistance - remainingDistance) / Math.max(1, totalDistance)) * 100);

  const handleNextStep = () => {
    if (currentStepIdx < segments.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      const nextSeg = segments[nextIdx];
      if (onSelectSegment) onSelectSegment(nextSeg);
      speakText(`In ${nextSeg.distance_m} meters, continue on ${nextSeg.road_class || "designated walkway"}.`);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      const prevSeg = segments[prevIdx];
      if (onSelectSegment) onSelectSegment(prevSeg);
      speakText(`Previous maneuver: ${prevSeg.distance_m} meters.`);
    }
  };

  const handleReplayInstruction = () => {
    const warning = !currentSeg.is_lit ? " Caution: unlit segment." : "";
    speakText(`Proceed ${currentSeg.distance_m} meters on ${currentSeg.road_class || "pathway"}.${warning}`);
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-700/80 max-w-2xl w-full pointer-events-auto space-y-4 animate-in slide-in-from-bottom-6 duration-200">
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Navigation className="w-4 h-4 stroke-[2.3]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{candidate.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Step {currentStepIdx + 1} of {segments.length} • {progressPct}% Complete
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setVoiceMuted(!voiceMuted);
                if (voiceMuted) {
                  speakText("Voice guidance enabled.");
                } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors ${
                voiceMuted ? "bg-slate-800 text-slate-400" : "bg-blue-600/30 text-blue-300 border border-blue-500/30"
              }`}
              title={voiceMuted ? "Unmute Voice Guidance" : "Mute Voice Guidance"}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            </button>

            <Link
              href="/safehavens"
              className="px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-bold flex items-center space-x-1 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS</span>
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Maneuver Instruction Banner */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {currentSeg.distance_m}m
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                (~{Math.round(currentSeg.estimated_duration_s)}s walk)
              </span>
            </div>

            <p className="text-sm font-bold text-white leading-snug">
              Proceed along {currentSeg.road_class || "pedestrian corridor"} toward next crossing
            </p>

            {/* Environmental Safety Indicator */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              {currentSeg.is_lit ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center space-x-1">
                  <Sun className="w-3 h-3" />
                  <span>Well Lit ({currentSeg.lux_at_arrival || 35} lux)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Illumination Area</span>
                </span>
              )}

              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium flex items-center space-x-1">
                <Accessibility className="w-3 h-3" />
                <span>Slope: {currentSeg.slope_pct}%</span>
              </span>

              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium font-mono">
                Robust Risk: {currentSeg.robust_risk.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleReplayInstruction}
            className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors shrink-0"
            title="Repeat Voice Direction"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-1.5 transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
            <span>Remaining: <strong className="text-white">{remainingDistance}m</strong></span>
            <span>Speed: <strong className="text-white">4.8 km/h</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsAutoWalking(!isAutoWalking);
                if (!isAutoWalking) {
                  speakText("Simulated safe walk playback engaged.");
                }
              }}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                isAutoWalking
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              }`}
            >
              {isAutoWalking ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Walk</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto Walk</span>
                </>
              )}
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStepIdx === segments.length - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
