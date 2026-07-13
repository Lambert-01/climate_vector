# Professional AI/Developer Prompt: ArboRisk-GL Technical Enhancement

Use this prompt with another advanced AI coding agent or senior developer.

---

You are acting as a senior full-stack software architect, Python data engineer, applied mathematical modeller, product designer, and climate-health digital innovation advisor. You are working inside an existing project called **ArboRisk-GL**, a climate-informed arboviral preparedness and vector intelligence system for Rwanda and the African Great Lakes region.

The project is being prepared for the **Nexa / Grand Challenges Rwanda Climate and Health Innovation funding opportunity, June-July 2026**, specifically under the **Proof of Concept** track and the focus area of **climate-informed early warning and monitoring systems**. The system should help local health actors turn climate-risk and mosquito-ecology signals into timely surveillance, field verification, and preparedness action.

The system must be positioned honestly. It is **not yet a validated national outbreak prediction platform**. It does not yet have official dengue, chikungunya, Zika, yellow fever, RVF, malaria incidence, febrile illness, laboratory confirmation, or routine health-service outcome data. It also still needs formal partner validation, field pilot data, Aedes/Culex surveillance, and operational adoption evidence. This is acceptable because the target funding is Proof of Concept, where the innovation is expected to generate evidence during the project period.

Your task is to enhance the existing system technically and professionally so that it becomes a strong, credible, production-demo-ready Proof of Concept platform. Focus on the developer/technical side. Assume the PI and institutional partners will handle formal letters, health-data permissions, ethics, field approvals, and partner validation. Your work should make the platform technically convincing, visually polished, data-provenance aware, and ready to support the application narrative.

## 1. Existing Project Context

The project stack is:

- Python data engineering and modelling engine.
- FastAPI backend.
- React/Vite frontend.
- PostgreSQL/Neon-ready database architecture.
- CSV-backed current-data fallback.
- Vercel frontend deployment.
- Render backend deployment.
- Public data integrations and local processed data tables.

Important backend location:

```text
apps/api/
```

Important frontend location:

```text
apps/web/
```

Important data locations:

```text
data/raw/
data/interim/
data/processed/
data/processed/context/
data/external/
```

Important documentation:

```text
docs/current/arboviral_phd_policy_system_blueprint.md
docs/current/nexa_application_readiness_review.md
docs/current/deployment_render_vercel.md
```

The system already contains several working components:

- Arboviral intelligence endpoint.
- Great Lakes climate context.
- Public vector occurrence context.
- Sentinel site registry using 33 mapped sites.
- PI mosquito ecology data.
- PI insecticide/susceptibility context data.
- Live weather context.
- Climate and environmental context.
- Data-readiness and source-validation concept.
- Response board / alert workflow foundation.
- React dashboard with multiple modules.

The system must remain grounded in real data. Do not fabricate disease case data, field surveillance data, official outbreak alerts, or validation evidence. If a dataset is missing, expose the gap clearly and convert it into a pilot requirement, field-verification workflow, or data-governance action.

## 2. Strategic Product Goal

Upgrade ArboRisk-GL from a research-style dashboard into a **policy-facing climate-health intelligence and action system**.

The system should communicate:

1. What climate-vector signals are emerging.
2. Which locations require attention.
3. What evidence supports that signal.
4. How confident the system is.
5. What action a health actor should take next.
6. What data gaps still prevent official prediction or validation.
7. How the Proof of Concept pilot will close those gaps.

The platform should feel like an operational decision-support system, not an academic figure viewer. It should have minimal unnecessary text, clean layouts, strong information hierarchy, and professional design. Policy-makers should be able to understand the main message quickly. Technical users should be able to inspect the data provenance and validation details.

## 3. Critical Scientific And Ethical Boundary

Maintain the following boundary everywhere in code, UI text, documentation, API responses, and generated outputs:

The current system provides **preparedness intelligence, climate-vector context, field-verification prioritization, and decision-support signals**. It does **not** provide confirmed outbreak prediction, official disease surveillance conclusions, or final laboratory resistance interpretation.

Acceptable claims:

