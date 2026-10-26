from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import math

router = APIRouter(prefix="/incidents", tags=["Community Safety & Incident Reporter"])

class Coordinate(BaseModel):
    lat: float
    lon: float

class IncidentReport(BaseModel):
    id: str
    title: str
    category: str  # BROKEN_LIGHT, BLOCKED_SIDEWALK, ROAD_DAMAGE, MISSING_CURB_RAMP, WATERLOGGING, UNSAFE_CROSSING, STRAY_ANIMALS, SUSPICIOUS_ACTIVITY
    severity: str  # CRITICAL, HIGH, MODERATE, LOW
    status: str = "ACTIVE"  # ACTIVE, VERIFIED, INVESTIGATING, RESOLVED
    city_tag: str  # warangal_kits, warangal_ku, hyderabad, bengaluru, delhi
    coordinate: Coordinate
    location_name: str
    description: str
    upvotes: int = 1
    verified_by_users: int = 1
    reported_by: str = "Community Pedestrian"
    reported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_wheelchair_blocker: bool = False
    is_night_hazard: bool = False
    affected_radius_m: float = 40.0
    recommended_action: Optional[str] = None

class IncidentCreateRequest(BaseModel):
    title: str
    category: str
    severity: str = "MODERATE"
    city_tag: str = "warangal_kits"
    coordinate: Coordinate
    location_name: str
    description: str
    is_wheelchair_blocker: bool = False
    is_night_hazard: bool = False
    affected_radius_m: float = 40.0
    recommended_action: Optional[str] = None

