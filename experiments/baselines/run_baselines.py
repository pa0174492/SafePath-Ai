import json
import time
import numpy as np
from datetime import datetime
from packages.shared_types.models import (
    Coordinate,
    RouteRequest,
    UserProfile,
    MobilityProfile
)
from services.routing.router import SafePathRouter

def run_benchmark_suite(num_trials: int = 15, seed: int = 42):
    print(f"=== SafePath-AI Benchmark Suite (Trials={num_trials}, Seed={seed}) ===")
    router = SafePathRouter()
    
    # Representative OD test pairs in Seattle Downtown
    od_pairs = [
        ("Pike Market to Pioneer Sq", Coordinate(lat=47.6097, lon=-122.3385), Coordinate(lat=47.6000, lon=-122.3325)),
        ("Westlake to Central Library", Coordinate(lat=47.6105, lon=-122.3365), Coordinate(lat=47.6045, lon=-122.3305)),
        ("Waterfront to 5th & Columbia", Coordinate(lat=47.6075, lon=-122.3385), Coordinate(lat=47.6000, lon=-122.3305))
    ]
    
    results = []
    
    for name, origin, dest in od_pairs:
        req = RouteRequest(
            origin=origin,
            destination=dest,
            profile=UserProfile(
                profile_type=MobilityProfile.WHEELCHAIR_MANUAL,
                max_slope_pct=8.33,
                avoid_unpaved=True,
                uncertainty_aversion_lambda=1.5
            ),
            departure_time=datetime(2026, 9, 18, 18, 30, 0)  # Twilight scenario
        )
        
        t0 = time.time()
        res = router.route(req)
        elapsed = (time.time() - t0) * 1000.0
        
        print(f"Pair '{name}': Found {len(res.candidates)} Pareto candidates in {elapsed:.1f}ms")
        for c in res.candidates:
            print(f"  - [{c.algorithm_tag}] {c.name}: Time={c.metrics.total_travel_time_min}m, Dist={c.metrics.total_distance_m}m, Risk={c.metrics.robust_safety_risk}, Burden={c.metrics.accessibility_burden}")
            
    return od_pairs

if __name__ == "__main__":
    run_benchmark_suite()