- Climate-informed vector preparedness.
- Arboviral and mosquito-borne disease readiness.
- Field-verification prioritization.
- Data-readiness and source validation.
- Climate-vector signal review.
- Sentinel-site operational planning.
- Public-data contextual intelligence.
- Proof of Concept system ready for pilot validation.

Avoid claims such as:

- Confirmed dengue outbreak forecast.
- Official national early warning system.
- Validated incidence prediction.
- Certified resistance interpretation.
- Official public-health alert.
- Disease burden estimate without health outcome data.

The frontend should use strong, confident language, but it must not overclaim. Use terms such as **priority**, **signal**, **readiness**, **verification**, **preparedness**, **confidence**, and **action queue** instead of unsupported terms such as **confirmed outbreak** or **final prediction**.

## 4. Main Technical Enhancements Required

### A. Production-Demo Readiness

Make sure the app can run cleanly locally and in deployment.

Tasks:

- Confirm backend starts reliably.
- Confirm frontend starts reliably.
- Confirm Vercel frontend can call Render backend.
- Confirm CORS supports the deployed frontend domain.
- Confirm all major pages load without blank charts or broken tables.
- Add graceful API-error states.
- Add loading skeletons or professional loading states.
- Add empty-state designs that explain why data may be missing.
- Add health/status endpoint coverage.
- Add a frontend system-status panel.

Expected output:

- A dashboard that opens reliably.
- No obvious blank sections unless the empty state is intentional and explained.
- A clear data/API health indicator.
- Documented commands for local run, production build, and deployment verification.

### B. Data Provenance And Source Registry

Every major chart, table, and intelligence card must answer:

- What is the source?
- Is the source PI-provided, public, external, or derived?
- Which raw file or public API was used?
- Which processed table powers this result?
- What date range is covered?
- What does this source support?
- What can it not prove?
- What quality limitations exist?

Important source chains:

PI insecticide/susceptibility context:

```text
data/raw/IR_data.xls
-> data/interim/raw_excel_exports/IR_data_sheet1.csv
-> data/processed/resistance_test_replicates_preliminary.csv
-> backend/API
-> dashboard vector-control context
```

PI mosquito ecology context:

```text
data/raw/mosquito_behavior_raw.xls
-> data/interim/raw_excel_exports/mosquito_behavior_raw_sheet1.csv
-> data/processed/mosquito_ecology_preliminary.csv
-> backend/API
-> dashboard vector evidence
```

Sentinel site mapping:

```text
Map- 33 sentinel.xls
-> data/interim/raw_excel_exports/Map- 33 sentinel_untitled_map__33_sentinel.csv
-> data/processed/context/sentinel_sites_33.csv
-> backend/API
-> spatial operations dashboard
```

Public context:

- NASA POWER climate.
- ERA5-Land climate.
- CHIRPS rainfall.
- GBIF vector occurrences.
- WorldClim.
- Elevation.
- Boundaries.
- Land cover.
- Population or environmental context if available.

Expected output:

- A backend endpoint like `/api/system/source-registry` or improved existing public-data validation endpoint.
- A frontend “Data Control” or “Evidence Registry” view.
- Per-page source/provenance badges.
- Clear distinction between raw, processed, derived, and external sources.

### C. Data Validation Engine

Build a stronger validation layer in Python.

The validation engine should check:

- Required files exist.
- Required processed CSVs exist.
- Required columns exist.
- Tables are not empty.
- Coordinates are valid.
- Sentinel sites have unique IDs.
- Latitude/longitude values are within expected regional bounds.
- Climate values are plausible.
- Vector occurrence records have species, country/region, date or year if available.
- PI ecology fields are mapped consistently.
- PI resistance fields include insecticide, concentration, district/site where available, and dead count.
- Missing fields are classified as technical missingness, scientific missingness, or partner-governance missingness.

The validation output should include:

- domain
- source file
- processed file
- status
- record count
- key fields present
- missing fields
- severity
- recommendation
- whether the source can be used in the current MVP
- whether the source is required for future validation

Expected output:

