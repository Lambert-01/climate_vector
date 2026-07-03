# Current Stack

## Backend

- Python package: `packages/climate_vector`
- API app: `apps/api`
- API framework target: FastAPI
- Data format for first PoC: CSV
- Later database: PostgreSQL + PostGIS

## Frontend

- App: `apps/web`
- Framework: React
- Build tool: Vite
- Dashboard status: scaffolded, API-driven

## Current Working Pipeline

The pipeline already works without external Python dependencies:

```bash
python3 scripts/pipelines/01_ingest_raw_excel.py
python3 scripts/pipelines/02_build_processed_tables.py
python3 scripts/pipelines/03_build_static_dashboard.py
```

## Current Limitation

Dependencies for FastAPI and React are not installed yet. The structure is ready; installation can be done when you are ready to run the interactive app.
