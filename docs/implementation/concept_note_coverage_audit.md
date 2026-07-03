# Concept Note Coverage Audit

This audit compares the current implemented system against the concept note: "Modelling Mosquito Ecology and Insecticide Exposure Under Climate Change Using Essential Climate Variables and Entomological Surveillance Data."

## Executive Assessment

The current system answers a big part of the concept note as a professional proof-of-concept and data-readiness platform. It does not yet fully answer the concept note as a validated national prediction system.

Overall status:

```text
Database and architecture: strong prototype
Dashboard and decision-support interface: strong prototype
Climate integration: partial but useful
Entomological descriptive analysis: strong
Resistance descriptive analysis: partial
Mathematical formulation: strong framework
Validated predictive modelling: blocked by missing data
Future climate scenario analysis: not yet implemented
National operational alerting: not yet ready
```

## Objective Coverage

| Concept note objective | Current status | Evidence in system | Main blocker |
|---|---|---|---|
| Collect and characterize mosquitoes using AI trap across ecological zones/seasons | Not answered by current data | Dashboard can store/display site and mosquito records | AI trap records, full dates, counts, sampling effort, collection method |
| Evaluate relationship between ECVs and mosquito larval occurrence/resistance | Partially answered | NASA POWER climate, district suitability proxy, modelling formulas | No full dates/GPS to link row-level mosquito outcomes to ECVs |
| Assess agricultural insecticide exposure influence on breeding sites | Partially answered | Raw agricultural insecticide fields and resistance insecticide summaries | No exposure intensity, timing, chemical class mapping, GPS buffers |
| Develop predictive spatial-temporal mosquito abundance models | Framework answered; modelling blocked | GLMM/GAM/spatiotemporal formulas documented | No mosquito counts, effort, full dates, GPS, negative observations |
| Identify high-risk areas for mosquito proliferation and resistance | Partially answered | District-level risk proxy and resistance summaries | Current risk is descriptive, not validated prediction |

## Expected Output Coverage

| Expected output | Current status | Notes |
|---|---|---|
| Comprehensive climate-entomology database | Partially complete | Neon schema, seed script, climate data, mosquito/resistance records loaded. Missing official GPS and full field metadata. |
| Spatial maps of breeding habitat suitability | Partial | Frontend map and district suitability model exist. True site-level maps blocked by GPS. |
| Seasonal mosquito abundance forecasts | Not yet possible | Requires dates, counts, effort, repeated sampling, and validation. |
| Climate change projections under SSPs | Not implemented | Framework documented, but future SSP rasters/time series not yet integrated. |
| Agricultural insecticide exposure risk maps | Partial | Insecticide fields exist; exposure-risk formula documented. Needs chemical class/intensity/location. |
| Resistance hotspots | Partial | Resistance test summaries exist. Final hotspot classification blocked by denominator/control/protocol. |
| Publications/policy briefs | Not yet | Scientific outputs need validated models and PI-confirmed datasets. |
| Decision-support tool for RBC/vector control | Strong prototype | Dashboard, alerts workflow, readiness, modelling page, API, database foundation. Not yet operationally validated. |

## Data Availability Assessment

Currently available:

- 3,547 mosquito ecology records.
- 3,547 resistance-test records.
- 30 district climate centroid files from NASA POWER.
- District, site names, breeding-site type, agricultural insecticide fields.
- Anopheles species raw labels.
- 24-hour death observed for resistance rows.
- PostgreSQL/Neon schema and seeded records.

Critical missing or incomplete:

- Month and year are missing for current mosquito/resistance rows.
- Official GPS coordinates are missing for sites.
- Mosquito abundance/counts are missing.
- Sampling effort is missing.
- Positive and negative habitat status is missing.
- Resistance denominator is missing.
- Control mortality is missing.
- Resistance test protocol is missing.
- Agricultural insecticide timing/intensity is missing.
- Future climate SSP data are not yet integrated.
- Malaria/action/intervention outcome data are not available.

## Why Dashboard Gaps Are Still Showing

The dashboard gaps are scientifically correct. They are not a software failure.

The system is warning that the project cannot honestly claim validated prediction until the missing field variables are supplied. A national-level system must show these gaps clearly because hiding them would create false confidence.

## What Is Already Strong

- The project has a professional full-stack architecture.
- API, frontend, database, pipeline, and tests exist.
- Neon database has been seeded.
- Mathematical framework is now suitable for PI/national review.
- Data-readiness validation is automated.
- Dashboard can support PI discussion immediately.
- CORS/frontend issues have been fixed.

## What Must Be Done Next

1. Get official PI/site coordinate file for all 32 observed sites.
2. Get full dates: day, month, year.
3. Confirm whether each row is a trap/sample/replicate/observation.
4. Confirm mosquito count or abundance variable.
5. Confirm sampling effort.
6. Confirm positive and negative habitat observations.
7. Confirm resistance denominator, protocol, control mortality, species, and validity criteria.
8. Classify agricultural insecticides by chemical class/mode of action.
9. Integrate SSP climate scenario datasets.
10. Only then train and validate GLMM/GAM/ML/spatiotemporal models.

## Final Judgement

The project is ready as a national proof-of-concept and PI-facing data-readiness decision-support system.

The project is not yet ready as a validated national predictive system.

The biggest achievement is that the system now honestly separates:

- what the current data can support,
- what the mathematics will support after data completion,
- and what must not be claimed yet.
