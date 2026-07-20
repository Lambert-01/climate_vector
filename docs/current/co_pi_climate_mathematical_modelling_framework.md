# Co-PI Climate Analytics, Mathematical Modelling and Risk Forecasting Framework

**Project:** AI-Enabled Community-Based Early Warning Systems Integrating Essential Climate Variables and Aedes Mosquito Surveillance for Dengue Prevention in the African Great Lakes Region  
**Funding context:** Nexa Climate and Health Innovation, Proof of Concept  
**Scientific lead:** Co-PI NDACYAYISENGA Lambert, University of Rwanda  
**Version:** 1.0, 20 July 2026

## 1. Scientific leadership and purpose

Co-PI NDACYAYISENGA Lambert leads the integration of essential climate variables,
mathematical model design, predictive modelling, uncertainty quantification, model
validation and risk forecasting. This is a scientific leadership role, not only a
software-development role. The purpose of the work package is to convert climate,
entomological, genomic, epidemiological and community observations into transparent,
validated and actionable dengue-risk information for local health actors.

The current platform is a pre-developed proof-of-concept architecture. It already
calculates climate-screening and effort-standardized entomological indices. It does
not yet contain a locally trained or prospectively validated dengue outbreak model,
because the required prospective Aedes observations and governed dengue outcomes
have not yet been collected. The funded pilot is designed to generate that evidence,
fit the proposed models and test whether their signals improve surveillance and
response decisions.

## 2. Alignment with the proposal and Nexa challenge

| Proposal need | Co-PI mathematical contribution | Operational output |
|---|---|---|
| Integrate essential climate variables | Harmonize temperature, rainfall, humidity, vegetation, land surface temperature, land use, elevation and hydrology by place and time | Quality-controlled climate feature store |
| Explain climate-Aedes relationships | Estimate nonlinear exposure-response functions and delayed effects | Interpretable climate-lag profiles |
| Forecast dengue risk | Develop probabilistic spatiotemporal models and machine-learning benchmarks | District-period risk probability with uncertainty |
| Guide Aedes surveillance | Standardize trap and container observations by sampling effort | Comparable vector indices and priority locations |
| Support timely action | Translate validated risk into governed, human-reviewed thresholds | Review signal, field-verification task and response record |
| Learn across the Great Lakes region | Evaluate temporal and geographic transportability | Cross-border evidence map and external-validation results |

This directly supports Nexa's requirement to turn climate-risk signals into timely
health-service action. The innovation is not a dashboard alone. It is a governed
learning system connecting climate evidence, prospective surveillance, probabilistic
modelling, human review, field verification and feedback.

## 3. What mathematics is applied now

### 3.1 Climate aggregation

For district `d` and day `t`, accumulated rainfall is computed over operational
windows:

\[
R_{7,d,t}=\sum_{\ell=0}^{6} P_{d,t-\ell}, \qquad
R_{30,d,t}=\sum_{\ell=0}^{29} P_{d,t-\ell}.
\]

Where available, a simple recent moisture-balance term is calculated as

\[
B_{7,d,t}=R_{7,d,t}-ET0_{7,d,t},
\]

where `P` is precipitation and `ET0` is reference or potential
evapotranspiration. These summaries support field planning; they are not disease
outcomes.

### 3.2 Literature-informed Aedes thermal suitability

The current screening model uses the published approximate thermal limits for
*Aedes aegypti*-borne virus transmission: `T_min = 17.8 C`,
`T_opt = 29.1 C` and `T_max = 34.6 C`. A normalized asymmetric
response is used:

\[
S_T(T)=
\begin{cases}
0, & T\leq T_{min}\text{ or }T\geq T_{max},\\
\max\left(0,1-\left(\frac{T-T_{opt}}{T_{opt}-T_{min}}\right)^2\right),
& T<T_{opt},\\
\max\left(0,1-\left(\frac{T-T_{opt}}{T_{max}-T_{opt}}\right)^2\right),
& T\geq T_{opt}.
\end{cases}
\]

This function is a biologically informed screening curve. Its parameters are not
claimed to be locally estimated for Rwanda or the Great Lakes region. Prospective
data will be used to estimate and compare local temperature-response functions.

### 3.3 Rainfall suitability

The descriptive rainfall component combines short- and medium-window accumulation:

