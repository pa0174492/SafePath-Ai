import math
from typing import Tuple
from packages.shared_types.models import Coordinate

EARTH_RADIUS_M = 6371008.8  # WGS84 mean earth radius in meters

def haversine_distance_m(coord1: Coordinate, coord2: Coordinate) -> float:
    """Calculate the great-circle distance between two WGS84 coordinates in meters."""
    lat1, lon1 = math.radians(coord1.lat), math.radians(coord1.lon)
    lat2, lon2 = math.radians(coord2.lat), math.radians(coord2.lon)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return EARTH_RADIUS_M * c

def calculate_bearing_deg(coord1: Coordinate, coord2: Coordinate) -> float:
    """Calculate the initial compass bearing from coord1 to coord2 in degrees [0, 360)."""
    lat1, lon1 = math.radians(coord1.lat), math.radians(coord1.lon)
    lat2, lon2 = math.radians(coord2.lat), math.radians(coord2.lon)
    dlon = lon2 - lon1
    
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    bearing = math.atan2(y, x)
    return (math.degrees(bearing) + 360.0) % 360.0

def interpolate_coordinate(coord1: Coordinate, coord2: Coordinate, fraction: float) -> Coordinate:
    """Linearly interpolate between two coordinates in Cartesian/WGS84 approx."""
    lat = coord1.lat + fraction * (coord2.lat - coord1.lat)
    lon = coord1.lon + fraction * (coord2.lon - coord1.lon)
    elev = None
    if coord1.elevation_m is not None and coord2.elevation_m is not None:
        elev = coord1.elevation_m + fraction * (coord2.elevation_m - coord1.elevation_m)
    return Coordinate(lat=lat, lon=lon, elevation_m=elev)

def calculate_slope_pct(coord1: Coordinate, coord2: Coordinate, distance_m: float) -> float:
    """Calculate grade slope as percentage ((elevation_delta / run) * 100)."""
    if coord1.elevation_m is None or coord2.elevation_m is None or distance_m <= 0.1:
        return 0.0
    delta_elev = abs(coord2.elevation_m - coord1.elevation_m)
    return min(40.0, (delta_elev / distance_m) * 100.0)
