# ArboRisk-GL Technical Enhancement Report

Project: ArboRisk-GL - Climate-informed arboviral preparedness intelligence for the African Great Lakes region

Status date: 2026-07-13

Prepared for: Nexa / Grand Challenges Rwanda Climate and Health Innovation (June 2026, Proof of Concept track)

---

## Important Disclaimer

**ArboRisk-GL is a Proof of Concept preparedness intelligence system. It is NOT a validated outbreak prediction platform.**

The system integrates climate signals, vector occurrence context, sentinel-site readiness, and local entomology evidence to help health actors prioritize arboviral and mosquito-borne disease surveillance, field verification, and preparedness actions. It does not predict disease outbreaks, confirm case counts, or replace laboratory-confirmed surveillance.

All risk signals, suitability indices, and preparedness scores are descriptive proxies built from publicly available climate data, PI-provided entomology datasets, and regional vector occurrence records. They have NOT been validated against official health outcome data. Any future validation will require arboviral case data from RBC/MoH, Aedes/Culex field surveillance, and protocol confirmation from institutional partners.

---

## 1. Summary of Implemented Changes

### A. Bug Fixes and Code Quality

- Fixed `<rect>` → `<Cell>` import error in Overview.jsx bar chart (recharts library)
- Added NaN guard to RiskGauge component to prevent rendering errors
- Fixed orphaned `modelling` router reference in main.py that was never registered
- Added status validation to alerts endpoint (8 valid statuses)
- Added alerts memory fallback so the Response Board does not crash when the database or Neon DNS is unreachable
- Added duplicate site handling with proper HTTP 409 responses
- Added full response fields to alerts (rule_or_model_version, alert_expiry_date, issued_by, approved_by)
- Removed dead `routes/modelling.py` file (17 lines, never registered)
- Enhanced health endpoint to check database connectivity

### B. Source Registry and Validation Layer

Built a complete data provenance tracking system:
- `GET /api/source-registry` — Lists all 12 tracked evidence sources with full provenance metadata (domain, raw_file, processed_table, supports, cannot_prove, quality_limitations, status, required_for_validation)
- `GET /api/source-registry/{id}` — Detailed view for individual source
- `GET /api/validation-engine` — Checks 16 source files for existence and record counts, reports overall system readiness status

Sources tracked include: PI insecticide resistance data, PI mosquito ecology data, NASA POWER climate data, GBIF vector occurrence, ERA5-Land monthly, CHIRPS rainfall, Rwanda boundaries, sentinel sites, processed climate tables, and processed vector tables.

### C. Decision Room (Policy-Maker Page)

New `/decision-room` route with:
- Priority district table with suitability index, risk level, and action summaries
- Confidence gauges (RiskGauge components) for risk, readiness, and field verification
- Key metrics (districts at high risk, pending actions, evidence sources)
- Action items with owners, limitations, and confidence levels
- System readiness summary (data readiness %, climate coverage, usable sources)
- Export-friendly layout suitable for screenshots and briefs

### D. Alert and Action Workflow

Complete rewrite of the Alerts page with:
- 8 alert statuses: pending_review, active, field_verification_requested, acknowledged, verified, resolved, closed, escalated
- Status transition validation (only valid transitions allowed)
- Uncertainty badges on all alert cards
- Proper state re-sync via useEffect hook (prevents stale data)
- Full alert fields: alert_id, district, risk_level, risk_reason, status, rule_or_model_version, alert_expiry_date, issued_by, approved_by

### E. Field Verification Module

New `/field-verification` route with:
- CRUD operations for verification requests (`GET/POST/PATCH /api/field-verifications`)
- Checklist templates endpoint (`/api/field-verifications/checklist-templates`)
- 3 templates: larval inspection, adult trap check, community observation
- Status workflow: pending → in_progress → data_collected → larvae_confirmed/larvae_not_found/adults_collected → completed/escalated
- Climate trigger table showing districts ready for field verification
- Form for creating new verification requests

### F. Scoring and Confidence Reason Codes