- A generated validation CSV or JSON.
- An API endpoint exposing validation results.
- Frontend cards and tables visualizing validation readiness.
- Tests proving validation does not silently pass empty or broken data.

### D. Decision Room / Policy-Maker View

Create a new high-level frontend page for policy-makers. This page should be the clearest, most professional page in the system.

Suggested name:

- Decision Room
- Action Brief
- Preparedness Command
- Policy Intelligence

Recommended contents:

- Top priority locations.
- Current climate signal.
- Vector evidence.
- Sentinel-site readiness.
- Confidence level.
- Recommended action.
- Data limitation.
- Responsible actor.
- Time window.
- Exportable summary.

The page should not show formulas. It should translate backend data into decisions.

Example decision card:

```text
Priority: High
Location: Kigali / Rwanda sentinel cluster
Signal: Warm and wet climate window with relevant vector context
Evidence: NASA POWER climate + sentinel registry + GBIF Aedes context
Confidence: Medium
Recommended action: Field verification and Aedes/Culex larval-source inspection
Limitation: No official arboviral case data connected yet
Owner: Surveillance / vector-control team
```

Expected output:

- New route in React.
- Backend endpoint if needed.
- Strong visual design.
- Export or screenshot-friendly layout.

### E. Alert And Action Workflow

Upgrade the current alert/response concept into a practical workflow.

Alerts should be created from:

- Climate anomaly or rainfall signal.
- Vector occurrence context.
- Sentinel-site vulnerability.
- Data validation issue.
- Live weather field-window signal.
- Manual expert review.

Alert statuses:

- New.
- Under review.
- Field verification requested.
- Verified.
- Closed.
- Escalated.

Alert fields:

- alert ID
- location
- signal type
- vector group
- evidence sources
- confidence
- limitation
- recommended action
- assigned owner
- due date
- status
- review notes

Expected output:

- Better backend models or CSV-backed workflow if database is not finalized.
- Frontend board or table with filters.
- Ability to create/update an alert locally.
- Clear distinction between “preparedness alert” and “official outbreak alert.”

### F. Field Verification Module

Because the RFP wants climate-risk signals to become action, the system should show how field teams would verify a signal.

Build a field verification workflow, even if actual pilot data are not yet collected.

Fields:

- verification ID
- linked alert
- site/district
- reason for visit
- climate trigger
- suspected vector group
- suspected breeding source
- checklist items
- GPS placeholder
- photo placeholder
- larval inspection result placeholder
- adult mosquito collection placeholder
- community observation placeholder
- action taken
- final status

The workflow can be simulated as an operational design, but it should not fabricate completed field results.

Expected output:

- Field verification page or section.
- Form UI.
- Table of verification requests.
- Clear “pilot data pending” status for incomplete fields.

### G. Modelling And Scoring Enhancement

Keep formulas mostly out of the frontend. Use modelling internally to generate interpretable scores.

Recommended backend outputs:

- preparedness priority score
- climate suitability signal
- wetness signal
- heat suitability signal
- vector evidence signal
- sentinel readiness score
- data confidence score
- action urgency level

Model design should be transparent and modular:

- Normalize each evidence layer.
- Weight layers conservatively.
- Penalize missing validation data.
- Produce low/medium/high categories.
- Return reason codes explaining the score.

Example reason codes:

- recent rainfall suitable for breeding habitat
- temperature within plausible Aedes/Culex activity range
- sentinel site mapped
- public Aedes occurrence context present
- official case data missing
- local Aedes/Culex field surveillance pending

Expected output:

- Backend scoring module.
- Tests for scoring logic.
- Frontend displays reasons and confidence, not equations.

### H. Database And API Hardening

If Neon/PostgreSQL is configured, ensure the database is actually used or clearly document CSV fallback.

Tasks:

- Confirm migrations.
- Confirm seed scripts.
- Confirm database status endpoint.
- Confirm API can operate if database is unavailable.
- Add clear response metadata: `source_mode = database | csv_fallback`.
- Avoid hidden failures.

API improvements:

