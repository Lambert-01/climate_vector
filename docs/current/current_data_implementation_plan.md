# Current-Data Implementation Plan

## 1. Decision

The project will be rebuilt as a current-data proof-of-concept using only the data that is already available in the workspace.

The deadline is close, so the system should not depend on requesting new PI, field, laboratory, or malaria-program datasets before the application submission. Missing variables will be presented as part of the proposed pilot and validation work, not as blockers for the prototype.

The system name for implementation is:

**Rwanda Climate-Vector Intelligence Prototype**

## 2. Data Scope

### Primary PI / Lecturer Data

These are the only project-specific datasets treated as primary evidence:

| File | Role |
|---|---|
| `data/raw/IR_data.xls` | Insecticide-resistance and insecticide-exposure descriptive data. |
| `data/raw/mosquito_behavior_raw.xls` | Mosquito ecology, breeding-site, district/site, and species-context descriptive data. |

These two files define the real project-specific scope.

### Public Covariate Data Kept

The following public datasets are kept because they can support climate/environment/context modelling:

| Folder | Use |
|---|---|
| `data/external/nasa_power/` | Daily district climate proxies: rainfall, temperature, humidity. |
| `data/external/climate/chirps_daily/` | High-resolution rainfall context and rainfall-anomaly prototype. |
| `data/external/boundaries/` | Rwanda national, province, and district map layers. |
| `data/external/gbif/` | Independent mosquito occurrence context for Aedes, Anopheles, and Culex. |
| `data/external/worldclim/` | Long-term climate normals: temperature and precipitation covariates. |
| `data/external/elevation/` | Altitude covariate for mosquito ecology and temperature gradients. |
| `data/external/landcover/` | Land cover context: cropland, built-up, vegetation, water/wetness proxies. |
| `data/external/population/` | Population-at-risk context and prioritization denominator. |
| `data/external/osm/` | Roads, settlements, water features, accessibility, and intervention logistics context. |
| `data/external/era5_land/` | Pilot climate reanalysis validation layer. |
| `data/external/resistance_context/` | WHO/HDX malaria, environment, WASH, health-system, and national context indicators only. |

## 3. What Was Removed

The previous generated implementation material was removed to prevent confusion:

- old markdown implementation plans
- old proposal drafts
- old model-readiness reports
- old generated processed CSVs
- old interim Excel exports
- old output tables and reports
- irrelevant WHO/HDX broad public-health CSVs

The raw PI files, public covariate data, concept note, backend, frontend, database files, and scripts were kept.

## 4. Scientific Positioning

The system will be presented as:

**A transparent climate-vector decision-support proof-of-concept that integrates available mosquito ecology, insecticide-resistance, and open climate/environment data to prioritize where enhanced surveillance and validation should occur.**

It will not be presented as:

- a validated mosquito abundance prediction model
- a validated malaria early-warning model
- a definitive insecticide-resistance interpretation system
- an official alerting system

The funding proposal should say that validation is a work package, not a prerequisite for the prototype.

## 5. Core Outputs To Build Now

### A. Data Ingestion

Rebuild pipeline outputs from the two raw Excel files:

- raw sheet inventory
- cleaned mosquito ecology table
- cleaned insecticide-resistance table
- district/site name standardization
- species text standardization
- insecticide and concentration text standardization
- quality flags
- missing-field summary

Generated files should go to:

```text
data/interim/
data/processed/
outputs/tables/
outputs/reports/
```

### B. Public Covariate Integration

Build district-level and provisional-site-level context features:

- rainfall summaries from NASA POWER and CHIRPS
- temperature summaries from NASA POWER and WorldClim
- humidity proxy from NASA POWER
- elevation summaries
- land-cover class context
- population-at-risk context
- GBIF mosquito occurrence context
- WHO/HDX malaria and health-system context

When exact site GPS is missing, district centroids and provisional site candidates may be used, but all visual outputs must clearly mark them as provisional.

### C. Mathematical Modelling Layer

Use transparent applied-mathematical indices that match the available data.

#### Climate Suitability Component

For district or provisional site \(i\) at time \(t\):

\[
C_{it}=w_R f_R(R_{it})+w_T f_T(T_{it})+w_H f_H(H_{it})+w_E f_E(E_i)
\]

Where:

- \(R_{it}\) is rainfall or accumulated rainfall.
- \(T_{it}\) is mean temperature.
- \(H_{it}\) is humidity proxy.
- \(E_i\) is elevation.
- \(f_R, f_T, f_H, f_E\) are bounded suitability response functions from 0 to 1.
- weights are transparent defaults, not fitted disease parameters.

#### Ecology Evidence Component

\[
M_i = \alpha_1 S_i + \alpha_2 B_i + \alpha_3 G_i
\]

Where:

- \(S_i\) is mosquito species evidence from the PI ecology table.
- \(B_i\) is breeding-site evidence from the PI ecology table.
- \(G_i\) is independent GBIF occurrence context.

#### Resistance Pressure Component

\[
Q_i = \beta_1 I_i + \beta_2 D_i + \beta_3 U_i
\]

Where:

- \(I_i\) is insecticide exposure or test evidence from `IR_data.xls`.
- \(D_i\) is observed mortality/death pattern where available.
- \(U_i\) is uncertainty penalty caused by missing denominator, protocol, and control mortality.

#### Composite Surveillance Priority Index

\[
P_i = \lambda_C C_i + \lambda_M M_i + \lambda_Q Q_i + \lambda_V V_i
\]

Where:

- \(C_i\) is climate suitability.
- \(M_i\) is mosquito ecology evidence.
- \(Q_i\) is resistance/exposure pressure.
- \(V_i\) is population/environment vulnerability context.
- \(P_i\) is a prioritization score for surveillance and pilot targeting, not a validated disease risk prediction.

### D. Dashboard

Build a professional dashboard with:

- national overview
- mosquito ecology summaries
- insecticide-resistance summaries
- climate/environment maps
- district priority ranking
- provisional site map
- data-readiness tracker
- missing-data-to-pilot-work-package panel
- model-governance labels

Every page must separate:

- observed PI data
- public covariates
- model-derived indices
- missing validation data

### E. API

Backend endpoints should serve:

- dashboard statistics
- mosquito ecology summaries
- resistance summaries
- climate summaries
- public-data inventory
- modelling indices
- readiness and limitations
- map layers

### F. Proposal Evidence Package

Generate a simple funder-facing package:

- current data inventory
- what can be built now
- what cannot be claimed yet
- why the system is still fundable
- 20-day implementation schedule
- pilot validation plan
- mathematical formulation summary

## 6. Twenty-Day Build Schedule

### Days 1-3: Clean Data Foundation

- Rebuild ingestion from `IR_data.xls` and `mosquito_behavior_raw.xls`.
- Regenerate processed tables.
- Produce field-level data dictionary automatically.
- Produce missingness and quality flags.

### Days 4-6: Public Covariates

- Build district climate feature table.
- Build public source inventory.
- Link PI district/site names to district climate context.
- Keep provisional coordinates clearly labelled.

### Days 7-10: Mathematical Indices

- Implement climate suitability functions.
- Implement ecology evidence scoring.
- Implement resistance/exposure pressure scoring.
- Implement uncertainty penalties.
- Produce district priority table.

### Days 11-14: Dashboard And API

- Improve dashboard design.
- Make maps visible and useful.
- Add page-level scientific disclaimers.
- Ensure API routes return non-empty data.

### Days 15-17: Proposal Package

- Generate concise reports for PI/funder.
- Add screenshots or static dashboard export.
- Write model-governance and validation language.

### Days 18-20: Testing And Polish

- Run pipeline tests.
- Test API and frontend.
- Check dashboard on desktop and laptop views.
- Prepare final zip or GitHub-ready version.

## 7. New Folder Contract

The clean implementation should use this structure:

```text
apps/
  api/
  web/

data/
  raw/
  external/
  interim/
  processed/

docs/
  concept_note_original.doc
  current/

outputs/
  reports/
  tables/

scripts/
  pipelines/

database/
```

## 8. Immediate Next Implementation Tasks

1. Re-run raw Excel ingestion.
2. Rebuild cleaned mosquito and resistance tables.
3. Regenerate public-data inventory from the kept external datasets.
4. Rebuild suitability and priority indices using only available variables.
5. Update frontend copy and dashboard logic to remove “missing-data blocker” framing and replace it with “pilot validation work package” framing.
6. Verify API and frontend with fresh generated data.

## 9. Message To PI

The current data is sufficient to build a strong proof-of-concept system for climate-informed mosquito surveillance prioritization. It is not sufficient to validate causal or predictive models yet. The proposal should therefore fund the transition from a descriptive current-data intelligence prototype to a validated surveillance and modelling platform.
