# ArboRisk-GL Master Blueprint

## Climate-Informed Arboviral Disease Preparedness and Vector Intelligence for the African Great Lakes Region

Prepared for: NCST/NEXA climate-health innovation application and PhD-level research development  
Lead modeller/developer: Ndacyayisaba Lambert  
System name: **ArboRisk-GL**  
Date: July 2026

---

## 1. Executive Summary

ArboRisk-GL is a climate-informed arboviral disease preparedness and vector-intelligence platform designed for the African Great Lakes region. The system has been rebuilt from the earlier Rwanda malaria/vector prototype into a broader, more policy-relevant decision-support platform for dengue, chikungunya, yellow fever, Rift Valley fever, Zika-context preparedness, and related mosquito-borne arboviral threats. The redesigned system integrates lecturer-provided entomological and susceptibility datasets, a newly provided 33-sentinel-site coordinate map, public climate data, public vector occurrence records, land-cover/elevation context, and data-readiness governance into a single professional dashboard and API.

The purpose of the system is not to claim that confirmed arboviral outbreaks can already be predicted. The purpose is to provide a disciplined, working, evidence-based platform that shows how climate, vector ecology, environmental suitability, and surveillance readiness can be combined to guide field verification, preparedness planning, and regional coordination. This distinction is essential for policy credibility. The platform is deliberately honest: it separates what is available now from what must be collected during the funded pilot.

The current build uses Rwanda as the working proof-of-concept because the lecturer datasets and sentinel map are Rwanda-based. However, the application is now framed for the African Great Lakes region through regional climate points and regional public vector occurrence context. This design is scientifically defensible: Rwanda provides the local data infrastructure, while the Great Lakes framing provides the climate-health and cross-border public-health relevance.

The current system now includes:

- two lecturer datasets: mosquito behaviour/ecology and insecticide/susceptibility data;
- a new lecturer-provided 33-sentinel-site coordinate map from `Map- 33 sentinel.xls`;
- NASA POWER daily climate data for seven Great Lakes regional points;
- GBIF public vector occurrence context for Aedes, Culex, and Anopheles species;
- ERA5-Land monthly climate summaries;
- CHIRPS rainfall samples;
- ESA WorldCover land-cover layers;
- WorldClim elevation and baseline climate archives;
- Rwanda administrative boundaries and site registry tables;
- a policy-facing dashboard with an Arboviral Preparedness module;
- a FastAPI backend with arboviral, site, climate, vector, readiness, and action-review endpoints;
- a data-source validation registry covering 18 evidence layers;
- a clear governance boundary for RBC/MoH health data and future NISR context data.

The system should be presented as a **current-data, climate-vector preparedness prototype**. The funded project will then transform it into a validated operational intelligence platform by adding prospective Aedes/Culex surveillance, confirmed arboviral case or febrile illness indicators, livestock/RVF event data, formal RBC/MoH data-sharing, field validation, and partner action logs.

---

## 2. Revised Problem Statement

Arboviral diseases are a growing climate-health concern in Africa. Dengue, chikungunya, yellow fever, Rift Valley fever, Zika-context risk, and other arboviral infections are influenced by temperature, rainfall, humidity, surface water, land cover, urbanization, vector ecology, livestock interfaces, and public-health response capacity. In the African Great Lakes region, these drivers are intensified by cross-border mobility, lake-basin ecology, rapidly growing cities, climate variability, flooding, agricultural expansion, and uneven surveillance coverage.

The region needs better early-action intelligence. Current systems often treat disease surveillance, climate data, vector ecology, and response planning as separate activities. This separation delays preparedness, especially when confirmed case data are incomplete or when field teams do not have a clear way to prioritize verification sites. For arboviral diseases, where outbreaks can be under-detected and where symptoms overlap with other febrile illnesses, the challenge is not only prediction. The challenge is building a practical decision-support system that helps health, environment, agriculture, and research partners know where to look, what to verify, and which missing data must be collected.

The ArboRisk-GL project responds to this gap by creating a climate-informed platform that integrates available evidence now while making future validation needs explicit. It is designed for policymakers, researchers, and implementation partners who need structured evidence rather than raw formulas. The system converts complex climate-vector data into readable indicators: preparedness level, evidence source, confidence, limitation, recommended verification, and readiness status.

---

## 3. Revised Aim

To develop and validate a climate-informed arboviral disease preparedness and vector-intelligence platform for the African Great Lakes region, integrating climate anomalies, vector occurrence evidence, sentinel-site data, environmental context, One Health indicators, and surveillance-readiness information to guide field verification, policy planning, and cross-border early action.

---

## 4. Revised Objectives

1. **Build a regional arboviral preparedness evidence base.**  
   Integrate lecturer-provided Rwanda vector datasets with Great Lakes climate points, public vector occurrence records, land-cover/elevation context, and validated sentinel-site coordinates.

2. **Develop policy-facing preparedness indicators.**  
   Translate climate, vector, and environmental signals into dashboard outputs that show where field verification and partner coordination should be prioritized.

3. **Create disease-group preparedness profiles.**  
   Structure the platform around dengue/chikungunya/Zika-context Aedes preparedness, yellow fever preparedness, and Rift Valley fever One Health preparedness.

4. **Strengthen geospatial site intelligence.**  
   Use the new 33-sentinel-site lecturer map to replace provisional mapping where possible and to support Rwanda proof-of-concept site-level visualization.

5. **Define a validation pathway.**  
   Identify the exact partner data needed for a validated system: Aedes/Culex field surveillance, ovitrap/container indices, confirmed arboviral/febrile illness indicators, livestock/RVF events, vaccination coverage, laboratory confirmation, action logs, and official site metadata.

6. **Prepare a fundable climate-health innovation system.**  
   Produce a dashboard, API, documentation, and research plan that are credible for national policy, regional preparedness, and PhD-level applied mathematical modelling.

---

## 5. Why the Pivot Is Scientifically Strong

The previous framing around malaria in Rwanda was narrower. It depended heavily on Anopheles ecology, malaria outcomes, and resistance interpretation. The new arboviral framing is broader and more aligned with climate-health innovation. Arboviral diseases are highly sensitive to rainfall, temperature, humidity, standing water, land cover, urbanization, animal-human interfaces, and mobility. These are exactly the types of data that the platform can already ingest.

This pivot also allows the existing datasets to remain valuable. The lecturer mosquito dataset becomes proof that the system can ingest and analyse local entomological field data. The lecturer IR dataset becomes proof that the platform can manage laboratory/susceptibility evidence and vector-control context. The new 33-sentinel-site map gives a stronger spatial foundation. Public climate and occurrence records expand the framing from a local proof-of-concept into a regional preparedness system.

The pivot is not pretending that the old data are perfect arboviral disease data. Instead, it reframes them as **infrastructure evidence**: they demonstrate the data-engineering, modelling, dashboard, and governance architecture required for a prospective arboviral surveillance platform. This is precisely the type of transition that a climate-health innovation grant can fund.

---

## 6. Target Diseases and Vector Groups

### 6.1 Dengue, Chikungunya, and Zika-Context Preparedness

These diseases are grouped because they share key Aedes vectors and environmental drivers. The main vectors are Aedes aegypti and Aedes albopictus. The relevant environmental factors include temperature suitability, rainfall, humidity, urban built-up areas, water storage, containers, population density, and mobility. The platform currently supports this disease group using Great Lakes climate points, GBIF Aedes occurrence context, land-cover layers, and Rwanda proof-of-concept vector infrastructure.

The dashboard should describe this group as **Aedes-borne preparedness**, not confirmed dengue or chikungunya forecasting. The current claim is that the system can help prioritize where Aedes surveillance and source-reduction planning should be strengthened.

