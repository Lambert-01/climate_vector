# Full Stack Structure for the Climate-Informed Mosquito Risk Surveillance System

Prepared for: Ndacyayisaba Lambert and PI team  
Project focus: Rwanda climate-informed mosquito ecology, agricultural insecticide exposure, and decision-support prototype  
Date: 2026-07-03

## 1. Main System Goal

Build a professional Proof of Concept system that can:

1. Organize mosquito, climate, environmental, pesticide, and population data.
2. Organize the new `IR_data.xls` resistance-oriented dataset.
3. Show district/site-level climate, mosquito, habitat, and resistance-test intelligence.
4. Support future modelling once missing outcome variables are collected and resistance protocols are confirmed.
5. Help RBC/district teams understand where and when mosquito-risk conditions are increasing.
6. Record alerts and response actions during the pilot.

Important scientific position:

The system can be built now as a surveillance and decision-support prototype. The new `IR_data.xls` improves resistance-test descriptive analysis, but final predictive models should only be added after full dates, GPS, counts, sampling effort, positive/negative observations, species cleaning, resistance-test protocol confirmation, denominator confirmation, and malaria/action data are available.

## 2. Recommended Project Folder Structure

```text
climate_vector_project/

  README.md
  requirements.txt
  environment.yml
  .gitignore

  config/
    settings.yaml
    data_sources.yaml
    model_config.yaml
    dashboard_config.yaml

  docs/
    concept_note_original.doc
    proposal/
      nexa_concept_note_revised.md
      budget_notes.md
      workplan_24_months.md
    data_dictionary/
      mosquito_data_dictionary.csv
      climate_data_dictionary.csv
      pesticide_dictionary.csv
      field_collection_dictionary.csv
    ethics_governance/
      data_access_requirements.md
      rbc_moh_data_request.md
      consent_and_privacy_notes.md

  data/
    raw/
      mosquito_behavior_raw.xls
      IR_data.xls
      field_forms_original/
      lab_results_original/
      pesticide_records_original/

    interim/
      mosquito_clean_step1.csv
      resistance_clean_step1.csv
      mosquito_standardized_categories.csv
      resistance_standardized_tests.csv
      site_registry_draft.csv
      pesticide_standardized.csv

    processed/
      mosquito_model_ready.csv
      resistance_test_replicates.csv
      site_registry_validated.csv
      climate_features_by_site.csv
      environmental_features_by_site.csv
      district_risk_summary.csv
      alert_action_log.csv

    external/
      boundaries/
      worldclim/
      nasa_power/
      era5_land/
      landcover/
      elevation/
      osm/
      population/
      gbif/

    archive/
      duplicates/
      broken_downloads/
      old_versions/

  notebooks/
    01_data_inventory.ipynb
    02_mosquito_data_audit.ipynb
    03_climate_exploration.ipynb
    04_environmental_covariates.ipynb
    05_descriptive_dashboard_prep.ipynb
    06_model_experiments_future.ipynb

  scripts/
    data_ingestion/
      parse_mosquito_xls.py
      parse_ir_data_xls.py
      download_nasa_power_district_centroids.py
      extract_osm_layers.py

    cleaning/
      clean_mosquito_data.py
      standardize_sites.py
      standardize_habitats.py
      standardize_pesticides.py
      standardize_species.py
      standardize_resistance_tests.py

    feature_engineering/
      build_climate_lags.py
      extract_landcover_by_site.py
      extract_elevation_by_site.py
      extract_population_by_site.py
      build_environmental_features.py

    modelling/
      train_presence_absence_model.py
      train_abundance_model.py
      train_exposure_risk_model.py
      train_resistance_model_future.py
      validate_models.py

    dashboard/
      prepare_dashboard_tables.py

    utilities/
      check_file_integrity.py
      make_data_manifest.py

  src/
    climate_vector/
      __init__.py

      data/
        loaders.py
        validators.py
        schemas.py

      cleaning/
        mosquito.py
        sites.py
        habitats.py
        pesticides.py
        species.py
        resistance.py

      geospatial/
        boundaries.py
        raster_extract.py
        osm_features.py
        coordinate_checks.py

      climate/
        nasa_power.py
        era5.py
        lag_features.py

      modelling/
        occurrence.py
        abundance.py
        exposure_risk.py
        resistance.py
        validation.py

      alerts/
        risk_scoring.py
        thresholds.py
        action_log.py

      reporting/
        summaries.py
        charts.py
        exports.py

  dashboard/
    streamlit_app.py
    pages/
      1_Overview.py
      2_Climate_Signals.py
      3_Mosquito_Surveillance.py
      4_Resistance_Testing.py
      5_Environment_and_Population.py
      6_Data_Readiness.py
      7_Alerts_and_Actions.py
    assets/
      logo.png
      styles.css

  database/
    schema.sql
    seed_reference_tables.sql
    views.sql
    README.md

  forms/
    kobo_odk/
      mosquito_habitat_survey.xlsx
      pesticide_exposure_survey.xlsx
      alert_response_form.xlsx

  models/
    baseline/
    experimental/
    final/
    model_cards/

  outputs/
    figures/
    tables/
    reports/
    maps/
    exports_for_PI/

  tests/
    test_data_loaders.py
    test_cleaning.py
    test_geospatial_extract.py
    test_climate_lags.py
    test_risk_scoring.py
```

