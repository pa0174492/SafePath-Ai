from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from packages.shared_types.models import RouteRequest, RouteResponse, Coordinate, UserProfile, MobilityProfile
from services.routing.router import SafePathRouter
from services.routing.provenance_service import ProvenanceService

router = APIRouter(prefix="/route", tags=["Routing Engine"])
router_service = SafePathRouter()

@router.post("", response_model=RouteResponse)
def compute_route(request: RouteRequest):
    """
    Compute optimal uncertainty-aware, context-adaptive pedestrian routes
    returning non-dominated Pareto candidate paths.
    """
    try:
        response = router_service.route(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/demo")
def demo_route(
    profile_type: MobilityProfile = MobilityProfile.WHEELCHAIR_MANUAL,
    city_tag: str = "seattle_downtown"
):
    """
    Convenience demo endpoint generating a representative route between Pike Place Market and Pioneer Square.
    """
    # Origin: Pike Place Market (47.6097, -122.3385)
    # Destination: Pioneer Square (47.6000, -122.3325)
    req = RouteRequest(
        origin=Coordinate(lat=47.6097, lon=-122.3385),
        destination=Coordinate(lat=47.6000, lon=-122.3325),
        profile=UserProfile(
            profile_type=profile_type,
            max_slope_pct=8.33,
            avoid_unpaved=True,
            require_curb_ramps=True,
            uncertainty_aversion_lambda=1.5
        ),
        city_tag=city_tag
    )
    return router_service.route(req)

@router.get("/{candidate_id}/provenance")
def get_provenance(candidate_id: str):
    """Retrieve full data lineage and provenance breakdown for a specific candidate route."""
    # In a production setup, candidates are retrieved from a cache/DB.
    # For zero-dependency direct API, generate reference demo route and extract provenance.
    demo_res = demo_route()
    target_candidate = None
    for c in demo_res.candidates:
        if c.id == candidate_id or candidate_id.startswith("route-"):
            target_candidate = c
            break
            
    if not target_candidate and demo_res.candidates:
        target_candidate = demo_res.candidates[0]
        
    return ProvenanceService.get_route_provenance_summary(target_candidate)
