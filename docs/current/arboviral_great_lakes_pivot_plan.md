# Pivot Plan: Climate-Informed Arboviral Disease Intelligence in the African Great Lakes Region

## Proposed New Topic

**Climate-Informed Surveillance and Early-Warning Intelligence for Arboviral Diseases in the African Great Lakes Region**

Alternative short title:

**ArboRisk-GL: Climate and Vector Intelligence for Arboviral Disease Preparedness in the African Great Lakes Region**

## Why This Pivot Works

The original project focused on malaria-related mosquito ecology and insecticide exposure in Rwanda. The revised topic is broader and more policy-relevant because arboviral diseases are climate-sensitive, cross-border, and often under-detected in the African Great Lakes region.

This pivot keeps the technical strength of the existing system:

- climate data pipelines
- mosquito/vector ecology data handling
- geospatial dashboards
- data readiness scoring
- public-data validation
- live weather and rainfall monitoring
- decision-support framing

But it changes the public-health question from:

> Where is malaria vector suitability elevated?

to:

> Where are climate, ecological, livestock, urban, and vector conditions becoming suitable for arboviral disease emergence or spillover?

## Priority Arboviral Diseases

The system should not try to model every arbovirus at once. For the proposal, use a tiered structure.

### Tier 1: Core Diseases for the Proposal

1. **Dengue**
   - Main vectors: *Aedes aegypti*, *Aedes albopictus*
   - Key drivers: urbanization, water storage, containers, temperature, rainfall, mobility
   - Dashboard use: urban Aedes suitability and outbreak preparedness

2. **Chikungunya**
   - Main vectors: *Aedes aegypti*, *Aedes albopictus*
   - Key drivers: same Aedes ecology as dengue
   - Dashboard use: shared Aedes-borne risk layer

3. **Yellow fever**
   - Main vectors: sylvatic and urban Aedes species
   - Key drivers: forest-edge exposure, human mobility, vaccination gaps, Aedes ecology
   - Dashboard use: preparedness and vaccination-priority context

4. **Rift Valley fever**
   - Main vectors: Aedes and Culex mosquitoes
   - Key drivers: heavy rainfall, flooding, livestock density, wetlands, vegetation greenness
   - Dashboard use: One Health livestock-human spillover early-warning

### Tier 2: Contextual Diseases

These can be included as background but not modelled deeply in the first MVP:

- Zika
- West Nile fever
- Crimean-Congo haemorrhagic fever if tick data are later added
- Bunyamwera and other local arboviruses where surveillance data exist

## Region Definition

Use the **African Great Lakes region** as the policy geography.

Core countries:

- Rwanda
- Burundi
- Uganda
- Tanzania
- Kenya
- Democratic Republic of Congo

Optional expansion:

- South Sudan
- Zambia
- Malawi

For the current system, start with Rwanda as the working proof-of-concept and design the architecture so country layers can be added.

## New Research Aim

To develop a climate-informed, data-integrated decision-support platform for arboviral disease preparedness in the African Great Lakes region by combining climate, vector, environmental, livestock, population, and surveillance-readiness indicators.

## New Objectives

1. **Map climate and environmental suitability**
   - Identify districts or cross-border zones where temperature, rainfall, humidity, flooding, elevation, land cover, and water persistence support arboviral vectors.

2. **Integrate vector and ecological evidence**
   - Use available mosquito data, GBIF/VectorBase occurrences, land-cover layers, and habitat proxies to identify Aedes/Culex/RVF-relevant vector suitability.

3. **Build disease-specific preparedness layers**
   - Aedes-borne layer: dengue, chikungunya, yellow fever, Zika context.
   - RVF One Health layer: rainfall, flooding, livestock, wetlands, vegetation, and human/livestock interface.

4. **Create a policy-facing dashboard**
   - Translate complex climate-vector data into readiness, prioritization, and field-verification outputs for ministries, public-health teams, and One Health partners.

5. **Define validation needs**
   - Clearly show which missing data must be collected during the pilot: arboviral case data, vector species confirmation, livestock events, serology, vaccination coverage, and field GPS.

## Existing Data That Still Helps

The current data is not wasted.

### PI Mosquito Data

Use as:

- preliminary vector ecology evidence
- habitat and site registry structure
- proof that the platform can ingest field entomology records
- baseline for expanding from Anopheles-focused forms to Aedes/Culex forms

Limitation:

- It is not enough alone for arboviral disease modelling because Aedes/Culex species, container habitats, livestock data, arboviral cases, and serology are missing.

### IR Data

Use as:

- insecticide pressure and vector-control context
- prototype for laboratory assay data management
- evidence of how resistance/susceptibility modules can be added for Aedes/Culex later

Limitation:

- The current IR data is mostly useful as system infrastructure and vector-control context, not final arbovirus-specific resistance evidence.

### Climate and Public Data

Still highly relevant:

- NASA POWER daily climate
- ERA5-Land monthly climate
- CHIRPS rainfall
- WorldClim baseline climate
- elevation
- land cover
- population
- boundaries
- GBIF mosquito occurrence data
- live weather forecast

These are even more useful for arboviral disease preparedness because arboviruses are strongly linked to rainfall, temperature, humidity, flooding, urban containers, vegetation, livestock, and mobility.

## New Data Needed

### Public/Open Data We Can Use

1. Climate
   - ERA5-Land
   - CHIRPS rainfall
   - NASA POWER
   - WorldClim