## 3. Data Layer

### Raw data

Purpose:

Store original files exactly as received. Never edit raw files.

Examples:

- PI mosquito spreadsheet.
- `IR_data.xls` resistance-oriented spreadsheet.
- Original field forms.
- Laboratory resistance files.
- Pesticide records from RAB or farmer survey.
- Original malaria data if approved.

Rule:

Raw data are read-only.

### Interim data

Purpose:

Store cleaned but not final files.

Examples:

- Standardized site names.
- Cleaned habitat categories.
- Cleaned Anopheles species names.
- Standardized resistance insecticide and concentration labels.
- Draft resistance-test replicate table.
- Pesticide active ingredient mapping.
- Draft site registry.

### Processed data

Purpose:

Store model-ready and dashboard-ready data.

Examples:

- `mosquito_model_ready.csv`
- `resistance_test_replicates.csv`
- `climate_features_by_site.csv`
- `environmental_features_by_site.csv`
- `district_risk_summary.csv`

### External data

Purpose:

Store downloaded open datasets.

Current examples:

- Rwanda boundaries.
- NASA POWER climate.
- WorldClim climate.
- ESA WorldCover land cover.
- Elevation.
- OSM.
- WorldPop population.
- GBIF occurrence records.

## 4. Database Structure

For early PoC:

Use CSV files and Streamlit.

For stronger prototype:

Use PostgreSQL + PostGIS.

Recommended database tables:

```text
sites
  site_id
  site_name
  district
  province
  latitude
  longitude
  coordinate_source
  coordinate_quality

field_visits
  visit_id
  site_id
  visit_date
  observer
  habitat_type
  habitat_positive
  sampling_effort_type
  sampling_effort_value
  notes

mosquito_observations
  observation_id
  visit_id
  life_stage
  count
  species
  identification_method

pesticide_exposure
  pesticide_record_id
  visit_id
  active_ingredient
  product_name
  chemical_class
  crop
  application_date
  frequency
  dose
  distance_to_habitat_m

resistance_results
  resistance_test_id
  site_id
  test_date
  species
  insecticide_tested
  concentration
  test_method
  number_exposed
  number_dead_24h
  mortality_percent
  control_mortality
  resistance_status
  molecular_marker

resistance_test_protocols
  protocol_id
  assay_type
  insecticide
  concentration
  expected_denominator
  interpretation_rule

climate_daily
  location_id
  date
  rainfall_mm
  tmean_c
  tmin_c
  tmax_c
  relative_humidity

climate_features
  visit_id
  rainfall_7d
  rainfall_14d
  rainfall_21d
  rainfall_30d
  tmean_7d
  humidity_7d

environmental_features
  site_id
  elevation_m
  landcover_class
  distance_to_water_m
  distance_to_road_m
  population_1km

alerts
  alert_id
  alert_date
  district
  risk_level
  risk_reason
  recommended_action

response_actions
  action_id
  alert_id
  action_date
  actor
  action_type
  action_description
  follow_up_result
```

