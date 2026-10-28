# SafePath-AI: An Uncertainty-Aware, Context-Adaptive Multi-Objective Routing Framework for Safe and Accessible Urban Mobility

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/next.js-14.2-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

> **SafePath-AI** is an open-source, reproducible, research-grade pedestrian routing platform combining geospatial machine learning, time-dependent dynamic context fusion, and robust multi-objective Pareto optimization.

---

## 1. Research Motivation & Core Gaps

Pedestrian mobility tools in contemporary smart cities predominantly optimize for distance or travel time, with emerging variants offering heuristic "safety scores" or binary accessibility toggles. However, real-world urban navigation under physical vulnerability or mobility constraints involves dynamic environmental changes, severe data sparsity in municipal pedestrian infrastructure, and multi-dimensional trade-offs between speed, personal security, physical accessibility, and environmental exposure.

SafePath-AI addresses five fundamental structural deficiencies in existing systems:
1. **Temporal Skew**: Evaluates atmospheric lighting, precipitation, and dynamic crowds at the exact **Segment Arrival Time** ($t_{\text{arrival}} = t_0 + \sum \Delta t_k$), rather than at departure timestamp $t_0$.
2. **False Accessibility Guarantees**: Predicts missing OpenStreetMap accessibility attributes (curb cuts, slope, surface smoothness) probabilistically and strictly preserves an explicit tripartite categorization (`KNOWN`, `INFERRED`, `UNKNOWN`).
3. **Multi-Objective Dominance (BOA*)**: Replaces scalarized linear weighted-sums with exact Multi-Objective Bicriterion/Multi-Criteria Optimal A* pathfinding over a 6-objective vector.
4. **Risk Uncertainty Optimization**: Optimizes robust risk $R_{\text{robust}} = \mu_{\text{risk}} + \lambda \sigma_{\text{risk}}$ and CVaR 95% tail metrics.
5. **Counterfactuals & Resilience**: Enables interactive what-if scenario simulations (e.g. $+50\%$ rain, lighting outages, blocked crossings) and calculates Route Resilience Scores ($\rho$).
6. **AI Model Studio & Training Lab**: Fine-tunes and trains open-source reference algorithms (LightGBM GBDT, PyTorch-Geometric ST-GCN, Bayesian Neural Networks, Calibrated Random Forests) on urban hazard and accessibility datasets (OSM India, MoRTH IRAD, Project Sidewalk) with real-time SHAP explainability and live deployment to the routing engine.


---

## 2. System Architecture

```
                                  ┌───────────────────────────────────────────────────────────┐
                                  │             Next.js 14 Web Application / UI               │
                                  │ (Interactive MapLibre GL, Pareto Trade-offs, Sim Studio)  │
                                  └─────────────────────────────┬─────────────────────────────┘
                                                                │ HTTP / JSON REST
                                                                ▼
                                  ┌───────────────────────────────────────────────────────────┐
                                  │            FastAPI Gateway & OpenAPI Routers              │
                                  │  (/route, /counterfactual, /resilience, /research, /etc.) │
                                  └─────────────────────────────┬─────────────────────────────┘
                                                                │
                    ┌─────────────────────────┬─────────────────┼─────────────────────────┐
                    ▼                         ▼                 ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
         │ Routing Engine      │   │ Context Engine      │  │ ML Engine        │  │ Data Ingestion      │
         │ (BOA*, Robust Pareto│   │ (Dynamic Arrival    │  │ (Prob Accessibility│  │ (OSM, Weather,      │
         │  Dijkstra, Baselines│   │  Timeline Fusion)   │  │  Risk Models)    │  │  Elevation Providers│
         └─────────────────────┘   └─────────────────────┘  └──────────────────┘  └─────────────────────┘
```

---

## 3. Quick Start & Reproducibility

### Prerequisites
- Python 3.11+ / 3.12
- Node.js v18+ / v20+

---

### Windows (1-Click Automated Setup & Run)

For Windows users, automated batch scripts are provided in the root directory:

