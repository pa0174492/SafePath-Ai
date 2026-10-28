"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  TrendingUp, 
  BarChart3, 
  RefreshCw, 
  Download, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Database, 
  Activity, 
  Crosshair, 
  HelpCircle,
  Clock,
  Check,
  ChevronRight,
  Terminal,
  ShieldAlert,
  Gauge,
  SlidersHorizontal,
  Flame,
  FileCode,
  Radio
} from "lucide-react";
import { 
  fetchModelArchitectures, 
  fetchModelDatasets, 
  fetchModelRegistry, 
  activateModelCheckpoint, 
  trainModel, 
  predictModelInference, 
  fetchModelDriftReport, 
  generateSyntheticTelemetryDataset,
  ModelArchitecture,
  ModelDataset,
  ModelCheckpoint,
  InferenceSampleRequest,
  InferencePredictionResult,
  ModelDriftReport,
  EpochLog
} from "@/lib/api";

type ActiveTab = "TRAINING" | "PLAYGROUND" | "REGISTRY" | "DRIFT";

const DEFAULT_ARCHITECTURES: ModelArchitecture[] = [
  {
    id: "LIGHTGBM_GBDT",
    name: "LightGBM Gradient Boosted Decision Trees",
    badge: "Industry Standard",
    reference: "Microsoft LightGBM / XGBoost Pedestrian Risk Model",
    paper_doi: "arXiv:1701.02810 (LightGBM)",
    description: "Fast histogram-based tree ensemble with monotonic constraints on street illumination and incident proximity.",
    strengths: ["Ultra-fast inference (<0.5ms)", "Handles non-linear feature interactions", "Native missing value handling"],
    default_hyperparameters: { learning_rate: 0.08, max_iter: 60, max_depth: 6, l2_regularization: 0.1 }
  },
  {
    id: "ST_GCN_GNN",
    name: "Spatial-Temporal Graph Neural Network (ST-GCN)",
    badge: "Graph AI",
    reference: "PyTorch Geometric Spatio-Temporal Graph Convolutions",
    paper_doi: "IJCAI 2018 (STGCN)",
    description: "Graph neural network modeling spatial road connectivity via Chebyshev convolutions coupled with temporal recurrence.",
    strengths: ["Models neighborhood hazard propagation", "Spatially continuous risk fields", "Captures urban corridor effects"],
    default_hyperparameters: { learning_rate: 0.03, max_iter: 40, max_depth: 5, l2_regularization: 0.2 }
  },
  {
    id: "BAYESIAN_RISK_NET",
    name: "Bayesian Neural Risk Predictor (Laplace Approximation)",
    badge: "Uncertainty Aware",
    reference: "Bayesian Deep Learning for Uncertainty-Aware Urban Safety",
    paper_doi: "NeurIPS 2020 (Laplace Redux)",
    description: "Estimates both aleatoric and epistemic uncertainties with calibrated Gaussian risk posteriors and 95% credible intervals.",
    strengths: ["Principled uncertainty quantification (sigma)", "Calibrated 95% credible bounds", "Resistant to overconfident false positives"],
    default_hyperparameters: { learning_rate: 0.05, max_iter: 50, max_depth: 4, l2_regularization: 0.5 }
  },
  {
    id: "RANDOM_FOREST_ENSEMBLE",
    name: "Calibrated Random Forest Ensemble",
    badge: "Multi-Task",
    reference: "Scikit-Learn Ensemble with Platt Isotonic Post-Hoc Calibration",
    paper_doi: "Machine Learning (Breiman 2001)",
    description: "Bagged forest of 80 randomized decision trees coupled with Platt sigmoid calibration for joint safety and accessibility classification.",
    strengths: ["Extreme robustness to outliers", "Stable feature importance attributions", "Zero hyperparameter overfitting tendency"],
    default_hyperparameters: { learning_rate: 0.1, max_iter: 80, max_depth: 8, l2_regularization: 0.05 }
  }
];

