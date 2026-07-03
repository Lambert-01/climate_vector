# Implementation Master Plan

Project: Climate-Informed Mosquito Risk Surveillance and Alert System for Rwanda  
Purpose: Professional Proof-of-Concept implementation plan for PI, UR-CMHS/UR-CST, RBC/district discussions, and Nexa readiness.  
Date: 2026-07-03

## 1. Scope and Non-Scope

### In Scope for Version 1

- Clean and document the historical mosquito/habitat/insecticide dataset.
- Clean and document the new `IR_data.xls` resistance-oriented dataset.
- Produce descriptive insecticide-resistance test summaries after protocol confirmation.
- Build a site registry with validated GPS coordinates.
- Use climate, land-cover, elevation, and district boundary data.
- Build a descriptive dashboard for mosquito records and climate signals.
- Prepare Kobo/ODK field forms for prospective model-ready data.
- Create a rule-based prototype risk signal.
- Record alert review, alert acknowledgment, response actions, and follow-up.
- Prepare the data foundation for future validated models.

### Not in Scope Until Missing Data Are Available

- Final mosquito abundance prediction.
- Confirmed insecticide-resistance prediction before denominator, protocol, control mortality, species cleaning, date, and GPS issues are resolved.
- Malaria early-warning prediction.
- Public dashboard showing sensitive GPS, farm, health, or staff data.
- Operational alerts without technical review and approval.

## 2. User Roles and Responsibilities

| Role | Main responsibilities |
|---|---|
| PI | Scientific oversight, stakeholder engagement, approval of major outputs |
| Co-PI modeller | Modelling roadmap, validation design, risk scoring, uncertainty |
| Data manager | Data cleaning, quality checks, versioning, data dictionary |
| Field officer | Field data collection, site GPS, habitat survey, mosquito counts |
| Laboratory officer | Species identification, bioassay, molecular resistance results |
| GIS/climate specialist | Climate/environment extraction, maps, raster and OSM features |
| District user | View district summaries, acknowledge alerts, record actions |
| RBC reviewer | Review summaries, approve or reject operational alert release |
| System administrator | Users, permissions, backups, deployment, audit logs |
| Research analyst | De-identified analysis and reporting |

## 3. Data Access and Governance Plan

Sensitive data must be protected:

- exact mosquito-site GPS;
- farm/pesticide records linked to individuals;
- malaria or health-facility data;
- alert-response staff identities;
- laboratory resistance results before validation.

Rules:

1. Raw data are preserved and not edited.
2. Every dataset has a source, owner, date received/downloaded, and checksum.
3. Sensitive data are not placed on public dashboards.
4. Public demos use synthetic, anonymised, or aggregated data only.
5. RBC/MoH malaria data require formal approval before use.
6. Exact GPS should be role-protected or aggregated in external-facing outputs.

## 4. Field Data Workflow

### Mosquito Habitat Survey

Required fields:

- visit ID;
- site ID;
- full date;
- GPS coordinate;
- habitat type;
- habitat positive or negative;
- larval count;
- pupal count;
- adult count if trapped;
- sampling effort;
- species if identified;
- field officer;
- data quality flag.

### Pesticide Exposure Survey

Required fields:

- site ID;
- crop;
- product name;
- active ingredient;
- chemical class;
- application date;
- frequency;
- dose;
- distance to larval habitat;
- respondent/source;
- quality flag.

### Resistance Testing

Required fields:

- test ID;
- site ID;
- date;
- species;
- insecticide tested;
- test method;
- number exposed;
- number dead;
- mortality percentage;
- resistance interpretation;
- lab reviewer.

### Current Resistance Dataset Update

New raw file:

- `data/raw/IR_data.xls`

Sheets found:

- `Sheet1`
- `selected_variables`
- `sites`

Useful fields now available:

- `Anopheles species`
- `Insecticide Tested+Concentration`
- `conc`
- `# death observed_24h`
- `Mortality_rate`
- site-year reference columns for 2021-2025

Important interpretation:

This dataset gives the project a partial insecticide-resistance testing foundation. It supports descriptive summaries of death counts after 24 hours by site, district, insecticide, concentration, and species category.

