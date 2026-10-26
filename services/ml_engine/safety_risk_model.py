import numpy as np
from typing import Dict, List, Tuple
from packages.shared_types.models import (
    EdgeStaticFeatures,
    ContextSnapshot,
    IncidentPoint,
    HazardSeverity
)
from packages.geo_utils.geodesy import haversine_distance_m

class SafetyRiskModel:
    """
    Multi-component safety risk model separating static, temporal, incident, and infrastructure risks,
    providing calibrated mean risk and uncertainty standard deviation.
    """
    def __init__(self, model_version: str = "safety-risk-v1.0"):
        self.model_version = model_version

    def predict_risk(
        self,
        edge: EdgeStaticFeatures,
        arrival_context: ContextSnapshot,
        incidents: List[IncidentPoint] = None
    ) -> Tuple[float, float, float, float, Dict[str, float]]:
        """
        Returns:
            (risk_mean, risk_std, risk_lower_95, risk_upper_95, feature_decomposition)
        """
        # 1. Static infrastructure baseline
        static = 0.10
        if edge.road_class in ["primary", "trunk"]:
            static += 0.25
        elif edge.road_class == "secondary":
            static += 0.15
        elif edge.road_class == "footway":
            static += 0.03
            
        # 2. Dynamic temporal risk (ambient light & hour)
        is_dark = arrival_context.is_dark or arrival_context.ambient_lux < 15.0
        temporal = 0.0
        temp_var = 0.005
        if is_dark:
            if not edge.is_lit:
                temporal += 0.40
                temp_var += 0.040  # High uncertainty in dark non-illuminated ways
            else:
                temporal += 0.10
                temp_var += 0.010
                
        # 3. Dynamic weather / traction risk
        weather = 0.0
        if arrival_context.rainfall_mm_h > 0.5:
            weather += min(0.30, (arrival_context.rainfall_mm_h / 10.0) * 0.25)
            if edge.slope_pct > 6.0:
                weather += 0.15  # Steep wet incline hazard
                
        # 4. Proximity to active incidents
        incident_val = 0.0
        inc_var = 0.0
        if incidents and edge.geometry_coords:
            mid = edge.geometry_coords[len(edge.geometry_coords)//2]
            for inc in incidents:
                if not inc.active:
                    continue
                d = haversine_distance_m(mid, inc.coordinate)
                if d <= inc.radius_m:
                    sev = 0.70 if inc.severity == HazardSeverity.CRITICAL else (0.45 if inc.severity == HazardSeverity.HIGH else 0.20)
                    incident_val += sev
                    inc_var += (sev * 0.4) ** 2
                elif d <= inc.radius_m * 2.0:
                    incident_val += 0.10
                    inc_var += 0.01
                    
        total_mean = float(np.clip(static + temporal + weather + incident_val, 0.02, 0.98))
        total_std = float(np.sqrt(temp_var + inc_var + 0.005))
        
        # Calibrated 95% confidence interval
        lower_95 = float(max(0.0, total_mean - 1.96 * total_std))
        upper_95 = float(min(1.0, total_mean + 1.96 * total_std))
        
        decomp = {
            "static_infra": static,
            "temporal_lighting": temporal,
            "weather_precipitation": weather,
            "active_incidents": incident_val,
            "total_uncertainty_std": total_std
        }
        
        return total_mean, total_std, lower_95, upper_95, decomp
