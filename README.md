# Rwanda Climate-Vector Intelligence Prototype

This workspace is being restarted around the data that is available now.

The project uses:

- `data/raw/IR_data.xls`
- `data/raw/mosquito_behavior_raw.xls`
- useful public climate, environment, population, boundary, and mosquito-occurrence data in `data/external/`
- the concept note in `docs/concept_note_original.doc`

The goal is a professional proof-of-concept for a climate-informed mosquito ecology and insecticide-exposure decision-support system for Rwanda. The system must be honest: it can produce descriptive analytics, climate suitability indices, public-data context, provisional maps, readiness scoring, and pilot planning. It must not claim validated prediction of mosquito abundance, insecticide resistance, or malaria outcomes until missing field/lab variables are collected.

## Active Plan

Read the current implementation plan:

```text
docs/current/current_data_implementation_plan.md
```

## Clean Data Structure

```text
data/
  raw/                  PI/lecturer datasets only
  external/             public covariate data kept because it can help the model
  interim/              regenerated temporary extraction tables
  processed/            regenerated model/dashboard-ready tables

docs/
  concept_note_original.doc
  current/              active current-data implementation plan

outputs/
  reports/              regenerated reports
  tables/               regenerated summary tables
```

## System Stack

- Python data engine and modelling pipelines
- FastAPI backend
- React/Vite frontend
- PostgreSQL/PostGIS-ready database design
- Public climate/environment data integration

## Scientific Rule

This is a current-data proof-of-concept. Missing exact sample dates, official GPS, mosquito counts, sampling effort, positive/negative habitat observations, resistance denominators, control mortality, assay protocol, and malaria/intervention outcomes remain future pilot or PI-confirmation variables.
