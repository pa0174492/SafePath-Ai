import pytest
from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)


def test_mongodb_status_endpoint():
    response = client.get("/api/v1/datasets/mongodb/status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "engine" in data
    assert "total_records" in data
    assert data["total_records"] >= 1000
    assert "train_count" in data
    assert "test_count" in data
    assert "val_count" in data
    assert data["database"] == "safepath_ai_bigdata"
    assert data["collection"] == "training_dataset"


def test_dataset_stats_endpoint():
    response = client.get("/api/v1/datasets/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert data["total_documents"] >= 1000
    assert "splits" in data
    assert "TRAIN" in data["splits"]
    assert "TEST" in data["splits"]
    assert "VALIDATION" in data["splits"]
    assert "city_distribution" in data
    assert "lighting_coverage_pct" in data
    assert "sidewalk_coverage_pct" in data


def test_dataset_records_pagination_and_filtering():
    # Test page 1 with page_size=10
    response = client.get("/api/v1/datasets/records?page=1&page_size=10&split=TRAIN")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "records" in data
    assert len(data["records"]) <= 10
    if len(data["records"]) > 0:
        first = data["records"][0]
        assert first["split"] == "TRAIN"
        assert "record_id" in first
        assert "road_class" in first
        assert "ambient_lux" in first
        assert "coordinate" in first


def test_dataset_records_search():
    response = client.get("/api/v1/datasets/records?page=1&page_size=10&search=residential")
    assert response.status_code == 200
    data = response.json()
    assert "records" in data
    for r in data["records"]:
        assert "residential" in r["road_class"].lower() or "residential" in r["record_id"].lower() or "residential" in r["surface_quality"].lower()


def test_resplit_dataset_endpoint():
    payload = {
        "train_ratio": 0.70,
        "test_ratio": 0.15,
        "val_ratio": 0.15
    }
    response = client.post("/api/v1/datasets/resplit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "total_updated" in data


def test_model_training_with_mongodb_dataset():
    payload = {
        "model_name": "Pytest-MongoDB-Trained-Model",
        "architecture_id": "LIGHTGBM_GBDT",
        "dataset_id": "MONGODB_BIGDATA_LAKE",
        "hyperparameters": {
            "learning_rate": 0.08,
            "max_iter": 20,
            "max_depth": 4,
            "l2_regularization": 0.1
        }
    }
    response = client.post("/api/v1/models/train", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    checkpoint = data["checkpoint"]
    assert checkpoint["dataset_id"] == "MONGODB_BIGDATA_LAKE"
    assert "metrics" in checkpoint
    assert "roc_auc" in checkpoint["metrics"]
    assert checkpoint["metrics"]["roc_auc"] > 0.70
    assert checkpoint.get("used_mongodb") is True
    assert checkpoint.get("train_samples_count", 0) > 0
    assert checkpoint.get("test_samples_count", 0) > 0
