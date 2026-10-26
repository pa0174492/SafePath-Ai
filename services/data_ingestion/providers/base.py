from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from packages.shared_types.models import (
    Coordinate,
    BoundingBox,
    ContextSnapshot,
    IncidentPoint,
    HazardZone,
    EdgeAccessibilityInference
)

class DataProvider(ABC):
    @abstractmethod
    def fetch_road_network(self, bbox: BoundingBox) -> Dict[str, Any]:
        """Fetch raw road and pedestrian path geometries/tags within bounding box."""
        pass

class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(self, coord: Coordinate) -> ContextSnapshot:
        """Get current weather conditions at coordinate."""
        pass

    @abstractmethod
    def get_weather_forecast(self, coord: Coordinate, target_time: datetime) -> ContextSnapshot:
        """Get forecasted weather at coordinate for specific future timestamp."""
        pass

class IncidentProvider(ABC):
    @abstractmethod
    def get_active_incidents(self, bbox: BoundingBox) -> List[IncidentPoint]:
        """Get active reported incidents within bounding box."""
        pass

    @abstractmethod
    def get_hazard_zones(self, bbox: BoundingBox) -> List[HazardZone]:
        """Get static/dynamic hazard polygons within bounding box."""
        pass

class ElevationProvider(ABC):
    @abstractmethod
    def get_elevation_m(self, coord: Coordinate) -> float:
        """Get ground elevation in meters for a coordinate."""
        pass

class AccessibilityProvider(ABC):
    @abstractmethod
    def get_accessibility_survey(self, edge_id: str) -> Optional[EdgeAccessibilityInference]:
        """Retrieve authoritative or surveyed accessibility attributes for an edge."""
        pass

class GeocodingProvider(ABC):
    @abstractmethod
    def geocode(self, query: str) -> List[Dict[str, Any]]:
        """Geocode query string to coordinates."""
        pass

    @abstractmethod
    def reverse_geocode(self, coord: Coordinate) -> str:
        """Reverse geocode coordinate to human-readable address."""
        pass
