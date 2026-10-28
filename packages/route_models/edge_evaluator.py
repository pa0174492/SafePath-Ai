import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from packages.shared_types.models import (
    Coordinate,
    EdgeStaticFeatures,
    EdgeAccessibilityInference,
    ContextSnapshot,
    UserProfile,
    InferenceStatus,
    SurfaceType,
    CrossingType,
    MobilityProfile,
    HazardSeverity
)
from packages.geo_utils.geodesy import haversine_distance_m

class EdgeCostEvaluator:
    """
    Evaluates multi-objective costs for an edge traversed at estimated arrival time t_arrival.
    """
    
    @staticmethod
    def calculate_walking_speed(base_speed_mps: float, slope_pct: float) -> float:
        """
        Tobler's hiking function modified for pedestrian sidewalk gradients:
        v = v_0 * exp(-3.5 * |slope + 0.05|)
        """
        slope_decimal = slope_pct / 100.0
        # Normal walking speed decay
        factor = math.exp(-3.0 * max(0.0, slope_decimal - 0.02))
        return max(0.3, base_speed_mps * factor)

    @staticmethod
    def evaluate_edge(
        features: EdgeStaticFeatures,
        inference: Optional[EdgeAccessibilityInference],
        departure_time: datetime,
        cumulative_time_sec: float,
        context: ContextSnapshot,
        profile: UserProfile,
        incidents: List[Any] = None,
        hazard_zones: List[Any] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Returns:
            cost_vector: np.ndarray shape (6,) -> [travel_time_s, distance_m, robust_risk, accessibility_burden, environmental_exposure, complexity]
            details: Dict with full decomposition for explainability and provenance.
        """
        arrival_time = departure_time + timedelta(seconds=cumulative_time_sec)
        
        # 1. Travel Time and Distance
        dist_m = features.length_m
        speed_mps = EdgeCostEvaluator.calculate_walking_speed(profile.walking_speed_mps, features.slope_pct)
        duration_s = dist_m / speed_mps
        
        # 2. Dynamic Environmental State at arrival time
        hour = arrival_time.hour + arrival_time.minute / 60.0
        is_night = hour < 6.0 or hour > 20.0
        is_twilight = (6.0 <= hour < 7.0) or (18.5 <= hour <= 20.0)
        
        # Calculate ambient lux at segment arrival
        if is_night:
            base_lux = 5.0 if features.is_lit else 0.5
        elif is_twilight:
            base_lux = 50.0 if features.is_lit else 20.0
        else:
            base_lux = context.ambient_lux
            
        rain_intensity = context.rainfall_mm_h
        
        # 3. Accessibility Burden Calculation
        access_burden = 0.0
        access_prob = inference.overall_accessibility_prob if inference else 0.5
        access_status = inference.status if inference else features.sidewalk_status
        access_confidence = inference.confidence if inference else 0.5
        
        # Slope violation
        if features.slope_pct > profile.max_slope_pct:
            slope_excess = features.slope_pct - profile.max_slope_pct
            access_burden += 2.5 * slope_excess
            
        # Surface penalty
        if profile.avoid_unpaved and features.surface in [SurfaceType.UNPAVED, SurfaceType.GRAVEL, SurfaceType.COBBLESTONE]:
            access_burden += 3.0

        # Project Sidewalk DINOv2 surface defect AI integration (Hugging Face ASSETS '24)
        try:
            from services.ml_engine.surface_vision_service import sidewalk_vision_service
            surf_str = features.surface.value if hasattr(features.surface, 'value') else str(features.surface)
            defect_res = sidewalk_vision_service.evaluate_edge_surface_defect(
                surface_type=surf_str,
                road_class=features.road_class,
                slope_pct=features.slope_pct,
                rainfall_mm_h=rain_intensity
            )
            access_burden += defect_res["pedestrian_burden_penalty"] * 2.2
        except Exception:
            pass
            
        # Sidewalk absence penalty for wheelchair / mobility profiles
        if profile.profile_type in [MobilityProfile.WHEELCHAIR_MANUAL, MobilityProfile.WHEELCHAIR_POWER, MobilityProfile.STROLLER]:
            if not features.has_sidewalk:
                # Heavy burden if sidewalk missing
                access_burden += 5.0 * (1.0 - access_prob)
            if profile.require_curb_ramps and not features.has_curb_ramp:
                access_burden += 4.0
                
        # Visual assist tactile requirements
        if profile.profile_type == MobilityProfile.VISUAL_ASSIST:
            if features.is_crossing and features.crossing_type != CrossingType.SIGNALIZED:
                access_burden += 3.5
                
        # 4. Multi-Component Safety Risk & Variance
        # Static risk: road class hierarchy and lighting
        static_risk = 0.1
        if features.road_class in ["primary", "secondary", "tertiary"]:
            static_risk += 0.25
        elif features.road_class == "footway":
            static_risk += 0.05
            
        # Temporal risk: lighting and time of day
        temporal_risk = 0.0
        temporal_var = 0.01
        if is_night:
            if not features.is_lit:
                temporal_risk += 0.45
                temporal_var += 0.08  # High uncertainty in unlit alleys
            else:
                temporal_risk += 0.15
                temporal_var += 0.02
        elif is_twilight and not features.is_lit:
            temporal_risk += 0.20
            temporal_var += 0.04
            
        # Environmental risk: precipitation & wet surfaces
        env_risk = 0.0
        if rain_intensity > 0.1:
            env_risk += min(0.4, (rain_intensity / 10.0) * 0.35)
            if features.slope_pct > 5.0:
                env_risk += 0.15  # Slippery hill
                
        # Dynamic incident risk
        incident_risk = 0.0
        incident_var = 0.0
        active_incidents_count = 0
        min_incident_dist = float('inf')
        
        mid_coord = features.geometry_coords[len(features.geometry_coords)//2] if features.geometry_coords else None
        
        if incidents and mid_coord:
            for inc in incidents:
                if not inc.active:
                    continue
                d = haversine_distance_m(mid_coord, inc.coordinate)
                if d < min_incident_dist:
                    min_incident_dist = d
                if d <= inc.radius_m:
                    active_incidents_count += 1
                    sev_mult = 0.8 if inc.severity == HazardSeverity.CRITICAL else (0.5 if inc.severity == HazardSeverity.HIGH else 0.25)
                    incident_risk += sev_mult
                    incident_var += (sev_mult * 0.5) ** 2
                    
        total_risk_mean = min(1.0, static_risk + temporal_risk + env_risk + incident_risk)
        total_risk_std = math.sqrt(temporal_var + incident_var)
        
        # Cross-reference with trained ML model and active model registry
        try:
            from services.ml_engine.safety_risk_model import SafetyRiskModel
            if not hasattr(EdgeCostEvaluator, "_risk_model_singleton"):
                EdgeCostEvaluator._risk_model_singleton = SafetyRiskModel()
            
            arrival_ctx = ContextSnapshot(
                timestamp=arrival_time,
                rainfall_mm_h=rain_intensity,
                ambient_lux=base_lux,
                air_quality_aqi=context.air_quality_aqi,
                is_dark=is_night,
                confidence=context.confidence,
                source="DynamicArrivalTimeline"
            )
            m_mean, m_std, _, _, _ = EdgeCostEvaluator._risk_model_singleton.predict_risk(
                features, arrival_ctx, incidents
            )
            total_risk_mean = float(m_mean)
            total_risk_std = float(m_std)
        except Exception:
            pass

        # Robust Risk metric with lambda penalty
        robust_risk = total_risk_mean + profile.uncertainty_aversion_lambda * total_risk_std
        
        # 5. Environmental Exposure (precipitation + cold/heat + air quality)
        env_exposure = (rain_intensity / 15.0) * (duration_s / 60.0) + (1.0 if is_night and not features.is_lit else 0.0)
        
        # 6. Route Complexity (crossings, turns)
        complexity = 0.0
        if features.is_crossing:
            complexity += 1.0 if features.crossing_type == CrossingType.SIGNALIZED else 2.5
            
        # Compile 6-objective vector
        # [Time (s), Distance (m), Robust Risk (0-2), Accessibility Burden (>=0), Env Exposure (>=0), Complexity (>=0)]
        cost_vec = np.array([
            duration_s,
            dist_m,
            robust_risk * (dist_m / 100.0),  # Scaled by distance traversed under risk
            access_burden,
            env_exposure,
            complexity
        ], dtype=float)
        
        details = {
            "duration_s": duration_s,
            "dist_m": dist_m,
            "arrival_time": arrival_time,
            "speed_mps": speed_mps,
            "static_risk": static_risk,
            "temporal_risk": temporal_risk,
            "env_risk": env_risk,
            "incident_risk": incident_risk,
            "total_risk_mean": total_risk_mean,
            "total_risk_std": total_risk_std,
            "robust_risk": robust_risk,
            "access_burden": access_burden,
            "access_prob": access_prob,
            "access_status": access_status,
            "access_confidence": access_confidence,
            "rain_at_arrival": rain_intensity,
            "lux_at_arrival": base_lux,
            "active_incidents": active_incidents_count,
            "hazard_proximity_m": min_incident_dist if min_incident_dist != float('inf') else 999.0
        }
        
        return cost_vec, details
