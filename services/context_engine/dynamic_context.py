from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import math
from packages.shared_types.models import (
    Coordinate,
    ContextSnapshot,
    SegmentContext,
    IncidentPoint,
    HazardZone
)
from packages.geo_utils.geodesy import haversine_distance_m
from services.data_ingestion.providers.base import WeatherProvider, IncidentProvider

class ContextFusionEngine:
    """
    Evaluates dynamic environmental context at the exact projected arrival time
    of each individual road segment along a pedestrian journey.
    """
    def __init__(self, weather_provider: WeatherProvider, incident_provider: IncidentProvider):
        self.weather_provider = weather_provider
        self.incident_provider = incident_provider
        
    def calculate_arrival_time(self, departure_time: datetime, cumulative_seconds: float) -> datetime:
        return departure_time + timedelta(seconds=cumulative_seconds)

    def get_segment_context(
        self,
        segment_id: str,
        edge_id: str,
        coord: Coordinate,
        departure_time: datetime,
        cumulative_seconds: float,
        incidents: Optional[List[IncidentPoint]] = None
    ) -> SegmentContext:
        arr_time = self.calculate_arrival_time(departure_time, cumulative_seconds)
        snapshot = self.weather_provider.get_weather_forecast(coord, arr_time)
        
        # Calculate active incident count and minimum proximity
        active_inc = 0
        min_dist = float('inf')
        
        target_incidents = incidents if incidents is not None else []
        for inc in target_incidents:
            if not inc.active:
                continue
            d = haversine_distance_m(coord, inc.coordinate)
            if d < min_dist:
                min_dist = d
            if d <= inc.radius_m:
                active_inc += 1
                
        # Calculate dynamic risk multiplier from context
        multiplier = 1.0
        if snapshot.rainfall_mm_h > 2.0:
            multiplier += min(0.4, snapshot.rainfall_mm_h * 0.05)
        if snapshot.is_dark or snapshot.ambient_lux < 20.0:
            multiplier += 0.35
        if active_inc > 0:
            multiplier += 0.5 * active_inc
            
        return SegmentContext(
            segment_id=segment_id,
            edge_id=edge_id,
            estimated_arrival_time=arr_time,
            cumulative_time_sec=cumulative_seconds,
            rainfall_mm_h=snapshot.rainfall_mm_h,
            ambient_lux=snapshot.ambient_lux,
            active_incidents_count=active_inc,
            hazard_proximity_m=min_dist if min_dist != float('inf') else 999.0,
            context_risk_multiplier=multiplier
        )
