# Product And Design Enhancement Prompt For ArboRisk-GL

Use this prompt with another advanced AI coding agent, frontend engineer, product designer, or full-stack assistant.

---

You are acting as a senior product designer, frontend architect, data-visualization engineer, climate-health digital innovation advisor, and full-stack developer. You are working inside an existing project called **ArboRisk-GL**, a climate-informed arboviral preparedness and vector intelligence platform for Rwanda and the African Great Lakes region.

The project is being prepared for the **Nexa / Grand Challenges Rwanda Climate and Health Innovation Proof of Concept funding opportunity**. The intended audience includes reviewers, policy-makers, public-health leaders, surveillance teams, entomology teams, and implementing partners. The platform must look and behave like a professional operational intelligence system, not like a research notebook or academic report.

The current system has good backend functionality and core data integration, but the frontend still feels too text-heavy, uneven, and not fully productized. Your task is to redesign and enhance the experience so that it becomes a clean, modern, policy-facing climate-health preparedness platform.

## Current Technical Context

Stack:

- FastAPI backend in `apps/api/`
- React/Vite frontend in `apps/web/`
- Python data engineering and processed CSV/JSON data
- Source registry and validation endpoints
- Decision Room page
- Alerts/Response Board page
- Field Verification page
- Vector Evidence page
- Data Control page
- Climate, Live Weather, Sites, Resistance, Modeling pages

Important frontend files:

```text
apps/web/src/App.jsx
apps/web/src/api.js
apps/web/src/components/UI.jsx
apps/web/src/components/Sidebar.jsx
apps/web/src/pages/Overview.jsx
apps/web/src/pages/DecisionRoom.jsx
apps/web/src/pages/Alerts.jsx
apps/web/src/pages/FieldVerification.jsx
apps/web/src/pages/DataReadiness.jsx
apps/web/src/pages/Mosquito.jsx
apps/web/src/pages/Modeling.jsx
apps/web/src/pages/Climate.jsx
apps/web/src/pages/LiveWeather.jsx
apps/web/src/pages/Sites.jsx
apps/web/src/pages/Resistance.jsx
apps/web/src/styles.css
```

Important backend endpoints already available:

```text
/api/arboviral/intelligence
/api/arboviral/scoring
/api/arboviral/vector-taxonomy
/api/modeling/district-risk
/api/modeling/district/{district}
/api/alerts
/api/field-verifications
/api/source-registry
/api/validation-engine
/api/live-weather/districts
/api/sites/sentinel-registry
/api/mosquito/records
/api/resistance/death-summary
/api/public-data/validation
```

Scientific boundary:

The system is a **Proof of Concept preparedness intelligence system**, not a validated outbreak prediction platform. UI language must remain confident but honest. Use terms like preparedness, priority, signal, confidence, evidence, verification, action, and readiness. Avoid unsupported language like confirmed outbreak, official alert, certified prediction, or validated disease forecast.

## Main Product Problem

The current platform is technically improving but still has several product issues:

1. **Decision Room is not professional enough.**
   It should be the flagship policy-maker page, but it currently feels like a standard table/report. It should visually drive action and connect directly to the alert and field-verification workflow.

2. **Decision Room is not strongly linked to alerts.**
   A high-priority district should allow the user to create a preparedness alert or field-verification request directly from the Decision Room.

3. **Exports are missing.**
   The user expects exports on all important pages: CSV, JSON, print, and policy brief/PDF-friendly output. At minimum, implement CSV export and print/export layouts.

4. **Data Control page is not visually aligned.**
   It contains useful information but feels crowded, text-heavy, and uneven. It needs a better control-center layout with status summaries, validation cards, issue queues, and source drill-down.

5. **Vector Evidence page is too table-heavy.**
   The user wants more chart types, more visual features, and richer interpretation. Current sections like Great Lakes vector occurrence context, arboviral vector groups, and PI ecology explorer are mostly tables and long text.

6. **Too much wording across the whole system.**
   Pages should use compact decision labels, cards, visual summaries, tooltips, badges, charts, and progressive disclosure. Long paragraphs should be reduced or moved into expandable “details” panels.

7. **The platform needs a more operational feel.**
   The workflow should be: signal detected -> evidence reviewed -> alert created -> field verification requested -> action tracked -> pilot evidence generated.

## Design Principles

Apply these principles everywhere:

- Minimal visible text.
- High information density without clutter.
- Strong visual hierarchy.
- Cards for actionable objects only, not every section.
- Status badges and confidence indicators.
- Icons for actions.
- Charts and maps before long tables.
- Tables should be compact, sortable/filterable where possible.
- Every page should have clear actions.
- Every page should support export or print.
- Empty states should be useful, not plain.
- Use progressive disclosure: show summaries first, details on expand.
- Avoid academic explanation blocks.
- Avoid formula displays on policy-facing pages.
- Keep scientific limitations visible but compact.
- Preserve the Proof of Concept boundary.

