from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math
from packages.shared_types.models import (
    Coordinate,
    BoundingBox,
    ContextSnapshot,
    IncidentPoint,
    HazardZone,
    EdgeAccessibilityInference,
    InferenceStatus,
    HazardSeverity,
    IncidentCategory
)
from .base import (
    DataProvider,
    WeatherProvider,
    IncidentProvider,
    ElevationProvider,
    AccessibilityProvider,
    GeocodingProvider
)

class MockWeatherProvider(WeatherProvider):
    def __init__(self, base_rain_mm_h: float = 2.5, base_temp_c: float = 14.0):
        self.base_rain = base_rain_mm_h
        self.base_temp = base_temp_c

    def get_current_weather(self, coord: Coordinate) -> ContextSnapshot:
        now = datetime.now()
        hour = now.hour
        is_dark = hour < 6 or hour >= 20
        lux = 10.0 if is_dark else (50.0 if hour in [6, 19] else 5000.0)
        return ContextSnapshot(
            timestamp=now,
            rainfall_mm_h=self.base_rain,
            temperature_c=self.base_temp,
            visibility_km=8.5,
            ambient_lux=lux,
            air_quality_aqi=32.0,
            is_dark=is_dark,
            confidence=0.98,
            source="Deterministic Mock Weather / Open-Meteo Fixture"
        )

    def get_weather_forecast(self, coord: Coordinate, target_time: datetime) -> ContextSnapshot:
        hour = target_time.hour
        is_dark = hour < 6 or hour >= 20
        lux = 10.0 if is_dark else (50.0 if hour in [6, 19] else 4500.0)
        # Rain increases slightly over time to simulate a passing rain band
        rain = self.base_rain + 1.2 * math.sin(hour / 3.0)
        return ContextSnapshot(
            timestamp=target_time,
            rainfall_mm_h=max(0.0, rain),
            temperature_c=self.base_temp - 1.0,
            visibility_km=7.0,
            ambient_lux=lux,
            air_quality_aqi=30.0,
            is_dark=is_dark,
            confidence=0.92,
            source="Deterministic Mock Forecast / Open-Meteo Fixture"
        )

class MockIncidentProvider(IncidentProvider):
    def __init__(self):
        self.incidents = [
            IncidentPoint(
                id="inc-seattle-001",
                category=IncidentCategory.POOR_LIGHTING,
                severity=HazardSeverity.MEDIUM,
                coordinate=Coordinate(lat=47.6085, lon=-122.3380, elevation_m=35.0),
                reported_at=datetime.now(),
                radius_m=70.0,
                description="Streetlight array failure along Post Alley; low visibility after twilight",
                active=True,
                confidence=0.92
            ),
            IncidentPoint(
                id="inc-seattle-002",
                category=IncidentCategory.ACCESSIBILITY_BLOCKAGE,
                severity=HazardSeverity.HIGH,
                coordinate=Coordinate(lat=47.6062, lon=-122.3340, elevation_m=42.0),
                reported_at=datetime.now(),
                radius_m=40.0,
                description="Sidewalk construction barricade blocking wheelchair ramp at 4th & Marion",
                active=True,
                confidence=0.95
            ),
            IncidentPoint(
                id="inc-seattle-003",
                category=IncidentCategory.WEATHER_HAZARD,
                severity=HazardSeverity.LOW,
                coordinate=Coordinate(lat=47.6040, lon=-122.3310, elevation_m=28.0),
                reported_at=datetime.now(),
                radius_m=60.0,
                description="Slippery wet brick pavers reported by transit riders near Pioneer Square",
                active=True,
                confidence=0.88
            )
        ]

    def get_active_incidents(self, bbox: BoundingBox) -> List[IncidentPoint]:
        return self.incidents

    def get_hazard_zones(self, bbox: BoundingBox) -> List[HazardZone]:
        return [
            HazardZone(
                id="zone-001",
                name="Late Night Congestion & Dim Corridor",
                category=IncidentCategory.CRIME,
                severity=HazardSeverity.LOW,
                polygon_coords=[
                    Coordinate(lat=47.6010, lon=-122.3320),
                    Coordinate(lat=47.6030, lon=-122.3300),
                    Coordinate(lat=47.6025, lon=-122.3280),
                    Coordinate(lat=47.6005, lon=-122.3300),
                ],
                risk_weight=1.3,
                active=True
            )
        ]

class MockElevationProvider(ElevationProvider):
    def get_elevation_m(self, coord: Coordinate) -> float:
        # Seattle topography: waterfront (lon ~ -122.34) is near sea level (~5m),
        # climbing east towards 5th/6th Ave (lon ~ -122.33) up to 55m.
        lon_factor = (-122.345 - coord.lon) * 1000.0  # increases east
        lat_factor = (coord.lat - 47.600) * 500.0
        elev = 5.0 + max(0.0, abs(lon_factor) * 3.5 + lat_factor * 1.5)
        return float(elev)

class MockGeocodingProvider(GeocodingProvider):
    def __init__(self):
        self.landmarks = {
            "pike place market": Coordinate(lat=47.6097, lon=-122.3422, elevation_m=32.0),
            "pioneer square": Coordinate(lat=47.6015, lon=-122.3333, elevation_m=12.0),
            "seattle art museum": Coordinate(lat=47.6074, lon=-122.3381, elevation_m=38.0),
            "seattle central library": Coordinate(lat=47.6067, lon=-122.3326, elevation_m=52.0),
            "westlake center": Coordinate(lat=47.6114, lon=-122.3370, elevation_m=45.0),
            "king street station": Coordinate(lat=47.5985, lon=-122.3300, elevation_m=8.0)
        }

    def geocode(self, query: str) -> List[Dict[str, Any]]:
        q = query.lower().strip()
        for name, coord in self.landmarks.items():
            if q in name or name in q:
                return [{"name": name.title(), "coordinate": coord.dict()}]
        return [{"name": "Downtown Seattle Origin", "coordinate": Coordinate(lat=47.6097, lon=-122.3422, elevation_m=32.0).dict()}]

    def reverse_geocode(self, coord: Coordinate) -> str:
        return f"{coord.lat:.4f}, {coord.lon:.4f} (Downtown Seattle)"