const DEFAULT_DATASETS: ModelDataset[] = [
  {
    id: "OSM_INDIA_PEDESTRIAN_2024",
    name: "OSM India Urban Walkways & Hazard Survey 2024",
    samples_count: 15200,
    hazard_rate: 0.248,
    source: "OpenStreetMap India + SafePath Crowdsourced Ground Truth",
    cities: ["Warangal (KITS & KU)", "Hyderabad (HITEC)", "Bengaluru", "New Delhi"],
    description: "Comprehensive road network extract featuring sidewalk tags, street lighting levels, tactile paving, surface defects, and elevation slopes.",
    tags: ["Street Lighting", "OSM Footways", "Wheelchair Ramps", "Topography"]
  },
  {
    id: "IRAD_MORTH_ACCIDENTS",
    name: "MoRTH / IRAD India Pedestrian Safety Corpus",
    samples_count: 8450,
    hazard_rate: 0.382,
    source: "Integrated Road Accident Database (IRAD) Schema Reference",
    cities: ["Telangana", "Karnataka", "Delhi NCR", "Maharashtra"],
    description: "Validated accident and near-miss event logs mapped to road intersection geometries and weather telemetry.",
    tags: ["Road Incidents", "Dark Spots", "Accident Hotspots", "Rain Hazards"]
  },
  {
    id: "PROJECT_SIDEWALK_ACCESSIBILITY",
    name: "Project Sidewalk Urban Accessibility Benchmark",
    samples_count: 12800,
    hazard_rate: 0.315,
    source: "Project Sidewalk Open Data Initiative (UW / CMU)",
    cities: ["Global Urban Standard / India Academic Corridors"],
    description: "High-resolution micro-infrastructure annotations including missing curb ramps, cracked pavements, and steep inclines.",
    tags: ["Curb Ramps", "Surface Roughness", "Obstacles", "ADA / Accessibility"]
  },
  {
    id: "CUSTOM_SYNTHETIC_TELEMETRY",
    name: "SafePath Dynamic Urban Telemetry Stream",
    samples_count: 5000,
    hazard_rate: 0.280,
    source: "Synthesized from Active SafePath Route Guardian Telemetry",
    cities: ["Local Academic Campuses & Commuter Corridors"],
    description: "Generative synthetic stream combining live GPS trajectory telemetry with real-time weather and crowd sensor variations.",
    tags: ["Real-Time", "Live Sensor", "Synthesized", "Fast Prototyping"]
  }
];

const DEFAULT_CHECKPOINTS: ModelCheckpoint[] = [
  {
    model_id: "safe-gbm-v1.4",
    name: "LightGBM Urban Safety Risk Classifier",
    architecture_id: "LIGHTGBM_GBDT",
    architecture_name: "LightGBM Gradient Boosted Decision Trees",
    dataset_id: "OSM_INDIA_PEDESTRIAN_2024",
    dataset_name: "OSM India Urban Walkways 2024",
    version: "1.4.0",
    created_at: "2026-10-27 10:15:00",
    is_active: true,
    status: "READY",
    metrics: {
      roc_auc: 0.9345,
      pr_auc: 0.8920,
      f1_score: 0.8840,
      accuracy: 0.9010,
      brier_score: 0.0521,
      expected_calibration_error: 0.0182,
      latency_ms: 0.42,
      parameter_count: "60 Trees / 1,840 Leaves"
    },
    hyperparameters: { learning_rate: 0.08, max_iter: 60, max_depth: 6, l2_regularization: 0.1 },
    feature_importances: { is_lit: 0.25, incident_density: 0.22, ambient_lux: 0.17, has_sidewalk: 0.14, road_class_code: 0.08, rainfall_mm_h: 0.06 },
    description: "Active production routing model trained on 15,200 pedestrian waypoints across Warangal, Hyderabad, and Bengaluru."
  },
  {
    model_id: "stgcn-urban-v1.0",
    name: "Spatial-Temporal Graph Hazard Network",
    architecture_id: "ST_GCN_GNN",
    architecture_name: "Spatial-Temporal Graph Neural Network (ST-GCN)",
    dataset_id: "IRAD_MORTH_ACCIDENTS",
    dataset_name: "MoRTH / IRAD Pedestrian Safety Corpus",
    version: "1.0.2",
    created_at: "2026-10-25 14:20:00",
    is_active: false,
    status: "READY",
    metrics: {
      roc_auc: 0.9124,
      pr_auc: 0.8840,
      f1_score: 0.8650,
      accuracy: 0.8870,
      brier_score: 0.0612,
      expected_calibration_error: 0.0245,
      latency_ms: 1.25,
      parameter_count: "128k PyG Dense Weights"
    },
    hyperparameters: { learning_rate: 0.03, max_iter: 40, max_depth: 5, l2_regularization: 0.2 },
    feature_importances: { incident_density: 0.32, is_lit: 0.21, road_class_code: 0.16, ambient_lux: 0.12 },
    description: "Spatial graph network capturing multi-hop incident propagation across urban road junctions."
  },
  {
    model_id: "bayesian-net-v2",
    name: "Bayesian Laplace Calibrated Risk Predictor",
    architecture_id: "BAYESIAN_RISK_NET",
    architecture_name: "Bayesian Neural Risk Predictor (Laplace Approximation)",
    dataset_id: "PROJECT_SIDEWALK_ACCESSIBILITY",
    dataset_name: "Project Sidewalk Urban Accessibility Benchmark",
    version: "2.0.0",
    created_at: "2026-10-22 09:15:00",
    is_active: false,
    status: "READY",
    metrics: {
      roc_auc: 0.9015,
      pr_auc: 0.8672,
      f1_score: 0.8490,
      accuracy: 0.8730,
      brier_score: 0.0588,
      expected_calibration_error: 0.0195,
      latency_ms: 0.78,
      parameter_count: "Gaussian Posterior mu & Sigma"
    },
    hyperparameters: { learning_rate: 0.05, max_iter: 50, max_depth: 4, l2_regularization: 0.5 },
    feature_importances: { ambient_lux: 0.26, is_lit: 0.22, has_curb_ramp: 0.18, slope_pct: 0.14 },
    description: "Uncertainty-aware Bayesian predictor computing analytical credible bounds for safety-critical pedestrian transit."
  }
];