## Global Features To Add

### 1. Export System

Build reusable export utilities and UI controls.

Create a component such as:

```text
ExportToolbar
```

It should support:

- Export visible table rows to CSV.
- Export page summary to JSON.
- Print current page or section.
- Copy summary text to clipboard.
- Optional: generate a simple HTML/PDF-ready policy brief using browser print.

Use on these pages:

- Decision Room
- Data Control
- Vector Evidence
- Climate Context
- Modeling/Priority Engine
- Response Board
- Field Verification
- Sites
- Resistance

Do not overbuild server-side PDF generation unless easy. Browser print-friendly sections are acceptable for now.

Expected UX:

- Small icon buttons in page header or card header.
- Labels: CSV, JSON, Print, Copy.
- No huge export panels.
- Exported filenames should be meaningful, e.g. `arborisk_decision_room_2026-07-14.csv`.

### 2. Page Header Redesign

Standardize page headers.

Each page should have:

- short title;
- compact subtitle;
- 2-4 key status badges;
- export controls;
- no long paragraphs unless in collapsible details.

Create or improve:

```text
PageHeader
PageActions
StatusBadgeGroup
```

### 3. Compact Interpretation Pattern

Replace long `InterpretationPanel` text where it dominates the screen.

Create:

```text
DecisionInsight
SignalSummary
EvidencePill
ConfidenceBadge
LimitationChip
```

Use short patterns:

```text
Signal: Wet/warm window
Confidence: Medium
Action: Verify site
Limit: No case data
```

Long detail can go into:

```text
DetailsDrawer
ExpandableEvidence
```

## Decision Room Redesign

This should be the best page in the system.

### Purpose

Turn model and evidence signals into operational decisions.

### Required Layout

Top band:

- Current readiness status.
- Number of high-priority districts.
- Number of active/pending alerts.
- Number of field-verification requests.
- Data confidence score.

Main left panel:

- “Priority Queue” showing top districts as action cards, not a plain wide table.
- Each card should show:
  - district
  - priority level
  - climate signal
  - vector evidence
  - confidence
  - limitation
  - recommended action
  - owner
  - buttons:
    - Create Alert
    - Request Verification
    - View Evidence

Main right panel:

- “Action Pipeline” or workflow stepper:
  - Signal detected
  - Evidence reviewed
  - Alert created
  - Field verification requested
  - Action closed

Lower area:

- Trend/priority chart.
- Data confidence breakdown.
- Exportable decision brief.

### Link To Alerts

From each priority district card:

- clicking “Create Alert” should call `/api/alerts` with:
  - district
  - risk_level
  - risk_reason
  - recommended_action
  - uncertainty_level
  - rule_or_model_version

After creation:

- show success toast/banner;
- increment active/pending review count;
- optionally navigate to `/alerts`;
- generated alert should appear on Response Board.

### Link To Field Verification

From each priority card:

- clicking “Request Verification” should call `/api/field-verifications` with:
  - district
  - reason_for_visit
  - climate_trigger
  - suspected_vector_group
  - suspected_breeding_source
  - notes

After creation:

- show success;
- optionally navigate to `/field-verification`;
- generated request should appear there.

### Visual Style

Use stronger layout:

- priority cards with left color accent;
- status chips;
- compact icons;
- no giant paragraphs;
- clean empty/loading states;
- responsive mobile layout.

## Data Control Redesign

The current page has useful content but poor alignment and too much information at once.

### Required Layout

Top dashboard:

- Total sources.
- Usable sources.
- Validation passed.
- Warnings.
- Missing.
- Formal-access required.

Middle:

- Source categories as tabs:
  - PI data
  - Climate
  - Vector
  - Spatial
  - Required/Pilot

Validation section:

- Show validation checks as compact cards grouped by status:
  - Passed
  - Warnings
  - Missing
  - Errors

Issue Queue:

- Extract validation issues into an actionable table:
  - severity
  - source/check
  - issue
  - recommendation
  - owner
  - status

Source Registry:

- Use a cleaner table with sticky header and compact columns.
- Add filters by source type/status/domain.
- Add a source detail drawer/modal.

Pilot roadmap:

- Convert the long list into grouped cards:
  - Partner data required
  - Field surveillance required
  - Lab protocol confirmation
  - Environmental enrichment

### Reduce Text

Move long explanations into tooltips or details.
Use short labels:

- Supports
- Cannot prove
- Needed next
- Owner
- Status

## Vector Evidence Page Redesign

