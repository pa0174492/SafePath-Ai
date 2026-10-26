from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from packages.shared_types.models import (
    CounterfactualMutation,
    CounterfactualResult,
    RouteCandidate,
    Coordinate,
    UserProfile,
    MobilityProfile
)
from services.routing.counterfactual import CounterfactualEngine
from services.routing.router import SafePathRouter

router = APIRouter(prefix="/counterfactual", tags=["Counterfactual Simulation"])
router_service = SafePathRouter()

class SimulateRequest(BaseModel):
    mutation: CounterfactualMutation
    origin: Optional[Coordinate] = None
    destination: Optional[Coordinate] = None
    profile: Optional[UserProfile] = None
    city_tag: str = "seattle_downtown"

@router.post("/simulate", response_model=CounterfactualResult)
def simulate_counterfactual(payload: SimulateRequest):
    """
    Simulates 'what-if' perturbations (precipitation increases, road closures, lighting decay)
    and recomputes routes with detailed delta explanations.
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
        
        # Build baseline route candidate
        from services.routing.algorithms.pareto_boa import ParetoBOARouter
        from services.routing.algorithms.robust_pareto import RobustParetoEngine
        
        base_pareto = ParetoBOARouter.search_pareto_frontier(
            graph, src, tgt, now, base_ctx, profile, max_frontier_size=5
        )
        if not base_pareto:
            raise HTTPException(status_code=400, detail="No path found between selected coordinates.")
            
        base_nodes, base_cost, base_meta = base_pareto[0]
        base_candidate = RobustParetoEngine.build_route_candidate(
            graph, base_nodes, base_cost, base_meta, now, profile, "SafePath-BOA*", "Baseline Route"
        )
        
        res = CounterfactualEngine.simulate_mutation(
            graph,
            base_candidate,
            payload.mutation,
            src,
            tgt,
            now,
            base_ctx,
            profile
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
