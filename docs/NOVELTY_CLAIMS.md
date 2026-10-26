# Novelty Claims & Research Boundary Matrix

To maintain scientific integrity and prevent unjustified novelty claims, this document establishes a rigorous boundary separating established literature, adapted methods, systems integrations, and novel algorithmic/architectural contributions.

---

## 1. Boundary Classification Taxonomy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               Scientific Boundary Matrix                                │
├────────────────────────┬────────────────────────────────────────────────────────────────┤
│ Category A: Known      │ Established algorithms and industry standards (No novelty)     │
├────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Category B: Adapted    │ Existing techniques tailored to pedestrian spatial networks     │
├────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Category C: Integrated │ Cross-domain pipeline connecting decoupled components          │
├────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Category D: Novel      │ Core proposed research contributions to science & engineering  │
├────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Category E: Empirical  │ Specific claims subject to experimental statistical validation │
└────────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 2. Categorized Novelty Claims

### Category A: Already Known (Explicitly NOT Claimed as Novel)
The following are foundational techniques and are acknowledged as prior art:
1. **Dijkstra & A* Pathfinding**: Classical graph search algorithms on static networks.
2. **OpenStreetMap Ingestion**: Standard extraction of road networks via OSMnx or Overpass API.
3. **Linear Weighted-Sum Routing**: Formulating composite objective functions as $f(x) = \sum w_i c_i(x)$.
4. **Static Safety Heatmaps**: Overlaying police crime records or historical incident points onto road buffers.
5. **Basic Weather APIs**: Fetching temperature or rain forecast for a city centroid.
6. **LLM Conversational Chatbots**: Generic chatbot interfaces for answering navigation questions.

---

### Category B: Adapted Existing Techniques
Methods adapted from vehicular navigation, finance, or computer vision to pedestrian mobility:
1. **Time-Dependent Shortest Path (TDSP) Adaptation**: Adapting traffic TDSP algorithms (Cooke & Halsey, 1966) to multi-dimensional pedestrian environmental states (solar zenith lighting, micro-climate precipitation, dynamic crowds).
2. **BOA* / NAMOA* Adaptation**: Adapting bicriterion optimal search algorithms to a 6-objective pedestrian vector $[T, D, R_{\text{robust}}, B, E, C]$ with specialized admissible heuristics for physical slope and lighting.
3. **Mean-Variance & CVaR Robust Optimization**: Adapting portfolio risk measures ($R = \mu + \lambda\sigma$) to geospatial spatial-temporal graph cost uncertainties.

---

### Category C: Proposed Architectural Integrations
Systemic integrations bridging previously disconnected spatial computing workflows:
1. **End-to-End Multi-Provider Ingestion Architecture**: A unified provider abstraction (`DataProvider`, `WeatherProvider`, `IncidentProvider`, `ElevationProvider`, `AccessibilityProvider`) supporting hot-swapping between zero-dependency synthetic demo fixtures and live public geospatial APIs.
2. **Tripartite Uncertainty Pipeline**: Seamless coupling of raw OSM tags $\to$ calibrated supervised ML inference $\to$ probability-weighted graph edges $\to$ user-facing provenance auditor.
3. **Fact-Grounded Explainability Architecture**: A deterministic explanation generator that constructs comparative route narratives directly from verified non-dominated objective deltas and provenance records without risk of hallucination.

---

### Category D: Potentially Novel Research Contributions
The core research hypotheses and engineering contributions of SafePath-AI:
1. **Arrival-Time-Aware Context Fusion Framework for Pedestrians**:
   A formalized mathematical model that propagates dynamic environmental state transformations along pedestrian path trajectories such that segment costs are strictly evaluated at estimated arrival timestamp $t_{\text{arrival}}(e_i) = t_0 + \sum_{k=1}^{i-1} \Delta t_k$, preventing the temporal skew endemic to current pedestrian safety tools.
2. **Uncertainty-Preserving Accessibility Representation**:
   A routing formulation that explicitly distinguishes `KNOWN`, `INFERRED`, and `UNKNOWN` accessibility barriers, embedding calibrated prediction intervals into route burden metrics and mathematically prohibiting the generation of false accessibility guarantees on sparse graphs.
3. **Multi-Objective Robust Pareto Routing with Dynamic Environmental Constraints**:
   A unified routing framework producing a non-dominated Pareto frontier across time, distance, robust risk ($\mu + \lambda\sigma$), accessibility burden, environmental exposure, and route turn complexity under personalized physical mobility profiles.
4. **Counterfactual Route Perturbation & Resilience Scoring Framework**:
   A mathematical sensitivity formulation for evaluating route stability and resilience score $\rho(\pi)$ under parameterized hypothetical context mutations (e.g., precipitation spikes, lighting degradation, dynamic crossing closures).

---

### Category E: Claims Requiring Experimental Verification
The following performance claims are scientific hypotheses that must be empirically verified via the automated experiment suite:
- **Claim E.1**: *SafePath-AI reduces adverse environmental exposure by at least $25\%$ compared to static departure-time routing on urban journeys $> 20$ minutes.*
- **Claim E.2**: *Preserving accessibility uncertainty bounds eliminates $100\%$ of impassable barrier misclassifications compared to deterministic thresholding.*
- **Claim E.3**: *The 6-objective BOA* algorithm achieves statistically superior Hypervolume Indicator ($\ge 18\%$ gain) relative to grid-searched weighted-sum scalarization.*
- **Claim E.4**: *Robust risk parameterization ($\lambda > 0$) reduces $95^{\text{th}}$ percentile tail risk exposure by $> 20\%$ with $< 10\%$ increase in path distance.*
