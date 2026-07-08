import React from "react";
import { BrainCircuit, Calculator, ClipboardCheck, Globe2, Target } from "lucide-react";
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
import { Badge, ChartState, DataTable, MetricStrip, SectionCard, Spinner } from "../components/UI";

const COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#0d9488",
};

function titleCase(value) {
  return String(value ?? "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function Modeling() {
  const { data: risk, loading: riskLoading, error: riskError } = useFetch(() => api.districtRisk(30));
  const { data: readiness, loading: readinessLoading, error: readinessError } = useFetch(api.modelingReadiness);
  const { data: validation, loading: validationLoading, error: validationError } = useFetch(api.publicValidation);
  const { data: scoring, loading: scL, error: scError } = useFetch(api.arboviralScoring);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);
  const rows = risk?.items ?? [];
  const evidenceRows = validation?.items ?? [];
  const high = rows.filter((r) => r.risk_level === "high").length;
  const medium = rows.filter((r) => r.risk_level === "medium").length;
  const meanSuitability = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.suitability_index ?? 0), 0) / rows.length
    : 0;

  const chartRows = rows.slice(0, 12).map((row) => ({
    district: titleCase(row.district),
    suitability: Number(row.suitability_index ?? 0),
    rainfall: Number(row.rainfall_index ?? 0),
    temperature: Number(row.temperature_index ?? 0),
    risk: row.risk_level,
  }));
  const tableRows = rows.map((row) => ({
    ...row,
    district: titleCase(row.district),
    reason: row.reason || "Continue routine monitoring",
  }));
  const climateScores = scoring?.climate_suitability_scores ?? [];
  const regionalChartRows = climateScores.map((row) => ({
    location: row.location,
    suitability: Number(row.climate_suitability_index ?? 0),
    level: row.suitability_level,
  }));
  const aedesPrep = scoring?.aedes_preparedness ?? {};
  const rvfWatch = scoring?.rvf_watch ?? {};
  const actionRows = intelligence?.action_queue ?? [];

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Preparedness engine</div>
          <h2>Regional indices and Rwanda district screening</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">Decision support</Badge>
          <Badge variant="amber">Validation next</Badge>
        </div>
      </div>

      <SectionCard title="Preparedness run" icon={BrainCircuit}>
        <MetricStrip
          items={[
            { label: "Aedes index", value: scL ? "..." : Number(aedesPrep.index ?? 0).toFixed(2) },
            { label: "RVF watch", value: scL ? "..." : Number(rvfWatch.index ?? 0).toFixed(2) },
            { label: "Rwanda high districts", value: riskLoading ? "..." : high },
            { label: "Evidence sources", value: iL || validationLoading ? "..." : intelligence?.summary?.data_sources ?? validation?.summary?.sources ?? 0 },
          ]}
        />
      </SectionCard>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Great Lakes climate-vector suitability" icon={Globe2}>
          <div className="card-body">
            <ChartState loading={scL} error={scError} rows={regionalChartRows} empty="No regional suitability rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalChartRows} margin={{ top: 4, right: 8, left: -20, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="suitability" name="Preparedness suitability" radius={[4, 4, 0, 0]}>
                      {regionalChartRows.map((row) => <Cell key={row.location} fill={row.level === "high" ? "#ef4444" : row.level === "moderate" ? "#f59e0b" : "#0d9488"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Rwanda PoC district screening" icon={BrainCircuit}>
          <div className="card-body">
            <ChartState loading={riskLoading} error={riskError} rows={chartRows} empty="No district suitability rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 4, right: 8, left: -20, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="district" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="suitability" name="Suitability index" radius={[4, 4, 0, 0]}>
                      {chartRows.map((row) => <Cell key={row.district} fill={COLORS[row.risk] ?? COLORS.low} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Validation readiness" icon={Calculator}>
          <div className="card-body">
            {readinessLoading ? <Spinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>{readiness?.message}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(readiness?.missing_fields ?? []).map((field) => (
                    <Badge key={field} variant="red">{field.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Regional decision output" icon={Target}>
          <div className="card-body">
            <div className="decision-grid compact">
              <div className="decision-card">
                <span>Aedes-borne</span>
                <strong>{titleCase(aedesPrep.level ?? "context")}</strong>
                <small>{aedesPrep.recommended_action ?? "Prioritize Aedes surveillance and urban source-reduction planning."}</small>
              </div>
              <div className="decision-card">
                <span>RVF One Health</span>
                <strong>{titleCase(rvfWatch.level ?? "monitor")}</strong>
                <small>{rvfWatch.recommended_action ?? "Coordinate One Health partners when rainfall/wetness signals rise."}</small>
              </div>
              <div className="decision-card">
                <span>Confidence</span>
                <strong>Pilot-grade</strong>
                <small>Useful for preparedness prioritization, not official disease prediction.</small>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Evidence inputs" icon={ClipboardCheck}>
          <div className="card-body">
            <ChartState loading={validationLoading} error={validationError} rows={evidenceRows} empty="No validation registry available.">
              <div className="coverage-list" style={{ padding: 0 }}>
                {evidenceRows.slice(0, 6).map((row) => (
                  <div className="readiness-item" key={row.source_id}>
                    <div className={`readiness-dot ${String(row.status).includes("missing") ? "missing" : "ready"}`} />
                    <div className="readiness-item-label">{row.source_name}</div>
                    <Badge variant={String(row.status).includes("blocked") ? "amber" : "green"}>{row.records_or_files}</Badge>
                  </div>
                ))}
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Use boundaries" icon={Target}>
          <div className="card-body">
            <div className="coverage-list" style={{ padding: 0 }}>
              <div className="readiness-item">
                <div className="readiness-dot ready" />
                <div className="readiness-item-label">Can support district climate suitability screening</div>
                <Badge variant="green">usable now</Badge>
              </div>
              <div className="readiness-item">
                <div className="readiness-dot partial" />
                <div className="readiness-item-label">Can support mosquito and resistance signal summaries</div>
                <Badge variant="amber">screening</Badge>
              </div>
              <div className="readiness-item">
                <div className="readiness-dot missing" />
                <div className="readiness-item-label">Cannot yet support confirmed arboviral outbreak or incidence prediction</div>
                <Badge variant="red">blocked</Badge>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Operational model actions" icon={ClipboardCheck}>
        <ChartState loading={iL} error={iError} rows={actionRows} empty="No operational model actions loaded.">
          <DataTable rows={actionRows} columns={["priority", "action", "owner", "evidence", "decision_use"]} />
        </ChartState>
      </SectionCard>

      <SectionCard title="Rwanda district action table" icon={Target}>
        <ChartState loading={riskLoading} error={riskError} rows={tableRows} empty="No modelling table rows available.">
          <DataTable
            rows={tableRows}
            columns={[
              "district",
              "risk_level",
              "suitability_index",
              "rainfall_7d_mm",
              "rainfall_30d_mm",
              "tmean_c",
              "recent_records",
              "uncertainty_level",
              "reason",
            ]}
          />
        </ChartState>
      </SectionCard>
    </div>
  );
}