## 5. Backend / Processing Stack

Recommended tools:

- Python
- Pandas
- GeoPandas
- Rasterio
- Xarray
- NumPy
- Scikit-learn
- Statsmodels
- PyYAML

Main backend tasks:

1. Load raw data.
2. Validate columns and missing values.
3. Standardize names.
4. Extract climate features.
5. Extract geospatial features.
6. Build dashboard tables.
7. Run simple models when outcomes are available.
8. Export reports and maps.

## 6. Dashboard Stack

Recommended first tool:

**Streamlit**

Why:

- Fast to build.
- Easy for PI and stakeholders to open.
- Good for maps, charts, tables, and filters.
- Good for a Proof of Concept.

Dashboard pages:

### Page 1: Overview

Shows:

- Number of mosquito records.
- Districts represented.
- Available climate files.
- Data readiness score.
- Main missing variables.

### Page 2: Climate Signals

Shows:

- Rainfall trends by district.
- Temperature trends by district.
- Humidity trends.
- 7-day, 14-day, 30-day rainfall summaries.

### Page 3: Mosquito Surveillance

Shows:

- Records by site.
- Records by district.
- Habitat categories.
- Insecticide categories.
- Anopheles species categories from `IR_data.xls`.

Important label:

Descriptive only, not predictive.

### Page 4: Resistance Testing

Shows:

- Insecticide tested.
- Concentration labels.
- 24-hour death counts.
- Species categories.
- Site and district summaries.
- Protocol confirmation status.

Important label:

Resistance summaries are preliminary until denominator, protocol, control mortality, date, GPS, and species cleaning are confirmed.

### Page 5: Environment and Population

Shows:

- Land cover.
- Elevation.
- Population exposure.
- OSM context if extracted.

### Page 6: Data Readiness

Shows:

- Which required variables are present.
- Which variables are missing.
- What the PI must provide.
- Specific resistance-data checks still needed.

### Page 7: Alerts and Actions

Shows:

- Prototype risk levels.
- Suggested response.
- Action log template.

Important:

At first, alerts should be labelled as prototype decision-support signals, not validated forecasts.

## 7. Modelling Stack

### Stage 1: Descriptive analysis

Can be done now.

Inputs:

- Current mosquito spreadsheet.
- `IR_data.xls`.
- District boundaries.
- Climate files.

Outputs:

- Tables.
- Charts.
- Descriptive maps.

### Stage 2: Climate-linked habitat occurrence model

Only after positive and negative habitat observations are collected.

Outcome:

- `habitat_positive`: yes/no.

Methods:

- Logistic regression.
- GAM.
- Mixed-effects logistic model.
- Random Forest.

Validation:

- AUC.
- Sensitivity.
- Specificity.
- Calibration.
- Site/time split validation.

### Stage 3: Abundance model

Only after mosquito counts and sampling effort are available.

Outcome:

- Mosquito count per visit.

Methods:

- Poisson regression.
- Negative binomial regression.
- Zero-inflated models.
- GAM.

Validation:

- MAE.
- RMSE.
- Calibration.
- Temporal validation.

### Stage 4: Insecticide exposure risk model

Partially possible as a rule-based index after pesticide data are improved.

Inputs:

- Active ingredient.
- Chemical class.
- Crop.
- Application date.
- Frequency.
- Distance to habitat.

Output:

- Exposure risk category.

### Stage 5: Resistance model

Descriptive resistance summaries are now partially possible from `IR_data.xls`.

Predictive resistance modelling is only appropriate after denominator, protocol, control mortality, species cleaning, dates, and GPS coordinates are confirmed.

Outcome:

- Preliminary current outcome: `# death observed_24h`.
- Future validated outcome: mortality percentage or resistance status.

Methods:

- Logistic/binomial models.
- Mixed-effects models.
- Spatial risk summaries.

Immediate safe outputs:

- 24-hour death count summaries by insecticide, concentration, site, and district.
- PBO versus non-PBO descriptive comparisons.
- Species-cleaning table.

### Stage 6: Malaria early warning