### 6.2 Yellow Fever Preparedness

Yellow fever has urban and sylvatic dimensions, and its risk is linked to Aedes ecology, vaccination coverage, forest-edge exposure, mobility, and surveillance sensitivity. The current platform can support yellow fever preparedness as a planning layer, but not vaccination targeting or outbreak prediction. For validated use, the platform will need vaccination coverage, official suspected/confirmed yellow fever surveillance, and ecological exposure data.

### 6.3 Rift Valley Fever One Health Watch

Rift Valley fever requires a One Health perspective. The relevant signals include heavy rainfall, flooding, vegetation greenness, livestock density, livestock abortion/mortality events, Aedes and Culex vectors, wetlands, pastoral/agricultural zones, and laboratory confirmation. The current platform can support an RVF preparedness watch using rainfall, wetness proxies, land-cover context, Culex occurrence context, and planned JRC surface-water layers. It cannot yet validate RVF risk without livestock and laboratory data.

---

## 7. Current Data Assets

### 7.1 Lecturer Mosquito Behaviour Dataset

File:

`data/raw/mosquito_behavior_raw.xls`

Current role:

- Rwanda proof-of-concept vector ecology infrastructure;
- habitat and breeding-site evidence;
- district/site-level record context;
- field-data ingestion demonstration;
- basis for expanding forms to Aedes/Culex surveillance.

Limitations:

- not arbovirus-specific;
- incomplete exact dates;
- missing standardized counts and sampling effort;
- limited species confirmation;
- not presence/absence sampling;
- not enough for validated outbreak prediction.

### 7.2 Lecturer IR/Susceptibility Dataset

File:

`data/raw/IR_data.xls`

Current role:

- susceptibility and vector-control context;
- laboratory evidence workflow demonstration;
- mortality and insecticide exposure signal review;
- proof that the platform can manage lab-style surveillance evidence.

Limitations:

- denominator/protocol/control mortality need confirmation;
- species context is not sufficient for Aedes/Culex arboviral susceptibility claims;
- should not be interpreted as final resistance classification.

### 7.3 Lecturer 33-Sentinel-Site Map

File:

`Map- 33 sentinel.xls`

Processed output:

`data/processed/context/sentinel_sites_33.csv`

Current role:

- lecturer-provided WKT coordinates for 33 sentinel sites;
- replaces purely provisional map coordinates for the Rwanda proof-of-concept;
- supports site-level visualization, field verification planning, and future sentinel surveillance design.

Important cleaning decision:

One row had a `lat` column inconsistency, but the WKT point contained the correct coordinate. The processing pipeline therefore uses WKT as the trusted coordinate source. This is documented and reproducible in `scripts/pipelines/15_build_sentinel_registry.py`.

### 7.4 NASA POWER Great Lakes Climate Points

Files:

`data/external/climate/nasa_power/*.csv`

Processed output:

`data/processed/context/great_lakes_climate_summary.csv`

Locations:

- Kigali, Rwanda
- Goma, DRC
- Bukavu, DRC
- Kampala, Uganda
- Bujumbura, Burundi
- Mwanza, Tanzania
- Kisumu, Kenya

Variables:

- daily rainfall;
- mean temperature;
- minimum temperature;
- maximum temperature;
- relative humidity.

Current role:

- regional climate context for arboviral preparedness;
- rainfall/temperature/humidity screening;
- Great Lakes proof that the platform is not Rwanda-only.

### 7.5 GBIF Great Lakes Vector Occurrence Context

Files:

`data/external/vector_occurrence/gbif/*.csv`

Processed output:

`data/processed/context/great_lakes_vector_occurrence_summary.csv`

Downloaded species:

- Aedes aegypti;
- Aedes albopictus;
- Culex quinquefasciatus;
- Anopheles gambiae;
- Anopheles funestus.

Current result:

- Aedes aegypti: 329 records;
- Aedes albopictus: 0 records found in the selected regional query;
- Culex quinquefasciatus: 51 records;
- Anopheles gambiae: 3000 capped records;
- Anopheles funestus: 3000 capped records.

Use boundary:

GBIF records are presence-only and reporting-biased. They support public vector occurrence context but do not replace local field surveillance.

### 7.6 ERA5-Land Monthly Climate

File:

`data/processed/era5_land_rwanda_monthly_2020_2026.csv`

Current role:

- gridded climate baseline;
- monthly climate context;
- future expansion to regional extraction.

### 7.7 CHIRPS Rainfall

Current role:

- high-resolution rainfall context;
- rainfall anomaly and wetness method demonstration;
- future district/site extraction.

### 7.8 ESA WorldCover, Elevation, Population, OSM, Boundaries

Current role:

- land-cover and built-up context;
- water/wetland/cropland context;
- elevation context;
- population/exposure context;
- accessibility and settlement context;
- geospatial map support.

### 7.9 JRC Global Surface Water

Current status:

planned.

Reason:

It requires Google Earth Engine export. It is highly relevant for water occurrence, seasonality, recurrence, and RVF/wetness context, but it should not block the 20-day submission.

### 7.10 NISR and RBC/MoH

NISR:

- future official population and socioeconomic context.

RBC/MoH:

- future formal arboviral/febrile illness/laboratory/intervention data.

Governance:

These are not download-now datasets. They require formal access, institutional coordination, and data-sharing agreements.

---

## 8. Rebuilt System Architecture

The rebuilt system has four layers.

### 8.1 Data Layer

The data layer stores:

- raw lecturer Excel files;
- processed PI ecology and susceptibility tables;
- sentinel-site registry;
- NASA POWER Great Lakes climate CSVs;
- GBIF vector occurrence CSVs;
- ERA5 monthly climate summary;
- CHIRPS rainfall samples;
- land-cover, elevation, population, OSM, and boundary files;
- data-source validation registry.

### 8.2 Processing Layer

The processing layer includes scripts for:

- Excel ingestion;
- mosquito/susceptibility table generation;
- public-data validation;
- Great Lakes NASA POWER download;
- Great Lakes GBIF vector download;
- arboviral context table generation;
- sentinel-site registry generation.

Important scripts:

- `scripts/data_download/download_nasa_power_great_lakes.py`
- `scripts/data_download/download_gbif_vectors_great_lakes.py`
- `scripts/pipelines/14_build_arboviral_context.py`
- `scripts/pipelines/15_build_sentinel_registry.py`
- `scripts/pipelines/13_build_public_data_validation_registry.py`

### 8.3 API Layer

The FastAPI backend exposes:

- dashboard status;
- site and sentinel registry data;
- mosquito/vector evidence;
- susceptibility/control context;
- climate data;
- live weather;
- arboviral overview;
- Great Lakes climate;
- vector occurrence context;
- disease profiles;
- readiness layers;
- alert/action review.

Key new endpoints:

- `/api/arboviral/overview`
- `/api/arboviral/great-lakes-climate`
- `/api/arboviral/vector-occurrences`
- `/api/arboviral/disease-profiles`
- `/api/arboviral/readiness`
- `/api/sites/sentinel-registry`

### 8.4 Frontend Layer

The React/Vite dashboard now presents:

- ArboRisk-GL brand identity;
- Arboviral Preparedness page;
- regional climate charts;
- vector occurrence summaries;
- disease preparedness profiles;
- data governance layers;
- sentinel-site map;
- vector evidence;
- susceptibility context;
- climate and weather;
- action review;
- data readiness.

The frontend is policy-facing. It does not show formulas as primary content. It shows what decision can be supported, what evidence exists, and what data gaps remain.

---

## 9. Dashboard Design Principles

