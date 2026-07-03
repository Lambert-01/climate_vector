-- Climate-informed mosquito risk surveillance prototype schema.
-- PostgreSQL + PostGIS-ready design. Enable PostGIS in deployment:
-- CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS dataset_registry (
  dataset_id TEXT PRIMARY KEY,
  dataset_name TEXT NOT NULL,
  source_organization TEXT,
  source_url TEXT,
  license TEXT,
  spatial_resolution TEXT,
  temporal_resolution TEXT,
  download_date DATE,
  coverage_period TEXT,
  processing_method TEXT,
  file_checksum TEXT,
  responsible_person TEXT
);

CREATE TABLE IF NOT EXISTS processing_runs (
  run_id TEXT PRIMARY KEY,
  script_name TEXT NOT NULL,
  git_commit_hash TEXT,
  input_dataset_ids TEXT,
  output_file TEXT,
  run_timestamp TIMESTAMP,
  status TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  organization_id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  organization_type TEXT
);

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  organization_id TEXT REFERENCES organizations(organization_id),
  role TEXT NOT NULL,
  active_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  district TEXT,
  province TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  coordinate_source TEXT,
  coordinate_quality TEXT
);

CREATE TABLE IF NOT EXISTS field_visits (
  visit_id TEXT PRIMARY KEY,
  site_id TEXT REFERENCES sites(site_id),
  visit_date DATE,
  observer_user_id TEXT REFERENCES users(user_id),
  habitat_type TEXT,
  habitat_positive BOOLEAN,
  sampling_effort_type TEXT,
  sampling_effort_value DOUBLE PRECISION,
  quality_flag TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS mosquito_observations (
  observation_id TEXT PRIMARY KEY,
  visit_id TEXT REFERENCES field_visits(visit_id),
  life_stage TEXT,
  count INTEGER,
  species_raw TEXT,
  species_clean TEXT,
  identification_method TEXT
);

CREATE TABLE IF NOT EXISTS pesticide_exposure (
  pesticide_record_id TEXT PRIMARY KEY,
  visit_id TEXT REFERENCES field_visits(visit_id),
  active_ingredient TEXT,
  product_name TEXT,
  chemical_class TEXT,
  crop TEXT,
  application_date DATE,
  frequency TEXT,
  dose TEXT,
  distance_to_habitat_m DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS resistance_test_protocols (
  protocol_id TEXT PRIMARY KEY,
  protocol_name TEXT,
  assay_type TEXT,
  insecticide TEXT,
  concentration TEXT,
  exposure_time_minutes INTEGER,
  holding_time_hours INTEGER,
  expected_denominator INTEGER,
  interpretation_rule TEXT
);

CREATE TABLE IF NOT EXISTS resistance_test_replicates (
  replicate_id TEXT PRIMARY KEY,
  source_row_id INTEGER,
  site_id TEXT REFERENCES sites(site_id),
  district TEXT,
  test_date DATE,
  test_day INTEGER,
  test_month INTEGER,
  test_year INTEGER,
  species_raw TEXT,
  species_clean TEXT,
  insecticide_tested TEXT,
  concentration_label TEXT,
  number_exposed INTEGER,
  number_dead_24h INTEGER,
  mortality_rate DOUBLE PRECISION,
  control_mortality DOUBLE PRECISION,
  correction_applied BOOLEAN,
  resistance_status TEXT,
  source_sheet TEXT,
  quality_flag TEXT
);

CREATE TABLE IF NOT EXISTS climate_daily (
  location_id TEXT,
  date DATE,
  rainfall_mm DOUBLE PRECISION,
  tmean_c DOUBLE PRECISION,
  tmin_c DOUBLE PRECISION,
  tmax_c DOUBLE PRECISION,
  relative_humidity DOUBLE PRECISION,
  PRIMARY KEY (location_id, date)
);

CREATE TABLE IF NOT EXISTS climate_features (
  visit_id TEXT PRIMARY KEY REFERENCES field_visits(visit_id),
  rainfall_7d DOUBLE PRECISION,
  rainfall_14d DOUBLE PRECISION,
  rainfall_21d DOUBLE PRECISION,
  rainfall_30d DOUBLE PRECISION,
  tmean_7d DOUBLE PRECISION,
  humidity_7d DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS environmental_features (
  site_id TEXT PRIMARY KEY REFERENCES sites(site_id),
  elevation_m DOUBLE PRECISION,
  landcover_class TEXT,
  distance_to_water_m DOUBLE PRECISION,
  distance_to_road_m DOUBLE PRECISION,
  population_1km DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id TEXT PRIMARY KEY,
  alert_date DATE NOT NULL,
  district TEXT,
  risk_level TEXT,
  risk_reason TEXT,
  rule_or_model_version TEXT,
  uncertainty_level TEXT,
  issued_by TEXT REFERENCES users(user_id),
  approved_by TEXT REFERENCES users(user_id),
  status TEXT,
  alert_expiry_date DATE,
  recommended_action TEXT
);

CREATE TABLE IF NOT EXISTS alert_recipients (
  alert_recipient_id TEXT PRIMARY KEY,
  alert_id TEXT REFERENCES alerts(alert_id),
  user_id TEXT REFERENCES users(user_id),
  notification_method TEXT,
  sent_at TIMESTAMP,
  acknowledged_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS response_actions (
  action_id TEXT PRIMARY KEY,
  alert_id TEXT REFERENCES alerts(alert_id),
  responsible_organization TEXT,
  responsible_user TEXT REFERENCES users(user_id),
  action_due_date DATE,
  action_date DATE,
  action_status TEXT,
  action_type TEXT,
  evidence_file TEXT,
  follow_up_result TEXT
);

CREATE TABLE IF NOT EXISTS traps (
  trap_id TEXT PRIMARY KEY,
  trap_type TEXT,
  manufacturer TEXT,
  ai_model_version TEXT,
  site_id TEXT REFERENCES sites(site_id),
  status TEXT
);

CREATE TABLE IF NOT EXISTS trap_deployments (
  deployment_id TEXT PRIMARY KEY,
  trap_id TEXT REFERENCES traps(trap_id),
  site_id TEXT REFERENCES sites(site_id),
  deployed_at TIMESTAMP,
  retrieved_at TIMESTAMP,
  trap_hours DOUBLE PRECISION,
  collector TEXT,
  weather_notes TEXT
);

CREATE TABLE IF NOT EXISTS trap_detections (
  detection_id TEXT PRIMARY KEY,
  deployment_id TEXT REFERENCES trap_deployments(deployment_id),
  image_path TEXT,
  detected_species TEXT,
  detected_count INTEGER,
  confidence_score DOUBLE PRECISION,
  human_verified BOOLEAN,
  verification_status TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  timestamp TIMESTAMP,
  old_value TEXT,
  new_value TEXT
);

