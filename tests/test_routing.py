from datetime import datetime
from packages.shared_types.models import (
    Coordinate,
    RouteRequest,
    UserProfile,
    MobilityProfile,
    CounterfactualMutation
)
from services.routing.router import SafePathRouter
from services.routing.counterfactual import CounterfactualEngine

def test_router_execution():
    router = SafePathRouter()
    req = RouteRequest(
        origin=Coordinate(lat=47.6105, lon=-122.3385),   # 1st & Pike
        destination=Coordinate(lat=47.6000, lon=-122.3325), # 4th & Columbia
        profile=UserProfile(
            profile_type=MobilityProfile.WHEELCHAIR_MANUAL,
            max_slope_pct=8.33,
            avoid_unpaved=True,
            require_curb_ramps=True
        ),
        departure_time=datetime(2026, 9, 18, 14, 0, 0)
    )
    
    res = router.route(req)
    assert len(res.candidates) >= 1
    c1 = res.candidates[0]
    assert c1.metrics.total_travel_time_min > 0.0
    assert c1.metrics.total_distance_m > 500.0
    assert len(c1.segments) > 0
    assert c1.geometry_geojson["type"] == "Feature"
    assert c1.metrics.robust_safety_risk >= 0.0

def test_counterfactual_simulation():
    router = SafePathRouter()
    req = RouteRequest(
        origin=Coordinate(lat=47.6105, lon=-122.3385),
        destination=Coordinate(lat=47.6000, lon=-122.3325),
        profile=UserProfile(profile_type=MobilityProfile.STANDARD)
    )
    res = router.route(req)
    base_candidate = res.candidates[0]
    
    mutation = CounterfactualMutation(rainfall_multiplier=2.5, lighting_decay_multiplier=0.4)
    graph = router.get_graph("seattle_downtown")
    
    sim_res = CounterfactualEngine.simulate_mutation(
        base_graph=graph,
        base_candidate=base_candidate,
        mutation=mutation,
        source_node="1st_Pike",
        target_node="4th_Columbia",
        departure_time=datetime.now(),
        base_context=res.context_snapshot,
        profile=req.profile
    )
    
    assert sim_res.mutation_id is not None
    assert len(sim_res.explanation_of_change) > 10
