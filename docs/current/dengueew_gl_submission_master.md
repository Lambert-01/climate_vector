# DengueEW-GL Submission Master

**Project title:** AI-Enabled Community-Based Early Warning Systems Integrating Essential Climate Variables and Aedes Mosquito Surveillance for Dengue Prevention in the African Great Lakes Region  
**Funding track:** Nexa Proof of Concept  
**Operational pilot:** Selected sites in Rwanda  
**Regional role:** Exploratory context and future external validation across neighboring Great Lakes settings

## Submission Position

DengueEW-GL is a working, data-governed proof-of-concept architecture ready for
field implementation. Nexa funding will support prospective Aedes surveillance,
genomic analysis, community co-design, governed health-data integration,
predictive-model development and operational validation.

The project does not claim that a validated national or regional dengue forecast
already exists. It separates the operational platform available now from evidence
that must be generated during the funded pilot and models that can be validated
only after sufficient prospective data are available.

## Geographic Positioning

The proof of concept will be operationally implemented and validated in selected
Rwanda pilot sites. Regional climate and vector-occurrence evidence from neighboring
Great Lakes countries will support cross-border preparedness analysis and inform
future external validation and scale-up.

## Evidence Ladder

| Level | Status | Defensible claim |
|---|---|---|
| Operational now | Working architecture | Climate integration, candidate-site planning, Aedes data capture, community reporting, genomic registry, data control, human review, field verification and monitoring workflows |
| Generated during the grant | Prospective evidence | Standardized trap effort, Aedes abundance and occurrence, mosquito-pool results, community verification, governed dengue outcomes and operational response evidence |
| Validated after sufficient evidence | Scientific performance | Aedes occurrence and abundance models, lagged climate effects, dengue-positive pool models, calibrated risk forecasts and external validation |

## Policy-Facing Modules

1. **Executive Dashboard:** study sites, prospective surveillance counts, genomic
   testing, community reporting, review signals and response completion.
2. **Climate Intelligence:** rainfall, temperature, humidity, anomalies, lagged
   indicators and suitability screening.
3. **Aedes Surveillance:** adults, larvae, eggs, ovitrap positivity, species,
   sampling effort, quality review and spatial distribution.
4. **Dengue Genomic Surveillance:** pool identity, testing status, positivity,
   serotype, sequencing status, lineage and quality control.
5. **Community Reporting:** standing water, containers, potential breeding sites,
   photographs, coordinates, consent, validation, action and follow-up.
6. **Risk and Forecasting:** exploratory climate suitability now; validated Aedes
   and dengue outputs only when outcome and effort requirements are met.
7. **Alerts and Actions:** draft signal, technical review, approval, assignment,
   recipient acknowledgment, field evidence and closure.
8. **Data Control:** provenance, validation, missingness, governance, model gates
   and exportable audit evidence.

## Claim Controls

Use these formulations throughout the application and demonstrations:

- **Purpose:** Generate and prospectively validate climate-informed dengue risk
  signals to support earlier preparedness and targeted surveillance.
- **Update frequency:** Regularly updated weekly or monthly climate-vector risk
  intelligence, with frequency refined during the pilot.
- **Signals:** Human-reviewed early-action signals linked to field verification and
  authorized response workflows.
- **Maps:** High-resolution maps for selected Rwanda pilot sites and exploratory
  climate-vector context maps for bordering Great Lakes settings.
- **Community evidence:** Communities report environmental observations and
  photographs; trained entomology teams verify mosquito identity and abundance.
- **Performance:** Evaluate calibration, sensitivity, specificity, precision,
  recall, ROC-AUC, PR-AUC, Brier score, lead time and false-alert burden.

Avoid statements that DengueEW-GL already predicts outbreaks, operates in real
time, autonomously issues public-health alerts or has validated regional accuracy.

## Technical Foundation

- Python data engineering, validation and modelling pipelines.
- FastAPI services with explicit readiness and evidence-boundary responses.
- PostgreSQL/Neon persistence and Alembic schema management.
- React/Vite policy-facing application with role-aware operational workflows.
- NASA POWER, ERA5-Land, Open-Meteo, environmental covariates, boundaries and
  public vector-occurrence context.
- PI-provided historical ecology and insecticide-resistance evidence, retained only
  as legacy field-infrastructure and vector-control context.
- Null-safe prospective tables: absent field, genomic, community and health evidence
  is never replaced with mock observations.

## Co-PI Technical Leadership

Co-PI NDACYAYISENGA Lambert leads essential climate-variable integration, climate
data quality control, mathematical modelling, uncertainty quantification, model
validation and risk-forecasting activities. The modelling pathway progresses from
Aedes occurrence to standardized abundance, mosquito-pool virus detection and only
then to governed early-warning models. Every predictive stage requires spatial and
temporal holdout evaluation, calibration assessment and operational review.

## Grant-Period Deliverables

- Deploy and quality-control prospective Aedes surveillance at selected Rwanda sites.
- Integrate standardized sampling effort and climate histories.
- Establish consented community environmental reporting and verification.
- Operate mosquito-pool chain of custody, testing and sequencing registration.
- Develop and validate Aedes occurrence and abundance models.
- Evaluate dengue-positive pool and early-warning models when valid outcomes exist.
- Co-design thresholds, review authority and response procedures with health actors.
- Measure usability, timeliness, lead time, false-alert burden and completed actions.
- Produce reproducible technical, governance and policy evidence for scale decisions.

## Submission Boundary

The strongest defensible statement is that the team has built the architecture and
is ready to test it in real settings. The application should request funding to
generate and validate the evidence, not imply that grant-period scientific outcomes
have already been achieved.

## Active Documents

- `dengueew_gl_submission_master.md`: canonical project identity and claims.
- `dengue_submission_technical_readiness.md`: implementation and release evidence.
- `co_pi_climate_mathematical_modelling_framework.md`: scientific and mathematical work package.
- `deployment_render_vercel.md`: deployment and production verification guide.

