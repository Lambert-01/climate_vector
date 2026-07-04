# Climate Vector Rwanda

Professional Proof-of-Concept workspace for a climate-informed mosquito ecology, insecticide-resistance, and decision-support system for Rwanda.

## Stack

- Python data engine: `packages/climate_vector`
- Python API: `apps/api` using FastAPI
- React frontend: `apps/web` using Vite + React
- Database design: `database/schema.sql` for PostgreSQL/PostGIS
- Data workflow: `data/raw -> data/interim -> data/processed`

## Current Build Status

Implemented:

- Clean monorepo structure.
- Raw `.xls` extraction using standard-library Python.
- First-pass mosquito ecology table.
- First-pass resistance-test table from `IR_data.xls`.
- Data readiness summary.
- Descriptive summary tables.
- Static HTML dashboard.
- FastAPI skeleton.
- React/Vite frontend skeleton.
- PostgreSQL/PostGIS-ready schema.
- Data dictionaries.
- Implementation master plan.
- Public/open-data feature extraction from NASA POWER, GBIF, WorldClim inventory, ERA5-Land summary, and geospatial source inventory.

Not implemented yet:

- Installed Python/Node dependencies.
- Running FastAPI server.
- Running React dev server.
- Site-level climate/environment extraction.
- Validated resistance classification.
- Validated prediction models.
- Malaria early warning.

## Project Structure

```text
apps/
  api/                  FastAPI backend
  web/                  React frontend

packages/
  climate_vector/       Python data engine

scripts/
  pipelines/            Reproducible data pipelines

data/
  raw/                  Original PI/lecturer files
  external/             Open climate/environment/population data
  interim/              Generated intermediate files
  processed/            Generated dashboard/model-ready files

docs/
  implementation/       Master implementation plan
  architecture/         Full stack architecture
  data_audits/          Dataset assessments
  data_dictionary/      Data dictionaries

database/
  schema.sql            PostgreSQL/PostGIS schema
```

## Run Current Python Pipeline

```bash
python3 scripts/pipelines/01_ingest_raw_excel.py
python3 scripts/pipelines/02_build_processed_tables.py
python3 scripts/pipelines/03_build_static_dashboard.py
python3 scripts/pipelines/05_validate_model_readiness.py
python3 scripts/pipelines/06_build_gap_resolution_package.py
python3 scripts/pipelines/07_build_public_open_data_features.py
```

Static report:

```text
outputs/reports/static_dashboard.html
outputs/reports/model_readiness_validation.md
outputs/reports/public_data_exploitation_summary.md
```

Public/open-data tables now generated:

```text
outputs/tables/public_data_sources_inventory.csv
outputs/tables/worldclim_archives_manifest.csv
data/processed/gbif_mosquito_occurrences_rwanda.csv
data/processed/public_data_district_features.csv
data/processed/era5_land_available_summary.csv
```

## Run API Later

After installing API dependencies:

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Run React Frontend Later

After installing Node dependencies:

```bash
cd apps/web
npm install
npm run dev
```

## Scientific Rule

Current outputs are descriptive and readiness-focused. Do not claim validated mosquito abundance, resistance, or malaria prediction until missing dates, GPS coordinates, resistance denominators/protocols, control mortality, field counts, sampling effort, positive/negative observations, and health/action outcomes are confirmed.
