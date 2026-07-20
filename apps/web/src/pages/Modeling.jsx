import React from "react";
import { BrainCircuit, Calculator, CheckCircle2, ShieldCheck, Target } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, MetricStrip, ProgressBar, SectionCard, Spinner } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const RISK_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#0d9488" };
const RISK_BG    = { high: "#fef2f2", medium: "#fffbeb", low: "#f0fdf4" };
const RISK_BADGE = { high: "red",     medium: "amber",   low: "green" };

function tc(v) {
  return String(v ?? "").split(/[\s_-]+/).filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}

export default function Modeling() {
  const { data: risk,      loading: rL, error: rE } = useFetch(() => api.districtRisk(30));
  const { data: readiness, loading: rdL            } = useFetch(api.modelingReadiness);
  const { data: scoring,   loading: scL            } = useFetch(api.arboviralScoring);
  const { data: framework, loading: fwL            } = useFetch(api.dengueMathematicalFramework);

  const rows   = risk?.items ?? [];
  const high   = rows.filter(r => r.risk_level === "high").length;
  const medium = rows.filter(r => r.risk_level === "medium").length;
  const low    = rows.filter(r => r.risk_level === "low").length;
  const meanSuit = rows.length ? rows.reduce((s, r) => s + Number(r.suitability_index ?? 0), 0) / rows.length : 0;

  const chartRows = rows.slice(0, 12).map(r => ({
    district:    tc(r.district),
    suitability: Number(r.suitability_index ?? 0),
    risk:        r.risk_level,
  }));

  const climateScores = scoring?.climate_suitability_scores ?? [];
  const aedesPrep     = scoring?.aedes_preparedness ?? {};
  const confidence    = scoring?.data_confidence ?? {};

  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="page-hero">
        <div className="eyebrow">Dengue preparedness priority engine</div>
        <h2>Aedes surveillance prioritization</h2>
        <p>
          Climate suitability and existing vector evidence identify where prospective Aedes
          surveillance should be reviewed first. These are screening priorities, not dengue forecasts.
        </p>
        <div className="hero-badges">
          <Badge variant="green">Decision support</Badge>
          <Badge variant="amber">Pilot-grade · validation next</Badge>
          <Badge variant="blue">30 Rwanda districts</Badge>
          <ExportToolbar
            csvFilename="arborisk_modeling_screening"
            csvRows={rows.map((d) => ({ district: d.district, risk_level: d.risk_level, suitability_index: d.suitability_index, reason: d.reason }))}
            jsonData={rows}
          />
        </div>
        <div className="page-hero-kpis">
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value" style={{ color: "#ef4444" }}>{rL ? "…" : high}</div>
            <div className="page-hero-kpi-label">High priority districts</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value" style={{ color: "#f59e0b" }}>{rL ? "…" : medium}</div>
            <div className="page-hero-kpi-label">Medium priority</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value" style={{ color: "#0d9488" }}>{rL ? "…" : low}</div>
            <div className="page-hero-kpi-label">Low priority</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{rL ? "…" : meanSuit.toFixed(2)}</div>
            <div className="page-hero-kpi-label">Mean suitability index</div>
          </div>
        </div>
      </div>

      <SectionCard title="Scientific governance" icon={ShieldCheck}>
        <MetricStrip items={[
          { label: "Scientific lead", value: fwL ? "…" : framework?.scientific_lead?.name ?? "Not assigned" },
          { label: "Current model", value: fwL ? "…" : framework?.current_operational_models?.[0]?.model_id ?? "Not registered" },
          { label: "Current use", value: "Field priority" },
          { label: "Forecast gate", value: "Prospective validation" },
        ]} />
        <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 750 }}>Climate-to-action model governance</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Screening signals remain human-reviewed until spatial, temporal and calibration checks pass.
            </div>
          </div>
          <Badge variant="amber">Unvalidated proxy</Badge>
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── PRIORITY DISTRIBUTION ── */}
      <SectionCard title="District priority distribution" icon={BrainCircuit}>
        <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
          <ProgressBar label={`High priority — ${high} districts`}   value={high}   max={rows.length || 30} color="red" />
          <ProgressBar label={`Medium priority — ${medium} districts`} value={medium} max={rows.length || 30} color="amber" />
          <ProgressBar label={`Low priority — ${low} districts`}      value={low}    max={rows.length || 30} color="green" />
        </div>
        <MetricStrip items={[
          { label: "High",        value: rL ? "…" : high },
          { label: "Medium",      value: rL ? "…" : medium },
          { label: "Low",         value: rL ? "…" : low },
          { label: "Mean index",  value: rL ? "…" : meanSuit.toFixed(2) },
        ]} />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── CHART + SCORING ── */}
      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="Top 12 districts by suitability index" icon={BrainCircuit}>
          <div className="card-body">
            <ChartState loading={rL} error={rE} rows={chartRows} empty="No district suitability rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 4, right: 8, left: -20, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="district" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="suitability" name="Suitability index" radius={[5, 5, 0, 0]}>
                      {chartRows.map(r => <Cell key={r.district} fill={RISK_COLOR[r.risk] ?? RISK_COLOR.low} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Preparedness indices" icon={Calculator}>
          <div className="card-body" style={{ display: "grid", gap: 14 }}>
            {scL ? <Spinner /> : (
              <>
                <div style={{ background: RISK_BG[aedesPrep.level === "high" ? "high" : aedesPrep.level === "moderate" ? "medium" : "low"] ?? "#f0fdf4", borderRadius: "var(--radius)", padding: "14px 16px", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: 13 }}>Aedes preparedness index</strong>
                    <Badge variant={RISK_BADGE[aedesPrep.level === "high" ? "high" : aedesPrep.level === "moderate" ? "medium" : "low"] ?? "green"}>{aedesPrep.level ?? "low"}</Badge>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>{Number(aedesPrep.index ?? 0).toFixed(3)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{aedesPrep.recommended_action}</div>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius)", padding: "14px 16px", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong style={{ fontSize: 13 }}>Evidence confidence</strong>
                    <Badge variant="amber">Pilot validation required</Badge>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{Math.round(Number(confidence.overall_index ?? 0) * 100)}%</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Completeness of current climate, vector and sentinel evidence.</div>
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── DATA CONFIDENCE ── */}
      <SectionCard title="Data confidence components" icon={CheckCircle2}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 8 }}>
          {scL ? <Spinner /> : (confidence.components ?? []).map(c => (
            <div key={c.component} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", background: c.score >= 0.7 ? "var(--green-100)" : c.score >= 0.4 ? "var(--amber-100)" : "var(--red-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: c.score >= 0.7 ? "var(--green-600)" : c.score >= 0.4 ? "var(--amber-600)" : "var(--red-600)" }}>{Math.round(c.score * 100)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{c.component}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{c.note}</div>
              </div>
              <Badge variant={c.score >= 0.7 ? "green" : c.score >= 0.4 ? "amber" : "red"}>{c.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── USE BOUNDARIES ── */}
      <div className="section-label"><Target size={13} /> What this model can and cannot do</div>
      <div className="pilot-grid" style={{ marginBottom: 22 }}>
        <div className="pilot-card ready">
          <div className="pilot-card-phase">Usable now</div>
          <div className="pilot-card-title">District climate suitability screening</div>
          <div className="pilot-card-body">Identifies which districts have the strongest climate-vector signal for field verification prioritization.</div>
          <Badge variant="green">Operational</Badge>
        </div>
        <div className="pilot-card ready">
          <div className="pilot-card-phase">Usable now</div>
          <div className="pilot-card-title">Mosquito and resistance signal summaries</div>
          <div className="pilot-card-body">PI ecology and susceptibility data provide habitat and vector-control context for preparedness planning.</div>
          <Badge variant="amber">Screening</Badge>
        </div>
        <div className="pilot-card pending">
          <div className="pilot-card-phase">Blocked — pilot required</div>
          <div className="pilot-card-title">Validated dengue outbreak forecasting</div>
          <div className="pilot-card-body">Requires approved dengue outcomes, prospective Aedes surveillance, effort denominators and temporal/spatial validation.</div>
          <Badge variant="red">Blocked</Badge>
        </div>
      </div>

      {/* ── TRAINING READINESS ── */}
      <SectionCard title="Model training readiness" icon={Calculator}>
        <div className="card-body">
          {rdL ? <Spinner /> : (
            <div style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.6 }}>
                {readiness?.message}
              </p>
              {(readiness?.missing_fields ?? []).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", marginBottom: 8 }}>Missing for full training</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {(readiness?.missing_fields ?? []).map(f => (
                      <Badge key={f} variant="amber">{f.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── CLIMATE SUITABILITY TABLE ── */}
      <SectionCard title="Regional climate suitability scores" icon={BrainCircuit}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 8 }}>
          {scL ? <Spinner /> : climateScores.map(s => (
            <div key={s.location} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13 }}>{s.location}, {s.country}</strong>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  Rain: {s.rainfall_30d_mm} mm · Temp: {s.tmean_c}°C · Humidity: {s.humidity_pct}%
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: RISK_COLOR[s.suitability_level] ?? "#0d9488" }}>
                  {Math.round(s.climate_suitability_index * 100)}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>index</div>
              </div>
              <Badge variant={s.suitability_level === "high" ? "red" : s.suitability_level === "moderate" ? "amber" : "green"}>
                {s.suitability_level}
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
