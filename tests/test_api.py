from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["system"] == "SafePath-AI Framework"

def test_api_route_demo():
    res = client.post("/api/v1/route/demo")
    assert res.status_code == 200
    data = res.json()
    assert "candidates" in data
    assert len(data["candidates"]) >= 1

def test_api_research_baselines():
    res = client.get("/api/v1/research/baselines")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 7

def test_api_research_ablations():
    res = client.get("/api/v1/research/ablations")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
