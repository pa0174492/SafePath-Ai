import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from services.ml_engine.training_service import training_service

client = TestClient(app)

def test_list_architectures():
    response = client.get("/api/v1/models/architectures")
    assert response.status_code == 200
    data = response.json()
    assert "architectures" in data
    assert len(data["architectures"]) >= 4
    arch_ids = [a["id"] for a in data["architectures"]]
    assert "LIGHTGBM_GBDT" in arch_ids
    assert "ST_GCN_GNN" in arch_ids
    assert "BAYESIAN_RISK_NET" in arch_ids

def test_list_datasets():
    response = client.get("/api/v1/models/datasets")
    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 4

def test_model_registry_and_active():
    response = client.get("/api/v1/models/registry")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) >= 1
    assert data["active_model_id"] is not None

def test_interactive_inference_predict():
    payload = {
        "road_class_code": 1,
        "is_lit": False,
        "ambient_lux": 2.5,
        "slope_pct": 5.0,
        "surface_quality": 1,
        "has_sidewalk": False,
        "has_curb_ramp": False,
        "rainfall_mm_h": 8.0,
        "incident_density": 2,
        "hour_of_day": 22,
        "crowd_density": 0.1
    }
    response = client.post("/api/v1/models/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "safety_risk_score" in res
    assert res["safety_risk_score"] > 0.4  # High risk due to unlit night + incidents + no sidewalk
    assert "feature_attributions" in res
    assert len(res["feature_attributions"]) > 0
    assert "counterfactual_recommendations" in res
    assert len(res["counterfactual_recommendations"]) > 0

def test_model_training_endpoint():
    payload = {
        "model_name": "Test-LightGBM-Run",
        "architecture_id": "LIGHTGBM_GBDT",
        "dataset_id": "OSM_INDIA_PEDESTRIAN_2024",
        "hyperparameters": {
            "learning_rate": 0.1,
            "max_iter": 15,
            "max_depth": 4,
            "l2_regularization": 0.1
        },
        "auto_activate": True
    }
    response = client.post("/api/v1/models/train", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "SUCCESS"
    assert "checkpoint" in res
    checkpoint = res["checkpoint"]
    assert checkpoint["metrics"]["roc_auc"] > 0.70
    assert len(checkpoint["epochs_history"]) > 0

    # Verify model is now active
    active_res = client.get("/api/v1/models/registry/active")
    assert active_res.status_code == 200
    assert active_res.json()["model_id"] == checkpoint["model_id"]

def test_drift_and_dataset_generate():
    drift_res = client.get("/api/v1/models/drift")
    assert drift_res.status_code == 200
    assert "overall_psi" in drift_res.json()

    gen_payload = {
        "name": "Test Synthetic Survey",
        "sample_count": 800,
        "hazard_bias": 0.30,
        "city_tag": "warangal_kits"
    }
    gen_res = client.post("/api/v1/models/datasets/generate", json=gen_payload)
    assert gen_res.status_code == 200
    assert gen_res.json()["sample_count"] == 800

def test_surface_vision_model_info():
    response = client.get("/api/v1/models/surface-vision/info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_id"] == "projectsidewalk/sidewalk-tagger-ai-surfaceproblem"
    assert "dinov2" in data["architecture"].lower()
    assert len(data["classes"]) == 13
    assert "brick/cobblestone" in data["classes"]
    assert "cracks" in data["classes"]
    assert "very broken" in data["classes"]

def test_surface_vision_classify():
    # 1x1 test png pixel
    test_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    response = client.post("/api/v1/models/surface-vision/classify", json={"image_base64": test_b64})
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "projectsidewalk/sidewalk-tagger-ai-surfaceproblem"
    assert "all_probabilities" in data
    assert len(data["all_probabilities"]) >= 12
    assert "predicted_tags" in data

def test_surface_vision_evaluate_edge():
    payload = {
        "surface_type": "asphalt",
        "road_class": "secondary",
        "slope_pct": 3.5,
        "rainfall_mm_h": 4.0,
        "incident_density": 1
    }
    response = client.post("/api/v1/models/surface-vision/evaluate-edge", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "surface_defect_tags" in data
    assert "pedestrian_burden_penalty" in data
    assert "vehicle_safety_penalty" in data
    assert "suggested_speed_reduction_pct" in data

def test_vehicle_routing_endpoint():
    payload = {
        "origin": {"lat": 18.0541786, "lon": 79.5357460},
        "destination": {"lat": 18.0565, "lon": 79.5378},
        "transit_mode": "TWO_WHEELER",
        "profile": {
            "profile_type": "TWO_WHEELER",
            "safety_priority": 0.8,
            "accessibility_priority": 0.5
        }
    }
    response = client.post("/api/v1/route", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "candidates" in data
    assert len(data["candidates"]) >= 1
    cand = data["candidates"][0]
    assert "vehicle_safety_score" in cand["metrics"]
    assert cand["metrics"]["vehicle_safety_score"] >= 70
    assert len(cand["segments"]) > 0
    seg0 = cand["segments"][0]
    assert seg0["vehicle_speed_kmh"] is not None
    assert seg0["traffic_level"] is not None