Only after approved malaria outcome data are available.

Outcome:

- Cases or incidence by district/time.

Methods:

- Distributed lag models.
- GAM.
- Bayesian hierarchical models.
- Forecasting models.

## 8. Field Data Collection Stack

Recommended tool:

- KoboToolbox or ODK.

Forms needed:

### Mosquito habitat survey

Fields:

- visit_id
- site_id
- date
- GPS
- district
- habitat type
- water present
- larvae present yes/no
- larval count
- pupal count
- adult count if trapped
- sampling effort
- species if identified
- notes

### Pesticide exposure survey

Fields:

- site_id
- crop
- pesticide product name
- active ingredient
- application date
- frequency
- dose
- farmer-reported use
- distance to habitat

### Alert response form

Fields:

- alert_id
- district
- alert date
- risk level
- recommended action
- action taken
- actor
- response date
- follow-up result

## 9. Data Quality Rules

Every model-ready row must have:

1. A unique ID.
2. A valid date.
3. A valid location.
4. A clear outcome variable.
5. A clear sampling effort variable.
6. A source file.
7. A quality flag.

Quality flags:

- `valid`
- `missing_date`
- `missing_gps`
- `missing_outcome`
- `duplicate_possible`
- `needs_review`

## 10. Alert Logic for Prototype

Before validated models exist, use transparent rule-based alerts.

Example:

```text
Low risk:
  rainfall_14d low and temperature outside favorable range

Moderate risk:
  rainfall_14d moderate and suitable temperature/humidity

High risk:
  rainfall_14d high, suitable temperature/humidity, known habitat/insecticide exposure area
```

Do not call this a validated forecast.

Call it:

**Prototype climate-informed risk signal.**

## 11. Deployment Structure

### Local development

Use:

- Python virtual environment.
- Streamlit local server.
- CSV files.

### Pilot deployment

Use:

- Streamlit Community Cloud, institutional server, or internal machine.
- PostgreSQL/PostGIS if multiple users or larger data.

### Future scale

Use:

- Docker.
- PostgreSQL/PostGIS.
- Scheduled climate downloads.
- Authentication.
- Role-based access.
- Automated reports.

## 12. Requirements File

Recommended `requirements.txt`:

```text
pandas
numpy
geopandas
shapely
pyproj
rasterio
xarray
h5netcdf
netCDF4
scikit-learn
statsmodels
matplotlib
plotly
streamlit
folium
streamlit-folium
pyyaml
openpyxl
xlrd
pytest
```

## 13. System Build Phases

### Phase 1: Clean descriptive system

Can start now.

Deliverables:

- Data inventory.
- Cleaned mosquito categories.
- District climate dashboard.
- Data readiness dashboard.
- PI-facing documentation.

### Phase 2: Geospatial prototype

Requires GPS coordinates.

Deliverables:

- Site maps.
- Elevation by site.
- Land cover by site.
- Population around site.
- Distance to water/road/settlement.

### Phase 3: Field data system

Requires Kobo/ODK deployment.

Deliverables:

- Prospective field forms.
- Validated site registry.
- Positive/negative habitat data.
- Counts and effort.

### Phase 4: First models

Requires model-ready outcomes.

Deliverables:

- Occurrence model.
- Abundance model.
- Risk scoring.
- Model validation report.

### Phase 5: Decision-support pilot

Requires RBC/district collaboration.

Deliverables:

- Alerts.
- Response-action logs.
- User feedback.
- Operational evaluation.

## 14. What We Can Build Immediately

Build now:

- Streamlit dashboard prototype.
- Data readiness page.
- Climate district dashboard.
- Mosquito descriptive dashboard.
- Missing data tracker.
- PI/Nexa reporting package.

Do not build yet:

- Final predictive model.
- Malaria forecast.
- Confirmed resistance forecast.

## 15. Final Recommendation

The professional system should be built in layers:

1. Data organization.
2. Descriptive intelligence.
3. Climate/environment feature extraction.
4. Prospective field data collection.
5. Validated modelling.
6. Alert-action decision support.

This makes the project credible for Nexa and protects the team from overclaiming.
