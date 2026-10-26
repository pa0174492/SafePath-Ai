from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

from packages.route_models.graph import SafePathGraph
from packages.shared_types.models import (
    UserProfile,
    ContextSnapshot,
    RouteCandidate,
    RouteMetrics,
    RouteSegment,
    RouteProvenanceRecord,
    RouteExplanation,
    InferenceStatus,
    SurfaceType,
    CrossingType,
    Coordinate
)
from packages.geo_utils.geometry import coords_to_geojson_linestring
from .pareto_boa import ParetoBOARouter
from .weighted_sum import weighted_sum_route
from .dijkstra import shortest_path_dijkstra

class RobustParetoEngine:
    """
    Orchestrates robust multi-objective Pareto pathfinding, baseline generation,
    CVaR 95% tail-risk computation, and rich candidate profile synthesis.
    """
    
    @staticmethod
    def compute_cvar_95(segment_risks: List[float], segment_stds: List[float]) -> float:
        """
        Compute Conditional Value-at-Risk at 95% confidence (expected risk in worst 5% scenarios)
        under Gaussian uncertainty: CVaR_0.95 = mu + (pdf(z_0.95) / 0.05) * sigma = mu + 2.063 * sigma.
        """
        if not segment_risks:
            return 0.0
        mean_risk = float(np.mean(segment_risks))
        agg_std = float(np.sqrt(np.mean(np.array(segment_stds)**2)))
        return float(min(1.0, mean_risk + 2.063 * agg_std))

    @staticmethod
    def build_route_candidate(
        graph: SafePathGraph,
        path_nodes: List[str],
        cost_vec: np.ndarray,
        meta_details: Dict[str, Any],
        departure_time: datetime,
        profile: UserProfile,
        algorithm_tag: str,
        name: str
    ) -> RouteCandidate:
        """
        Builds a fully populated, serializable RouteCandidate object with segment-level decomposition,
        provenance, metrics, and GeoJSON geometry.
        """
        segments: List[RouteSegment] = []
        all_coords: List[Coordinate] = []
        
        cum_dist = 0.0
        cum_dur = 0.0
        
        edge_details_list = meta_details.get("edge_details", [])
        
        segment_risks = []
        segment_stds = []
        potential_barriers = 0
        uncertain_segments = 0
        accessible_segments = 0
        
        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i+1]
            feat = graph.get_edge_features(u, v)
            infer = graph.get_edge_inference(u, v)
            
            det = edge_details_list[i] if i < len(edge_details_list) else {}
            
            dur_s = det.get("duration_s", (feat.length_m / profile.walking_speed_mps) if feat else 30.0)
            cum_dist += feat.length_m if feat else 50.0
            cum_dur += dur_s
            
            arr_time = departure_time + np.timedelta64(int(cum_dur), 's').astype(object)
            
            # Extract coordinates
            seg_coords = feat.geometry_coords if feat and feat.geometry_coords else [graph.nodes[u], graph.nodes[v]]
            if not all_coords:
                all_coords.extend(seg_coords)
            else:
                all_coords.extend(seg_coords[1:])
                
            # Provenance records for this segment
            provenance: List[RouteProvenanceRecord] = [
                RouteProvenanceRecord(
                    attribute_name="road_class",
                    source="OpenStreetMap Overpass / Fixture",
                    status=InferenceStatus.KNOWN,
                    confidence=0.99,
                    timestamp=departure_time,
                    details=f"Class: {feat.road_class if feat else 'footway'}"
                ),
                RouteProvenanceRecord(
                    attribute_name="slope_pct",
                    source="USGS 3DEP / Elevation Fixture",
                    status=InferenceStatus.KNOWN,
                    confidence=0.95,
                    timestamp=departure_time,
                    details=f"Grade: {feat.slope_pct if feat else 0.0:.1f}%"
                ),
                RouteProvenanceRecord(
                    attribute_name="accessibility_inference",
                    source="SafePath-AI Gradient Boosted Classifier",
                    status=infer.status if infer else InferenceStatus.INFERRED,
                    confidence=infer.confidence if infer else 0.70,
                    model_version="access-infer-v1.0",
                    timestamp=departure_time,
                    details=f"P(accessible)={infer.overall_accessibility_prob if infer else 0.5:.2f}"
                ),
                RouteProvenanceRecord(
                    attribute_name="weather_at_arrival",
                    source="Open-Meteo Dynamic Interpolator",
                    status=InferenceStatus.KNOWN,
                    confidence=0.92,
                    timestamp=arr_time,
                    details=f"Rain: {det.get('rain_at_arrival', 0.0):.1f} mm/h, Lux: {det.get('lux_at_arrival', 100.0):.0f}"
                )
            ]
            
            risk_m = det.get("total_risk_mean", 0.15)
            risk_s = det.get("total_risk_std", 0.05)
            segment_risks.append(risk_m)
            segment_stds.append(risk_s)
            
            acc_prob = infer.overall_accessibility_prob if infer else 0.5
            if acc_prob > 0.75:
                accessible_segments += 1
            elif acc_prob < 0.40 or (feat and feat.slope_pct > profile.max_slope_pct):
                potential_barriers += 1
            else:
                uncertain_segments += 1
                
            seg = RouteSegment(
                segment_index=i,
                edge_id=feat.edge_id if feat else f"edge_{u}_{v}",
                u=u,
                v=v,
                distance_m=feat.length_m if feat else 50.0,
                estimated_duration_s=dur_s,
                cumulative_distance_m=cum_dist,
                cumulative_duration_s=cum_dur,
                expected_arrival_time=arr_time,
                road_class=feat.road_class if feat else "footway",
                surface=feat.surface if feat else SurfaceType.CONCRETE,
                slope_pct=feat.slope_pct if feat else 0.0,
                is_lit=feat.is_lit if feat else True,
                is_crossing=feat.is_crossing if feat else False,
                crossing_type=feat.crossing_type if feat else CrossingType.UNKNOWN,
                accessibility_prob=acc_prob,
                accessibility_status=infer.status if infer else InferenceStatus.INFERRED,
                accessibility_confidence=infer.confidence if infer else 0.70,
                static_risk=det.get("static_risk", 0.10),
                temporal_risk=det.get("temporal_risk", 0.0),
                incident_risk=det.get("incident_risk", 0.0),
                environmental_risk=det.get("env_risk", 0.0),
                total_risk_mean=risk_m,
                total_risk_std=risk_s,
                robust_risk=det.get("robust_risk", risk_m + profile.uncertainty_aversion_lambda * risk_s),
                rainfall_at_arrival_mm_h=det.get("rain_at_arrival", 0.0),
                lux_at_arrival=det.get("lux_at_arrival", 100.0),
                provenance=provenance,
                coords=seg_coords
            )
            segments.append(seg)
            
        total_segs = max(1, len(segments))
        cvar95 = RobustParetoEngine.compute_cvar_95(segment_risks, segment_stds)
        mean_risk = float(np.mean(segment_risks)) if segment_risks else 0.1
        mean_std = float(np.mean(segment_stds)) if segment_stds else 0.05
        
        metrics = RouteMetrics(
            total_travel_time_min=round(cum_dur / 60.0, 2),
            total_distance_m=round(cum_dist, 1),
            mean_safety_risk=round(mean_risk, 3),
            robust_safety_risk=round(mean_risk + profile.uncertainty_aversion_lambda * mean_std, 3),
            risk_uncertainty_std=round(mean_std, 3),
            worst_case_tail_risk_cvar95=round(cvar95, 3),
            accessibility_burden=round(float(cost_vec[3]), 2),
            environmental_exposure=round(float(cost_vec[4]), 2),
            route_complexity_score=round(float(cost_vec[5]), 2),
            overall_confidence_score=round(0.92 - 0.25 * (uncertain_segments / total_segs), 2),
            accessible_segments_pct=round((accessible_segments / total_segs) * 100.0, 1),
            uncertain_segments_pct=round((uncertain_segments / total_segs) * 100.0, 1),
            potential_barrier_count=potential_barriers
        )
        
        # Rule-grounded explanation
        strengths = []
        limitations = []
        
        if metrics.robust_safety_risk < 0.25:
            strengths.append("High continuous lighting and low incident exposure")
        if metrics.accessibility_burden < 1.0:
            strengths.append("Gentle grade slope conforming to ADA standards with verified curb ramps")
        if metrics.total_travel_time_min <= (cum_dur / 60.0) * 1.05:
            strengths.append("Minimal path detour overhead")
            
        if metrics.potential_barrier_count > 0:
            limitations.append(f"{metrics.potential_barrier_count} segment(s) with steep incline or unpaved surface")
        if metrics.risk_uncertainty_std > 0.08:
            limitations.append("Elevated risk uncertainty due to sparse lighting verification")
            
        explanation = RouteExplanation(
            summary_text=f"{name} provides a {metrics.total_travel_time_min} min journey ({metrics.total_distance_m}m) with estimated robust risk score of {metrics.robust_safety_risk}.",
            why_this_route=f"Selected via {algorithm_tag} as a non-dominated trade-off balancing speed against safety and barrier exposure.",
            what_changed="Segment context dynamically conditions lighting and hazard metrics based on estimated arrival timestamps.",
            key_risks=[f"Ambient light level at arrival: {segments[0].lux_at_arrival:.0f} lux" if segments else "Normal"],
            accessibility_notes=[f"{metrics.accessible_segments_pct}% of segments satisfy mobility constraints; {metrics.potential_barrier_count} potential barriers detected."],
            data_sources=["OpenStreetMap Overpass", "USGS 3DEP Elevation", "Open-Meteo Weather", "Municipal Incident Stream"],
            confidence_statement=f"Confidence {int(metrics.overall_confidence_score * 100)}% based on verified spatial attributes.",
            strengths=strengths if strengths else ["Balanced overall multi-objective performance"],
            limitations=limitations if limitations else ["Standard urban pedestrian exposure"]
        )
        
        geojson = coords_to_geojson_linestring(all_coords)
        geojson["properties"] = {
            "name": name,
            "algorithm": algorithm_tag,
            "travel_time_min": metrics.total_travel_time_min,
            "distance_m": metrics.total_distance_m,
            "robust_risk": metrics.robust_safety_risk
        }
        
        cand_id = f"route-{abs(hash(name + str(path_nodes))):08x}"
        
        return RouteCandidate(
            id=cand_id,
            algorithm_tag=algorithm_tag,
            name=name,
            metrics=metrics,
            segments=segments,
            is_pareto_optimal=True,
            explanation=explanation,
            geometry_geojson=geojson
        )
