import React from "react";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  MapPinned,
  Radar,
  ShieldCheck,
  Target,
  TimerReset,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Radar as RadarShape,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, MetricStrip, ProgressBar, SectionCard, Spinner } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const RISK_COLOR = { high: "#dc2626", medium: "#d97706", low: "#0d9488" };
const RISK_BADGE = { high: "red", medium: "amber", low: "green" };

function titleCase(value) {
  return String(value ?? "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function pct(value) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

function number(value, digits = 2) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "0.00";
}

function statusBadge(status = "") {
  const text = String(status).toLowerCase();
  if (text.includes("implemented")) return "green";
  if (text.includes("waiting") || text.includes("pending")) return "amber";
  if (text.includes("blocked")) return "red";
  return "blue";
}

function EmptyMini({ icon: Icon = AlertTriangle, title, text }) {
  return (
    <div className="empty" style={{ minHeight: 180 }}>
      <div className="empty-icon"><Icon size={22} /></div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{text}</div>
    </div>
  );
}

function SignalCard({ title, value, sub, color = "teal", icon: Icon }) {
  return (
    <div className="kpi-tile">
      <div className={`kpi-tile-accent ${color}`} />
      {Icon && <Icon className="kpi-tile-icon" size={54} />}
      <div className="kpi-tile-value">{value}</div>
      <div className="kpi-tile-label">{title}</div>
      {sub && <div className="kpi-tile-sub">{sub}</div>}
    </div>
  );
}

export default function Modeling() {
  const { data: risk, loading: riskLoading, error: riskError } = useFetch(() => api.districtRisk(30));
  const { data: readiness, loading: readinessLoading } = useFetch(api.modelingReadiness);
  const { data: scoring, loading: scoringLoading } = useFetch(api.arboviralScoring);
  const { data: framework, loading: frameworkLoading } = useFetch(api.dengueMathematicalFramework);

  const rows = risk?.items ?? [];
  const high = rows.filter((row) => row.risk_level === "high").length;
  const medium = rows.filter((row) => row.risk_level === "medium").length;
  const low = rows.filter((row) => row.risk_level === "low").length;
  const meanSuitability = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.suitability_index ?? 0), 0) / rows.length
    : 0;
  const meanRain = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.rainfall_index ?? 0), 0) / rows.length
    : 0;
  const meanTemp = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.temperature_index ?? 0), 0) / rows.length
    : 0;
  const meanEvidence = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.evidence_index ?? 0), 0) / rows.length
    : 0;

  const confidence = scoring?.data_confidence ?? {};
  const confidenceComponents = confidence.components ?? [];
  const currentModels = framework?.current_operational_models ?? [];
  const grantModels = framework?.grant_period_models ?? [];
  const missingFields = readiness?.missing_fields ?? [];

  const topDistricts = rows.slice(0, 10).map((row) => ({
    district: titleCase(row.district),
    suitability: Number(row.suitability_index ?? 0),
    rainfall: Number(row.rainfall_index ?? 0),
    temperature: Number(row.temperature_index ?? 0),
    evidence: Number(row.evidence_index ?? 0),
    risk: row.risk_level,
    reason: row.reason,
    rainfall30: Number(row.rainfall_30d_mm ?? 0),
    tmean: row.tmean_c,
    records: row.recent_records ?? 0,
  }));

  const signalShape = [
    { metric: "Rainfall", value: Math.round(meanRain * 100) },
    { metric: "Temperature", value: Math.round(meanTemp * 100) },
    { metric: "Vector evidence", value: Math.round(meanEvidence * 100) },
    { metric: "Overall", value: Math.round(meanSuitability * 100) },
    { metric: "Confidence", value: Math.round(Number(confidence.overall_index ?? 0) * 100) },
  ];

  const readinessGate = readiness?.ready ? "Open" : "Blocked";
  const readinessTone = readiness?.ready ? "green" : "amber";

  return (
    <div className="page">
      <div className="page-hero">
        <div className="eyebrow">Model operations</div>
        <h2>Climate-to-surveillance priority engine</h2>
        <p>
          Converts climate, vector and readiness evidence into reviewable district priorities for Aedes surveillance and dengue preparedness. It does not claim confirmed outbreak prediction before validation data exist.
        </p>
        <div className="hero-badges">
          <Badge variant="green">Uses live API data</Badge>
          <Badge variant="blue">Policy-facing signal</Badge>
          <Badge variant="amber">Human reviewed</Badge>
          <ExportToolbar
            csvFilename="dengueew_gl_model_priority_screening"
            csvRows={rows.map((row) => ({
              district: row.district,
              risk_level: row.risk_level,
              suitability_index: row.suitability_index,
              rainfall_30d_mm: row.rainfall_30d_mm,
              tmean_c: row.tmean_c,
              recent_records: row.recent_records,
              uncertainty_level: row.uncertainty_level,
              reason: row.reason,
            }))}
            jsonData={{ model_note: risk?.model_note, items: rows }}
          />
        </div>
        <div className="page-hero-kpis">
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{riskLoading ? "..." : rows.length}</div>
            <div className="page-hero-kpi-label">Districts scored</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value" style={{ color: "#fca5a5" }}>{riskLoading ? "..." : high}</div>
            <div className="page-hero-kpi-label">High review priority</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{riskLoading ? "..." : pct(meanSuitability)}</div>
            <div className="page-hero-kpi-label">Mean suitability</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{readinessLoading ? "..." : readinessGate}</div>
            <div className="page-hero-kpi-label">Training gate</div>
          </div>
        </div>
      </div>

      <div className="kpi-row">
        <SignalCard icon={MapPinned} color="red" title="High priority" value={riskLoading ? "..." : high} sub="districts for technical review" />
        <SignalCard icon={Target} color="amber" title="Medium priority" value={riskLoading ? "..." : medium} sub="watch and verify" />
        <SignalCard icon={CheckCircle2} color="green" title="Lower priority" value={riskLoading ? "..." : low} sub="routine monitoring" />
        <SignalCard icon={Gauge} color="blue" title="Evidence confidence" value={scoringLoading ? "..." : pct(confidence.overall_index)} sub="data completeness signal" />
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="District priority ranking" icon={BarChart3}>
          <div className="card-body">
            <ChartState loading={riskLoading} error={riskError} rows={topDistricts} empty="No district model rows are available from the API.">
              <div className="chart-wrap" style={{ height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDistricts} layout="vertical" margin={{ top: 8, right: 18, left: 14, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f2" horizontal={false} />
                    <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="district" width={92} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value, name) => [Number(value).toFixed(2), name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }}
                    />
                    <Bar dataKey="suitability" name="Suitability" radius={[0, 6, 6, 0]}>
                      {topDistricts.map((row) => <Cell key={row.district} fill={RISK_COLOR[row.risk] ?? RISK_COLOR.low} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Signal composition" icon={Radar}>
          <div className="card-body">
            {riskLoading || scoringLoading ? (
              <Spinner />
            ) : rows.length ? (
              <>
                <div className="chart-wrap" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={signalShape}>
                      <PolarGrid stroke="#e6eeee" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#52605d" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <RadarShape dataKey="value" stroke="#0d9488" fill="#0d9488" fillOpacity={0.22} />
                      <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <MetricStrip items={[
                  { label: "Rainfall signal", value: pct(meanRain) },
                  { label: "Temperature signal", value: pct(meanTemp) },
                  { label: "Vector evidence", value: pct(meanEvidence) },
                  { label: "Overall signal", value: pct(meanSuitability) },
                ]} />
              </>
            ) : (
              <EmptyMini title="No signal shape" text="The model API did not return district rows." />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="Model readiness gate" icon={ShieldCheck}>
          <div className="card-body" style={{ display: "grid", gap: 14 }}>
            {readinessLoading ? <Spinner /> : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 850, color: readiness?.ready ? "var(--green-600)" : "var(--amber-600)" }}>
                      {readinessGate}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>
                      {readiness?.message ?? "Model-readiness message unavailable."}
                    </div>
                  </div>
                  <Badge variant={readinessTone}>{readiness?.ready ? "Training ready" : "Pilot data required"}</Badge>
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {missingFields.length ? missingFields.map((field) => (
                    <div key={field} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <AlertTriangle size={14} color="#d97706" />
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{field.replace(/_/g, " ")}</span>
                    </div>
                  )) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>All critical model-training fields are available.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Current implemented model assets" icon={BrainCircuit}>
          <div className="card-body" style={{ display: "grid", gap: 10 }}>
            {frameworkLoading ? <Spinner /> : currentModels.length ? currentModels.map((model) => (
              <div key={model.model_id} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius)", padding: "12px 14px", background: "var(--surface-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{model.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>{model.output}</div>
                  </div>
                  <Badge variant={statusBadge(model.status)}>{model.status.replace(/_/g, " ")}</Badge>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 9 }}>{model.claim_boundary}</div>
              </div>
            )) : (
              <EmptyMini title="No registered model assets" text="The mathematical-framework API returned no model inventory." />
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="District review worklist" icon={MapPinned}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 9 }}>
          <ChartState loading={riskLoading} error={riskError} rows={topDistricts} empty="No district worklist rows are available.">
            {topDistricts.slice(0, 8).map((row) => (
              <div key={row.district} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr auto", gap: 14, alignItems: "center", padding: "12px 14px", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", background: "#fff" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{row.district}</strong>
                    <Badge variant={RISK_BADGE[row.risk] ?? "green"}>{row.risk}</Badge>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11.5, marginTop: 4 }}>{row.reason}</div>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  <ProgressBar label="Suitability" value={row.suitability} max={1} color={row.risk === "high" ? "red" : row.risk === "medium" ? "amber" : "green"} />
                </div>
                <div style={{ minWidth: 160, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  <Badge variant="blue">{number(row.rainfall30, 1)} mm</Badge>
                  <Badge variant="teal">{row.tmean ?? "NA"} C</Badge>
                  <Badge variant="amber">{row.records} records</Badge>
                </div>
              </div>
            ))}
          </ChartState>
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      <SectionCard title="Validation roadmap" icon={TimerReset}>
        <div className="pilot-grid" style={{ padding: 16 }}>
          {frameworkLoading ? <Spinner /> : grantModels.length ? grantModels.map((model) => (
            <div className={`pilot-card ${String(model.status).includes("blocked") ? "pending" : "active"}`} key={model.stage}>
              <div className="pilot-card-phase">Stage {model.stage}</div>
              <div className="pilot-card-title">{model.name}</div>
              <div className="pilot-card-body">{model.family}</div>
              <div className="pilot-card-body"><strong>Needs:</strong> {model.required_outcome}</div>
              <Badge variant={statusBadge(model.status)}>{model.status.replace(/_/g, " ")}</Badge>
            </div>
          )) : (
            <EmptyMini title="No roadmap loaded" text="The framework API returned no grant-period model stages." />
          )}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      <SectionCard title="Confidence controls" icon={CheckCircle2}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 10 }}>
          {scoringLoading ? <Spinner /> : confidenceComponents.length ? confidenceComponents.map((component) => (
            <div key={component.component} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 12, alignItems: "center", padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>{component.component}</div>
              <ProgressBar label={component.note} value={Number(component.score ?? 0)} max={1} color={component.score >= 0.7 ? "green" : component.score >= 0.4 ? "amber" : "red"} />
              <Badge variant={component.score >= 0.7 ? "green" : component.score >= 0.4 ? "amber" : "red"}>{component.status}</Badge>
            </div>
          )) : (
            <EmptyMini title="No confidence controls" text="The scoring API returned no confidence components." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
