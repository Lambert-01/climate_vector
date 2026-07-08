import React from "react";
import { CheckCircle, ClipboardCheck, Database, Globe2, MapPin, Users, XCircle } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, MetricStrip, ReadinessList, SectionCard, Spinner } from "../components/UI";

const MISSING_ITEMS = [
  { item: "Full sample dates (month + year per row)", priority: "high" },
  { item: "GPS coordinates for all sentinel sites", priority: "high" },
  { item: "Mosquito counts and sampling effort", priority: "high" },
  { item: "Susceptibility test denominator (likely 25 — needs PI confirmation)", priority: "high" },
  { item: "Test protocol (WHO susceptibility / CDC bottle / PBO assay)", priority: "high" },
  { item: "Control mortality records", priority: "high" },
  { item: "Clean species identification (morphological vs molecular)", priority: "medium" },
  { item: "Positive and negative habitat observations", priority: "medium" },
  { item: "Arboviral case, febrile illness, or intervention outcome data (requires RBC/MoH approval)", priority: "medium" },
  { item: "Susceptibility status classification (after above confirmed)", priority: "medium" },
];

const PRIORITY_BADGE = { high: "red", medium: "amber", low: "green" };

export default function DataReadiness() {
  const { data, loading } = useFetch(api.readiness);
  const { data: missingSources, loading: mL, error: mError } = useFetch(api.missingDataSources);
  const { data: validation, loading: vL, error: vError } = useFetch(api.publicValidation);
  const { data: governance, loading: gL, error: gError } = useFetch(api.arboviralPartnerGovernance);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);

  const items = data?.items ?? [];
  const ready = items.filter((i) => String(i.ready).toLowerCase() === "true").length;
  const sourceRows = missingSources?.items ?? [];
  const validationRows = validation?.items ?? [];
  const governanceRows = governance?.items ?? [];
  const readySources = validationRows.filter((row) =>
    ["usable", "validated", "downloaded"].some((key) => String(row.status ?? "").includes(key))
  ).length;
  const summary = intelligence?.summary ?? {};
  const validationCards = intelligence?.data_validation_cards ?? [];
  const actionRows = intelligence?.action_queue ?? [];

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Evidence control center</div>
          <h2>All-source validation and partner readiness</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">{ready} ready</Badge>
          <Badge variant="amber">{items.length - ready} pilot fields</Badge>
        </div>
      </div>

      <SectionCard title="Integrated evidence snapshot" icon={ClipboardCheck}>
        <MetricStrip
          items={[
            { label: "Data sources", value: iL ? "..." : summary.data_sources ?? validation?.summary?.sources ?? 0 },
            { label: "Ready/usable", value: iL ? "..." : summary.ready_or_usable_sources ?? readySources },
            { label: "Mapped sentinels", value: iL ? "..." : `${summary.mapped_sentinel_sites ?? 0}/${summary.sentinel_sites ?? 0}` },
            { label: "Formal gaps", value: iL ? "..." : summary.formal_or_required_sources ?? items.length - ready },
          ]}
        />
      </SectionCard>

      <div className="grid-2">
        <SectionCard title="Validated dataset bundle" icon={Globe2}>
          <ChartState loading={iL} error={iError} rows={validationCards} empty="No intelligence validation cards loaded.">
            <DataTable rows={validationCards} columns={["domain", "status", "records", "result", "limitation"]} />
          </ChartState>
        </SectionCard>

        <SectionCard title="Operational data actions" icon={MapPin}>
          <ChartState loading={iL} error={iError} rows={actionRows} empty="No operational action rows loaded.">
            <DataTable rows={actionRows} columns={["priority", "action", "owner", "evidence", "decision_use"]} />
          </ChartState>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <SectionCard title="Checklist" icon={Database}>
          {loading ? <Spinner /> : <ReadinessList items={items} />}
        </SectionCard>

        <SectionCard title="Pilot queue for validation phase" icon={XCircle}>
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
        <SectionCard title="All validated evidence sources" icon={CheckCircle}>
          <ChartState loading={vL} error={vError} rows={validationRows} empty="Validation registry is not loaded.">
            <DataTable
              rows={validationRows}
              maxRows={12}
              columns={[
                "source_name",
                "category",
                "status",
                "records_or_files",
                "date_start",
                "date_end",
                "frontend_use",
                "limitation",
              ]}
            />
          </ChartState>
        </SectionCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Decision readiness" icon={ClipboardCheck}>
          <div className="decision-grid">
            <div className="decision-card">
              <span>Ready</span>
              <strong>Evidence integration dashboard</strong>
              <small>PI data, climate layers, GBIF context, and resistance summaries are connected.</small>
            </div>
            <div className="decision-card">
              <span>Ready</span>
              <strong>District prioritization</strong>
              <small>Useful for planning field verification and partner discussion.</small>
            </div>
            <div className="decision-card">
              <span>Pilot</span>
              <strong>Operational validation</strong>
              <small>GPS, dates, sampling effort, denominator, and protocol remain collection priorities.</small>
            </div>
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
        <SectionCard title="Partner data governance" icon={Users}>
          <ChartState loading={gL} error={gError} rows={governanceRows} empty="Partner governance not loaded.">
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {governanceRows.map((row) => (
                <div
                  key={row.dataset}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px, 1.3fr) minmax(120px, .7fr) minmax(0, 1fr) minmax(0, 1.2fr)",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <strong style={{ display: "block", fontSize: 13, marginBottom: 2 }}>{row.dataset}</strong>
                    <span style={{ color: "var(--text-muted)" }}>{row.partner}</span>
                  </div>
                  <Badge
                    variant={
                      row.governance_status === "integrated" || row.governance_status === "validated"
                        ? "green"
                        : row.governance_status === "partial" || row.governance_status === "pilot_required"
                        ? "amber"
                        : "red"
                    }
                  >
                    {String(row.governance_status).replace(/_/g, " ")}
                  </Badge>
                  <span style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>{row.required_for}</span>
                  <span style={{ color: "var(--teal-700)", fontWeight: 500 }}>{row.next_step}</span>
                </div>
              ))}
            </div>
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
                  ["needs_denominator_protocol_control_date_gps_confirmation", "Susceptibility row — multiple fields unconfirmed", "PI/lab confirmation required"],
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
