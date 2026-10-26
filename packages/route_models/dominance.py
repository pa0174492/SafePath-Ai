import numpy as np
from typing import List, Tuple, Any

def dominates(vec1: np.ndarray, vec2: np.ndarray, eps: float = 1e-9) -> bool:
    """
    Check if vector 1 dominates vector 2 in minimization:
    vec1 dominates vec2 iff vec1[i] <= vec2[i] for all i, and vec1[j] < vec2[j] for at least one j.
    """
    all_le = np.all(vec1 <= vec2 + eps)
    any_lt = np.any(vec1 < vec2 - eps)
    return bool(all_le and any_lt)

def filter_non_dominated(points: List[Tuple[np.ndarray, Any]]) -> List[Tuple[np.ndarray, Any]]:
    """
    Filter a list of (objective_vector, payload) tuples to return only non-dominated items.
    """
    if not points:
        return []
    
    non_dominated = []
    n = len(points)
    is_dominated = [False] * n
    
    for i in range(n):
        if is_dominated[i]:
            continue
        vec_i = points[i][0]
        for j in range(n):
            if i == j or is_dominated[j]:
                continue
            vec_j = points[j][0]
            if dominates(vec_i, vec_j):
                is_dominated[j] = True
            elif dominates(vec_j, vec_i):
                is_dominated[i] = True
                break
        if not is_dominated[i]:
            non_dominated.append(points[i])
            
    return non_dominated
