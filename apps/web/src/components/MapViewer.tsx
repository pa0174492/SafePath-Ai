"use client";

import React, { useState } from "react";
import { RouteCandidate, RouteSegment, Coordinate } from "@/lib/api";
import { AlertTriangle, MapPin, Shield, Sun, CloudRain, Accessibility, Layers, Info } from "lucide-react";

interface MapViewerProps {
  candidate: RouteCandidate | null;
  alternatives?: RouteCandidate[];
  onSelectSegment?: (segment: RouteSegment) => void;
  selectedSegment?: RouteSegment | null;
}

export function MapViewer({
  candidate,
  alternatives = [],
  onSelectSegment,
  selectedSegment
}: MapViewerProps) {
  const [hoveredSegment, setHoveredSegment] = useState<RouteSegment | null>(null);

  // Seattle Downtown bounding box coordinates for SVG projection
  const minLat = 47.5975;
  const maxLat = 47.6115;
  const minLon = -122.3405;
  const maxLon = -122.3295;

  const projectCoord = (c: Coordinate) => {
    const x = ((c.lon - minLon) / (maxLon - minLon)) * 700 + 50;
    const y = ((maxLat - c.lat) / (maxLat - minLat)) * 500 + 50;
    return { x, y };
  };

  const avenues = [-122.3385, -122.3365, -122.3345, -122.3325, -122.3305];
  const avenueNames = ["1st Ave", "2nd Ave", "3rd Ave", "4th Ave", "5th Ave"];
  const streets = [47.6105, 47.6090, 47.6075, 47.6060, 47.6045, 47.6030, 47.6015, 47.6000, 47.5985];
  const streetNames = ["Pike", "Union", "University", "Seneca", "Spring", "Madison", "Marion", "Columbia", "James"];

  // Seeded hazards
  const incidents = [
    { id: "inc-1", lat: 47.6085, lon: -122.3380, label: "Unlit Corridor", desc: "Streetlight outage on Post Alley" },
    { id: "inc-2", lat: 47.6062, lon: -122.3340, label: "Curb Barricade", desc: "Construction blocking wheelchair ramp" },
    { id: "inc-3", lat: 47.6040, lon: -122.3310, label: "Slippery Brick", desc: "Wet slope warning" }
  ];

  return (
    <div className="relative w-full h-[620px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm select-none">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
        <Layers className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-slate-900">Seattle Downtown Spatial Network</span>
        <span className="text-[10px] font-mono text-slate-500">(WGS84)</span>
      </div>

      {/* Dynamic Context Widget */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center space-x-1.5 text-slate-700">
          <CloudRain className="w-3.5 h-3.5 text-blue-600" />
          <span>2.5 mm/h Rain</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center space-x-1.5 text-slate-700">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Daylight (85 lx)</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <svg className="w-full h-full" viewBox="0 0 800 600">
        <defs>
          <radialGradient id="hazardGlowLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Street Grid Background */}
        {avenues.map((lon, i) => {
          const top = projectCoord({ lat: maxLat - 0.001, lon });
          const bottom = projectCoord({ lat: minLat + 0.001, lon });
          return (
            <g key={`ave-${i}`}>
              <line
                x1={top.x}
                y1={top.y}
                x2={bottom.x}
                y2={bottom.y}
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <text x={top.x} y={top.y - 12} fill="#64748b" fontSize="10" textAnchor="middle" fontWeight="500">
                {avenueNames[i]}
              </text>
            </g>
          );
        })}

        {streets.map((lat, j) => {
          const left = projectCoord({ lat, lon: minLon + 0.0005 });
          const right = projectCoord({ lat, lon: maxLon - 0.0005 });
          return (
            <g key={`st-${j}`}>
              <line
                x1={left.x}
                y1={left.y}
                x2={right.x}
                y2={right.y}
                stroke="#e2e8f0"
                strokeWidth="2.5"
              />
              <text x={left.x - 10} y={left.y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                {streetNames[j]} St
              </text>
            </g>
          );
        })}

        {/* Hazard Zone Overlays */}
        {incidents.map((inc) => {
          const pos = projectCoord(inc);
          return (
            <g key={inc.id}>
              <circle cx={pos.x} cy={pos.y} r="35" fill="url(#hazardGlowLight)" />
              <circle cx={pos.x} cy={pos.y} r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
            </g>
          );
        })}

        {/* Alternative Routes Background */}
        {alternatives.map((alt) => {
          if (alt.id === candidate?.id) return null;
          const points = alt.segments.flatMap((s) => s.coords).map(projectCoord);
          const pathD = points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

          return (
            <path
              key={alt.id}
              d={pathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="4"
              strokeDasharray="6 6"
              opacity="0.8"
            />
          );
        })}

        {/* Active Candidate Segments */}
        {candidate?.segments.map((seg, idx) => {
          if (seg.coords.length < 2) return null;
          const p1 = projectCoord(seg.coords[0]);
          const p2 = projectCoord(seg.coords[seg.coords.length - 1]);

          // Clean colors for light background
          const strokeColor =
            seg.robust_risk > 0.50 ? "#dc2626" : seg.robust_risk > 0.30 ? "#d97706" : "#2563eb";

          const isSelected = selectedSegment?.edge_id === seg.edge_id;

          return (
            <g
              key={`seg-${idx}`}
              className="cursor-pointer group"
              onClick={() => onSelectSegment && onSelectSegment(seg)}
              onMouseEnter={() => setHoveredSegment(seg)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={strokeColor}
                strokeWidth={isSelected ? "8" : "6"}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
              <circle
                cx={(p1.x + p2.x) / 2}
                cy={(p1.y + p2.y) / 2}
                r={isSelected ? "5" : "3.5"}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* Origin Marker */}
        {candidate && candidate.segments.length > 0 && (
          <g transform={`translate(${projectCoord(candidate.segments[0].coords[0]).x - 12}, ${projectCoord(candidate.segments[0].coords[0]).y - 28})`}>
            <circle cx="12" cy="12" r="10" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
            <text x="12" y="16" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
          </g>
        )}

        {/* Destination Marker */}
        {candidate && candidate.segments.length > 0 && (
          <g
            transform={`translate(${
              projectCoord(candidate.segments[candidate.segments.length - 1].coords[candidate.segments[candidate.segments.length - 1].coords.length - 1]).x - 12
            }, ${
              projectCoord(candidate.segments[candidate.segments.length - 1].coords[candidate.segments[candidate.segments.length - 1].coords.length - 1]).y - 28
            })`}
          >
            <circle cx="12" cy="12" r="10" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />
            <text x="12" y="16" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">B</text>
          </g>
        )}
      </svg>

      {/* Segment Inspection Tooltip / Card */}
      {(hoveredSegment || selectedSegment) && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-white/98 backdrop-blur-md p-4 rounded-xl border border-slate-300 shadow-xl flex items-center justify-between animate-in fade-in duration-100">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
              (hoveredSegment || selectedSegment)!.robust_risk > 0.4 ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {((hoveredSegment || selectedSegment)!.robust_risk).toFixed(2)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">
                  Segment {(hoveredSegment || selectedSegment)!.segment_index + 1}: {(hoveredSegment || selectedSegment)!.u} → {(hoveredSegment || selectedSegment)!.v}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  Grade: {(hoveredSegment || selectedSegment)!.slope_pct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center space-x-4 text-[11px] text-slate-600 mt-1">
                <span>Surface: <strong className="text-slate-900">{(hoveredSegment || selectedSegment)!.surface}</strong></span>
                <span>Lighting: <strong className="text-slate-900">{(hoveredSegment || selectedSegment)!.is_lit ? "Illuminated" : "Unlit"}</strong></span>
                <span>P(Accessible): <strong className="text-emerald-700 font-semibold">{Math.round((hoveredSegment || selectedSegment)!.accessibility_prob * 100)}%</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-slate-500 block">Distance / Time</span>
            <span className="font-bold text-slate-900">
              {(hoveredSegment || selectedSegment)!.distance_m.toFixed(0)}m • {((hoveredSegment || selectedSegment)!.estimated_duration_s / 60).toFixed(1)} min
            </span>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 shadow-sm">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Optimal (&lt;0.30)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span>Elevated Risk (&gt;0.50)</span>
        </div>
      </div>
    </div>
  );
}
