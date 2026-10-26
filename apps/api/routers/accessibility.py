from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from packages.shared_types.models import EdgeAccessibilityInference, InferenceStatus
from services.ml_engine.accessibility_model import AccessibilityInferenceEngine
from services.routing.router import SafePathRouter

router = APIRouter(prefix="/accessibility", tags=["Accessibility Engine"])
ml_engine = AccessibilityInferenceEngine()
router_service = SafePathRouter()

@router.get("/{edge_id}", response_model=EdgeAccessibilityInference)
def get_edge_accessibility(edge_id: str, city_tag: str = "seattle_downtown"):
    """
    Retrieve probabilistic accessibility inference and provenance for a specific road edge.
    """
    graph = router_service.get_graph(city_tag)
    for (u, v, k), feat in graph.edges_features.items():
        if feat.edge_id == edge_id:
            infer = graph.get_edge_inference(u, v, k)
            if not infer:
                infer = ml_engine.infer_accessibility(feat)
            return infer
            
    raise HTTPException(status_code=404, detail=f"Edge '{edge_id}' not found.")