The dashboard is designed for policymakers and technical program teams. It should not look like an academic notebook. It should be organized, concise, and decision-oriented.

Core design rules:

1. **Show readiness, not formulas.**  
   The mathematical models exist in the backend and documentation, but policymakers need preparedness levels, evidence sources, and recommended actions.

2. **Separate evidence from claims.**  
   Public vector occurrence context is not local surveillance. Lecturer PI data is proof-of-concept infrastructure. RBC/MoH case data is future formal access.

3. **Use confidence language.**  
   Each output should indicate whether it is ready, context-only, planned, or blocked by missing data.

4. **Keep maps useful.**  
   The new 33-sentinel-site map improves credibility because it uses lecturer-provided WKT coordinates.

5. **Make the funding logic visible.**  
   The dashboard should show that current data is enough for a strong MVP, while the grant funds validation and expansion.

---

## 10. Current Dashboard Modules

### 10.1 Overview

Purpose:

To summarize the full system for proposal demonstration and policy discussion.

Shows:

- operational database status;
- PI ecology and susceptibility row counts;
- public evidence source count;
- validated evidence registry;
- policy decision support;
- current data evidence base;
- preparedness scope;
- rainfall and district priority signals.

### 10.2 Arboviral Preparedness

Purpose:

To present the new Great Lakes arboviral framing.

Shows:

- regional points;
- high climate signal count;
- Aedes records;
- Culex records;
- disease preparedness profiles;
- data governance layers;
- Great Lakes rainfall context;
- GBIF vector occurrence context.

### 10.3 Vector Evidence

Purpose:

To show PI vector ecology and habitat data as proof-of-concept surveillance evidence.

Use boundary:

This is not final arbovirus surveillance. It demonstrates field-data ingestion and helps design the prospective Aedes/Culex pilot.

### 10.4 Vector Control Context

Purpose:

To show IR/susceptibility evidence as vector-control context.

Use boundary:

Do not claim final resistance classification until denominator, protocol, control mortality, dates, and species are confirmed.

### 10.5 Sites and Map

Purpose:

To show sentinel-site locations and spatial readiness.

New improvement:

The page now uses the lecturer-provided 33-sentinel-site WKT registry.

### 10.6 Climate Context

Purpose:

To show rainfall, temperature, humidity, and climate baseline context.

Current scope:

Rwanda district climate plus Great Lakes climate through the Arboviral page.

### 10.7 Live Weather

Purpose:

To support field-verification timing using live weather and forecast context.

Use boundary:

This is a field planning tool, not an official alert system.

### 10.8 Preparedness Priority

Purpose:

To show current prioritization as a screening product.

Use boundary:

It supports field planning, not confirmed disease prediction.

### 10.9 Response Board

Purpose:

To manage signal review and action workflow.

Future:

Add partner responsibilities, review notes, action completion evidence, and RBC/MoH governance status.

### 10.10 Data Control

Purpose:

To show readiness, missing data, source validation, and partner requirements.

This is one of the most important pages for policy credibility.

---

## 11. PhD-Level Research Contribution

The PhD contribution is not simply building a dashboard. The contribution is the design and validation of a climate-vector intelligence framework under real data scarcity. This is highly relevant in applied mathematics, data engineering, and climate-health policy.

Potential thesis contribution:

> A climate-informed, data-readiness-aware decision-support framework for arboviral disease preparedness in data-limited settings, demonstrated through an African Great Lakes proof-of-concept and validated through prospective field and partner surveillance data.

The work has several scholarly components:

1. **Data readiness modelling.**  
   Quantifying what can and cannot be inferred from incomplete surveillance systems.

2. **Climate-vector suitability scoring.**  
   Integrating rainfall, temperature, humidity, wetness, land cover, elevation, and vector occurrence context.

3. **Uncertainty-aware decision support.**  
   Producing actionable priority outputs without overstating predictive validity.

4. **One Health integration.**  
   Linking human health, vector ecology, livestock/RVF context, environment, and climate anomalies.

5. **Operational validation design.**  
   Turning a current-data prototype into a prospective validated surveillance system.

6. **Policy translation.**  
   Designing technical outputs that are understandable and useful to decision-makers.

---

## 12. Mathematical and Statistical Direction

Although formulas are not displayed in the frontend, the backend and PhD documentation can include rigorous models.

Recommended modelling families:

### 12.1 Climate Suitability Scoring

Use rainfall, temperature, humidity, and wetness indicators to estimate whether conditions are suitable for vector emergence.

Outputs:

- low/moderate/high climate context;
- confidence level;
- data source label.

### 12.2 Aedes-Borne Preparedness Index

Inputs:

- Aedes occurrence context;
- rainfall;
- temperature;
- humidity;
- urban/built-up land cover;
- population density;
- water-storage proxy if later available.

Outputs:

- Aedes-borne preparedness level;
- recommended field verification;
- data gaps.

### 12.3 RVF One Health Watch Index

Inputs:

- heavy rainfall;
- surface water/flooding;
- vegetation greenness;
- livestock density or livestock event data;
- Aedes/Culex occurrence context;
- agricultural/wetland land cover.

Outputs:

- RVF wetness/spillover watch level;
- recommended One Health coordination action;
- missing livestock/lab data.

### 12.4 Data Confidence Index

Inputs:

- completeness of dates;
- GPS quality;
- species confirmation;
- sampling effort;
- denominator/protocol/control mortality;
- official case data availability;
- partner approval status.

Outputs:

- ready;
- context-only;
- pilot-required;
- formal-access-required.

### 12.5 Bayesian or Hierarchical Extension

For the PhD, once prospective data exist, develop hierarchical models across countries, districts, sites, and time. This can handle missingness, spatial dependence, climate lag effects, and heterogeneous surveillance effort.

Potential structure:

- country random effects;
- district/site random effects;
- temporal climate lags;
- vector group covariates;
- observation effort offsets;
- posterior uncertainty intervals.

### 12.6 Validation Strategy

Validation should happen in stages:

1. retrospective face validity with known climate/vector patterns;
2. field verification against Aedes/Culex surveys;
3. comparison with confirmed arboviral/febrile illness indicators;
4. prospective pilot evaluation;
5. policy utility evaluation with users.

---

## 13. Data Gaps That Must Be Presented Honestly

The system is strong, but it is not complete. The following gaps should be explicitly included in the proposal.

### 13.1 Arboviral Case or Febrile Illness Data

Needed from RBC/MoH through formal approval.

Use:

- validation;
- surveillance outcome modelling;
- temporal comparison;
- early-action thresholds.

### 13.2 Aedes/Culex Field Surveillance

Needed through prospective pilot.

Use:

- Aedes container indices;
- ovitrap positivity;
- adult trap counts;
- species confirmation;
- vector infection testing if feasible.

### 13.3 Livestock and RVF Event Data

Needed from animal health partners.

Use:

- RVF One Health watch validation;
- livestock-human interface analysis;
- rainfall/flooding response triggers.

### 13.4 Official Sentinel Metadata

Needed from PI/partners.

Use:

- official site confirmation;
- GPS provenance;
- health facility catchment linkage;
- district/province harmonization.

### 13.5 Intervention and Response Logs

Needed during pilot.

Use:

- action evaluation;
- response effectiveness;
- policy feedback loop.

---

## 14. Data We Should Keep

The following datasets are still needed:

- lecturer mosquito behaviour dataset;
- lecturer IR/susceptibility dataset;
- lecturer 33 sentinel-site map;
- NASA POWER Great Lakes climate;
- NASA POWER Rwanda district climate;
- GBIF Great Lakes vector occurrences;
- GBIF Rwanda vector context;
- ERA5-Land monthly climate;
- CHIRPS rainfall sample;
- WorldClim baseline climate and elevation;
- ESA WorldCover land cover;
- Rwanda boundaries;
- population raster;
- OSM extract;
- processed context and validation tables.

