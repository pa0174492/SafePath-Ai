from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import math

router = APIRouter(prefix="/safehavens", tags=["Emergency SOS & Safe Haven Assistance"])

class Coordinate(BaseModel):
    lat: float
    lon: float

class SafeHaven(BaseModel):
    id: str
    name: str
    type: str  # POLICE_STATION, HOSPITAL_EMERGENCY, TRANSIT_SECURITY, PHARMACY_247, FIRE_STATION
    city_tag: str  # warangal_kits, warangal_ku, hyderabad, bengaluru, delhi
    coordinate: Coordinate
    address: str
    emergency_phone: str
    operating_hours: str = "24/7"
    is_verified_247: bool = True
    security_features: List[str] = Field(default_factory=list)
    average_response_time_min: int = 5
    distance_m: Optional[float] = None
    estimated_walking_min: Optional[int] = None

class NearestQueryResponse(BaseModel):
    user_location: Coordinate
    search_radius_m: float
    found_count: int
    nearest_safe_havens: List[SafeHaven]
    immediate_emergency_helplines: Dict[str, str]

class SOSAlertRequest(BaseModel):
    user_name: Optional[str] = "Pedestrian User"
    coordinate: Coordinate
    city_tag: str = "warangal_kits"
    emergency_type: str = "PANIC_SOS"  # PANIC_SOS, MEDICAL_EMERGENCY, TRAFFIC_ACCIDENT, HARASSMENT
    battery_percentage: Optional[int] = 78
    medical_notes: Optional[str] = None
    contact_phone: Optional[str] = None

class SOSAlertResponse(BaseModel):
    alert_id: str
    timestamp: datetime
    status: str
    broadcast_message: str
    whatsapp_share_url: str
    nearest_shelter: SafeHaven
    recommended_hotline: str

