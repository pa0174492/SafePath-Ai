# Literature Review & Related Work

## 1. Domain Taxonomy
SafePath-AI builds upon and synthesizes five distinct research domains in urban mobility, spatial computing, and applied machine learning:

```
                  ┌─────────────────────────────────────────┐
                  │          SafePath-AI Taxonomy           │
                  └────────────────────┬────────────────────┘
          ┌─────────────────┬──────────┴──────────┬─────────────────┐
          ▼                 ▼                     ▼                 ▼
 ┌─────────────────┐ ┌───────────────┐ ┌───────────────────┐ ┌───────────────┐
 │Pedestrian Safety│ │ Accessibility │ │  Time-Dependent   │ │Robust Multi-  │
 │    Routing      │ │  Inference    │ │  Context Fusion   │ │Criteria Opt.  │
 └─────────────────┘ └───────────────┘ └───────────────────┘ └───────────────┘
```

---

## 2. Comprehensive Related Work Analysis

### 2.1 Pedestrian Safety and Perceived Risk Routing
- **Crime & Incident-Aware Routing**: Prior studies (e.g., Galbrun et al., 2016; Shah et al., 2020; SafeCity algorithms) aggregate police incident reports and geolocated crime databases to assign static risk penalties to street segments.
  - *Limitation*: Static aggregation ignores diurnal risk variation (e.g., night vs. day lighting, bar closing times) and treats sparse data as zero-risk.
- **Lighting & Infrastructure Auditing**: Work by Badland et al. (2014) and recent computer vision assessments (e.g., Street View lighting analysis) map physical safety features.
  - *Limitation*: Fails to evaluate temporal activation (e.g., dynamic sunset curves, cloud cover darkening streets prematurely).

### 2.2 Accessibility-Aware Urban Pathfinding
- **Wheelchair & Sidewalk Graph Routing**: Projects like AccessMap (Bolten et al., 2017), OpenRouteService Wheelchair Profile (Neis, 2015), and Route4All construct pedestrian graphs using explicit OpenStreetMap tags (`incline`, `kerb`, `surface`, `sidewalk`).
  - *Limitation*: When tags are missing—which occurs in over $70\%$ of global OSM pedestrian ways—existing tools either silently fail, block traversals, or assume default flat surfaces without indicating uncertainty.
- **Machine Learning for Sidewalk Inference**: Recent works (e.g., Weld et al., 2021; Project Sidewalk; Kashian et al., 2022) train classifiers to detect curb ramps and sidewalk barriers from street-level imagery and topological graph features.
  - *Limitation*: Inference models are isolated from the routing engine; predictions are not integrated probabilistically into pathfinding costs with explicit error bounds.

### 2.3 Time-Dependent and Context-Aware Graph Routing
- **Time-Dependent Shortest Path (TDSP)**: Classical formulations (Cooke & Halsey, 1966; Dreyfus, 1969; Delling & Wagner, 2009) compute shortest paths when edge traversal times $c_e(t)$ depend on departure time.
  - *Limitation*: Applied almost exclusively to vehicular traffic congestion matrices (e.g., TomTom, HERE) rather than multi-dimensional pedestrian environmental states (precipitation, lighting decay, dynamic crowd levels, micro-climate heat islands).

### 2.4 Multi-Objective Pathfinding & Robust Optimization
- **Multi-Objective Shortest Path (MOSP)**: Exact algorithms (Martins, 1984; NAMOA* by Mandow & Pérez-de-la-Cruz, 2005; BOA* by Ulloa et al., 2020) compute non-dominated Pareto sets for multi-criteria networks.
  - *Limitation*: Scalability challenges often lead practitioners to fall back on linear scalarization ($\sum w_i f_i$), which loses non-convex Pareto solutions and obscures critical trade-offs.
- **Robust Shortest Path (RSP) under Uncertainty**: Bertsimas & Simchi-Levi (1996), Kouvelis & Yu (1997), and subsequent robust optimization frameworks handle interval or Gaussian edge costs using minimax regret or Mean-Variance / CVaR objectives.
  - *Limitation*: Rarely unified with time-dependent multi-objective pedestrian graphs or calibrated probabilistic accessibility constraints.

### 2.5 Counterfactuals, Explainability & Provenance
- **Spatial Explainability**: XAI in navigation is often limited to post-hoc natural language templates or black-box LLM summaries that risk numerical hallucination.
- **Provenance Tracking**: Spatial data provenance (W3C PROV-O) is rarely exposed at the individual road segment level in user-facing navigation tools.

---

## 3. Comparative Taxonomy Matrix

| Framework / Tool | Dynamic Segment ETA Context | Probabilistic Accessibility (`KNOWN`/`INFERRED`/`UNKNOWN`) | Non-Dominated Pareto Multi-Objective | Robust Risk & Variance ($\mu + \lambda\sigma$) | Counterfactual Perturbation Engine | Segment-Level Lineage Provenance |
|---|---|---|---|---|---|---|
| **Google Maps / Apple Maps** | Yes (Traffic only) | No (Binary transit only) | No (Fastest/Eco scalar) | No | No | No |
| **OpenRouteService (Wheelchair)** | No | No (Static OSM tags only) | No (Linear penalty) | No | No | Minimal |
| **AccessMap (Seattle)** | No | No (Explicit survey only) | No (User weights) | No | No | Partial |
| **SafeCity / Crime-Nav** | No (Static heatmaps) | No | No (Scalar sum) | No | No | No |
| **Research SOTA (TDSP/MOSP)** | Partial (Traffic TDSP) | No (Discrete assumptions) | Yes (Theoretical 2-obj) | Partial (Synthetic graphs) | No | No |
| **SafePath-AI (Proposed)** | **Yes (Full environmental fusion)** | **Yes (Supervised ML + Brier score)** | **Yes (6-objective BOA*)** | **Yes ($\mu + \lambda\sigma$ & CVaR)** | **Yes (Interactive & API)** | **Yes (Full W3C-aligned provenance)** |
