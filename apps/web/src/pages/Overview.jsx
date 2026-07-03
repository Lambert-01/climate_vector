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
  ReadinessList,
  SectionCard,
  Spinner,
  StatCard,
} from "../components/UI";

export default function Overview() {
  const { data: stats, loading: sL } = useFetch(api.stats);
  const { data: readiness, loading: rL } = useFetch(api.readiness);
  const { data: climate, loading: cL } = useFetch(api.climateKigali);
  const { data: alerts } = useFetch(api.alerts);

  const climateRows = (climate?.items ?? []).slice(-60).map((r) => ({
    date: r.DATE ?? r.date ?? "",
    rain: parseFloat(r.PRECTOTCORR ?? r.rainfall_mm ?? 0) || 0,
    temp: parseFloat(r.T2M ?? r.tmean_c ?? 0) || 0,
  }));

  const activeAlerts = (alerts?.items ?? []).filter(
    (a) => a.status === "pending_review" || a.status === "active"
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>System Overview</h2>
        <p>Climate-informed mosquito risk surveillance — Rwanda Proof of Concept</p>
      </div>

      <AlertBanner
        type="warning"
        title="Descriptive prototype only"
        message="Current outputs are descriptive. Resistance summaries require denominator, protocol, control mortality, dates, GPS, and species cleaning before final interpretation."
      />

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={Map}
          label="Sentinel Sites"
          value={sL ? "…" : stats?.sites ?? 0}
          sub="GPS pending confirmation"
          color="teal"
        />
        <StatCard
          icon={Activity}
          label="Mosquito Records"
          value={sL ? "…" : (stats?.mosquito_observations ?? 0).toLocaleString()}
          sub="Preliminary ecology table"
          color="blue"
        />
        <StatCard
          icon={FlaskConical}
          label="Resistance Tests"
          value={sL ? "…" : (stats?.resistance_tests ?? 0).toLocaleString()}
          sub="Denominator unconfirmed"
          color="orange"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={sL ? "…" : stats?.active_alerts ?? activeAlerts.length}
          sub="Pending technical review"
          color="amber"
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Climate chart */}
        <SectionCard title="Kigali Rainfall (last 60 days)" icon={TrendingUp}>
          {cL ? (
            <Spinner />
          ) : climateRows.length ? (
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
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rain"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fill="url(#rainGrad)"
                      name="Rainfall (mm)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="card-body">
              <div className="empty">No climate data loaded.</div>
            </div>
          )}
        </SectionCard>

        {/* Alerts summary */}
        <SectionCard title="Recent Alerts" icon={AlertTriangle}>
          <div className="card-body">
            {activeAlerts.length === 0 ? (
              <div className="empty">No active alerts.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeAlerts.slice(0, 4).map((a) => (
                  <div key={a.alert_id} className="alert-card">
                    <div className={`alert-card-risk ${a.risk_level ?? "low"}`}>
                      {a.risk_level === "high" ? "🔴" : a.risk_level === "medium" ? "🟡" : "🟢"}
                    </div>
                    <div className="alert-card-body">
                      <div className="alert-card-title">
                        {a.district}
                        <span className={`badge badge-${a.risk_level === "high" ? "red" : a.risk_level === "medium" ? "amber" : "green"}`}>
                          {a.risk_level}
                        </span>
                      </div>
                      <div className="alert-card-reason">{a.risk_reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Data readiness */}
      <SectionCard title="Data Readiness" icon={Database}>
        {rL ? <Spinner /> : <ReadinessList items={readiness?.items ?? []} />}
      </SectionCard>
    </div>
  );
}
