import numpy as np
from typing import List, Tuple, Dict

def compute_brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Compute the Brier score: Mean squared error between binary labels and predicted probabilities."""
    return float(np.mean((y_prob - y_true) ** 2))

def compute_expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> Tuple[float, Dict[str, List[float]]]:
    """
    Compute Expected Calibration Error (ECE) and reliability diagram bin statistics.
    """
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_indices = np.digitize(y_prob, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)
    
    ece = 0.0
    total_samples = len(y_true)
    
    bin_confidences = []
    bin_accuracies = []
    bin_counts = []
    
    for b in range(n_bins):
        mask = bin_indices == b
        count = int(np.sum(mask))
        bin_counts.append(count)
        if count > 0:
            avg_conf = float(np.mean(y_prob[mask]))
            avg_acc = float(np.mean(y_true[mask]))
            ece += (count / total_samples) * abs(avg_acc - avg_conf)
            bin_confidences.append(avg_conf)
            bin_accuracies.append(avg_acc)
        else:
            bin_confidences.append(float((bins[b] + bins[b+1]) / 2.0))
            bin_accuracies.append(0.0)
            
    diagram = {
        "bin_edges": bins.tolist(),
        "bin_confidences": bin_confidences,
        "bin_accuracies": bin_accuracies,
        "bin_counts": bin_counts
    }
    
    return float(ece), diagram