## 15. Data We Removed or Deprioritized

Old implementation notes and obsolete report previews were removed to reduce confusion. The malaria-specific WHO/HDX indicator CSV was removed because the new proposal is arboviral and formal RBC/MoH data should govern disease outcomes. JRC surface water is listed as planned, not forced into the MVP, because it requires Earth Engine export.

This cleanup helps the project look focused. It prevents reviewers from seeing multiple old versions of the same plan.

---

## 16. Policy Relevance

The system is valuable for policymakers because it answers practical questions:

- Which regional points currently show climate conditions supportive of vector emergence?
- Which vector groups have public occurrence evidence in the region?
- Which diseases are relevant to the current evidence?
- Which sentinel sites can be mapped and verified?
- Which data are available now?
- Which data require formal approval?
- Which outputs are ready for preparedness planning?
- Which outputs cannot yet be used for official prediction?

This framing is important. Policymakers often do not need formulas. They need structured evidence, readiness status, confidence, and action pathways. ArboRisk-GL provides that.

---

## 17. National and Regional Value

For Rwanda:

- strengthens local climate-health surveillance capacity;
- uses lecturer/PI datasets responsibly;
- improves sentinel-site mapping;
- prepares the ground for Aedes/Culex surveillance;
- supports RBC/MoH engagement through honest data governance.

For the Great Lakes region:

- supports cross-border climate-health intelligence;
- includes regional climate reference points;
- includes regional vector occurrence context;
- frames arboviral threats as shared preparedness challenges;
- supports future expansion to Uganda, Burundi, DRC, Tanzania, Kenya, and beyond.

---

## 18. Implementation Roadmap

### Phase 1: Completed MVP Rebuild

Completed:

- pivoted system name and framing to ArboRisk-GL;
- added Arboviral Preparedness page;
- downloaded Great Lakes NASA climate data;
- downloaded Great Lakes GBIF vector occurrence data;
- processed disease profiles and readiness layers;
- integrated 33-sentinel-site lecturer map;
- updated data-source registry;
- updated API endpoints;
- verified tests and frontend build.

### Phase 2: Proposal-Ready Polish

Next:

- add executive proposal summary;
- add system architecture diagram;
- add partner data request table;
- add budget-aligned work packages;
- add validation plan;
- add screenshots from dashboard.

### Phase 3: Pilot Field Data Collection

Collect:

- Aedes/Culex trap/ovitrap data;
- container index data;
- site GPS confirmation;
- sampling effort;
- confirmed species;
- susceptibility protocol data;
- livestock/RVF event indicators;
- response logs.

### Phase 4: Partner Surveillance Integration

Through approval:

- RBC/MoH confirmed/suspected arboviral data;
- febrile illness indicators;
- lab confirmation;
- vaccination data for yellow fever;
- animal health data for RVF;
- intervention/action data.

### Phase 5: Model Validation

Validate:

- climate lags;
- vector presence/abundance;
- disease signal associations;
- field-verification performance;
- policy usefulness.

---

## 19. Application Narrative

The grant application should state that ArboRisk-GL is a working prototype built from current data, not a speculative idea. It already demonstrates ingestion, cleaning, validation, mapping, climate integration, vector occurrence context, and policy dashboarding. The proposal funds the transition from prototype to validated regional preparedness platform.

Suggested wording:

> ArboRisk-GL is a climate-informed arboviral disease preparedness and vector-intelligence platform for the African Great Lakes region. The current prototype integrates Rwanda proof-of-concept entomological and susceptibility datasets, lecturer-provided sentinel-site coordinates, NASA POWER climate signals, public vector occurrence data, and environmental context layers to support field verification and preparedness planning. The proposed project will validate and expand this platform through prospective Aedes/Culex surveillance, One Health RVF indicators, and formally approved RBC/MoH arboviral or febrile illness data.

---

## 20. Reviewer-Safe Claims

Safe claims:

- We have built a working climate-vector intelligence prototype.
- We have integrated current lecturer datasets and public climate/vector context.
- We have added lecturer-provided sentinel coordinates.
- We can support preparedness planning and field verification.
- We can identify data gaps and validation needs.
- We can expand to a validated arboviral early-action platform with partner data.

Unsafe claims:

- We can already predict dengue outbreaks.
- We can already forecast arboviral incidence.
- We have confirmed local Aedes/Culex surveillance.
- GBIF records prove current local transmission risk.
- The current IR dataset proves Aedes resistance.
- The system is an official alerting platform.

---

## 21. System Improvement Priorities

### 21.1 Improve Site Metadata

Add district/province harmonization for all 33 sentinel sites. Link site labels to PI data names. Confirm official facility names and administrative units.

### 21.2 Improve Vector Taxonomy

Create a vector group table:

- Aedes;
- Culex;
- Anopheles;
- other.

For arboviral preparedness, Aedes and Culex should be emphasized.

### 21.3 Add Surface Water

Use JRC Global Surface Water through Earth Engine when available. Extract water occurrence and seasonality around sentinel sites and regional zones.

### 21.4 Add Urban and Population Exposure

Use built-up land cover and population rasters to create urban/peri-urban Aedes context indicators.

### 21.5 Add One Health Data

For RVF, add livestock density, livestock market locations, animal health events, and rainfall/flooding signals.

### 21.6 Add Partner Governance

Add a dashboard layer showing whether each formal dataset is:

- not requested;
- requested;
- approved;
- received;
- validated;
- integrated.

### 21.7 Add Exportable Policy Reports

Generate one-click PDF/HTML reports for:

- regional arboviral preparedness;
- sentinel-site readiness;
- data gaps;
- field verification priorities;
- partner data requests.

---

## 22. Final Position

ArboRisk-GL is now a stronger project than the original malaria-only framing. It is broader, more policy-relevant, more climate-health aligned, and better suited for a national innovation application and PhD-level applied modelling. The system is honest about its limits while showing real technical progress.

The current prototype should be presented as:

> a working climate-vector preparedness intelligence system that is ready for formal validation, regional expansion, and partner integration.

That is the correct scientific and policy position.

---

## 23. Expanded National-Policy Implementation Blueprint

This section explains how the system should mature from a strong proof of concept into a decision-support platform that can be credible to a national funding panel, a PhD supervisory committee, and public-health partners. The key idea is simple: the system should not pretend that it already has all official disease surveillance data. Instead, it should demonstrate that the available data have been organized into a scientifically honest intelligence layer, and that the platform is ready to absorb official data when approvals are granted.

The system should be positioned as a staged climate-health intelligence product. Stage one is the current-data MVP: Rwanda lecturer datasets, lecturer-provided sentinel coordinates, NASA POWER climate context, GBIF vector occurrence context, public administrative/geospatial context, and live weather signals. Stage two is the partner-validation build: official arboviral/febrile illness data, laboratory confirmation data, entomological surveillance protocols, livestock or One Health data for Rift Valley fever, and surface-water products. Stage three is the modelling and operationalization build: validated early-warning scores, field-verification workflow, intervention tracking, and routine policy reporting.

The most important improvement is not to add more pages for the sake of volume. The most important improvement is to make every page answer a policy question:

- Where is preparedness strongest or weakest?
- Which areas deserve field verification first?
- Which data sources support the current signal?
- Which signals are climate-driven, vector-driven, or governance-driven?
- Which action should a district, national program, or research team take next?

