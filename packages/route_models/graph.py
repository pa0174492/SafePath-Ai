from typing import Dict, List, Optional, Tuple, Any
import networkx as nx
from packages.shared_types.models import (
    Coordinate,
    EdgeStaticFeatures,
    EdgeAccessibilityInference,
    IncidentPoint,
    HazardZone
)
from packages.geo_utils.geodesy import haversine_distance_m

class SafePathGraph:
    """
    Pedestrian Road & Path Graph with spatial indexing, edge static/inferred features,
    and dynamic hazard overlays.
    """
    def __init__(self, city_tag: str = "seattle_downtown"):
        self.city_tag = city_tag
        self.nx_graph = nx.MultiDiGraph()
        self.nodes: Dict[str, Coordinate] = {}
        self.edges_features: Dict[Tuple[str, str, int], EdgeStaticFeatures] = {}
        self.edges_inferences: Dict[Tuple[str, str, int], EdgeAccessibilityInference] = {}
        self.incidents: List[IncidentPoint] = []
        self.hazard_zones: List[HazardZone] = []
        
    def add_node(self, node_id: str, coordinate: Coordinate):
        self.nodes[node_id] = coordinate
        self.nx_graph.add_node(node_id, lat=coordinate.lat, lon=coordinate.lon, elevation=coordinate.elevation_m)
        
    def add_edge(
        self,
        u: str,
        v: str,
        static_features: EdgeStaticFeatures,
        inference: Optional[EdgeAccessibilityInference] = None,
        key: int = 0
    ):
        edge_key = (u, v, key)
        self.edges_features[edge_key] = static_features
        if inference:
            self.edges_inferences[edge_key] = inference
            
        self.nx_graph.add_edge(
            u,
            v,
            key=key,
            length_m=static_features.length_m,
            edge_id=static_features.edge_id,
            road_class=static_features.road_class
        )
        
    def get_nearest_node(self, coord: Coordinate) -> str:
        """Find the closest graph node to a given coordinate using geodesic distance."""
        if not self.nodes:
            raise ValueError("Graph has no nodes.")
            
        best_node = None
        min_dist = float('inf')
        
        for node_id, node_coord in self.nodes.items():
            dist = haversine_distance_m(coord, node_coord)
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
                
        return best_node

    def get_edge_features(self, u: str, v: str, key: int = 0) -> Optional[EdgeStaticFeatures]:
        return self.edges_features.get((u, v, key))

    def get_edge_inference(self, u: str, v: str, key: int = 0) -> Optional[EdgeAccessibilityInference]:
        return self.edges_inferences.get((u, v, key))

    def add_incident(self, incident: IncidentPoint):
        self.incidents.append(incident)

    def add_hazard_zone(self, zone: HazardZone):
        self.hazard_zones.append(zone)

    def clear_dynamic_overlays(self):
        self.incidents.clear()
        self.hazard_zones.clear()