\[
S_R=\operatorname{clip}_{[0,1]}\left[
0.45\min\left(\frac{R_7}{35},1\right)+
0.55\min\left(\frac{R_{30}}{120},1\right)
\right]F,
\]

where `F = 0.75` when seven-day rainfall exceeds 90 mm and `F = 1` otherwise. The
penalty represents a transparent provisional flushing assumption. It must be
re-estimated or removed after local field evidence becomes available.

### 3.4 Existing-evidence component

Current historical evidence is normalized as

\[
S_E=\operatorname{clip}_{[0,1]}\left[
0.85\min\left(\frac{N_d}{50},1\right)+0.15I(GPS_d)
\right],
\]

where `N_d` is the number of relevant historical mosquito records and `I(GPS_d)`
indicates usable geolocation. Legacy Anopheles evidence is retained only as field
infrastructure and ecological context; it is not treated as Aedes abundance.

### 3.5 District climate-screening index

The current district index is

\[
CSI_{d,t}=0.42S_T+0.40S_R+0.18S_E.
\]

A companion nonlinear prioritization proxy is

\[
VCP^*_{d,t}=S_T^{1.4}S_R^{1.1}(0.35+0.65S_E).
\]

Both are bounded, transparent prioritization tools. They rank locations for evidence
review and field verification. They do not estimate dengue incidence, causal effects,
the basic reproduction number or outbreak probability.

### 3.6 Live Climate Suitability Index

The live-weather service combines temperature, humidity, rainfall, water balance and
dewpoint components:

\[
LCSI=0.32S_T+0.22S_H+0.26S_R+0.12S_B+0.08S_D.
\]

The operational Field Window Index is

\[
FWI=0.45(1-S_R)+0.30S_T+0.25S_H.
\]

LCSI supports habitat follow-up prioritization. FWI supports practical scheduling of
field activities. Neither is a confirmed vector-abundance or transmission estimate.

### 3.7 Prospective Aedes surveillance indices

Once reviewed observations are collected, the system computes:

\[
CI=100\frac{C_{positive}}{C_{inspected}}, \qquad
EOT=\frac{eggs}{retrieved\ ovitraps}, \qquad
ADT=\frac{adult\ mosquitoes}{trap\ hours/24}.
\]

The container index, eggs per retrieved ovitrap and adults per 24 trap-hours preserve
their denominators. Counts without sampling effort are not compared as if exposure
were equal.

## 4. Model development during the funded pilot

### Stage 0: governed analytical dataset

Before training, the team will establish source lineage, definitions, coordinate
checks, temporal completeness, effort denominators, duplicate controls, missingness
profiles and outcome governance. Climate values will be aligned to surveillance and
health observations without using future information.

### Stage 1: Aedes abundance model

Effort-standardized eggs, larvae or adults will be modelled using a negative-binomial
generalized additive mixed model:

\[
Y_i\sim NB(\mu_i,\kappa),
\]

\[
\log(\mu_i)=\log(E_i)+\beta_0+f_T(T_i)+f_R(R_i)+
\boldsymbol{\beta}^{T}\mathbf{X}_i+u_{site(i)}+v_{time(i)}.
\]

`E_i` is sampling effort and enters as an offset. Smooth functions estimate
nonlinear climate relationships; `X_i` may include humidity, NDVI, land use,
elevation and hydrological context. Site and time effects account for repeated
observations. Zero inflation will be introduced only if diagnostics demonstrate that
a standard negative-binomial model is inadequate.

### Stage 2: delayed climate effects

Distributed lag nonlinear models will estimate both exposure-response and lag-response
relationships:

\[
\log(\mu_{d,t})=\alpha+CB_T(T_{d,t},\ell)+CB_R(R_{d,t},\ell)+
\boldsymbol{\gamma}^{T}\mathbf{Z}_{d,t}+u_d+v_t,
\]

where `CB` denotes a cross-basis over exposure and lag `l`. Candidate lag windows
will be pre-specified from vector biology and compared using out-of-sample performance,
not selected from the full dataset after seeing the outcome.

### Stage 3: Bayesian spatiotemporal dengue early warning

Where partner-approved district-period dengue counts are available:

\[
Y_{d,t}\sim NB(\mu_{d,t},\phi),
\]