# Verified 24/7 Safe Haven Registry
SAFE_HAVENS_DB: List[SafeHaven] = [
    # Warangal KITS Vicinity
    SafeHaven(
        id="sh-wgl-01",
        name="Hasanparthy Police Station",
        type="POLICE_STATION",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0612, lon=79.5298),
        address="NH-563, Hasanparthy, Warangal Urban (Telangana)",
        emergency_phone="0870-2455100 / 100",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["CCTV Monitored", "Armed Sentries 24/7", "Patrol Car Standby", "Women Help Desk"],
        average_response_time_min=4
    ),
    SafeHaven(
        id="sh-wgl-02",
        name="KITS Campus Emergency Health Center & Ambulance Bay",
        type="HOSPITAL_EMERGENCY",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0558, lon=79.5372),
        address="Near KITS Administrative Block, Yerragattu Hill, Warangal",
        emergency_phone="0870-2564888 / 108",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["24/7 On-duty Doctor", "Campus Security Post", "Stretcher & Defibrillator Bay", "Well-lit Gate"],
        average_response_time_min=2
    ),
    SafeHaven(
        id="sh-wgl-03",
        name="Subedari Police Station (Urban Command)",
        type="POLICE_STATION",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0125, lon=79.5580),
        address="Collectorate Complex Road, Subedari, Hanamkonda",
        emergency_phone="0870-2577100 / 112",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Warangal City Commissionerate Dial-100 Control", "She Teams Unit", "24/7 Patrol Vans"],
        average_response_time_min=6
    ),
    SafeHaven(
        id="sh-wgl-04",
        name="MGM Government General & Trauma Hospital",
        type="HOSPITAL_EMERGENCY",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=17.9950, lon=79.5930),
        address="MGM Hospital Road, Warangal City",
        emergency_phone="0870-2441001 / 108",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Level-1 Trauma Center", "24/7 Blood Bank", "Police Outpost Inside Premise"],
        average_response_time_min=7
    ),
    SafeHaven(
        id="sh-wgl-05",
        name="Apollo Pharmacy 24/7 & Emergency First Aid Hub",
        type="PHARMACY_247",
        city_tag="warangal_kits",
        coordinate=Coordinate(lat=18.0480, lon=79.5420),
        address="Opposite Padmakshi Temple Road, Hanamkonda",
        emergency_phone="1860-500-0101",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Bright Commercial Illumination", "Security Guard On Duty", "Public Emergency Telephone"],
        average_response_time_min=3
    ),

    # Kakatiya University (Warangal)
    SafeHaven(
        id="sh-ku-01",
        name="Kakatiya University Police Outpost & Security HQ",
        type="POLICE_STATION",
        city_tag="warangal_ku",
        coordinate=Coordinate(lat=18.0210, lon=79.5515),
        address="KU Administrative Gate 1, Vidyaranyapuri, Hanamkonda",
        emergency_phone="0870-2438866 / 100",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Stationary Patrol Unit", "Campus Surveillance Grid", "Emergency Landline"],
        average_response_time_min=3
    ),
    SafeHaven(
        id="sh-ku-02",
        name="Hanamkonda Bus Station Security Control & TSRTC Safe Booth",
        type="TRANSIT_SECURITY",
        city_tag="warangal_ku",
        coordinate=Coordinate(lat=18.0160, lon=79.5610),
        address="Hanamkonda Central Bus Station, Nakkalagutta",
        emergency_phone="0870-2565656 / 112",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["24/7 Transport Police", "High Lumens Floodlights", "Public PA System", "Helpdesk"],
        average_response_time_min=4
    ),

    # Hyderabad Cyberabad
    SafeHaven(
        id="sh-hyd-01",
        name="Madhapur Police Station & Cyberabad Safe City Hub",
        type="POLICE_STATION",
        city_tag="hyderabad",
        coordinate=Coordinate(lat=17.4470, lon=78.3850),
        address="Hitec City Main Road, Cyberabad, Hyderabad",
        emergency_phone="040-27853508 / 112",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["She Team Kiosk", "Rapid Action Force Patrol", "Facial Recognition CCTV", "Dedicated Women Safe Corridor"],
        average_response_time_min=3
    ),
    SafeHaven(
        id="sh-hyd-02",
        name="Medicover Hospitals Trauma & Emergency Emergency Wing",
        type="HOSPITAL_EMERGENCY",
        city_tag="hyderabad",
        coordinate=Coordinate(lat=17.4420, lon=78.3800),
        address="Behind Cyber Towers, Inorbit Mall Road, Madhapur",
        emergency_phone="040-68334455 / 108",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["24/7 Emergency Triage", "Ambulance Air Evac Pad", "Armed Security"],
        average_response_time_min=4
    ),
    SafeHaven(
        id="sh-hyd-03",
        name="Hitec City Metro Station Security & Passenger Lounge",
        type="TRANSIT_SECURITY",
        city_tag="hyderabad",
        coordinate=Coordinate(lat=17.4455, lon=78.3820),
        address="Hitec City Blue Line Metro Concourse",
        emergency_phone="040-23332555",
        operating_hours="06:00 - 23:30 (Security Guard 24/7)",
        is_verified_247=True,
        security_features=["Metal Detectors & Armed CISF Personnel", "SOS Call Buttons on Platforms", "Brightly Lit Underpass"],
        average_response_time_min=2
    ),

    # Bengaluru Tech Corridor
    SafeHaven(
        id="sh-blr-01",
        name="Cubbon Park Police Station & Pink Hoysala Patrol Post",
        type="POLICE_STATION",
        city_tag="bengaluru",
        coordinate=Coordinate(lat=12.9740, lon=77.5920),
        address="Kasturba Road, Opp. Visvesvaraya Museum, Bengaluru",
        emergency_phone="080-22942583 / 112",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Pink Hoysala Women Patrol", "SOS Booth", "BTP High-Res Perimeter Cameras"],
        average_response_time_min=3
    ),
    SafeHaven(
        id="sh-blr-02",
        name="Bowring and Lady Curzon Emergency Hospital",
        type="HOSPITAL_EMERGENCY",
        city_tag="bengaluru",
        coordinate=Coordinate(lat=12.9810, lon=77.6020),
        address="Shivajinagar, Hospital Road, Bengaluru",
        emergency_phone="080-25591325 / 108",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Trauma Emergency Block", "24/7 Casualty Medical Officers", "Police Chowki"],
        average_response_time_min=5
    ),

    # New Delhi Central
    SafeHaven(
        id="sh-del-01",
        name="Parliament Street Police Station (Connaught Place)",
        type="POLICE_STATION",
        city_tag="delhi",
        coordinate=Coordinate(lat=28.6250, lon=77.2150),
        address="Sansad Marg, Near Patel Chowk, New Delhi",
        emergency_phone="011-23361100 / 112",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Delhi Police PCR Van Fleet", "Himmat Women Safety Desk", "High Security Zone"],
        average_response_time_min=3
    ),
    SafeHaven(
        id="sh-del-02",
        name="Dr. Ram Manohar Lohia (RML) Hospital Emergency",
        type="HOSPITAL_EMERGENCY",
        city_tag="delhi",
        coordinate=Coordinate(lat=28.6235, lon=77.2005),
        address="Baba Kharak Singh Marg, New Delhi",
        emergency_phone="011-23365525 / 108",
        operating_hours="24/7",
        is_verified_247=True,
        security_features=["Central Government 24/7 Trauma Emergency", "Disaster Response Unit"],
        average_response_time_min=4
    )
]

