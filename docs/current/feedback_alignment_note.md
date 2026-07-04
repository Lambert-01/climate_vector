# Feedback Alignment Note

## Verdict

The feedback is scientifically correct and should guide the project.

The two PI datasets are enough for a strong proof-of-concept submission, but not enough for a finished predictive climate-health model. The system should be presented as a current-data intelligence prototype that is ready for field validation, not as a validated mosquito abundance, malaria outbreak, or confirmed resistance prediction platform.

## What We Should Claim

The project can credibly claim:

- Real PI/lecturer entomology and susceptibility-test data are available.
- A working digital dashboard/API/data pipeline has been built.
- Mosquito habitat, larval-source, site, district, agricultural insecticide, species-context, insecticide-test, and mortality summaries can be shown now.
- Public climate and environment data can be integrated at district/provisional-site level.
- The platform identifies where validation work should occur.
- A pilot can collect the missing GPS, dates, effort, denominator, protocol, control mortality, and action/outcome data.

## What We Should Not Claim

The project should not claim:

- validated mosquito abundance forecasting
- climate-driven malaria outbreak prediction
- confirmed insecticide resistance hotspots
- automatic public health alerts
- full future climate scenario modelling
- complex machine learning using incomplete outcome variables

## Dashboard Modules To Prioritize

The current system should focus on five production-looking modules:

1. Data readiness and quality control
2. Mosquito habitat and agricultural exposure explorer
3. Insecticide susceptibility test intelligence
4. District-level climate context
5. Alert-review and field-verification workflow

## Mathematical Layer

Use transparent applied mathematics at the correct maturity level:

- mortality summaries where denominator/mortality-rate fields are available
- data-readiness scoring
- field-verification priority scoring
- climate suitability context as a screening signal

All scoring must be labelled as prioritization or screening, not disease prediction.

## Stack Note

The external feedback recommends keeping Vue if Vue is already working. This repository currently uses React/Vite, FastAPI, and Python pipelines. Therefore the best interpretation is: keep the working frontend stack instead of restarting again. Do not migrate to Vue unless the user explicitly decides to replace the current React implementation.

## Application Narrative

Recommended sentence:

> We do not claim that incomplete historical data already predicts malaria. We have built a locally led, scientifically governed platform that integrates existing mosquito habitat and susceptibility evidence, connects it to climate context, identifies validation gaps, and is ready to be field-tested as a climate-informed vector-response system.
