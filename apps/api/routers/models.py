from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

from services.ml_engine.training_service import training_service

router = APIRouter(prefix="/models", tags=["AI Model Training & Management Studio"])


class HyperparametersPayload(BaseModel):
    learning_rate: float = Field(default=0.08, ge=0.001, le=1.0)
    max_iter: int = Field(default=60, ge=10, le=200)
    max_depth: int = Field(default=6, ge=2, le=16)
    l2_regularization: float = Field(default=0.1, ge=0.0, le=10.0)
    calibration_method: Optional[str] = "PLATT_ISOTONIC"


class ModelTrainRequest(BaseModel):
    model_name: Optional[str] = "LightGBM-Custom-Run"
    architecture_id: str = "LIGHTGBM_GBDT"
    dataset_id: str = "OSM_INDIA_PEDESTRIAN_2024"
    hyperparameters: HyperparametersPayload = Field(default_factory=HyperparametersPayload)
    auto_activate: bool = False


class InferencePredictRequest(BaseModel):
    road_class_code: int = Field(default=1, ge=0, le=4, description="0: footway, 1: residential, 2: tertiary, 3: secondary, 4: primary")
    is_lit: bool = Field(default=True, description="Whether street lighting is active")
    ambient_lux: float = Field(default=45.0, ge=0.1, le=2000.0, description="Photometric illuminance in lux")
    slope_pct: float = Field(default=3.2, ge=-25.0, le=35.0, description="Sidewalk incline percentage")
    surface_quality: int = Field(default=2, ge=0, le=3, description="0: unpaved/potholes, 1: gravel, 2: asphalt, 3: paved tactile")
    has_sidewalk: bool = Field(default=True, description="Dedicated pedestrian sidewalk present")
    has_curb_ramp: bool = Field(default=True, description="Wheelchair curb ramp present")
    rainfall_mm_h: float = Field(default=0.0, ge=0.0, le=80.0, description="Rainfall precipitation rate")
    incident_density: int = Field(default=0, ge=0, le=15, description="Active incidents reported in 250m vicinity")
    hour_of_day: int = Field(default=21, ge=0, le=23, description="Local hour of day (0-23)")
    crowd_density: float = Field(default=0.45, ge=0.0, le=1.0, description="Normalized pedestrian crowd density")


class SyntheticDatasetGenerateRequest(BaseModel):
    name: str = "Custom Field Telemetry"
    sample_count: int = Field(default=4000, ge=500, le=25000)
    hazard_bias: float = Field(default=0.28, ge=0.05, le=0.80)
    city_tag: str = "warangal_kits"


@router.get("/architectures")
def list_architectures():
    """Returns supported open-source reference AI model architectures (LightGBM, ST-GCN, Bayesian Net, Random Forest)."""
    return {
        "architectures": training_service.get_architectures(),
        "total": len(training_service.get_architectures())
    }


@router.get("/datasets")
def list_datasets():
    """Returns available training datasets (OSM India, MoRTH IRAD, Project Sidewalk, Dynamic Telemetry)."""
    return {
        "datasets": training_service.get_datasets(),
        "total": len(training_service.get_datasets())
    }


@router.get("/registry")
def list_model_registry():
    """Lists all trained model checkpoints in the registry with their ROC-AUC, Brier score, latency, and active status."""
    registry = training_service.get_registry()
    active_model = training_service.get_active_model_info()
    return {
        "active_model_id": active_model.get("model_id"),
        "total_models": len(registry),
        "models": registry
    }


@router.get("/registry/active")
def get_active_model():
    """Returns the currently active model checkpoint powering live navigation risk scoring."""
    active_model = training_service.get_active_model_info()
    if not active_model:
        raise HTTPException(status_code=404, detail="No active model found in registry.")
    return active_model


