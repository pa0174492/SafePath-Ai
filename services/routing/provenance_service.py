from typing import Dict, List, Any, Optional
from packages.shared_types.models import RouteCandidate, RouteProvenanceRecord

class ProvenanceService:
    """
    Extracts and aggregates segment-level and attribute-level lineage provenance records.
    """
    
    @staticmethod
    def get_route_provenance_summary(candidate: RouteCandidate) -> Dict[str, Any]:
        all_records: List[RouteProvenanceRecord] = []
        for seg in candidate.segments:
            all_records.extend(seg.provenance)
            
        by_source: Dict[str, int] = {}
        by_status: Dict[str, int] = {}
        
        for r in all_records:
            by_source[r.source] = by_source.get(r.source, 0) + 1
            by_status[r.status.value] = by_status.get(r.status.value, 0) + 1
            
        return {
            "route_id": candidate.id,
            "total_records": len(all_records),
            "sources": by_source,
            "inference_status_breakdown": by_status,
            "segment_count": len(candidate.segments),
            "records": [r.dict() for r in all_records]
        }
