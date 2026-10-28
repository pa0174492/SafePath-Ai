from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

from services.data_ingestion.mongodb_service import mongo_service

router = APIRouter(prefix="/datasets", tags=["MongoDB Big Data Lake & Dataset Explorer"])


class SeedBatchRequest(BaseModel):
    count: int = Field(default=10000, ge=500, le=50000)
    force_refresh: bool = False


class ResplitRequest(BaseModel):
    train_ratio: float = Field(default=0.70, ge=0.50, le=0.85)
    test_ratio: float = Field(default=0.15, ge=0.05, le=0.30)
    val_ratio: float = Field(default=0.15, ge=0.05, le=0.30)


@router.get("/mongodb/status")
def get_mongodb_status():
    """Returns real-time MongoDB server health, connection latency, database/collection names, and record counts."""
    return mongo_service.get_status()


@router.get("/records")
def get_dataset_records(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=5, le=500),
    split: Optional[str] = Query(default="ALL", description="Filter by split: ALL, TRAIN, TEST, VALIDATION"),
    city: Optional[str] = Query(default="ALL", description="Filter by city name"),
    dataset_origin: Optional[str] = Query(default="ALL", description="Filter by origin: OSM_INDIA, IRAD_MORTH, etc."),
    is_hazardous: Optional[int] = Query(default=-1, description="-1: all, 1: hazardous, 0: safe"),
    is_lit: Optional[bool] = Query(default=None, description="Filter by street lighting"),
    search: Optional[str] = Query(default=None, description="Search record ID, road class, or surface"),
    sort_by: Optional[str] = Query(default="timestamp"),
    sort_asc: bool = Query(default=False)
):
    """
    Paginated querying over MongoDB collections with multi-criteria filtering,
    regex search, and sorting.
    """
    return mongo_service.query_records(
        page=page,
        page_size=page_size,
        split=split,
        city=city,
        dataset_origin=dataset_origin,
        is_hazardous=is_hazardous,
        is_lit=is_lit,
        search=search,
        sort_by=sort_by,
        sort_asc=sort_asc
    )


@router.get("/stats")
def get_dataset_statistics():
    """Returns aggregated Big Data statistics (class ratios, split distributions, lighting & sidewalk percentages)."""
    return mongo_service.get_dataset_statistics()


@router.post("/seed")
def seed_big_data(payload: SeedBatchRequest):
    """
    Seeds a high-volume batch of realistic pedestrian safety records into MongoDB
    with automatic 70/15/15 train/test/validation labeling.
    """
    try:
        return mongo_service.seed_big_data_batch(
            count=payload.count,
            force_refresh=payload.force_refresh
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resplit")
def resplit_dataset(payload: ResplitRequest):
    """Re-stratifies train/test/validation splits across existing MongoDB documents."""
    return mongo_service.resplit_dataset(
        train_ratio=payload.train_ratio,
        test_ratio=payload.test_ratio,
        val_ratio=payload.val_ratio
    )


@router.delete("/clear")
def clear_mongodb_collection():
    """Wipes documents in training_dataset collection (for re-initialization)."""
    if mongo_service.is_connected and mongo_service.collection is not None:
        mongo_service.collection.delete_many({})
    mongo_service.fallback_storage = []
    return {"status": "SUCCESS", "message": "Cleared collection."}