2. Environment
   - ESA WorldCover
   - elevation
   - wetlands/water occurrence
   - NDVI or vegetation greenness
   - flood/rainfall anomaly products

3. Vector occurrence
   - GBIF mosquito records
   - VectorBase if available
   - published Aedes/Culex occurrence records

4. Population and mobility proxies
   - WorldPop or population rasters
   - urban settlement layers
   - roads and border-crossing context from OSM

5. Livestock and One Health proxies for RVF
   - livestock density if accessible
   - pastoral/agricultural land-cover proxies
   - slaughterhouse/market locations if partners provide them

### Data We Need From Partners Later

For a validated system, request:

- suspected/confirmed dengue, chikungunya, yellow fever, RVF, Zika case data
- weekly/monthly febrile illness syndromic data
- laboratory confirmation status
- Aedes/Culex entomological surveillance
- ovitrap/container indices
- livestock abortion/mortality events for RVF
- vaccination coverage for yellow fever
- GPS-confirmed sentinel sites
- intervention/action logs

## Revised Dashboard Modules

### 1. Regional Overview

Policy-facing summary:

- countries/districts monitored
- active climate signals
- high-priority districts
- evidence readiness
- current limitations

### 2. Climate Anomaly and Flooding

Shows:

- rainfall anomaly
- recent rainfall accumulation
- temperature suitability
- humidity/wetness
- flood-prone zones

Use:

- RVF and mosquito emergence preparedness

### 3. Aedes-Borne Preparedness

Diseases:

- dengue
- chikungunya
- yellow fever
- Zika context

Indicators:

- urban population
- temperature suitability
- rainfall/water-storage context
- Aedes occurrence evidence
- land cover and settlement patterns

### 4. Rift Valley Fever One Health Watch

Indicators:

- heavy rainfall
- flooding/wetness
- livestock/agricultural interface
- vegetation greenness
- Aedes/Culex suitability
- animal-health event readiness

### 5. Vector Evidence

Shows:

- mosquito occurrence records
- species groups: Aedes, Culex, Anopheles context
- data source status
- field validation needs

### 6. Data Readiness

Shows:

- what data is available
- what is missing
- who should provide it
- whether the system output is operational, pilot-grade, or blocked

### 7. Action Review

For policy users:

- priority districts
- recommended verification action
- responsible institution
- status: pending, reviewed, actioned
- evidence supporting the recommendation

## Revised Modelling Approach

For policymakers, do not display equations in the frontend.

Keep the models in the backend and documents, but present outputs as:

- suitability level
- preparedness level
- confidence level
- data gaps
- recommended verification

### Model Families

1. Climate suitability index
2. Aedes ecological suitability score
3. RVF rainfall-flooding-livestock signal
4. Data confidence score
5. Operational priority ranking

## What Must Change In The Current System

### Naming

Replace:

- malaria
- Anopheles-only
- Rwanda-only
- vectorial capacity
- insecticide resistance interpretation

With:

- arboviral diseases
- Aedes/Culex/vector ecology
- African Great Lakes region
- climate-vector preparedness
- pilot-grade vector-control context

### Frontend Pages

Current pages can be adapted:

- Overview -> Regional Arboviral Intelligence
- Climate -> Climate and Flooding Signals
- Live Weather -> Field Verification Weather
- Modeling -> Preparedness Prioritization
- Mosquito -> Vector Evidence
- Resistance -> Vector Control Context
- Sites -> Sentinel and Cross-Border Sites
- Alerts -> Action Review
- Data Readiness -> Evidence and Partner Data Gaps

### Backend

Keep:

- database architecture
- climate endpoints
- public-data endpoints
- readiness endpoints
- alert/action workflow

Add later:

- disease registry
- country/region support
- Aedes occurrence endpoints
- RVF One Health endpoints
- arboviral case/syndromic data tables
- livestock event tables

## New Proposal Framing

This should be presented as a **decision-support and preparedness platform**, not a validated disease-prediction engine.

Strong sentence:

> The project will build a climate-informed arboviral disease intelligence platform for the African Great Lakes region, integrating climate anomalies, vector ecology, environmental suitability, One Health indicators, and surveillance-readiness data to guide field verification, preparedness planning, and cross-border public-health coordination.

## Key Scientific Position

The system can support:

- preparedness
- surveillance prioritization
- climate-risk screening
- vector/ecology evidence integration
- pilot design
- policy decision support

The system cannot yet claim:

- confirmed outbreak prediction
- causal attribution
- validated incidence forecasts
- final disease burden estimates

Those require confirmed arboviral case data, vector infection data, longitudinal field sampling, and partner validation.

## Immediate Implementation Plan

### Phase 1: Rebrand and Reframe

- update dashboard text
- remove malaria-specific wording
- update README and proposal documents
- rename outputs to arboviral preparedness

### Phase 2: Data Registry Update

- add disease categories
- add vector groups
- add regional countries
- mark current PI data as Rwanda proof-of-concept vector ecology infrastructure

### Phase 3: Frontend Update

- create policy-facing Arboviral Overview
- add Aedes-borne Preparedness page
- add RVF One Health Watch page
- update Data Readiness page for partner data needs

### Phase 4: Backend Expansion

- add disease registry endpoint
- add regional source registry endpoint
- add preparedness priority endpoint
- add case-data placeholder schema for future partner data

### Phase 5: Proposal Package

- new concept note
- system architecture figure
- data availability table
- validation work package
- implementation budget logic

