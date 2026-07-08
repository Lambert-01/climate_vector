import React from "react";
import { Database, FlaskConical, Gauge, MapPin, TestTube2 } from "lucide-react";
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

const COLORS = ["#f97316", "#ef4444", "#f59e0b", "#fb923c", "#fbbf24", "#fca5a5"];

function cleanRecord(row) {
  return {
    source_row_id: row.source_row_id ?? row.replicate_id ?? "—",
    district: row.district_raw ?? row.district ?? "—",
    site: row.site_raw ?? row.site_id ?? "—",
    insecticide: row.insecticide_tested_raw ?? row.insecticide_tested ?? "—",
    concentration: row.concentration_label_raw ?? row.concentration_label ?? "—",
    dead_24h: row.number_dead_24h ?? "—",
    denominator: row.number_exposed || "missing",
    control_mortality: row.control_mortality || "missing",
    quality_flag: row.quality_flag ?? "needs_review",
  };
}

export default function Resistance() {
  const { data: deathSummary, loading: dL, error: dError } = useFetch(api.resistanceDeathSummary);
  const { data: byDistrict, loading: distL, error: distError } = useFetch(api.resistanceByDistrict);
  const { data: records, loading: rL, error: rError } = useFetch(() => api.resistanceRecords(200));
  const { data: validation, loading: vL, error: vError } = useFetch(api.publicValidation);

  const deathData = (deathSummary?.items ?? []).map((r) => ({
    insecticide: String(r.insecticide_tested_raw ?? "").slice(0, 22),
    mean: parseFloat(r.mean ?? 0),
    max: parseFloat(r.max ?? 0),
    records: parseInt(r.records ?? 0),
  }));
  const tableRows = (records?.items ?? []).map(cleanRecord);
  const districtRows = byDistrict?.items ?? [];
  const evidenceRows = (validation?.items ?? []).filter((row) =>
    ["pi_ir_data", "who_hdx_context", "pi_mosquito_behavior"].includes(row.source_id)
  );
  const topInsecticide = deathData[0]?.insecticide ?? "—";
  const meanDeaths = deathData.length
    ? deathData.reduce((sum, row) => sum + row.mean, 0) / deathData.length
    : 0;

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Vector control context</div>
          <h2>Susceptibility signals</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">IR data loaded</Badge>
          <Badge variant="amber">Lab validation pending</Badge>
        </div>
      </div>

      <SectionCard title="Assay coverage" icon={FlaskConical}>
        <MetricStrip
          items={[
            { label: "Rows", value: rL ? "..." : (records?.total ?? tableRows.length).toLocaleString() },
            { label: "Insecticide groups", value: dL ? "..." : deathData.length },
            { label: "Districts", value: distL ? "..." : districtRows.length },
            { label: "Evidence inputs", value: vL ? "..." : evidenceRows.length },
          ]}
        />
      </SectionCard>

      <div className="insight-grid">
        <div className="insight-card"><TestTube2 size={17} /><span>Largest test group</span><strong>{topInsecticide}</strong></div>
        <div className="insight-card"><Gauge size={17} /><span>Best current use</span><strong>Screening signal</strong></div>
        <div className="insight-card"><MapPin size={17} /><span>Top district</span><strong>{districtRows[0]?.value ?? "—"}</strong></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="24h deaths by insecticide" icon={FlaskConical}>
          <div className="card-body">
            <ChartState loading={dL} error={dError} rows={deathData} empty="No death summary rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deathData} margin={{ top: 4, right: 8, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis
                      dataKey="insecticide"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }}
                    />
                    <Bar dataKey="mean" name="Mean deaths" radius={[4, 4, 0, 0]}>
                      {deathData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="District distribution" icon={MapPin}>
          <div className="card-body">
            <ChartState loading={distL} error={distError} rows={districtRows} empty="No district resistance rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={districtRows.slice(0, 12)}
                    margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="value" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="count" name="Records" radius={[4, 4, 0, 0]} fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartState>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Insecticide summary" icon={FlaskConical}>
        <ChartState loading={dL} error={dError} rows={deathSummary?.items ?? []} empty="No death summary table rows loaded.">
          <DataTable
            rows={deathSummary?.items ?? []}
            columns={["insecticide_tested_raw", "records", "mean", "min", "max"]}
          />
        </ChartState>
      </SectionCard>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Record explorer" icon={FlaskConical}>
          <ChartState loading={rL} error={rError} rows={tableRows} empty="No resistance records loaded.">
            <DataTable
              rows={tableRows}
              columns={["source_row_id", "district", "site", "insecticide", "concentration", "dead_24h"]}
            />
          </ChartState>
        </SectionCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Control-context evidence inputs" icon={Database}>
          <ChartState loading={vL} error={vError} rows={evidenceRows} empty="No resistance evidence registry loaded.">
            <DataTable
              rows={evidenceRows}
              maxRows={6}
              columns={["source_name", "status", "records_or_files", "model_use", "frontend_use", "limitation"]}
            />
          </ChartState>
        </SectionCard>
      </div>
    </div>
  );
}