That framing keeps the dashboard practical. It also protects the scientific integrity of the work.

### 23.1 Proposed System Name and Mission

The system name should remain ArboRisk-GL or a similar concise title:

**ArboRisk-GL: Climate-informed arboviral preparedness and vector intelligence for the African Great Lakes region.**

The mission statement should be:

**To transform fragmented vector, climate, environmental, and readiness data into policy-ready intelligence for arboviral disease preparedness, field verification, and targeted surveillance.**

This mission avoids saying that the system is already an outbreak forecaster. It makes the product more credible because it focuses on what can be supported now and what can be validated later.

### 23.2 Target Users

The platform should support five main user groups.

National public-health leadership need high-level readiness indicators, risk context, data gaps, and concise action recommendations. They should not be forced to interpret raw tables or statistical formulas.

Vector-control and surveillance teams need site-level evidence, sentinel-site registry data, vector occurrence context, habitat indicators, susceptibility context, and field-verification priorities.

Climate-health analysts need climate summaries, anomalies, rainfall accumulation, temperature suitability context, and links between climate signals and vector ecology.

Research and modelling teams need clean data exports, documented assumptions, reproducible pipelines, validation flags, and transparent governance boundaries.

Funding and policy reviewers need evidence that the system is technically feasible, scientifically honest, scalable, and aligned with national and regional health priorities.

The design should therefore separate operational screens from technical documentation. The frontend should be simple and action-oriented. The backend, documentation, and reports should contain the deeper science.

---

## 24. Data Architecture for the Rebuilt System

The rebuilt system should organize all data into four layers: raw data, interim extracts, processed analytic tables, and served application tables. Each layer has a clear function.

Raw data should preserve original files exactly as received or downloaded. This includes the two PI/lecturer Excel files, the new sentinel map file, NASA POWER files, GBIF exports, and any future partner files. Raw data should not be manually edited because it is the audit trail.

Interim extracts should convert hard-to-read formats into transparent CSV or parquet files. Excel files with odd formatting, NetCDF files, and shapefiles should be converted here. Interim files are useful for inspection but should not be the final application source.

Processed analytic tables should contain cleaned, harmonized, documented variables. These are the tables used for modelling, dashboarding, quality checks, and reports. Each processed table should have stable column names and a clear data dictionary.

Served application tables should be optimized for the API. These may be materialized database tables or CSV-backed endpoints during the MVP. In production, the API should serve these from PostgreSQL/Neon with clear migrations and seed scripts.

### 24.1 Core Tables Required

The following tables should form the foundation.

`sentinel_sites` should contain site ID, site name, district, province, country, latitude, longitude, coordinate source, coordinate quality, source file, and validation notes. The new `Map- 33 sentinel.xls` file is important because it solves one of the biggest earlier problems: absence of mapped site coordinates. The system should treat these coordinates as lecturer-provided coordinates and preserve that source label.

`pi_vector_ecology_records` should contain the Rwanda mosquito behavior data. Because the project has pivoted from malaria-only framing, this table becomes proof-of-concept vector ecology infrastructure rather than a final arboviral vector surveillance table. It shows that the team can ingest field ecology records, harmonize site names, summarize habitat types, and expose data gaps.

`pi_susceptibility_records` should contain the IR data. It should be labelled as insecticide susceptibility or vector-control context. If species and protocol fields are uncertain, the dashboard should not overinterpret it. It can still support the platform by showing that vector-control evidence can be organized, quality-checked, and linked to preparedness.

`great_lakes_climate_summary` should contain public climate context for Kigali, Goma, Bukavu, Kampala, Bujumbura, Mwanza, and Kisumu. It should include rainfall, temperature, humidity, recent rainfall accumulation, and basic climate suitability context.

`great_lakes_vector_occurrence_summary` should contain GBIF-derived vector occurrence evidence. This is not surveillance data, but it gives independent historical context on Aedes, Culex, and Anopheles records in the region.

`arboviral_disease_profiles` should contain concise operational profiles for dengue, chikungunya, Zika, yellow fever, and Rift Valley fever. The current prototype may start with dengue, chikungunya, and RVF if those are strongest for the application, then expand.

`readiness_layers` should contain each readiness domain: climate, vector occurrence, sentinel capacity, susceptibility evidence, disease surveillance access, One Health access, and field verification workflow.

`public_data_sources` should contain every source, status, local file count, contribution, limitation, update frequency, and governance requirement.

### 24.2 Why This Architecture Fits the Deadline

The application deadline is short. The team cannot wait for official disease data before building the system. The correct strategy is to build the platform around current evidence while clearly showing which partner data will upgrade it.

This is not a weakness. Many successful climate-health systems begin as readiness platforms. They first organize environmental and surveillance capacity data, then integrate official disease outcomes later. A clean current-data platform can therefore be presented as a credible first phase.

### 24.3 Data That Should Not Be Used Now

The system should remove or archive data that only supports the old malaria-specific story, unless it also supports vector-control or climate-vector infrastructure. Malaria indicator data should not drive the new arboviral dashboard. If kept, it should be in an archive folder with a note that it belongs to earlier exploratory work. The production dashboard should not show malaria case indicators as if they are arboviral indicators.

Likewise, incomplete downloads, duplicate climate files, stale mock tables, and old implementation markdown should be removed from the visible project structure. The repository should communicate a clean story: ArboRisk-GL, current data, public data context, sentinel registry, validation, and policy dashboard.

---

## 25. Frontend Product Design Specification

The dashboard should feel like a live public-health intelligence product, not an academic notebook. It should use minimal text, strong data cards, clear charts, compact maps, action badges, and exportable summaries. Every screen should answer a policy question within the first few seconds.

### 25.1 Navigation Structure

The recommended main navigation is:

- Command Overview
- Arboviral Preparedness
- Sites and Map
- Vector Evidence
- Climate Context
- Data Readiness
- Field Verification
- Reports

Command Overview should combine high-level indicators: preparedness status, number of active sentinel sites, Great Lakes climate coverage, Aedes/Culex occurrence context, data readiness, and field-verification queue.

Arboviral Preparedness should focus on disease profiles and readiness layers. It should not display equations. It should show disease, primary vectors, transmission relevance, climate sensitivity, available evidence, missing evidence, and next action.

Sites and Map should use the 33 lecturer-provided sentinel coordinates. No site should appear as blank if a coordinate exists in the sentinel map file. Sites without confirmed administrative metadata should still be mapped, but labelled as needing administrative validation.

Vector Evidence should summarize Aedes, Culex, and Anopheles context. It should explain visually that Aedes and Culex are directly relevant to the arboviral pivot, while Anopheles remains useful as legacy proof-of-concept vector surveillance infrastructure.

Climate Context should show rainfall, temperature, humidity, live weather, recent accumulation, and locations. The page should include policy-friendly interpretations such as “wetness context increasing,” “temperature suitable,” or “field verification priority.”

Data Readiness should show exactly which data are available now, which require partner access, and which can be approximated using public sources. It should avoid long paragraphs and use readiness rows, status chips, confidence bars, and source links.

Field Verification should turn data gaps into an operational workflow. A missing data item should not simply be shown as a failure. It should become a task: verify coordinate, confirm species, request lab protocol, collect habitat status, or request official febrile illness data.

Reports should generate concise PDF or HTML outputs for policy meetings, PI review, funding updates, and technical validation.

### 25.2 Visual Style

The visual style should be restrained, modern, and operational. It should not look like a university slide deck. Good choices include:

- compact side navigation;
- dark or neutral header bands;
- clear white or lightly tinted content panels;
- strong typography hierarchy;
- small but meaningful color accents;
- confidence and status chips;
- map and chart first, explanation second.

