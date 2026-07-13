# Nexa Application Readiness Review

Project: ArboRisk-GL - Climate-informed arboviral preparedness and vector intelligence for the African Great Lakes region

Target call: Nexa / Grand Challenges Rwanda Climate and Health Innovation, June 2026

Recommended track: Proof of Concept

Status date: 2026-07-13

## 1. Executive Verdict

The current system is strong enough to support a Proof of Concept application, but it is not yet a fully validated public-health early warning system. This distinction is important and should be stated clearly in the proposal.

The strongest application framing is:

> ArboRisk-GL is a Proof of Concept digital intelligence and action workflow that integrates climate, vector, sentinel-site, environmental, and local entomology evidence to help health actors prioritize arboviral and mosquito-borne disease surveillance, field verification, and preparedness actions in Rwanda and the African Great Lakes region.

The system should not claim confirmed dengue, chikungunya, Zika, yellow fever, RVF, or malaria outbreak prediction. It should claim climate-vector preparedness, risk signal review, field-verification prioritization, data-readiness tracking, and a path to validated early warning once official health outcome data and pilot surveillance data are collected.

## 2. RFP Fit

The project fits the RFP under Area of Focus 1: climate-informed early warning and monitoring systems.

The RFP asks for innovations that allow health actors to anticipate and respond to changing mosquito ecology and integrate weather/climate data with health data to forecast climate-related health risks and drive surveillance or health-service delivery action. The current system already addresses the climate, mosquito ecology, surveillance, and action-workflow parts. The remaining gap is formal health outcome data, which should be handled through the Proof of Concept pilot rather than hidden.

The project should apply as Proof of Concept, not Transition to Scale. The RFP states that Proof of Concept proposals are allowed to be new, early-stage ideas and are expected to generate evidence on performance, feasibility, acceptability, buy-in, and early health-impact signals. That matches the current maturity of the system.

## 3. Current Technical Readiness

### Backend

Status: usable for Proof of Concept demo.

Implemented:

- FastAPI backend.
- Arboviral intelligence API.
- Climate context API.
- Public data API.
- Sites and sentinel registry API.
- Mosquito/vector evidence API.
- Vector-control/susceptibility context API.
- Live weather API.
- Readiness and governance endpoints.
- CSV-backed current-data operation with database-ready architecture.
- CORS support for local and Vercel-hosted frontend.

Verified:

- Backend test suite passes: 19 tests passed.
- API structure supports the current dashboard modules.

Main engineering gaps:

- Add stronger API tests for each arboviral endpoint.
- Add integration tests against the deployed Render API.
- Add authentication and role-based access before real operational use.
- Add audit logs for alert review, field verification, and data changes.
- Confirm Neon seed/migration status before presenting it as production database-backed.

### Frontend

Status: usable for Proof of Concept demo and proposal presentation.

Implemented:

- React/Vite dashboard.
- Great Lakes arboviral preparedness page.
- Command overview.
- Spatial operations and sentinel map.
- Vector evidence page.
- Vector-control context page.
- Climate context page.
- Live weather page.
- Preparedness prioritization page.
- Response board.
- Data control/readiness page.
- Source/provenance and interpretation panels.

Verified:

- Production frontend build completes successfully.

Main frontend gaps:

- The JavaScript bundle is large and should be code-split later.
- Add loading, empty-state, and API-error polish for every page.
- Add a clear "proposal demo / pilot validation" banner.
- Add export buttons for PDF/CSV summary tables.
- Add a policy-maker one-page view with only the decision signals and next actions.

### Data Engineering

Status: strong for a current-data Proof of Concept; not enough for validated outbreak forecasting.

Available data:

- PI IR dataset: `data/raw/IR_data.xls`.
- PI mosquito ecology dataset: `data/raw/mosquito_behavior_raw.xls`.
- Lecturer sentinel site map: `Map- 33 sentinel.xls`.
- Processed sentinel registry: `data/processed/context/sentinel_sites_33.csv`.
- NASA POWER climate data.
- ERA5-Land monthly climate data.
- CHIRPS rainfall sample data.
- GBIF/vector occurrence evidence for Aedes, Culex, and Anopheles.
- Rwanda boundaries and environmental covariates.
- Processed Great Lakes climate and vector context tables.

Important limitation:

The current data are enough to build a professional preparedness and decision-support MVP. They are not enough to certify disease incidence forecasts, outbreak alerts, or laboratory resistance interpretation.

## 4. Application Readiness Against Nexa Review Criteria

### Relevance

Status: strong.

Why it fits:

- Focuses on changing mosquito ecology and climate-sensitive mosquito-borne risk.
- Uses weather, climate, environmental, vector, and local entomology evidence.
- Targets health actors, surveillance teams, and policy decision-makers.
- Supports surveillance and health-service delivery action through response workflow.

What to strengthen:

- Explicitly name the priority outcomes: malaria and dengue prevention, timelier surveillance response, and more targeted vector-control decision support.
- Keep arboviral framing centered on Aedes and Culex. Treat Anopheles as malaria and legacy vector-surveillance context.

