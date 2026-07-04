# Climate-Vector Intelligence Prototype Using Current Available Data

Prepared for: Ndacyayisaba Lambert  
Project: Modelling Mosquito Ecology and Insecticide Exposure Under Climate Change  
Funding fit: NCST / Grand Challenges Rwanda / Nexa Climate and Health Innovation Proof of Concept  

## Executive Summary

This document explains how the project can move forward using only the data currently available in the workspace. The available data are not sufficient for a fully validated mosquito abundance forecasting model, official resistance classification system, or malaria outbreak prediction system. However, they are sufficient to build a strong Proof-of-Concept decision-support platform that links public climate and environmental data with preliminary mosquito ecology and insecticide resistance records.

The right product to build now is a **Climate-Vector Intelligence Prototype**. Its purpose is to help public health, entomology, environment, and district teams understand climate suitability, historical mosquito evidence, preliminary resistance signals, data gaps, and surveillance priorities. It should not be presented as a final prediction product. It should be presented as a practical early-stage innovation that can be field-tested and validated through the proof-of-concept phase.

This framing fits the NCST / Nexa call because the call supports innovations that help local health actors turn climate-driven health risk signals into timely action. A system that converts climate data, mosquito records, resistance-test summaries, agricultural exposure context, and data-readiness evidence into surveillance-prioritization decisions is directly aligned with that aim.

The project should therefore proceed in two layers:

1. **Prototype layer using current data only**
   - District-level climate suitability screening.
   - Mosquito ecology descriptive analytics.
   - Preliminary insecticide-resistance signal dashboard.
   - Public data integration and mapping.
   - Missing-data and validation workflow.
   - Mathematical suitability proxy model.
   - Decision-support and pilot-planning interface.

2. **Proof-of-concept validation layer**
   - Retrospective data rescue from PI/field/lab forms.
   - Prospective pilot data collection in selected sentinel districts.
   - Site-level GPS validation.
   - Standardized mosquito counts and sampling effort.
   - Valid resistance denominator, protocol, and control mortality records.
   - Model validation against prospective observations.

The key message is simple: **we can build a serious system now, but we must be scientifically honest about what it does.**

## 1. Current Data Position

The project currently has a meaningful but incomplete dataset. The available data include:

- Mosquito ecology records from the PI/lecturer dataset.
- Insecticide resistance test records from the IR dataset.
- District-level NASA POWER daily climate data.
- Rwanda district and administrative boundary layers.
- GBIF / VectorBase mosquito occurrence evidence.
- ERA5-Land test climate summary.
- WorldClim baseline climatology archives.
- Elevation, population, land cover, and OSM open-data files.
- Processed data-readiness summaries.
- Provisional site coordinate candidates based on district centroids.

These data are enough to build a dashboard and modelling engine that operates at the **district descriptive and screening level**. They are not yet enough for validated site-level mechanistic modelling, official resistance interpretation, or disease early warning.

The major missing variables are:

- Full row-level collection dates.
- Official GPS coordinates for all sentinel sites.
- Mosquito counts or abundance per sample.
- Sampling effort and method.
- Positive and negative habitat status.
- Resistance test denominator.
- Control mortality.
- Confirmed assay protocol.
- Clean species identification and confirmation method.
- Malaria case, intervention, or action outcome data.

These missing variables are not minor. They define whether the system can move from descriptive screening to validated prediction. But their absence does not stop the project. Instead, it defines the proof-of-concept work plan.

## 2. What We Can Build With Current Data Only

With the current data, we can build a professional **Climate-Vector Intelligence Prototype**. The prototype should focus on decision support, data integration, climate screening, and pilot readiness.

The system can provide the following outputs immediately:

1. **Climate suitability dashboard**
   - Daily rainfall and temperature signals by district.
   - Recent rainfall accumulation.
   - District-level thermal suitability.
   - Rainfall suitability and wetness ranking.
   - Public data coverage indicators.

2. **Mosquito ecology analytics**
   - Records by district.
   - Records by site.
   - Anopheles species labels as currently recorded.
   - Breeding-site type frequencies.
   - Agricultural insecticide mentions where available.
   - Data-quality flags.

3. **Preliminary resistance analytics**
   - Resistance-test records by district.
   - Test counts by insecticide.
   - Descriptive number-dead-at-24h summaries.
   - Denominator/protocol/control-mortality warnings.
   - Laboratory-data readiness score.