The dashboard should avoid huge paragraphs, decorative gradients, and formulas in the main interface. Mathematical detail belongs in the documentation and technical appendix, not in the policy-facing interface.

### 25.3 Avoiding Empty States

Every page should be designed so that missing data become informative states rather than blank areas. For example:

- If official arboviral case data are missing, show “formal access required” and the responsible action.
- If disease outcomes are not available, show preparedness indicators instead of fake incidence.
- If a site has coordinates but missing district metadata, map it and label the metadata gap.
- If GBIF has zero records for a species, show that as “no public occurrence records found in current query,” not as a broken chart.
- If a model cannot train, show the reason and the data needed to unlock it.

This design approach makes the system appear more mature because it handles uncertainty gracefully.

---

## 26. Backend and API Design Specification

The backend should remain a Python API because the project requires data engineering, statistical modelling, climate data processing, and reproducible pipelines. FastAPI is appropriate because it supports typed endpoints, automatic documentation, quick development, and production deployment.

The backend should expose policy-ready endpoints rather than raw database dumps. Each endpoint should return:

- data;
- status;
- source;
- confidence;
- governance notes;
- last updated time;
- limitations.

For example, the arboviral overview endpoint should not only return counts. It should also return a clear governance statement that outputs support preparedness and field verification, not confirmed outbreak prediction.

### 26.1 API Domains

The API should be organized into domains:

- `/api/arboviral/*` for disease profiles, readiness, regional context, vector occurrence summaries, and preparedness intelligence.
- `/api/sites/*` for sentinel registry, coordinate quality, and site metadata.
- `/api/climate/*` for climate summaries, location climate profiles, and recent rainfall/temperature context.
- `/api/live-weather/*` for current conditions and forecast context.
- `/api/vector/*` for PI ecology, susceptibility context, and public occurrence records.
- `/api/data-readiness/*` for source inventory, validation flags, missing data tracker, and governance pipeline.
- `/api/reports/*` for exportable policy and technical summaries.

### 26.2 Database Strategy

During the MVP, CSV-backed endpoints are acceptable for speed and transparency. However, the production path should move processed data into PostgreSQL/Neon.

The Neon database should include tables for sentinel sites, vector ecology records, susceptibility records, public climate summaries, vector occurrence summaries, disease profiles, readiness layers, and public data sources. Seed scripts should load processed CSVs into the database. Alembic migrations should define stable schema. The API should read from the database in deployed production, with a fallback to local CSV only for development.

This database strategy matters for national credibility. A dashboard that only reads files can still work, but a policy-facing system should support controlled updates, audit trails, role-based workflows, and reproducible deployments.

### 26.3 CORS and Deployment

The deployed API must explicitly allow the Vercel frontend origin. The API should include configured allowed origins for:

- local Vite development;
- local alternate ports;
- the production Vercel frontend URL;
- future staging frontend URL.

This is necessary because a dashboard can build correctly but fail in the browser if CORS blocks API calls.

### 26.4 Health and Validation Endpoints

The backend should include `/health` and `/api/system/status` endpoints. A strong system status response should include:

- API version;
- database connection status;
- loaded data source counts;
- last pipeline run timestamp;
- frontend build target;
- known warnings;
- deployment environment.

This endpoint is useful during demonstrations because it proves that the system is actually connected and running.

---

## 27. Modelling Roadmap Without Overclaiming

The applied mathematics component should remain strong, but the frontend should translate models into readiness scores and decision-support indicators. The equations can live in the technical appendix, code comments, notebooks, and reports. Policy users should see interpretable outputs.

### 27.1 Current-Data Models

With current data only, the system can support descriptive and semi-quantitative models:

- climate suitability context;
- rainfall accumulation and wetness context;
- temperature suitability screening;
- vector occurrence evidence scoring;
- sentinel readiness scoring;
- susceptibility evidence completeness scoring;
- field-verification priority ranking;
- uncertainty scoring.

These are valid current-data models because they do not require confirmed disease outcomes. They help decide where to verify, where to collect data, and where preparedness attention is needed.

### 27.2 Partner-Data Models

After official data access, the system can support stronger models:

- arboviral case nowcasting;
- febrile illness anomaly detection;
- climate-lag disease association models;
- vector abundance or occurrence models;
- intervention effect tracking;
- scenario modelling under climate variability;
- early-warning threshold calibration.

These models should not be claimed as complete now. They should be described as the validated next phase.

### 27.3 Uncertainty Handling

The system should assign uncertainty to every district, site, or regional point. Uncertainty should increase when:

- disease outcome data are unavailable;
- site coordinates are provisional;
- species identification is uncertain;
- sampling effort is missing;
- public occurrence data are sparse;
- climate data are gridded and not station-validated;
- partner validation has not occurred.

Uncertainty should decrease when:

- official case data are linked;
- coordinates are confirmed;
- field verification is completed;
- protocol metadata are confirmed;
- multiple independent sources agree;
- recent surveillance data are available.

This is important because a serious national system must not only say where risk may be high. It must also say how much confidence the team has.

### 27.4 PhD-Level Scientific Contribution

The PhD contribution should not be limited to building a dashboard. The deeper contribution is the development of a reproducible climate-vector intelligence framework for data-scarce arboviral preparedness in the African Great Lakes region.

Possible research questions include:

- How can public climate and vector occurrence data be combined with partial local surveillance data to guide arboviral preparedness?
- Which readiness indicators are most useful before official disease outcome data are available?
- How should uncertainty be represented in climate-health decision support?
- How can field-verification workflows improve the quality of climate-health intelligence systems?
- How does adding partner-confirmed data change preparedness ranking and confidence?

These questions are strong because they recognize the real constraints of national data access.

---

## 28. Great Lakes Regional Expansion Logic

The pivot to the African Great Lakes region is scientifically defensible because climate variability, human mobility, lake basin ecology, urbanization, cross-border movement, and vector suitability are regional issues. Rwanda is not isolated from surrounding ecological and epidemiological systems.

The region includes important urban and ecological nodes such as Kigali, Goma, Bukavu, Kampala, Bujumbura, Mwanza, and Kisumu. These locations can act as regional climate-vector context points in the MVP. They are not a replacement for official surveillance, but they provide useful environmental context.

### 28.1 Why Regional Context Helps Rwanda

Regional context helps Rwanda because arboviral preparedness depends on more than internal administrative boundaries. Imported infections, travel, trade, livestock movement, rainfall systems, and lake-basin ecology can create cross-border preparedness needs.

For a national funding application, this regional framing can be powerful. It shows that the project begins with Rwanda proof-of-concept data but is designed for scalable regional climate-health intelligence.

### 28.2 How to Avoid Regional Overreach

The system should avoid implying that it has official surveillance coverage across the Great Lakes region. It should present regional public data as context. The language should be:

- regional climate context;
- public vector occurrence context;
- preparedness intelligence;
- field-verification priorities;
- partner-data integration pathway.

It should not say:

- confirmed regional outbreak forecast;
- official disease surveillance;
- validated regional incidence model.

This discipline will make the proposal stronger.

---

## 29. Arboviral Disease Scope

The platform should initially focus on a concise set of arboviral priorities.

Dengue is important because Aedes mosquitoes are climate-sensitive and urban/peri-urban exposure matters. The system can use rainfall, temperature, urban context, and Aedes occurrence evidence to define preparedness signals.

Chikungunya is important because it shares Aedes vectors with dengue and can create substantial outbreak burden. Many preparedness indicators overlap with dengue, making it efficient to include.

Zika can be included as an Aedes-borne arboviral preparedness profile, but the dashboard should avoid overemphasizing it if local evidence is weak.