\[
\log(\mu_{d,t})=\log(Pop_{d,t})+\alpha+CB_{climate,d,t}+
\beta_A Aedes_{d,t}+\beta_G Genomic_{d,t}+\beta_C Community_{d,t}+
u_d+v_t+w_{d,t}.
\]

The population term is an offset. `u_d` represents structured and unstructured
spatial variation, `v_t` represents temporal dependence, and `w_{d,t}` represents
space-time interaction. The model will return posterior uncertainty and a governed
exceedance probability such as

\[
Pr(Y_{d,t+h}>\tau_{d,t+h}\mid\mathcal{D}),
\]

not only a high/medium/low label.

### Stage 4: machine-learning benchmarks

Regularized regression, Random Forest and gradient boosting will be trained as
predictive benchmarks using the same feature availability dates, spatial units and
validation folds. They will not be presented as superior because of in-sample fit.
Their value will be determined by calibration, lead time, geographic transportability,
false-alert burden and decision usefulness relative to simpler baselines.

Genomic, mobility and community variables will be included only after governance and
quality checks. Features recorded after the forecast issue date will be excluded to
prevent leakage.

## 5. Validation protocol

Model validation will answer whether the system works in new periods and new places.

1. **Temporal validation:** rolling-origin evaluation with a fixed forecast horizon.
2. **Spatial validation:** leave-one-district-out and, where possible, leave-one-country-out evaluation.
3. **Baseline comparison:** seasonal historical average, persistence and climate-only models.
4. **Calibration:** calibration plots, intercept, slope and Brier score.
5. **Rare-event discrimination:** precision-recall AUC, sensitivity, specificity, precision and recall.
6. **Operational value:** useful lead time, alerts per district-month, false-alert burden, verification workload and action completion time.
7. **Uncertainty:** confidence or credible intervals, missing-data sensitivity and model-version traceability.
8. **Equity and robustness:** subgroup and geography checks where sample size and governance allow.

No threshold will be declared operational solely because it maximizes a statistical
metric. Thresholds will be co-designed with health actors by balancing missed events,
false alerts, response capacity and the cost of field verification.

## 6. Evidence required for each model stage

| Evidence | Minimum analytical fields | Purpose |
|---|---|---|
| Climate | source, variable, unit, timestamp, latitude/longitude, QC flag | Exposure and lag features |
| Aedes surveillance | species/group, count, method, effort, date, coordinates, QC status | Vector outcome and mediator |
| Container survey | inspected and positive containers, type, location, date | Container index |
| Dengue outcome | suspected/confirmed definition, count, district, period, reporting completeness | Forecast target |
| Genomics | sample/pool ID, collection chain, QC, result, serotype, sequence metadata | Pathogen evidence |
| Population and mobility | geography, period, denominator, governance | Exposure offset and connectivity |
| Intervention | action, date, place, coverage | Confounding and impact assessment |
| Community report | consent, place/time, source type, verification status | Participatory signal |

Missing outcome data cannot be solved by downloading more climate data. ERA5-Land,
NASA POWER and Open-Meteo strengthen exposure measurement, but only prospective Aedes
and governed dengue observations can train and validate vector and disease models.

## 7. Model and alert governance

Every analytical output must include a model ID, version, issue time, input-data
window, geographic scope, uncertainty, limitations and validation status. The current
versions `aedes-screen-v1`, `lcsi-v1` and `aedes-indices-v1` are screening or
descriptive models.

A model score does not automatically become a public-health alert. The operational
chain is:

**data validation -> model signal -> technical review -> field verification ->
authorized decision -> response action -> outcome feedback.**

Only a frozen model with documented lineage, out-of-sample validation, calibration
review and public-health approval may generate an operational dengue early-action
signal. Final alert authority remains with the designated health institution.

## 8. Audience-aware communication

The platform should not present the same detail to every audience.

| Audience | Primary questions | Interface output |
|---|---|---|
| Policymaker | Where is attention needed, why, how certain, and what action is pending? | Ranked map, evidence status, confidence, action owner and trend |
| District health team | What should be verified and by when? | Review queue, site details, field task and response status |
| Entomologist | Is vector evidence comparable and biologically credible? | Trap method, effort, count, species, indices and QC flags |
| Epidemiologist | Is risk calibrated and useful at the required horizon? | Outcome definition, forecast probability, calibration, lead time and errors |
| Climate scientist | Which variables, anomalies and lag structures contribute? | Source lineage, units, time windows, diagnostics and sensitivity |
| Community actor | What verified local action is required? | Short location-specific instruction and feedback channel |
| Funder/reviewer | Is the innovation credible, testable and scalable? | Readiness, evidence boundary, milestones, validation and adoption metrics |

