from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
from .enums import (
    InferenceStatus,
    ConfidenceLevel,
    SurfaceType,
    CrossingType,
    MobilityProfile,
    SystemExecutionMode,
    HazardSeverity,
    IncidentCategory
)

class Coordinate(BaseModel):
    lat: float = Field(..., description="Latitude in decimal degrees (WGS84)")
    lon: float = Field(..., description="Longitude in decimal degrees (WGS84)")
    elevation_m: Optional[float] = Field(None, description="Elevation above sea level in meters")

class BoundingBox(BaseModel):
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float

class EdgeStaticFeatures(BaseModel):
    edge_id: str
    u: str
    v: str
    length_m: float
    road_class: str = "footway"  # footway, pedestrian, residential, tertiary, etc.
    surface: SurfaceType = SurfaceType.UNKNOWN
    surface_status: InferenceStatus = InferenceStatus.UNKNOWN
    has_sidewalk: bool = False
    sidewalk_status: InferenceStatus = InferenceStatus.UNKNOWN
    is_crossing: bool = False
    crossing_type: CrossingType = CrossingType.UNKNOWN
    crossing_status: InferenceStatus = InferenceStatus.UNKNOWN
    has_curb_ramp: bool = False
    curb_ramp_status: InferenceStatus = InferenceStatus.UNKNOWN
    is_lit: bool = False
    lighting_status: InferenceStatus = InferenceStatus.UNKNOWN
    slope_pct: float = 0.0
    slope_status: InferenceStatus = InferenceStatus.KNOWN
    incline_deg: float = 0.0
    width_m: Optional[float] = None
    data_completeness: float = Field(0.5, ge=0.0, le=1.0)
    geometry_coords: List[Coordinate] = Field(default_factory=list)

class EdgeAccessibilityInference(BaseModel):
    edge_id: str
    wheelchair_accessible_prob: float = Field(..., ge=0.0, le=1.0)
    stroller_accessible_prob: float = Field(..., ge=0.0, le=1.0)
    visual_accessible_prob: float = Field(..., ge=0.0, le=1.0)
    overall_accessibility_prob: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    status: InferenceStatus = InferenceStatus.INFERRED
    model_version: str = "access-infer-v1.0"
    brier_score_estimate: float = 0.08
    contributing_features: Dict[str, float] = Field(default_factory=dict)

class ContextSnapshot(BaseModel):
    timestamp: datetime
    rainfall_mm_h: float = 0.0
    temperature_c: float = 20.0
    visibility_km: float = 10.0
    ambient_lux: float = 500.0  # Daylight ~ 10,000, Twilight ~ 10-100, Night street ~ 5-20, Pitch dark < 1
    air_quality_aqi: float = 35.0
    is_dark: bool = False
    confidence: float = 0.95
    source: str = "Open-Meteo & Astronomical Calc"
    solar_elevation_deg: Optional[float] = 45.0
    road_friction_mu: Optional[float] = 0.82
    humidity_pct: Optional[float] = 55.0
    wind_speed_kmh: Optional[float] = 12.0
    crowd_density_index: Optional[float] = 0.35
    decibel_ambient_db: Optional[float] = 52.0
    uv_index: Optional[float] = 5.0
    weather_description: Optional[str] = "Clear Pedestrian Sky"

class SegmentContext(BaseModel):
    segment_id: str
    edge_id: str
    estimated_arrival_time: datetime
    cumulative_time_sec: float
    rainfall_mm_h: float
    ambient_lux: float
    active_incidents_count: int
    hazard_proximity_m: float
    context_risk_multiplier: float = 1.0

class IncidentPoint(BaseModel):
    id: str
    category: IncidentCategory
    severity: HazardSeverity
    coordinate: Coordinate
    reported_at: datetime
    radius_m: float = 50.0
    description: str
    active: bool = True
    confidence: float = 0.9

class HazardZone(BaseModel):
    id: str
    name: str
    category: IncidentCategory
    severity: HazardSeverity
    polygon_coords: List[Coordinate]
    risk_weight: float = Field(1.5, ge=1.0, le=5.0)
    active: bool = True

class UserProfile(BaseModel):
    profile_type: MobilityProfile = MobilityProfile.STANDARD
    max_slope_pct: float = Field(8.33, description="Max tolerated slope (ADA standard is 8.33% / 1:12)")
    avoid_unpaved: bool = False
    require_curb_ramps: bool = False
    require_lit_streets: bool = False
    require_signalized_crossings: bool = False
    max_step_height_cm: float = 2.0
    walking_speed_mps: float = Field(1.2, description="Walking speed in meters per second (1.2 m/s standard)")
    
    # Priority weights for Pareto candidate ranking / scalarization comparison
    safety_priority: float = Field(0.5, ge=0.0, le=1.0)
    accessibility_priority: float = Field(0.5, ge=0.0, le=1.0)
    time_priority: float = Field(0.5, ge=0.0, le=1.0)
    environment_priority: float = Field(0.3, ge=0.0, le=1.0)
    complexity_priority: float = Field(0.2, ge=0.0, le=1.0)
    
    # Robust uncertainty penalty lambda (R_robust = mean_risk + lambda * std_risk)
    uncertainty_aversion_lambda: float = Field(1.0, ge=0.0, le=5.0)

