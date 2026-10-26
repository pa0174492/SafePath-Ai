from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from packages.shared_types.models import (
    ResilienceMetric,
    Coordinate,
    UserProfile,
    MobilityProfile
)
from services.routing.resilience import RouteResilienceAnalyzer
from services.routing.router import SafePathRouter

router = APIRouter(prefix="/resilience", tags=["Route Resilience Analysis"])
router_service = SafePathRouter()

class ResilienceAnalyzeRequest(BaseModel):
    origin: Optional[Coordinate] = None
    destination: Optional[Coordinate] = None
    profile: Optional[UserProfile] = None
    city_tag: str = "seattle_downtown"

@router.post("/analyze", response_model=List[ResilienceMetric])
def analyze_resilience(payload: ResilienceAnalyzeRequest):
    """
    Evaluates route resilience across parameterized stress tests (rain +30%, storm +80%, twilight -40%, dimming -80%).
    """
    try:
        origin = payload.origin or Coordinate(lat=47.6097, lon=-122.3385)
        destination = payload.destination or Coordinate(lat=47.6000, lon=-122.3325)
        profile = payload.profile or UserProfile(profile_type=MobilityProfile.STANDARD)
        
        graph = router_service.get_graph(payload.city_tag)
        src = graph.get_nearest_node(origin)
        tgt = graph.get_nearest_node(destination)
        
        now = datetime.now()
        base_ctx = router_service.weather_provider.get_current_weather(origin)
        
        from services.routing.algorithms.pareto_boa import ParetoBOARouter
        from services.routing.algorithms.robust_pareto import RobustParetoEngine
        
        pareto = ParetoBOARouter.search_pareto_frontier(
            graph, src, tgt, now, base_ctx, profile, max_frontier_size=5
        )
        if not pareto:
            raise HTTPException(status_code=400, detail="No path found.")
            
        b_nodes, b_cost, b_meta = pareto[0]
        candidate = RobustParetoEngine.build_route_candidate(
            graph, b_nodes, b_cost, b_meta, now, profile, "SafePath-BOA*", "Evaluated Candidate"
        )
        
        metrics = RouteResilienceAnalyzer.evaluate_route_resilience(
            graph,
            candidate,
            src,
            tgt,
            now,
            base_ctx,
            profile
        )
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
