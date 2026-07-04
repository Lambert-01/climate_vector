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
import { AlertBanner, Badge, ChartState, DataTable, SectionCard, Spinner, StatCard } from "../components/UI";

const COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#0d9488",
};

export default function Modeling() {
  const { data: risk, loading: riskLoading, error: riskError } = useFetch(() => api.districtRisk(30));
  const { data: readiness, loading: readinessLoading, error: readinessError } = useFetch(api.modelingReadiness);
  const rows = risk?.items ?? [];
  const high = rows.filter((r) => r.risk_level === "high").length;
  const medium = rows.filter((r) => r.risk_level === "medium").length;
  const meanSuitability = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.suitability_index ?? 0), 0) / rows.length
    : 0;

  const chartRows = rows.slice(0, 12).map((row) => ({
    district: row.district,
    suitability: Number(row.suitability_index ?? 0),
    rainfall: Number(row.rainfall_index ?? 0),
    temperature: Number(row.temperature_index ?? 0),
    risk: row.risk_level,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Mathematical Modelling</h2>
        <p>Applied-mathematical suitability proxies from climate, ecology, and resistance data</p>
      </div>

      <AlertBanner
        type="warning"
        title="Model governance"
        message="These are transparent suitability and vectorial-capacity proxy signals. They are not validated disease predictions or official alerts."
      />
      {(riskError || readinessError) && (
        <AlertBanner
          type="error"
          title="Model data endpoint failed"
          message={riskError || readinessError}
        />
      )}

      <div className="stats-grid">
        <StatCard icon={BrainCircuit} label="High suitability districts" value={riskLoading ? "..." : high} sub="Proxy signal" color="orange" />
        <StatCard icon={Calculator} label="Medium suitability districts" value={riskLoading ? "..." : medium} sub="Proxy signal" color="amber" />
        <StatCard icon={Sigma} label="Mean suitability index" value={riskLoading ? "..." : meanSuitability.toFixed(2)} sub="0 to 1 scale" color="teal" />
        <StatCard
          icon={BrainCircuit}
          label="Training status"
          value={readinessLoading ? "..." : readiness?.ready ? "Ready" : "Blocked"}
          sub={readiness?.ready ? "Minimum fields present" : "Critical fields missing"}
          color={readiness?.ready ? "green" : "red"}
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Top District Suitability" icon={BrainCircuit}>
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

        <SectionCard title="Training Readiness" icon={Calculator}>
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
      </div>

      <SectionCard title="District Modelling Table" icon={Sigma}>
        <ChartState loading={riskLoading} error={riskError} rows={rows} empty="No modelling table rows available.">
          <DataTable
            rows={rows}
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
