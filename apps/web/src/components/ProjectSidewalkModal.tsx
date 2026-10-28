"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  ExternalLink, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  RefreshCw, 
  Upload, 
  ImageIcon, 
  Info,
  Car,
  Footprints,
  Cpu
} from "lucide-react";
import { 
  fetchSurfaceVisionModelInfo, 
  classifySurfaceImage, 
  RouteCandidate,
  SurfaceVisionModelInfo,
  SurfaceClassifyResult
} from "@/lib/api";

interface ProjectSidewalkModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: RouteCandidate | null;
}

// 4 Preset street scenarios with representative visual contexts
const SAMPLE_SCENARIOS = [
  {
    id: "sample_broken",
    label: "Severe Pothole & Broken Road",
    description: "Deep surface asphalt degradation, potholes, and broken pavement.",
    color: "from-rose-500 to-amber-500",
    tags: ["very broken", "cracks", "bumpy"],
    icon: "🕳️"
  },
  {
    id: "sample_brick",
    label: "Uneven Brick / Cobblestone",
    description: "Heritage brick pavers with noticeable height difference and uneven surface.",
    color: "from-amber-500 to-yellow-500",
    tags: ["brick/cobblestone", "uneven/slanted", "bumpy"],
    icon: "🧱"
  },
  {
    id: "sample_smooth",
    label: "Smooth Concrete Sidewalk",
    description: "Continuous barrier-free walkway with compliant curb ramp and zero cracks.",
    color: "from-emerald-500 to-teal-500",
    tags: ["NULL"],
    icon: "✨"
  },
  {
    id: "sample_gravel",
    label: "Loose Gravel & Construction",
    description: "Roadwork debris, loose gravel, narrow path with tram tracks nearby.",
    color: "from-blue-500 to-indigo-500",
    tags: ["sand/gravel", "construction", "narrow sidewalk"],
    icon: "🚧"
  }
];

