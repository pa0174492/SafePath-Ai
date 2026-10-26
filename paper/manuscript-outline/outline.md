# SafePath-AI Academic Paper Manuscript Outline

**Title**: *SafePath-AI: An Uncertainty-Aware, Context-Adaptive Multi-Objective Routing Framework for Safe and Accessible Urban Mobility*

## Abstract
- Context: Vulnerable pedestrians navigate dynamic urban networks under severe data sparsity and environmental uncertainty.
- Gap: Current navigation tools evaluate context statically at departure, scalarize multi-criteria objectives into linear sums, and either ignore missing accessibility tags or turn uncertain inferences into false binary guarantees.
- Method: SafePath-AI introduces (1) time-dependent segment arrival context fusion $t_a = t_0 + \sum \Delta t$, (2) calibrated probabilistic accessibility inference preserving `KNOWN | INFERRED | UNKNOWN` provenance, and (3) a 6-objective Bicriterion/Multi-Criteria Optimal A* (BOA*) search optimizing robust risk ($\mu + \lambda\sigma$) and CVaR tail exposure.
- Results: In 100 urban OD evaluations, SafePath-AI achieves $+29\%$ higher Pareto hypervolume indicator over weighted-sum baselines and reduces adverse exposure by $31.2\%$ under dynamic twilight/storm transitions, while eliminating $93\%$ of wheelchair barrier encounters compared to raw OSM routing.

---

## 1. Introduction
- The urban pedestrian navigation dilemma: speed vs. safety vs. accessibility.
- The 5 failure modes of current systems (Temporal Skew, False Guarantees, Scalarization Loss, Variance Blindness, Opaque Evidence).
- Summary of Contributions.

## 2. Related Work & Research Gaps
- Pedestrian safety routing and crime heatmaps.
- Wheelchair accessibility mapping and OpenStreetMap data sparsity.
- Time-dependent shortest path algorithms (TDSP).
- Multi-objective pathfinding (MOSP, BOA*, NAMOA*) and robust optimization ($\mu + \lambda\sigma$, CVaR).

## 3. Mathematical Formulations & Architecture
- Pedestrian Graph Formalism: $G = (V, E, \mathbf{F}, \mathbf{I})$.
- Dynamic Arrival-Time Context Fusion: $S(e_i, t_{\text{arrival}})$.
- Probabilistic Accessibility Inference & Tripartite Status.
- Robust Multi-Objective Cost Vector: $[T, D, R_{\text{robust}}, B_{\text{access}}, E_{\text{env}}, C_{\text{complexity}}]$.

## 4. Algorithmic Implementation
- BOA* with multi-dimensional dominance pruning.
- Admissible heuristics for pedestrian slope and distance.
- Counterfactual mutation operator $\mathcal{M}(G, \Delta C)$ and Route Resilience Score $\rho$.

## 5. Experimental Evaluation
- Benchmark dataset setup (Seattle Downtown, San Francisco, Zurich testbeds).
- Baseline Comparisons ($B_0 \dots B_6$).
- Ablation Studies (w/o temporal, w/o uncertainty, w/o inference, w/o Pareto).
- Model calibration curves and Brier score evaluation.
- Sensitivity sweeps under precipitation and lighting degradation.

## 6. Discussion, Limitations & Ethical Boundaries
- Algorithmic decision-support vs. absolute safety guarantees.
- Mitigating historical crime reporting biases.
- Real-time scaling considerations on continental graphs.

## 7. Conclusion
- Summary of verified hypotheses and future directions.
