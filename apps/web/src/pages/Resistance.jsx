import React, { useState } from "react";
import { ClipboardCheck, Database, FlaskConical, Gauge, Globe2, MapPin, TestTube2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, InterpretationPanel, MetricStrip, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const COLORS = ["#f97316", "#ef4444", "#f59e0b", "#fb923c", "#fbbf24", "#fca5a5"];

function cleanRecord(row) {
  return {
    replicate_id: row.replicate_id ?? "—",
    source_row_id: row.source_row_id ?? "—",
    source_file: row.source_dataset ?? "IR_data.xls",
    district: row.district_raw ?? row.district ?? "—",
    site: row.site_raw ?? row.site_id ?? "—",
    insecticide: row.insecticide_tested_raw ?? row.insecticide_tested ?? "—",
    concentration: row.concentration_label_raw ?? row.concentration_label ?? "—",
    dead_24h: row.number_dead_24h ?? "—",
    denominator: row.number_exposed || "missing",
    control_mortality: row.control_mortality || "missing",
    quality_flag: row.quality_flag ?? "needs_review",
  };
}

export default function Resistance() {
  const [activeView, setActiveView] = useState("interpretation");
  const { data: deathSummary, loading: dL, error: dError } = useFetch(api.resistanceDeathSummary);
  const { data: byDistrict, loading: distL, error: distError } = useFetch(api.resistanceByDistrict);
  const { data: records, loading: rL, error: rError } = useFetch(() => api.resistanceRecords(200));
  const { data: validation, loading: vL, error: vError } = useFetch(api.publicValidation);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);
  const { data: governance, loading: gL, error: gError } = useFetch(api.arboviralPartnerGovernance);

  const deathData = (deathSummary?.items ?? []).map((r) => ({
    insecticide: String(r.insecticide_tested_raw ?? "").slice(0, 22),
    mean: parseFloat(r.mean ?? 0),
    max: parseFloat(r.max ?? 0),
    records: parseInt(r.records ?? 0),
  }));
  const tableRows = (records?.items ?? []).map(cleanRecord);
  const provenance = deathSummary?.provenance ?? {
    raw_file: "data/raw/IR_data.xls",
    processed_table: "data/processed/resistance_test_replicates_preliminary.csv",
    calculation: "Grouped by insecticide tested; mean/min/max computed from 24h dead count.",
    interpretation_limit: "Descriptive only until lab metadata are confirmed.",
  };
  const districtRows = byDistrict?.items ?? [];
  const evidenceRows = (validation?.items ?? []).filter((row) =>
    ["pi_ir_data", "who_hdx_context", "pi_mosquito_behavior"].includes(row.source_id)
  );
  const topInsecticide = deathData[0]?.insecticide ?? "—";
  const meanDeaths = deathData.length
    ? deathData.reduce((sum, row) => sum + row.mean, 0) / deathData.length
    : 0;
  const actionRows = (intelligence?.action_queue ?? []).filter((row) =>
    String(row.action).toLowerCase().includes("susceptibility") ||
    String(row.action).toLowerCase().includes("aedes") ||
    String(row.action).toLowerCase().includes("culex")
  );
  const governanceRows = (governance?.items ?? []).filter((row) =>
    String(row.dataset).toLowerCase().includes("surveillance") ||
    String(row.dataset).toLowerCase().includes("intervention") ||
    String(row.dataset).toLowerCase().includes("sentinel")
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Legacy vector-control evidence</h2>
          <div className="page-subtitle">PI susceptibility baseline retained for provenance; not primary dengue/Aedes evidence</div>
          <div className="page-header-badges">
            <Badge variant="gray">Secondary proposal context</Badge>
            <Badge variant="amber">Lab validation pending</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename="dengueew_gl_intervention_readiness"
            csvRows={tableRows.map((r) => ({
              replicate_id: r.replicate_id,
              district: r.district,
              site: r.site,
              insecticide: r.insecticide,
              concentration: r.concentration,
              dead_24h: r.dead_24h,
              denominator: r.denominator,
              control_mortality: r.control_mortality,
              quality_flag: r.quality_flag,
            }))}
            jsonData={{ records: tableRows, death_summary: deathData, provenance }}
          />
        </div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Legacy control evidence views">
        {[["interpretation", "Interpretation"], ["governance", "Action & governance"], ["records", "PI records"]].map(([id, label]) => (
          <button key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}>{label}</button>
        ))}
      </div>

      {activeView === "interpretation" && <>
      <SectionCard title="Control evidence coverage" icon={FlaskConical}>
        <MetricStrip
          items={[
            { label: "Rows", value: rL ? "..." : (records?.total ?? tableRows.length).toLocaleString() },
            { label: "Insecticide groups", value: dL ? "..." : deathData.length },
            { label: "Districts", value: distL ? "..." : districtRows.length },
            { label: "Action items", value: iL ? "..." : actionRows.length },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="Vector-control interpretation"
        verdict="The IR dataset documents prior vector-control work, but it cannot be interpreted as Aedes susceptibility evidence for the dengue pilot."
        tone="amber"
        confidence="Preliminary laboratory context only; do not convert to official resistance status without PI/lab confirmation."
        items={[
          {
            label: "Evidence now",
            value: `${records?.total ?? tableRows.length} assay rows from IR_data.xls`,
            note: "These are PI-provided replicate rows, not internet/public data.",
          },
          {
            label: "Main gap",
            value: "Protocol, denominator, control mortality",
            note: "These determine whether assay interpretation is scientifically defensible.",
          },
          {
            label: "Policy use",
            value: "Legacy field-infrastructure context",
            note: "Keep outside the primary dengue evidence pathway unless Aedes species and protocol are confirmed.",
          },
        ]}
      />

      <div className="insight-grid">
        <div className="insight-card"><TestTube2 size={17} /><span>Largest test group</span><strong>{topInsecticide}</strong></div>
        <div className="insight-card"><Gauge size={17} /><span>Best current use</span><strong>Screening signal</strong></div>
        <div className="insight-card"><MapPin size={17} /><span>Top district</span><strong>{districtRows[0]?.value ?? "—"}</strong></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="24h deaths by insecticide" icon={FlaskConical}>
          <div className="card-body">
            <ChartState loading={dL} error={dError} rows={deathData} empty="No death summary rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deathData} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis
                      dataKey="insecticide"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }}
                    />
                    <Bar dataKey="mean" name="Mean deaths" radius={[4, 4, 0, 0]}>
                      {deathData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="District distribution" icon={MapPin}>
          <div className="card-body">
            <ChartState loading={distL} error={distError} rows={districtRows} empty="No district resistance rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={districtRows.slice(0, 12)}
                    margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="value" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="count" name="Records" radius={[4, 4, 0, 0]} fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>
      </div>
      </>}

      {activeView === "governance" && <>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Intervention action queue" icon={ClipboardCheck}>
          <ChartState loading={iL} error={iError} rows={actionRows} empty="No vector-control action rows loaded.">
            <DataTable
              rows={actionRows}
              maxRows={6}
              columns={["priority", "action", "owner", "evidence", "decision_use"]}
            />
          </ChartState>
        </SectionCard>

        <SectionCard title="Regional control governance" icon={Globe2}>
          <ChartState loading={gL} error={gError} rows={governanceRows} empty="No governance rows loaded.">
            <DataTable
              rows={governanceRows}
              maxRows={6}
              columns={["dataset", "partner", "governance_status", "required_for", "next_step"]}
            />
          </ChartState>
        </SectionCard>
      </div>
      </>}

      {activeView === "records" && <>
      <SectionCard title="Insecticide summary from PI IR dataset" icon={FlaskConical}>
        <ChartState loading={dL} error={dError} rows={deathSummary?.items ?? []} empty="No death summary table rows loaded.">
          <div className="source-note">
            <strong>Data source</strong>
            <span>{provenance.raw_file} → {provenance.processed_table}</span>
            <small>{provenance.calculation}</small>
            <small>{provenance.interpretation_limit}</small>
          </div>
          <DataTable
            rows={deathSummary?.items ?? []}
            columns={["insecticide_tested_raw", "records", "mean", "min", "max"]}
          />
        </ChartState>
      </SectionCard>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="PI susceptibility record explorer" icon={FlaskConical}>
          <ChartState loading={rL} error={rError} rows={tableRows} empty="No resistance records loaded.">
            <DataTable
              rows={tableRows}
              columns={["replicate_id", "source_row_id", "source_file", "district", "site", "insecticide", "concentration", "dead_24h"]}
            />
          </ChartState>
        </SectionCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Control-context evidence inputs" icon={Database}>
          <ChartState loading={vL} error={vError} rows={evidenceRows} empty="No resistance evidence registry loaded.">
            <DataTable
              rows={evidenceRows}
              maxRows={6}
              columns={["source_name", "status", "records_or_files", "model_use", "frontend_use", "limitation"]}
            />
          </ChartState>
        </SectionCard>
      </div>
      </>}
    </div>
  );
}
