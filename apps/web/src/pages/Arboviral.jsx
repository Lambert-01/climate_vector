import React from "react";
import { Biohazard, CloudRain, Globe2, ShieldCheck, Target, Thermometer } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, MetricStrip, RiskGauge, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#7c3aed", "#ef4444", "#14b8a6"];

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function title(v) { return String(v ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }

const DISEASE_META = {
  "Dengue / Chikungunya / Zika": { cls: "dengue", color: "#ef4444", vector: "Aedes aegypti / Aedes albopictus" },
  "Yellow fever":                 { cls: "yellow", color: "#d97706", vector: "Aedes vectors" },
  "Rift Valley Fever":            { cls: "rvf",    color: "#f97316", vector: "Culex + Aedes (flooding)" },
};

export default function Arboviral() {
  const { data: overview, loading: oL } = useFetch(api.arboviralOverview);
  const { data: climate,  loading: cL, error: cE } = useFetch(api.arboviralClimate);
  const { data: vectors,  loading: vL, error: vE } = useFetch(api.arboviralVectors);
  const { data: profiles, loading: pL } = useFetch(api.arboviralDiseaseProfiles);
  const { data: readiness,loading: rL } = useFetch(api.arboviralReadiness);
  const { data: scoring,  loading: scL } = useFetch(api.arboviralScoring);

  const summary      = overview?.summary ?? {};
  const climateRows  = (climate?.items ?? []).map(r => ({
    ...r, label: `${r.location}, ${r.country}`,
    rain30: n(r.rainfall_latest_30d_mm), temp: n(r.tmean_mean_c), humidity: n(r.humidity_mean_pct),
  }));
  const vectorRows   = vectors?.items ?? [];
  const profileRows  = profiles?.items ?? overview?.disease_profiles ?? [];
  const readinessRows= readiness?.items ?? overview?.readiness_layers ?? [];
  const topClimate   = [...climateRows].sort((a, b) => b.rain30 - a.rain30).slice(0, 7);
  const vectorChart  = vectorRows.map(r => ({ species: r.species, records: n(r.records) }));
  const aedesRec     = n(summary.aedes_occurrence_records);
  const culexRec     = n(summary.culex_occurrence_records);
  const totalVec     = aedesRec + culexRec;
  const highClimate  = n(summary.high_climate_context_points);
  const totalPoints  = n(summary.regional_points);

  const aedesPrep    = scoring?.aedes_preparedness ?? {};
  const rvfWatch     = scoring?.rvf_watch ?? {};
  const confidence   = scoring?.data_confidence ?? {};

  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="page-hero">
        <div className="eyebrow">Great Lakes region · arboviral intelligence</div>
        <h2>Arboviral preparedness context</h2>
        <p>
          Climate-informed Aedes/Culex preparedness, RVF One Health watch, and disease profile
          context for the African Great Lakes region. All outputs are preparedness screening —
          not confirmed outbreak prediction.
        </p>
        <div className="hero-badges">
          <Badge variant="green">Climate + vector context</Badge>
          <Badge variant="amber">Preparedness · not prediction</Badge>
          <ExportToolbar
            csvFilename="arborisk_arboviral_intelligence"
            csvRows={items.map((r) => ({ district: r.district, climate_signal: r.climate_signal, vector_signal: r.vector_signal, risk: r.risk_level }))}
            jsonData={items}
          />
          <Badge variant="blue">{totalPoints} regional points</Badge>
        </div>
        <div className="page-hero-kpis">
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{oL ? "…" : totalPoints}</div>
            <div className="page-hero-kpi-label">Regional climate points</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{oL ? "…" : highClimate}</div>
            <div className="page-hero-kpi-label">High climate signals</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{oL ? "…" : aedesRec.toLocaleString()}</div>
            <div className="page-hero-kpi-label">Aedes GBIF records</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{oL ? "…" : culexRec.toLocaleString()}</div>
            <div className="page-hero-kpi-label">Culex GBIF records</div>
          </div>
        </div>
      </div>

      {/* ── RISK GAUGES ── */}
      <SectionCard title="Vector group preparedness indices" icon={Target}>
        <div className="risk-gauge-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          <RiskGauge
            label="Aedes preparedness"
            value={scL ? 0 : n(aedesPrep.index) * 100}
            max={100}
            level={aedesPrep.level === "high" ? "high" : aedesPrep.level === "moderate" ? "medium" : "low"}
            sub={`${aedesRec.toLocaleString()} GBIF records · ${aedesPrep.level ?? "context"}`}
          />
          <RiskGauge
            label="RVF One Health watch"
            value={scL ? 0 : n(rvfWatch.index) * 100}
            max={100}
            level={rvfWatch.level === "watch" ? "high" : rvfWatch.level === "monitor" ? "medium" : "low"}
            sub={`${culexRec.toLocaleString()} Culex records · ${rvfWatch.level ?? "routine"}`}
          />
          <RiskGauge
            label="Data confidence"
            value={scL ? 0 : n(confidence.overall_index) * 100}
            max={100}
            level="teal"
            sub="Current evidence completeness index"
          />
        </div>
        <MetricStrip items={[
          { label: "Aedes index",    value: scL ? "…" : n(aedesPrep.index).toFixed(2) },
          { label: "RVF index",      value: scL ? "…" : n(rvfWatch.index).toFixed(2) },
          { label: "Confidence",     value: scL ? "…" : n(confidence.overall_index).toFixed(2) },
          { label: "High signals",   value: oL  ? "…" : highClimate },
        ]} />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── DISEASE PROFILES ── */}
      <div className="section-label"><Biohazard size={13} /> Disease preparedness profiles</div>
      <div className="grid-3" style={{ marginBottom: 22 }}>
        {profileRows.length > 0 ? profileRows.map(row => {
          const meta = DISEASE_META[row.disease_group] ?? { cls: "dengue", color: "#0d9488", vector: row.primary_vector };
          return (
            <div className="disease-card" key={row.disease_group}>
              <div className={`disease-card-header ${meta.cls}`}>
                <div>
                  <div className="disease-card-title">{row.disease_group}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{meta.vector}</div>
                </div>
                <Badge variant={meta.cls === "dengue" ? "red" : meta.cls === "yellow" ? "amber" : "orange"}>
                  {row.dashboard_claim}
                </Badge>
              </div>
              <div className="disease-card-body">
                <div className="disease-card-row">
                  <span className="disease-card-row-label">Evidence</span>
                  <span className="disease-card-row-value">{row.current_evidence}</span>
                </div>
                <div className="disease-card-row">
                  <span className="disease-card-row-label">Policy use</span>
                  <span className="disease-card-row-value">{row.policy_use}</span>
                </div>
                <div className="disease-card-row">
                  <span className="disease-card-row-label">Needs</span>
                  <span className="disease-card-row-value" style={{ color: "var(--text-muted)" }}>{row.missing_for_validation}</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ gridColumn: "span 3", padding: 20, color: "var(--text-muted)", textAlign: "center" }}>
            {pL || oL ? "Loading disease profiles…" : "No disease profiles loaded."}
          </div>
        )}
      </div>

      {/* ── CLIMATE CHARTS ── */}
      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="Regional 30-day rainfall context" icon={CloudRain}>
          <ChartState loading={cL} error={cE} rows={topClimate} empty="No Great Lakes climate rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClimate} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="rain30" name="Latest 30d rainfall mm" radius={[5, 5, 0, 0]}>
                      {topClimate.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Temperature and humidity by location" icon={Thermometer}>
          <ChartState loading={cL} error={cE} rows={climateRows} empty="No climate rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={climateRows} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Line type="monotone" dataKey="temp"     stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5, fill: "#f59e0b" }} name="Mean temp °C" />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: "#3b82f6" }} name="Humidity %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      {/* ── VECTOR OCCURRENCE ── */}
      <SectionCard title="Public vector occurrence context — GBIF Great Lakes" icon={Globe2}>
        <ChartState loading={vL} error={vE} rows={vectorChart} empty="No vector occurrence rows loaded.">
          <div className="card-body">
            <div className="chart-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vectorChart} layout="vertical" margin={{ top: 4, right: 8, left: 130, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="species" tick={{ fontSize: 11 }} tickLine={false} width={140} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                  <Bar dataKey="records" name="GBIF records" fill="#0d9488" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── GOVERNANCE LAYERS ── */}
      <SectionCard title="Data governance and readiness layers" icon={ShieldCheck}>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {readinessRows.length > 0 ? readinessRows.map(row => {
            const isReady = !String(row.status).includes("required") && !String(row.status).includes("planned");
            return (
              <div className={`readiness-item ${isReady ? "ready-item" : "pilot-item"}`} key={row.layer}>
                <div className={`readiness-dot ${isReady ? "ready" : "partial"}`} />
                <div className="readiness-item-label" style={{ flex: 1 }}>{row.layer}</div>
                <div className="readiness-item-status" style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 280, textAlign: "right" }}>{row.evidence}</div>
                <Badge variant={isReady ? "green" : "amber"}>{title(row.status)}</Badge>
              </div>
            );
          }) : (
            <div style={{ color: "var(--text-muted)", padding: 12 }}>{rL || oL ? "Loading…" : "No readiness layers loaded."}</div>
          )}
        </div>
      </SectionCard>

    </div>
  );
}
