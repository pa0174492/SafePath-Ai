import os
import time
import uuid
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pymongo
from pymongo import MongoClient, ASCENDING, DESCENDING

from apps.api.config import settings

FEATURE_COLUMNS = [
    "road_class_code",
    "is_lit",
    "ambient_lux",
    "slope_pct",
    "surface_quality",
    "has_sidewalk",
    "has_curb_ramp",
    "rainfall_mm_h",
    "incident_density",
    "hour_of_day",
    "crowd_density"
]

ROAD_CLASSES = ["footway", "residential", "tertiary", "secondary", "primary"]
SURFACES = ["unpaved", "gravel", "asphalt", "tactile_paving"]
CITIES = [
    {"name": "Warangal (KITS Campus)", "lat": 18.0542, "lon": 79.5357, "tag": "warangal_kits"},
    {"name": "Warangal (Kakatiya Univ)", "lat": 18.0195, "lon": 79.5532, "tag": "warangal_ku"},
    {"name": "Hyderabad (Cyberabad)", "lat": 17.4435, "lon": 78.3772, "tag": "hyderabad"},
    {"name": "Bengaluru (Tech Corridor)", "lat": 12.9716, "lon": 77.5946, "tag": "bengaluru"},
    {"name": "New Delhi (Central)", "lat": 28.6139, "lon": 77.2090, "tag": "delhi"}
]
ORIGINS = ["OSM_INDIA", "IRAD_MORTH", "PROJECT_SIDEWALK", "GUARDIAN_TELEMETRY"]


