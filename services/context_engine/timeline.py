from datetime import datetime, timedelta
from typing import List, Dict
from packages.shared_types.models import Coordinate, ContextSnapshot
from services.data_ingestion.providers.base import WeatherProvider

class RouteTimelineAnalyzer:
    """
    Constructs discrete time-slice projections along an entire trajectory.
    """
    def __init__(self, weather_provider: WeatherProvider):
        self.weather_provider = weather_provider

    def generate_timeline_snapshots(
        self,
        origin: Coordinate,
        departure_time: datetime,
        duration_minutes: float,
        step_minutes: float = 5.0
    ) -> List[ContextSnapshot]:
        snapshots = []
        curr_time = departure_time
        end_time = departure_time + timedelta(minutes=duration_minutes)
        
        while curr_time <= end_time:
            snap = self.weather_provider.get_weather_forecast(origin, curr_time)
            snapshots.append(snap)
            curr_time += timedelta(minutes=step_minutes)
            
        return snapshots
