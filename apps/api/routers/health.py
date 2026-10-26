from fastapi import APIRouter
from datetime import datetime
from packages.shared_types.models import SystemExecutionMode

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "SafePath-AI Framework",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "mode": "DEMO",
        "engines": {
            "routing_engine": "ACTIVE",
            "context_fusion_engine": "ACTIVE",
            "accessibility_inference_engine": "ACTIVE",
            "safety_risk_model": "ACTIVE",
            "counterfactual_engine": "ACTIVE",
            "resilience_engine": "ACTIVE"
        }
    }
