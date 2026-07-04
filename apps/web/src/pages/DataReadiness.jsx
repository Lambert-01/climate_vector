import React from "react";
import { CheckCircle, ClipboardCheck, Database, XCircle } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, MetricStrip, ReadinessList, SectionCard, Spinner } from "../components/UI";

const MISSING_ITEMS = [
  { item: "Full sample dates (month + year per row)", priority: "high" },
  { item: "GPS coordinates for all sentinel sites", priority: "high" },
  { item: "Mosquito counts and sampling effort", priority: "high" },
  { item: "Resistance test denominator (likely 25 — needs PI confirmation)", priority: "high" },
  { item: "Test protocol (WHO susceptibility / CDC bottle / PBO assay)", priority: "high" },
  { item: "Control mortality records", priority: "high" },
  { item: "Clean species identification (morphological vs molecular)", priority: "medium" },
  { item: "Positive and negative habitat observations", priority: "medium" },
  { item: "Malaria case or intervention outcome data (requires formal approval)", priority: "medium" },
  { item: "Resistance status classification (after above confirmed)", priority: "medium" },
];

const PRIORITY_BADGE = { high: "red", medium: "amber", low: "green" };

export default function DataReadiness() {
  const { data, loading } = useFetch(api.readiness);
  const { data: missingSources, loading: mL, error: mError } = useFetch(api.missingDataSources);

  const items = data?.items ?? [];
  const ready = items.filter((i) => String(i.ready).toLowerCase() === "true").length;
  const sourceRows = missingSources?.items ?? [];

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Data operations</div>
          <h2>Readiness control</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">{ready} ready</Badge>
          <Badge variant="amber">{items.length - ready} pilot fields</Badge>
        </div>
      </div>

      <SectionCard title="Readiness snapshot" icon={ClipboardCheck}>
        <MetricStrip
          items={[
            { label: "Ready", value: ready },
            { label: "Pilot fields", value: items.length - ready },
            { label: "High priority", value: MISSING_ITEMS.filter((i) => i.priority === "high").length },
            { label: "Mode", value: "PoC" },
          ]}
        />
      </SectionCard>

      <div className="grid-2">
        <SectionCard title="Checklist" icon={Database}>
          {loading ? <Spinner /> : <ReadinessList items={items} />}
        </SectionCard>

        <SectionCard title="Pilot queue" icon={XCircle}>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {MISSING_ITEMS.map((item, i) => (
              <div key={i} className="readiness-item">
                <div className="readiness-dot missing" />
                <div className="readiness-item-label" style={{ flex: 1 }}>{item.item}</div>
                <Badge variant={PRIORITY_BADGE[item.priority]}>{item.priority}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Source plan" icon={Database}>
          <ChartState loading={mL} error={mError} rows={sourceRows} empty="Source plan is not loaded.">
            <DataTable
              rows={sourceRows}
              maxRows={20}
              columns={[
                "priority",
                "missing_item",
                "responsible_partner",
                "where_to_get",
                "public_substitute",
                "proposal_strategy",
                "acceptable_file",
                "dashboard_use",
                "can_model_without_it",
              ]}
            />
          </ChartState>
        </SectionCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Quality flags" icon={Database}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Flag</th><th>Meaning</th><th>Action Required</th></tr>
              </thead>
              <tbody>
                {[
                  ["valid", "All required fields present and validated", "None — ready for analysis"],
                  ["missing_date", "Date field absent or incomplete", "Recover from PI/field records"],
                  ["missing_gps", "No GPS coordinate for site", "Confirm with PI or field officer"],
                  ["missing_outcome", "No mosquito count or habitat status", "Collect prospectively"],
                  ["missing_effort", "No sampling effort recorded", "Collect prospectively"],
                  ["duplicate_possible", "Possible duplicate row detected", "Data manager review"],
                  ["needs_review", "Flagged for manual review", "Data manager + PI review"],
                  ["needs_denominator_protocol_control_date_gps_confirmation", "Resistance row — multiple fields unconfirmed", "PI/lab confirmation required"],
                ].map(([flag, meaning, action]) => (
                  <tr key={flag}>
                    <td><code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{flag}</code></td>
                    <td>{meaning}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