# Realistic in-memory database of community hazard reports
INCIDENTS_DB: List[IncidentReport] = [
    # Warangal KITS Vicinity
    IncidentReport(
        id="inc-wgl-01",
        title="Unlit Broken Streetlight Corridor",
        category="BROKEN_LIGHT",
        severity="HIGH",
        status="VERIFIED",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0552, lon=79.5368),
        location_name="KITS West Campus Access Lane, Yerragattu Hill Road",
        description="Three consecutive solar streetlights are dysfunctional. Total darkness after 18:30 with blind curve visibility drop.",
        upvotes=18,
        verified_by_users=7,
        reported_by="KITS CSE Student",
        is_wheelchair_blocker=False,
        is_night_hazard=True,
        affected_radius_m=65.0,
        recommended_action="Carry handheld flashlight or reroute via North illuminated gate."
    ),
    IncidentReport(
        id="inc-wgl-02",
        title="Deep Trench & Missing Footpath Ramp",
        category="MISSING_CURB_RAMP",
        severity="CRITICAL",
        status="ACTIVE",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0545, lon=79.5362),
        location_name="Near KITS Main Gate Bus Bay, Hunter Road Jct",
        description="Drainage pipe excavation left a 30cm uncovered drop without pedestrian curb ramp. Completely impassable for wheelchairs and senior citizens.",
        upvotes=34,
        verified_by_users=12,
        reported_by="Campus Accessibility Club",
        is_wheelchair_blocker=True,
        is_night_hazard=True,
        affected_radius_m=35.0,
        recommended_action="Avoid southern footpath; cross to eastern walkway 40m prior."
    ),
    IncidentReport(
        id="inc-wgl-03",
        title="Monsoon Waterlogging & Submerged Debris",
        category="WATERLOGGING",
        severity="MODERATE",
        status="ACTIVE",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0560, lon=79.5385),
        location_name="Internal Ring Road near Mechanical Workshop",
        description="Standing rainwater 15-20cm deep across pedestrian pathway with concealed slippery mud sediment.",
        upvotes=9,
        verified_by_users=4,
        reported_by="Civil Eng Staff",
        is_wheelchair_blocker=True,
        is_night_hazard=False,
        affected_radius_m=50.0,
        recommended_action="Use high-incline paved perimeter walkway."
    ),
    IncidentReport(
        id="inc-wgl-04",
        title="Stray Dogs Aggressive Pack at Night",
        category="STRAY_ANIMALS",
        severity="HIGH",
        status="VERIFIED",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0538, lon=79.5345),
        location_name="Outer Perimeter Boundary Wall towards Hasanparthy",
        description="Pack of 6-8 territorial stray dogs active after 21:00 barking at lone pedestrians and cyclists.",
        upvotes=27,
        verified_by_users=11,
        reported_by="Hostel Student Council",
        is_wheelchair_blocker=False,
        is_night_hazard=True,
        affected_radius_m=80.0,
        recommended_action="Travel in groups or take main illuminated library avenue."
    ),

    # Kakatiya University (Warangal)
    IncidentReport(
        id="inc-ku-01",
        title="Illegal Vendor Encroachment on Pedestrian Path",
        category="BLOCKED_SIDEWALK",
        severity="MODERATE",
        status="ACTIVE",
        city_tag="warangal_ku",
        coordinate=Coordinate(lat=18.0201, lon=79.5528),
        location_name="KU 1st Gate NH-563 Crossroad",
        description="Fruit and tea stalls occupying 85% of sidewalk forcing students to walk onto high-speed vehicular traffic lane.",
        upvotes=42,
        verified_by_users=16,
        reported_by="KU Scholar",
        is_wheelchair_blocker=True,
        is_night_hazard=False,
        affected_radius_m=45.0,
        recommended_action="Cross to university perimeter walkway via pelican crossing."
    ),
    IncidentReport(
        id="inc-ku-02",
        title="Speeding Tippers & Unregulated Pedestrian Crossing",
        category="UNSAFE_CROSSING",
        severity="CRITICAL",
        status="VERIFIED",
        city_tag="warangal_ku",
        coordinate=Coordinate(lat=18.0189, lon=79.5540),
        location_name="Kakatiya University Main Junction",
        description="Zebra crossing faded away; gravel trucks traveling at 60km/h fail to yield to crossing students. Zero traffic signal synchronization.",
        upvotes=58,
        verified_by_users=23,
        reported_by="Student Union",
        is_wheelchair_blocker=True,
        is_night_hazard=True,
        affected_radius_m=70.0,
        recommended_action="Use pedestrian foot overbridge 100m north."
    ),

    # Hyderabad Cyberabad
    IncidentReport(
        id="inc-hyd-01",
        title="Broken Concrete Paver Blocks with Exposed Iron Rods",
        category="ROAD_DAMAGE",
        severity="HIGH",
        status="ACTIVE",
        city_tag="hyderabad",
        coordinate=Coordinate(lat=17.4442, lon=78.3780),
        location_name="Hitec City Cyber Towers to Mindspace Walkway",
        description="Smashed interlocking tiles and exposed rebar. Severe tripping hazard during evening commuter rush.",
        upvotes=63,
        verified_by_users=28,
        reported_by="IT Commuter",
        is_wheelchair_blocker=True,
        is_night_hazard=True,
        affected_radius_m=30.0,
        recommended_action="Follow inner skywalk connector."
    ),
    IncidentReport(
        id="inc-hyd-02",
        title="Transformer Oil Leakage on Footpath",
        category="ROAD_DAMAGE",
        severity="CRITICAL",
        status="ACTIVE",
        city_tag="hyderabad",
        coordinate=Coordinate(lat=17.4428, lon=78.3760),
        location_name="Raheja Mindspace Circle Gate 3",
        description="High-voltage electrical transformer leaking slick oil over ramp. High slip and environmental risk.",
        upvotes=39,
        verified_by_users=15,
        reported_by="Facilities Marshal",
        is_wheelchair_blocker=True,
        is_night_hazard=True,
        affected_radius_m=25.0,
        recommended_action="Reroute through Mindspace landscaped campus promenade."
    ),

    # Bengaluru Tech Corridor
    IncidentReport(
        id="inc-blr-01",
        title="Open Stormwater Drain Grating",
        category="ROAD_DAMAGE",
        severity="CRITICAL",
        status="VERIFIED",
        city_tag="bengaluru",
        coordinate=Coordinate(lat=12.9722, lon=77.5955),
        location_name="MG Road Metro Station Exit C Footpath",
        description="Cast iron stormwater drain cover missing, creating a 1.2m deep open pit right on the walking path.",
        upvotes=84,
        verified_by_users=39,
        reported_by="Civic Volunteer",
        is_wheelchair_blocker=True,
        is_night_hazard=True,
        affected_radius_m=20.0,
        recommended_action="Keep strictly to the metro concourse boundary."
    ),

    # New Delhi Central
    IncidentReport(
        id="inc-del-01",
        title="Severe Smog Low-Visibility Zone & Missing Streetlights",
        category="BROKEN_LIGHT",
        severity="HIGH",
        status="VERIFIED",
        city_tag="delhi",
        coordinate=Coordinate(lat=18.6145, lon=77.2085),
        location_name="Janpath Inner Circle Pedestrian Arcade",
        description="Combination of seasonal particulate haze and failed arcade floodlights reduces sightline under 10 meters.",
        upvotes=51,
        verified_by_users=22,
        reported_by="Urban Walker",
        is_wheelchair_blocker=False,
        is_night_hazard=True,
        affected_radius_m=90.0,
        recommended_action="Stay within illuminated shop colonnades."
    )
]

