# Build Status

## What Has Started

The project has been reorganized into a professional full-stack structure with a Python data engine, FastAPI backend, and React frontend.

Current implementation includes:

- Raw Excel ingestion from `data/raw/mosquito_behavior_raw.xls` and `data/raw/IR_data.xls`.
- Processed preliminary mosquito ecology table.
- Processed preliminary resistance-test table.
- Data readiness summary.
- Descriptive summary tables for the dashboard.
- Static HTML report at `outputs/reports/static_dashboard.html`.
- FastAPI API scaffold in `apps/api`.
- React/Vite frontend scaffold in `apps/web`.
- Reusable Python package scaffold in `packages/climate_vector`.
- Central configuration files in `config`.

## Important Scientific Limit

The current data supports a descriptive prototype and data-readiness analysis. It does not yet support validated mosquito abundance prediction, resistance classification, or malaria early-warning modelling.

The main missing items are:

- Full sample dates.
- GPS coordinates or validated site coordinates.
- Mosquito counts and sampling effort.
- Positive and negative habitat observations.
- Resistance-test denominators and protocol metadata.
- Control mortality and correction method.
- Clean species confirmation.
- Malaria case or intervention/action outcome data.

## Current Commands

Run the full data pipeline:

```bash
make pipeline
```

Run the API after installing dependencies:

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run the React frontend after installing dependencies:

```bash
cd apps/web
npm install
npm run dev
```

## Next Implementation Step

The next useful step is to install dependencies, run the API and React frontend together, and then connect real map/site coordinates once the PI confirms the official site reference file.
