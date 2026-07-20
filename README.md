# DengueEW-GL: Climate-Informed Dengue Early Warning Proof of Concept

This repository contains the pre-developed digital architecture for the proposed
Great Lakes dengue early-warning proof of concept. It combines climate context,
Aedes occurrence evidence, candidate sentinel-site planning, community reporting,
prospective field-surveillance workflows, genomic sample tracking, review signals,
and monitoring and evaluation.

The project uses:

- `data/raw/IR_data.xls`
- `data/raw/mosquito_behavior_raw.xls`
- useful public climate, environment, population, boundary, and mosquito-occurrence data in `data/external/`
- the updated proposal in `proposal.doc`

The current system supports operational pilot preparation and transparent evidence
review. It does not claim a validated dengue outbreak forecast. Prospective Aedes
surveillance, official dengue outcomes, genomic results, community pilot evidence,
and external validation are grant-period activities.

## Submission Readiness

See `docs/current/dengue_submission_technical_readiness.md` for proposal alignment,
implemented modules, deployment settings, evidence boundaries, and the remaining
PI-side submission actions.

See `docs/current/co_pi_climate_mathematical_modelling_framework.md` for the Co-PI
climate analytics work package, equations currently applied, grant-period model
ladder, validation protocol, governance boundaries, and proposal-ready role language.

## Clean Data Structure

```text
data/
  raw/                  PI/lecturer source datasets
  external/             public covariate data kept because it can help the model
  interim/              regenerated temporary extraction tables
  processed/            regenerated model/dashboard-ready tables

docs/
  current/              active technical and submission documentation

outputs/
  reports/              regenerated reports
  tables/               regenerated summary tables
```

## System Stack

- Python data engine and modelling pipelines
- FastAPI backend
- React/Vite frontend
- PostgreSQL/Neon persistence with Alembic migrations
- Public climate/environment data integration

## Run Locally

```bash
bash scripts/run_all.sh
```

Open `http://127.0.0.1:5173`. Stop both services with
`bash scripts/stop_all.sh`.

Apply database migrations with:

```bash
.venv/bin/alembic upgrade head
```

## Scientific Boundary

Legacy PI Anopheles ecology and insecticide-resistance datasets are retained as
historical field-infrastructure and vector-control context. They are not treated as
Aedes surveillance or dengue outcomes. Missing prospective evidence is represented
as a readiness gate and never filled with synthetic observations.