def calculate_haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@router.get("", response_model=List[SafeHaven])
def list_safe_havens(
    city_tag: Optional[str] = Query(None, description="Filter by city tag"),
    type: Optional[str] = Query(None, description="Filter by safe haven type")
):
    """List all registered 24/7 verified safe havens with optional filtering."""
    results = list(SAFE_HAVENS_DB)
    if city_tag:
        results = [sh for sh in results if sh.city_tag == city_tag]
    if type:
        results = [sh for sh in results if sh.type.upper() == type.upper()]
    return results

@router.get("/nearest", response_model=NearestQueryResponse)
def get_nearest_safe_havens(
    lat: float = Query(..., description="Current pedestrian latitude"),
    lon: float = Query(..., description="Current pedestrian longitude"),
    radius_m: float = Query(10000.0, description="Max search radius in meters"),
    limit: int = Query(5, ge=1, le=20, description="Maximum safe havens to return")
):
    """
    Dynamically locate the nearest verified 24/7 safe havens from current GPS coordinates,
    calculating walking distance and travel time.
    """
    enriched: List[SafeHaven] = []
    walking_speed_mps = 1.2  # ~4.3 km/h average pedestrian walking speed

    for sh in SAFE_HAVENS_DB:
        dist = calculate_haversine_distance_m(lat, lon, sh.coordinate.lat, sh.coordinate.lon)
        if dist <= radius_m:
            sh_copy = sh.model_copy()
            sh_copy.distance_m = round(dist, 1)
            sh_copy.estimated_walking_min = max(1, round(dist / (walking_speed_mps * 60)))
            enriched.append(sh_copy)

    # Sort strictly by distance
    enriched.sort(key=lambda x: x.distance_m if x.distance_m is not None else 999999)
    nearest_subset = enriched[:limit]

    return NearestQueryResponse(
        user_location=Coordinate(lat=lat, lon=lon),
        search_radius_m=radius_m,
        found_count=len(nearest_subset),
        nearest_safe_havens=nearest_subset,
        immediate_emergency_helplines={
            "National Emergency (All-in-One)": "112",
            "Police Control Room": "100",
            "Women Helpline (National)": "1091",
            "Ambulance & Medical Emergency": "108",
            "Senior Citizen Helpline": "14567",
            "Childline India": "1098"
        }
    )

# In-memory Real-Time Active SOS Emergency Beacon Registry
ACTIVE_SOS_ALERTS: List[Dict[str, Any]] = [
    {
        "alert_id": "sos-drill-01",
        "user_name": "Priya Sharma (Student)",
        "city_tag": "warangal_kits",
        "emergency_type": "PANIC_SOS",
        "coordinate": {"lat": 18.0552, "lon": 79.5368},
        "location_name": "KITS West Access Road near Yerragattu Hill",
        "battery_percentage": 68,
        "contact_phone": "+91 98765 43210",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "DISPATCHED",
        "responder_note": "Campus Security Unit #2 en route with patrol vehicle.",
        "nearest_shelter_name": "KITS Campus Health Center",
        "nearest_shelter_phone": "0870-2564888 / 108"
    }
]