Yellow fever can be included because vaccination, forest/sylvatic cycles, and Aedes vector context matter. However, the platform should avoid suggesting yellow-fever risk without official program context.

Rift Valley fever is important because it links climate, flooding, livestock, mosquitoes, and human health. RVF makes the proposal more aligned with One Health and climate-health innovation. The current MVP can include RVF readiness indicators, but full RVF modelling requires livestock, animal health, flooding, and official event data.

### 29.1 Vector Groups

Aedes should be the primary vector group for dengue, chikungunya, Zika, and yellow fever preparedness context.

Culex should be included for broader arboviral and vector ecology context, depending on disease scope and regional evidence.

Anopheles should be retained as a legacy proof-of-concept vector surveillance group because the Rwanda PI datasets mostly relate to malaria-vector ecology and insecticide resistance. The dashboard should explain that Anopheles data demonstrate surveillance infrastructure and vector-control context, not direct dengue transmission.

This distinction is essential.

---

## 30. Data Validation Framework

Every dataset should pass through a validation framework before appearing in policy outputs. Validation should be visible in the dashboard, but the detailed rules should be documented in the backend and reports.

### 30.1 Validation Checks for PI Excel Data

The mosquito behavior data should be checked for:

- row count;
- duplicate rows;
- missing district;
- missing site;
- unclear species names;
- inconsistent capitalization;
- habitat type spelling;
- absence of full sample dates;
- absence of coordinates;
- absence of sampling effort;
- absence of mosquito counts;
- ambiguous field labels.

The IR data should be checked for:

- row count;
- species labels;
- insecticide labels;
- test outcome fields;
- denominator availability;
- mortality or survivor fields;
- protocol metadata;
- control mortality;
- exposure time;
- date completeness;
- site linkage.

The system should show these as quality-control indicators rather than hide them.

### 30.2 Validation Checks for Sentinel Coordinates

The 33 sentinel sites should be checked for:

- valid latitude and longitude ranges;
- whether coordinates fall within Rwanda or expected region;
- duplicate coordinates;
- duplicate site IDs;
- missing district/province;
- source column consistency;
- WKT parsing reliability.

When WKT coordinates disagree with separate latitude/longitude columns, the system should preserve both if possible, use the more internally consistent value, and record the decision. In the current lecturer map file, WKT parsing is a defensible approach because it gives a coordinate pair and avoids a visible latitude typo.

### 30.3 Validation Checks for NASA Climate Data

NASA POWER climate data should be checked for:

- expected columns;
- date completeness;
- missing values;
- unit consistency;
- plausible temperature range;
- plausible rainfall values;
- location metadata;
- duplicate date rows;
- date coverage.

The dashboard should show data coverage and last update date.

### 30.4 Validation Checks for GBIF Occurrence Data

GBIF data should be checked for:

- species name;
- decimal latitude and longitude;
- year;
- country;
- basis of record;
- coordinate uncertainty when available;
- duplicate occurrence IDs;
- zero-record species queries.

GBIF should be labelled as public occurrence evidence, not official surveillance. This is very important for scientific credibility.

---

## 31. Field Verification Workflow

A serious system should not end at a dashboard. It should produce field-verification tasks. This turns missing data into a work plan.

### 31.1 Verification Task Types

The platform should generate tasks such as:

- confirm sentinel-site coordinate;
- confirm district and administrative hierarchy;
- confirm vector species group;
- confirm habitat type;
- confirm sampling date;
- confirm sampling effort;
- confirm susceptibility protocol;
- confirm denominator and control mortality;
- request arboviral/febrile illness data access;
- request livestock or animal health data;
- request intervention history.

Each task should have:

- priority;
- responsible team;
- expected evidence;
- status;
- due date;
- notes;
- source record link.

### 31.2 Why This Matters for Policy

Policy makers need to see that the system does not merely complain about missing data. It creates a path to fix them. A dashboard with a verification workflow is more useful than a dashboard with passive red warnings.

For the funding application, this is a strong point. It shows that the project is implementable within real institutional constraints.

---

## 32. Policy Reporting Framework

The system should generate short, professional reports. These reports should be useful for PI meetings, district discussions, funding updates, and technical review.

### 32.1 Report Types

The platform should generate:

- national preparedness summary;
- Great Lakes regional context brief;
- sentinel-site readiness report;
- climate-vector evidence report;
- data gap and partner request report;
- field verification task report;
- technical validation report.

Each report should include:

- date generated;
- data sources used;
- coverage;
- key findings;
- limitations;
- recommended next actions.

### 32.2 Report Style

Reports should be concise and professional. They should use charts, tables, and maps. They should avoid long academic explanations in the main body. Technical appendices can contain deeper details.

For the funding application, a clean report can be more persuasive than a complex model screenshot.

---

## 33. Partner Data Access Plan

The project should include a formal data-access plan. This plan should be realistic and respectful of data governance.

### 33.1 Priority Partner Data

The highest-priority partner data are:

- official arboviral case data;
- febrile illness surveillance data;
- laboratory confirmation records;
- outbreak investigation summaries where shareable;
- vector surveillance data with species confirmation;
- insecticide susceptibility protocols and denominators;
- intervention history;
- livestock and animal health signals for RVF;
- district or facility-level administrative boundaries where needed.

### 33.2 Data Governance Principles

The platform should follow these principles:

- no identifiable patient data in the dashboard;
- aggregated outputs for policy users;
- role-based access for sensitive data;
- documented data-sharing agreements;
- clear distinction between public and restricted data;
- reproducible data transformation logs;
- governance labels in the dashboard.

This governance layer is not just bureaucracy. It makes the project more trustworthy.

### 33.3 What Can Be Done Before Partner Approval

Before partner approval, the team can:

- build the platform;
- validate public and lecturer data;
- map sentinel sites;
- compute climate context;
- summarize vector occurrence evidence;
- build readiness layers;
- create field-verification workflow;
- prepare database schema;
- prepare data request templates;
- demonstrate how official data will be integrated.

This is exactly what the project should do now.

---

## 34. Work Packages for the Funding Proposal

The proposal can be structured around five work packages.

### 34.1 Work Package 1: Data Governance and System Foundation

This work package establishes data inventory, governance rules, data dictionaries, database schema, validation pipelines, and deployment infrastructure. It ensures that the project starts with a clean and auditable foundation.

Deliverables:

- data source registry;
- cleaned sentinel-site registry;
- validation rules;
- database schema;
- API health and system status endpoints;
- deployment on Render and Vercel;
- documentation.

### 34.2 Work Package 2: Climate and Environmental Intelligence

This work package builds climate indicators using NASA POWER, ERA5-Land where available, CHIRPS or other rainfall products, live weather, and future surface-water or land-cover products.

Deliverables:

- daily and monthly climate summaries;
- rainfall accumulation indicators;
- temperature suitability context;
- live weather integration;
- climate coverage dashboard;
- regional Great Lakes climate context.

### 34.3 Work Package 3: Vector and Susceptibility Intelligence

This work package harmonizes PI vector data, IR/susceptibility data, GBIF occurrence context, and future partner vector surveillance.

Deliverables:

- vector ecology summary;
- susceptibility evidence dashboard;
- species-group harmonization;
- public occurrence summary;
- field-verification needs;
- vector-control context report.

### 34.4 Work Package 4: Arboviral Preparedness and Field Verification

This work package creates disease profiles, readiness layers, field-verification workflow, and district/site preparedness summaries.

Deliverables:

- arboviral preparedness page;
- disease profile registry;
- readiness scoring layer;
- field verification task queue;
- partner data request tracker;
- policy-ready reports.