class RouteProvenanceRecord(BaseModel):
    attribute_name: str
    source: str
    status: InferenceStatus
    confidence: float
    model_version: Optional[str] = None
    timestamp: datetime
    details: Optional[str] = None

class RouteSegment(BaseModel):
    segment_index: int
    edge_id: str
    u: str
    v: str
    distance_m: float
    estimated_duration_s: float
    cumulative_distance_m: float
    cumulative_duration_s: float
    expected_arrival_time: datetime
    
    road_class: str
    surface: SurfaceType
    slope_pct: float
    is_lit: bool
    is_crossing: bool
    crossing_type: CrossingType
    
    # Accessibility inference
    accessibility_prob: float
    accessibility_status: InferenceStatus
    accessibility_confidence: float
    
    # Risk decomposition
    static_risk: float
    temporal_risk: float
    incident_risk: float
    environmental_risk: float
    total_risk_mean: float
    total_risk_std: float
    robust_risk: float
    
    # Context at arrival
    rainfall_at_arrival_mm_h: float
    lux_at_arrival: float
    
    # Provenance
    provenance: List[RouteProvenanceRecord] = Field(default_factory=list)
    coords: List[Coordinate] = Field(default_factory=list)

class RouteMetrics(BaseModel):
    total_travel_time_min: float
    total_distance_m: float
    mean_safety_risk: float
    robust_safety_risk: float
    risk_uncertainty_std: float
    worst_case_tail_risk_cvar95: float
    accessibility_burden: float
    environmental_exposure: float
    route_complexity_score: float
    overall_confidence_score: float
    accessible_segments_pct: float
    uncertain_segments_pct: float
    potential_barrier_count: int

class RouteExplanation(BaseModel):
    summary_text: str
    why_this_route: str
    what_changed: str
    key_risks: List[str]
    accessibility_notes: List[str]
    data_sources: List[str]
    confidence_statement: str
    strengths: List[str]
    limitations: List[str]

class RouteCandidate(BaseModel):
    id: str
    algorithm_tag: str  # e.g., "SafePath-BOA*", "Weighted-Sum", "Shortest-Path", "Safety-Only"
    name: str           # e.g., "Robust Balanced Safe Path", "Fastest Path", "Maximum Accessibility"
    metrics: RouteMetrics
    segments: List[RouteSegment]
    is_pareto_optimal: bool = True
    dominates_count: int = 0
    dominated_by_count: int = 0
    explanation: RouteExplanation
    geometry_geojson: Dict[str, Any]

class RouteRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    waypoints: List[Coordinate] = Field(default_factory=list)
    departure_time: Optional[datetime] = None
    profile: UserProfile = Field(default_factory=UserProfile)
    mode: SystemExecutionMode = SystemExecutionMode.DEMO
    city_tag: str = "seattle_downtown"
    algorithm: str = "ROBUST_PARETO"  # ROBUST_PARETO, BOA_STAR, WEIGHTED_SUM, SHORTEST_PATH
    include_counterfactuals: bool = False

class RouteResponse(BaseModel):
    request_id: str
    mode: SystemExecutionMode
    departure_time: datetime
    execution_time_ms: float
    candidates: List[RouteCandidate]
    selected_candidate_id: str
    pareto_frontier_count: int
    context_snapshot: ContextSnapshot

class CounterfactualMutation(BaseModel):
    rainfall_multiplier: float = Field(1.0, ge=0.0, le=10.0)
    lighting_decay_multiplier: float = Field(1.0, ge=0.0, le=1.0)
    blocked_edge_ids: List[str] = Field(default_factory=list)
    added_hazards: List[IncidentPoint] = Field(default_factory=list)
    accessibility_repair_edge_ids: List[str] = Field(default_factory=list)

class CounterfactualResult(BaseModel):
    mutation_id: str
    baseline_candidate: RouteCandidate
    counterfactual_candidate: RouteCandidate
    time_delta_min: float
    risk_delta_pct: float
    accessibility_delta_pct: float
    reroute_distance_m: float
    explanation_of_change: str

class ResilienceMetric(BaseModel):
    perturbation_name: str
    perturbation_level: float
    route_quality_degradation_pct: float
    reroute_triggered: bool
    objective_stability_score: float
    resilience_score: float = Field(..., ge=0.0, le=1.0)

class BaselineBenchmarkResult(BaseModel):
    baseline_id: str
    name: str
    travel_time_ratio: float
    distance_ratio: float
    safety_exposure: float
    accessibility_burden: float
    environmental_exposure: float
    pareto_hypervolume: float
    robustness_score: float
    latency_ms: float

class AblationResult(BaseModel):
    ablation_id: str
    variant_name: str
    hypervolume_drop_pct: float
    exposure_increase_pct: float
    barrier_encounter_rate: float
    latency_ms: float
    description: str
