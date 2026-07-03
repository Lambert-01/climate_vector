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
import { AlertBanner, DataTable, SectionCard, Spinner } from "../components/UI";

const COLORS = ["#f97316", "#ef4444", "#f59e0b", "#fb923c", "#fbbf24", "#fca5a5"];

export default function Resistance() {
  const { data: byInsecticide, loading: iL } = useFetch(api.resistanceByInsecticide);
  const { data: deathSummary, loading: dL } = useFetch(api.resistanceDeathSummary);
  const { data: byDistrict, loading: distL } = useFetch(api.resistanceByDistrict);
  const { data: records, loading: rL } = useFetch(() => api.resistanceRecords(200));

  const deathData = (deathSummary?.items ?? []).map((r) => ({
    insecticide: String(r.insecticide_tested_raw ?? "").slice(0, 22),
    mean: parseFloat(r.mean ?? 0),
    max: parseFloat(r.max ?? 0),
    records: parseInt(r.records ?? 0),
  }));

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
            {dL ? <Spinner /> : deathData.length ? (
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
            ) : <div className="empty">No death summary data.</div>}
          </div>
        </SectionCard>

        <SectionCard title="Tests by District" icon={FlaskConical}>
          <div className="card-body">
            {distL ? <Spinner /> : (
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
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Death Summary by Insecticide" icon={FlaskConical}>
        {dL ? <Spinner /> : (
          <DataTable
            rows={deathSummary?.items ?? []}
            columns={["insecticide_tested_raw", "records", "mean", "min", "max"]}
          />
        )}
      </SectionCard>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Resistance Records (first 200)" icon={FlaskConical}>
          {rL ? <Spinner /> : (
            <DataTable
              rows={records?.items ?? []}
              columns={["source_row_id", "district_raw", "site_raw", "insecticide_tested_raw", "concentration_label_raw", "number_dead_24h", "mortality_rate_raw", "quality_flag"]}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
