import math
import pytest
from packages.shared_types.models import Coordinate
from packages.geo_utils.geodesy import (
    haversine_distance_m,
    calculate_bearing_deg,
    interpolate_coordinate,
    calculate_slope_pct
)

def test_haversine_distance():
    p1 = Coordinate(lat=47.6097, lon=-122.3422)  # Pike Place Market
    p2 = Coordinate(lat=47.6015, lon=-122.3333)  # Pioneer Square
    dist = haversine_distance_m(p1, p2)
    assert 1000.0 < dist < 1600.0  # Approx ~1.1km

def test_calculate_slope_pct():
    c1 = Coordinate(lat=47.60, lon=-122.33, elevation_m=10.0)
    c2 = Coordinate(lat=47.601, lon=-122.33, elevation_m=20.0)
    dist = haversine_distance_m(c1, c2)
    slope = calculate_slope_pct(c1, c2, dist)
    assert slope > 0.0
    assert slope == pytest.approx((10.0 / dist) * 100.0, 0.01)

def test_interpolation():
    c1 = Coordinate(lat=40.0, lon=-74.0, elevation_m=10.0)
    c2 = Coordinate(lat=42.0, lon=-72.0, elevation_m=30.0)
    mid = interpolate_coordinate(c1, c2, 0.5)
    assert mid.lat == pytest.approx(41.0)
    assert mid.lon == pytest.approx(-73.0)
    assert mid.elevation_m == pytest.approx(20.0)
