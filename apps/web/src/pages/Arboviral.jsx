import React from "react";
import { CloudRain, Dna, Globe2, MapPin, Microscope, ShieldCheck, Smartphone, Target } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, MetricStrip, ProgressBar, RiskGauge, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#16a34a", "#ef4444", "#7c3aed", "#f97316"];
const n = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const title = (value) => String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function Arboviral() {
  const { data: overview, loading: overviewLoading } = useFetch(api.arboviralOverview);
  const { data: climate, loading: climateLoading, error: climateError } = useFetch(api.arboviralClimate);
  const { data: vectors, loading: vectorLoading, error: vectorError } = useFetch(api.arboviralVectors);
  const { data: scoring, loading: scoringLoading } = useFetch(api.arboviralScoring);
  const { data: modelReadiness } = useFetch(api.dengueModelReadiness);
  const { data: submission } = useFetch(api.dengueSubmissionReadiness);

  const summary = overview?.summary ?? {};
  const climateRows = (climate?.items ?? []).map((row) => ({
    ...row,
    label: `${row.location}, ${row.country}`,
    rain30: n(row.rainfall_latest_30d_mm),
    temperature: n(row.tmean_mean_c),
    humidity: n(row.humidity_mean_pct),
  }));
  const aedesRows = (vectors?.items ?? []).filter((row) => String(row.species).toLowerCase().startsWith("aedes"));
  const aedesRecords = aedesRows.reduce((sum, row) => sum + n(row.records), 0);
  const prep = scoring?.aedes_preparedness ?? {};
  const confidence = scoring?.data_confidence ?? {};
  const gates = modelReadiness?.gates ?? [];
  const gateProgress = gates.length ? Math.round((gates.filter((gate) => gate.status === "ready").length / gates.length) * 100) : 0;
  const pillars = submission?.pillars ?? [];
  const exportRows = climateRows.map((row) => ({
    location: row.location,
    country: row.country,
    rainfall_30d_mm: row.rain30,
    mean_temperature_c: row.temperature,
    humidity_pct: row.humidity,
    climate_signal: row.climate_signal,
  }));

  return (
    <div className="page">
      <div className="page-hero">
        <div className="eyebrow">Dengue intelligence · African Great Lakes context</div>
        <h2>Climate to Aedes surveillance</h2>
        <p>Regional climate and public Aedes occurrence evidence guide where Rwanda’s prospective dengue surveillance pilot should investigate first.</p>
        <div className="hero-badges">
          <Badge variant="green">Digital foundation operational</Badge>
          <Badge variant="amber">No validated dengue forecast</Badge>
          <Badge variant="blue">Prospective pilot designed</Badge>
          <ExportToolbar csvFilename="dengue_climate_aedes_context" csvRows={exportRows} jsonData={{ climate: exportRows, aedes: aedesRows, readiness: gates }} />
        </div>
        <div className="page-hero-kpis">
          <div className="page-hero-kpi"><div className="page-hero-kpi-value">{overviewLoading ? "…" : n(summary.regional_points)}</div><div className="page-hero-kpi-label">Regional climate points</div></div>
          <div className="page-hero-kpi"><div className="page-hero-kpi-value">{overviewLoading ? "…" : aedesRecords.toLocaleString()}</div><div className="page-hero-kpi-label">Aedes GBIF records</div></div>
          <div className="page-hero-kpi"><div className="page-hero-kpi-value">{overviewLoading ? "…" : n(summary.sentinel_sites)}</div><div className="page-hero-kpi-label">Candidate sentinel sites</div></div>
          <div className="page-hero-kpi"><div className="page-hero-kpi-value">{gateProgress}%</div><div className="page-hero-kpi-label">Forecast gates ready</div></div>
        </div>
      </div>

      <SectionCard title="Dengue preparedness controls" icon={Target}>
        <div className="risk-gauge-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          <RiskGauge label="Aedes preparedness" value={scoringLoading ? 0 : n(prep.index) * 100} max={100} level={prep.level === "high" ? "high" : prep.level === "moderate" ? "medium" : "low"} sub="Climate + public occurrence context" />
          <RiskGauge label="Evidence confidence" value={scoringLoading ? 0 : n(confidence.overall_index) * 100} max={100} level="teal" sub="Current source completeness" />
          <RiskGauge label="Forecast readiness" value={gateProgress} max={100} level={gateProgress >= 80 ? "low" : gateProgress >= 50 ? "medium" : "high"} sub="Scientific training gates" />
        </div>
        <MetricStrip items={[
          { label: "Aedes index", value: scoringLoading ? "…" : n(prep.index).toFixed(2) },
          { label: "Data confidence", value: scoringLoading ? "…" : n(confidence.overall_index).toFixed(2) },
          { label: "Ready gates", value: `${gates.filter((gate) => gate.status === "ready").length}/${gates.length || 0}` },
          { label: "Pilot data", value: submission?.counts?.aedes_surveillance_records ?? 0 },
        ]} />
      </SectionCard>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <SectionCard title="Regional rainfall context" icon={CloudRain}>
          <ChartState loading={climateLoading} error={climateError} rows={climateRows} empty="No regional climate rows loaded.">
            <div className="card-body"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={climateRows} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} /><XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} /><YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} /><Bar dataKey="rain30" name="Latest 30-day rainfall (mm)" radius={[5, 5, 0, 0]}>{climateRows.map((row, index) => <Cell key={row.location} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Regional climate screening" icon={Globe2}>
          <div className="pilot-status-list">
            {climateRows.map((row) => (
              <div className="pilot-status-row" key={row.label}>
                <MapPin size={14} color="var(--teal-600)" />
                <div className="pilot-status-copy"><strong>{row.label}</strong><span>{row.temperature.toFixed(1)}°C · {row.humidity.toFixed(0)}% RH · {row.rain30.toFixed(0)} mm/30d</span></div>
                <Badge variant={String(row.climate_signal).includes("high") ? "red" : String(row.climate_signal).includes("moderate") ? "amber" : "green"}>{title(row.climate_signal)}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <SectionCard title="Aedes occurrence evidence" icon={Microscope}>
          <ChartState loading={vectorLoading} error={vectorError} rows={aedesRows} empty="No Aedes occurrence context loaded.">
            <div className="table-wrap"><table><thead><tr><th>Species</th><th>Records</th><th>Countries</th><th>Period</th><th>Evidence boundary</th></tr></thead><tbody>{aedesRows.map((row) => <tr key={row.species}><td><strong>{row.species}</strong></td><td>{n(row.records).toLocaleString()}</td><td>{row.countries || "—"}</td><td>{row.year_start ? `${row.year_start}–${row.year_end}` : "—"}</td><td>{row.use_boundary}</td></tr>)}</tbody></table></div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Evidence-to-action pathway" icon={ShieldCheck}>
          <div className="pilot-status-list">
            {[
              { icon: CloudRain, name: "Climate screening", detail: "NASA POWER, ERA5-Land and live weather", status: "implemented" },
              { icon: Microscope, name: "Aedes collection", detail: "Ovitrap, BG-Sentinel, larval survey and aspirator", status: submission?.counts?.aedes_surveillance_records ? "pilot_active" : "workflow_ready" },
              { icon: Smartphone, name: "Community reporting", detail: "Consented breeding-site observations", status: submission?.counts?.community_reports ? "pilot_active" : "workflow_ready" },
              { icon: Dna, name: "Mosquito-pool genomics", detail: "MinION-compatible sample and QC registry", status: submission?.counts?.genomic_samples ? "pilot_active" : "workflow_ready" },
              { icon: Target, name: "Dengue forecast validation", detail: "Blocked until approved outcomes and sufficient samples", status: "grant_period_work" },
            ].map(({ icon: Icon, name, detail, status }) => <div className="pilot-status-row" key={name}><div className="pilot-status-icon"><Icon size={15} /></div><div className="pilot-status-copy"><strong>{name}</strong><span>{detail}</span></div><Badge variant={status === "implemented" ? "green" : status === "pilot_active" ? "blue" : "amber"}>{title(status)}</Badge></div>)}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Model training gates" icon={ShieldCheck}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 12 }}>
          {gates.map((gate) => <ProgressBar key={gate.gate} label={`${title(gate.gate)} · ${gate.requirement}`} value={gate.status === "ready" ? 100 : gate.count > 0 ? 45 : 10} color={gate.status === "ready" ? "green" : "amber"} />)}
        </div>
      </SectionCard>
    </div>
  );
}
