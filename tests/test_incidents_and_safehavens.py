from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_list_incidents():
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "category" in first
    assert "severity" in first
    assert "coordinate" in first

def test_filter_incidents_by_city():
    response = client.get("/api/v1/incidents?city_tag=warangal_kits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(i["city_tag"] == "warangal_kits" for i in data)

def test_create_and_upvote_incident():
    payload = {
        "title": "Test Blocked Pavement",
        "category": "BLOCKED_SIDEWALK",
        "severity": "HIGH",
        "city_tag": "warangal_kits",
        "coordinate": {"lat": 18.055, "lon": 79.536},
        "location_name": "Test Lane Gate 3",
        "description": "Tree fallen across pedestrian path",
        "is_wheelchair_blocker": True
    }
    create_res = client.post("/api/v1/incidents", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    incident_id = created["id"]
    assert created["title"] == payload["title"]
    assert created["upvotes"] == 1

    # Upvote
    upvote_res = client.post(f"/api/v1/incidents/{incident_id}/upvote")
    assert upvote_res.status_code == 200
    assert upvote_res.json()["upvotes"] == 2

def test_incident_stats():
    res = client.get("/api/v1/incidents/summary/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "total_reports" in stats
    assert "active_hazards" in stats
    assert "category_distribution" in stats

def test_list_safehavens():
    res = client.get("/api/v1/safehavens")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert any(sh["city_tag"] == "warangal_kits" for sh in data)

def test_nearest_safehavens():
    # Center around KITS Warangal
    res = client.get("/api/v1/safehavens/nearest?lat=18.0542&lon=79.5357&limit=3")
    assert res.status_code == 200
    data = res.json()
    assert "nearest_safe_havens" in data
    assert len(data["nearest_safe_havens"]) <= 3
    assert "immediate_emergency_helplines" in data
    first = data["nearest_safe_havens"][0]
    assert first["distance_m"] is not None
    assert first["distance_m"] > 0
    assert first["estimated_walking_min"] is not None

def test_sos_beacon():
    payload = {
        "user_name": "Priya Sharma",
        "coordinate": {"lat": 18.0542, "lon": 79.5357},
        "city_tag": "warangal_kits",
        "emergency_type": "PANIC_SOS",
        "battery_percentage": 65
    }
    res = client.post("/api/v1/safehavens/sos-beacon", json=payload)
    assert res.status_code == 200
    sos = res.json()
    assert "alert_id" in sos
    assert "whatsapp_share_url" in sos
    assert "nearest_shelter" in sos
    assert sos["status"] == "DISPATCHED_TO_EMERGENCY_NETWORK"
