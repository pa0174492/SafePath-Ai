# Research Questions & Experimental Hypotheses

SafePath-AI investigates five primary research questions (RQs) designed for empirical validation and ablation testing.

---

## Research Questions

### RQ1: Impact of Temporal Context Fusion on Pedestrian Exposure
- **Question**: Does evaluating environmental and safety risk at segment-specific estimated arrival times ($t_a = t_0 + \sum \Delta t$) significantly reduce actual pedestrian exposure to adverse conditions compared to static departure-time evaluation?
- **Hypothesis (H1)**: Temporal context-aware routing reduces adverse environmental exposure (precipitation, low-light traversal, dynamic hazard proximity) by $\ge 25\%$ across journeys exceeding 20 minutes, with $< 8\%$ increase in total travel time.

### RQ2: Calibration and Robustness of Probabilistic Accessibility Inference
- **Question**: How accurately can supervised geospatial models infer missing pedestrian accessibility tags from topological and urban density features, and does preserving uncertainty prevent barrier entrapment?
- **Hypothesis (H2)**: A calibrated LightGBM/Gradient Boosting classifier achieves Brier score $< 0.12$ and AUC $> 0.85$ on sidewalk/curb inference; integrating explicit uncertainty bounds into routing eliminates $100\%$ of false "fully accessible" route guarantees.

### RQ3: Pareto Frontier Quality vs. Scalarized Baselines
- **Question**: What is the quantitative gain in solution diversity and Pareto Hypervolume when employing exact Multi-Objective Search (BOA*) across 6 objectives versus linear weighted-sum scalarization?
- **Hypothesis (H3)**: Non-dominated Pareto pathfinding achieves a statistically significant improvement in Hypervolume Indicator (HVI) ($\ge 18\%$ increase) over grid-searched weighted-sum baselines, discovering crucial high-safety / low-barrier routes otherwise masked by scalarization.

### RQ4: Efficacy of Robust Risk Formulation ($\mu + \lambda\sigma$)
- **Question**: Does optimizing for robust risk with variance penalties ($\mu_{\text{risk}} + \lambda\sigma_{\text{risk}}$) prevent routes from traversing high-uncertainty urban bottlenecks during adverse scenarios?
- **Hypothesis (H4)**: Increasing $\lambda$ systematically reduces worst-case ($95^{\text{th}}$ percentile) risk exposure across synthetic and real perturbation scenarios without causing excessive path elongation.

### RQ5: Resilience and Stability under Counterfactual Perturbations
- **Question**: How resilient are SafePath-AI routes under localized perturbations (e.g., sudden streetlamp outage, localized downpour, construction barricades) compared to traditional shortest paths?
- **Hypothesis (H5)**: SafePath-AI Pareto routes exhibit a $\ge 30\%$ higher Route Resilience Score ($\rho$) with lower rerouting frequency when subjected to environmental and infrastructure stress tests.

---

## Experimental Benchmark Matrix

| Research Question | Baseline Comparisons | Primary Evaluation Metrics | Statistical Tests |
|---|---|---|---|
| **RQ1 (Temporal)** | $B_0$ (Shortest), $B_4$ (Static Context) vs. SafePath-AI (Full) | Adverse exposure score, Travel time ratio | Paired Wilcoxon signed-rank test ($p < 0.01$) |
| **RQ2 (Accessibility)** | Unchecked OSM, Binary Heuristic vs. Probabilistic ML | Precision, Recall, F1, Brier score, Barrier encounters | Calibration curves, Reliability diagrams |
| **RQ3 (Pareto)** | $B_1$ (Weighted Sum), $B_5$ (2-Obj Pareto) vs. BOA* (6-Obj) | Hypervolume Indicator (HVI), Inverted Generational Distance (IGD), Sol. count | Monte Carlo coverage tests |
| **RQ4 (Robust Risk)** | Risk-neutral ($\lambda=0$) vs. Risk-averse ($\lambda \in [0.5, 2.0]$) vs. CVaR | Mean risk, 95th-pct tail risk, Variance | Sensitivity sweeps |
| **RQ5 (Resilience)** | Shortest Path, AccessMap-style vs. SafePath-AI | Reroute frequency, Resilience score $\rho$, Cost degradation | Perturbation stress-tests |