- Consistent response shapes.
- Response metadata with last updated time and source mode.
- Better error messages.
- Endpoint tests.
- Validation tests.

Expected output:

- Reliable API.
- Tests covering major endpoints.
- Clear database readiness view in frontend.

### I. Deployment And Reviewer Evidence

Prepare technical evidence for the application and reviewer demo.

Outputs needed:

- Deployment checklist.
- Render API health result.
- Vercel frontend URL.
- Screenshots of major pages.
- API endpoint list.
- Data source registry.
- Architecture diagram.
- Data flow diagram.
- Short demo script.

The system should be easy to demonstrate in 5 minutes:

1. Open dashboard.
2. Show Decision Room.
3. Show priority location.
4. Open evidence/provenance.
5. Show field verification action.
6. Show data-readiness limitation.
7. Explain what the pilot will validate.

## 5. Frontend Design Requirements

Make the dashboard feel like a professional operational intelligence system.

Design principles:

- Minimal text, high information density.
- Strong card hierarchy.
- Clean tables.
- Good use of maps and charts.
- No oversized academic paragraphs.
- No formula-heavy frontend.
- Use icons where helpful.
- Use confidence badges.
- Use status badges.
- Use compact interpretation panels.
- Use clear action buttons.
- Use responsive layouts.
- Avoid blank charts.
- Avoid repeating the same generic explanation on every page.

Suggested page structure:

1. Decision Room.
2. Arboviral Preparedness.
3. Spatial Operations.
4. Vector Evidence.
5. Vector-Control Context.
6. Climate Context.
7. Live Weather.
8. Preparedness Priority.
9. Response Board.
10. Field Verification.
11. Data Control.
12. System Status.

Each page should have:

- one clear purpose;
- 3-5 top metrics;
- one strong chart/map/table area;
- one action or interpretation block;
- one source/provenance link or badge.

## 6. Backend/Data Engineering Requirements

Use Python engineering properly.

Create or improve:

- ingestion scripts;
- processed table builders;
- validation scripts;
- scoring modules;
- seed scripts;
- API routers;
- service helpers;
- tests.

Do not manually hardcode results in frontend. Results should come from processed data or API responses.

Do not create mock disease data. If demonstration placeholders are needed, label them clearly as workflow placeholders, not observed outcomes.

Prefer structured CSV/JSON outputs and typed API response shapes.

## 7. Testing Requirements

Add or improve tests for:

- API health.
- arboviral intelligence.
- source registry.
- data validation.
- sentinel sites.
- mosquito/vector records.
- resistance/susceptibility summary.
- climate context.
- live weather if deterministic fallback exists.
- scoring logic.
- alert workflow.
- field verification workflow.

The final test command should pass:

```bash
.venv/bin/pytest -q
```

The frontend build should pass:

```bash
cd apps/web
npm run build
```

## 8. Documentation Requirements

Create concise technical documentation:

- system architecture;
- data source registry;
- data validation report;
- API endpoint list;
- deployment guide;
- demo script;
- Proof of Concept technical limitations;
- next pilot-data requirements.

Keep documentation professional and application-ready. Avoid sounding uncertain or apologetic. State limitations as part of good governance.

## 9. Final Deliverables

At the end, provide:

1. Summary of implemented changes.
2. Files changed.
3. Tests run and results.
4. Remaining technical risks.
5. Deployment instructions.
6. Short reviewer demo script.
7. Clear statement that this is a Proof of Concept preparedness system, not a validated outbreak prediction platform.

## 10. Highest Priority Work Order

Work in this order:

1. Verify current app and data flow.
2. Fix broken endpoints, CORS, deployment, or blank pages.
3. Build source registry and validation layer.
4. Add Decision Room / policy-maker page.
5. Upgrade alert/action workflow.
6. Add field verification module.
7. Improve scoring and confidence reason codes.
8. Add tests.
9. Improve visual design across all pages.
10. Produce technical documentation and demo evidence.

Do not spend time requesting unavailable official health outcome data. The PI and partners will handle that. Your job is to make the current-data system technically excellent, honest, visually professional, and ready for a strong Proof of Concept application.

