from datetime import datetime
from typing import List, Dict, Any
import numpy as np

from packages.route_models.graph import SafePathGraph
from packages.shared_types.models import (
    RouteCandidate,
    ResilienceMetric,
    UserProfile,
    ContextSnapshot,
    CounterfactualMutation
)
from .counterfactual import CounterfactualEngine

class RouteResilienceAnalyzer:
    """
    Evaluates how stable and acceptable a route remains under varying degrees of environmental
    and infrastructure perturbations.
    """
    
    @staticmethod
    def evaluate_route_resilience(
        graph: SafePathGraph,
        candidate: RouteCandidate,
        source_node: str,
        target_node: str,
        departure_time: datetime,
        context: ContextSnapshot,
        profile: UserProfile
    ) -> List[ResilienceMetric]:
        """
        Runs standardized stress-test perturbations to calculate resilience scores.
        """
        perturbations = [
            ("Precipitation Surge (+30%)", CounterfactualMutation(rainfall_multiplier=1.3), 0.30),
            ("Heavy Rainstorm (+80%)", CounterfactualMutation(rainfall_multiplier=1.8), 0.80),
            ("Twilight Lighting Decay (-40%)", CounterfactualMutation(lighting_decay_multiplier=0.6), 0.40),
            ("Severe Grid Dimming (-80%)", CounterfactualMutation(lighting_decay_multiplier=0.2), 0.80)
        ]
        
        metrics = []
        
        for name, mutation, level in perturbations:
            res = CounterfactualEngine.simulate_mutation(
                graph,
                candidate,
                mutation,
                source_node,
                target_node,
                departure_time,
                context,
                profile
            )
            
            # Calculate degradation: relative change in robust risk and travel time
            time_ratio = res.counterfactual_candidate.metrics.total_travel_time_min / max(0.1, candidate.metrics.total_travel_time_min)
            risk_ratio = res.counterfactual_candidate.metrics.robust_safety_risk / max(0.01, candidate.metrics.robust_safety_risk)
            
            degradation_pct = round(max(0.0, (0.5 * time_ratio + 0.5 * risk_ratio - 1.0) * 100.0), 1)
            reroute_triggered = res.reroute_distance_m > 30.0
            
            # Resilience score: 1.0 is perfectly resilient, drops as degradation increases
            stability = round(max(0.1, 1.0 - (degradation_pct / 100.0)), 2)
            resilience_score = round(max(0.05, min(0.98, stability * (0.85 if reroute_triggered else 1.0))), 2)
            
            metrics.append(ResilienceMetric(
                perturbation_name=name,
                perturbation_level=level,
                route_quality_degradation_pct=degradation_pct,
                reroute_triggered=reroute_triggered,
                objective_stability_score=stability,
                resilience_score=resilience_score
            ))
            
        return metrics