Equations belong in scientific documentation and model cards. The policymaker
dashboard should display interpretation, confidence, provenance and action, using
minimal text and no unexplained formula notation.

## 9. Co-PI work packages and deliverables

### WP1: Climate data engineering, months 0-6

- Finalize the ECV dictionary, units, spatial resolution and update frequency.
- Build reproducible harmonization and anomaly pipelines.
- Compare satellite/reanalysis products with available station observations.
- Publish data-quality and provenance reports.

### WP2: Climate-vector modelling, months 4-12

- Define effort-standardized Aedes outcomes.
- Estimate nonlinear and lagged climate associations.
- Produce versioned abundance and suitability model cards.
- Conduct internal spatial and temporal validation.

### WP3: Dengue risk forecasting, months 9-18

- Create the governed district-period analytical cohort.
- Train statistical models and machine-learning benchmarks.
- Quantify calibration, uncertainty, lead time and transportability.
- Freeze the first candidate forecast model for prospective testing.

### WP4: Prospective operational validation, months 15-24

- Run forecasts without changing the evaluation target retrospectively.
- Compare signals with subsequent surveillance and dengue observations.
- Co-design thresholds and escalation rules with health actors.
- Report false alerts, missed events, field workload and completed actions.

### WP5: Capacity, reproducibility and policy translation, throughout

- Maintain reproducible Python pipelines, tests, model registry and audit trail.
- Train project analysts and designated health-team users.
- Produce concise policy briefs, scientific model cards and technical handover material.
- Document conditions required for responsible Great Lakes expansion.

## 10. Recommended proposal language

Use:

> We will develop and prospectively validate probabilistic dengue risk forecasts by
> integrating essential climate variables with effort-standardized Aedes surveillance,
> governed dengue outcomes, genomic evidence and community signals.

Avoid claiming that the current system already provides accurate outbreak prediction.

Use:

> Validated model signals will enter a human-reviewed early-action workflow linking
> technical review, field verification, authorized response and outcome feedback.

Avoid describing current automated scores as official alerts.

## 11. Co-PI profile paragraph for the application

**Co-PI NDACYAYISENGA Lambert (University of Rwanda)** is an applied mathematician,
climate-health modeller and software engineer specializing in climate data analytics,
nonlinear and spatiotemporal modelling, predictive validation and decision-support
systems. He will lead the integration and quality control of essential climate
variables, development of climate-vector and dengue-risk models, uncertainty and
forecast evaluation, model governance, and translation of validated signals into
health-action workflows. He will also oversee reproducible Python engineering,
technical capacity strengthening and the scientific documentation required for
responsible scale-up across the African Great Lakes region.

## 12. Scientific references

1. Mordecai EA et al. Detecting the impact of temperature on transmission of
   Zika, dengue, and chikungunya using mechanistic models. *PLOS Neglected Tropical
   Diseases*. 2017;11(4):e0005568. https://doi.org/10.1371/journal.pntd.0005568
2. Lowe R et al. Nonlinear and delayed impacts of climate on dengue risk in
   Barbados: a modelling study. *PLOS Medicine*. 2018;15(7):e1002613.
   https://doi.org/10.1371/journal.pmed.1002613
3. Lowe R et al. Combined effects of hydrometeorological hazards and urbanisation
   on dengue risk in Brazil: a spatiotemporal modelling study. *The Lancet Planetary
   Health*. 2021;5(4):e209-e219. https://doi.org/10.1016/S2542-5196(20)30292-8

## 13. Final scientific boundary

The system currently answers: **where do climate conditions and available contextual
evidence justify intensified Aedes surveillance and field review?**

The funded proof of concept will test: **can prospectively collected Aedes, dengue,
genomic and community evidence produce calibrated, timely and operationally useful
dengue-risk forecasts across pilot settings?**

Maintaining this distinction makes the proposal scientifically credible, technically
testable and aligned with proof-of-concept funding.