@router.post("/registry/{model_id}/activate")
def activate_model_checkpoint(model_id: str):
    """
    Activates a specific model from the registry for production live routing.
    Subsequent route queries will compute edge risks through this model.
    """
    try:
        result = training_service.activate_model(model_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/train")
def train_model(payload: ModelTrainRequest):
    """
    Trains a new safety risk & accessibility model on pedestrian survey data,
    computes full convergence metrics (loss curves, ROC-AUC, calibration error),
    and registers the checkpoint.
    """
    try:
        config = {
            "model_name": payload.model_name,
            "architecture_id": payload.architecture_id,
            "dataset_id": payload.dataset_id,
            "hyperparameters": payload.hyperparameters.model_dump(),
            "auto_activate": payload.auto_activate
        }
        checkpoint = training_service.train_model(config)
        return {
            "status": "SUCCESS",
            "message": f"Successfully trained '{checkpoint['name']}' with ROC-AUC {checkpoint['metrics']['roc_auc']}",
            "checkpoint": checkpoint
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/predict")
def predict_inference(payload: InferencePredictRequest):
    """
    AI Inference Playground: Evaluates sample road & pedestrian segment attributes in real-time,
    returning calibrated risk score, uncertainty interval, SHAP feature attributions, and AI suggestions.
    """
    try:
        features = payload.model_dump()
        result = training_service.predict_sample(features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@router.get("/drift")
def check_model_drift():
    """
    Calculates Population Stability Index (PSI) and distribution drift between
    baseline training dataset and live incoming user hazard reports.
    """
    return training_service.compute_data_drift()


@router.post("/datasets/generate")
def generate_synthetic_dataset(payload: SyntheticDatasetGenerateRequest):
    """Generates a custom synthetic telemetry training dataset for experimental fine-tuning."""
    df = training_service._generate_synthetic_dataframe(
        n_samples=payload.sample_count,
        hazard_bias=payload.hazard_bias
    )
    return {
        "status": "SUCCESS",
        "dataset_name": payload.name,
        "sample_count": len(df),
        "features": list(df.columns),
        "hazard_rate": round(float(df["is_hazardous"].mean()), 3),
        "city_focus": payload.city_tag,
        "preview": df.head(5).to_dict(orient="records")
    }


class ImageClassifyRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded JPEG or PNG image crop")


class EdgeSurfaceEvaluateRequest(BaseModel):
    surface_type: str = "asphalt"
    road_class: str = "footway"
    slope_pct: float = 2.0
    rainfall_mm_h: float = 0.0
    incident_density: int = 0


@router.get("/surface-vision/info")
def get_surface_vision_model_info():
    """
    Returns Hugging Face model metadata, architecture details, and output classes
    for 'projectsidewalk/sidewalk-tagger-ai-surfaceproblem' (ASSETS '24).
    """
    from services.ml_engine.surface_vision_service import sidewalk_vision_service
    return sidewalk_vision_service.get_model_spec()


@router.post("/surface-vision/classify")
def classify_surface_image(payload: ImageClassifyRequest):
    """
    Evaluates sidewalk image crop using Project Sidewalk's DINOv2 model,
    returning detected surface defect tags (cracks, bumpy, uneven, potholes, height difference).
    """
    from services.ml_engine.surface_vision_service import sidewalk_vision_service
    import base64
    try:
        raw_b64 = payload.image_base64
        if "base64," in raw_b64:
            raw_b64 = raw_b64.split("base64,")[1]
        img_bytes = base64.b64decode(raw_b64)
        return sidewalk_vision_service.classify_image(img_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image classification failed: {str(e)}")


@router.post("/surface-vision/evaluate-edge")
def evaluate_edge_defects(payload: EdgeSurfaceEvaluateRequest):
    """
    Evaluates real-time surface defect probabilities and road safety penalties
    for an edge based on pavement type, gradient, and environmental context.
    """
    from services.ml_engine.surface_vision_service import sidewalk_vision_service
    return sidewalk_vision_service.evaluate_edge_surface_defect(
        surface_type=payload.surface_type,
        road_class=payload.road_class,
        slope_pct=payload.slope_pct,
        rainfall_mm_h=payload.rainfall_mm_h,
        incident_density=payload.incident_density
    )

