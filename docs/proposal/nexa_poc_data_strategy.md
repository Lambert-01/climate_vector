# Nexa Proof-of-Concept Data Strategy

Project: Modelling Mosquito Ecology and Insecticide Exposure Under Climate Change

This project should be framed as a Proof of Concept, not as a finished national prediction product. The current data and prototype are strong enough to demonstrate the innovation, but not enough to claim validated mosquito abundance, resistance, or malaria forecasts.

## Funding Fit

The NCST / Grand Challenges Rwanda Nexa call is appropriate because it supports proof-of-concept innovations that help local health actors turn climate-driven health risk signals into timely action. Our project fits the climate-informed early warning and monitoring area because it combines climate data, mosquito ecology, insecticide exposure, resistance monitoring, and decision-support dashboards.

## What We Can Use Immediately

The current system can already use:

- NASA POWER daily climate data for district rainfall, temperature, and humidity.
- Rwanda administrative boundaries for national and district maps.
- GBIF / VectorBase mosquito occurrence evidence as external supporting context.
- WorldClim baseline climatology, elevation, population, land cover, and OSM files for geospatial covariates after raster/vector extraction.
- Existing PI mosquito ecology and resistance spreadsheets for descriptive dashboards and data-readiness auditing.

These inputs are enough for a serious proof-of-concept dashboard, district climate suitability screening, and a data-quality workflow.

## What Cannot Be Recovered From The Internet

The following variables are study-specific and cannot be safely invented from public sources:

- Exact collection dates for PI field rows.
- Official sentinel-site GPS coordinates.
- Mosquito counts or abundance per sample.
- Sampling effort and collection method per sample.
- Positive and negative habitat status.
- Resistance test denominator, protocol, and control mortality.
- Laboratory-confirmed species and assay validity.

Public datasets can support climate/environment covariates, but they cannot replace local field and laboratory outcome variables.

## How To Reframe Missing Data

The missing data should not be presented as failure. It should be presented as the main proof-of-concept work package:

1. Retrospective data rescue
   - Recover dates, site GPS, counts, effort, and resistance metadata from PI field forms and lab records.

2. Prospective pilot surveillance
   - Collect model-ready mosquito ecology and resistance data in selected sentinel districts using a simple digital form.

3. Climate and environment linkage
   - Link each validated site/date to NASA POWER, CHIRPS rainfall, WorldClim, land cover, elevation, and population layers.

4. Decision-support dashboard
   - Display climate suitability, mosquito observations, resistance signals, missing-data status, and recommended action workflow.

5. Model validation
   - Compare district/site risk signals against prospective mosquito and resistance observations.

## Practical Proposal Position

Use this wording:

> We have built an initial climate-vector data engine and dashboard using existing entomological records and public climate/environment datasets. The proof-of-concept phase will validate the system in selected Rwandan sentinel sites by recovering historical metadata, collecting prospective model-ready surveillance data, linking it to climate and environmental covariates, and testing whether climate-driven mosquito ecology signals can support earlier local action.

## Minimum Pilot Dataset To Request

Ask PI/lab/field teams for a simple Excel/CSV package:

- `sites.csv`: site_name, district, latitude, longitude, coordinate_source.
- `field_visits.csv`: sample_id, site_name, collection_date, method, effort_type, effort_value, habitat_type, habitat_positive.
- `mosquito_counts.csv`: sample_id, species, life_stage, count, identification_method.
- `resistance_tests.csv`: replicate_id, site_name, test_date, species, insecticide, concentration, number_exposed, number_dead_24h, control_mortality, protocol.
- `agriculture_exposure.csv`: site_name, date_or_season, insecticide, chemical_class, dose_or_frequency, field_location_or_cell.

## Recommended Scope For Application

Do not apply as Transition to Scale unless a validated field pilot already exists. Apply as Proof of Concept.

Suggested scope:

- 18 to 24 months.
- 4 to 8 pilot districts.
- 20 to 40 sentinel sites.
- Monthly or biweekly mosquito ecology observations during high-risk seasons.
- Resistance testing with complete denominator, control mortality, protocol, and species metadata.
- Dashboard demonstration for PI, district health/environment actors, and vector-control stakeholders.

## Success Criteria

By the end of the proof-of-concept phase, the project should show:

- At least 90% completeness for date, GPS, count, effort, and resistance denominator fields in pilot data.
- Climate-linked mosquito ecology dashboard functioning for selected districts.
- A validated distinction between descriptive suitability signals and model-based predictions.
- A documented pathway from climate-risk signal to surveillance or response action.