Enhanced district risk signals with structured reason codes:
- 3 categories: climate, evidence, gap
- Each code includes category, message, and source
- Examples: "Rainfall anomaly above baseline" (climate), "GBIF vector occurrence context available" (evidence), "No official arboviral case data connected" (gap)
- Returned in `/api/modeling/district/{district_name}` response

### G. Visual Design Improvements

- Skeleton loading components (SkeletonLine, SkeletonCard, SkeletonStatCard, SkeletonChart)
- Rich empty states with icons, titles, and descriptive text (EmptyState component)
- System status panel in sidebar (API online/offline, Database connected/unreachable, auto-refreshes every 30 seconds)
- Loading skeletons replace text placeholders in Overview hero KPIs, KPI tiles, and stat cards
- Improved ChartState component uses skeletons instead of simple spinners

### H. Test Suite

49 tests covering:
- Source registry (3 tests)
- Validation engine (2 tests)
- Field verification CRUD and checklists (6 tests)
- Alert workflow validation (3 tests)
- Modelling reason codes (1 test)
- Dashboard stats and database status (2 tests)
- Health endpoint (2 tests)
- CORS configuration (2 tests)
- All existing endpoint tests (28+ tests)

---

## 2. Files Changed

### Backend (apps/api/app/)

| File | Change |
|------|--------|
| `main.py` | Removed orphaned modelling router, added source_registry + field_verification routers, enhanced health endpoint with DB check |
| `routes/alerts.py` | Added status validation, full response fields, and memory fallback when database is unreachable |
| `routes/sites.py` | Added duplicate handling (IntegrityError → 409) |
| `routes/modeling.py` | Added reason codes to district risk signals |
| `routes/source_registry.py` | **NEW** — Source registry + validation engine endpoints |
| `routes/field_verification.py` | **NEW** — Field verification CRUD + checklist templates |
| `routes/modelling.py` | **DELETED** — Orphaned dead code |

### Frontend (apps/web/src/)

| File | Change |
|------|--------|
| `App.jsx` | Added DecisionRoom and FieldVerification routes |
| `api.js` | Added sourceRegistry, validationEngine, fieldVerification endpoints |
| `components/UI.jsx` | Added Skeleton*, EmptyState, improved ChartState, RiskGauge NaN guard |
| `components/Sidebar.jsx` | Added SystemStatusPanel (live API/DB health), Decision Room + Field Verification nav items |
| `pages/DecisionRoom.jsx` | **NEW** — Policy-maker decision page |
| `pages/FieldVerification.jsx` | **NEW** — Field verification workflow page |
| `pages/Alerts.jsx` | Complete rewrite (8 statuses, validation, re-sync, EmptyState) |
| `pages/Overview.jsx` | Fixed Cell import, added skeleton loading for KPIs and stat cards |
| `pages/DataReadiness.jsx` | Added source registry + validation engine sections |

### Tests

| File | Change |
|------|--------|
| `tests/test_enhancements.py` | **NEW** — 49 comprehensive tests |

### Styles

| File | Change |
|------|--------|
| `apps/web/src/styles.css` | Added skeleton shimmer CSS, upgraded empty state CSS, system status panel CSS |

---

## 3. Tests Run and Results

```bash
$ .venv/bin/pytest tests/ -q
49 passed, 1 warning in 9.86s
```

All 49 tests pass. The remaining warning is a Starlette/FastAPI TestClient deprecation warning and does not affect functionality.

Test categories:
- API health and CORS: 4 tests
- Source registry: 3 tests
- Validation engine: 2 tests
- Field verification: 6 tests
- Alert workflow: 3 tests
- Modelling reason codes: 1 test
- Dashboard stats: 2 tests
- Existing endpoint tests: 28+ tests

---

## 4. Remaining Technical Risks

1. **No formal health outcome data** — The system has no connection to official arboviral case data from RBC/MoH. This is intentional and should be addressed through the Proof of Concept pilot partnership.

