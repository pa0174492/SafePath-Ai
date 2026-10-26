from typing import Dict, List, Tuple, Optional
from datetime import datetime
from packages.shared_types.models import (
    Coordinate,
    EdgeStaticFeatures,
    EdgeAccessibilityInference,
    InferenceStatus,
    ConfidenceLevel,
    SurfaceType,
    CrossingType
)
from packages.geo_utils.geodesy import haversine_distance_m, calculate_slope_pct
from packages.route_models.graph import SafePathGraph
from .providers.mock_provider import MockElevationProvider, MockIncidentProvider

class OSMPipeline:
    """
    Ingests and transforms road networks into an enriched SafePathGraph with static features,
    elevation profiles, and baseline accessibility inferences.
    """
    
    @staticmethod
    def create_synthetic_seattle_fixture() -> SafePathGraph:
        """
        Creates a high-fidelity synthetic road network of Seattle Downtown / Central Waterfront.
        Includes realistic grid geometry, steep hill climbs (Seneca/Spring), cobblestone alleys,
        and illuminated corridors.
        """
        graph = SafePathGraph(city_tag="seattle_downtown")
        elev_provider = MockElevationProvider()
        inc_provider = MockIncidentProvider()
        
        # Grid of streets (North-South: 1st Ave, 2nd Ave, 3rd Ave, 4th Ave, 5th Ave)
        # and avenues (East-West: Pike, Union, University, Seneca, Spring, Madison, Marion, Columbia, Cherry, James)
        avenues = [
            ("1st", -122.3385, 18.0),
            ("2nd", -122.3365, 28.0),
            ("3rd", -122.3345, 38.0),
            ("4th", -122.3325, 48.0),
            ("5th", -122.3305, 56.0)
        ]
        
        streets = [
            ("Pike", 47.6105),
            ("Union", 47.6090),
            ("University", 47.6075),
            ("Seneca", 47.6060),
            ("Spring", 47.6045),
            ("Madison", 47.6030),
            ("Marion", 47.6015),
            ("Columbia", 47.6000),
            ("James", 47.5985)
        ]
        
        # 1. Create Nodes
        node_id_map: Dict[str, Coordinate] = {}
        for ave_name, lon, base_elev in avenues:
            for st_name, lat in streets:
                nid = f"{ave_name}_{st_name}"
                # Add slight realistic micro-elevation variations
                elev = base_elev + (47.6105 - lat) * 40.0
                coord = Coordinate(lat=lat, lon=lon, elevation_m=elev)
                graph.add_node(nid, coord)
                node_id_map[nid] = coord
                
        # Also add Post Alley (unlit, cobblestone) near Pike/Union
        graph.add_node("PostAlley_Pike", Coordinate(lat=47.6098, lon=-122.3395, elevation_m=19.0))
        graph.add_node("PostAlley_Union", Coordinate(lat=47.6088, lon=-122.3392, elevation_m=20.0))
        
        # 2. Build Horizontal (East-West) Edges
        for st_name, lat in streets:
            for i in range(len(avenues) - 1):
                u_id = f"{avenues[i][0]}_{st_name}"
                v_id = f"{avenues[i+1][0]}_{st_name}"
                u_coord = node_id_map[u_id]
                v_coord = node_id_map[v_id]
                
                dist = haversine_distance_m(u_coord, v_coord)
                slope = calculate_slope_pct(u_coord, v_coord, dist)
                
                # Seneca and Spring are notoriously steep in Seattle (>9% slope)
                if st_name in ["Seneca", "Spring"]:
                    slope = max(slope, 10.5)
                
                # East-West edges (bidirectional)
                for u, v in [(u_id, v_id), (v_id, u_id)]:
                    edge_id = f"edge_{u}_{v}"
                    static = EdgeStaticFeatures(
                        edge_id=edge_id,
                        u=u,
                        v=v,
                        length_m=dist,
                        road_class="residential" if st_name in ["Spring", "Seneca"] else "secondary",
                        surface=SurfaceType.CONCRETE,
                        surface_status=InferenceStatus.KNOWN,
                        has_sidewalk=True,
                        sidewalk_status=InferenceStatus.KNOWN,
                        is_crossing=False,
                        has_curb_ramp=(st_name != "Seneca"),  # Seneca lacks curb ramps on steep side
                        curb_ramp_status=InferenceStatus.KNOWN,
                        is_lit=True,
                        lighting_status=InferenceStatus.KNOWN,
                        slope_pct=slope,
                        slope_status=InferenceStatus.KNOWN,
                        data_completeness=0.95,
                        geometry_coords=[node_id_map[u], node_id_map[v]]
                    )
                    
                    # Accessibility inference
                    # High slope penalizes wheelchair accessibility
                    w_prob = max(0.1, 0.95 - (slope / 10.0) * 0.7)
                    infer = EdgeAccessibilityInference(
                        edge_id=edge_id,
                        wheelchair_accessible_prob=w_prob,
                        stroller_accessible_prob=max(0.2, 0.92 - (slope / 12.0) * 0.5),
                        visual_accessible_prob=0.90,
                        overall_accessibility_prob=w_prob,
                        confidence=0.90 if slope < 8.0 else 0.75,
                        status=InferenceStatus.KNOWN if slope < 5.0 else InferenceStatus.INFERRED,
                        model_version="access-infer-v1.0"
                    )
                    graph.add_edge(u, v, static, infer)
                    
        # 3. Build Vertical (North-South) Edges
        for ave_name, lon, base_elev in avenues:
            for j in range(len(streets) - 1):
                u_id = f"{ave_name}_{streets[j][0]}"
                v_id = f"{ave_name}_{streets[j+1][0]}"
                u_coord = node_id_map[u_id]
                v_coord = node_id_map[v_id]
                
                dist = haversine_distance_m(u_coord, v_coord)
                slope = calculate_slope_pct(u_coord, v_coord, dist)
                
                is_primary_arterial = ave_name in ["4th", "2nd"]
                is_lit = ave_name in ["4th", "3rd", "5th"]
                
                for u, v in [(u_id, v_id), (v_id, u_id)]:
                    edge_id = f"edge_{u}_{v}"
                    static = EdgeStaticFeatures(
                        edge_id=edge_id,
                        u=u,
                        v=v,
                        length_m=dist,
                        road_class="primary" if is_primary_arterial else "tertiary",
                        surface=SurfaceType.ASPHALT if is_primary_arterial else SurfaceType.CONCRETE,
                        surface_status=InferenceStatus.KNOWN,
                        has_sidewalk=True,
                        sidewalk_status=InferenceStatus.KNOWN,
                        is_crossing=False,
                        has_curb_ramp=True,
                        curb_ramp_status=InferenceStatus.KNOWN,
                        is_lit=is_lit,
                        lighting_status=InferenceStatus.KNOWN if is_lit else InferenceStatus.INFERRED,
                        slope_pct=slope,
                        slope_status=InferenceStatus.KNOWN,
                        data_completeness=0.92,
                        geometry_coords=[node_id_map[u], node_id_map[v]]
                    )
                    
                    infer = EdgeAccessibilityInference(
                        edge_id=edge_id,
                        wheelchair_accessible_prob=0.95,
                        stroller_accessible_prob=0.95,
                        visual_accessible_prob=0.92,
                        overall_accessibility_prob=0.95,
                        confidence=0.95,
                        status=InferenceStatus.KNOWN,
                        model_version="access-infer-v1.0"
                    )
                    graph.add_edge(u, v, static, infer)

        # 4. Add Post Alley Edges (Cobblestone, unlit, narrow, missing curb ramps)
        for u, v in [("1st_Pike", "PostAlley_Pike"), ("PostAlley_Pike", "PostAlley_Union"), ("PostAlley_Union", "1st_Union")]:
            for from_node, to_node in [(u, v), (v, u)]:
                c1 = graph.nodes[from_node]
                c2 = graph.nodes[to_node]
                dist = haversine_distance_m(c1, c2)
                edge_id = f"edge_{from_node}_{to_node}"
                static = EdgeStaticFeatures(
                    edge_id=edge_id,
                    u=from_node,
                    v=to_node,
                    length_m=dist,
                    road_class="footway",
                    surface=SurfaceType.COBBLESTONE,
                    surface_status=InferenceStatus.KNOWN,
                    has_sidewalk=False,
                    sidewalk_status=InferenceStatus.INFERRED,
                    is_crossing=False,
                    has_curb_ramp=False,
                    curb_ramp_status=InferenceStatus.INFERRED,
                    is_lit=False,
                    lighting_status=InferenceStatus.KNOWN,
                    slope_pct=3.2,
                    slope_status=InferenceStatus.KNOWN,
                    data_completeness=0.70,
                    geometry_coords=[c1, c2]
                )
                infer = EdgeAccessibilityInference(
                    edge_id=edge_id,
                    wheelchair_accessible_prob=0.18,
                    stroller_accessible_prob=0.35,
                    visual_accessible_prob=0.40,
                    overall_accessibility_prob=0.25,
                    confidence=0.78,
                    status=InferenceStatus.INFERRED,
                    model_version="access-infer-v1.0"
                )
                graph.add_edge(from_node, to_node, static, infer)
                
        # 5. Attach Active Incidents and Hazard Zones from provider
        for inc in inc_provider.get_active_incidents(None):
            graph.add_incident(inc)
            
        return graph

    @staticmethod
    def create_synthetic_kadapa_fixture() -> SafePathGraph:
        """
        Creates a high-fidelity synthetic road & campus pathway network of Kadapa Engineering Campus
        and Kadapa Urban Corridor (YSR Kadapa District, Andhra Pradesh, India).
        Includes wheelchair ramps, shaded tree-lined avenues, academic quad links, and incident zones.
        """
        graph = SafePathGraph(city_tag="kadapa_campus")
        
        # Campus & Kadapa Hub Nodes
        nodes_data = [
            ("Campus_MainGate", 14.4746, 78.7820, 138.0),
            ("Campus_AdminBlock", 14.4752, 78.7835, 139.0),
            ("Campus_CSE_Block", 14.4760, 78.7845, 140.0),
            ("Campus_ECE_Block", 14.4755, 78.7858, 140.0),
            ("Campus_CentralLibrary", 14.4745, 78.7848, 139.0),
            ("Campus_Auditorium", 14.4738, 78.7838, 138.0),
            ("Campus_SportsComplex", 14.4730, 78.7855, 137.0),
            ("Campus_Canteen", 14.4740, 78.7865, 138.0),
            ("Campus_Mechanical_Block", 14.4765, 78.7830, 140.0),
            ("Campus_Civil_Block", 14.4768, 78.7840, 141.0),
            ("Campus_Hostel_Block", 14.4772, 78.7860, 141.5),
            ("Kadapa_RIMS_Road", 14.4780, 78.7880, 142.0)
        ]
        
        for nid, lat, lon, elev in nodes_data:
            graph.add_node(nid, Coordinate(lat=lat, lon=lon, elevation_m=elev))
            
        # Pathway connections (Bidirectional)
        edges = [
            ("Campus_MainGate", "Campus_AdminBlock", SurfaceType.ASPHALT, True, True, 1.2, 0.98, "primary"),
            ("Campus_AdminBlock", "Campus_CentralLibrary", SurfaceType.PAVING_STONES, True, True, 0.8, 0.99, "footway"),
            ("Campus_CentralLibrary", "Campus_CSE_Block", SurfaceType.PAVING_STONES, True, True, 1.5, 0.97, "footway"),
            ("Campus_AdminBlock", "Campus_Mechanical_Block", SurfaceType.CONCRETE, True, True, 1.8, 0.95, "residential"),
            ("Campus_Mechanical_Block", "Campus_Civil_Block", SurfaceType.CONCRETE, True, True, 1.4, 0.96, "footway"),
            ("Campus_Civil_Block", "Campus_CSE_Block", SurfaceType.PAVING_STONES, True, True, 1.0, 0.98, "footway"),
            ("Campus_CSE_Block", "Campus_ECE_Block", SurfaceType.PAVING_STONES, True, True, 0.9, 0.98, "footway"),
            ("Campus_ECE_Block", "Campus_Canteen", SurfaceType.ASPHALT, True, True, 1.6, 0.94, "footway"),
            ("Campus_CentralLibrary", "Campus_Auditorium", SurfaceType.PAVING_STONES, True, True, 0.7, 0.99, "footway"),
            ("Campus_Auditorium", "Campus_SportsComplex", SurfaceType.ASPHALT, True, True, 1.5, 0.92, "residential"),
            ("Campus_SportsComplex", "Campus_Canteen", SurfaceType.PAVING_STONES, True, True, 1.1, 0.95, "footway"),
            ("Campus_ECE_Block", "Campus_Hostel_Block", SurfaceType.ASPHALT, True, True, 1.7, 0.96, "residential"),
            ("Campus_Hostel_Block", "Kadapa_RIMS_Road", SurfaceType.ASPHALT, True, True, 2.0, 0.93, "secondary"),
            # Alternative unpaved / unlit rear pathway (rough slope, missing ramp)
            ("Campus_MainGate", "Campus_Auditorium", SurfaceType.UNPAVED, False, False, 4.2, 0.40, "path")
        ]
        
        for u, v, surf, lit, ramp, slope, acc_prob, rclass in edges:
            for from_node, to_node in [(u, v), (v, u)]:
                c1 = graph.nodes[from_node]
                c2 = graph.nodes[to_node]
                dist = haversine_distance_m(c1, c2)
                edge_id = f"edge_{from_node}_{to_node}"
                static = EdgeStaticFeatures(
                    edge_id=edge_id,
                    u=from_node,
                    v=to_node,
                    length_m=dist,
                    road_class=rclass,
                    surface=surf,
                    surface_status=InferenceStatus.KNOWN,
                    has_sidewalk=lit,
                    sidewalk_status=InferenceStatus.KNOWN,
                    is_crossing=False,
                    has_curb_ramp=ramp,
                    curb_ramp_status=InferenceStatus.KNOWN,
                    is_lit=lit,
                    lighting_status=InferenceStatus.KNOWN,
                    slope_pct=slope,
                    slope_status=InferenceStatus.KNOWN,
                    data_completeness=0.95 if lit else 0.65,
                    geometry_coords=[c1, c2]
                )
                infer = EdgeAccessibilityInference(
                    edge_id=edge_id,
                    wheelchair_accessible_prob=acc_prob,
                    stroller_accessible_prob=acc_prob + 0.02 if acc_prob < 0.9 else acc_prob,
                    visual_accessible_prob=acc_prob if lit else 0.35,
                    overall_accessibility_prob=acc_prob,
                    confidence=0.96 if lit else 0.72,
                    status=InferenceStatus.KNOWN if lit else InferenceStatus.INFERRED,
                    model_version="access-infer-v1.0"
                )
                graph.add_edge(from_node, to_node, static, infer)
                
        return graph

