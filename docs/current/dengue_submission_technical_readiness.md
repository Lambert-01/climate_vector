# DengueEW-GL Technical Submission Readiness

**Review date:** 20 July 2026  
**Proposal:** AI-Enabled Community-Based Early Warning Systems Integrating Essential Climate Variables and Aedes Mosquito Surveillance for Dengue Prevention in the African Great Lakes Region  
**Funding stage:** Nexa Proof of Concept

## Executive readiness statement

DengueEW-GL is technically ready to be demonstrated as a pre-developed digital
architecture for an 18-24 month proof-of-concept pilot. It is not presented as a
validated national outbreak-prediction system. The platform now makes this boundary
visible in its interfaces, APIs, data model, exports, and readiness gates.

The software can ingest and review climate, public Aedes occurrence, candidate-site,
community, entomological, genomic, model-evaluation, alert, and monitoring data. The
grant is required to generate the prospective Aedes observations, governed dengue
outcomes, genomic evidence, community implementation evidence, and external model
validation needed to move from preparedness prioritization to validated early warning.

## Proposal-to-system alignment

| Proposal requirement | Implemented capability | Current evidence boundary |
|---|---|---|
| Essential climate variables | NASA POWER, ERA5-Land, Open-Meteo, rainfall, temperature and humidity workflows | Climate context is available; local station calibration remains a pilot task |
| Aedes surveillance | BG-Sentinel, ovitrap, larval-survey and aspirator records with sampling effort and QC status | Workflow is ready; prospective observations must be collected |
| Community-based reporting | Consent-gated, privacy-minimised breeding-source report intake and review | Workflow is ready; participation evidence must come from the pilot |
| Genomic surveillance | Mosquito-pool chain-of-custody, extraction, sequencing, QC and dengue-result registry | No genomic result is inferred or pre-populated |
| AI and statistical modelling | Transparent district prioritization, reason codes, uncertainty, readiness gates and model-evaluation registry | Validated dengue forecasting is blocked until labelled outcomes and sufficient coverage exist |
| Decision support | Decision Room, review signals, field verification, response actions and exports | Signals require technical review and are not official public-health alerts |
| Monitoring, evaluation and learning | Indicator observations, operational counts and model-performance fields | Baselines and targets are finalized with pilot partners |
| Great Lakes relevance | Regional climate and Aedes occurrence context with Rwanda pilot operations | Presence-only public records do not prove local abundance or transmission |

## Implemented technical architecture

### Data and Python engineering

- Reproducible processed tables separate PI source data, public context and pilot records.
- Source registry records provenance, intended use, licensing context and scientific limitations.
- Validation prevents impossible coordinates, future collection dates, invalid count denominators,
  positive containers exceeding inspected containers, oversized mosquito pools and unsupported serotype entries.
- Aedes metrics are computed only from observed numerators and denominators: container index,
  eggs per trap, adults per 24 trap-hours, effort coverage, temporal coverage and district coverage.
- The governed mathematical framework registers current screening models, their claim boundaries,
  grant-period predictive models, required outcomes and spatial, temporal and probabilistic validation.
- Missing evidence remains null or blocked. The model engine no longer inserts fabricated climate defaults
  or hardcoded district evidence counts.

Co-PI NDACYAYISENGA Lambert leads essential climate-variable integration, mathematical
modelling, uncertainty, validation and risk forecasting. The full scientific work
package and proposal-ready role language are documented in
`docs/current/co_pi_climate_mathematical_modelling_framework.md`.

### API and database

- FastAPI exposes read APIs for public dashboard use and controlled write APIs for pilot operations.
- Neon PostgreSQL stores community reports, prospective Aedes observations, genomic samples,
  model evaluations and MEL observations.
- Alembic revision `c5e807db8a10` is the current schema head; it adds durable field-verification persistence after the core dengue pilot tables.
- Pilot write operations support an `X-Operator-Key` gate and create audit-log entries.
- Local JSON fallback supports offline demonstration without inventing records; it begins empty and is git-ignored.

### Policy-facing frontend

