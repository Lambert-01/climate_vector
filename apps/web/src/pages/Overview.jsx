import React from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  FlaskConical,
  Map,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  AlertBanner,
  Badge,
  ChartState,
  MetricStrip,
  ReadinessList,
  SectionCard,
  StatCard,
} from "../components/UI";

export default function Overview() {
  const { data: stats, loading: sL, error: statsError } = useFetch(api.stats);
  const { data: readiness, loading: rL, error: readinessError } = useFetch(api.readiness);
  const { data: climate, loading: cL, error: climateError } = useFetch(api.climateKigali);
  const { data: alerts } = useFetch(api.alerts);
  const { data: publicSources, loading: pL, error: pError } = useFetch(api.publicDataSources);
  const { data: publicFeatures, loading: fL, error: fError } = useFetch(api.publicDistrictFeatures);
  const { data: gbif } = useFetch(() => api.publicGbif(1));

  const climateRows = (climate?.items ?? []).slice(-60).map((r) => ({
    date: r.DATE ?? r.date ?? "",
    rain: Number.parseFloat(r.PRECTOTCORR ?? r.rainfall_mm ?? 0) || 0,
    temp: Number.parseFloat(r.T2M ?? r.tmean_c ?? 0) || 0,
  }));

  const sourceRows = publicSources?.items ?? [];
  const publicFeatureRows = publicFeatures?.items ?? [];
  const loadedSources = sourceRows.filter((s) => Number(s.file_count ?? 0) > 0).length;
  const pendingSources = sourceRows.filter((s) => s.use_now === "not_downloaded_yet").length;
  const districtClimateRows = publicFeatureRows
    .map((r) => ({
      district: r.district,
      rainfall: Number(r.rainfall_mean_daily_mm ?? 0),
      temp: Number(r.tmean_c_mean ?? 0),
      records: Number(r.climate_records ?? 0),
      gbif: Number(r.gbif_occurrence_count ?? 0),
    }))
    .sort((a, b) => b.rainfall - a.rainfall)
    .slice(0, 10);

  const activeAlerts = (alerts?.items ?? []).filter(
    (a) => a.status === "pending_review" || a.status === "active"
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>System Overview</h2>
        <p>Climate-informed mosquito risk surveillance - Rwanda Proof of Concept</p>
      </div>

      <AlertBanner
        type="warning"
        title="Descriptive prototype only"
        message="Current outputs are descriptive. Resistance summaries require denominator, protocol, control mortality, dates, GPS, and species cleaning before final interpretation."
      />
      {(statsError || readinessError) && (
        <AlertBanner
          type="error"
          title="Some dashboard endpoints failed"
          message={statsError || readinessError}
        />
      )}

      <div className="stats-grid">
        <StatCard icon={Map} label="Sentinel Sites" value={sL ? "..." : stats?.sites ?? 0} sub="GPS pending confirmation" color="teal" />
        <StatCard icon={Activity} label="Mosquito Records" value={sL ? "..." : (stats?.mosquito_observations ?? 0).toLocaleString()} sub="Preliminary ecology table" color="blue" />
        <StatCard icon={FlaskConical} label="Resistance Tests" value={sL ? "..." : (stats?.resistance_tests ?? 0).toLocaleString()} sub="Denominator unconfirmed" color="orange" />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={sL ? "..." : stats?.active_alerts ?? activeAlerts.length} sub="Pending technical review" color="amber" />
      </div>

      <SectionCard title="Public Data Coverage" icon={Database}>
        <MetricStrip
          items={[
            { label: "Loaded public sources", value: pL ? "..." : loadedSources },
            { label: "Pending downloads", value: pL ? "..." : pendingSources },
            { label: "District climate rows", value: fL ? "..." : publicFeatureRows.length },
            { label: "GBIF mosquito records", value: gbif?.count?.toLocaleString?.() ?? "..." },
          ]}
        />
        <ChartState loading={pL} error={pError} rows={sourceRows} empty="No public-data inventory generated yet.">
          <div className="coverage-list">
            {sourceRows.slice(0, 8).map((source) => (
              <div className="coverage-row" key={source.source_id}>
                <div className="coverage-name">{source.source_name}</div>
                <Badge
                  variant={
                    source.use_now === "yes"
                      ? "green"
                      : source.use_now === "partial"
                        ? "amber"
                        : source.use_now === "not_downloaded_yet"
                          ? "red"
                          : "blue"
                  }
                >
                  {String(source.use_now).replace(/_/g, " ")}
                </Badge>
                <div>{Number(source.file_count ?? 0).toLocaleString()} files</div>
                <div className="coverage-note">{source.model_use}</div>
              </div>
            ))}
          </div>
        </ChartState>
      </SectionCard>

      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="Kigali Rainfall (last 60 days)" icon={TrendingUp}>
          <ChartState loading={cL} error={climateError} rows={climateRows} empty="No Kigali climate rows available.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={climateRows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={9} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Area type="monotone" dataKey="rain" stroke="#0d9488" strokeWidth={2} fill="url(#rainGrad)" name="Rainfall (mm)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Wettest District Climate Proxies" icon={TrendingUp}>
          <ChartState loading={fL} error={fError} rows={districtClimateRows} empty="No district public climate feature rows available.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtClimateRows} margin={{ top: 4, right: 8, left: -18, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="district" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="rainfall" name="Mean daily rainfall (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard title="Data Readiness" icon={Database}>
        <ChartState loading={rL} error={readinessError} rows={readiness?.items ?? []} empty="No readiness data loaded.">
          <ReadinessList items={readiness?.items ?? []} />
        </ChartState>
      </SectionCard>
    </div>
  );
}
