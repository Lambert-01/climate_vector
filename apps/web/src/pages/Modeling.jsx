import React from "react";
import { BrainCircuit, Calculator, Sigma } from "lucide-react";
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
  const { data: formulas, loading: formulasLoading, error: formulasError } = useFetch(api.publicFormulationSources);
  const { data: validation, loading: validationLoading, error: validationError } = useFetch(api.publicValidation);
  const rows = risk?.items ?? [];
  const formulaRows = formulas?.items ?? [];
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

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Model engine</div>
          <h2>Suitability intelligence</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">Transparent index</Badge>
          <Badge variant="amber">Validation next</Badge>
        </div>
      </div>

      <SectionCard title="Model run" icon={BrainCircuit}>
        <MetricStrip
          items={[
            { label: "High districts", value: riskLoading ? "..." : high },
            { label: "Medium districts", value: riskLoading ? "..." : medium },
            { label: "Mean index", value: riskLoading ? "..." : meanSuitability.toFixed(2) },
            { label: "Evidence sources", value: validationLoading ? "..." : validation?.summary?.sources ?? 0 },
          ]}
        />
      </SectionCard>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Top districts" icon={BrainCircuit}>
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

        <SectionCard title="Training readiness" icon={Calculator}>
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

        <SectionCard title="Formula engine" icon={Sigma}>
          <div className="card-body">
            <ChartState loading={formulasLoading} error={formulasError} rows={formulaRows} empty="No formulation registry available.">
              <div className="formula-stack compact">
                {formulaRows.map((row) => (
                  <div className="formula-line" key={row.symbol}>
                    <div>
                      <strong>{row.symbol}</strong>
                      <span>{row.module}</span>
                    </div>
                    <code>{row.formula}</code>
                    <Badge variant={row.status?.includes("blocked") ? "amber" : "green"}>{String(row.status).replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Evidence inputs" icon={Calculator}>
          <div className="card-body">
            <ChartState loading={validationLoading} error={validationError} rows={evidenceRows} empty="No validation registry available.">
              <div className="coverage-list" style={{ padding: 0 }}>
                {evidenceRows.slice(0, 6).map((row) => (
                  <div className="readiness-item" key={row.source_id}>
                    <div className={`readiness-dot ${String(row.status).includes("missing") ? "missing" : "ready"}`} />
                    <div className="readiness-item-label">{row.formula_role}</div>
                    <Badge variant={String(row.status).includes("blocked") ? "amber" : "green"}>{row.records_or_files}</Badge>
                  </div>
                ))}
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Model scope" icon={Sigma}>
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
                <div className="readiness-item-label">Cannot yet support validated abundance, resistance, or malaria prediction</div>
                <Badge variant="red">blocked</Badge>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="District table" icon={Sigma}>
        <ChartState loading={riskLoading} error={riskError} rows={tableRows} empty="No modelling table rows available.">
          <DataTable
            rows={tableRows}
            columns={[
              "district",
              "risk_level",
              "suitability_index",
              "vectorial_capacity_proxy",
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
