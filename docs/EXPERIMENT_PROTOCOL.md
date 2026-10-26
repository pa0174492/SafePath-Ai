# SafePath-AI Experiment Protocol & Benchmark Suite

This protocol establishes the standardized procedure for evaluating SafePath-AI and comparative baselines across 100 deterministic Origin-Destination (OD) pairs.

---

## 1. Baseline Configurations
1. **$B_0$ (Shortest Path)**: Minimizes exclusively distance ($D$) using Dijkstra/A*.
2. **$B_1$ (Linear Weighted-Sum)**: Minimizes $\sum_{i=1}^6 w_i f_i$ using normalized user priority weights.
3. **$B_2$ (Safety-Only Router)**: Greedy pathfinding minimizing exclusively static + dynamic risk exposure.
4. **$B_3$ (Accessibility-Only Router)**: Pathfinding minimizing grade slope and surface roughness (AccessMap style).
5. **$B_4$ (Static Context Router)**: Multi-objective routing evaluating context snapshot statically at departure time $t_0$.
6. **$B_5$ (2-Objective Pareto)**: Non-dominated search across $[T_{\text{time}}, R_{\text{risk}}]$ without accessibility and environmental exposure.
7. **SafePath-AI (Proposed)**: Full 6-objective BOA* with time-dependent arrival context, robust risk ($\mu + \lambda\sigma$), and probabilistic accessibility inference.

---

## 2. Evaluation Metrics
- **Travel Time Ratio**: $\frac{T(\pi)}{T(\pi_{B_0})}$
- **Distance Ratio**: $\frac{D(\pi)}{D(\pi_{B_0})}$
- **Safety Risk Exposure**: $\frac{1}{M} \sum_{e \in \pi} R_{\text{robust}}(e, t_{\text{arr}})$
- **Accessibility Burden**: $\sum_{e \in \pi} B_{\text{access}}(e, \text{profile})$
- **Hypervolume Indicator (HVI)**: Multi-dimensional hypervolume dominated by the Pareto set relative to reference point $\mathbf{r} = [1.5, 1.5, 1.0, 10.0, 10.0, 10.0]$.
- **Route Resilience Score ($\rho$)**: Average stability under four perturbation stress tests.