4. **Public data integration**
   - NASA POWER climate data.
   - GBIF / VectorBase mosquito occurrence evidence.
   - WorldClim baseline inventory.
   - ERA5-Land summary.
   - Land cover, elevation, OSM, and population data inventory.
   - CHIRPS and CMIP6 marked as next-download targets.

5. **Map and site view**
   - Rwanda map.
   - Provisional site coordinate candidates.
   - District-level map markers.
   - Clear warning that provisional points are not official site GPS.

6. **Mathematical modelling page**
   - District suitability index.
   - Rainfall index.
   - Temperature index.
   - Evidence index.
   - Vectorial capacity proxy.
   - Risk level: low, medium, high.
   - Uncertainty level: high until official GPS and full dates are available.

7. **Data-readiness and PI request module**
   - What is missing.
   - Why it matters.
   - Where to get it.
   - Who should provide it.
   - What public data can substitute.
   - What must be collected during the proof-of-concept pilot.

This is enough to demonstrate innovation, feasibility, and clear technical direction. It is also enough to support a serious funding application if the system is positioned correctly.

## 3. What The System Should Not Claim Yet

The current system should not claim:

- Validated mosquito abundance forecasting.
- Official malaria outbreak prediction.
- Official insecticide-resistance classification.
- Site-level climate-response modelling.
- Causal inference between agricultural insecticide exposure and resistance.
- Operational public-health alerting without review.

Instead, the language should be:

- “Climate suitability proxy.”
- “District-level screening.”
- “Preliminary resistance signal.”
- “Descriptive entomological analytics.”
- “Data-readiness guided surveillance.”
- “Proof-of-concept decision-support platform.”

This is not a weakness. It is good scientific governance. Funders respect honest staging, especially for proof-of-concept calls.

## 4. Why This Fits The NCST / Nexa Call

The NCST / Nexa opportunity focuses on climate and health innovation. The call emphasizes approaches that help local health actors turn climate-risk signals into timely health service delivery action. It specifically includes climate-informed early warning and monitoring systems related to changing mosquito ecology and mosquito-borne infection risk.

Our project fits this because it creates a bridge between:

- Climate data.
- Mosquito ecology.
- Insecticide resistance.
- Agricultural exposure context.
- Geospatial mapping.
- Data readiness.
- Local surveillance action.

The proof-of-concept argument is:

> Rwanda needs practical tools that translate climate and environmental signals into mosquito surveillance priorities. Existing historical data are fragmented, but they are sufficient to build and test a first decision-support prototype. The proof-of-concept phase will validate the platform through retrospective data rescue and targeted prospective surveillance in selected sentinel districts.

This makes the missing data part of the innovation pathway. The system does not require perfect data before starting. It creates a structure for improving the data while delivering useful climate-risk intelligence.

## 5. Proposed System Name

A suitable working name is:

**Rwanda Climate-Vector Intelligence System**

Short name:

**RCVIS**

Alternative names:

- Climate-Vector Rwanda.
- Mosquito Climate Intelligence Platform.
- VectorSight Rwanda.
- Climate-Vector Early Action Prototype.

The name should communicate that this is a decision-support system, not only a dashboard.

## 6. System Architecture

The proposed system should be a full-stack platform with the following layers:

### 6.1 Data Layer

The data layer stores and organizes:

- Raw PI datasets.
- Processed mosquito ecology tables.
- Processed resistance-test tables.
- Public climate data.
- Public environmental data.
- Site registry and coordinate candidates.
- Data-readiness reports.
- Model output tables.
- Dashboard-ready summaries.

The current architecture already follows this structure:

- `data/raw`
- `data/interim`
- `data/processed`
- `data/external`
- `outputs/tables`
- `outputs/reports`

This structure should be maintained.

### 6.2 Processing Layer

The processing layer should:

- Ingest Excel files.
- Standardize columns.
- Generate preliminary ecology and resistance tables.
- Create summary frequencies.
- Build climate features.
- Build public data inventory.
- Generate model-readiness reports.
- Generate PI missing-data request tables.

Existing scripts already support this direction:

- `01_ingest_raw_excel.py`
- `02_build_processed_tables.py`
- `03_build_static_dashboard.py`
- `05_validate_model_readiness.py`
- `06_build_gap_resolution_package.py`
- `07_build_public_open_data_features.py`

Future scripts should add:

- CHIRPS rainfall extraction.
- WorldClim CMIP6 scenario extraction.
- Site-level raster covariate extraction.
- Model-output export.
- Pilot data validation.

### 6.3 Mathematical Modelling Layer

The mathematical layer should implement staged models.