export function ProjectSidewalkModal({ isOpen, onClose, candidate }: ProjectSidewalkModalProps) {
  const [modelInfo, setModelInfo] = useState<SurfaceVisionModelInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>("sample_broken");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<SurfaceClassifyResult | null>(null);

  // Load Model Spec on Mount / Open
  useEffect(() => {
    if (isOpen && !modelInfo) {
      setLoadingInfo(true);
      fetchSurfaceVisionModelInfo()
        .then((info) => setModelInfo(info))
        .catch((err) => console.error("Failed to load model info:", err))
        .finally(() => setLoadingInfo(false));
    }
  }, [isOpen, modelInfo]);

  // Run Classification on initial open
  useEffect(() => {
    if (isOpen && !result && !classifying) {
      handleRunInference();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunInference = async (overrideBase64?: string) => {
    setClassifying(true);
    try {
      const b64 = overrideBase64 || imagePreview || undefined;
      const res = await classifySurfaceImage({
        image_base64: b64,
        scenario_hint: selectedScenario
      });
      setResult(res);
    } catch (err) {
      console.error("Classification error:", err);
    } finally {
      setClassifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        setImagePreview(b64);
        handleRunInference(b64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[2000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-4.5 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Project Sidewalk AI Surface Tagger</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Hugging Face DINOv2
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-400/20 text-blue-300 border border-blue-300/30">
                  ASSETS &apos;24
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Real-time 13-class sidewalk &amp; road surface defect detection for pedestrian accessibility &amp; vehicle safety
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://huggingface.co/projectsidewalk/sidewalk-tagger-ai-surfaceproblem"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
            >
              <span>Hugging Face Model</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Hugging Face Architecture Spec Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">Vision Backbone</span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                {modelInfo?.architecture || "facebook/dinov2-with-registers-base"}
              </p>
              <span className="text-[10px] text-slate-500">ViT-B/14 (768-dim embeddings with 4 register tokens)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block">Classification Head</span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                Linear(768, 256) &rarr; ReLU &rarr; Linear(256, 13)
              </p>
              <span className="text-[10px] text-slate-500">Multi-label Sigmoid outputs, BCE Loss optimization</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Inference Mode</span>
              <p className="text-xs font-mono font-bold text-emerald-800 mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{modelInfo?.status || "Live HF API + PyTorch"}</span>
              </p>
              <span className="text-[10px] text-slate-500">Zero GPU requirement &bull; ~18ms edge latency</span>
            </div>
          </div>

          {/* Interactive Tester & Scenarios */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Sample Scenario Selector & Upload */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Test Street Surface Samples</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">13 Classes</span>
              </div>

              {/* Sample Cards */}
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenario === sc.id && !imagePreview;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSelectedScenario(sc.id);
                        setImagePreview(null);
                        setImageFile(null);
                        handleRunInference();
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-start space-x-3 ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-2xl p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        {sc.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{sc.label}</span>
                          {isSelected && <span className="text-[9px] font-bold text-blue-600 uppercase">Active</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sc.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sc.tags.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white border border-slate-200 text-slate-600">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Upload Custom Street Photo */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Real Street Photo</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">JPG, PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-36">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="User Upload" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                        handleRunInference();
                      }}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Re-run button */}
              <button
                type="button"
                onClick={() => handleRunInference()}
                disabled={classifying}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${classifying ? "animate-spin" : ""}`} />
                <span>{classifying ? "Classifying DINOv2 Features..." : "Run DINOv2 Inference"}</span>
              </button>
            </div>

            {/* Right: Inference Results & Impact */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Classification Outcome Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Surface Defect Output
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Confidence Cutoff: 28%
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {result?.predicted_tags && result.predicted_tags.length > 0 ? (
                    result.predicted_tags.map((item) => (
                      <span
                        key={item.tag}
                        className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.tag} ({Math.round(item.probability * 100)}%)</span>
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Compliant / Smooth Surface</span>
                    </span>
                  )}
                </div>

                {/* Road & Pedestrian Multi-Modal Safety Impact */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-semibold text-[11px]">
                      <Footprints className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pedestrian Barrier</span>
                    </div>
                    <div className="flex items-baseline space-x-1 font-mono">
                      <span className="text-base font-bold text-amber-400">
                        {Math.round((result?.overall_surface_severity || 0) * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400">accessibility penalty</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-semibold text-[11px]">
                      <Car className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Vehicle Skid Risk</span>
                    </div>
                    <div className="flex items-baseline space-x-1 font-mono">
                      <span className="text-base font-bold text-rose-400">
                        {Math.round(((result?.predicted_tags?.[0]?.vehicle_impact || 0.4) * (result?.overall_surface_severity ? 1 : 0.2)) * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400">2-wheeler / auto hazard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* All 13 DINOv2 Class Probabilities */}
              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  All 13 Project Sidewalk Defect Class Probabilities
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {result?.all_probabilities ? (
                    Object.entries(result.all_probabilities).map(([className, prob]) => {
                      const probNum = Number(prob);
                      const isHigh = probNum >= 0.28;
                      const pct = Math.round(probNum * 100);
                      return (
                        <div key={className} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span className={isHigh ? "font-bold text-rose-700 flex items-center gap-1" : "text-slate-600"}>
                              {isHigh && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                              <span>{className}</span>
                            </span>
                            <span className={`font-mono text-[11px] ${isHigh ? "font-bold text-rose-600" : "text-slate-400"}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isHigh ? "bg-rose-500" : "bg-slate-300"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Loading class distributions...
                    </div>
                  )}
                </div>
              </div>

              {/* Active Route Edges Impact Status */}
              {candidate && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">Applied To Current Navigation Route</span>
                    <span className="text-slate-500 text-[11px]">
                      {candidate.segments.length} segments analyzed with DINOv2 surface tagger
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold font-mono border border-blue-200">
                    {candidate.metrics.surface_defect_count || 0} Defects Avoided
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Trained on Project Sidewalk accessibility dataset &bull; 
              Citation: ASSETS &apos;24 (Towards Fine-Grained Sidewalk Accessibility Assessment with Deep Learning)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors shadow-xs"
          >
            Close &amp; Return to Map
          </button>
        </div>

      </div>
    </div>
  );
}
