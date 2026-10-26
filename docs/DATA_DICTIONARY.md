# SafePath-AI Data Dictionary

## 1. Graph Edge Static Features (`EdgeStaticFeatures`)
| Field | Type | Description | Source / Status |
|---|---|---|---|
| `edge_id` | `str` | Unique edge identifier (e.g. `edge_1st_Pike_2nd_Pike`) | OSM / Synthesized |
| `u`, `v` | `str` | Start and end node identifiers | Topological graph |
| `length_m` | `float` | Geodesic length along edge geometry in meters | Geodesy WGS84 |
| `road_class` | `str` | Functional highway classification (`footway`, `residential`, `primary`) | OSM `highway` tag |
| `surface` | `SurfaceType` | Pavement type (`concrete`, `asphalt`, `cobblestone`, `unpaved`) | OSM `surface` |
| `has_sidewalk`| `bool` | True if dedicated pedestrian footway exists | OSM / Inferred |
| `is_lit` | `bool` | True if street lighting is present and operational | OSM `lit` |
| `slope_pct` | `float` | Incline percentage $(|\Delta \text{elevation}| / \text{distance}) \times 100$ | USGS 3DEP / DEM |
| `has_curb_ramp`| `bool` | True if curb cuts/ramps are present at crossings | OSM `kerb` / Inferred |
| `data_completeness`| `float` | Completeness score $\in [0, 1]$ of verified metadata tags | Survey Metric |

---

## 2. Inferred Accessibility Features (`EdgeAccessibilityInference`)
| Field | Type | Description |
|---|---|---|
| `wheelchair_accessible_prob` | `float` $\in [0, 1]$ | Calibrated probability of manual/power wheelchair traversal |
| `stroller_accessible_prob` | `float` $\in [0, 1]$ | Calibrated probability for strollers and rolling luggage |
| `visual_accessible_prob` | `float` $\in [0, 1]$ | Calibrated probability of tactile paving and audible signals |
| `overall_accessibility_prob` | `float` $\in [0, 1]$ | Joint accessibility metric |
| `confidence` | `float` $\in [0, 1]$ | Epistemic certainty based on feature density and model calibration |
| `status` | `InferenceStatus` | Explicit flag: `KNOWN`, `INFERRED`, or `UNKNOWN` |

---

## 3. Dynamic Context Features (`SegmentContext`)
| Field | Type | Description |
|---|---|---|
| `estimated_arrival_time` | `datetime` | Arrival timestamp computed as $t_0 + \sum \Delta t_k$ |
| `rainfall_mm_h` | `float` | Forecasted precipitation rate at segment arrival |
| `ambient_lux` | `float` | Ambient illumination accounting for solar zenith and streetlamps |
| `active_incidents_count` | `int` | Number of active hazards within proximity buffer |
| `hazard_proximity_m` | `float` | Minimum distance to nearest active incident in meters |
| `context_risk_multiplier`| `float` | Combined contextual scaling multiplier |