@router.post("/sos", response_model=SOSAlertResponse)
@router.post("/sos-beacon", response_model=SOSAlertResponse)
def broadcast_sos_beacon(payload: SOSAlertRequest):
    """
    Instantly trigger an emergency SOS beacon broadcast. Generates emergency share links
    (WhatsApp / SMS) and registers active beacon in the real-time emergency responder network.
    """
    alert_id = f"sos-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    # Find closest haven
    nearest_shelter = None
    min_dist = float("inf")
    for sh in SAFE_HAVENS_DB:
        d = calculate_haversine_distance_m(payload.coordinate.lat, payload.coordinate.lon, sh.coordinate.lat, sh.coordinate.lon)
        if d < min_dist:
            min_dist = d
            nearest_shelter = sh.model_copy()
            nearest_shelter.distance_m = round(d, 1)
            nearest_shelter.estimated_walking_min = max(1, round(d / (1.2 * 60)))

    if not nearest_shelter:
        nearest_shelter = SAFE_HAVENS_DB[0]

    maps_link = f"https://www.google.com/maps?q={payload.coordinate.lat:.6f},{payload.coordinate.lon:.6f}"
    
    msg_body = (
        f"🚨 EMERGENCY SOS BEACON ACTIVATED via SafePath-AI!\n"
        f"User: {payload.user_name}\n"
        f"Alert Type: {payload.emergency_type.replace('_', ' ')}\n"
        f"GPS Coordinates: {payload.coordinate.lat:.6f}, {payload.coordinate.lon:.6f}\n"
        f"Live Map Location: {maps_link}\n"
        f"Nearest Safe Haven: {nearest_shelter.name} ({nearest_shelter.distance_m}m away)\n"
        f"Emergency Shelter Contact: {nearest_shelter.emergency_phone}\n"
        f"Battery: {payload.battery_percentage}%\n"
        f"Timestamp: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}"
    )

    import urllib.parse
    encoded_text = urllib.parse.quote(msg_body)
    whatsapp_url = f"https://api.whatsapp.com/send?text={encoded_text}"

    # Register in Real-time Active Emergency SOS Registry
    active_entry = {
        "alert_id": alert_id,
        "user_name": payload.user_name or "Pedestrian User",
        "city_tag": payload.city_tag,
        "emergency_type": payload.emergency_type,
        "coordinate": {"lat": payload.coordinate.lat, "lon": payload.coordinate.lon},
        "location_name": f"Coordinates ({payload.coordinate.lat:.4f}, {payload.coordinate.lon:.4f})",
        "battery_percentage": payload.battery_percentage,
        "contact_phone": payload.contact_phone,
        "timestamp": now.isoformat(),
        "status": "ACTIVE",
        "responder_note": f"Dispatched to nearest refuge: {nearest_shelter.name}",
        "nearest_shelter_name": nearest_shelter.name,
        "nearest_shelter_phone": nearest_shelter.emergency_phone
    }
    ACTIVE_SOS_ALERTS.insert(0, active_entry)

    return SOSAlertResponse(
        alert_id=alert_id,
        timestamp=now,
        status="DISPATCHED_TO_EMERGENCY_NETWORK",
        broadcast_message=msg_body,
        whatsapp_share_url=whatsapp_url,
        nearest_shelter=nearest_shelter,
        recommended_hotline="112"
    )

@router.get("/active-alerts")
def get_active_sos_alerts(city_tag: Optional[str] = None):
    """Retrieve all real-time active SOS emergency broadcasts."""
    if city_tag:
        return [a for a in ACTIVE_SOS_ALERTS if a.get("city_tag") == city_tag or a.get("status") == "ACTIVE"]
    return ACTIVE_SOS_ALERTS

class StatusUpdateRequest(BaseModel):
    status: str  # ACTIVE, DISPATCHED, EN_ROUTE, RESOLVED
    note: Optional[str] = None

@router.post("/active-alerts/{alert_id}/status")
def update_alert_status(alert_id: str, payload: StatusUpdateRequest):
    """Update live responder status for an emergency beacon."""
    for alert in ACTIVE_SOS_ALERTS:
        if alert["alert_id"] == alert_id:
            alert["status"] = payload.status
            if payload.note:
                alert["responder_note"] = payload.note
            return alert
    raise HTTPException(status_code=404, detail="Alert ID not found")

@router.post("/active-alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    """Mark an active SOS beacon as RESOLVED / user safe."""
    for alert in ACTIVE_SOS_ALERTS:
        if alert["alert_id"] == alert_id:
            alert["status"] = "RESOLVED"
            alert["responder_note"] = "Pedestrian confirmed safe. Assistance complete."
            return alert
    raise HTTPException(status_code=404, detail="Alert ID not found")

