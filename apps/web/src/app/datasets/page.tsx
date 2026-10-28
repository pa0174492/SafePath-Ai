"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Database, 
  Server, 
  HardDrive, 
  RefreshCw, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Download, 
  PlusCircle, 
  Split, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Compass, 
  MapPin, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Copy, 
  Check, 
  X, 
  FileJson, 
  Activity, 
  Zap, 
  TrendingUp, 
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
  Gauge
} from "lucide-react";
import { 
  fetchMongoDbStatus, 
  fetchDatasetRecords, 
  fetchDatasetStatistics, 
  seedBigDataRecords, 
  resplitDataset, 
  clearDatasetCollection,
  MongoDbStatus, 
  DatasetRecord, 
  DatasetStatistics 
} from "@/lib/api";

const DEFAULT_MONGO_STATUS: MongoDbStatus = {
  connected: true,
  engine: "MongoDB Community Server",
  version: "7.0.11",
  host: "mongodb://localhost:27017",
  database: "safepath_ai_bigdata",
  collection: "training_dataset",
  total_records: 12000,
  train_count: 8398,
  test_count: 1805,
  val_count: 1797,
  hazard_count: 355,
  hazard_rate: 0.03,
  storage_size_mb: 6.7,
  latency_ms: 0.85
};

const DEFAULT_STATS: DatasetStatistics = {
  total_documents: 12000,
  splits: { TRAIN: 8398, TEST: 1805, VALIDATION: 1797 },
  city_distribution: {
    "Warangal (KITS Campus)": 2412,
    "Warangal (Kakatiya Univ)": 2403,
    "Hyderabad (Cyberabad)": 2352,
    "Bengaluru (Tech Corridor)": 2466,
    "New Delhi (Central)": 2367
  },
  road_class_distribution: {
    residential: 4499,
    footway: 3348,
    tertiary: 1949,
    secondary: 1374,
    primary: 830
  },
  hazard_rate: 0.03,
  lighting_coverage_pct: 64.3,
  sidewalk_coverage_pct: 72.1
};