def calculate_haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@router.get("", response_model=List[IncidentReport])
@router.get("/feed", response_model=List[IncidentReport])
def list_incidents(
    city_tag: Optional[str] = Query(None, description="Filter by city tag"),
    category: Optional[str] = Query(None, description="Filter by hazard category"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, VERIFIED, RESOLVED)"),
    lat: Optional[float] = Query(None, description="Center latitude for proximity search"),
    lon: Optional[float] = Query(None, description="Center longitude for proximity search"),
    radius_m: Optional[float] = Query(5000.0, description="Max distance from center point in meters")
):
    """
    Retrieve crowdsourced pedestrian hazard reports with optional multi-attribute and geospatial proximity filtering.
    """
    results = list(INCIDENTS_DB)

    if city_tag:
        results = [inc for inc in results if inc.city_tag == city_tag]

    if category:
        results = [inc for inc in results if inc.category.upper() == category.upper()]

    if severity:
        results = [inc for inc in results if inc.severity.upper() == severity.upper()]

    if status:
        results = [inc for inc in results if inc.status.upper() == status.upper()]

    if lat is not None and lon is not None:
        def within_radius(inc: IncidentReport) -> bool:
            dist = calculate_haversine_distance_m(lat, lon, inc.coordinate.lat, inc.coordinate.lon)
            return dist <= radius_m
        results = [inc for inc in results if within_radius(inc)]

    # Sort by upvotes (community priority) descending
    results.sort(key=lambda x: (x.severity == "CRITICAL", x.upvotes), reverse=True)
    return results

@router.post("", response_model=IncidentReport, status_code=201)
@router.post("/report", response_model=IncidentReport, status_code=201)
def report_incident(payload: IncidentCreateRequest):
    """
    Submit a new crowdsourced pedestrian hazard or road barrier incident.
    """
    new_incident = IncidentReport(
        id=f"inc-user-{uuid.uuid4().hex[:8]}",
        title=payload.title,
        category=payload.category,
        severity=payload.severity,
        status="ACTIVE",
        city_tag=payload.city_tag,
        coordinate=payload.coordinate,
        location_name=payload.location_name,
        description=payload.description,
        upvotes=1,
        verified_by_users=1,
        reported_by="Community Contributor",
        is_wheelchair_blocker=payload.is_wheelchair_blocker,
        is_night_hazard=payload.is_night_hazard,
        affected_radius_m=payload.affected_radius_m,
        recommended_action=payload.recommended_action or "Exercise high caution; navigate around designated zone."
    )
    INCIDENTS_DB.insert(0, new_incident)
    return new_incident

@router.post("/{incident_id}/upvote", response_model=IncidentReport)
def upvote_incident(incident_id: str):
    """
    Upvote / confirm a reported hazard. Promotes hazard to VERIFIED status once confirmed by > 5 community peers.
    """
    for inc in INCIDENTS_DB:
        if inc.id == incident_id:
            inc.upvotes += 1
            inc.verified_by_users += 1
            if inc.verified_by_users >= 5 and inc.status == "ACTIVE":
                inc.status = "VERIFIED"
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

@router.post("/{incident_id}/resolve", response_model=IncidentReport)
def resolve_incident(incident_id: str):
    """
    Mark an incident as RESOLVED once municipal repairs or clearance is completed.
    """
    for inc in INCIDENTS_DB:
        if inc.id == incident_id:
            inc.status = "RESOLVED"
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

@router.get("/summary/stats")
@router.get("/stats")
def get_incident_summary():
    """
    Aggregated statistical breakdown of community hazard incidents.
    """
    total = len(INCIDENTS_DB)
    active = sum(1 for i in INCIDENTS_DB if i.status in ("ACTIVE", "VERIFIED"))
    critical = sum(1 for i in INCIDENTS_DB if i.severity == "CRITICAL")
    wheelchair_blockers = sum(1 for i in INCIDENTS_DB if i.is_wheelchair_blocker)
    night_hazards = sum(1 for i in INCIDENTS_DB if i.is_night_hazard)
    by_category: Dict[str, int] = {}
    for i in INCIDENTS_DB:
        by_category[i.category] = by_category.get(i.category, 0) + 1

    return {
        "total_reports": total,
        "active_hazards": active,
        "critical_severity_count": critical,
        "wheelchair_barriers": wheelchair_blockers,
        "night_low_visibility_hazards": night_hazards,
        "category_distribution": by_category,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