This page must become much more visual.

Current problem:

- Great Lakes vector occurrence context is a table.
- Arboviral vector groups is a table.
- PI ecology explorer is a table.
- There are not enough graphs, maps, group summaries, or operational insights.

### Required Additions

Add visual cards:

- Aedes records
- Culex records
- Anopheles context records
- PI ecology rows
- Districts represented
- Breeding source categories
- Species label count

Add chart types:

- Donut chart: vector group composition.
- Stacked bar: species by vector group.
- Horizontal bar: records by species.
- Treemap or grid: breeding-source categories.
- District ranking bar chart.
- Small multiples: Aedes/Culex/Anopheles evidence tiles.
- Timeline chart: occurrence year start/end or records by year if data supports it.
- Evidence quality matrix: regional presence-only vs local PI vs pilot required.

Add map feature if feasible:

- Great Lakes vector occurrence map.
- Sentinel site overlay.
- District evidence intensity.
- If full map is too much, add compact “regional evidence map” placeholder using existing coordinates and clear source labels.

Add operational interpretation:

- “What this means for action”
- “What needs field validation”
- “Which vector group matters now”

But keep it compact:

```text
Aedes: High surveillance priority | pilot ovitraps needed
Culex: Moderate One Health watch | adult traps needed
Anopheles: Context only | malaria infrastructure
```

### PI Ecology Explorer

Improve the explorer:

- Add filters:
  - district
  - species
  - breeding source
  - quality flag
- Add search.
- Add row count.
- Add CSV export.
- Keep source provenance visible but compact.
- Hide long source note behind “Source details”.

## Alerts / Response Board Improvement

The Response Board should feel like an operational queue.

Add:

- Kanban columns by status:
  - Pending Review
  - Active
  - Field Verification
  - Verified
  - Resolved/Closed
- Toggle between Kanban and table.
- Filters by district, risk level, status.
- Create alert modal.
- Link alert to field verification request.
- Show audit-style status history if possible.
- Export alert queue.

Keep official boundary:

- Label as “preparedness alerts” or “review signals,” not official outbreak alerts.

## Field Verification Improvement

This page should show that climate signals become ground action.

Add:

- Requests by status cards.
- Verification request table with filters.
- Create request modal.
- Checklist progress indicator.
- Link back to source alert/district.
- Export verification plan.
- Print field checklist.
- Clear status: “pilot data pending” vs “collected”.

If no real field results exist, do not fake them. Show the request workflow and pilot-ready templates.

## Cross-Page Export And Print

Every major page should have export controls:

- Overview: export executive snapshot.
- Decision Room: export action brief.
- Data Control: export source registry and validation issues.
- Vector Evidence: export vector evidence table/charts data.
- Climate: export climate summary.
- Modeling: export district risk table.
- Alerts: export alert queue.
- Field Verification: export verification plan/checklist.
- Sites: export sentinel registry.
- Resistance: export susceptibility context.

Implementation can start with:

```text
downloadCsv(filename, rows)
downloadJson(filename, data)
printSection()
copyText(text)
```

## Visual Polish Requirements

Improve CSS:

- Stronger spacing system.
- Consistent card padding.
- Better grid breakpoints.
- Better table density.
- Sticky headers for large tables.
- Smaller subtitles.
- Remove excessive paragraphs.
- More visual chips.
- Better mobile behavior.
- Better contrast for badges.
- Less inline styling where possible.

Avoid:

- Huge text blocks.
- Academic paragraph-heavy panels.
- Nested cards inside cards.
- Large table walls without filters.
- Overuse of teal only.

## Backend Enhancements If Needed

If frontend needs cleaner data, add endpoints:

```text
/api/decision-room
/api/vector-evidence/summary
/api/vector-evidence/groups
/api/vector-evidence/districts
/api/data-control/issues
/api/exports/...
```

However, do not overbuild. It is acceptable to assemble view models in frontend from existing endpoints if clean.

## Required Final Deliverables

At the end, provide:

1. Summary of design/product changes.
2. Exact files changed.
3. Pages improved.
4. Export features added.
5. How Decision Room links to Alerts and Field Verification.
6. Remaining limitations.
7. Tests/build results.

Run:

```bash
.venv/bin/pytest -q
cd apps/web
npm run build
```

## Success Criteria

The work is successful when:

- Decision Room feels like a flagship policy-maker page.
- Decision Room can create alerts and field-verification requests.
- Data Control is visually aligned and easy to scan.
- Vector Evidence has multiple charts and fewer table walls.
- Exports exist on important pages.
- Long text is reduced or moved into details.
- All pages feel like one coherent product.
- The system remains scientifically honest.
- Tests pass.
- Frontend build passes.