export default function DatasetsBigDataPage() {
  // MongoDB status & aggregate statistics
  const [mongoStatus, setMongoStatus] = useState<MongoDbStatus>(DEFAULT_MONGO_STATUS);
  const [stats, setStats] = useState<DatasetStatistics>(DEFAULT_STATS);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Big data query and pagination state
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [totalCount, setTotalCount] = useState(12000);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(480);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters
  const [splitFilter, setSplitFilter] = useState<string>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [hazardFilter, setHazardFilter] = useState<number>(-1);
  const [lightingFilter, setLightingFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Interactive modals / drawers
  const [selectedRecord, setSelectedRecord] = useState<DatasetRecord | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [resplitModalOpen, setResplitModalOpen] = useState(false);
  const [ingestCount, setIngestCount] = useState(5000);
  const [forceRefreshIngest, setForceRefreshIngest] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Resplit ratios
  const [trainRatio, setTrainRatio] = useState(0.70);
  const [testRatio, setTestRatio] = useState(0.15);
  const [valRatio, setValRatio] = useState(0.15);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load status and high level statistics
  const loadMetadata = useCallback(async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        fetchMongoDbStatus(),
        fetchDatasetStatistics()
      ]);
      setMongoStatus(statusData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading MongoDB metadata:", err);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch paginated records from MongoDB
  const loadRecords = useCallback(async () => {
    setTableLoading(true);
    try {
      let isLitParam: boolean | null = null;
      if (lightingFilter === "LIT") isLitParam = true;
      if (lightingFilter === "UNLIT") isLitParam = false;

      const res = await fetchDatasetRecords({
        page: currentPage,
        page_size: pageSize,
        split: splitFilter,
        city: cityFilter,
        is_hazardous: hazardFilter,
        is_lit: isLitParam,
        search: debouncedSearch.trim() || undefined,
        sort_by: sortBy,
        sort_asc: sortAsc
      });

      if (res && res.records) {
        setRecords(res.records);
        setTotalCount(res.total);
        setTotalPages(res.total_pages);
      }
    } catch (err) {
      console.error("Failed to load records from MongoDB:", err);
    } finally {
      setTableLoading(false);
    }
  }, [currentPage, pageSize, splitFilter, cityFilter, hazardFilter, lightingFilter, debouncedSearch, sortBy, sortAsc]);

  // Initial data loading
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Re-fetch records when table parameters change
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadMetadata();
    loadRecords();
  };

  // Handle seeding batch
  const handleSeedBatch = async () => {
    setActionInProgress(true);
    setActionMessage(`Ingesting ${ingestCount.toLocaleString()} high-dimensional records into MongoDB...`);
    try {
      const res = await seedBigDataRecords({
        count: ingestCount,
        force_refresh: forceRefreshIngest
      });
      setActionMessage(`Ingested ${res.inserted_count.toLocaleString()} records! Database total is now ${res.total_records.toLocaleString()}.`);
      setTimeout(() => {
        setIngestModalOpen(false);
        setActionInProgress(false);
        setActionMessage(null);
        handleRefresh();
      }, 1200);
    } catch (e: any) {
      setActionMessage(`Seeding error: ${e.message || "Failed to insert"}`);
      setActionInProgress(false);
    }
  };

  // Handle resplit
  const handleResplit = async () => {
    setActionInProgress(true);
    setActionMessage(`Re-stratifying train/test/val splits (${Math.round(trainRatio * 100)}% / ${Math.round(testRatio * 100)}% / ${Math.round(valRatio * 100)}%)...`);
    try {
      const res = await resplitDataset({
        train_ratio: trainRatio,
        test_ratio: testRatio,
        val_ratio: valRatio
      });
      setActionMessage(`Successfully re-stratified ${res.total_updated.toLocaleString()} documents in MongoDB!`);
      setTimeout(() => {
        setResplitModalOpen(false);
        setActionInProgress(false);
        setActionMessage(null);
        handleRefresh();
      }, 1200);
    } catch (e: any) {
      setActionMessage(`Resplit error: ${e.message || "Failed to update splits"}`);
      setActionInProgress(false);
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    if (!selectedRecord) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export current records as JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `safepath_mongodb_export_${splitFilter.toLowerCase()}_p${currentPage}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export as CSV
  const handleExportCsv = () => {
    if (!records || records.length === 0) return;
    const headers = [
      "record_id", "split", "city", "dataset_origin", "road_class", "is_lit", 
      "ambient_lux", "slope_pct", "surface_quality", "has_sidewalk", "has_curb_ramp", 
      "rainfall_mm_h", "incident_density", "hour_of_day", "crowd_density", 
      "is_hazardous", "continuous_risk", "lat", "lon", "timestamp"
    ];
    const rows = records.map(r => [
      r.record_id,
      r.split,
      `"${r.city}"`,
      r.dataset_origin,
      r.road_class,
      r.is_lit ? 1 : 0,
      r.ambient_lux,
      r.slope_pct,
      `"${r.surface_quality}"`,
      r.has_sidewalk ? 1 : 0,
      r.has_curb_ramp ? 1 : 0,
      r.rainfall_mm_h,
      r.incident_density,
      r.hour_of_day,
      r.crowd_density,
      r.is_hazardous,
      r.continuous_risk,
      r.coordinate?.lat || "",
      r.coordinate?.lon || "",
      r.timestamp
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `safepath_mongodb_${splitFilter.toLowerCase()}_p${currentPage}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Split badge helper
  const renderSplitBadge = (split: string) => {
    switch (split) {
      case "TRAIN":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">TRAIN (70%)</span>;
      case "TEST":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">TEST (15%)</span>;
      case "VALIDATION":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">VALIDATION (15%)</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{split}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <Database className="w-4 h-4 animate-pulse" />
            <span>ENTERPRISE BIG DATA LAKE</span>
            <span className="text-slate-600">•</span>
            <span>MONGODB REPOSITORY</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-semibold">PARTITIONED TRAIN & TEST CORPUS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            MongoDB Big Data Lake & Dataset Visibility
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Connection
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Query, inspect, and analyze high-volume pedestrian safety telemetry stored directly in MongoDB. 
            All documents are indexed and partitioned into stratified <strong>TRAIN</strong>, <strong>TEST</strong>, and <strong>VALIDATION</strong> splits for AI model training.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>

          <button 
            onClick={() => setIngestModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Ingest Big Data
          </button>

          <button 
            onClick={() => setResplitModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            <Split className="w-3.5 h-3.5 text-cyan-400" />
            Re-stratify Splits
          </button>

          <Link
            href="/ai-studio?dataset=MONGODB_BIGDATA_LAKE"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-blue-950/40 transition-all hover:scale-[1.02]"
          >
            <Cpu className="w-3.5 h-3.5" />
            Train AI Model
          </Link>
        </div>
      </div>

      {/* MongoDB Live Cluster Connection Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Connection Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Cluster Engine
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ONLINE {mongoStatus.version}
            </span>
          </div>
          <div className="text-lg font-bold text-white tracking-tight">{mongoStatus.engine}</div>
          <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-1 truncate">
            <span className="text-slate-500">Host:</span>
            <span className="text-emerald-400 truncate">{mongoStatus.host}</span>
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400 flex items-center gap-1 truncate">
            <span className="text-slate-500">Namespace:</span>
            <span className="text-cyan-400 font-semibold truncate">{mongoStatus.database}.{mongoStatus.collection}</span>
          </div>
        </div>

        {/* Total Documents in MongoDB */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              Total Big Data Records
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-medium">
              {mongoStatus.latency_ms}ms latency
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {mongoStatus.total_records.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Storage footprint</span>
            <span className="font-mono text-slate-200">{mongoStatus.storage_size_mb} MB (BSON)</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
            <span>Hazard ground truth</span>
            <span className="font-mono text-amber-400 font-medium">{mongoStatus.hazard_count.toLocaleString()} ({Math.round(mongoStatus.hazard_rate * 100)}%)</span>
          </div>
        </div>

        {/* Partition Split Allocation */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/40 transition-all md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-purple-400" />
              Train / Test / Validation Stratification
            </span>
            <span className="text-xs text-slate-400">
              Deterministic 70 : 15 : 15 Split
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-emerald-500/20">
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Train Partition</div>
              <div className="text-lg font-bold text-white mt-0.5">{mongoStatus.train_count.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">70% for Backprop / Tree Fits</div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-cyan-500/20">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Test Partition</div>
              <div className="text-lg font-bold text-white mt-0.5">{mongoStatus.test_count.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">15% Holdout Evaluation</div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-purple-500/20">
              <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Validation Set</div>
              <div className="text-lg font-bold text-white mt-0.5">{mongoStatus.val_count.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">15% Calibration & ECE</div>
            </div>
          </div>

          {/* Progress bar split visualizer */}
          <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div 
              style={{ width: `${(mongoStatus.train_count / Math.max(1, mongoStatus.total_records)) * 100}%` }} 
              className="h-full bg-emerald-500" 
              title={`Train Split: ${mongoStatus.train_count}`}
            />
            <div 
              style={{ width: `${(mongoStatus.test_count / Math.max(1, mongoStatus.total_records)) * 100}%` }} 
              className="h-full bg-cyan-500" 
              title={`Test Split: ${mongoStatus.test_count}`}
            />
            <div 
              style={{ width: `${(mongoStatus.val_count / Math.max(1, mongoStatus.total_records)) * 100}%` }} 
              className="h-full bg-purple-500" 
              title={`Validation Split: ${mongoStatus.val_count}`}
            />
          </div>
        </div>

      </div>

      {/* Dataset Statistics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Streetlight Illumination</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">{stats.lighting_coverage_pct}% Coverage</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sun className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Sidewalk Walkability</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">{stats.sidewalk_coverage_pct}% Footways</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Academic & Metro Corridors</div>
            <div className="text-base font-bold text-cyan-300 mt-0.5">5 Major Hubs</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total BSON Documents</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">{stats.total_documents.toLocaleString()} Records</div>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Database className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Big Data Table & Filter Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        
        {/* Top Controls: Search, Split Tabs & Exports */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Split Partition Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setSplitFilter("ALL"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                splitFilter === "ALL" 
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Records ({totalCount.toLocaleString()})
            </button>
            <button
              onClick={() => { setSplitFilter("TRAIN"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                splitFilter === "TRAIN" 
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" 
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              TRAIN Split ({mongoStatus.train_count.toLocaleString()})
            </button>
            <button
              onClick={() => { setSplitFilter("TEST"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                splitFilter === "TEST" 
                  ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              TEST Split ({mongoStatus.test_count.toLocaleString()})
            </button>
            <button
              onClick={() => { setSplitFilter("VALIDATION"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                splitFilter === "VALIDATION" 
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" 
                  : "text-slate-400 hover:text-purple-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              VALIDATION ({mongoStatus.val_count.toLocaleString()})
            </button>
          </div>

          {/* Search bar & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search record ID, road class, surface..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={handleExportJson}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
              title="Export current page as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              JSON
            </button>

            <button 
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
              title="Export current page as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              CSV
            </button>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
          
          {/* City selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">City / Corridor:</span>
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Cities ({totalCount.toLocaleString()})</option>
              <option value="Warangal (KITS Campus)">Warangal (KITS Campus)</option>
              <option value="Warangal (Kakatiya Univ)">Warangal (Kakatiya Univ)</option>
              <option value="Hyderabad (Cyberabad)">Hyderabad (Cyberabad)</option>
              <option value="Bengaluru (Tech Corridor)">Bengaluru (Tech Corridor)</option>
              <option value="New Delhi (Central)">New Delhi (Central)</option>
            </select>
          </div>

          {/* Hazard classification filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Ground Truth:</span>
            <select
              value={hazardFilter}
              onChange={(e) => { setHazardFilter(parseInt(e.target.value, 10)); setCurrentPage(1); }}
              className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="-1">All Safety Classes</option>
              <option value="0">Safe Footways (Class 0)</option>
              <option value="1">Hazardous Segments (Class 1)</option>
            </select>
          </div>

          {/* Street lighting filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Illumination:</span>
            <select
              value={lightingFilter}
              onChange={(e) => { setLightingFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Lighting</option>
              <option value="LIT">Streetlit Only</option>
              <option value="UNLIT">Unlit / Dark Spots</option>
            </select>
          </div>

          {/* Sort By selector */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="timestamp">Timestamp (Latest)</option>
              <option value="continuous_risk">Predicted Risk Score</option>
              <option value="ambient_lux">Ambient Photometric Lux</option>
              <option value="slope_pct">Sidewalk Gradient %</option>
              <option value="incident_density">Incident Density</option>
            </select>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300"
              title={sortAsc ? "Ascending order" : "Descending order"}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
              className="px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

        </div>

        {/* Big Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-inner">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Record ID & Partition</th>
                <th className="py-3 px-4">City Corridor</th>
                <th className="py-3 px-4">Road Class & Surface</th>
                <th className="py-3 px-4">Lighting & Lux</th>
                <th className="py-3 px-4">Slope & Sidewalk</th>
                <th className="py-3 px-4">Weather / Incidents</th>
                <th className="py-3 px-4">Ground Truth & Risk</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tableLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="font-sans text-xs">Querying MongoDB cluster ({mongoStatus.database}.{mongoStatus.collection})...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Database className="w-8 h-8 text-slate-600" />
                      <span className="font-sans text-sm font-medium text-slate-300">No records match current filter criteria</span>
                      <span className="font-sans text-xs text-slate-500">Try loosening your search query or reset split partition tab.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr 
                    key={record.record_id}
                    className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    
                    {/* Record ID & Split */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {record.record_id}
                        </span>
                        {renderSplitBadge(record.split)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Origin: <span className="text-slate-400">{record.dataset_origin}</span>
                      </div>
                    </td>

                    {/* City Corridor */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{record.city}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {record.coordinate?.lat.toFixed(4)}, {record.coordinate?.lon.toFixed(4)}
                      </div>
                    </td>

                    {/* Road Class & Surface */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {record.road_class}
                        </span>
                        <span className="text-xs text-slate-400">
                          {record.surface_quality}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Class code: {record.road_class_code} • Surface: {record.surface_quality_code}
                      </div>
                    </td>

                    {/* Lighting & Lux */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-sans">
                        {record.is_lit ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            Streetlit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-semibold">
                            <Moon className="w-3.5 h-3.5 text-slate-500" />
                            Unlit
                          </span>
                        )}
                        <span className="text-slate-500">•</span>
                        <span className="font-mono text-slate-300">{record.ambient_lux.toFixed(1)} lux</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Hour: {record.hour_of_day}:00 hrs
                      </div>
                    </td>

                    {/* Slope & Sidewalk */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-sans">
                        <span className={`font-mono text-xs ${Math.abs(record.slope_pct) > 6 ? "text-amber-400 font-semibold" : "text-slate-300"}`}>
                          {record.slope_pct > 0 ? `+${record.slope_pct.toFixed(1)}%` : `${record.slope_pct.toFixed(1)}%`}
                        </span>
                        {record.has_sidewalk ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sidewalk</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-500">No Sidewalk</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Curb ramp: {record.has_curb_ramp ? "Yes" : "None"} • Acc score: {record.accessibility_score.toFixed(2)}
                      </div>
                    </td>

                    {/* Weather / Incidents */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="font-mono text-slate-300">{record.rainfall_mm_h.toFixed(1)} mm/h</span>
                        <span className="text-slate-500">•</span>
                        <span className={`font-mono ${record.incident_density > 0 ? "text-rose-400 font-semibold" : "text-slate-400"}`}>
                          {record.incident_density} reports
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        Crowd density: {(record.crowd_density * 100).toFixed(0)}%
                      </div>
                    </td>

                    {/* Ground Truth & Risk */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        {record.is_hazardous === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            HAZARD (1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            SAFE (0)
                          </span>
                        )}
                        <span className="font-mono text-xs text-slate-300">
                          p={(record.continuous_risk).toFixed(3)}
                        </span>
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, record.continuous_risk * 100)}%` }} 
                          className={`h-full ${record.continuous_risk > 0.4 ? "bg-rose-500" : "bg-emerald-500"}`}
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(record);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Inspect MongoDB BSON Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-400 font-sans">
          <div>
            Showing <strong className="text-white">{((currentPage - 1) * pageSize) + (records.length > 0 ? 1 : 0)}</strong> to{" "}
            <strong className="text-white">{Math.min(totalCount, currentPage * pageSize)}</strong> of{" "}
            <strong className="text-white">{totalCount.toLocaleString()}</strong> MongoDB documents
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || tableLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <span className="px-2 font-mono text-slate-300 font-medium">
              Page {currentPage} / {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || tableLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Document Inspector Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  MongoDB Document: {selectedRecord.record_id}
                </h3>
                {renderSplitBadge(selectedRecord.split)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Copied!" : "Copy BSON"}
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick feature summary cards */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/40 border-b border-slate-800 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Target Label</div>
                <div className={`font-bold mt-0.5 ${selectedRecord.is_hazardous ? "text-rose-400" : "text-emerald-400"}`}>
                  {selectedRecord.is_hazardous ? "HAZARDOUS (1)" : "SAFE (0)"}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Predicted Risk</div>
                <div className="font-bold text-cyan-400 mt-0.5">
                  {(selectedRecord.continuous_risk * 100).toFixed(1)}% (p={selectedRecord.continuous_risk.toFixed(3)})
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">GPS Coordinates</div>
                <div className="font-mono text-slate-200 mt-0.5 truncate">
                  {selectedRecord.coordinate?.lat.toFixed(5)}, {selectedRecord.coordinate?.lon.toFixed(5)}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Illumination</div>
                <div className="font-semibold text-amber-300 mt-0.5">
                  {selectedRecord.is_lit ? "Lit" : "Dark"} ({selectedRecord.ambient_lux.toFixed(1)} lux)
                </div>
              </div>
            </div>

            {/* JSON Content */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950/80 text-emerald-400">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>

            {/* Footer with Train link */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-sans">
              <span className="text-slate-400">
                Collection: <span className="font-mono text-slate-200">safepath_ai_bigdata.training_dataset</span>
              </span>
              <Link
                href="/ai-studio?dataset=MONGODB_BIGDATA_LAKE"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                Train Model with This Partition
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Ingest Big Data Modal */}
      {ingestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Ingest Big Data Records</h3>
              </div>
              <button 
                onClick={() => setIngestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize and insert realistic, high-dimensional pedestrian telemetry records into MongoDB. 
              Each document contains 11 spatial features, GPS coordinates, photometric lux, and automatic 70/15/15 train/test/validation labeling.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Batch Ingestion Size: <span className="text-emerald-400 font-bold font-mono">{ingestCount.toLocaleString()} Documents</span>
                </label>
                <input 
                  type="range"
                  min="1000"
                  max="25000"
                  step="1000"
                  value={ingestCount}
                  onChange={(e) => setIngestCount(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>1,000</span>
                  <span>10,000</span>
                  <span>25,000</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <input 
                  type="checkbox"
                  id="forceRefreshCheck"
                  checked={forceRefreshIngest}
                  onChange={(e) => setForceRefreshIngest(e.target.checked)}
                  className="rounded border-slate-700 accent-emerald-500"
                />
                <label htmlFor="forceRefreshCheck" className="text-slate-300 cursor-pointer">
                  Wipe existing records before ingestion (Fresh re-seed)
                </label>
              </div>

              {actionMessage && (
                <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIngestModalOpen(false)}
                disabled={actionInProgress}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSeedBatch}
                disabled={actionInProgress}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {actionInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                Ingest into MongoDB
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Resplit Modal */}
      {resplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Split className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Re-stratify Train & Test Splits</h3>
              </div>
              <button 
                onClick={() => setResplitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Updates the <code className="text-emerald-400 font-mono">split</code> field across all existing documents in MongoDB collection 
              <code className="text-cyan-400 font-mono"> safepath_ai_bigdata.training_dataset</code>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Training Split Ratio</span>
                  <span className="font-mono text-emerald-400 font-bold">{Math.round(trainRatio * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.50"
                  max="0.85"
                  step="0.05"
                  value={trainRatio}
                  onChange={(e) => {
                    const newTrain = parseFloat(e.target.value);
                    setTrainRatio(newTrain);
                    const remainder = 1.0 - newTrain;
                    setTestRatio(remainder / 2);
                    setValRatio(remainder / 2);
                  }}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/20">
                  <div className="text-slate-400 text-[10px]">Test Partition</div>
                  <div className="font-bold text-cyan-400 font-mono text-sm mt-0.5">{Math.round(testRatio * 100)}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Generalization benchmark</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-purple-500/20">
                  <div className="text-slate-400 text-[10px]">Validation Partition</div>
                  <div className="font-bold text-purple-400 font-mono text-sm mt-0.5">{Math.round(valRatio * 100)}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Reliability & ECE tuning</div>
                </div>
              </div>

              {actionMessage && (
                <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setResplitModalOpen(false)}
                disabled={actionInProgress}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResplit}
                disabled={actionInProgress}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {actionInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Split className="w-3.5 h-3.5" />}
                Apply Stratification
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
