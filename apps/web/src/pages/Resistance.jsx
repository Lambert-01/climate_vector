import React from "react";
import { FlaskConical } from "lucide-react";
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
import { AlertBanner, ChartState, DataTable, SectionCard } from "../components/UI";

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

  const deathData = (deathSummary?.items ?? []).map((r) => ({
    insecticide: String(r.insecticide_tested_raw ?? "").slice(0, 22),
    mean: parseFloat(r.mean ?? 0),
    max: parseFloat(r.max ?? 0),
    records: parseInt(r.records ?? 0),
  }));
  const tableRows = (records?.items ?? []).map(cleanRecord);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Insecticide Resistance Tests</h2>
        <p>Preliminary resistance-test records from IR_data.xls</p>
      </div>

      <AlertBanner
        type="warning"
        title="Validation required before interpretation"
        message="Denominator (likely 25), test protocol, control mortality, species cleaning, dates, and GPS must be confirmed by PI/lab before resistance status can be assigned."
      />

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Mean 24h Deaths by Insecticide" icon={FlaskConical}>
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

        <SectionCard title="Tests by District" icon={FlaskConical}>
          <div className="card-body">
            <ChartState loading={distL} error={distError} rows={byDistrict?.items ?? []} empty="No district resistance rows available.">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(byDistrict?.items ?? []).slice(0, 12)}
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

      <SectionCard title="Death Summary by Insecticide" icon={FlaskConical}>
        <ChartState loading={dL} error={dError} rows={deathSummary?.items ?? []} empty="No death summary table rows loaded.">
          <DataTable
            rows={deathSummary?.items ?? []}
            columns={["insecticide_tested_raw", "records", "mean", "min", "max"]}
          />
        </ChartState>
      </SectionCard>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Resistance Records (first 200)" icon={FlaskConical}>
          <ChartState loading={rL} error={rError} rows={tableRows} empty="No resistance records loaded.">
            <DataTable
              rows={tableRows}
              columns={["source_row_id", "district", "site", "insecticide", "concentration", "dead_24h", "denominator", "control_mortality", "quality_flag"]}
            />
          </ChartState>
        </SectionCard>
      </div>
    </div>
  );
}