- Dengue Command Overview: evidence status, current operational counts and system position.
- Decision Room: district evidence review, uncertainty, recommended verification and action workflow.
- Dengue Intelligence: Great Lakes climate and Aedes occurrence context without treating GBIF presence as surveillance.
- Pilot Operations: Aedes field entry, consented community reports, genomic registry, submission readiness and MEL.
- Spatial Operations: candidate sentinel sites, coordinate quality and mapping.
- Climate and Live Weather: historical climate context and current field-planning conditions.
- Response Board and Field Verification: human-reviewed signal disposition and follow-up.
- Data Control: source provenance, validation state, gaps and governance boundaries.
- CSV, JSON and print exports are available from operational pages.
- Route-level code splitting keeps the initial production bundle suitable for constrained connections.

## Data governance and claim controls

The system deliberately separates five evidence classes:

1. **PI legacy evidence:** Anopheles ecology and susceptibility records support field-infrastructure and vector-control context only.
2. **Public contextual evidence:** climate, boundaries, land cover, elevation and GBIF occurrences support prioritization, not causal claims.
3. **Prospective pilot observations:** Aedes traps, containers and adults become analytic evidence only after quality review.
4. **Partner-governed health evidence:** suspected and confirmed dengue outcomes require agreements, ethics and access controls.
5. **Derived decision signals:** scores and alerts remain reviewable, versioned and uncertainty-labelled.

No synthetic surveillance, dengue case, genomic or community records are shipped as evidence.

## Deployment checklist

### Render API

Set these environment variables:

- `DATABASE_URL`: Neon asynchronous PostgreSQL connection.
- `DATABASE_SYNC_URL`: synchronous migration/administration connection if required by deployment tooling.
- `API_CORS_ORIGINS`: exact Vercel origin, for example `https://climate-vector-web.vercel.app`.
- `OPERATOR_API_KEY`: strong generated secret for protected write operations.
- `JWT_SECRET` and `API_SECRET_KEY`: generated production secrets.

Run `.venv/bin/alembic upgrade head` during release or before starting the updated service.

### Vercel web

Set:

- `VITE_API_BASE`: Render API base ending in `/api`.
Authorized staff enter the operator key through the header control. It is retained only in browser session storage
and is not compiled into the Vercel bundle. Public visitors remain read-only. Full user accounts and server-side
roles remain the recommended post-pilot identity layer.

### Release verification

1. Call `/api/health` and confirm the expected project environment.
2. Call `/api/dengue/submission-readiness` and `/api/dengue/model-readiness`.
3. Confirm the Vercel origin receives valid CORS headers.
4. Submit one controlled test observation, verify persistence, then remove or mark it as excluded.
5. Confirm exports, mobile layout, map rendering and empty states.
6. Review logs for database fallback or upstream climate failures.

## Technical verification completed

- Backend automated tests: 64 passing.
- Frontend production build: passing.
- Frontend initial JavaScript bundle reduced from approximately 929 KB to approximately 188 KB through route splitting.
- Alembic migration head: `c5e807db8a10` after release migration.
- Validation, provenance, claim boundaries and empty-state behavior are automated and visible.

## Remaining PI and partner actions before submission

These are proposal/governance tasks, not missing software features:

- Confirm the applicant organization and legal eligibility.
- Finalize exact pilot districts, communities, sentinel sites and recruitment approach.
- Confirm institutional and health-authority roles and obtain support letters where available.
- Finalize sampling frequency, trap allocation, sample-size rationale and laboratory workflow.
- Define ethics, consent, privacy, safeguarding and data-sharing approvals.
- Confirm access pathway for governed dengue outcome data and case definitions.
- Finalize budget, milestones, risk register, gender/equity approach and sustainability plan.
- Define operational alert thresholds, approval authority and escalation standard operating procedures.
- Confirm MinION laboratory capacity, biosafety, cold-chain and quality-assurance responsibilities.

## Grant-period technical validation plan

During the proof-of-concept, the team should first establish prospective data quality and operational feasibility.
After sufficient spatial and temporal coverage exists, freeze model specifications and evaluate temporal holdout,
geographic holdout, calibration, discrimination, lead time, false-alert burden and subgroup performance.
Any transition from preparedness signal to outbreak forecast must pass documented scientific and governance review.

## Final positioning

The defensible submission claim is: **the team has a working, data-governed digital architecture ready for field
testing, and seeks Proof of Concept funding to co-design, populate, validate and operationalize it with local health
actors.** This is stronger and more credible than claiming that the current legacy and public datasets already prove
dengue transmission or predictive performance.
