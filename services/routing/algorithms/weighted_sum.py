import heapq
from datetime import datetime
from typing import List, Tuple, Optional, Dict
import numpy as np

from packages.route_models.graph import SafePathGraph
from packages.route_models.edge_evaluator import EdgeCostEvaluator
from packages.shared_types.models import UserProfile, ContextSnapshot

def weighted_sum_route(
    graph: SafePathGraph,
    source_node: str,
    target_node: str,
    departure_time: datetime,
    context: ContextSnapshot,
    profile: UserProfile,
    weights: Optional[np.ndarray] = None
) -> Optional[Tuple[List[str], np.ndarray, float]]:
    """
    Computes optimal path using scalarized linear combination of the 6-objective vector.
    Serves as Baseline B1.
    """
    if source_node not in graph.nodes or target_node not in graph.nodes:
        return None
        
    if weights is None:
        # Normalize profile weights: [time, distance, robust_risk, access_burden, env_exposure, complexity]
        w = np.array([
            profile.time_priority * 1.0,
            profile.distance_priority * 0.01,
            profile.safety_priority * 5.0,
            profile.accessibility_priority * 4.0,
            profile.environment_priority * 2.0,
            profile.complexity_priority * 1.5
        ], dtype=float)
        weights = w / np.sum(w)
        
    best_costs: Dict[str, float] = {node: float('inf') for node in graph.nodes}
    best_costs[source_node] = 0.0
    
    cumulative_times: Dict[str, float] = {node: 0.0 for node in graph.nodes}
    predecessors: Dict[str, Optional[str]] = {node: None for node in graph.nodes}
    edge_cost_vecs: Dict[Tuple[str, str], np.ndarray] = {}
    
    # PQ: (scalar_cost, cum_time, node_id)
    pq: List[Tuple[float, float, str]] = [(0.0, 0.0, source_node)]
    
    while pq:
        cost_u, cum_time_u, u = heapq.heappop(pq)
        
        if cost_u > best_costs[u]:
            continue
            
        if u == target_node:
            break
            
        for v in graph.nx_graph.neighbors(u):
            feat = graph.get_edge_features(u, v)
            infer = graph.get_edge_inference(u, v)
            if not feat:
                continue
                
            cost_vec, details = EdgeCostEvaluator.evaluate_edge(
                feat,
                infer,
                departure_time,
                cum_time_u,
                context,
                profile,
                graph.incidents,
                graph.hazard_zones
            )
            
            scalar_edge = float(np.dot(weights, cost_vec))
            total_cost_v = cost_u + scalar_edge
            
            if total_cost_v < best_costs[v]:
                best_costs[v] = total_cost_v
                cumulative_times[v] = cum_time_u + details["duration_s"]
                predecessors[v] = u
                edge_cost_vecs[(u, v)] = cost_vec
                heapq.heappush(pq, (total_cost_v, cumulative_times[v], v))
                
    if best_costs[target_node] == float('inf'):
        return None
        
    path = []
    curr = target_node
    while curr is not None:
        path.append(curr)
        curr = predecessors[curr]
    path.reverse()
    
    # Calculate sum vector
    total_vec = np.zeros(6, dtype=float)
    for i in range(len(path) - 1):
        total_vec += edge_cost_vecs.get((path[i], path[i+1]), np.zeros(6))
        
    return path, total_vec, best_costs[target_node]