Current-data model:

- Rule-based suitability proxy.
- Rainfall suitability.
- Temperature suitability.
- Evidence index.
- Vectorial capacity proxy.
- District risk class.

Future validated models:

- Logistic occurrence model.
- Negative-binomial abundance model.
- Spatiotemporal hierarchical model.
- Resistance mortality model.
- Exposure-resistance association model.
- Future scenario suitability model.

For now, the current-data model should remain transparent and interpretable.

### 6.4 API Layer

The API should expose:

- Dashboard statistics.
- Readiness data.
- Mosquito records and summaries.
- Resistance records and summaries.
- Climate data.
- Public data inventory.
- Site coordinate candidates.
- Missing-data source guidance.
- District risk scores.

The FastAPI backend is appropriate for this layer.

### 6.5 Frontend Layer

The frontend should provide a professional dashboard for:

- Overview.
- Sites and map.
- Mosquito ecology.
- Resistance tests.
- Climate.
- Mathematical modelling.
- Alerts and response.
- Data readiness.

The React/Vite frontend is suitable. The UI should remain practical, clean, and operational rather than decorative.

### 6.6 Database Layer

The database should use PostgreSQL / Neon. The schema should support:

- Sites.
- Field visits.
- Mosquito observations.
- Resistance test replicates.
- Climate daily records.
- Alerts.
- Response actions.
- Dataset registry.
- Audit logs.

This creates a strong path from proof-of-concept to future scale.

## 7. Mathematical Formulation For Current Data

With current data only, the safest mathematical approach is a transparent suitability proxy.

Let:

- `d` be a district.
- `t` be a date or recent time window.
- `T(d,t)` be mean temperature.
- `R7(d,t)` be 7-day rainfall.
- `R30(d,t)` be 30-day rainfall.
- `E(d)` be historical entomological evidence.

### 7.1 Temperature Suitability

Temperature suitability can be defined as a piecewise function:

```text
S_T(T) = 0,                         if T < 16 or T > 34
S_T(T) = (T - 16) / 9,              if 16 <= T <= 25
S_T(T) = 1,                         if 25 < T <= 29
S_T(T) = (34 - T) / 5,              if 29 < T <= 34
```

This represents a plausible thermal suitability range for Anopheles ecology. It is not a fitted biological model yet.

### 7.2 Rainfall Suitability

Rainfall suitability can combine short-term and sustained rainfall:

```text
S_R = clamp(0.45 * min(R7 / 35, 1) + 0.55 * min(R30 / 120, 1), 0, 1)
```

If very heavy short-term rainfall occurs, a flushing penalty may be applied:

```text
S_R = 0.75 * S_R, if R7 > 90 mm
```

This reflects that moderate rainfall may create breeding habitats, while excessive rainfall may flush larvae.

### 7.3 Evidence Index

Historical evidence can be represented as:

```text
S_E = min(recent_records / 50, 1)
```

This is only a proxy for observed evidence. It is not true abundance.

### 7.4 Suitability Index

The district suitability index can be:

```text
S(d,t) = 0.42*S_T + 0.40*S_R + 0.18*S_E
```

This combines climate and evidence signals.

### 7.5 Vectorial Capacity Proxy

A dimensionless vectorial capacity proxy can be:

```text
VCP(d,t) = S_T^1.4 * S_R^1.1 * (0.35 + 0.65*S_E)
```

This is inspired by vectorial-capacity logic but should not be interpreted as absolute transmission potential.

### 7.6 Risk Classification

Risk classes can be defined as:

```text
High:   S >= 0.72
Medium: 0.45 <= S < 0.72
Low:    S < 0.45
```

Because GPS, full dates, counts, and effort are missing, uncertainty should remain high.

## 8. Dashboard Modules To Build

### 8.1 Overview

The overview should show:

- Number of sites.
- Number of mosquito records.
- Number of resistance records.
- Active alerts.
- Public data coverage.
- Critical missing data and where to get it.
- Recent rainfall chart.
- Wettest district climate proxies.
- Data readiness list.

### 8.2 Sites And Map

The site module should show:

- Map of Rwanda.
- Provisional site coordinate candidates.
- Validated GPS count.
- Provisional marker count.
- Site registry.
- PI coordinate validation table.

Until official GPS is available, all site points should be labelled provisional.

### 8.3 Mosquito Ecology

The mosquito module should show:

- Records by district.
- Records by species label.
- Records by breeding-site type.
- Clean records table.
- Data-quality warning.
- Missing count/effort warning.

