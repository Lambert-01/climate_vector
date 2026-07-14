# ArboRisk-GL Frontend Product Improvement Checklist

Status: 2026-07-14

Use this as the quick execution checklist for the next design/frontend pass.

## Priority 1: Decision Room

- Redesign as flagship policy-maker page.
- Replace wide table with priority action cards.
- Add Create Alert button per district.
- Add Request Field Verification button per district.
- Add View Evidence action per district.
- Add action pipeline: signal -> review -> alert -> verification -> close.
- Add export controls: CSV, JSON, Print, Copy brief.
- Reduce visible paragraphs.

## Priority 2: Export System

- Build reusable `ExportToolbar`.
- Add CSV export utility.
- Add JSON export utility.
- Add print current page/section.
- Add copy brief text.
- Add to: Decision Room, Data Control, Vector Evidence, Alerts, Field Verification, Modeling, Climate, Sites, Resistance.

## Priority 3: Data Control

- Redesign as evidence control center.
- Add top metrics: total sources, usable, passed, warnings, missing, formal access required.
- Add tabs by source category.
- Add validation issue queue.
- Add filters by status/source type/domain.
- Add source detail drawer.
- Reduce long text.
- Improve alignment and spacing.

## Priority 4: Vector Evidence

- Add more visual analytics:
  - donut chart for vector groups;
  - horizontal species record chart;
  - breeding-source treemap/grid;
  - district ranking chart;
  - evidence quality matrix;
  - vector group cards for Aedes, Culex, Anopheles.
- Add filters/search to PI ecology explorer.
- Hide long provenance note behind Source Details.
- Add CSV export.
- Add compact “what action follows” section.

## Priority 5: Alerts / Response Board

- Add Kanban view by status.
- Keep table view as alternative.
- Add filters by district/status/risk.
- Link alerts to field-verification requests.
- Add export alert queue.
- Keep label as preparedness/review alerts, not official outbreak alerts.

## Priority 6: Field Verification

- Add request status cards.
- Add print field checklist.
- Add export verification plan.
- Add checklist progress UI.
- Link each request to source alert/district.
- Keep pilot placeholders honest.

## Priority 7: Global UI Polish

- Standardize page headers.
- Reduce paragraphs.
- Use compact badges/chips.
- Improve tables with sticky headers and density.
- Improve mobile responsiveness.
- Move long explanations into expandable details.
- Reduce inline styles over time.
- Keep one coherent visual system.

## Verification

Run:

```bash
.venv/bin/pytest -q
cd apps/web
npm run build
```

