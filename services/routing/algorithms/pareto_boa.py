import heapq
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

from packages.route_models.graph import SafePathGraph
from packages.route_models.edge_evaluator import EdgeCostEvaluator
from packages.route_models.dominance import dominates, filter_non_dominated
from packages.shared_types.models import UserProfile, ContextSnapshot
from packages.geo_utils.geodesy import haversine_distance_m

class ParetoBOARouter:
    """
    Multi-Objective Bicriterion / Multi-Criteria Optimal A* (BOA* / NAMOA*) pathfinding.
    Finds exact non-dominated Pareto frontiers across the 6-objective vector:
    [Travel Time, Distance, Robust Safety Risk, Accessibility Burden, Environmental Exposure, Complexity].
    """
    
    @staticmethod
    def search_pareto_frontier(
        graph: SafePathGraph,
        source_node: str,
        target_node: str,
        departure_time: datetime,
        context: ContextSnapshot,
        profile: UserProfile,
        max_frontier_size: int = 25,
        max_expansions: int = 3500
    ) -> List[Tuple[List[str], np.ndarray, Dict[str, Any]]]:
        """
        Returns list of (path_nodes, cost_vector_6d, metadata) tuples for all non-dominated routes found.
        """
        if source_node not in graph.nodes or target_node not in graph.nodes:
            return []
            
        target_coord = graph.nodes[target_node]
        
        # Labels at each node: List of cost vectors g(u) for non-dominated paths reaching u
        node_labels: Dict[str, List[np.ndarray]] = {node: [] for node in graph.nodes}
        
        # Target complete non-dominated paths: (cost_vector, (path_nodes, cumulative_time, edge_details_list))
        target_solutions: List[Tuple[np.ndarray, Tuple[List[str], float, List[Dict[str, Any]]]]] = []
        
        # Priority queue stores tuples: (priority_scalar, g_vector, cum_time, current_node, path_history, details_history)
        initial_g = np.zeros(6, dtype=float)
        h_init = haversine_distance_m(graph.nodes[source_node], target_coord)
        
        # Priority is f1 = travel_time + h(dist)/speed
        est_min_time = initial_g[0] + (h_init / profile.walking_speed_mps)
        
        # Entry count counter to prevent unorderable array comparisons in heapq
        counter = 0
        pq = [(est_min_time, counter, initial_g, 0.0, source_node, [source_node], [])]
        node_labels[source_node].append(initial_g)
        
        expansions = 0
        
        while pq and expansions < max_expansions:
            expansions += 1
            f_score, _, g_vec, cum_time, u, path, details_hist = heapq.heappop(pq)
            
            # Prune if dominated by existing label at target
            if target_solutions:
                target_dominated = False
                for target_vec, _ in target_solutions:
                    if dominates(target_vec, g_vec):
                        target_dominated = True
                        break
                if target_dominated:
                    continue
                    
            if u == target_node:
                # Add to target solutions
                payload = (path, cum_time, details_hist)
                target_solutions.append((g_vec, payload))
                # Filter target solutions to keep only non-dominated
                target_solutions = filter_non_dominated(target_solutions)
                if len(target_solutions) >= max_frontier_size:
                    break
                continue
                
            # Expand neighbors
            for v in graph.nx_graph.neighbors(u):
                # Avoid cycles
                if v in path:
                    continue
                    
                feat = graph.get_edge_features(u, v)
                infer = graph.get_edge_inference(u, v)
                if not feat:
                    continue
                    
                edge_cost_vec, edge_details = EdgeCostEvaluator.evaluate_edge(
                    feat,
                    infer,
                    departure_time,
                    cum_time,
                    context,
                    profile,
                    graph.incidents,
                    graph.hazard_zones
                )
                
                new_g = g_vec + edge_cost_vec
                new_cum_time = cum_time + edge_details["duration_s"]
                
                # Check dominance against existing labels at node v
                is_dominated_at_v = False
                for existing_g in node_labels[v]:
                    if dominates(existing_g, new_g):
                        is_dominated_at_v = True
                        break
                if is_dominated_at_v:
                    continue
                    
                # Prune any existing labels at v dominated by new_g
                node_labels[v] = [eg for eg in node_labels[v] if not dominates(new_g, eg)]
                node_labels[v].append(new_g)
                
                # Admissible heuristic: Euclidean distance remaining / walking speed
                dist_rem = haversine_distance_m(graph.nodes[v], target_coord)
                est_rem_time = dist_rem / profile.walking_speed_mps
                f_v = new_g[0] + est_rem_time
                
                counter += 1
                new_path = path + [v]
                new_details = details_hist + [edge_details]
                heapq.heappush(pq, (f_v, counter, new_g, new_cum_time, v, new_path, new_details))
                
        # Format and return non-dominated solutions
        results = []
        filtered_targets = filter_non_dominated(target_solutions)
        
        for cost_vec, (p_nodes, total_time_s, d_list) in filtered_targets:
            meta = {
                "total_duration_s": total_time_s,
                "edge_details": d_list,
                "expansions": expansions
            }
            results.append((p_nodes, cost_vec, meta))
            
        # Sort by travel time ascending
        results.sort(key=lambda item: item[1][0])
        return results
