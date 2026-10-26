# SafePath-AI Architecture Specification

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

## Modular Components

1. **`packages/shared_types`**:
   Unified Pydantic data schemas used across routing, context evaluation, provenance, and REST serialization.
2. **`packages/geo_utils`**:
   High-precision geodesy (Haversine distances, gradient slope percentage, compass bearing) and GeoJSON encoders.
3. **`packages/route_models`**:
   Topological graph representation `SafePathGraph`, multi-objective dominance evaluators, and exact/Monte-Carlo Hypervolume Indicator algorithms.
4. **`services/data_ingestion`**:
   Decoupled provider interfaces (`DataProvider`, `WeatherProvider`, `IncidentProvider`, `ElevationProvider`, `AccessibilityProvider`, `GeocodingProvider`) supporting hot-swapping between zero-dependency deterministic Demo fixtures and live external APIs.
5. **`services/ml_engine`**:
   Calibrated gradient boosting / logistic regression classifiers inferring missing accessibility tags, and multi-factor safety risk models decomposing static, temporal, weather, and incident risks into $(\mu, \sigma)$.
6. **`services/context_engine`**:
   Dynamic arrival-time context evaluator ensuring $t_{\text{arrival}}(e_i) = t_0 + \sum \Delta t$.
7. **`services/routing`**:
   Exact Multi-Objective Bicriterion/Multi-Criteria Optimal A* (`ParetoBOARouter`), counterfactual simulation engine (`CounterfactualEngine`), and resilience analyzer (`RouteResilienceAnalyzer`).
