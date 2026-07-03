import React from "react";
import { Activity } from "lucide-react";
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

const COLORS = ["#0d9488", "#0b6b77", "#2dd4bf", "#14b8a6", "#5eead4", "#99f6e4"];

function BarChartCard({ title, icon, data, dataKey = "count", nameKey = "value" }) {
  return (
    <SectionCard title={title} icon={icon}>
      <div className="card-body">
        {!data?.length ? (
          <div className="empty">No data.</div>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 12)} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                <XAxis
                  dataKey={nameKey}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }}
                />
                <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                  {data.slice(0, 12).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function Mosquito() {
  const { data: byDistrict, loading: dL } = useFetch(api.mosquitoByDistrict);
  const { data: bySpecies, loading: sL } = useFetch(api.mosquitoBySpecies);
  const { data: byBreeding, loading: bL } = useFetch(api.mosquitoByBreedingSite);
  const { data: records, loading: rL } = useFetch(() => api.mosquitoRecords(200));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Mosquito Data</h2>
        <p>Preliminary ecology records from field surveys</p>
      </div>

      <AlertBanner
        type="warning"
        title="Preliminary data"
        message="Missing full dates, GPS coordinates, mosquito counts, and sampling effort. Descriptive summaries only."
      />

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {dL ? <Spinner /> : (
          <BarChartCard
            title="Records by District"
            icon={Activity}
            data={byDistrict?.items ?? []}
          />
        )}
        {sL ? <Spinner /> : (
          <BarChartCard
            title="Anopheles Species"
            icon={Activity}
            data={bySpecies?.items ?? []}
          />
        )}
        {bL ? <Spinner /> : (
          <BarChartCard
            title="Breeding Site Types"
            icon={Activity}
            data={byBreeding?.items ?? []}
          />
        )}
      </div>

      <SectionCard title="Mosquito Records (first 200)" icon={Activity}>
        {rL ? <Spinner /> : (
          <DataTable
            rows={records?.items ?? []}
            columns={["source_row_id", "district_raw", "site_raw", "anopheles_species_raw", "breeding_site_type_raw", "quality_flag"]}
          />
        )}
      </SectionCard>
    </div>
  );
}