Future versions should include:

- Abundance trends.
- Seasonal curves.
- Habitat positivity.
- Species distribution maps.

### 8.4 Resistance

The resistance module should show:

- Tests by district.
- Tests by insecticide.
- Mean deaths at 24h.
- Missing denominator warning.
- Missing control mortality warning.
- Resistance table.

It should not assign official resistance status yet.

### 8.5 Climate

The climate module should show:

- District selection.
- Rainfall chart.
- Temperature chart.
- Rainy-day count.
- Full climate record range.
- Public data source status.

Future versions should add:

- CHIRPS rainfall anomalies.
- ERA5-Land comparison.
- Seasonal climatology.
- Forecast-ready weather feeds.

### 8.6 Mathematical Modelling

The modelling module should show:

- Suitability index.
- Risk class.
- Rainfall index.
- Temperature index.
- Evidence index.
- Vectorial capacity proxy.
- Model scope.
- Training blocked fields.

It should distinguish current proxy models from future validated models.

### 8.7 Data Readiness

The data-readiness module should show:

- Ready fields.
- Missing fields.
- Missing-data source guide.
- Public substitutes.
- Proposal strategy.
- Quality flag reference.

This is one of the strongest components for the funding application because it shows serious data governance.

## 9. How To Handle The Missing Data In The Proposal

The proposal should not hide missing data. It should state:

- Existing historical datasets are fragmented.
- The prototype already integrates available entomological and climate data.
- The proof-of-concept phase will validate the system through data rescue and prospective pilot surveillance.

Recommended wording:

> The current prototype demonstrates feasibility using existing entomological records and public climate/environment datasets. The proof-of-concept phase will strengthen and validate the system by recovering historical metadata, collecting standardized prospective mosquito and resistance observations, and testing whether climate-driven suitability signals can guide earlier surveillance action.

This wording is realistic and fundable.

## 10. Public Data Substitutes

Some missing variables can be partially supported by public data:

- Missing climate observations can be supported by NASA POWER, CHIRPS, ERA5-Land.
- Missing future climate scenarios can be supported by WorldClim CMIP6.
- Missing environmental context can be supported by land cover, elevation, OSM, and population rasters.
- Missing broader mosquito occurrence context can be supported by GBIF / VectorBase.
- Missing site coordinates can be approximated by district centroids for mapping discussion only.

But the following cannot be substituted:

- Exact field collection date.
- Official site GPS.
- Mosquito count.
- Sampling effort.
- Resistance denominator.
- Control mortality.
- Assay protocol.

These must be collected or confirmed.

## 11. Minimum Viable Product

The minimum viable product should include:

- Data ingestion pipeline.
- Processed mosquito and resistance tables.
- Public climate/environment inventory.
- District climate suitability model.
- Dashboard pages.
- Site map with provisional markers.
- Missing-data source guide.
- Model-readiness report.
- Proposal documentation.

This MVP is achievable with current data only.

## 12. Proof-of-Concept Pilot Design

The proof-of-concept pilot should include:

- 4 to 8 districts.
- 20 to 40 sentinel sites.
- GPS validation for all sentinel sites.
- Monthly or biweekly field observations during high-risk seasons.
- Standard mosquito count forms.
- Sampling effort recording.
- Positive and negative habitat inspections.
- Resistance testing with denominator, protocol, and control mortality.
- Agriculture exposure survey around sentinel sites.

This pilot would transform the prototype from descriptive screening to validated modelling.

## 13. Success Criteria

By the end of the proof-of-concept phase, the system should demonstrate:

- Functional dashboard used by project team.
- At least 90% completeness for GPS, date, count, and effort fields in pilot data.
- Climate-linked mosquito suitability monitoring in pilot districts.
- Resistance data with confirmed denominator and protocol.
- Clear workflow from climate risk signal to surveillance action.
- Evidence that the model can prioritize where field teams should look next.

## 14. Final Recommendation

Proceed with the current data, but call the system:

**Climate-Vector Intelligence Prototype**

Do not call it:

**Validated prediction system**

The current data are enough for:

- A professional dashboard.
- A mathematical climate suitability engine.
- Public data integration.
- Preliminary resistance analytics.
- Site mapping with provisional coordinates.
- Data-readiness governance.
- Proof-of-concept proposal support.

The missing data should be included as:

- a pilot work package,
- a validation requirement,
- and a strength of the proposal because the system already identifies exactly what must be collected next.

This is the scientifically honest and strategically strong way forward.

