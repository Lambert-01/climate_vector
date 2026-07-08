# ArboRisk-GL: Great Lakes Arboviral Intelligence Prototype

This workspace is being restarted around the data that is available now.

The project uses:

- `data/raw/IR_data.xls`
- `data/raw/mosquito_behavior_raw.xls`
- useful public climate, environment, population, boundary, and mosquito-occurrence data in `data/external/`
- the concept note in `docs/concept_note_original.doc`

The goal is a professional proof-of-concept for a climate-informed arboviral disease preparedness and vector-intelligence system for the African Great Lakes region. The system must be honest: it can produce climate/vector preparedness context, public-data evidence, Rwanda proof-of-concept entomology infrastructure, regional Aedes/Culex occurrence context, readiness scoring, and pilot planning. It must not claim confirmed arboviral outbreak prediction or incidence forecasting until partner surveillance, vector, livestock, and laboratory validation data are collected.

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

This is a current-data proof-of-concept. Missing exact sample dates, official GPS, Aedes/Culex field surveillance, ovitrap/container surveys, livestock/RVF event data, confirmed arboviral case or febrile illness indicators, susceptibility denominators, control mortality, and assay protocol remain future pilot, PI-confirmation, or RBC/MoH partner-governance variables.
