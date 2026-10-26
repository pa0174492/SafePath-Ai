# SafePath-AI Mathematical & Algorithmic Formulations

## 1. Graph Formulation
A pedestrian spatial network is represented as a multi-directed graph:
$$\mathcal{G} = (\mathcal{V}, \mathcal{E}, \mathbf{F}, \mathbf{I})$$
where $\mathcal{V}$ is the set of geographic intersection nodes, $\mathcal{E}$ is the set of directional sidewalk/crosswalk edges, $\mathbf{F}: \mathcal{E} \to \mathbb{R}^k$ maps static attributes (length, slope %, surface type, lighting flag, curb ramps), and $\mathbf{I}: \mathcal{E} \to [0, 1] \times [0, 1] \times \{\text{KNOWN}, \text{INFERRED}, \text{UNKNOWN}\}$ represents probabilistic accessibility inference and epistemic confidence.

---

## 2. Segment Arrival-Time Evaluation
For a path $\pi = (e_1, e_2, \dots, e_m)$ departing at timestamp $t_0$, the arrival timestamp at segment $e_i$ is computed recursively:
$$t_{\text{arr}}(e_1) = t_0, \quad t_{\text{arr}}(e_i) = t_{\text{arr}}(e_{i-1}) + \frac{\text{len}(e_{i-1})}{v_{\text{walk}}(\text{slope}(e_{i-1}))}$$
where walking speed is modeled via the modified Tobler gradient function:
$$v_{\text{walk}}(s) = v_0 \cdot \exp\left(-3.0 \cdot \max(0, s - 0.02)\right)$$

The environmental state at edge $e_i$ is evaluated strictly as:
$$S(e_i) = \text{ContextFusion}(e_i, t_{\text{arr}}(e_i))$$

---

## 3. Robust Multi-Objective Cost Vector
Each edge $e$ contributes a 6-dimensional cost vector $\mathbf{c}(e, t_{\text{arr}}) \in \mathbb{R}_{\ge 0}^6$:
$$\mathbf{c}(e, t_{\text{arr}}) = \begin{bmatrix}
\Delta t_e \\
\text{len}(e) \\
R_{\text{robust}}(e, t_{\text{arr}}) \cdot \frac{\text{len}(e)}{100} \\
B_{\text{access}}(e, \text{profile}) \\
E_{\text{env}}(e, t_{\text{arr}}) \\
C_{\text{complexity}}(e)
\end{bmatrix}$$

where the Robust Risk is:
$$R_{\text{robust}}(e, t_{\text{arr}}) = \mu_{\text{risk}}(e, t_{\text{arr}}) + \lambda \cdot \sigma_{\text{risk}}(e, t_{\text{arr}})$$

---

## 4. Multi-Objective Dominance & Search (BOA*)
A path cost vector $\mathbf{g}_1$ dominates $\mathbf{g}_2$ ($\mathbf{g}_1 \succ \mathbf{g}_2$) iff:
$$\forall j \in \{1, \dots, 6\}, \quad g_{1,j} \le g_{2,j} \quad \text{and} \quad \exists k \text{ s.t. } g_{1,k} < g_{2,k}$$

The BOA* search maintains label sets $\mathcal{L}(u)$ of non-dominated vectors reaching each node $u$. When exploring a new label $\mathbf{g}_{\text{new}}(v)$:
1. If $\exists \mathbf{g} \in \mathcal{L}(v)$ such that $\mathbf{g} \succ \mathbf{g}_{\text{new}}(v)$, prune $\mathbf{g}_{\text{new}}(v)$.
2. If $\exists \mathbf{g}_{\text{target}} \in \mathcal{L}(\text{target})$ such that $\mathbf{g}_{\text{target}} \succ \mathbf{g}_{\text{new}}(v)$, prune $\mathbf{g}_{\text{new}}(v)$.
3. Otherwise, remove all $\mathbf{g}' \in \mathcal{L}(v)$ dominated by $\mathbf{g}_{\text{new}}(v)$, insert $\mathbf{g}_{\text{new}}(v)$, and push to priority queue ordered by $f_1 = g_{\text{time}} + h_{\text{time}}(v, \text{target})$.