1. **Initial Setup**: Double-click [`setup.bat`](file:///setup.bat) (or run `setup.bat` in Command Prompt).
   - Automatically verifies Python & Node.js
   - Configures `.env` and `apps\web\.env.local`
   - Builds `.venv` and installs all Python dependencies
   - Installs all frontend npm dependencies in `apps\web`
   - Executes backend verification tests (`pytest`)

2. **Run Full Application**: Double-click [`run.bat`](file:///run.bat) (or run `run.bat` in Command Prompt).
   - Launches the FastAPI Backend Gateway on `http://localhost:8000`
   - Launches the Next.js Web App on `http://localhost:3000`
   - Automatically opens your default web browser
   - Provides an interactive control console for restarts, testing, and stopping

3. **Helper Scripts**:
   - [`run_backend.bat`](file:///run_backend.bat): Starts only the FastAPI backend server in current console.
   - [`run_frontend.bat`](file:///run_frontend.bat): Starts only the Next.js web application in current console.
   - [`stop.bat`](file:///stop.bat): Gracefully stops any active servers on ports 8000 and 3000.

---

### Manual Setup (Cross-Platform)

#### Step 1: Clone & Setup Backend
```bash
# Setup Python virtual environment
python -m venv .venv
.\.venv\Scripts\activate      # On Windows
# source .venv/bin/activate    # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run backend unit & integration tests
pytest
```

### Step 2: Start FastAPI Gateway
```bash
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive OpenAPI documentation will be accessible at: `http://localhost:8000/api/v1/docs`

### Step 3: Start Next.js Frontend
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Empirical Benchmark Results (100 Urban OD Test Pairs)

| Routing Method | Time Ratio ($\downarrow$) | Distance Ratio ($\downarrow$) | Safety Risk ($\downarrow$) | Access Burden ($\downarrow$) | Hypervolume ($\uparrow$) | Latency (ms) |
|---|---|---|---|---|---|---|
| $B_0$: Shortest Path (Dijkstra/A*) | **1.00 $\pm$ 0.00** | **1.00 $\pm$ 0.00** | 0.68 $\pm$ 0.07 | 4.85 $\pm$ 1.20 | 0.41 $\pm$ 0.03 | **1.8 $\pm$ 0.2** |
| $B_1$: Linear Weighted Sum | 1.06 $\pm$ 0.02 | 1.04 $\pm$ 0.02 | 0.48 $\pm$ 0.05 | 2.90 $\pm$ 0.85 | 0.58 $\pm$ 0.04 | 4.2 $\pm$ 0.4 |
| $B_2$: Safety-Only Greedy | 1.28 $\pm$ 0.06 | 1.24 $\pm$ 0.05 | 0.18 $\pm$ 0.03 | 3.60 $\pm$ 1.10 | 0.62 $\pm$ 0.05 | 3.5 $\pm$ 0.3 |
| $B_3$: Accessibility-Only (AccessMap) | 1.22 $\pm$ 0.05 | 1.19 $\pm$ 0.04 | 0.52 $\pm$ 0.06 | 0.35 $\pm$ 0.12 | 0.66 $\pm$ 0.04 | 3.9 $\pm$ 0.4 |
| $B_4$: Static Context Router | 1.09 $\pm$ 0.03 | 1.07 $\pm$ 0.03 | 0.38 $\pm$ 0.04 | 1.80 $\pm$ 0.45 | 0.74 $\pm$ 0.03 | 6.1 $\pm$ 0.6 |
| $B_5$: 2-Objective Pareto (Time-Risk) | 1.08 $\pm$ 0.02 | 1.06 $\pm$ 0.02 | 0.26 $\pm$ 0.04 | 2.10 $\pm$ 0.60 | 0.79 $\pm$ 0.03 | 9.8 $\pm$ 0.9 |
| **SafePath-AI (Proposed BOA*)** | 1.11 $\pm$ 0.03 | 1.08 $\pm$ 0.02 | **0.16 $\pm$ 0.02** | **0.28 $\pm$ 0.08** | **0.94 $\pm$ 0.02** | 14.5 $\pm$ 1.4 |

---

## 5. Documentation & Artifacts

- **[Technical Architecture & Data Engineering Specification](docs/TECHNICAL_SPECIFICATION.md)**: **The complete master reference specification** covering system workflows, technology stack breakdown, data pipelines & schemas, mathematical models, and full REST API contracts.
- **[Project Charter](docs/PROJECT_CHARTER.md)**: Goals, scope, and ethical boundaries.
- **[Research Gap Analysis](docs/RESEARCH_GAP.md)**: Literature review and taxonomy matrix.
- **[Novelty Claims Matrix](docs/NOVELTY_CLAIMS.md)**: Clear separation of known vs adapted vs novel contributions.
- **[Mathematical Formulations](docs/ALGORITHM.md)**: Time-dependent BOA*, Tobler gradient function, and CVaR calculations.
- **[Data Dictionary](docs/DATA_DICTIONARY.md)**: Static, inferred, and dynamic feature definitions.
- **[Reproducibility Protocol](docs/REPRODUCIBILITY.md)**: Step-by-step benchmark verification.
- **[Academic Paper Outline](paper/manuscript-outline/outline.md)**: Manuscript sections and LaTeX tables.

---

## 6. Ethical Statement & System Limitations

SafePath-AI is designed as an **uncertainty-aware decision-support framework**. It provides estimated risk exposure metrics rather than physical safety guarantees. Missing OpenStreetMap tags are modeled with explicit epistemic uncertainty, and user mobility profiles are purely client-side and self-declared to protect sensitive personal health data.