### 34.5 Work Package 5: Modelling, Validation, and Scale-Up

This work package develops validated models after partner data become available. It also compares current-data preparedness indicators against official outcomes when possible.

Deliverables:

- uncertainty-aware preparedness model;
- partner-data validation analysis;
- early-warning prototype;
- model performance reports;
- PhD manuscripts;
- scale-up roadmap for the Great Lakes region.

---

## 35. Implementation Milestones

The project should be implemented in clear phases.

### 35.1 First 20 Days

The immediate goal is a strong proposal and working demonstration.

Tasks:

- complete the arboviral pivot in the dashboard;
- remove old malaria-only implementation clutter;
- integrate the 33 sentinel-site coordinate file;
- verify API endpoints;
- verify frontend build;
- publish clean deployment;
- generate a policy-ready blueprint;
- prepare screenshots and demo narrative.

Success criteria:

- no blank maps where coordinates exist;
- no mock data presented as real;
- no old malaria-only claims in the active interface;
- all endpoints return data;
- frontend builds cleanly;
- dashboard supports the new proposal story.

### 35.2 First 3 Months

The next phase should focus on validation and partner engagement.

Tasks:

- formalize data request letters;
- meet with public-health and One Health partners;
- clean administrative metadata for sentinel sites;
- add surface-water and land-cover products;
- implement Neon database seeding;
- create report exports;
- build field-verification module;
- refine readiness scoring with partner feedback.

### 35.3 First 6 to 12 Months

The later phase should focus on validated modelling and operational use.

Tasks:

- integrate approved disease or febrile illness data;
- validate climate lag indicators;
- compare readiness scores with observed events;
- create role-based access;
- publish technical methods;
- train users;
- produce district and national reports;
- prepare PhD manuscripts.

---

## 36. Risk Register and Mitigation

### 36.1 Risk: Official Disease Data Delays

This is the most likely risk. The mitigation is to build a current-data preparedness system now and include a clear partner-data integration pathway.

### 36.2 Risk: Misinterpretation of Public Occurrence Data

GBIF data can be misunderstood as current surveillance. The mitigation is to label it as historical public occurrence context and include confidence notes.

### 36.3 Risk: Vector Mismatch After Topic Pivot

The PI datasets are mostly mosquito ecology and insecticide resistance data from a malaria-vector context. The mitigation is to present them as proof-of-concept vector surveillance infrastructure and vector-control context, while public Aedes/Culex data support the arboviral pivot.

### 36.4 Risk: Dashboard Looks Too Academic

The mitigation is to remove formulas from the frontend, reduce text, use strong visual hierarchy, and focus every page on action and readiness.

### 36.5 Risk: Deployment Breaks During Demonstration

The mitigation is to maintain local scripts, health checks, CORS configuration, production environment variables, and a static screenshot/report fallback.

### 36.6 Risk: Overclaiming

The mitigation is strict language:

- preparedness, not prediction;
- context, not confirmed incidence;
- field verification, not official alert;
- public occurrence, not surveillance confirmation;
- current-data MVP, not final national system.

---

## 37. Detailed Dashboard Page Requirements

### 37.1 Command Overview

The overview page should open with a command strip showing:

- preparedness mode;
- number of sentinel sites;
- number of climate points;
- vector occurrence records;
- readiness layer count;
- field-verification tasks.

Below the strip, it should show a regional climate-vector map, readiness status, and top next actions. The page should not begin with a paragraph. It should begin with evidence.

### 37.2 Arboviral Preparedness

This page should show disease cards for dengue, chikungunya, Zika, yellow fever, and RVF. Each card should include vector group, climate sensitivity, current evidence, missing evidence, and next action.

It should also include readiness layers:

- climate context ready;
- vector occurrence context ready;
- sentinel registry ready;
- local Aedes surveillance pending;
- official case data pending;
- One Health RVF data pending.

### 37.3 Sites and Map

This page should show the 33 sentinel sites from the lecturer map file. It should show map coverage, coordinate quality, and a site registry table. If district/province metadata are missing for some sites, the coordinates should still appear and the metadata gap should be shown as an action.

### 37.4 Vector Evidence

This page should show:

- PI ecology records;
- susceptibility context;
- Aedes public occurrence records;
- Culex public occurrence records;
- Anopheles proof-of-concept context;
- species cleaning issues;
- protocol confirmation needs.

### 37.5 Climate Context

This page should show:

- Great Lakes location climate summaries;
- recent rainfall;
- temperature;
- humidity;
- live weather;
- wetness context;
- location comparison.

### 37.6 Data Readiness

This page should show:

- source inventory;
- validation status;
- data gaps;
- partner access needs;
- field-verification tasks;
- database readiness.

### 37.7 Reports

This page should generate:

- policy brief;
- technical validation summary;
- PI handover report;
- funding proposal annex.

---

## 38. Technical Quality Standards

The platform should follow software engineering standards suitable for an applied research product.

Backend standards:

- typed API responses where practical;
- clear route modules;
- no hardcoded fake production values;
- environment-based configuration;
- tests for critical endpoints;
- reproducible data pipeline scripts;
- logs for pipeline outputs.

Frontend standards:

- reusable metric components;
- clean API error states;
- no blank charts without explanation;
- responsive layout;
- accessible color contrast;
- consistent icons and status chips;
- minimal text in policy pages.

Data standards:

- raw files preserved;
- processed tables documented;
- source and limitation columns retained;
- validation flags included;
- no silent overwrites;
- no mock data in production views.

Deployment standards:

- Render API;
- Vercel web;
- correct CORS;
- production environment variables;
- health checks;
- build verification before deployment.

---

## 39. Proposal Narrative for NCST Climate and Health Innovation

The proposal should tell a clear story.

Climate change is altering rainfall, temperature, flooding, and ecological conditions across the African Great Lakes region. These changes can influence mosquito habitats, vector survival, breeding sites, and arboviral preparedness needs. At the same time, many countries face fragmented surveillance systems, delayed access to cross-sector data, and limited tools for converting environmental signals into practical public-health decisions.

ArboRisk-GL responds to this gap by building a climate-informed vector intelligence platform. The system integrates lecturer-provided Rwanda sentinel data, vector ecology and susceptibility datasets, public climate data, public vector occurrence data, live weather, and a governance pathway for official public-health and One Health data. The platform is designed for policy users, surveillance teams, and researchers.

The project does not claim to replace official surveillance. Instead, it strengthens preparedness by organizing current evidence, identifying gaps, supporting field verification, and creating a validated pathway toward early-warning models once partner data are available.

The innovation is not only technical. It is institutional. It turns scattered data into a coordinated readiness workflow. It shows decision makers where evidence is strong, where evidence is weak, and what action is required next.

This makes the project suitable for climate-health innovation funding because it is practical, scalable, honest, and aligned with national and regional needs.

---

## 40. Final Improved Position for the Application

The strongest final position is:

**ArboRisk-GL is a deployable current-data climate-vector intelligence system for arboviral preparedness in Rwanda and the African Great Lakes region. It uses available lecturer datasets, sentinel coordinates, public climate data, public vector occurrence data, and live weather to support policy-ready readiness assessment, field verification, and partner-data integration. It is not yet a confirmed outbreak prediction system; it is the correct first phase toward one.**

This position is strong because it is ambitious without being careless. It gives the funding panel a working product, a clear national policy purpose, a PhD-level research pathway, and a realistic plan for partner validation.

The system should therefore be presented as both:

- a software product that already works; and
- a research infrastructure that can become a validated regional climate-health early-warning platform.

That is the right balance for the application, for the PhD, and for national policy use.
