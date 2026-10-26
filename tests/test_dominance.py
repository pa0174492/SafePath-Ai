import numpy as np
from packages.route_models.dominance import dominates, filter_non_dominated

def test_dominance_logic():
    p1 = np.array([10.0, 500.0, 0.2, 0.0, 1.0, 2.0])
    p2 = np.array([12.0, 600.0, 0.4, 1.0, 1.5, 3.0])  # strictly worse than p1 in all objectives
    
    assert dominates(p1, p2) == True
    assert dominates(p2, p1) == False

def test_non_dominated_filtering():
    # p1 is faster, p2 has lower risk -> both are mutually non-dominated
    p1 = (np.array([10.0, 500.0, 0.8, 0.0, 1.0, 1.0]), "Path1")
    p2 = (np.array([15.0, 700.0, 0.1, 0.0, 1.0, 1.0]), "Path2")
    p3 = (np.array([20.0, 900.0, 0.9, 2.0, 2.0, 4.0]), "Path3")  # Dominated by both
    
    non_dom = filter_non_dominated([p1, p2, p3])
    labels = [item[1] for item in non_dom]
    assert "Path1" in labels
    assert "Path2" in labels
    assert "Path3" not in labels
