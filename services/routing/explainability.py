from typing import List, Dict, Any
from packages.shared_types.models import RouteCandidate, RouteExplanation

class ExplainabilityEngine:
    """
    Constructs factual, rule-grounded natural-language explanations comparing
    candidate routes directly from non-dominated objective deltas and provenance records.
    Never hallucinates numerical claims or invents phantom incidents.
    """
    
    @staticmethod
    def generate_comparative_explanation(
        primary_candidate: RouteCandidate,
        baseline_candidate: RouteCandidate
    ) -> str:
        """
        Generates a fact-grounded comparison between two Pareto candidates.
        """
        time_diff = primary_candidate.metrics.total_travel_time_min - baseline_candidate.metrics.total_travel_time_min
        risk_reduction = ((baseline_candidate.metrics.robust_safety_risk - primary_candidate.metrics.robust_safety_risk) / max(0.01, baseline_candidate.metrics.robust_safety_risk)) * 100.0
        barrier_diff = baseline_candidate.metrics.potential_barrier_count - primary_candidate.metrics.potential_barrier_count
        
        parts = []
        if risk_reduction > 5.0:
            parts.append(f"reduces estimated robust safety risk by {risk_reduction:.0f}%")
        elif risk_reduction < -5.0:
            parts.append(f"increases safety risk exposure by {abs(risk_reduction):.0f}%")
            
        if barrier_diff > 0:
            parts.append(f"eliminates {barrier_diff} physical accessibility barrier(s)")
            
        if abs(time_diff) > 0.5:
            if time_diff > 0:
                parts.append(f"adding {time_diff:.1f} minutes to travel time")
            else:
                parts.append(f"saving {abs(time_diff):.1f} minutes")
        else:
            parts.append("with negligible difference in travel time")
            
        action_text = ", while ".join(parts) if parts else "exhibiting comparable multi-objective metrics"
        
        return (
            f"{primary_candidate.name} is selected over {baseline_candidate.name} because it {action_text}. "
            f"Evaluated with confidence score {int(primary_candidate.metrics.overall_confidence_score * 100)}% "
            f"under time-dependent segment arrival conditions."
        )