Remaining validation needed before resistance modelling:

1. Confirm denominator for `# death observed_24h`, likely 25 but not yet verified.
2. Confirm test protocol: WHO susceptibility, intensity assay, PBO synergist assay, CDC bottle assay, or other.
3. Confirm whether control mortality was recorded elsewhere.
4. Confirm whether each row is a test replicate, test tube, site-test, or grouped observation.
5. Confirm whether species names are morphological, molecular, or mixed.
6. Recover row-level month and year.
7. Obtain GPS coordinates for test sites.

Do not calculate final resistance status until these points are confirmed.

## 5. AI Trap Data Architecture

If the proposal keeps "AI traps", the system must store AI-trap data. If AI traps are not available, remove or soften the AI-trap claim.

Recommended tables:

```text
traps
  trap_id
  trap_type
  manufacturer
  ai_model_version
  site_id
  status

trap_deployments
  deployment_id
  trap_id
  site_id
  deployed_at
  retrieved_at
  trap_hours
  collector
  weather_notes

trap_detections
  detection_id
  deployment_id
  image_path
  detected_species
  detected_count
  confidence_score
  human_verified
  verification_status
```

Minimum rule:

AI detections must be human-validated before being treated as scientific mosquito observations.

## 6. System Architecture and Database Schema

Core tables:

- `sites`
- `field_visits`
- `mosquito_observations`
- `pesticide_exposure`
- `resistance_results`
- `resistance_test_protocols`
- `resistance_test_replicates`
- `climate_daily`
- `climate_features`
- `environmental_features`
- `alerts`
- `alert_recipients`
- `response_actions`
- `organizations`
- `users`
- `user_roles`
- `audit_log`
- `dataset_registry`
- `processing_runs`
- `traps`
- `trap_deployments`
- `trap_detections`

Recommended resistance tables:

```text
resistance_test_protocols
  protocol_id
  protocol_name
  assay_type
  insecticide
  concentration
  exposure_time_minutes
  holding_time_hours
  expected_denominator
  interpretation_rule

resistance_test_replicates
  replicate_id
  site_id
  district
  test_date
  test_day
  test_month
  test_year
  species_raw
  species_clean
  insecticide_tested
  concentration_label
  number_exposed
  number_dead_24h
  mortality_rate
  control_mortality
  correction_applied
  resistance_status
  source_sheet
  quality_flag
```

`IR_data.xls` should first be converted into a cleaned `resistance_test_replicates` table. For now, `number_exposed`, `mortality_rate`, `control_mortality`, and `resistance_status` should remain flagged as needing protocol confirmation.

For early PoC, CSV files and Streamlit are enough. For a serious pilot, migrate to PostgreSQL + PostGIS.

## 7. Climate and Environment Ingestion Workflow

### Current Safe Use

- District climate summaries from NASA POWER can support dashboard-level climate signals.
- WorldClim, elevation, land-cover, population, and OSM can support environmental context.

### Modelling Rule

Do not use district centroids as the main climate input for mosquito habitat modelling.

For modelling:

1. Validate site GPS.
2. Extract climate/environment at site or visit coordinates.
3. Build lag features by visit date.
4. Store feature source and processing run.

Recommended future script:

```text
scripts/feature_engineering/extract_climate_by_visit.py
```

## 8. Data Quality and Approval Workflow

Workflow:

```text
Raw data received
  -> checksum recorded
  -> data dictionary updated
  -> cleaning script runs
  -> data quality flags assigned
  -> data manager review
  -> technical approval
  -> processed dashboard/model table created
```

Quality flags:

- `valid`
- `missing_date`
- `missing_gps`
- `missing_outcome`
- `missing_effort`
- `duplicate_possible`
- `needs_review`

No row should enter model training unless date, location, outcome, and sampling effort are valid.

Resistance rows have additional requirements before modelling:

- denominator confirmed;
- species cleaned;
- test method confirmed;
- control mortality checked;
- site GPS available;
- date or at least year/month confirmed.

## 9. Alert and Response Standard Operating Procedure

Prototype workflow:

```text
Risk signal generated
  -> technical review
  -> approved alert
  -> sent to district/RBC actors
  -> recipient acknowledges
  -> action assigned
  -> action completed or escalated
  -> field follow-up recorded
  -> outcome reviewed
```

Recommended alert fields:

- alert ID;
- alert date;
- district/site;
- risk level;
- rule or model version;
- uncertainty level;
- issued by;
- approved by;
- status;
- expiry date;
- recommended action.

Recommended action fields:

- action ID;
- alert ID;
- responsible organization;
- responsible user;
- due date;
- action date;
- action type;
- evidence file;
- follow-up result.

## 10. Deployment and Security Plan

### Public Demo

Allowed only with:

- aggregated data;
- synthetic data;
- no exact GPS;
- no health records;
- no staff identities;
- no farm/person-linked pesticide records.

### Real Pilot

Use:

- institutional server or secure VPS;
- private dashboard access;
- authentication;
- role-based permissions;
- HTTPS;
- encrypted backups;
- audit logs;
- restricted GPS visibility.

## 11. Model Governance

Recommended model folder:

```text
models/
  registry/
  baseline/
  experimental/
  approved/
  retired/
  model_cards/
```

Every approved model requires a model card:

- purpose;
- outcome predicted;
- data period and sites;
- features used;
- method;
- validation method;
- performance;
- uncertainty;
- limitations;
- appropriate use;
- prohibited use;
- responsible modeller;
- approval date;
- review date.

Example warning:

> This model estimates monitored habitat occurrence risk. It does not predict malaria cases, confirmed resistance, or individual infection risk.

Resistance model warning:

> This model estimates patterns in validated insecticide susceptibility test results. It does not prove agricultural pesticide causation, malaria risk, or resistance at unsampled sites.

## 12. Essential Now Versus Optional Later

### Essential Now

- Historical mosquito dataset.
- `IR_data.xls` resistance-oriented dataset.
- Validated site GPS.
- Full dates.
- Prospective field forms.
- Climate data.
- Land-cover data.
- Elevation data.
- Pesticide dictionary.
- Resistance test protocol and denominator confirmation.
- District boundaries.
- Alert/action records.

### Optional Later

- WorldPop population.
- GBIF occurrence records.
- Large OSM extraction.
- Future climate scenarios.
- Full Sentinel-2 imagery.
- Malaria outcome data, after approval.

## 13. Phase-by-Phase Acceptance Criteria

| Phase | Accepted only when |
|---|---|
| Phase 1: Data freeze | Raw data are preserved, checksums recorded, and duplicates removed |
| Phase 2: Resistance data audit | `IR_data.xls` sheets are documented and denominator/protocol questions are sent to PI/lab |
| Phase 3: Site registry | All sentinel sites have unique IDs and validated GPS |
| Phase 4: Field forms | Kobo/ODK forms are tested offline and synced successfully |
| Phase 5: Prospective data | At least 80% of visits have date, GPS, habitat status, count, and effort |
| Phase 6: Climate features | Climate lag features are linked by exact visit date and site location |
| Phase 7: Dashboard | PI/team can view climate, mosquito, resistance-test, data readiness, and missing-data pages |
| Phase 8: Alert workflow | Alerts are reviewed, approved, acknowledged, and linked to response actions |
| Phase 9: Model testing | Validation report is reviewed before any prediction claim |
| Phase 10: Pilot review | RBC/district users provide feedback on usability and actionability |

## 14. Immediate Next Actions

1. Ask PI/lab to confirm `IR_data.xls` denominator, protocol, control mortality, and row meaning.
2. Ask PI for full date, GPS, field counts, effort, and row-level month/year.
3. Clean species names and resistance-test insecticide/concentration labels.
4. Decide whether AI traps are truly part of the pilot. If yes, add trap forms and tables.
5. Build the site registry.
6. Build the descriptive Streamlit dashboard, including a resistance-test summary page.
7. Create Kobo/ODK forms.
8. Start provenance registry for all datasets.
9. Define who can issue and approve alerts.

## 15. Final Position

This project can become a professional Nexa Proof of Concept if it is built as a staged climate-to-action surveillance system.

The system should not promise final predictive modelling until the missing outcome data are collected and validated.
