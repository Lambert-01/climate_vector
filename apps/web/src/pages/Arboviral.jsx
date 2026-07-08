import React from "react";
import { Biohazard, CloudRain, Globe2, ShieldCheck, Target } from "lucide-react";
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
import { Badge, ChartState, DataTable, MetricStrip, SectionCard } from "../components/UI";

const COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#7c3aed", "#ef4444", "#14b8a6", "#64748b"];

function n(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function title(value) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Arboviral() {
  const { data: overview, loading: oL, error: oError } = useFetch(api.arboviralOverview);
  const { data: climate, loading: cL, error: cError } = useFetch(api.arboviralClimate);
  const { data: vectors, loading: vL, error: vError } = useFetch(api.arboviralVectors);
  const { data: profiles, loading: pL, error: pError } = useFetch(api.arboviralDiseaseProfiles);
  const { data: readiness, loading: rL, error: rError } = useFetch(api.arboviralReadiness);

  const summary = overview?.summary ?? {};
  const climateRows = (climate?.items ?? []).map((row) => ({
    ...row,
    label: `${row.location}, ${row.country}`,
    rain30: n(row.rainfall_latest_30d_mm),
    temp: n(row.tmean_mean_c),
    humidity: n(row.humidity_mean_pct),
  }));
  const vectorRows = vectors?.items ?? [];
  const profileRows = profiles?.items ?? overview?.disease_profiles ?? [];
  const readinessRows = readiness?.items ?? overview?.readiness_layers ?? [];
  const topClimate = [...climateRows].sort((a, b) => b.rain30 - a.rain30).slice(0, 7);
  const vectorChart = vectorRows.map((row) => ({
    species: row.species,
    records: n(row.records),
  }));

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Great Lakes region</div>
          <h2>Arboviral preparedness</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">Climate + vector context</Badge>
          <Badge variant="amber">Preparedness, not prediction</Badge>
        </div>
      </div>

      <SectionCard title="Regional readiness snapshot" icon={Biohazard}>
        <MetricStrip
          items={[
            { label: "Regional points", value: oL ? "..." : summary.regional_points ?? 0 },
            { label: "High climate signals", value: oL ? "..." : summary.high_climate_context_points ?? 0 },
            { label: "Aedes records", value: oL ? "..." : Number(summary.aedes_occurrence_records ?? 0).toLocaleString() },
            { label: "Culex records", value: oL ? "..." : Number(summary.culex_occurrence_records ?? 0).toLocaleString() },
          ]}
        />
      </SectionCard>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Disease preparedness profiles" icon={Target}>
          <ChartState loading={pL || oL} error={pError || oError} rows={profileRows} empty="No disease preparedness profiles loaded.">
            <div className="decision-grid">
              {profileRows.map((row) => (
                <div className="decision-card" key={row.disease_group}>
                  <span>{row.dashboard_claim}</span>
                  <strong>{row.disease_group}</strong>
                  <small>{row.policy_use}</small>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Data governance" icon={ShieldCheck}>
          <ChartState loading={rL || oL} error={rError || oError} rows={readinessRows} empty="No readiness layers loaded.">
            <div className="coverage-list" style={{ padding: 0 }}>
              {readinessRows.map((row) => (
                <div className="readiness-item" key={row.layer}>
                  <div className={`readiness-dot ${String(row.status).includes("required") || String(row.status).includes("planned") ? "partial" : "ready"}`} />
                  <div className="readiness-item-label">{row.layer}</div>
                  <Badge variant={String(row.status).includes("required") ? "amber" : "green"}>{title(row.status)}</Badge>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Regional rainfall context" icon={CloudRain}>
          <ChartState loading={cL} error={cError} rows={topClimate} empty="No Great Lakes climate rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClimate} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="rain30" name="Latest 30d rainfall mm" radius={[4, 4, 0, 0]}>
                      {topClimate.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Public vector occurrence context" icon={Globe2}>
          <ChartState loading={vL} error={vError} rows={vectorChart} empty="No vector occurrence rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vectorChart} layout="vertical" margin={{ top: 4, right: 8, left: 112, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="species" tick={{ fontSize: 10 }} tickLine={false} width={130} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="records" name="GBIF records" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard title="Climate point table" icon={CloudRain}>
          <ChartState loading={cL} error={cError} rows={climateRows} empty="No climate point rows available.">
            <DataTable
              rows={climateRows}
              columns={["location", "country", "records", "date_start", "date_end", "rainfall_latest_30d_mm", "tmean_mean_c", "humidity_mean_pct", "climate_signal"]}
            />
          </ChartState>
        </SectionCard>

        <SectionCard title="Vector context table" icon={Globe2}>
          <ChartState loading={vL} error={vError} rows={vectorRows} empty="No vector context rows available.">
            <DataTable rows={vectorRows} columns={["species", "vector_group", "records", "countries", "top_country", "year_start", "year_end", "use_boundary"]} />
          </ChartState>
        </SectionCard>
      </div>
    </div>
  );
}
