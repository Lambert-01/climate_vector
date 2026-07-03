# National Climate-Vector Mathematical Modelling Framework

This document defines the mathematical framework for the climate-informed mosquito ecology, insecticide exposure, and resistance-risk system. It is written for implementation, PI review, and national decision-support alignment.

The project goal is not only to draw a dashboard. The goal is to build a defensible modelling pipeline linking Essential Climate Variables, larval ecology, agricultural insecticide exposure, resistance signals, and future climate scenarios.

Current implementation uses transparent deterministic suitability indices because the available entomological data are incomplete. The same framework is designed to expand into validated statistical, machine-learning, and spatiotemporal models when full field variables are confirmed.

## 1. Notation

Let:

- `i = 1, ..., n` index observation records.
- `s` index sampling site.
- `d` index district.
- `t` index day or epidemiological time step.
- `H_{s,t}` be habitat/breeding-site status or habitat class.
- `Y_{s,t}` be mosquito occurrence, where `Y = 1` means positive and `Y = 0` means negative.
- `C_{s,t}` be mosquito count or abundance.
- `E_{s,t}` be sampling effort.
- `R_{d,t}^{(7)}` be 7-day cumulative rainfall.
- `R_{d,t}^{(30)}` be 30-day cumulative rainfall.
- `T_{d,t}` be mean temperature.
- `Tmin_{d,t}` and `Tmax_{d,t}` be minimum and maximum temperature.
- `RH_{d,t}` be relative humidity.
- `L_s` be land-cover or habitat class around site `s`.
- `A_s` be agricultural insecticide exposure near site `s`.
- `G_s` be GPS validation status, where `G_s = 1` if coordinates are validated and `0` otherwise.
- `N_d` be available historical mosquito records in district `d`.

## 2. Operational Suitability Model Currently Implemented

Because full dates, GPS, standardized abundance, sampling effort, and negative habitat observations are not yet complete, the current operational model is a transparent district-level suitability proxy:

```text
S_{d,t} = 0.42 S_T(T_{d,t}) + 0.40 S_R(R_{d,t}^{(7)}, R_{d,t}^{(30)}) + 0.18 S_E(N_d, G_d)
```

where `S_{d,t}` is bounded between `0` and `1`.

### 2.1 Temperature Suitability

```text
S_T(T) = 0                         if T < 16 or T > 34
S_T(T) = (T - 16) / 9              if 16 <= T <= 25
S_T(T) = 1                         if 25 < T <= 29
S_T(T) = (34 - T) / 5              if 29 < T <= 34
```

This is a piecewise biological plausibility function. It reflects that mosquito development is weak at low temperature, strongest in a middle thermal range, and reduced under excessive heat.

### 2.2 Rainfall Suitability

Short-term rainfall component:

```text
S_7 = min(max(R7 / 35, 0), 1)
```

Sustained rainfall component:

```text
S_30 = min(max(R30 / 120, 0), 1)
```

Flushing penalty:

```text
P_F = 0.75 if R7 > 90
P_F = 1.00 otherwise
```

Rainfall suitability:

```text
S_R = min(max((0.45 S_7 + 0.55 S_30) P_F, 0), 1)
```

Interpretation: moderate and sustained rainfall increases habitat suitability; very heavy short-term rainfall can flush larval habitats, so the penalty prevents overestimating risk after extreme rain.

### 2.3 Field Evidence Suitability

Historical record signal:

```text
S_N = min(max(N_d / 50, 0), 1)
```

Field evidence:

```text
S_E = min(max(0.85 S_N + 0.15 G_d, 0), 1)
```

Interpretation: observed mosquito records increase evidence strength, but GPS validation remains essential for high-confidence site-level modelling.

### 2.4 Vectorial-Capacity Proxy

The current proxy is:

```text
VCP_{d,t} = min(max(S_T^{1.4} S_R^{1.1} (0.35 + 0.65 S_E), 0), 1)
```

This is inspired by the multiplicative structure of vectorial capacity:

```text
VC = (m a^2 p^n) / (-ln p)
```

where:

- `m` is vector density relative to humans.
- `a` is biting rate.
- `p` is daily survival probability.
- `n` is extrinsic incubation period.

At present, we do not have validated values for `m`, `a`, `p`, or `n`. Therefore `VCP` is dimensionless and should be interpreted as a climate-ecology suitability proxy, not absolute malaria transmission potential.

### 2.5 Risk Class

Rule score:

```text
score = 0
+2 if R7 >= 30
+1 if 15 <= R7 < 30
+2 if R30 >= 120
+1 if 60 <= R30 < 120
+1 if 20 <= T <= 30
+1 if N_d > 0
```

Risk class:

```text
High   if S >= 0.72 or score >= 5
Medium if S >= 0.45 or score >= 3
Low    otherwise
```

This risk class is suitable for internal screening and prioritization, not public alerting without expert review.

## 3. Habitat Occurrence Model For Full Data

Once positive and negative habitat observations are available, larval habitat occurrence should be modelled as:

```text
Y_{s,t} ~ Bernoulli(p_{s,t})
logit(p_{s,t}) = beta_0 + beta_1 T_{d,t} + beta_2 R_{d,t}^{(7)}
               + beta_3 R_{d,t}^{(30)} + beta_4 RH_{d,t}
               + beta_5 H_{s,t} + beta_6 L_s
               + beta_7 A_s + u_d + v_s
```

where:

- `u_d ~ Normal(0, sigma_d^2)` is a district random effect.
- `v_s ~ Normal(0, sigma_s^2)` is a site random effect.

This GLMM structure separates climate effects, habitat effects, district heterogeneity, and site-specific variability.

## 4. Mosquito Abundance Model For Count Data

If standardized mosquito counts and sampling effort are confirmed:

```text
C_{s,t} ~ NegativeBinomial(mu_{s,t}, theta)
log(mu_{s,t}) = log(E_{s,t}) + alpha_0 + f_1(T_{d,t})
              + f_2(R_{d,t}^{(7)}) + f_3(R_{d,t}^{(30)})
              + alpha_4 RH_{d,t} + alpha_5 H_{s,t}
              + alpha_6 A_s + u_d + v_s
```

Here:

- `log(E_{s,t})` is an offset for sampling effort.
- `f_1`, `f_2`, and `f_3` may be spline smoothers in a GAM.
- Negative binomial distribution handles overdispersion common in mosquito counts.

## 5. Spatiotemporal Extension

For national surveillance, the latent risk surface may be represented as:

```text
eta(s,t) = X(s,t) beta + W(s,t)
```

where:

```text
W(s,t) = rho W(s,t-1) + epsilon(s,t)
epsilon(s,t) ~ GP(0, K_phi(s,s'))
```

`W(s,t)` is a spatial-temporal random field. `K_phi` may be a Matérn covariance or an approximate Gaussian Markov random field.

This is the correct direction for national mapping, but it requires validated GPS coordinates.

## 6. Insecticide Exposure Model

Agricultural insecticide exposure should be represented by:

```text
A_s = sum_k w_k I_{s,k}
```

where:

- `I_{s,k}` indicates reported use of insecticide class `k` near site `s`.
- `w_k` is a class-specific selection-pressure weight.

If intensity/frequency is available:

```text
A_{s,t} = sum_k w_k Dose_{s,t,k} Frequency_{s,t,k} Persistence_k
```

This exposure score can enter both habitat and resistance models.

## 7. Resistance Mortality And Classification

Observed mortality:

```text
M_obs = 100 * D / N
```

where:

- `D` is dead mosquitoes after 24h.
- `N` is number exposed.

Abbott correction:

```text
M_corr = 100 * (M_obs - M_control) / (100 - M_control)
```

Validity rules:

```text
if M_control < 5%: use M_obs
if 5% <= M_control <= 20%: use M_corr
if M_control > 20%: invalid test
```

WHO-style classification after protocol confirmation:

```text
Susceptible          if mortality >= 98%
Possible resistance  if 90% <= mortality < 98%
Resistant            if mortality < 90%
```

The current dataset has dead-at-24h values but still lacks confirmed denominators, control mortality, and protocol metadata. Therefore final resistance classification remains blocked.

## 8. Resistance Risk Model

When resistance status is validated:

```text
Z_{s,t} ~ Bernoulli(q_{s,t})
logit(q_{s,t}) = gamma_0 + gamma_1 A_{s,t}
               + gamma_2 S_{s,t}
               + gamma_3 Species_{s,t}
               + gamma_4 InsecticideClass_{s,t}
               + gamma_5 ClimateStress_{s,t}
               + u_d
```

where `Z = 1` indicates resistance or possible resistance.

## 9. Climate Change Scenario Projection

For climate projection scenario `c` and future time `tau`:

```text
S_{d,tau}^{(c)} = F(X_{d,tau}^{(c)}, H_d, A_d)
```

where:

- `c` may be SSP1-2.6, SSP2-4.5, or SSP5-8.5.
- `X_{d,tau}^{(c)}` contains projected ECVs.
- `F` is the fitted habitat or abundance model.

Change in suitability:

```text
Delta S_{d,tau}^{(c)} = S_{d,tau}^{(c)} - S_{d,baseline}
```

This allows national identification of districts where climate change may increase mosquito suitability.

## 10. Model Validation Metrics

Presence/absence models:

```text
AUC
Sensitivity = TP / (TP + FN)
Specificity = TN / (TN + FP)
Brier score = mean((Y - p)^2)
```

Count models:

```text
RMSE = sqrt(mean((C - C_hat)^2))
MAE = mean(abs(C - C_hat))
Pseudo-R2
Coverage of prediction intervals
```

Spatial models:

```text
Spatial block cross-validation
District holdout validation
Temporal forward validation
```

## 11. Current Data Status

The current data can support:

- National descriptive dashboarding.
- District-level climate suitability screening.
- Preliminary agricultural insecticide exposure summaries.
- Resistance-test readiness assessment.
- Model-readiness validation.

The current data cannot yet support:

- Validated mosquito abundance forecasting.
- Larval presence/absence modelling.
- Final WHO/CDC resistance classification.
- Malaria early-warning models.
- Formal operational national alerts without expert review.

## 12. Required Data To Unlock Full Modelling

Minimum required fields:

- Full collection date: day, month, year.
- Valid GPS latitude and longitude for each site.
- Positive and negative habitat status.
- Mosquito count or standardized abundance.
- Sampling effort and collection method.
- Species confirmation method.
- Resistance denominator and protocol.
- Control mortality.
- Agricultural insecticide class, intensity, timing, and location.
- Optional but important: malaria cases, interventions, and response actions.

## 13. Implementation Principle

The system should always expose uncertainty. A mathematical model without validated inputs should never be presented as certainty. For national-level use, every output should carry:

- model version,
- data completeness status,
- uncertainty level,
- validation status,
- date generated,
- intended use.
