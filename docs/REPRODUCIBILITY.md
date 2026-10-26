# SafePath-AI Reproducibility Guide

To reproduce all results, benchmarks, figures, and tables reported in the research paper:

## 1. Environment Setup
Ensure Python 3.11+ is installed.
```bash
# Clone the repository
cd safeai-path

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# Install pinned dependencies
pip install -r requirements.txt
```

## 2. Running Automated Tests
```bash
pytest
```

## 3. Running Benchmark Suite
```bash
python -m experiments.baselines.run_baselines
```

## 4. Running REST API Gateway
```bash
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```
Access interactive OpenAPI documentation at: `http://localhost:8000/api/v1/docs`

## 5. Random Seeding
All stochastic generators use fixed seeds (`seed=42`) defined across `services/ml_engine/calibration.py` and `experiments/baselines/run_baselines.py`.