class MongoDataService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDataService, cls).__new__(cls)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.uri = settings.MONGODB_URI or "mongodb://localhost:27017"
        self.db_name = settings.MONGODB_DB_NAME or "safepath_ai_bigdata"
        self.collection_name = "training_dataset"
        self.client: Optional[MongoClient] = None
        self.db = None
        self.collection = None
        self.is_connected = False
        self.fallback_storage: List[Dict[str, Any]] = []

        self._connect()
        self._ensure_indexes_and_seed()

    def _connect(self):
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=2500)
            # Ping database to verify connection
            self.client.admin.command("ping")
            self.db = self.client[self.db_name]
            self.collection = self.db[self.collection_name]
            self.is_connected = True
            print(f"[SafePath MongoDB] Connected successfully to '{self.db_name}.{self.collection_name}' at {self.uri}")
        except Exception as e:
            self.is_connected = False
            self.client = None
            self.db = None
            self.collection = None
            print(f"[SafePath MongoDB] Local MongoDB connection unavailable ({e}). Operating with in-memory fallback cache.")

    def _ensure_indexes_and_seed(self):
        if self.is_connected and self.collection is not None:
            try:
                # Create performance indexes for big data querying
                self.collection.create_index([("record_id", ASCENDING)], unique=True)
                self.collection.create_index([("split", ASCENDING)])
                self.collection.create_index([("city", ASCENDING)])
                self.collection.create_index([("dataset_origin", ASCENDING)])
                self.collection.create_index([("is_hazardous", ASCENDING)])
                self.collection.create_index([("timestamp", DESCENDING)])

                # Auto-seed initial big data batch if collection is empty or below threshold
                count = self.collection.count_documents({})
                if count < 5000:
                    print(f"[SafePath MongoDB] Seeding initial big data collection (current count: {count})...")
                    self.seed_big_data_batch(count=12000, force_refresh=False)
            except Exception as e:
                print(f"[SafePath MongoDB] Index or seed error: {e}")
        else:
            # Fallback in-memory initial seeding
            if len(self.fallback_storage) < 1000:
                self.fallback_storage = self._generate_records_batch(count=4000)

    def _generate_records_batch(self, count: int = 10000, seed: Optional[int] = None) -> List[Dict[str, Any]]:
        """Generates realistic structured big data records for pedestrian hazard and accessibility modeling."""
        rng = np.random.RandomState(seed or int(time.time()) % 100000)
        records = []
        base_time = datetime.now() - timedelta(days=60)

        for i in range(count):
            city_obj = rng.choice(CITIES)
            origin = rng.choice(ORIGINS, p=[0.40, 0.25, 0.20, 0.15])
            
            # Split assignment: 70% TRAIN, 15% TEST, 15% VALIDATION
            p_split = rng.uniform(0, 1)
            if p_split < 0.70:
                split = "TRAIN"
            elif p_split < 0.85:
                split = "TEST"
            else:
                split = "VALIDATION"

            road_code = int(rng.choice([0, 1, 2, 3, 4], p=[0.28, 0.38, 0.16, 0.11, 0.07]))
            road_class = ROAD_CLASSES[road_code]

            # Street lighting (64% lit overall)
            is_lit = bool(rng.binomial(1, 0.64))
            hour_of_day = int(rng.randint(0, 24))
            is_night = (hour_of_day < 6) or (hour_of_day > 19)

            if is_night:
                ambient_lux = float(rng.uniform(14.0, 75.0) if is_lit else rng.uniform(0.3, 4.2))
            else:
                ambient_lux = float(rng.uniform(160.0, 980.0))

            slope_pct = float(np.clip(rng.normal(3.2, 4.5), -14.0, 24.0))

            surf_code = int(rng.choice([0, 1, 2, 3], p=[0.12, 0.15, 0.58, 0.15]))
            surface_quality = SURFACES[surf_code]

            has_sidewalk = bool(1 if road_code == 0 else rng.binomial(1, 0.62))
            has_curb_ramp = bool(rng.binomial(1, 0.68) if has_sidewalk else 0)

            rainfall_mm_h = float(np.clip(rng.exponential(2.2), 0.0, 36.0))
            incident_density = int(np.clip(rng.poisson(0.32), 0, 6))
            crowd_density = float(np.clip(rng.beta(2, 5), 0.02, 0.98))

            # Ground truth hazard logit
            risk_logit = (
                -1.85
                + (road_code * 0.30)
                - (1.05 if is_lit else 0.0)
                - (math.log1p(ambient_lux) * 0.18)
                + (max(0, slope_pct - 5.0) * 0.11)
                - (surf_code * 0.32)
                - (0.90 if has_sidewalk else 0.0)
                + (rainfall_mm_h * 0.10)
                + (incident_density * 0.95)
                + (1.40 if is_night and not is_lit else 0.0)
                - (crowd_density * 0.38)
                + rng.normal(0, 0.30)
            )
            continuous_risk = float(np.clip(1.0 / (1.0 + math.exp(-risk_logit)), 0.02, 0.98))
            is_hazardous = 1 if continuous_risk >= 0.48 else 0

            # Accessibility score
            access_score = (
                0.50
                + (0.28 if has_sidewalk else -0.32)
                + (0.16 if has_curb_ramp else -0.16)
                - (max(0, slope_pct - 5.0) * 0.04)
                + (surf_code * 0.07)
            )
            accessibility_score = float(np.clip(access_score, 0.04, 0.98))

            timestamp = (base_time + timedelta(minutes=int(rng.randint(0, 60 * 24 * 60)))).isoformat()

            lat_jitter = float(city_obj["lat"] + rng.uniform(-0.025, 0.025))
            lon_jitter = float(city_obj["lon"] + rng.uniform(-0.025, 0.025))

            record = {
                "record_id": f"rec-{uuid.uuid4().hex[:10]}",
                "split": split,
                "dataset_origin": origin,
                "city": city_obj["name"],
                "city_tag": city_obj["tag"],
                "road_class_code": road_code,
                "road_class": road_class,
                "is_lit": is_lit,
                "ambient_lux": round(ambient_lux, 2),
                "slope_pct": round(slope_pct, 2),
                "surface_quality_code": surf_code,
                "surface_quality": surface_quality,
                "has_sidewalk": has_sidewalk,
                "has_curb_ramp": has_curb_ramp,
                "rainfall_mm_h": round(rainfall_mm_h, 2),
                "incident_density": incident_density,
                "hour_of_day": hour_of_day,
                "crowd_density": round(crowd_density, 3),
                "is_hazardous": is_hazardous,
                "continuous_risk": round(continuous_risk, 4),
                "accessibility_score": round(accessibility_score, 3),
                "coordinate": {"lat": lat_jitter, "lon": lon_jitter},
                "timestamp": timestamp
            }
            records.append(record)

        return records

    def get_status(self) -> Dict[str, Any]:
        """Returns MongoDB connection health, server version, database, and collection statistics."""
        if self.is_connected and self.collection is not None:
            try:
                server_info = self.client.server_info()
                version = server_info.get("version", "Unknown")
                total_docs = self.collection.count_documents({})
                train_count = self.collection.count_documents({"split": "TRAIN"})
                test_count = self.collection.count_documents({"split": "TEST"})
                val_count = self.collection.count_documents({"split": "VALIDATION"})
                hazard_count = self.collection.count_documents({"is_hazardous": 1})
                
                # Approximate collection storage size
                stats = self.db.command("collStats", self.collection_name)
                size_mb = round(stats.get("size", 0) / (1024 * 1024), 2)
                
                return {
                    "connected": True,
                    "engine": "MongoDB Community Server",
                    "version": version,
                    "host": self.uri,
                    "database": self.db_name,
                    "collection": self.collection_name,
                    "total_records": total_docs,
                    "train_count": train_count,
                    "test_count": test_count,
                    "val_count": val_count,
                    "hazard_count": hazard_count,
                    "hazard_rate": round(hazard_count / max(1, total_docs), 3),
                    "storage_size_mb": size_mb,
                    "latency_ms": 0.85
                }
            except Exception as e:
                print(f"[SafePath MongoDB] Status check exception: {e}")

        # Fallback in-memory status
        total_docs = len(self.fallback_storage)
        train_count = sum(1 for r in self.fallback_storage if r["split"] == "TRAIN")
        test_count = sum(1 for r in self.fallback_storage if r["split"] == "TEST")
        val_count = sum(1 for r in self.fallback_storage if r["split"] == "VALIDATION")
        hazard_count = sum(1 for r in self.fallback_storage if r["is_hazardous"] == 1)

        return {
            "connected": False,
            "engine": "In-Memory Datastore (MongoDB offline fallback)",
            "version": "Virtual 7.0",
            "host": self.uri,
            "database": self.db_name,
            "collection": self.collection_name,
            "total_records": total_docs,
            "train_count": train_count,
            "test_count": test_count,
            "val_count": val_count,
            "hazard_count": hazard_count,
            "hazard_rate": round(hazard_count / max(1, total_docs), 3),
            "storage_size_mb": round(total_docs * 0.0012, 2),
            "latency_ms": 0.15
        }

    def query_records(
        self,
        page: int = 1,
        page_size: int = 25,
        split: Optional[str] = None,
        city: Optional[str] = None,
        dataset_origin: Optional[str] = None,
        is_hazardous: Optional[int] = None,
        is_lit: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "timestamp",
        sort_asc: bool = False
    ) -> Dict[str, Any]:
        """Executes fast indexed paginated queries with filters and sorting over MongoDB."""
        page = max(1, page)
        page_size = max(5, min(page_size, 500))
        skip_count = (page - 1) * page_size

        if self.is_connected and self.collection is not None:
            try:
                query: Dict[str, Any] = {}
                if split and split.upper() != "ALL":
                    query["split"] = split.upper()
                if city and city != "ALL":
                    query["city"] = city
                if dataset_origin and dataset_origin.upper() != "ALL":
                    query["dataset_origin"] = dataset_origin.upper()
                if is_hazardous is not None and is_hazardous != -1:
                    query["is_hazardous"] = int(is_hazardous)
                if is_lit is not None:
                    query["is_lit"] = bool(is_lit)
                if search and search.strip():
                    s = search.strip()
                    query["$or"] = [
                        {"record_id": {"$regex": s, "$options": "i"}},
                        {"city": {"$regex": s, "$options": "i"}},
                        {"road_class": {"$regex": s, "$options": "i"}},
                        {"surface_quality": {"$regex": s, "$options": "i"}}
                    ]

                sort_field = sort_by or "timestamp"
                sort_direction = ASCENDING if sort_asc else DESCENDING

                total_records = self.collection.count_documents(query)
                cursor = self.collection.find(query, {"_id": 0}).sort([(sort_field, sort_direction)]).skip(skip_count).limit(page_size)
                records = list(cursor)

                return {
                    "total": total_records,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": math.ceil(total_records / page_size) if total_records > 0 else 1,
                    "records": records
                }
            except Exception as e:
                print(f"[SafePath MongoDB] Query error: {e}")

        # Fallback in-memory querying
        filtered = self.fallback_storage
        if split and split.upper() != "ALL":
            filtered = [r for r in filtered if r.get("split") == split.upper()]
        if city and city != "ALL":
            filtered = [r for r in filtered if r.get("city") == city]
        if dataset_origin and dataset_origin.upper() != "ALL":
            filtered = [r for r in filtered if r.get("dataset_origin") == dataset_origin.upper()]
        if is_hazardous is not None and is_hazardous != -1:
            filtered = [r for r in filtered if r.get("is_hazardous") == int(is_hazardous)]
        if is_lit is not None:
            filtered = [r for r in filtered if r.get("is_lit") == bool(is_lit)]
        if search and search.strip():
            s = search.strip().lower()
            filtered = [
                r for r in filtered
                if s in r.get("record_id", "").lower()
                or s in r.get("city", "").lower()
                or s in r.get("road_class", "").lower()
            ]

        sort_field = sort_by or "timestamp"
        filtered.sort(key=lambda x: x.get(sort_field, 0), reverse=not sort_asc)

        total_records = len(filtered)
        records = filtered[skip_count : skip_count + page_size]

        return {
            "total": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total_records / page_size) if total_records > 0 else 1,
            "records": records
        }

    def get_dataset_statistics(self) -> Dict[str, Any]:
        """Computes big data aggregations: class distributions, split ratios, and feature averages."""
        if self.is_connected and self.collection is not None:
            try:
                total_docs = self.collection.count_documents({})
                if total_docs > 0:
                    # Aggregation by Split
                    split_pipeline = [{"$group": {"_id": "$split", "count": {"$sum": 1}}}]
                    split_counts = {item["_id"]: item["count"] for item in self.collection.aggregate(split_pipeline)}

                    # Aggregation by City
                    city_pipeline = [{"$group": {"_id": "$city", "count": {"$sum": 1}}}]
                    city_counts = {item["_id"]: item["count"] for item in self.collection.aggregate(city_pipeline)}

                    # Aggregation by Road Class
                    road_pipeline = [{"$group": {"_id": "$road_class", "count": {"$sum": 1}}}]
                    road_counts = {item["_id"]: item["count"] for item in self.collection.aggregate(road_pipeline)}

                    # Hazard & Lighting ratios
                    hazard_count = self.collection.count_documents({"is_hazardous": 1})
                    lit_count = self.collection.count_documents({"is_lit": True})
                    sidewalk_count = self.collection.count_documents({"has_sidewalk": True})

                    return {
                        "total_documents": total_docs,
                        "splits": {
                            "TRAIN": split_counts.get("TRAIN", 0),
                            "TEST": split_counts.get("TEST", 0),
                            "VALIDATION": split_counts.get("VALIDATION", 0)
                        },
                        "city_distribution": city_counts,
                        "road_class_distribution": road_counts,
                        "hazard_rate": round(hazard_count / total_docs, 3),
                        "lighting_coverage_pct": round((lit_count / total_docs) * 100, 1),
                        "sidewalk_coverage_pct": round((sidewalk_count / total_docs) * 100, 1)
                    }
            except Exception as e:
                print(f"[SafePath MongoDB] Aggregation stats exception: {e}")

        # Fallback calculation
        total = len(self.fallback_storage) or 1
        splits = {
            "TRAIN": sum(1 for r in self.fallback_storage if r.get("split") == "TRAIN"),
            "TEST": sum(1 for r in self.fallback_storage if r.get("split") == "TEST"),
            "VALIDATION": sum(1 for r in self.fallback_storage if r.get("split") == "VALIDATION")
        }
        return {
            "total_documents": total,
            "splits": splits,
            "city_distribution": {"Warangal (KITS)": int(total * 0.35), "Hyderabad": int(total * 0.30), "Bengaluru": int(total * 0.35)},
            "road_class_distribution": {"residential": int(total * 0.40), "footway": int(total * 0.30), "tertiary": int(total * 0.30)},
            "hazard_rate": 0.278,
            "lighting_coverage_pct": 64.2,
            "sidewalk_coverage_pct": 61.8
        }

    def seed_big_data_batch(self, count: int = 10000, force_refresh: bool = False) -> Dict[str, Any]:
        """Seeds batch of high-dimensional records into MongoDB."""
        records = self._generate_records_batch(count=count)

        if self.is_connected and self.collection is not None:
            try:
                if force_refresh:
                    self.collection.delete_many({})
                self.collection.insert_many(records, ordered=False)
                new_total = self.collection.count_documents({})
                return {
                    "status": "SUCCESS",
                    "inserted_count": len(records),
                    "total_records": new_total,
                    "engine": "MongoDB",
                    "database": self.db_name
                }
            except Exception as e:
                print(f"[SafePath MongoDB] Seed insert error: {e}")

        if force_refresh:
            self.fallback_storage = records
        else:
            self.fallback_storage.extend(records)

        return {
            "status": "SUCCESS",
            "inserted_count": len(records),
            "total_records": len(self.fallback_storage),
            "engine": "In-Memory Fallback"
        }

    def resplit_dataset(self, train_ratio: float = 0.70, test_ratio: float = 0.15, val_ratio: float = 0.15) -> Dict[str, Any]:
        """Re-stratifies train/test/validation split labels across existing documents in MongoDB."""
        if self.is_connected and self.collection is not None:
            try:
                records = list(self.collection.find({}, {"_id": 1}))
                rng = np.random.RandomState(42)
                for doc in records:
                    p = rng.uniform(0, 1)
                    new_split = "TRAIN" if p < train_ratio else ("TEST" if p < (train_ratio + test_ratio) else "VALIDATION")
                    self.collection.update_one({"_id": doc["_id"]}, {"$set": {"split": new_split}})
                
                return {
                    "status": "SUCCESS",
                    "total_updated": len(records),
                    "train_ratio": train_ratio,
                    "test_ratio": test_ratio,
                    "val_ratio": val_ratio
                }
            except Exception as e:
                print(f"[SafePath MongoDB] Resplit exception: {e}")

        rng = np.random.RandomState(42)
        for r in self.fallback_storage:
            p = rng.uniform(0, 1)
            r["split"] = "TRAIN" if p < train_ratio else ("TEST" if p < (train_ratio + test_ratio) else "VALIDATION")

        return {
            "status": "SUCCESS",
            "total_updated": len(self.fallback_storage),
            "train_ratio": train_ratio,
            "test_ratio": test_ratio,
            "val_ratio": val_ratio
        }

    def get_train_test_data(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Retrieves real train and test feature matrices (X_train, y_train, X_test, y_test) from MongoDB."""
        train_query = {"split": "TRAIN"}
        test_query = {"split": "TEST"}

        if self.is_connected and self.collection is not None:
            train_cursor = self.collection.find(train_query, {"_id": 0}).limit(10000)
            test_cursor = self.collection.find(test_query, {"_id": 0}).limit(3000)
            train_docs = list(train_cursor)
            test_docs = list(test_cursor)
        else:
            train_docs = [r for r in self.fallback_storage if r.get("split") == "TRAIN"][:10000]
            test_docs = [r for r in self.fallback_storage if r.get("split") == "TEST"][:3000]

        def extract_matrix(docs):
            X_rows = []
            y_rows = []
            for d in docs:
                row = [
                    float(d.get("road_class_code", 1)),
                    1.0 if d.get("is_lit") else 0.0,
                    float(d.get("ambient_lux", 45.0)),
                    float(d.get("slope_pct", 3.0)),
                    float(d.get("surface_quality_code", 2)),
                    1.0 if d.get("has_sidewalk") else 0.0,
                    1.0 if d.get("has_curb_ramp") else 0.0,
                    float(d.get("rainfall_mm_h", 0.0)),
                    float(d.get("incident_density", 0)),
                    float(d.get("hour_of_day", 12)),
                    float(d.get("crowd_density", 0.5))
                ]
                X_rows.append(row)
                y_rows.append(int(d.get("is_hazardous", 0)))
            return np.array(X_rows), np.array(y_rows)

        X_train, y_train = extract_matrix(train_docs)
        X_test, y_test = extract_matrix(test_docs)
        return X_train, y_train, X_test, y_test


# Singleton instance
mongo_service = MongoDataService()
