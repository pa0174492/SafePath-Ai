import numpy as np
from typing import List

def calculate_hypervolume_2d(points: List[np.ndarray], ref_point: np.ndarray) -> float:
    """
    Calculate the 2D Hypervolume Indicator for minimization objectives relative to ref_point.
    Points are sorted by first objective, and disjoint rectangular slices are summed.
    """
    if not points:
        return 0.0
    
    # Filter points that exceed the reference point
    valid_pts = [p for p in points if p[0] <= ref_point[0] and p[1] <= ref_point[1]]
    if not valid_pts:
        return 0.0
    
    # Sort by first objective ascending
    sorted_pts = sorted(valid_pts, key=lambda p: (p[0], p[1]))
    
    hv = 0.0
    current_y = ref_point[1]
    
    for pt in sorted_pts:
        if pt[1] < current_y:
            width = ref_point[0] - pt[0]
            height = current_y - pt[1]
            hv += width * height
            current_y = pt[1]
            
    return float(hv)

def calculate_multi_hypervolume_monte_carlo(points: List[np.ndarray], ref_point: np.ndarray, num_samples: int = 10000, seed: int = 42) -> float:
    """
    Estimate multi-dimensional hypervolume indicator via deterministic quasi-Monte Carlo integration.
    """
    if not points:
        return 0.0
    
    dim = len(ref_point)
    # Find lower bound
    stacked = np.array(points)
    ideal_point = np.min(stacked, axis=0)
    
    # Volume of bounding box
    box_vol = np.prod(np.maximum(1e-6, ref_point - ideal_point))
    
    rng = np.random.default_rng(seed)
    # Sample points inside bounding box [ideal_point, ref_point]
    samples = rng.uniform(ideal_point, ref_point, size=(num_samples, dim))
    
    # Count how many samples are dominated by at least one solution in points
    dominated_count = 0
    for s in samples:
        # A point p in solution set dominates sample s if p[k] <= s[k] for all k
        for p in points:
            if np.all(p <= s):
                dominated_count += 1
                break
                
    fraction = dominated_count / num_samples
    return float(fraction * box_vol)
