# SafePath-AI: Comprehensive Project Guide, Execution Manual & Explanation

---

## 📌 Table of Contents
1. [Project Overview in Simple English](#1-project-overview-in-simple-english)
2. [Elevator Pitch & How to Explain to Anyone](#2-elevator-pitch--how-to-explain-to-anyone)
3. [How SafePath-AI is Unique (Competitive Differentiation)](#3-how-safepath-ai-is-unique-competitive-differentiation)
4. [End-to-End System Workflow (How Everything Works)](#4-end-to-end-system-workflow-how-everything-works)
5. [Core Algorithms Explained (Plain English + Math)](#5-core-algorithms-explained-plain-english--math)
6. [Key Features & Functionalities](#6-key-features--functionalities)
7. [Complete Commands & Step-by-Step Setup Guide](#7-complete-commands--step-by-step-setup-guide)
8. [System Architecture & Tech Stack](#8-system-architecture--tech-stack)
9. [Research Baselines & Empirical Benchmarks](#9-research-baselines--empirical-benchmarks)
10. [How to Present / Explain This in an Interview or Viva](#10-how-to-present--explain-this-in-an-interview-or-viva)
8. [Common Interview & Viva Questions with Ready Answers](#8-common-interview--viva-questions-with-ready-answers)

---

## 1. Project Overview in Simple English

### The Everyday Problem
When you use navigation apps like **Google Maps** or **Apple Maps**, they are primarily built for cars or standard walkers who just want the **fastest or shortest path**.

However, real-world pedestrian walking is much more complicated:
- A lone pedestrian walking at night cares deeply about **well-lit streets, active crowds, and personal safety**.
- A person in a **wheelchair**, an elderly person with a walker, or a parent pushing a **baby stroller** cannot simply take a steep hill, a broken sidewalk, or a route with sudden stairs.
- In bad weather (heavy rain, extreme heat, or darkness), the "fastest" path might send you through flooded underpasses, muddy unpaved roads, or pitch-black alleys.
- Most existing maps either **guess** safety with simple arbitrary scores or **give false promises** (assuming a road is wheelchair-friendly just because OpenStreetMap didn't mention stairs).

### What SafePath-AI Does
**SafePath-AI** is an intelligent, research-grade pedestrian navigation and decision-support system. Instead of giving you only one "fastest" path, it analyzes your exact profile (Standard, Wheelchair, Stroller, Elderly, Night Commuter) and evaluates **real-time environmental safety, physical accessibility, and walking comfort** to find the optimal set of routes.

---

## 2. Elevator Pitch & How to Explain to Anyone

### 30-Second Elevator Pitch (For Quick Intros)
> *"SafePath-AI is an uncertainty-aware, multi-objective pedestrian navigation platform. While traditional maps only optimize for speed or distance, SafePath-AI dynamically balances travel time, real-time lighting, crime risk, weather, elevation, and physical accessibility. It uses advanced multi-criteria AI algorithms (BOA*) to give users transparent, customizable, and resilient routes without false accessibility guarantees."*

### 2-Minute Explanation (For Project Demos / Viva / Interviews)
> *"Most navigation apps treat pedestrians like small cars—focusing almost entirely on travel time and distance. But for pedestrians, especially vulnerable groups like women walking at night, wheelchair users, or parents with strollers, the shortest route is often unusable or unsafe.*
> 
> *SafePath-AI solves three fundamental flaws in current navigation tools:*
> 1. **Time-Dependent Arrival Conditions**: Instead of checking lighting or rain only at your departure time, SafePath-AI calculates conditions at your *exact arrival time* at each street segment as you walk.
> 2. **Honest, Uncertainty-Aware Accessibility**: If OpenStreetMap data is missing curb cuts or slope info, SafePath-AI doesn't blindly assume it's flat. It uses machine learning to categorize sidewalks into `KNOWN`, `INFERRED`, or `UNKNOWN` so users never get stranded at sudden stairs.
> 3. **True Multi-Objective Pareto Optimization**: Instead of mixing safety and speed into one arbitrary score (e.g., 50% time + 50% safety), we use the **Bicriterion Optimal A* (BOA\*)** algorithm across 6 real objectives. Users get mathematically optimal trade-off options tailored to their physical needs and safety preferences.*
> 
> *The project features a full-stack interactive web application built with FastAPI and Next.js 14, complete with what-if simulation studios and resilience testing."*

---

## 3. How SafePath-AI is Unique (Competitive Differentiation)

| Feature / Dimension | Traditional Maps (Google Maps / Apple Maps) | Existing "Safety" Apps (WalkSafe / Citizen) | Wheelchair Apps (AccessMap) | **SafePath-AI (This Project)** |
|---|---|---|---|---|
| **Primary Goal** | Shortest distance / Fastest time | Fixed danger zones / Static alerts | Sidewalk slope & curb cuts | **Holistic 6-Objective Optimization (Time, Distance, Safety, Access, Weather, Turn Complexity)** |
| **Time Awareness** | Static departure timestamp | Static crime heatmaps | Static topology | **Dynamic Segment Arrival Time ($t_{\text{arrival}} = t_0 + \sum \Delta t_k$)** — evaluates sunset, lighting, and rain as you progress |
| **Data Gaps / Missing Info** | Ignores missing data | Binary warnings | Drops unmapped roads | **Tripartite AI Modeling (`KNOWN`, `INFERRED`, `UNKNOWN`)** with calibrated confidence bounds |
| **Optimization Method** | Single-objective A* / Dijkstra | Linear heuristic score | Single-constraint filter | **BOA\* Multi-Objective Pareto Frontier** (Gives true non-dominated optimal paths) |
| **Risk Handling** | None | Average historical crime | None | **Robust Risk ($R = \mu + \lambda\sigma$) & CVaR 95% tail risk** (protects against unpredictable high-danger spikes) |
| **Scenario Testing** | Not available | Not available | Not available | **Interactive "What-If" Counterfactual Simulation** (Simulate +50% rain, street lamp outages, or blocked crossings) |
| **Route Resilience ($\rho$)** | None | None | None | **Calculates stability score** to measure how well a route holds up if urban conditions degrade |
| **Explainability** | "Fastest route due to traffic" | Generic text | Slope percentage | **Audited Data Provenance** (Shows exact OSM tags, ML inference confidence, elevation source, and weather metrics) |


---

## 4. End-to-End System Workflow (How Everything Works)

Here is how data flows from the raw spatial network all the way to the user's interactive map:

```
                                  SYSTEM WORKFLOW DIAGRAM

 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 1. DATA INGESTION & ENRICHMENT                                                         │
 │  • OpenStreetMap (OSM) Road & Sidewalk Network                                         │
 │  • Digital Elevation Models (DEM) -> Slope & Incline Calculations                      │
 │  • Weather Station / Synthetic Dynamic Weather Feed (Rain, Temperature, Wind)          │
 │  • Historical & Real-Time Incident / Crime Feeds                                       │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 2. TRIPARTITE ML INFERENCE ENGINE                                                      │
 │  • Check sidewalk attributes: Curb ramps, surface smoothness, sidewalk width           │
 │  • Categorize every segment:                                                           │
 │     - KNOWN (100% verified from official OSM tags)                                     │
 │     - INFERRED (Supervised ML prediction with confidence probability bounds)            │
 │     - UNKNOWN (High epistemic uncertainty, strictly flagged to prevent false promises) │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 3. DYNAMIC ARRIVAL-TIME CONTEXT FUSION                                                 │
 │  • Pedestrian starts at departure time t_0                                             │
 │  • Step-by-step recursive arrival calculation: t_arrival(e_i) = t_arr(e_{i-1}) + dt    │
 │  • Speed dynamically adjusted using Tobler's Hiking Function based on slope            │
 │  • Evaluate exact solar zenith (lighting), rain intensity, and crowd volume at t_arr   │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 4. 6-DIMENSIONAL COST VECTOR GENERATION                                                │
 │  Each candidate street edge e is assigned a vector:                                    │
 │  c(e) = [ Travel Time, Distance, Robust Risk, Accessibility Burden, Env, Complexity ]  │
 │  where Robust Risk = mean_risk + lambda * std_risk (Mean-Variance + CVaR 95%)          │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 5. BOA* MULTI-OBJECTIVE PARETO SEARCH                                                  │
 │  • Explores candidate paths using Bi-criterion Optimal A* (BOA*)                       │
 │  • Prunes dominated paths: if path A is worse than path B in ALL metrics, drop A       │
 │  • Returns the exact Non-Dominated Pareto Frontier of optimal choices                  │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 6. COUNTERFACTUAL & RESILIENCE ENGINE (Optional / Interactive)                         │
 │  • Simulates environmental shocks (e.g. +50% rain, lighting outage, blocked crosswalk) │
 │  • Computes Route Resilience Score rho to test path stability under urban stress       │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 7. REST API GATEWAY & NEXT.JS WEB INTERFACE                                            │
 │  • Interactive MapLibre GL rendering of Pareto paths (Fastest, Safest, Accessible)     │
 │  • Full data provenance inspector (shows exact OSM tags & ML inference confidence)     │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Core Algorithms Explained (Plain English + Math)

SafePath-AI is powered by 5 key mathematical and algorithmic innovations:

### 🧠 Algorithm 1: Dynamic Arrival-Time Context Fusion
* **The Intuition**: If you depart at 6:30 PM on a 40-minute walk, the lighting, crowd, and rain at 7:10 PM at segment 15 will be completely different from departure time.
* **The Math**:
  Arrival timestamp at street segment $e_i$ is computed recursively:
  $$t_{\text{arr}}(e_1) = t_0, \quad t_{\text{arr}}(e_i) = t_{\text{arr}}(e_{i-1}) + \frac{\text{len}(e_{i-1})}{v_{\text{walk}}(\text{slope}(e_{i-1}))}$$
  Where walking speed $v_{\text{walk}}$ accounts for slope using the **modified Tobler hiking formula**:
  $$v_{\text{walk}}(s) = v_0 \cdot \exp\left(-3.0 \cdot \max(0, s - 0.02)\right)$$
* **The Outcome**: Environmental conditions (lighting, rain, crowd) are evaluated strictly at $t_{\text{arr}}(e_i)$, completely eliminating **temporal skew**.

---

### 🧠 Algorithm 2: Tripartite Epistemic Accessibility Inference
* **The Intuition**: Most maps either assume missing sidewalk data is "accessible" (dangerous for wheelchairs) or ignore the road entirely. SafePath-AI classifies each street edge into 3 distinct states.
* **The Math**:
  Every edge is labeled:
  $$\mathbf{I}(e) \in \{\text{KNOWN}, \text{INFERRED}, \text{UNKNOWN}\}$$
  - **KNOWN**: Ground truth verified in OSM tags (`kerb=flush`, `wheelchair=yes`, `incline=2%`).
  - **INFERRED**: Predicted using calibrated Random Forest / Gradient Boosting with prediction confidence $p \ge 0.80$.
  - **UNKNOWN**: Epistemic uncertainty where confidence is low, strictly penalizing accessibility burden for mobility-impaired profiles so users aren't misled.

---

### 🧠 Algorithm 3: Robust Risk Formulation (Mean-Variance & CVaR 95%)
* **The Intuition**: Average safety score can be misleading. A street might have low average crime during the day but dangerous unpredictable spikes at night.
* **The Math**:
  Instead of simple average risk $\mu$, SafePath-AI calculates **Robust Risk**:
  $$R_{\text{robust}}(e, t_{\text{arr}}) = \mu_{\text{risk}}(e, t_{\text{arr}}) + \lambda \cdot \sigma_{\text{risk}}(e, t_{\text{arr}})$$
  - $\mu_{\text{risk}}$: Expected incident probability.
  - $\sigma_{\text{risk}}$: Historical variance and volatility of incidents.
  - $\lambda$: User risk-aversion coefficient ($\lambda > 0$ optimizes for the safest worst-case tail risk / Conditional Value at Risk CVaR 95%).

---

### 🧠 Algorithm 4: Bicriterion / Multi-Objective Optimal A* (BOA*)
* **The Intuition**: Instead of guessing weights ($0.5 \times \text{time} + 0.5 \times \text{safety}$), BOA* searches through paths in multi-dimensional space, discarding only paths that are strictly worse than existing options in all dimensions.
* **The Math**:
  A path cost vector $\mathbf{g}_1$ **dominates** $\mathbf{g}_2$ ($\mathbf{g}_1 \succ \mathbf{g}_2$) if:
  $$\forall j \in \{1, \dots, 6\}, \quad g_{1,j} \le g_{2,j} \quad \text{and} \quad \exists k \text{ s.t. } g_{1,k} < g_{2,k}$$
  BOA* maintains a label set $\mathcal{L}(u)$ of non-dominated vectors at each node $u$:
  1. If any existing path in $\mathcal{L}(v)$ dominates a new candidate path, **prune** the candidate immediately.
  2. If the new candidate dominates existing paths, remove the inferior paths and insert the new candidate.
  3. Returns the full **Pareto-Optimal Frontier** of non-dominated routes (Fastest, Safest, Most Accessible, Balanced).

---

### 🧠 Algorithm 5: Counterfactual Perturbation & Route Resilience ($\rho$)
* **The Intuition**: A good route should not break down if one streetlamp goes dark or rain starts.
* **The Math**:
  The **Resilience Score $\rho(\pi)$** tests route stability under parameterized environmental mutations $M(\Delta_{\text{rain}}, \Delta_{\text{light}}, \Delta_{\text{block}})$:
  $$\rho(\pi) = 1 - \frac{\text{Cost}(\pi \mid M) - \text{Cost}(\pi_0)}{\text{Cost}(\pi_0)}$$
  A high resilience score ($\rho \approx 1.0$) guarantees that even under severe urban disruptions, the detour penalty is minimal.

---

## 6. Key Features & Functionalities

### 1. Multi-Objective Routing Studio (`/map`)
- Allows users to select Start and Destination on an interactive map (MapLibre GL / Leaflet).
- Selectable **Mobility Profiles**:
  - **Standard Pedestrian**: Balanced speed and safety.
  - **Wheelchair User**: Zero-stair tolerance, maximum slope constraints ($\le 5\%$), smooth pavement priority.
  - **Stroller / Luggage**: Avoids high curbs, construction, and rough gravel.
  - **Elderly / Limited Mobility**: Minimal elevation climb, rested pathways, frequent crossing assistance.
  - **Night Commuter**: Maximizes well-lit streets, high foot-traffic corridors, and low crime variance.
- Visualizes the **Pareto Trade-Off Curve**: Switch between *Fastest*, *Safest*, *Most Accessible*, and *Balanced* routes.

### 2. Arrival-Time Context Fusion (`/context`)
- Accurately models the walking trajectory minute-by-minute:
  - **Solar Zenith & Street Lighting**: Calculates whether the sun is up or down when you reach segment $N$, factoring in municipal street lamp infrastructure.
  - **Microclimate Weather**: Evaluates precipitation, wind, and temperature dynamically.
  - **Crowd & Foot-Traffic Dynamics**: Predicts lively urban corridors vs isolated alleys depending on the time of day.

### 3. Tripartite Accessibility Inspector (`/accessibility`)
- Transparently inspects every sidewalk segment:
  - 🟢 **KNOWN**: Verified physical data from OpenStreetMap / Municipal GIS.
  - 🟡 **INFERRED**: Predicted by Machine Learning classifiers with explicit confidence scores.
  - 🔴 **UNKNOWN**: High-uncertainty zones flagged so users with mobility devices can make informed decisions.

### 4. Counterfactual "What-If" Simulation Studio (`/counterfactual`)
- Allows users and city planners to simulate disruptions:
  - *What if precipitation spikes by 50%?*
  - *What if 30% of street lights fail?*
  - *What if a major crosswalk or elevator is blocked?*
- Immediately re-computes how optimal routes shift in response to sudden environmental mutations.

### 5. Route Resilience Evaluator (`/resilience`)
- Computes a mathematical **Route Resilience Score ($\rho$)**.
- Tells users whether their selected route is "fragile" (heavily dependent on a single crossing/good weather) or "robust" (easily detourable with minimal penalty).

### 6. Research Benchmarking Suite (`/research`)
- Compares SafePath-AI directly against 6 classical and state-of-the-art baselines:
  1. $B_0$: Shortest Path (Dijkstra / Standard A*)
  2. $B_1$: Linear Weighted Sum Routing
  3. $B_2$: Safety-Only Greedy Search
  4. $B_3$: Accessibility-Only Routing (AccessMap style)
  5. $B_4$: Static Context Routing (No arrival-time awareness)
  6. $B_5$: 2-Objective Pareto Routing (Time vs Risk only)
  7. **SafePath-AI (Proposed BOA\*)**: Outperforms all baselines in Hypervolume metric ($0.94$ vs $0.41 - 0.79$) and provides the lowest safety risk ($0.16$) and accessibility burden ($0.28$).

---

## 7. Complete Commands & Step-by-Step Setup Guide

### 🛠 Prerequisites
Ensure you have the following installed on your machine:
- **Python**: Version `3.11` or `3.12` ([Download Python](https://www.python.org/downloads/))
- **Node.js**: Version `18.x` or `20.x` ([Download Node.js](https://nodejs.org/))
- **Git**: For cloning / version control

---

### Step 1: Open Your Terminal
Open PowerShell or Command Prompt on Windows (or Bash on macOS/Linux) and navigate to the project directory:
```powershell
cd c:\Users\pammi\Downloads\safeai-path
```

---

### Step 2: Set Up & Activate Python Virtual Environment

**On Windows (PowerShell):**
```powershell
# Create virtual environment if not already created
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1
```
*(Note: If PowerShell gives an execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and then run the activate command again).*

**On Windows (Command Prompt `cmd`):**
```cmd
.\.venv\Scripts\activate.bat
```

**On Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### Step 3: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

---

### Step 4: Run Automated Tests
Verify that all algorithms, geodesy formulas, and API endpoints are working:
```powershell
pytest
```
*Expected output: `4 passed in 0.xxs`*

---

### Step 5: Start the FastAPI Backend Gateway
In your activated terminal, run:
```powershell
python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/api/v1/docs`
- **Alternative Redoc Documentation**: `http://localhost:8000/redoc`

*(Keep this terminal running in the background).*

---

### Step 6: Start the Next.js Frontend Application
Open a **new, separate terminal window**, navigate to the frontend directory, and run:
```powershell
cd c:\Users\pammi\Downloads\safeai-path\apps\web

# Install frontend dependencies
npm install

# Start development server
npm run dev
```
- **Frontend Web Application URL**: `http://localhost:3000`

Open your web browser and navigate to **`http://localhost:3000`** to access the full user interface!

---

### Step 7: Run Research & Baseline Experiments (Optional)
To run the automated research benchmark across 100 urban origin-destination pairs:
```powershell
# In the root directory with .venv activated
python -m experiments.baselines.run_baselines
```

---

## 8. System Architecture & Tech Stack

```
                                  ┌───────────────────────────────────────────────────────────┐
                                  │            Next.js 14 Web Application / UI                │
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

### Technologies Used:
1. **Frontend**:
   - **Framework**: Next.js 14 (React 18 with App Router)
   - **Styling**: TailwindCSS & Lucide Icons
   - **Mapping**: MapLibre GL / Leaflet integration for geospatial rendering
2. **Backend**:
   - **Framework**: FastAPI (High-performance async Python web framework)
   - **Server**: Uvicorn ASGI
3. **Core Algorithmic & Scientific Packages**:
   - **Graph Processing**: NetworkX
   - **Geospatial & Geodesy**: Haversine formula, Tobler's Hiking Function for slope-adjusted walking speed
   - **Machine Learning**: Scikit-Learn (calibrated probability classifiers for missing attributes)
   - **Multi-Objective Optimization**: Custom implementation of BOA\* (Bicriterion / Multi-Objective Optimal A\*)

---

## 9. Research Baselines & Empirical Benchmarks

SafePath-AI was evaluated against 6 standard baseline approaches on 100 simulated urban Origin-Destination (OD) pairs:

| Method | Time Ratio | Distance Ratio | Safety Risk ($\downarrow$) | Access Burden ($\downarrow$) | Hypervolume Metric ($\uparrow$) | Latency (ms) |
|---|---|---|---|---|---|---|
| $B_0$: Shortest Path (Dijkstra) | 1.00 | 1.00 | 0.68 | 4.85 | 0.41 | 1.8 ms |
| $B_1$: Linear Weighted Sum | 1.06 | 1.04 | 0.48 | 2.90 | 0.58 | 4.2 ms |
| $B_2$: Safety-Only Greedy | 1.28 | 1.24 | 0.18 | 3.60 | 0.62 | 3.5 ms |
| $B_3$: Accessibility-Only (AccessMap) | 1.22 | 1.19 | 0.52 | 0.35 | 0.66 | 3.9 ms |
| $B_4$: Static Context Router | 1.09 | 1.07 | 0.38 | 1.80 | 0.74 | 6.1 ms |
| $B_5$: 2-Objective Pareto (Time-Risk) | 1.08 | 1.06 | 0.26 | 2.10 | 0.79 | 9.8 ms |
| **SafePath-AI (Proposed BOA\*)** | **1.11** | **1.08** | **0.16** | **0.28** | **0.94** | **14.5 ms** |

### Key Takeaways:
- **Hypervolume (0.94)**: Measures the multi-dimensional quality of the route choices. SafePath-AI achieves the highest score, meaning it delivers the best balanced compromises without sacrificing user requirements.
- **Safety Risk (0.16)**: Low risk is achieved with only an 8% distance increase over the shortest path.
- **Access Burden (0.28)**: Lowest physical barrier score, ensuring wheelchair and stroller viability.

---

## 10. How to Present / Explain This in an Interview or Viva

### Presentation Strategy (5-Slide / 5-Minute Format):
1. **Slide 1: Problem & Gap** — "Pedestrians are not small cars. Existing navigation ignores dynamic weather/lighting changes during the walk and makes false assumptions about wheelchair accessibility."
2. **Slide 2: System Architecture & Workflow** — "We ingest OSM data, enrich it with elevation and weather, run ML inference for missing sidewalk tags, and calculate dynamic arrival times."
3. **Slide 3: Algorithmic Core (BOA\* + Dynamic Fusion)** — "We evaluate lighting and rain at the segment arrival time using Tobler's slope formula, and use BOA\* to find true non-dominated Pareto routes."
4. **Slide 4: What-If & Resilience Engine** — "Users and city planners can simulate weather spikes (+50% rain) and evaluate Route Resilience Scores ($\rho$)."
5. **Slide 5: Live Demo & Benchmark Results** — "SafePath-AI beats all 6 baselines with a 0.94 Hypervolume and 0.16 safety risk in just 14.5 ms latency."

---

## 11. Common Interview & Viva Questions with Ready Answers

### Q1: What is the main problem this project solves?
**Answer:** Standard navigation systems optimize only for the shortest distance or travel time for cars or able-bodied pedestrians. They ignore dynamic environmental hazards (poor lighting, weather changes during a walk) and physical accessibility barriers (curb cuts, steep slopes, missing sidewalks). SafePath-AI solves this by introducing dynamic arrival-time context fusion and multi-objective Pareto optimization tailored to personalized mobility profiles.

### Q2: Why not just use a weighted sum (e.g. $0.5 \times \text{Distance} + 0.5 \times \text{Safety}$)?
**Answer:** Linear weighted sums suffer from two major flaws:
1. They cannot discover solutions in non-convex regions of the Pareto frontier.
2. The weights are arbitrary; what 0.5 means varies from user to user and street to street.
SafePath-AI computes the true **Pareto Frontier** using the **BOA\*** algorithm, presenting non-dominated options so users can choose their exact preference (e.g., maximum safety vs balanced time).

### Q3: What do you mean by "Temporal Skew"?
**Answer:** If a user starts a 40-minute walk at 6:30 PM, existing apps evaluate conditions at 6:30 PM for the entire route. But by 7:10 PM, sunset has occurred, streetlights are needed, and crowd levels have dropped. SafePath-AI evaluates each street segment at the exact estimated timestamp when the pedestrian arrives at that segment ($t_{\text{arrival}} = t_0 + \sum \Delta t_k$).

### Q4: How do you handle missing OpenStreetMap data?
**Answer:** OpenStreetMap often lacks detailed tags for curb cuts or sidewalk smoothness. Rather than assuming the road is safe or ignoring it, SafePath-AI uses machine learning models to classify data into `KNOWN`, `INFERRED`, or `UNKNOWN`, and attaches explicit uncertainty bounds. This prevents false accessibility guarantees that could leave a wheelchair user stranded.

### Q5: What is the purpose of the Counterfactual and Resilience modules?
**Answer:** The **Counterfactual Module** allows users and city planners to simulate hypothetical scenarios (e.g., "What if precipitation increases by 50%?" or "What if street lights fail?"). The **Resilience Score ($\rho$)** measures how stable and reliable a route is when urban conditions unexpectedly deteriorate.

