# Research Gaps in Pedestrian Urban Routing

## 1. Identified Structural Gaps

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                               Five Critical Research Gaps                                  │
├────────────────────────┬──────────────────────────────────────────────────────────────────┤
│ GAP 1: Temporal Skew   │ Evaluating multi-segment route conditions at request timestamp   │
│                        │ instead of expected arrival timestamp along the spatial timeline. │
├────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ GAP 2: Hard Guarantees │ Converting uncertain or missing accessibility inferences into    │
│                        │ deterministic binary accessibility flags, risking user entrapment│
├────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ GAP 3: Scalarization   │ Collapsing complex multi-criteria spaces into linear weighted    │
│                        │ sums, hiding concave Pareto-optimal trade-offs.                  │
├────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ GAP 4: Variance Blind  │ Optimizing exclusively for expected cost without penalizing      │
│                        │ variance or worst-case tail uncertainty.                         │
├────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ GAP 5: Opaque Evidence │ Providing black-box route recommendations without verifiable     │
│                        │ segment-level data provenance and counterfactual resilience.     │
└────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 2. In-Depth Gap Descriptions & Implications

### Gap 1: Departure-Time vs. Segment Arrival-Time Discrepancy (Temporal Skew)
- **Problem**: In a 35-minute pedestrian journey, ambient light declines exponentially during twilight, sudden precipitation fronts move across urban grids, and evening safety dynamics change around transit hubs. Existing systems evaluate weather and hazard layers uniformly at $t_{\text{query}}$.
- **Failure Mode**: A pedestrian is routed into a park that is safe and well-lit at departure ($t=0$), but becomes completely dark and gated by their estimated arrival ($t=25\text{ min}$).
- **Research Remedy**: Time-dependent segment state evaluation:
  $$S(e_i, t_{\text{arrival}}) = \text{ContextFusion}(e_i, t_0 + \sum_{k=1}^{i-1} \Delta t_k)$$

### Gap 2: Fragile Accessibility Inferences under High OSM Sparsity
- **Problem**: OpenStreetMap lacks accessibility tags (sidewalk presence, curb ramp slope, surface smoothness) on $60\text{--}85\%$ of pedestrian ways outside major metropolitan cores. Existing ML-based inferencing models output continuous probabilities, but routing engines threshold these into binary "accessible/inaccessible" edges.
- **Failure Mode**: A wheelchair user is routed down an inferred sidewalk that turns out to have an insurmountable 15cm curb step.
- **Research Remedy**: Preserving an explicit tripartite status (`KNOWN`, `INFERRED`, `UNKNOWN`) alongside calibrated confidence intervals $[P_{\text{low}}, P_{\text{high}}]$ and reflecting residual uncertainty directly in the objective vector.

### Gap 3: Information Loss in Multi-Objective Scalarization
- **Problem**: Most pedestrian safety routers combine travel time, safety score, and accessibility into a single linear metric:
  $$\text{Cost} = w_1 \cdot \text{Time} + w_2 \cdot \text{Risk} + w_3 \cdot \text{Accessibility}$$
  Varying $(w_1, w_2, w_3)$ fails to discover solutions situated in non-convex regions of the Pareto frontier.
- **Research Remedy**: Exact Multi-Objective Bicriterion/Multi-Criteria Optimal A* (BOA*) with multi-dimensional pruning to return the true non-dominated frontier.

### Gap 4: Variance-Blind Expected Risk Minimization
- **Problem**: Two routes may share identical expected risk $\mathbb{E}[\text{Risk}] = 0.3$. Route A has uniformly low uncertainty ($\sigma = 0.05$), while Route B traverses an unmonitored industrial alleyway with extreme variance ($\sigma = 0.45$).
- **Failure Mode**: Route B exposes vulnerable pedestrians to severe tail hazards.
- **Research Remedy**: Formulating a robust objective $R_{\text{robust}} = \mu_{\text{risk}} + \lambda \sigma_{\text{risk}}$ and Conditional Value-at-Risk (CVaR).

### Gap 5: Absence of Counterfactual Explanations and Data Provenance
- **Problem**: Standard routing APIs return a polyline with turn-by-turn geometry. When a user asks "Why didn't you take the avenue?" or "What happens if it starts raining?", current systems cannot answer without re-querying or resorting to hallucinated LLM text.
- **Research Remedy**: Direct counterfactual simulation APIs (`/counterfactual/simulate`) and segment-level provenance lineage (`source`, `confidence`, `timestamp`, `model_version`).
