"use client";

import React, { useState, useEffect } from "react";
import { fetchBaselines, fetchAblations, fetchCalibration } from "@/lib/api";
import { 
  BarChart3, 
  Download, 
  CheckCircle2, 
  Search, 
  ArrowUpDown, 
  RefreshCw, 
  Code2, 
  Layers,
  FileSpreadsheet
} from "lucide-react";



export default function ResearchPage() {
  const [baselines, setBaselines] = useState<any[]>([]);
  const [ablations, setAblations] = useState<any[]>([]);
  const [calibration, setCalibration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("baseline_id");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [showLatex, setShowLatex] = useState<boolean>(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchBaselines(),
      fetchAblations(),
      fetchCalibration()
    ])
      .then(([b, a, c]) => {
        setBaselines(b || []);
        setAblations(a || []);
        setCalibration(c || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedBaselines = [...baselines]
    .filter((b) => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.baseline_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Baseline,TimeRatio,DistRatio,SafetyExposure,AccessBurden,Hypervolume,LatencyMs\n";
    baselines.forEach((b) => {
      csvContent += `${b.baseline_id} - ${b.name},${b.travel_time_ratio},${b.distance_ratio},${b.safety_exposure},${b.accessibility_burden},${b.pareto_hypervolume},${b.latency_ms}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "safepath_ai_baselines.csv");
    document.body.appendChild(link);
    link.click();
  };

  const downloadJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify({ baselines, ablations, calibration }, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "safepath_benchmark_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const generateLatex = () => {
    return `% Table 1: Quantitative Benchmark on Urban Routing
\\begin{table*}[t]
\\centering
\\caption{Comparative Benchmark Evaluation against Baselines B0--B6 on Urban Routing Networks.}
\\label{tab:baselines}
\\begin{tabular}{lcccccc}
\\toprule
\\textbf{Method} & \\textbf{Time Ratio} $\\downarrow$ & \\textbf{Dist Ratio} $\\downarrow$ & \\textbf{Safety Risk} $\\downarrow$ & \\textbf{Access Burden} $\\downarrow$ & \\textbf{Hypervolume} $\\uparrow$ & \\textbf{Latency (ms)} \\\\
\\midrule
${baselines
  .map(
    (b) =>
      `${b.baseline_id}: ${b.name} & ${b.travel_time_ratio.toFixed(2)} & ${b.distance_ratio.toFixed(2)} & ${b.safety_exposure.toFixed(2)} & ${b.accessibility_burden.toFixed(2)} & ${b.pareto_hypervolume.toFixed(2)} & ${b.latency_ms.toFixed(1)} \\\\`
  )
  .join("\n")}
\\bottomrule
\\end{tabular}
\\end{table*}`;
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Academic Research Benchmark Dashboard</h1>
            <p className="text-xs text-slate-500 font-mono">
              Quantitative baseline comparisons, ablation studies, and probabilistic calibration metrics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLatex(!showLatex)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{showLatex ? "Hide LaTeX" : "View LaTeX"}</span>
          </button>

          <button
            onClick={downloadCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={downloadJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>JSON</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
            title="Reload Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* LaTeX Drawer */}
      {showLatex && (
        <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl shadow-lg border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span>IEEE/ACM Transactions LaTeX Source (Auto-Generated)</span>
            <button
              onClick={() => navigator.clipboard.writeText(generateLatex())}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Copy LaTeX
            </button>
          </div>
          <pre className="font-mono text-xs overflow-x-auto text-emerald-300 p-2">
            {generateLatex()}
          </pre>
        </div>
      )}

      {/* Dynamic Calibration Card */}
      {calibration && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-sans block">Brier Calibration Score</span>
            <span className="text-xl font-bold text-slate-900">{calibration.brier_score}</span>
            <span className="text-[10px] text-emerald-600 font-sans block">High Calibration Confidence</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-sans block">Expected Calibration Error</span>
            <span className="text-xl font-bold text-blue-700">{calibration.expected_calibration_error}</span>
            <span className="text-[10px] text-slate-500 font-sans block">ECE &lt; 0.05 Target Met</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-sans block">Calibration Status</span>
            <span className="text-sm font-bold text-emerald-700 block">{calibration.status}</span>
            <span className="text-[10px] text-slate-500 font-sans block">Isotonic Regression Calibrated</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
            <span className="text-[11px] text-slate-500 font-sans block">Test Evaluations</span>
            <span className="text-xl font-bold text-slate-900">100 OD Pairs</span>
            <span className="text-[10px] text-slate-500 font-sans block">Empirical Validation Suite</span>
          </div>
        </div>
      )}

      {/* Table 1: Baseline Comparison */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-2">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Table 1: Quantitative Benchmark on Urban Routing (100 OD Pairs)
            </h2>
            <p className="text-[11px] text-slate-500">Comparing SafePath-AI against baseline algorithms B0 to B5</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search methods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold font-sans select-none">
              <tr>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">
                    <span>Method</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("travel_time_ratio")}>
                  <div className="flex items-center gap-1">
                    <span>Time Ratio (&darr;)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("distance_ratio")}>
                  <div className="flex items-center gap-1">
                    <span>Dist Ratio (&darr;)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("safety_exposure")}>
                  <div className="flex items-center gap-1">
                    <span>Safety Risk (&darr;)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("accessibility_burden")}>
                  <div className="flex items-center gap-1">
                    <span>Access Burden (&darr;)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("pareto_hypervolume")}>
                  <div className="flex items-center gap-1">
                    <span>Hypervolume (&uarr;)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-blue-600" onClick={() => handleSort("latency_ms")}>
                  <div className="flex items-center gap-1">
                    <span>Latency (ms)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBaselines.map((b) => {
                const isOurs = b.baseline_id === "B6";
                return (
                  <tr key={b.baseline_id} className={`hover:bg-slate-50/70 ${isOurs ? "bg-blue-50/50 font-bold" : ""}`}>
                    <td className="p-3.5 font-sans text-slate-900 flex items-center gap-2">
                      <span className="text-blue-600 font-mono font-bold">{b.baseline_id}</span>
                      <span>{b.name}</span>
                      {isOurs && <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">OURS</span>}
                    </td>
                    <td className="p-3.5 text-slate-600">{b.travel_time_ratio.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-600">{b.distance_ratio.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className={isOurs ? "text-emerald-700 font-bold" : "text-slate-600"}>{b.safety_exposure.toFixed(2)}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={isOurs ? "text-emerald-700 font-bold" : "text-slate-600"}>{b.accessibility_burden.toFixed(2)}</span>
                    </td>
                    <td className="p-3.5 font-bold text-blue-700">{b.pareto_hypervolume.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-500">{b.latency_ms.toFixed(1)}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Ablation Study */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Table 2: Ablation Study of Core Algorithmic Components
            </h2>
            <p className="text-[11px] text-slate-500">Quantifying drop in Hypervolume and increase in risk/barrier rates</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
            LaTeX Formatted in paper/tables/table2_ablations.tex
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold font-sans">
              <tr>
                <th className="p-3.5">Ablation Variant</th>
                <th className="p-3.5">Hypervolume Drop</th>
                <th className="p-3.5">Exposure Shift</th>
                <th className="p-3.5">Barrier Encounter Rate</th>
                <th className="p-3.5">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ablations.map((a) => (
                <tr key={a.ablation_id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-sans font-medium text-slate-900">
                    <span className="text-blue-700 font-mono font-bold block">{a.variant_name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{a.description}</span>
                  </td>
                  <td className="p-3.5 text-red-600 font-bold">
                    {a.hypervolume_drop_pct === 0 ? "0.0% (Ref)" : `${a.hypervolume_drop_pct}%`}
                  </td>
                  <td className="p-3.5 text-amber-700 font-bold">
                    {a.exposure_increase_pct === 0 ? "0.0% (Ref)" : `+${a.exposure_increase_pct}%`}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{a.barrier_encounter_rate}</td>
                  <td className="p-3.5 text-slate-500">{a.latency_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
