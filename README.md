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
```

Static report:

```text
outputs/reports/static_dashboard.html
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

