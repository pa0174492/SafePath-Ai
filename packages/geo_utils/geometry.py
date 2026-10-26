from typing import List, Dict, Any, Tuple
from packages.shared_types.models import Coordinate, BoundingBox

def point_to_segment_distance_m(point: Coordinate, seg_start: Coordinate, seg_end: Coordinate) -> float:
    """Approximate distance from a point to a line segment in meters."""
    from .geodesy import haversine_distance_m
    # Segment length
    l2 = (seg_end.lat - seg_start.lat)**2 + (seg_end.lon - seg_start.lon)**2
    if l2 == 0:
        return haversine_distance_m(point, seg_start)
    
    # Projection fraction
    t = ((point.lat - seg_start.lat) * (seg_end.lat - seg_start.lat) +
         (point.lon - seg_start.lon) * (seg_end.lon - seg_start.lon)) / l2
    t = max(0.0, min(1.0, t))
    
    proj_lat = seg_start.lat + t * (seg_end.lat - seg_start.lat)
    proj_lon = seg_start.lon + t * (seg_end.lon - seg_start.lon)
    proj_point = Coordinate(lat=proj_lat, lon=proj_lon)
    
    return haversine_distance_m(point, proj_point)

def coords_to_geojson_linestring(coords: List[Coordinate]) -> Dict[str, Any]:
    """Convert a list of Coordinates to a GeoJSON LineString dictionary."""
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[c.lon, c.lat] for c in coords]
        },
        "properties": {}
    }

def coords_to_geojson_feature_collection(features: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Wrap a list of GeoJSON features in a FeatureCollection."""
    return {
        "type": "FeatureCollection",
        "features": features
    }