### Innovation

Status: promising; needs sharper proposal language.

The innovation is not simply a dashboard. It is an evidence-to-action operating layer that combines:

- climate signal monitoring;
- vector ecology and occurrence context;
- sentinel-site readiness;
- insecticide/vector-control context;
- data provenance and uncertainty scoring;
- field-verification workflow;
- pilot learning agenda.

This is stronger than a static climate dashboard because it turns uncertain climate-vector signals into a queue of reviewable public-health actions.

### Impact

Status: plausible for Proof of Concept; needs a MEL plan.

Best impact claims:

- Faster identification of districts/sites requiring field verification.
- More timely vector surveillance and targeted preparedness action.
- Improved readiness for dengue/malaria and broader arboviral threats.
- Better data governance by showing what evidence is available, what is missing, and what can be trusted.

Do not claim:

- Reduced outbreak incidence already achieved.
- Confirmed disease prediction accuracy.
- Official national alerting capability.

### Execution Plan

Status: good technical foundation; proposal still needs an operational pilot plan.

Needed for the application:

- 18-24 month workplan.
- Pilot geography and partner roles.
- Field verification protocol.
- Data governance and ethics plan.
- MEL indicators and milestones.
- Risk register.
- Budget and budget justification.

### Project Team

Status: technically credible if positioned correctly.

Recommended framing:

- Lambert: applied mathematical modeller and developer leading modelling, data engineering, and system implementation.
- PI/lecturer: domain and dataset lead.
- Public-health or entomology partner: field validation and interpretation.
- Health authority or district partner: action pathway and adoption.

Critical requirement:

The applicant must be an incorporated or equivalent organization. An individual application is not eligible. The Project Lead must be formally affiliated with the applicant organization.

## 5. Documents Needed Before Applying

Minimum application package:

- Fluxx application account and completed online application.
- Project title and short summary.
- Full concept/proposal narrative.
- Theory of change.
- 18-24 month implementation workplan.
- MEL plan.
- Budget.
- Budget justification.
- Team bios/CVs.
- Applicant organization registration or proof of legal status.
- Applicant organization good-standing evidence where available.
- Data governance and ethics statement.
- Risk and mitigation table.
- Sustainability and scale pathway.
- References and data-source list.
- Demo link and short demo screenshots.

Recommended support documents:

- Letter from PI/lecturer confirming collaboration, dataset origin, and permission to use derived/sanitized outputs.
- Letter from applicant institution confirming Lambert's formal affiliation and authority to participate.
- Letter from a health-sector partner, such as RBC/MoH, district health office, or surveillance unit, supporting the pilot need.
- Letter from an entomology or laboratory partner supporting field validation.
- Letter from a regional or academic partner if the Great Lakes scope is emphasized.
- Data-sharing intent letter for future official arboviral/febrile illness or malaria surveillance indicators.

## 6. What Must Be Fixed Before Submission

High priority:

- Decide the legal applicant organization.
- Confirm Lambert's formal project role and affiliation.
- Prepare 2-3 support letters.
- Convert the current system into a short demo story: signal -> review -> field verification -> action -> learning.
- Write the MEL plan.
- Write the budget and justification.
- Confirm deployment URLs and CORS are working.
- Add a proposal-facing source registry explaining every dataset and what it can/cannot prove.

Medium priority:

- Add PDF/CSV exports from dashboard views.
- Add a one-page policy-maker summary page.
- Add stronger API test coverage for arboviral endpoints.
- Add deployment health-check screenshots.
- Add short user guide for PI/reviewer.

After award / pilot phase:

- Collect Aedes/Culex field surveillance.
- Add official disease/febrile illness indicators through partner governance.
- Confirm sentinel GPS and metadata.
- Add protocol-confirmed susceptibility interpretation.
- Calibrate and validate thresholds.
- Add user roles, audit logs, and field mobile forms.

## 7. Recommended 9-Day Submission Sprint

Day 1:

- Freeze the project title, track, applicant organization, and lead roles.
- Prepare one-page system description and source registry.

Day 2:

- Draft concept narrative and theory of change.
- Add screenshots from the current dashboard.

Day 3:

- Draft workplan and MEL indicators.
- Define pilot geography and operational workflow.

Day 4:

- Draft budget and budget justification.
- Ask for support letters.

Day 5:

- Finalize data governance, ethics, risk, and sustainability sections.

Day 6:

- Test deployment, collect screenshots, and verify API endpoints.

Day 7:

- Internal review with PI/lecturer and partner.

Day 8:

- Enter Fluxx application and upload attachments.

Day 9:

- Final proofread and submit before the deadline.

## 8. Final Positioning

The system is not yet a national validated prediction platform. It is a credible, innovative, locally led Proof of Concept for climate-informed mosquito-borne disease preparedness.

The winning story should be:

> We already built the technical foundation. Nexa funding will allow us to field-test it with local health actors, validate the climate-vector signals, collect the missing operational data, and prove whether the system improves timeliness and targeting of mosquito-borne disease preparedness actions.

