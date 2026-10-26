import time
from datetime import datetime
from typing import List, Dict, Any, Optional
import numpy as np

from packages.shared_types.models import (
    RouteRequest,
    RouteResponse,
    RouteCandidate,
    UserProfile,
    SystemExecutionMode,
    MobilityProfile,
    ContextSnapshot
)
from packages.route_models.graph import SafePathGraph
from packages.route_models.edge_evaluator import EdgeCostEvaluator
from services.data_ingestion.osm_pipeline import OSMPipeline
from services.data_ingestion.providers.mock_provider import MockWeatherProvider
from .algorithms.pareto_boa import ParetoBOARouter
from .algorithms.robust_pareto import RobustParetoEngine
from .algorithms.dijkstra import shortest_path_dijkstra
from .algorithms.weighted_sum import weighted_sum_route
from .live_osrm_engine import LiveOSRMEngine

class SafePathRouter:
    """
    Master routing orchestrator for SafePath-AI.
    Manages graph caches, weather fusion, Pareto frontier extraction,
    and baseline comparisons. Supports synthetic benchmarks and real-world India routing.
    """
    def __init__(self):
        # Graph cache by city tag
        self.graphs: Dict[str, SafePathGraph] = {
            "seattle_downtown": OSMPipeline.create_synthetic_seattle_fixture(),
            "kadapa_campus": OSMPipeline.create_synthetic_kadapa_fixture()
        }
        self.weather_provider = MockWeatherProvider()
        
    def get_graph(self, city_tag: str) -> SafePathGraph:
        if city_tag in ["kadapa_campus", "kadapa", "india"]:
            if "kadapa_campus" not in self.graphs:
                self.graphs["kadapa_campus"] = OSMPipeline.create_synthetic_kadapa_fixture()
            return self.graphs["kadapa_campus"]
        if city_tag not in self.graphs:
            self.graphs[city_tag] = OSMPipeline.create_synthetic_seattle_fixture()
        return self.graphs[city_tag]

    def route(self, request: RouteRequest) -> RouteResponse:
        start_time = time.time()
        dep_time = request.departure_time or datetime.now()
        weather_snapshot = self.weather_provider.get_current_weather(request.origin)

        # Check if coordinates are in India or arbitrary live coordinates
        is_india_coords = (6.0 <= request.origin.lat <= 38.0 and 68.0 <= request.origin.lon <= 98.0)
        
        # If live routing or arbitrary India coordinates outside campus bounding box, try real OSRM Foot API
        if is_india_coords and request.city_tag != "kadapa_campus_synthetic":
            live_res = LiveOSRMEngine.compute_live_route(request, weather_snapshot, dep_time, start_time)
            if live_res and live_res.candidates:
                return live_res

        # Determine appropriate regional graph
        tag = request.city_tag
        if is_india_coords and tag not in ["kadapa_campus", "seattle_downtown"]:
            tag = "kadapa_campus"
            
        graph = self.get_graph(tag)

        
        # 1. Snap origin and destination coordinates to closest graph nodes
        src_node = graph.get_nearest_node(request.origin)
        tgt_node = graph.get_nearest_node(request.destination)
        
        if src_node == tgt_node:
            # Return adjacent node to ensure non-trivial route
            for n in graph.nx_graph.neighbors(src_node):
                tgt_node = n
                break
                
        # 2. Extract non-dominated Pareto frontier via Multi-Objective BOA*
        pareto_raw = ParetoBOARouter.search_pareto_frontier(
            graph,
            src_node,
            tgt_node,
            dep_time,
            weather_snapshot,
            request.profile,
            max_frontier_size=15
        )
        
        candidates: List[RouteCandidate] = []
        
        # 3. Build Candidates from Pareto frontier
        if pareto_raw:
            # Candidate 1: Robust Balanced Safe Path (Best compromise)
            best_nodes, best_cost, best_meta = pareto_raw[0]
            c1 = RobustParetoEngine.build_route_candidate(
                graph,
                best_nodes,
                best_cost,
                best_meta,
                dep_time,
                request.profile,
                "SafePath-BOA*",
                "Robust Balanced Safe Path"
            )
            candidates.append(c1)
            
            # Candidate 2: Maximum Accessibility Path (if distinct path exists)
            # Find candidate with minimum accessibility burden
            sorted_by_access = sorted(pareto_raw, key=lambda x: (x[1][3], x[1][0]))
            acc_nodes, acc_cost, acc_meta = sorted_by_access[0]
            if acc_nodes != best_nodes:
                c2 = RobustParetoEngine.build_route_candidate(
                    graph,
                    acc_nodes,
                    acc_cost,
                    acc_meta,
                    dep_time,
                    request.profile,
                    "SafePath-MaxAccessibility",
                    "Maximum Accessibility Path"
                )
                candidates.append(c2)
                
            # Candidate 3: Lowest Environmental & Incident Exposure
            sorted_by_env = sorted(pareto_raw, key=lambda x: (x[1][4] + x[1][2], x[1][0]))
            env_nodes, env_cost, env_meta = sorted_by_env[0]
            if env_nodes not in [best_nodes, acc_nodes]:
                c3 = RobustParetoEngine.build_route_candidate(
                    graph,
                    env_nodes,
                    env_cost,
                    env_meta,
                    dep_time,
                    request.profile,
                    "SafePath-LowExposure",
                    "Low Exposure Shielded Path"
                )
                candidates.append(c3)
                
        # 4. Generate Baseline B0 (Shortest Path) for benchmark comparison
        shortest_nodes = shortest_path_dijkstra(graph, src_node, tgt_node)
        if shortest_nodes:
            # Evaluate costs along shortest path
            short_cost_vec = np.zeros(6)
            cum_t = 0.0
            d_list = []
            for i in range(len(shortest_nodes) - 1):
                u, v = shortest_nodes[i], shortest_nodes[i+1]
                f = graph.get_edge_features(u, v)
                inf = graph.get_edge_inference(u, v)
                vec, det = EdgeCostEvaluator.evaluate_edge(
                    f, inf, dep_time, cum_t, weather_snapshot, request.profile, graph.incidents, graph.hazard_zones
                )
                short_cost_vec += vec
                cum_t += det["duration_s"]
                d_list.append(det)
                
            c_short = RobustParetoEngine.build_route_candidate(
                graph,
                shortest_nodes,
                short_cost_vec,
                {"edge_details": d_list, "total_duration_s": cum_t},
                dep_time,
                request.profile,
                "Baseline-Dijkstra-B0",
                "Fastest Direct Baseline Path"
            )
            # Add shortest path as comparison candidate if not already present
            if not any(c.segments == c_short.segments for c in candidates):
                candidates.append(c_short)
                
        # If no candidates generated, build a guaranteed single-hop path
        if not candidates and shortest_nodes:
            candidates.append(c_short)
            
        exec_ms = round((time.time() - start_time) * 1000.0, 2)
        req_id = f"req-{abs(hash(str(request.origin) + str(request.destination) + str(dep_time))):08x}"
        
        return RouteResponse(
            request_id=req_id,
            mode=request.mode,
            departure_time=dep_time,
            execution_time_ms=exec_ms,
            candidates=candidates,
            selected_candidate_id=candidates[0].id if candidates else "none",
            pareto_frontier_count=len(pareto_raw),
            context_snapshot=weather_snapshot
        )