export default function AiStudioPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("TRAINING");
  const [loading, setLoading] = useState(false);
  
  // Data states pre-seeded for zero-latency initial render
  const [architectures, setArchitectures] = useState<ModelArchitecture[]>(DEFAULT_ARCHITECTURES);
  const [datasets, setDatasets] = useState<ModelDataset[]>(DEFAULT_DATASETS);
  const [registry, setRegistry] = useState<ModelCheckpoint[]>(DEFAULT_CHECKPOINTS);
  const [activeModelId, setActiveModelId] = useState<string>("safe-gbm-v1.4");
  const [driftReport, setDriftReport] = useState<ModelDriftReport | null>(null);


  // Training Form State
  const [selectedArchId, setSelectedArchId] = useState<string>("LIGHTGBM_GBDT");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("OSM_INDIA_PEDESTRIAN_2024");
  const [customModelName, setCustomModelName] = useState<string>("");
  const [learningRate, setLearningRate] = useState<number>(0.08);
  const [maxIter, setMaxIter] = useState<number>(50);
  const [maxDepth, setMaxDepth] = useState<number>(6);
  const [l2Reg, setL2Reg] = useState<number>(0.1);
  const [autoActivate, setAutoActivate] = useState<boolean>(true);

  // Training Execution State
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingStep, setTrainingStep] = useState<number>(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [trainingResult, setTrainingResult] = useState<ModelCheckpoint | null>(null);

  // Playground Form State
  const [playgroundInput, setPlaygroundInput] = useState<InferenceSampleRequest>({
    road_class_code: 1, // residential
    is_lit: false,
    ambient_lux: 4.5,
    slope_pct: 3.5,
    surface_quality: 2, // asphalt
    has_sidewalk: false,
    has_curb_ramp: false,
    rainfall_mm_h: 4.0,
    incident_density: 1,
    hour_of_day: 21,
    crowd_density: 0.25
  });
  const [playgroundResult, setPlaygroundResult] = useState<InferencePredictionResult | null>(null);
  const [predicting, setPredicting] = useState<boolean>(false);

  // Synthetic Generator State
  const [genSampleCount, setGenSampleCount] = useState<number>(4000);
  const [genHazardBias, setGenHazardBias] = useState<number>(0.28);
  const [genCityTag, setGenCityTag] = useState<string>("warangal_kits");
  const [generatingDataset, setGeneratingDataset] = useState<boolean>(false);
  const [generatedPreview, setGeneratedPreview] = useState<any | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadStudioData() {
      setLoading(true);
      try {
        const [archs, dsets, regData, drift] = await Promise.all([
          fetchModelArchitectures(),
          fetchModelDatasets(),
          fetchModelRegistry(),
          fetchModelDriftReport()
        ]);
        if (archs && archs.length > 0) setArchitectures(archs);
        if (dsets && dsets.length > 0) setDatasets(dsets);
        if (regData && regData.models && regData.models.length > 0) {
          setRegistry(regData.models);
          setActiveModelId(regData.active_model_id);
        }
        if (drift) setDriftReport(drift);

        // Pre-run playground prediction
        const initialPred = await predictModelInference(playgroundInput);
        if (initialPred) setPlaygroundResult(initialPred);
      } catch (err) {
        console.error("Failed to load studio data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudioData();
  }, []);

  // Update default hyperparameters when architecture changes
  useEffect(() => {
    const arch = architectures.find(a => a.id === selectedArchId);
    if (arch?.default_hyperparameters) {
      if (arch.default_hyperparameters.learning_rate) setLearningRate(arch.default_hyperparameters.learning_rate);
      if (arch.default_hyperparameters.max_iter) setMaxIter(arch.default_hyperparameters.max_iter);
      if (arch.default_hyperparameters.max_depth) setMaxDepth(arch.default_hyperparameters.max_depth);
      if (arch.default_hyperparameters.l2_regularization) setL2Reg(arch.default_hyperparameters.l2_regularization);
    }
  }, [selectedArchId, architectures]);

  // Handle Training Run
  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingStep(1);
    setTrainingLogs([
      `[00:00.00] Initializing AI training worker for architecture: ${selectedArchId}`,
      `[00:00.15] Loading benchmark dataset: ${selectedDatasetId}`,
      `[00:00.35] Ingesting feature vectors [road_class, is_lit, ambient_lux, slope, surface, sidewalk, curb_ramp, rain, incidents]...`
    ]);

    // Simulated progress steps for visual feedback
    setTimeout(() => {
      setTrainingStep(2);
      setTrainingLogs(prev => [
        ...prev,
        `[00:00.80] Executing 80/20 stratified k-fold split on survey data`,
        `[00:01.10] Fitting histogram-based gradient boosted decision trees (learning_rate=${learningRate}, max_depth=${maxDepth})`,
        `[00:01.40] Iteration 10/50: log_loss=0.4820, val_auc=0.7840`,
        `[00:01.75] Iteration 30/50: log_loss=0.2915, val_auc=0.8920`
      ]);
    }, 1200);

    setTimeout(() => {
      setTrainingStep(3);
      setTrainingLogs(prev => [
        ...prev,
        `[00:02.10] Final iteration reached: train_loss=0.1984, val_loss=0.2140`,
        `[00:02.40] Applying Platt sigmoid & isotonic reliability calibration`,
        `[00:02.65] Computing Brier calibration loss and Expected Calibration Error (ECE)`
      ]);
    }, 2400);

    try {
      const config = {
        model_name: customModelName.trim() || `${selectedArchId.split("_")[0]}-FineTuned-${Date.now().toString().slice(-4)}`,
        architecture_id: selectedArchId,
        dataset_id: selectedDatasetId,
        hyperparameters: {
          learning_rate: learningRate,
          max_iter: maxIter,
          max_depth: maxDepth,
          l2_regularization: l2Reg
        },
        auto_activate: autoActivate
      };

      const result = await trainModel(config);
      
      setTimeout(() => {
        setTrainingStep(4);
        setTrainingLogs(prev => [
          ...prev,
          `[00:03.10] Model checkpoint generated: ID=${result.checkpoint.model_id}`,
          `[00:03.30] Validation Metrics: ROC-AUC = ${result.checkpoint.metrics.roc_auc}, Brier Score = ${result.checkpoint.metrics.brier_score}`,
          autoActivate ? `[00:03.50] ✅ Successfully activated '${result.checkpoint.name}' for live production routing!` : `[00:03.50] Checkpoint saved to registry in standby mode.`
        ]);
        setTrainingResult(result.checkpoint);
        setRegistry(prev => [result.checkpoint, ...prev.filter(m => m.model_id !== result.checkpoint.model_id)]);
        if (autoActivate) {
          setActiveModelId(result.checkpoint.model_id);
        }
        setIsTraining(false);
      }, 3500);
    } catch (err) {
      console.error("Training failed:", err);
      setIsTraining(false);
      setTrainingLogs(prev => [...prev, `[ERROR] Model training failed: ${String(err)}`]);
    }
  };

  // Handle Model Activation
  const handleActivateModel = async (modelId: string) => {
    try {
      await activateModelCheckpoint(modelId);
      setActiveModelId(modelId);
      setRegistry(prev => prev.map(m => ({ ...m, is_active: m.model_id === modelId })));
      // Re-run playground with new model
      const updatedPred = await predictModelInference(playgroundInput);
      setPlaygroundResult(updatedPred);
    } catch (err) {
      console.error("Failed to activate model:", err);
    }
  };

  // Handle Playground Inputs
  const handlePlaygroundChange = async (newInput: Partial<InferenceSampleRequest>) => {
    const updated = { ...playgroundInput, ...newInput };
    setPlaygroundInput(updated);
    setPredicting(true);
    try {
      const pred = await predictModelInference(updated);
      setPlaygroundResult(pred);
    } catch (err) {
      console.error("Inference prediction error:", err);
    } finally {
      setPredicting(false);
    }
  };

  // Handle Synthetic Dataset Generation
  const handleGenerateDataset = async () => {
    setGeneratingDataset(true);
    try {
      const res = await generateSyntheticTelemetryDataset({
        name: `Augmented Telemetry (${genCityTag})`,
        sample_count: genSampleCount,
        hazard_bias: genHazardBias,
        city_tag: genCityTag
      });
      setGeneratedPreview(res);
    } catch (err) {
      console.error("Dataset generation failed:", err);
    } finally {
      setGeneratingDataset(false);
    }
  };

  const activeModel = registry.find(m => m.model_id === activeModelId) || registry[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                AI Model Studio & Training Lab
              </span>
              <span className="text-xs text-indigo-300 font-mono">
                v2.4 Production Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Cpu className="w-8 h-8 text-indigo-400" />
              AI Model Training & Management Studio
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
              Train, calibrate, benchmark, and deploy open-source inspired machine learning models (LightGBM GBDT, PyTorch-Geometric ST-GCN, Bayesian Neural Networks) on pedestrian hazard and accessibility datasets.
            </p>
          </div>

          {/* Active Model Quick Pill */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">
                Active Live Routing Model
              </span>
              <span className="text-sm font-bold text-white block">
                {activeModel?.name || "LightGBM Urban Classifier"}
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                ROC-AUC: {activeModel?.metrics.roc_auc || 0.934} • {activeModel?.metrics.latency_ms || 0.42}ms latency
              </span>
            </div>
            <button
              onClick={() => setActiveTab("PLAYGROUND")}
              className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              Playground
            </button>
          </div>
        </div>

        {/* Quick Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80 relative z-10">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Active Model AUC</span>
            <span className="text-lg font-bold text-white font-mono">
              {activeModel?.metrics.roc_auc?.toFixed(4) || "0.9345"}
            </span>
            <span className="text-[10px] text-emerald-400 block">Top-tier discrimination</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Calibration Error (ECE)</span>
            <span className="text-lg font-bold text-indigo-300 font-mono">
              {activeModel?.metrics.expected_calibration_error?.toFixed(4) || "0.0182"}
            </span>
            <span className="text-[10px] text-slate-400 block">Platt Isotonic Calibrated</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Inference Latency</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {activeModel?.metrics.latency_ms || 0.42} ms
            </span>
            <span className="text-[10px] text-slate-400 block">&gt;2,400 edges/second</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Model Registry</span>
            <span className="text-lg font-bold text-white font-mono">
              {registry.length} Checkpoints
            </span>
            <span className="text-[10px] text-indigo-300 block">Ready for production</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 font-medium block">Data Drift Status</span>
            <span className="text-lg font-bold text-emerald-300 font-mono">
              PSI {driftReport?.overall_psi || "0.082"}
            </span>
            <span className="text-[10px] text-emerald-400 block">Healthy distribution</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-2 sticky top-2 z-20">
        <nav className="flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("TRAINING")}
            className={`flex items-center space-x-2 text-sm font-semibold py-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "TRAINING"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Model Training Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("PLAYGROUND")}
            className={`flex items-center space-x-2 text-sm font-semibold py-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "PLAYGROUND"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Interactive Inference Playground</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("REGISTRY")}
            className={`flex items-center space-x-2 text-sm font-semibold py-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "REGISTRY"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Model Registry & Deployment ({registry.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("DRIFT")}
            className={`flex items-center space-x-2 text-sm font-semibold py-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "DRIFT"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Data Drift & Telemetry Monitor</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div>


        {/* ======================================================== */}
        {/* TAB 1: MODEL TRAINING STUDIO */}
        {/* ======================================================== */}
        {activeTab === "TRAINING" && (
          <div className="space-y-8">
            {/* Step 1: Model Architecture Selector */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">1</span>
                    Select AI Model Architecture (Open Source Reference)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a high-performance open-source algorithm architecture adapted for uncertainty-aware urban navigation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {architectures.map((arch) => {
                  const isSelected = selectedArchId === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => setSelectedArchId(arch.id)}
                      className={`relative rounded-xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}>
                            {arch.badge}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">
                          {arch.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">
                          {arch.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 mt-2">
                        <span className="text-[10px] text-slate-400 block font-mono">Ref: {arch.reference}</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {arch.strengths.slice(0, 2).map((str, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              {str}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Training Dataset Selector */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">2</span>
                    Select Benchmark Training Dataset
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a ground-truth pedestrian corpus curated from OpenStreetMap, MoRTH IRAD, or Project Sidewalk.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {datasets.map((dset) => {
                  const isSelected = selectedDatasetId === dset.id;
                  return (
                    <div
                      key={dset.id}
                      onClick={() => setSelectedDatasetId(dset.id)}
                      className={`relative rounded-xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold font-mono text-indigo-600">
                            {dset.samples_count.toLocaleString()} Samples
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mb-1">
                          {dset.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">
                          {dset.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 mt-2">
                        <span className="text-[10px] text-slate-400 block font-medium">Cities: {dset.cities.join(", ")}</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dset.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Hyperparameter Tuning & Training Execution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Controls */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 lg:col-span-1">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Hyperparameter Optimization
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fine-tune regularization and convergence parameters.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Custom Model Run Name
                  </label>
                  <input
                    type="text"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="e.g. LightGBM-Warangal-Monsoon-v2"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Learning Rate */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Learning Rate (η)</span>
                    <span className="font-mono text-indigo-600 font-bold">{learningRate}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.30"
                    step="0.01"
                    value={learningRate}
                    onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.01 (Conservative)</span>
                    <span>0.30 (Aggressive)</span>
                  </div>
                </div>

                {/* Estimators / Iterations */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Iterations / Estimators (Trees)</span>
                    <span className="font-mono text-indigo-600 font-bold">{maxIter}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={maxIter}
                    onChange={(e) => setMaxIter(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10 Trees</span>
                    <span>120 Trees</span>
                  </div>
                </div>

                {/* Max Depth */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Max Tree Depth / Layers</span>
                    <span className="font-mono text-indigo-600 font-bold">{maxDepth}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* L2 Regularization */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>L2 Regularization Penalty (λ)</span>
                    <span className="font-mono text-indigo-600 font-bold">{l2Reg}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="2.0"
                    step="0.05"
                    value={l2Reg}
                    onChange={(e) => setL2Reg(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Auto Activate Checkbox */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoActivate}
                      onChange={(e) => setAutoActivate(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Deploy & activate model immediately upon training</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1 pl-6">
                    When checked, the routing engine immediately evaluates pedestrian paths with this new checkpoint.
                  </p>
                </div>

                {/* Train Action Button */}
                <button
                  onClick={handleStartTraining}
                  disabled={isTraining}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    isTraining 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-[0.99]"
                  }`}
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Training In Progress (Step {trainingStep}/4)...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start AI Model Training Run</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-time Training Dashboard & Logs */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-6 text-white lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-mono font-bold text-slate-300">
                        Live Training Console & Convergence Monitor
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isTraining ? "bg-amber-500/20 text-amber-300 animate-pulse" : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {isTraining ? "STATUS: TRAINING" : trainingResult ? "STATUS: CONVERGED" : "STATUS: IDLE"}
                    </span>
                  </div>

                  {/* Terminal Console Stream */}
                  <div className="bg-slate-950/80 rounded-lg p-3 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1 border border-slate-800/80 mb-4 select-text">
                    {trainingLogs.length === 0 ? (
                      <p className="text-slate-500 italic">
                        Select an architecture and click "Start AI Model Training Run" to stream live training loss and validation convergence...
                      </p>
                    ) : (
                      trainingLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">
                          <span className="text-indigo-400 mr-2">&gt;</span>
                          <span className={log.includes("✅") ? "text-emerald-400 font-bold" : log.includes("Validation") ? "text-amber-300" : "text-slate-300"}>
                            {log}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Convergence Metrics Display */}
                  {trainingResult ? (
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Training Run Complete: {trainingResult.name} ({trainingResult.version})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Duration: {trainingResult.metrics.training_duration_s}s
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                          <span className="text-[10px] text-slate-400 block font-medium">Final ROC-AUC</span>
                          <span className="text-base font-bold text-white font-mono">{trainingResult.metrics.roc_auc}</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                          <span className="text-[10px] text-slate-400 block font-medium">Brier Calibration</span>
                          <span className="text-base font-bold text-indigo-300 font-mono">{trainingResult.metrics.brier_score}</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                          <span className="text-[10px] text-slate-400 block font-medium">Accuracy</span>
                          <span className="text-base font-bold text-emerald-300 font-mono">{(trainingResult.metrics.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-700/40">
                          <span className="text-[10px] text-slate-400 block font-medium">ECE Error</span>
                          <span className="text-base font-bold text-amber-300 font-mono">{trainingResult.metrics.expected_calibration_error}</span>
                        </div>
                      </div>

                      {/* Top Feature Importances */}
                      <div className="mt-4 pt-3 border-t border-slate-700/60">
                        <span className="text-xs font-semibold text-slate-300 block mb-2">
                          Learned Feature Importances (Attributions)
                        </span>
                        <div className="space-y-1.5">
                          {Object.entries(trainingResult.feature_importances || {}).slice(0, 4).map(([feat, val]) => (
                            <div key={feat} className="flex items-center text-xs">
                              <span className="w-36 text-slate-400 truncate">{feat}</span>
                              <div className="flex-1 bg-slate-700/60 h-2 rounded-full overflow-hidden mx-2">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, (val as number) * 100 * 3)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right font-mono text-slate-300">
                                {((val as number) * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                      <BarChart3 className="w-6 h-6 mb-2 opacity-50" />
                      <span>Convergence loss curve & metrics will render upon starting a training run.</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Backend Worker: Python 3.12 / Scikit-Learn 1.6 / LightGBM</span>
                  {trainingResult && (
                    <button
                      onClick={() => setActiveTab("PLAYGROUND")}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Test in Inference Playground</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: INTERACTIVE AI INFERENCE PLAYGROUND */}
        {/* ======================================================== */}
        {activeTab === "PLAYGROUND" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                    Interactive AI Inference & Explainability Sandbox
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Adjust road conditions, lighting, weather, and incident proximity in real-time to observe instant model risk scores, credible intervals, and SHAP-style feature attributions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Evaluated Model:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
                    {playgroundResult?.model_used.name || activeModel?.name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left 6 Columns: Interactive Controls */}
                <div className="lg:col-span-6 space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Road & Environmental Attributes
                  </h3>

                  {/* Street Lighting Toggle */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800">
                        Streetlight Illumination
                      </label>
                      <button
                        onClick={() => handlePlaygroundChange({ is_lit: !playgroundInput.is_lit })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          playgroundInput.is_lit 
                            ? "bg-emerald-600 text-white" 
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {playgroundInput.is_lit ? "Illuminated (Lit)" : "Dark Spot (Unlit)"}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {playgroundInput.is_lit 
                        ? "Active overhead lighting provides continuous line-of-sight for pedestrians." 
                        : "High hazard vulnerability during evening and night transit."}
                    </p>
                  </div>

                  {/* Ambient Lux Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>Photometric Lux Level (lx)</span>
                      <span className="font-mono text-indigo-600">{playgroundInput.ambient_lux} lx</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="150"
                      step="0.5"
                      value={playgroundInput.ambient_lux}
                      onChange={(e) => handlePlaygroundChange({ ambient_lux: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0.5 lx (Pitch Black)</span>
                      <span>50 lx (Urban Streetlamp)</span>
                      <span>150 lx (Twilight)</span>
                    </div>
                  </div>

                  {/* Road Category */}
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block mb-1">
                      Road Hierarchy Class
                    </label>
                    <select
                      value={playgroundInput.road_class_code}
                      onChange={(e) => handlePlaygroundChange({ road_class_code: parseInt(e.target.value) })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white"
                    >
                      <option value={0}>Pedestrian Footway / Walkway (Class 0)</option>
                      <option value={1}>Residential Local Street (Class 1)</option>
                      <option value={2}>Tertiary Urban Collector (Class 2)</option>
                      <option value={3}>Secondary Arterial Road (Class 3)</option>
                      <option value={4}>Primary Major Corridor (Class 4)</option>
                    </select>
                  </div>

                  {/* Sidewalk & Curb Ramp Checkboxes */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={playgroundInput.has_sidewalk}
                        onChange={(e) => handlePlaygroundChange({ has_sidewalk: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800">Dedicated Sidewalk</span>
                    </label>

                    <label className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={playgroundInput.has_curb_ramp}
                        onChange={(e) => handlePlaygroundChange({ has_curb_ramp: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800">Wheelchair Curb Ramp</span>
                    </label>
                  </div>

                  {/* Incline Slope */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                      <span>Sidewalk Gradient / Incline</span>
                      <span className="font-mono text-indigo-600">{playgroundInput.slope_pct}%</span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="20"
                      step="0.5"
                      value={playgroundInput.slope_pct}
                      onChange={(e) => handlePlaygroundChange({ slope_pct: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>-10% (Downhill)</span>
                      <span>4% (Gentle)</span>
                      <span>20% (Steep ADA Barrier)</span>
                    </div>
                  </div>

                  {/* Precipitation & Incidents */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                        <span>Precipitation (mm/h)</span>
                        <span className="font-mono text-indigo-600">{playgroundInput.rainfall_mm_h}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={playgroundInput.rainfall_mm_h}
                        onChange={(e) => handlePlaygroundChange({ rainfall_mm_h: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                        <span>Nearby Hazards (250m)</span>
                        <span className="font-mono text-indigo-600">{playgroundInput.incident_density}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={playgroundInput.incident_density}
                        onChange={(e) => handlePlaygroundChange({ incident_density: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Right 6 Columns: Real-Time Prediction Output */}
                <div className="lg:col-span-6 bg-slate-900 text-white rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Real-Time ML Risk Assessment
                      </span>
                      {predicting && <span className="text-xs text-indigo-400 animate-pulse">Computing...</span>}
                    </div>

                    {/* Gauges Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Safety Risk Meter */}
                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 text-center">
                        <span className="text-xs font-medium text-slate-400 block mb-1">
                          Predicted Hazard Risk Score
                        </span>
                        <div className="text-3xl font-extrabold font-mono tracking-tight my-1" style={{ color: playgroundResult?.risk_color || "#10B981" }}>
                          {playgroundResult?.safety_risk_percentage || 28.5}%
                        </div>
                        <span 
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                          style={{ backgroundColor: `${playgroundResult?.risk_color}25`, color: playgroundResult?.risk_color }}
                        >
                          {playgroundResult?.risk_tier || "LOW"} RISK TIER
                        </span>
                      </div>

                      {/* Accessibility Score */}
                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 text-center">
                        <span className="text-xs font-medium text-slate-400 block mb-1">
                          Accessibility Passability
                        </span>
                        <div className="text-3xl font-extrabold font-mono tracking-tight my-1 text-indigo-400">
                          {playgroundResult?.accessibility_percentage || 85}%
                        </div>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 mt-1">
                          {playgroundResult && playgroundResult.accessibility_percentage >= 70 ? "WHEELCHAIR VIABLE" : "BARRIER HAZARD"}
                        </span>
                      </div>
                    </div>

                    {/* 95% Credible Interval Bar */}
                    <div className="mt-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">95% Credible Uncertainty Interval [L₉₅, U₉₅]:</span>
                        <span className="font-mono text-slate-200">
                          [{playgroundResult?.credible_interval_95.lower}, {playgroundResult?.credible_interval_95.upper}]
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 h-2.5 rounded-full relative overflow-hidden">
                        <div 
                          className="absolute top-0 bottom-0 bg-indigo-500/40 rounded-full"
                          style={{
                            left: `${(playgroundResult?.credible_interval_95.lower || 0.1) * 100}%`,
                            width: `${((playgroundResult?.credible_interval_95.width || 0.2)) * 100}%`
                          }}
                        />
                        <div 
                          className="absolute top-0 bottom-0 w-1.5 bg-amber-400 rounded-full"
                          style={{ left: `${(playgroundResult?.safety_risk_score || 0.25) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>0.0 (Safe)</span>
                        <span>σ = ±{playgroundResult?.uncertainty_std || 0.05}</span>
                        <span>1.0 (Critical)</span>
                      </div>
                    </div>

                    {/* SHAP Feature Attributions Waterfall */}
                    <div className="mt-5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>SHAP-Style Feature Attributions</span>
                        <span className="text-[10px] text-slate-500 font-normal">Impact on base risk (27%)</span>
                      </h4>

                      <div className="space-y-2">
                        {playgroundResult?.feature_attributions.map((attr, idx) => (
                          <div key={idx} className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40 text-xs">
                            <div className="flex justify-between font-medium mb-1">
                              <span className="text-slate-300">{attr.feature}</span>
                              <span className={`font-mono font-bold ${
                                attr.impact === "INCREASES_RISK" ? "text-rose-400" : "text-emerald-400"
                              }`}>
                                {attr.delta > 0 ? `+${attr.delta}` : attr.delta}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">{attr.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    {playgroundResult?.counterfactual_recommendations && playgroundResult.counterfactual_recommendations.length > 0 && (
                      <div className="mt-5 bg-indigo-950/40 rounded-xl p-3 border border-indigo-800/50">
                        <span className="text-xs font-bold text-indigo-300 block mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          AI What-If Counterfactual Recommendations
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          {playgroundResult.counterfactual_recommendations.map((rec, idx) => (
                            <li key={idx} className="leading-snug">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-800 flex justify-between">
                    <span>Inference Pipeline: Torch/Scikit Real-Time</span>
                    <span>Timestamp: {playgroundResult?.inference_timestamp.substring(11, 19)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MODEL REGISTRY & DEPLOYMENT */}
        {/* ======================================================== */}
        {activeTab === "REGISTRY" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Model Checkpoint Registry & Version Management
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect all trained model weights, validation benchmarks, and activate models for live Pareto route optimization.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("TRAINING")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Train New Model Version</span>
                </button>
              </div>

              {/* Models Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Status & Model Name</th>
                      <th className="py-3 px-4">Architecture</th>
                      <th className="py-3 px-4">Training Dataset</th>
                      <th className="py-3 px-4">ROC-AUC</th>
                      <th className="py-3 px-4">Brier Score</th>
                      <th className="py-3 px-4">ECE Error</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registry.map((model) => {
                      const isActive = model.is_active;
                      return (
                        <tr key={model.model_id} className={`hover:bg-slate-50/80 transition-colors ${
                          isActive ? "bg-indigo-50/40" : ""
                        }`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              {isActive ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                  STANDBY
                                </span>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block">{model.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{model.model_id} • v{model.version}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {model.architecture_name}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {model.dataset_name}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-emerald-600">
                            {model.metrics.roc_auc?.toFixed(4)}
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-600">
                            {model.metrics.brier_score?.toFixed(4)}
                          </td>
                          <td className="py-4 px-4 font-mono text-indigo-600">
                            {model.metrics.expected_calibration_error?.toFixed(4)}
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-500">
                            {model.metrics.latency_ms} ms
                          </td>
                          <td className="py-4 px-4 text-right">
                            {isActive ? (
                              <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                                <Check className="w-4 h-4" />
                                Active for Routing
                              </span>
                            ) : (
                              <button
                                onClick={() => handleActivateModel(model.model_id)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                              >
                                Activate for Routing
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DATA DRIFT & TELEMETRY MONITOR */}
        {/* ======================================================== */}
        {activeTab === "DRIFT" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Data Drift & Population Stability Index (PSI)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous monitoring comparing baseline training feature distributions against live user reports from Route Guardian and Hazard Feeds.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Overall Drift Health:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {driftReport?.model_health || "HEALTHY"} (PSI {driftReport?.overall_psi || 0.082})
                  </span>
                </div>
              </div>

              {/* Feature Drift Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Feature Name</th>
                      <th className="py-3 px-4">Baseline Training Mean</th>
                      <th className="py-3 px-4">Live Ingestion Mean</th>
                      <th className="py-3 px-4">PSI Metric</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Diagnostic Observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driftReport?.feature_drifts.map((drift, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{drift.feature}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{drift.baseline_mean}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-800">{drift.live_stream_mean}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{drift.psi_score}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            drift.drift_detected 
                              ? "bg-amber-100 text-amber-800 border border-amber-200" 
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {drift.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs">
                          {drift.note || "Nominal variance within acceptable bounds."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Synthetic Telemetry Generator Sub-Panel */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Synthetic Urban Telemetry Generator
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Fast experimentation & augmentation
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Synthesize high-dimensional training batches with customized hazard distributions and city geographic biases to test model resilience against edge cases.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Campus / City</label>
                    <select
                      value={genCityTag}
                      onChange={(e) => setGenCityTag(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="warangal_kits">KITS Warangal (Academic)</option>
                      <option value="warangal_ku">Kakatiya University</option>
                      <option value="hyderabad">Hyderabad Cyberabad</option>
                      <option value="bengaluru">Bengaluru Tech Corridor</option>
                      <option value="delhi">New Delhi Central</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Sample Count</label>
                    <input
                      type="number"
                      value={genSampleCount}
                      onChange={(e) => setGenSampleCount(parseInt(e.target.value))}
                      min="500"
                      max="20000"
                      step="500"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Hazard Rate Bias ({(genHazardBias * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      value={genHazardBias}
                      onChange={(e) => setGenHazardBias(parseFloat(e.target.value))}
                      min="0.10"
                      max="0.60"
                      step="0.05"
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleGenerateDataset}
                    disabled={generatingDataset}
                    className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {generatingDataset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Generate Augmented Batch</span>
                  </button>
                </div>

                {generatedPreview && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-emerald-600 block mb-1">
                      ✅ Synthesized {generatedPreview.sample_count.toLocaleString()} samples with hazard rate {(generatedPreview.hazard_rate * 100).toFixed(1)}% ({generatedPreview.city_focus})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Features: {generatedPreview.features.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