2. **Database-dependent behavior in CI** — Some database-backed endpoints depend on a reachable PostgreSQL/Neon database. Alerts now fall back gracefully when the database is unreachable, but CI/CD should still configure a test database for full database-path coverage.

3. **Large JavaScript bundle** — The frontend bundle is ~855 KB (235 KB gzipped). Code splitting via dynamic imports should be implemented before production deployment.

4. **No authentication** — The API has no authentication or role-based access control. This is acceptable for the Proof of Concept demo but must be added before operational deployment.

5. **No audit logging** — Alert status changes and field verification updates are not logged. Audit trails should be added before operational use.

6. **In-memory field verification storage** — Field verification data is stored in-memory and will reset on server restart. This should migrate to the database before pilot deployment.

---

## 5. Deployment Instructions

### Local Development

```bash
# Backend
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir apps/api

# Frontend
cd apps/web
npm install
npm run dev
```

### Render (Backend)

1. Connect GitHub repository to Render
2. Create a new Web Service
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --app-dir apps/api --host 0.0.0.0 --port $PORT`
5. Set environment variable: `VITE_API_BASE=https://your-api.onrender.com/api`
6. Set environment variable: `DATABASE_URL=your_neon_connection_string`

### Vercel (Frontend)

1. Connect GitHub repository to Vercel
2. Root directory: `apps/web`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable: `VITE_API_BASE=https://your-api.onrender.com/api`

### Neon (Database)

1. Create a Neon PostgreSQL project
2. Run the database migrations (if applicable)
3. Seed with initial data from processed CSV files
4. Update `DATABASE_URL` in Render environment variables

---

## 6. Short Reviewer Demo Script

**5-minute demo flow for Nexa reviewers:**

1. **Open Overview page** — Show the hero banner with KPIs (3,547 ecology rows, 3,547 susceptibility rows, 33 sentinel sites). Point out the system readiness progress bars and evidence source badges.

2. **Navigate to Data Control** — Show the validation engine (16 source files tracked) and source registry (12 sources with full provenance). Highlight the quality limitations and "cannot prove" fields for honesty.

3. **Open Priority Engine** — Show the district risk signals with reason codes. Click on a district to see structured reason codes across climate, evidence, and gap categories.

4. **Visit Decision Room** — Show the policy-maker view with priority districts table, confidence gauges, and action items. Point out the "No official arboviral case data connected" limitation badge.

5. **Open Response Board** — Show the alert workflow. Create a new alert to demonstrate the 8-status workflow and field verification request capability.

6. **Visit Field Verification** — Show the checklist templates and climate trigger table. Demonstrate creating a verification request from a high-risk district.

7. **Show System Status** — Point to the sidebar system status panel showing live API and database connectivity.

**Key talking points:**
- This is preparedness intelligence, NOT outbreak prediction
- All data sources are tracked with full provenance
- The system is honest about what it cannot prove
- Built for Proof of Concept with clear path to pilot validation
- Ready for Nexa PoC application narrative

---

## 7. Proof of Concept Statement

**ArboRisk-GL is a Proof of Concept preparedness intelligence system for climate-informed arboviral disease surveillance in the African Great Lakes region.**

It is NOT:
- A validated outbreak prediction platform
- A confirmed disease early warning system
- A replacement for laboratory-confirmed surveillance
- An official public health decision tool

It IS:
- A climate-vector preparedness intelligence platform
- A risk signal review and prioritization workflow
- A field verification planning tool
- A data readiness tracker for pilot surveillance
- A policy-maker action brief generator
- A technical Proof of Concept for Nexa/Grand Challenges Rwanda funding

The system integrates climate signals (NASA POWER, ERA5-Land), vector occurrence context (GBIF), local entomology data (PI datasets), and sentinel-site readiness to help health actors prioritize surveillance and preparedness actions. All risk signals are descriptive proxies that require field validation and official health outcome data before any formal prediction claims.

---

*Report generated 2026-07-13 for ArboRisk-GL Proof of Concept application.*
