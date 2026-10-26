# SafePath-AI: Project Charter

## 1. Executive Summary & Problem Statement
Pedestrian navigation systems in contemporary smart cities predominantly optimize for distance or travel time, with emerging variants offering heuristic "safety scores" or binary accessibility toggles. However, real-world urban navigation under physical vulnerability or mobility constraints involves dynamic environmental changes, severe data sparsity in municipal pedestrian infrastructure, and multi-dimensional trade-offs between speed, personal security, physical accessibility, and environmental exposure.

Current systems suffer from five fundamental structural deficiencies:
1. **Static Time Assumptions**: Context (e.g. ambient lighting, precipitation, crowds, incidents) is evaluated at the time of route query rather than at the projected Arrival Time at each individual road segment.
2. **Deterministic False Guarantees**: Sparse accessibility attributes in open geographic databases (such as OpenStreetMap) are either ignored or transformed into false certainties, creating hazardous barriers for wheelchair users, stroller pushers, or visually impaired pedestrians.
3. **Scalarization Bias**: Multi-objective routing is collapsed into arbitrary linear weighted-sum functions ($\sum w_i f_i$), masking non-dominated Pareto trade-offs.
4. **Ignorance of Risk Uncertainty**: Expected risk without variance estimation leads to fragile routes where a single unexpected hazard or unlit alley severely degrades safety.
5. **Lack of Provenance and Explainability**: Users are presented opaque routes with no insight into data sources, model confidence, or counterfactual resilience.

**SafePath-AI** is an open, reproducible, uncertainty-aware, context-adaptive multi-objective routing framework designed to solve these challenges through formal mathematical formulation, time-dependent graph propagation, probabilistic inference, and robust Pareto pathfinding.

---

## 2. Project Vision & Mission
- **Vision**: Establish the benchmark research architecture for safe, accessible, and resilient pedestrian routing in uncertain urban environments.
- **Mission**: Deliver a rigorous, fully reproducible open-source platform combining geospatial machine learning, multi-criteria optimization, and transparent explainability that supports peer-reviewed scientific discovery and deployment.

---

## 3. Core System Objectives
| ID | Objective | Success Metric / Verification |
|---|---|---|
| **OBJ-1** | **Temporal Context-Aware Routing** | Segment-level cost evaluation dynamically conditioned on estimated arrival timestamp ($t_{\text{segment}} = t_0 + \sum \Delta t$). |
| **OBJ-2** | **Probabilistic Accessibility Inference** | Explicit tripartite categorization (`KNOWN`, `INFERRED`, `UNKNOWN`) with calibrated confidence scores and Brier score $< 0.15$. |
| **OBJ-3** | **Robust Multi-Objective Pareto Routing** | Complete non-dominated frontier extraction over 6 objectives ($T, D, R_{\text{robust}}, B, E, C$) beating weighted-sum baselines in Pareto hypervolume. |
| **OBJ-4** | **Risk Uncertainty Optimization** | Optimization of robust risk metric $R_{\text{robust}} = \mu_{\text{risk}} + \lambda \sigma_{\text{risk}}$ and CVaR tail exposure. |
| **OBJ-5** | **Counterfactual & Resilience Simulation** | Dynamic what-if analysis quantifying route degradation under localized perturbations. |
| **OBJ-6** | **Transparent Provenance & Explainability** | Lineage tracking for all attributes; rule-grounded, hallucination-free route explanations. |
| **OBJ-7** | **Zero-Dependency Demo & Reproducibility** | Full dual-mode architecture (Offline Demo Fixtures + Live OpenStreetMap/Open-Meteo APIs) with 100% deterministic test suites. |

---

## 4. Stakeholder & Ethical Boundary
- **Ethical Disclaimer**: SafePath-AI provides decision-support risk estimates, not guarantees of physical safety.
- **Privacy Assurance**: No tracking or inference of protected personal health characteristics; preference profiles are strictly user-declared and stored client-side or session-scoped.
