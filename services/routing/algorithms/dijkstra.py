import heapq
from typing import List, Tuple, Optional, Dict
from packages.route_models.graph import SafePathGraph
from packages.geo_utils.geodesy import haversine_distance_m

def shortest_path_dijkstra(graph: SafePathGraph, source_node: str, target_node: str) -> Optional[List[str]]:
    """
    Standard Dijkstra's algorithm minimizing exclusively physical distance (meters).
    Serves as Baseline B0.
    """
    if source_node not in graph.nodes or target_node not in graph.nodes:
        return None
        
    distances: Dict[str, float] = {node: float('inf') for node in graph.nodes}
    distances[source_node] = 0.0
    predecessors: Dict[str, Optional[str]] = {node: None for node in graph.nodes}
    
    pq: List[Tuple[float, str]] = [(0.0, source_node)]
    
    while pq:
        dist_u, u = heapq.heappop(pq)
        
        if dist_u > distances[u]:
            continue
            
        if u == target_node:
            break
            
        for v in graph.nx_graph.neighbors(u):
            # Check edge length
            feat = graph.get_edge_features(u, v)
            if not feat:
                continue
            alt = dist_u + feat.length_m
            if alt < distances[v]:
                distances[v] = alt
                predecessors[v] = u
                heapq.heappush(pq, (alt, v))
                
    if distances[target_node] == float('inf'):
        return None
        
    # Reconstruct path
    path = []
    curr = target_node
    while curr is not None:
        path.append(curr)
        curr = predecessors[curr]
    path.reverse()
    return path

def astar_shortest_path(graph: SafePathGraph, source_node: str, target_node: str) -> Optional[List[str]]:
    """
    Standard A* algorithm with Euclidean/Haversine admissible heuristic.
    """
    if source_node not in graph.nodes or target_node not in graph.nodes:
        return None
        
    target_coord = graph.nodes[target_node]
    g_score: Dict[str, float] = {node: float('inf') for node in graph.nodes}
    g_score[source_node] = 0.0
    predecessors: Dict[str, Optional[str]] = {node: None for node in graph.nodes}
    
    h_start = haversine_distance_m(graph.nodes[source_node], target_coord)
    pq: List[Tuple[float, float, str]] = [(h_start, 0.0, source_node)]
    
    while pq:
        f_val, g_val, u = heapq.heappop(pq)
        
        if g_val > g_score[u]:
            continue
            
        if u == target_node:
            break
            
        for v in graph.nx_graph.neighbors(u):
            feat = graph.get_edge_features(u, v)
            if not feat:
                continue
            tentative_g = g_val + feat.length_m
            if tentative_g < g_score[v]:
                g_score[v] = tentative_g
                predecessors[v] = u
                h_v = haversine_distance_m(graph.nodes[v], target_coord)
                heapq.heappush(pq, (tentative_g + h_v, tentative_g, v))
                
    if g_score[target_node] == float('inf'):
        return None
        
    path = []
    curr = target_node
    while curr is not None:
        path.append(curr)
        curr = predecessors[curr]
    path.reverse()
    return path
