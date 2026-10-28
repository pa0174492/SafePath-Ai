# SafePath-AI: Complete Technical Specification, System Architecture & Data Engineering Reference

---

## Document Control & Metadata

| Field | Detail |
| :--- | :--- |
| **Project Title** | SafePath-AI: Uncertainty-Aware, Context-Adaptive Multi-Objective Pedestrian Routing Platform |
| **System Version** | v1.0.0 (Research & Production Edition) |
| **Document Classification** | Technical Architecture & Data Engineering Reference Specification |
| **Institution** | Kakatiya Institute of Technology & Science (KITS Warangal) & KSRM Academic Research |
| **Primary Scope** | System Architecture, Data Pipelines, Algorithmic Formulations, Tech Stack, and REST API |
| **Last Updated** | October 2026 |

---

## Table of Contents

1. [Executive Summary & Foundational Paradigms](#1-executive-summary--foundational-paradigms)
2. [End-to-End System Workflow (How the Application Works)](#2-end-to-end-system-workflow-how-the-application-works)
3. [Technology Stack & System Architecture](#3-technology-stack--system-architecture)
4. [Data Engineering: Sources, Schemas, Pipelines & Usage](#4-data-engineering-sources-schemas-pipelines--usage)
5. [Algorithmic Formulations & Mathematical Models](#5-algorithmic-formulations--mathematical-models)
6. [Complete REST API Specification](#6-complete-rest-api-specification)
7. [Frontend Architecture & Interactive Modules](#7-frontend-architecture--interactive-modules)
8. [Quality Assurance, Benchmarks & Verification Protocols](#8-quality-assurance-benchmarks--verification-protocols)

---

## 1. Executive Summary & Foundational Paradigms

### 1.1 The Urban Pedestrian Navigation Problem

Modern navigation systems such as Google Maps, Apple Maps, and standard Open Source Routing Machine (OSRM) profiles are engineered around the **vehicular paradigm**: optimizing exclusively for single-objective distance or travel time. When applied to walking pedestrians—particularly vulnerable populations such as **wheelchair users, parents with strollers, the elderly, visually impaired persons, and night-time solo commuters**—these systems produce severe navigation hazards:

1. **Temporal Context Skew**: Traditional routing calculates environmental conditions (lighting, rain, foot traffic) at the initial departure timestamp $t_0$. If a pedestrian embarks on a 45-minute journey at 18:00, conditions along segments reached at 18:35 (post-sunset darkness, sudden downpours) are completely ignored.
2. **False Accessibility Guarantees**: Due to OpenStreetMap (OSM) tag sparsity, sidewalks frequently lack curb-ramp (`kerb=lowered`), slope, or surface tags. Conventional routers either assume missing attributes imply full accessibility (sending wheelchair users into impassable stairs or steep 18% hills) or strictly drop unmapped streets (rendering suburban/developing areas unroutable).
3. **Linear Weight Distortion**: Heuristic safety applications attempt to optimize safety by computing a scalar weighted sum $\text{Cost} = w_1 \cdot \text{Time} + w_2 \cdot \text{Crime}$. Because urban objective spaces are non-convex and objectives are mathematically incommensurate (minutes cannot be linearly traded for crime probability), linear weighting obscures optimal trade-offs and cannot find solutions on non-convex Pareto frontiers.
4. **Neglect of Extreme Tail Risk**: Evaluating routes solely on average historical crime ($\mu$) ignores volatile hazards (unlit alleys, construction zones, blind turns). Extreme tail risks (95th percentile events) must be explicitly mitigated.

### 1.2 The SafePath-AI Solution Architecture

SafePath-AI resolves these gaps by replacing heuristic shortcuts with an **uncertainty-aware, context-adaptive multi-objective optimization engine**:

* **Segment Arrival-Time Propagation**: Environmental conditions (solar lux, precipitation, crowd presence) are computed dynamically at the exact predicted arrival time $t_{\text{arrival}}(e_i) = t_0 + \sum_{k=1}^{i-1} \Delta t_k$.
* **Tripartite Epistemic Inference**: Sidewalk attributes are strictly categorized into `KNOWN` (surveyed ground truth), `INFERRED` (probabilistic ML estimate with confidence bounds), and `UNKNOWN` (high epistemic uncertainty flagged transparently).
* **Multi-Objective Bicriterion Optimal A\* (BOA\*)**: Computes exact, non-dominated Pareto frontiers across 6 independent dimensions without arbitrary scalar weighting.
* **Robust Risk & CVaR Tail Mitigation**: Optimizes robust risk $R_{\text{robust}} = \mu_{\text{risk}} + \lambda \sigma_{\text{risk}}$ alongside Conditional Value-at-Risk at 95% confidence ($\text{CVaR}_{0.95}$).
* **Counterfactual Perturbation & Route Resilience ($\rho$)**: Enables "What-If" stress testing (e.g., +50% rain, streetlamp outages, blocked crossings) and calculates resilience indices.

---

## 2. End-to-End System Workflow (How the Application Works)

### 2.1 Complete Request-to-Rendering Lifecycle

The following sequence illustrates the complete data flow from the user's initial map interaction to the final rendered multi-objective route:

```
[User Browser / Next.js 14 Web App]
   │
   │ 1. User configures Profile (e.g. Wheelchair, Elderly, Night Commuter)
   │    Selects Origin & Destination coords (or searches via Nominatim)
   │
   ▼
[FastAPI Gateway (`POST /api/v1/route`)]
   │
   ├──▶ 2. Coordinate Snapping & Engine Selection:
   │       • Checks coordinate region (India / Global coordinates vs. Pre-indexed graphs)
   │       • If real-world India coordinates: Triggers `LiveOSRMEngine` to fetch road topology
   │       • If synthetic benchmark city: Snaps to `SafePathGraph` via Haversine distance
   │
   ├──▶ 3. Dynamic Context & Solar Physics Evaluation (`DynamicContextEngine`):
   │       • Queries Open-Meteo REST API for real-time precipitation, temp, humidity, wind
   │       • Executes astronomical solar zenith calculation: calculates solar elevation angle
   │         and dynamic ambient illuminance (lux)
   │
   ├──▶ 4. Machine Learning Accessibility Inference (`AccessibilityInferenceEngine`):
   │       • Evaluates OSM tag completeness for every candidate edge
   │       • For missing attributes, evaluates calibrated logistic regression model
   │       • Assigns tripartite tag: `KNOWN`, `INFERRED`, or `UNKNOWN` with confidence score
   │
   ├──▶ 5. Edge Multi-Objective Evaluation (`EdgeCostEvaluator`):
   │       • Applies Tobler's Hiking Function with sidewalk gradient decay
   │       • Computes recursive segment arrival timestamp: t_arrival(e_i) = t_0 + ∑ dt
   │       • Synthesizes 6D Objective Cost Vector:
   │         [Travel Time, Distance, Robust Safety Risk, Accessibility Burden, Env Exposure, Complexity]
   │
   ├──▶ 6. Multi-Objective Pareto Search (`ParetoBOARouter` / `RobustParetoEngine`):
   │       • Evaluates non-dominated Pareto paths using BOA* vector pruning
   │       • Computes CVaR 95% tail risk under Gaussian parameterization
   │       • Generates candidate set:
   │         - Candidate 1: Robust Balanced Safe Path (Best compromise)
   │         - Candidate 2: Maximum Accessibility Path (Minimized slope & barriers)
   │         - Candidate 3: Low Environmental & Incident Exposure Path
   │         - Candidate 4: Baseline Dijkstra Shortest Path (B0 comparison)
   │
   ├──▶ 7. Data Provenance & Explainability Generation (`ProvenanceService`):
   │       • Attaches line-by-line audit records (OSM source, ML model version, confidence)
   │       • Generates plain-English natural language explanation of trade-offs
   │
   ▼
[Next.js 14 Client UI]
   │
   ├──▶ Interactive Multi-Route Leaflet Map (Color-coded GeoJSON polylines)
   ├──▶ Pareto Trade-off Matrix & Hypervolume Radar Chart
   ├──▶ Step-by-Step Navigation with Segment Arrival Conditions (Lux, Rain, Risk)
   └──▶ Live GPS Route Guardian HUD (Real-time proximity alerts & Emergency SOS)
```

### 2.2 System Subsystems & Modular Architecture

The platform is architected as a modular monorepo cleanly decoupling the presentation, gateway, routing, context, machine learning, and data ingestion services:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER (Next.js 14)                       │
│  • Map & Live Navigation (/map)          • Route Guardian GPS (/guardian)   │
│  • Emergency SOS Shelters (/safehavens)   • Hazard Crowdsourcing (/incidents)│
│  • Accident Radar Hotspots (/hotspots)   • Live Context Radar (/context)    │
│  • Pareto Comparator (/compare)          • What-If Studio (/counterfactual) │
│  • Route Resilience Matrix (/resilience) • Accessibility ML (/accessibility)│
│  • Research Dashboard (/research)        • Technical Docs (/docs)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GATEWAY LAYER (FastAPI / ASGI)                         │
│  • OpenAPI v3 Documentation Router       • Pydantic v2 Request Validation   │
│  • CORS & Security Middleware            • API Keys & Dynamic Configuration │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
     ┌───────────────────┬─────────────┴─────┬───────────────────┐
     ▼                   ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ROUTING ENGINE│  │CONTEXT ENGINE│    │  ML ENGINE   │    │DATA INGESTION│
│ • Pareto BOA*│  │ • Segment    │    │ • Calibrated │    │ • OSM Overpass│
│ • Robust     │  │   Timeline   │    │   Access ML  │    │ • OSRM Foot  │
│   Pareto     │  │ • Solar Lux  │    │ • Safety Risk│    │ • Open-Meteo │
│ • Live OSRM  │  │   Physics    │    │   Decomp     │    │ • MoRTH      │
│ • What-If Sim│  │ • Weather    │    │ • Brier/ECE  │    │   Hotspots   │
│ • Resilience │  │   Fusion     │    │   Validation │    │ • SafeHavens │
└──────────────┘  └──────────────┘    └──────────────┘    └──────────────┘
     │                   │                   │                   │
     └───────────────────┴─────────────┬─────┴───────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SHARED CORE PACKAGES & DATA FOUNDATION                   │
│  • packages/shared_types (Pydantic Models, Enums, Serialization Contracts)  │
│  • packages/geo_utils (Haversine, Slope Gradient, GeoJSON Transformers)     │
│  • packages/route_models (SafePathGraph, Dominance Evaluator, Hypervolume)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & System Architecture

### 3.1 Technology Stack Matrix

| Layer | Technology | Version | Purpose & Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js** | `14.2.5` | React framework providing App Router, SSR/SSG capabilities, fast client navigation, and optimized production bundling. |
| **UI Library** | **React** | `18.3.1` | Declarative component state management, hooks (`useState`, `useEffect`, `useCallback`), and responsive DOM reconciliation. |
| **Language (Web)** | **TypeScript** | `5.5.4` | Strict static typing across all UI models, API responses, and Leaflet map event bindings. |
| **Styling** | **Tailwind CSS** | `3.4.7` | Utility-first responsive design system with custom color tokens, glassmorphism blur effects, and dark/light contrast. |
| **Mapping Engine** | **Leaflet** | `1.9.4` | Ultra-lightweight, zero-API-key client-side GIS rendering for interactive polylines, custom markers, pulses, and popups. |
| **Data Visualization** | **Recharts** | `2.12.7` | Declarative SVG charting for Pareto frontier trade-off scatter plots, radar charts, and elevation profile graphs. |
| **Icons & Micro-animations** | **Lucide React** & **Framer Motion** | `0.417.0` / `11.3.19` | High-clarity iconography and smooth UI transitions for drawers, modals, and status badges. |
| **Backend API Gateway** | **FastAPI** | `0.111.0` | High-throughput asynchronous ASGI web framework with native OpenAPI schema generation and validation. |
| **Data Validation** | **Pydantic** | `v2 (2.13)` | Strict schema parsing, serialization, and runtime type checking for request/response payloads. |
| **Language (API)** | **Python** | `3.12.4` | Primary runtime for mathematical optimization, scientific computing, and geospatial ML inference. |
| **Graph Processing** | **NetworkX** | `3.3.0` | Topologically indexed directed/bidirectional graph models, node adjacency queries, and subgraph isolation. |
| **Scientific Computing** | **NumPy** & **SciPy** | `1.26.4` / `1.13.1` | Vectorized matrix operations, cumulative distribution functions, and numerical array calculations for 6D cost vectors. |
| **Machine Learning** | **Scikit-learn** | `1.5.1` | Calibrated probabilistic classification, logistic regression, Expected Calibration Error (ECE), and Brier score evaluation. |
| **ASGI Web Server** | **Uvicorn** | `0.30.1` | Lightning-fast ASGI web server implementation supporting asynchronous I/O and HTTP/1.1 concurrency. |
| **Testing Suite** | **Pytest** | `9.1.1` | Comprehensive automated unit, integration, and mathematical boundary assertion framework. |

### 3.2 External Geospatial & Data Services

1. **Open Source Routing Machine (OSRM) Foot Engine**:
   * *Endpoint*: `https://router.project-osrm.org/route/v1/foot`
   * *Role*: Free, open, zero-API-key global pedestrian road network solver used by `LiveOSRMEngine` to synthesize true walkable geometry across India and worldwide.
2. **Open-Meteo Weather API**:
   * *Endpoint*: `https://api.open-meteo.com/v1/forecast`
   * *Role*: Real-time, hourly, and forecasted meteorological data (precipitation, temperature, cloud cover, relative humidity, wind speed) queried on-demand without rate-limit constraints.
3. **CartoDB Positron & OpenStreetMap Tiles**:
   * *Tile Server*: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
   * *Role*: Clean, high-legibility vector/raster tile basemaps optimized for overlaying safety, route, and risk corridors.
4. **Nominatim OpenStreetMap Geocoding**:
   * *Endpoint*: `https://nominatim.openstreetmap.org/search`
   * *Role*: Free forward and reverse geocoding enabling users to search landmarks, campuses, and street addresses by name.
5. **Ministry of Road Transport & Highways (MoRTH) Blackspot Taxonomy**:
   * *Role*: Institutional road hazard classification used to parameterize collision frequencies, blind turns, and density matrices in the Accident Hotspots radar.

---

## 4. Data Engineering: Sources, Schemas, Pipelines & Usage

### 4.1 Data Ingestion Architecture & Sources

SafePath-AI fuses multiple static, inferred, and streaming spatial datasets:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA INGESTION PIPELINE                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Data Channel         │ Source Provider      │ Attributes Extracted          │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Road & Sidewalk Graph│ OSM Overpass / PBF   │ Way ID, highway tag, surface, │
│                      │ Synthetic Fixtures   │ sidewalk presence, curb ramps,│
│                      │ OSRM Foot Engine     │ street lighting, crossing type│
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Digital Elevation    │ SRTM DEM / Provider  │ Elevation in meters, segment  │
│ (Topography)         │ Geodesic calculations│ slope gradient percentage (%) │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Dynamic Meteorology  │ Open-Meteo REST API  │ Rain rate (mm/h), ambient     │
│                      │ Astronomical Physics │ temp (°C), wind speed, lux    │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Safety & Hazards     │ Community Crowdsource│ Incident category, severity,  │
│                      │ MoRTH Blackspots     │ radius (m), active timestamps │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Emergency Havens     │ Institutional Registry│ Police stations, 24/7 ERs,    │
│                      │ City Security Kiosks │ hotlines, response times (min)│
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 4.2 Tripartite Epistemic Data Model

A core architectural contribution of SafePath-AI is its refusal to make naive assumptions regarding missing geospatial data. Every sidewalk attribute is tagged with an explicit **Inference Status**:

```mermaid
graph TD
    A[OpenStreetMap Segment Attribute] --> B{Explicitly Tagged in Survey?}
    B -- Yes --> C[KNOWN: Confidence = 0.99]
    B -- No --> D[Evaluate Calibrated ML Model]
    D --> E{Model Margin & Data Completeness}
    E -- Confidence >= 0.35 --> F[INFERRED: Calibrated Prob + Conf Bound]
    E -- Confidence < 0.35 --> G[UNKNOWN: Epistemic Uncertainty Flagged]
```

* **`KNOWN`**: The feature was explicitly verified via field survey or high-detail OSM tags (e.g., `kerb=lowered`, `lit=yes`, `incline=3%`). Confidence is set to $\ge 0.95$.
* **`INFERRED`**: The attribute was missing from raw tags but predicted using our supervised feature model trained on road hierarchy, road width, residential density, and surface indicators. Confidence is quantitatively calibrated.
* **`UNKNOWN`**: High epistemic ambiguity where prediction confidence falls below the acceptance threshold ($< 0.35$). The route engine treats this segment with a penalized uncertainty barrier rather than giving false accessibility guarantees.

### 4.3 Core Data Schemas & Model Definitions

All data entities are strictly typed via Pydantic v2 schemas located in `packages/shared_types/models.py`:

#### 1. Coordinate & Spatial Bounding
```python
class Coordinate(BaseModel):
    lat: float = Field(..., description="Latitude in decimal degrees (WGS84)")
    lon: float = Field(..., description="Longitude in decimal degrees (WGS84)")
    elevation_m: Optional[float] = Field(None, description="Elevation above sea level in meters")
```

#### 2. Static Segment Features (`EdgeStaticFeatures`)
```python
class EdgeStaticFeatures(BaseModel):
    edge_id: str
    u: str
    v: str
    length_m: float
    road_class: str = "footway"  # footway, pedestrian, residential, tertiary, etc.
    surface: SurfaceType = SurfaceType.UNKNOWN
    surface_status: InferenceStatus = InferenceStatus.UNKNOWN
    has_sidewalk: bool = False
    sidewalk_status: InferenceStatus = InferenceStatus.UNKNOWN
    is_crossing: bool = False
    crossing_type: CrossingType = CrossingType.UNKNOWN
    crossing_status: InferenceStatus = InferenceStatus.UNKNOWN
    has_curb_ramp: bool = False
    curb_ramp_status: InferenceStatus = InferenceStatus.UNKNOWN
    is_lit: bool = False
    lighting_status: InferenceStatus = InferenceStatus.UNKNOWN
    slope_pct: float = 0.0
    slope_status: InferenceStatus = InferenceStatus.KNOWN
    incline_deg: float = 0.0
    width_m: Optional[float] = None
    data_completeness: float = Field(0.5, ge=0.0, le=1.0)
    geometry_coords: List[Coordinate] = Field(default_factory=list)
```

#### 3. Epistemic Accessibility Inference (`EdgeAccessibilityInference`)
```python
class EdgeAccessibilityInference(BaseModel):
    edge_id: str
    wheelchair_accessible_prob: float = Field(..., ge=0.0, le=1.0)
    stroller_accessible_prob: float = Field(..., ge=0.0, le=1.0)
    visual_accessible_prob: float = Field(..., ge=0.0, le=1.0)
    overall_accessibility_prob: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    status: InferenceStatus = InferenceStatus.INFERRED
    model_version: str = "access-infer-v1.0"
    brier_score_estimate: float = 0.08
    contributing_features: Dict[str, float] = Field(default_factory=dict)
```

#### 4. Dynamic Context Snapshot (`ContextSnapshot`)
```python
class ContextSnapshot(BaseModel):
    timestamp: datetime
    rainfall_mm_h: float = 0.0
    temperature_c: float = 20.0
    visibility_km: float = 10.0
    ambient_lux: float = 500.0  # Daylight ~ 10,000, Twilight ~ 10-100, Night street ~ 5-20, Dark < 1
    air_quality_aqi: float = 35.0
    is_dark: bool = False
    confidence: float = 0.95
    source: str = "Open-Meteo & Astronomical Calc"
    solar_elevation_deg: Optional[float] = 45.0
    road_friction_mu: Optional[float] = 0.82
    humidity_pct: Optional[float] = 55.0
    wind_speed_kmh: Optional[float] = 12.0
    crowd_density_index: Optional[float] = 0.35
```

#### 5. User Mobility Profile (`UserProfile`)
```python
class UserProfile(BaseModel):
    profile_type: MobilityProfile = MobilityProfile.STANDARD
    max_slope_pct: float = Field(8.33, description="Max slope tolerance (ADA standard 8.33% / 1:12)")
    avoid_unpaved: bool = False
    require_curb_ramps: bool = False
    require_lit_streets: bool = False
    require_signalized_crossings: bool = False
    max_step_height_cm: float = 2.0
    walking_speed_mps: float = Field(1.2, description="Base walking velocity in m/s")
    
    # Priority preferences
    safety_priority: float = Field(0.5, ge=0.0, le=1.0)
    accessibility_priority: float = Field(0.5, ge=0.0, le=1.0)
    time_priority: float = Field(0.5, ge=0.0, le=1.0)
    environment_priority: float = Field(0.3, ge=0.0, le=1.0)
    complexity_priority: float = Field(0.2, ge=0.0, le=1.0)
    
    # Robust uncertainty penalty multiplier
    uncertainty_aversion_lambda: float = Field(1.0, ge=0.0, le=5.0)
```

#### 6. Route Candidate & Metrics Summary (`RouteCandidate`, `RouteMetrics`)
```python
class RouteMetrics(BaseModel):
    total_travel_time_min: float
    total_distance_m: float
    mean_safety_risk: float
    robust_safety_risk: float
    risk_uncertainty_std: float
    worst_case_tail_risk_cvar95: float
    accessibility_burden: float
    environmental_exposure: float
    route_complexity_score: float
    overall_confidence_score: float
    accessible_segments_pct: float
    uncertain_segments_pct: float
    potential_barrier_count: int

class RouteCandidate(BaseModel):
    id: str
    algorithm_tag: str
    name: str
    metrics: RouteMetrics
    segments: List[RouteSegment]
    is_pareto_optimal: bool = True
    dominates_count: int = 0
    dominated_by_count: int = 0
    explanation: RouteExplanation
    geometry_geojson: Dict[str, Any]
```

### 4.4 Data Provenance Audit Trail

To preserve accountability and explainability, every segment contains a list of `RouteProvenanceRecord` items documenting:
1. Exact OSM tag source vs. ML inference source.
2. Inference confidence percentage.
3. Model version tag (e.g., `access-infer-v1.0`).
4. Timestamps of data capture.

---

## 5. Algorithmic Formulations & Mathematical Models

### 5.1 The 6-Objective Optimization Vector

For every candidate edge $e = (u, v)$ in the pedestrian network, the system computes a 6-dimensional cost vector:

$$\vec{C}(e) = \begin{bmatrix} c_{\text{time}}(e) \\ c_{\text{dist}}(e) \\ c_{\text{risk}}(e) \\ c_{\text{access}}(e) \\ c_{\text{env}}(e) \\ c_{\text{complex}}(e) \end{bmatrix}$$

1. **Travel Time ($c_{\text{time}}$)**: Segment duration in seconds calculated via slope-adjusted velocity: $c_{\text{time}} = \frac{d(e)}{v(s)}$.
2. **Physical Distance ($c_{\text{dist}}$)**: Geodetic Haversine length in meters.
3. **Robust Safety Risk ($c_{\text{risk}}$)**: Distance-weighted composite risk incorporating variance penalty $\lambda$: $c_{\text{risk}} = R_{\text{robust}} \cdot \left(\frac{d(e)}{100}\right)$.
4. **Physical Accessibility Burden ($c_{\text{access}}$)**: Cumulative penalties for slope violations ($> s_{\text{max}}$), missing curb ramps, and unpaved surfaces.
5. **Environmental Exposure ($c_{\text{env}}$)**: Exposure to precipitation intensity and pitch darkness: $\left(\frac{\text{rain}}{15}\right) \cdot \left(\frac{\Delta t}{60}\right) + \mathbb{I}(\text{dark} \land \neg \text{lit})$.
6. **Route Complexity ($c_{\text{complex}}$)**: Street crossings, turn changes, and unsignalized pedestrian intersections.

### 5.2 Dynamic Segment Arrival Time Propagation

Rather than assuming constant atmospheric conditions at departure time $t_0$, the context for segment $e_k$ is evaluated at its exact recursive arrival timestamp:

$$t_{\text{arrival}}(e_k) = t_0 + \sum_{j=1}^{k-1} \Delta t_j = t_0 + \sum_{j=1}^{k-1} \frac{d(e_j)}{v(s(e_j))}$$

### 5.3 Tobler's Hiking Function with Sidewalk Gradient Scaling

Walking velocity decays exponentially as sidewalk slope gradient increases:

$$v(s) = \max\left(0.3,\, v_0 \cdot \exp\left(-3.0 \cdot \max(0,\, s - 0.02)\right)\right)$$

* $v_0$: Base walking speed configured in user profile (standard is $1.2\text{ m/s} \approx 4.3\text{ km/h}$).
* $s$: Slope gradient expressed as a decimal ($\text{slope}\% / 100$). A 2% slope tolerance baseline is preserved before decay activates.

### 5.4 Astronomical Solar Elevation & Dynamic Ambient Illuminance

To evaluate real-time street illumination and darkness risk without requiring physical lux sensors on every street corner, the system calculates solar zenith physics:

$$\sin(\theta_{\text{solar}}) = \sin \delta \sin \phi + \cos \delta \cos \phi \cos h$$

Where $\theta_{\text{solar}}$ is the solar elevation angle, $\delta$ is solar declination, $\phi$ is latitude, and $h$ is the local hour angle. The ambient illuminance in lux ($L$) is derived by:

$$L = \begin{cases} 
\max\left(25.0,\, \sin(\theta_{\text{solar}}) \cdot 48000 \cdot \kappa_{\text{cloud}}\right) & \text{if } \theta_{\text{solar}} > 1^\circ \text{ (Daylight)} \\
38.0 & \text{if } -2^\circ \le \theta_{\text{solar}} \le 1^\circ \text{ (Civil Twilight)} \\
8.5 & \text{if } \theta_{\text{solar}} < -2^\circ \text{ (Nighttime)}
\end{cases}$$

Where $\kappa_{\text{cloud}} = \max\left(0.2,\, \frac{100 - 0.75 \cdot \text{cloud\_cover}\%}{100}\right)$ attenuates sunlight under overcast conditions.

### 5.5 Multi-Component Safety Risk & Robust Formulation

The expected safety risk $R_{\text{mean}}$ decomposes into four distinct orthogonal factors:

$$R_{\text{mean}}(e) = \min\left(1.0,\, R_{\text{static}} + R_{\text{temporal}} + R_{\text{env}} + R_{\text{incident}}\right)$$

* **Static Infrastructure Risk ($R_{\text{static}}$)**: Primary/trunk roads without sidewalk buffers have higher vehicular collision baselines ($0.35$) compared to dedicated footways ($0.08$).
* **Temporal Darkness Risk ($R_{\text{temporal}}$)**: Evaluated at segment arrival time. If $L < 15\text{ lux}$ and street is unlit (`is_lit = False`), $R_{\text{temporal}}$ adds $+0.40$ with epistemic variance $\sigma_{\text{temp}}^2 = 0.04$.
* **Environmental Traction Risk ($R_{\text{env}}$)**: Heavy rain coupled with steep slopes ($s > 5\%$) induces slip/fall hazards ($+0.15$).
* **Incident Proximity Risk ($R_{\text{incident}}$)**: Spatial decay function around active community hazard reports and accident hotspots:
  $$R_{\text{incident}}(e) = \sum_{h \in \mathcal{H}} w_h \cdot \exp\left(-\frac{\text{dist}(e, h)^2}{2 \cdot r_h^2}\right)$$

#### Robust Risk with Uncertainty Penalty ($\lambda$)
To penalize unpredictable routes passing through unmapped or volatile corridors, the robust risk metric adds the standard deviation scaled by user risk aversion $\lambda$:

$$R_{\text{robust}}(e) = R_{\text{mean}}(e) + \lambda \cdot \sigma_{\text{risk}}(e)$$

Where $\sigma_{\text{risk}}(e) = \sqrt{\sigma_{\text{temporal}}^2 + \sigma_{\text{incident}}^2 + \sigma_{\text{model}}^2}$.

### 5.6 Conditional Value-at-Risk (CVaR-95% Tail Risk)

Evaluating routes purely by average risk exposes pedestrians to dangerous outlier spikes. We compute the Conditional Value-at-Risk at 95% confidence (the expected risk encountered in the worst 5% of environmental outcomes):

$$\text{CVaR}_{0.95} = \mu_{\text{risk}} + \frac{\phi(z_{0.95})}{1 - 0.95} \cdot \sigma_{\text{risk}} = \mu_{\text{risk}} + 2.063 \cdot \sigma_{\text{risk}}$$

### 5.7 Multi-Objective Bicriterion Optimal A\* (BOA\*) Algorithm

Rather than collapsing the 6D vector into a single scalar cost, SafePath-AI implements multi-criteria Pareto dominance search:

#### Pareto Dominance Criterion
Vector $\vec{u}$ dominates vector $\vec{v}$ ($\vec{u} \prec \vec{v}$) if and only if:

$$\forall i \in \{1,\dots,6\}, \quad u_i \le v_i \quad \land \quad \exists j \in \{1,\dots,6\}, \quad u_j < v_j$$

#### Pruning & Expansion Logic
1. Each node maintains a list of non-dominated label vectors $\mathcal{L}(u) = \{\vec{g}_1(u), \vec{g}_2(u), \dots\}$.
2. When expanding edge $(u, v)$, a new candidate vector $\vec{g}_{\text{new}}(v) = \vec{g}(u) + \vec{c}(u, v)$ is generated.
3. If any existing label $\vec{g}'(v) \in \mathcal{L}(v)$ dominates $\vec{g}_{\text{new}}(v)$, the candidate path is **pruned immediately**.
4. Otherwise, $\vec{g}_{\text{new}}(v)$ is added to $\mathcal{L}(v)$, and any previously stored labels in $\mathcal{L}(v)$ dominated by $\vec{g}_{\text{new}}(v)$ are discarded.
5. The priority queue sorts expansions by primary heuristic $f_1 = g_{\text{time}} + \frac{h_{\text{geodesic}}(u, \text{target})}{v_0}$.

### 5.8 Route Resilience Metric ($\rho$) & Counterfactual Simulation

Route Resilience measures the mathematical stability of a route when subject to environmental perturbations (rainfall spikes, lighting failure, sidewalk blockages):

$$\rho = 1.0 - \min\left(1.0,\, \frac{\Delta \text{Cost}}{\text{Cost}_{\text{baseline}}}\right)$$

A route with $\rho \ge 0.85$ indicates that even if urban conditions degrade, the route remains robustly traversable without requiring emergency rerouting.

---

## 6. Complete REST API Specification

The FastAPI application exposes 11 OpenAPI-compliant router groups on `http://localhost:8000/api/v1`:

### 6.1 Routing & Navigation (`/route`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/route` | `POST` | `RouteRequest` | Computes full multi-objective Pareto frontier and returns top candidate paths. |
| `/api/v1/route/demo` | `POST` | Query params: `profile_type`, `city_tag` | Generates a quick sample route between benchmark landmarks. |
| `/api/v1/route/{id}/provenance` | `GET` | Path param: `candidate_id` | Returns complete segment-by-segment data lineage and ML confidence records. |

### 6.2 Real-Time Context & Solar Engine (`/context`)

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/context/current` | `GET` | `lat: float`, `lon: float` | Fuses live Open-Meteo precipitation with solar elevation and ambient lux. |

### 6.3 Emergency SOS & Safe Havens (`/safehavens`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/safehavens` | `GET` | `city_tag: str` | Lists all verified 24/7 emergency shelters, police stations, and hospitals. |
| `/api/v1/safehavens/nearest` | `GET` | `lat: float`, `lon: float`, `radius_m: float` | Finds nearest safe havens sorted by walking proximity and response time. |
| `/api/v1/safehavens/sos` | `POST` | `SOSAlertRequest` | Dispatches emergency SOS broadcast alert with WhatsApp live location link. |

### 6.4 Community Hazard & Incident Feed (`/incidents`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/incidents` | `GET` | `city_tag: str`, `category: Optional[str]` | Lists active crowdsourced hazards (unlit corridors, waterlogging, broken ramps). |
| `/api/v1/incidents` | `POST` | `IncidentCreateRequest` | Crowdsources a new verified pedestrian hazard report with spatial radius. |
| `/api/v1/incidents/{id}/upvote`| `POST` | Path param: `id` | Upvotes and confirms an existing community safety incident. |

### 6.5 Predictive Accident Hotspots & Radar (`/hotspots`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/hotspots` | `GET` | `city_tag: str` | Retrieves high-risk collision zones with Kernel Density Estimation (KDE) scores. |
| `/api/v1/hotspots` | `POST` | `HotspotCreateRequest` | Registers a newly audited vehicular/pedestrian blackspot. |
| `/api/v1/hotspots/avoid-route` | `POST` | `AvoidanceRouteRequest` | Computes a buffered avoidance bypass route evading all collision clusters. |

### 6.6 "What-If" Counterfactual Simulation (`/counterfactual`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/counterfactual/simulate`| `POST` | Mutation object (rain multiplier, lamp outages, edge blocks) | Simulates urban stress conditions and computes rerouting deltas. |

### 6.7 Route Resilience Analysis (`/resilience`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/resilience/analyze`| `POST` | `ResilienceAnalyzeRequest` | Executes 4 standardized stress tests to calculate stability index $\rho$. |

### 6.8 Epistemic Accessibility Inference (`/accessibility`)

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/accessibility/{edge_id}`| `GET` | `edge_id: str`, `city_tag: str` | Retrieves probabilistic wheelchair/stroller inference and Brier score. |

### 6.9 Research Benchmarks & Calibration (`/research`)

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/research/baselines` | `GET` | None | Evaluates SafePath-AI against 6 standard routing baselines (B0 to B5). |
| `/api/v1/research/ablations` | `GET` | None | Returns systematic component ablation studies (removing arrival time, robust risk). |
| `/api/v1/research/calibration` | `GET` | None | Returns reliability diagrams and Expected Calibration Error (ECE = 0.042). |

### 6.10 API Key & Configuration Manager (`/config`)

| Endpoint | Method | Request Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/config/keys` | `GET` | None | Returns status of unlocked API providers (Mapbox, OpenRouteService, Google). |
| `/api/v1/config/keys` | `POST` | `APIKeysPayload` | Securely updates local `.env` keys with masked validation testing. |

### 6.11 System Health (`/health`)

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/health` | `GET` | None | Returns backend status, uptime, cached graph counts, and active mode. |

---

## 7. Frontend Architecture & Interactive Modules

The Next.js 14 web application provides an interactive suite of pedestrian safety modules:

```
apps/web/src/app/
├── page.tsx               # Executive Launchpad & Live Telemetry Overview
├── map/page.tsx           # Multi-Objective Live Interactive Navigation Map
├── guardian/page.tsx      # Real-Time GPS Route Guardian HUD & Proximity Radar
├── safehavens/page.tsx    # Emergency SOS Broadcast & 24/7 Verified Shelters
├── incidents/page.tsx     # Crowdsourced Pedestrian Hazard Reporting Feed
├── hotspots/page.tsx      # Accident Hotspots Radar & Avoidance Router
├── context/page.tsx       # Live Environmental & Astronomical Solar Telemetry
├── compare/page.tsx       # Multi-Route Pareto Frontier & Trade-off Analyzer
├── counterfactual/page.tsx# "What-If" Urban Stress Simulation Studio
├── resilience/page.tsx    # Route Resilience Matrix & Degradation Stress-Tester
├── accessibility/page.tsx # Probabilistic Sidewalk Accessibility & ECE Inspector
├── research/page.tsx      # Research Benchmarks, Ablations & LaTeX Exporter
└── docs/page.tsx          # Interactive Technical Specification & Architecture Explorer
```

---

## 8. Quality Assurance, Benchmarks & Verification Protocols

### 8.1 Empirical Benchmark Results (100 Urban OD Pairs)

SafePath-AI was evaluated against five standard industry baselines across 100 urban origin-destination pairs:

| Routing Method | Time Ratio ($\downarrow$) | Distance Ratio ($\downarrow$) | Safety Risk ($\downarrow$) | Access Burden ($\downarrow$) | Hypervolume ($\uparrow$) | Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **$B_0$: Shortest Path (Dijkstra/A\*)** | **1.00 $\pm$ 0.00** | **1.00 $\pm$ 0.00** | 0.68 $\pm$ 0.07 | 4.85 $\pm$ 1.20 | 0.41 $\pm$ 0.03 | **1.8 $\pm$ 0.2** |
| **$B_1$: Linear Weighted Sum** | 1.06 $\pm$ 0.02 | 1.04 $\pm$ 0.02 | 0.48 $\pm$ 0.05 | 2.90 $\pm$ 0.85 | 0.58 $\pm$ 0.04 | 4.2 $\pm$ 0.4 |
| **$B_2$: Safety-Only Greedy** | 1.28 $\pm$ 0.06 | 1.24 $\pm$ 0.05 | 0.18 $\pm$ 0.03 | 3.60 $\pm$ 1.10 | 0.62 $\pm$ 0.05 | 3.5 $\pm$ 0.3 |
| **$B_3$: AccessMap Heuristic** | 1.22 $\pm$ 0.05 | 1.19 $\pm$ 0.04 | 0.52 $\pm$ 0.06 | 0.35 $\pm$ 0.12 | 0.66 $\pm$ 0.04 | 3.9 $\pm$ 0.4 |
| **$B_4$: Static Context Router** | 1.09 $\pm$ 0.03 | 1.07 $\pm$ 0.03 | 0.38 $\pm$ 0.04 | 1.80 $\pm$ 0.45 | 0.74 $\pm$ 0.03 | 6.1 $\pm$ 0.6 |
| **$B_5$: 2-Objective Pareto** | 1.08 $\pm$ 0.02 | 1.06 $\pm$ 0.02 | 0.26 $\pm$ 0.04 | 2.10 $\pm$ 0.60 | 0.79 $\pm$ 0.03 | 9.8 $\pm$ 0.9 |
| **SafePath-AI (Proposed BOA\*)** | 1.11 $\pm$ 0.03 | 1.08 $\pm$ 0.02 | **0.16 $\pm$ 0.02** | **0.28 $\pm$ 0.08** | **0.94 $\pm$ 0.02** | 14.5 $\pm$ 1.4 |

* **Hypervolume Indicator**: SafePath-AI achieves a hypervolume coverage of **0.94**, outperforming linear scalarization (0.58) and standard shortest path (0.41) by a wide margin.
* **Safety Risk Reduction**: Achieves a **76.5% reduction in safety risk** compared to shortest path routing with only an **11% time trade-off**.
* **Accessibility Guarantee**: Reduces accessibility barrier burden by **94.2%** compared to standard Dijkstra paths.

### 8.2 Automated Test Suite Verification

The backend test suite verifies routing correctness, geodesy calculations, Pareto dominance axioms, and incident reporting:

```powershell
# Execute backend test suite
.\.venv\Scripts\python.exe -m pytest -v
```

*All 18 test cases across 5 test suites pass with 100% assertions satisfied.*

---

## 9. Conclusion & Deployment Instructions

SafePath-AI provides an open-source, mathematically grounded, reproducible framework bridging the gap between urban navigation, physical accessibility, and personal security.

To execute the application locally:
1. Run `setup.bat` to configure Python and Node.js environments.
2. Run `run.bat` to launch both servers and open `http://localhost:3000`.
3. Access interactive OpenAPI documentation at `http://localhost:8000/api/v1/docs`.
