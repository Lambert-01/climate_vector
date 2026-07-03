# Mathematical Modelling Formulas

This system currently uses transparent applied-mathematical proxy formulas. These formulas support descriptive risk screening and model-readiness work. They are not yet validated epidemiological prediction models.

## Variables

- `R7`: total rainfall over the last 7 days, in mm.
- `R30`: total rainfall over the last 30 days, in mm.
- `T`: mean temperature over the chosen recent window, in degrees Celsius.
- `N`: number of recent or historical mosquito records for a district.
- `G`: GPS validation indicator, where `G = 1` if coordinates are validated and `G = 0` otherwise.

## Temperature Suitability

The temperature suitability index is a piecewise function:

```text
S_T(T) = 0                         if T < 16 or T > 34
S_T(T) = (T - 16) / 9              if 16 <= T <= 25
S_T(T) = 1                         if 25 < T <= 29
S_T(T) = (34 - T) / 5              if 29 < T <= 34
```

Interpretation:

- Values near `0` mean poor thermal suitability.
- Values near `1` mean strong thermal suitability.
- This is a proxy inspired by mosquito ecology, not a calibrated biological curve.

## Rainfall Suitability

Short-term rainfall:

```text
S_7 = min(max(R7 / 35, 0), 1)
```

Sustained rainfall:

```text
S_30 = min(max(R30 / 120, 0), 1)
```

Heavy-rain flushing penalty:

```text
P = 0.75 if R7 > 90
P = 1.00 otherwise
```

Rainfall suitability:

```text
S_R = min(max((0.45 * S_7 + 0.55 * S_30) * P, 0), 1)
```

Interpretation:

- Moderate and sustained rainfall increases suitability.
- Extremely heavy recent rainfall is penalized because breeding habitats may be flushed.

## Field Evidence Suitability

Mosquito record signal:

```text
S_N = min(max(N / 50, 0), 1)
```

Evidence suitability:

```text
S_E = min(max(0.85 * S_N + 0.15 * G, 0), 1)
```

Interpretation:

- Districts with more mosquito records receive stronger evidence weight.
- Validated GPS coordinates add a small confidence bonus.
- Current GPS uncertainty keeps uncertainty high.

## Composite Suitability Index

The main suitability index is:

```text
S = min(max(0.42 * S_T + 0.40 * S_R + 0.18 * S_E, 0), 1)
```

Interpretation:

- Temperature and rainfall dominate the score.
- Field evidence contributes, but does not override climate suitability.
- `S` is scaled from `0` to `1`.

## Vectorial-Capacity Proxy

The vectorial-capacity proxy is:

```text
VCP = min(max((S_T ^ 1.4) * (S_R ^ 1.1) * (0.35 + 0.65 * S_E), 0), 1)
```

Interpretation:

- This is dimensionless.
- It is inspired by vectorial capacity structure, where temperature, mosquito survival, biting potential, and abundance interact multiplicatively.
- It is not absolute `R0`, not malaria incidence, and not a validated outbreak prediction.

## Rule Score

The rule score is an interpretable integer score:

```text
score = 0
+2 if R7 >= 30
+1 if 15 <= R7 < 30
+2 if R30 >= 120
+1 if 60 <= R30 < 120
+1 if 20 <= T <= 30
+1 if N > 0
```

## Risk Class

```text
High   if S >= 0.72 or score >= 5
Medium if S >= 0.45 or score >= 3
Low    otherwise
```

## Resistance Calculations For Future Use

These formulas should only be activated after the PI/lab confirms denominator, protocol, control mortality, and test validity.

Observed mortality:

```text
M_obs = (number_dead_24h / number_exposed) * 100
```

Abbott-corrected mortality, if control mortality is between 5% and 20%:

```text
M_corr = ((M_obs - M_control) / (100 - M_control)) * 100
```

WHO-style interpretation, after protocol confirmation:

```text
Susceptible          if mortality >= 98%
Possible resistance  if 90% <= mortality < 98%
Resistant            if mortality < 90%
```

If control mortality is greater than 20%, the test should be treated as invalid.

## Training Readiness

Prediction training remains blocked until these fields exist:

- Full sample date.
- Latitude and longitude.
- Mosquito count.
- Sampling effort.
- Habitat positive/negative status.
- Species.
- Valid resistance denominator/protocol/control data for resistance models.
- Health/action outcome data for malaria early-warning models.
