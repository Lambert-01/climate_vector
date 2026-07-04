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
import { AlertBanner, ChartState, DataTable, SectionCard } from "../components/UI";

const COLORS = ["#0d9488", "#0b6b77", "#2dd4bf", "#14b8a6", "#5eead4", "#99f6e4"];

function cleanRecord(row) {
  const dateParts = [row.day_only, row.month, row.year].filter(Boolean).join("/");
  return {
    source_row_id: row.source_row_id ?? row.observation_id ?? "—",
    district: row.district_raw ?? row.district ?? "—",
    site: row.site_raw ?? row.site_name ?? row.visit_id ?? "—",
    species: row.anopheles_species_raw ?? row.species_clean ?? row.species_raw ?? "—",
    breeding_site_type: row.breeding_site_type_raw ?? row.habitat_type ?? "—",
    collection_date: row.collection_date ?? row.visit_date ?? dateParts || "missing",
    quality_flag: row.quality_flag ?? "needs_review",
  };
}

function BarChartCard({ title, icon, data, loading, error, dataKey = "count", nameKey = "value" }) {
  return (
    <SectionCard title={title} icon={icon}>
      <div className="card-body">
        <ChartState loading={loading} error={error} rows={data} empty="No summary rows available.">
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
        </ChartState>
      </div>
    </SectionCard>
  );
}

export default function Mosquito() {
  const { data: byDistrict, loading: dL, error: dError } = useFetch(api.mosquitoByDistrict);
  const { data: bySpecies, loading: sL, error: sError } = useFetch(api.mosquitoBySpecies);
  const { data: byBreeding, loading: bL, error: bError } = useFetch(api.mosquitoByBreedingSite);
  const { data: records, loading: rL, error: rError } = useFetch(() => api.mosquitoRecords(200));
  const tableRows = (records?.items ?? []).map(cleanRecord);

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
        <BarChartCard title="Records by District" icon={Activity} data={byDistrict?.items ?? []} loading={dL} error={dError} />
        <BarChartCard title="Anopheles Species" icon={Activity} data={bySpecies?.items ?? []} loading={sL} error={sError} />
        <BarChartCard title="Breeding Site Types" icon={Activity} data={byBreeding?.items ?? []} loading={bL} error={bError} />
      </div>

      <SectionCard title="Mosquito Records (first 200)" icon={Activity}>
        <ChartState loading={rL} error={rError} rows={tableRows} empty="No mosquito records loaded.">
          <DataTable
            rows={tableRows}
            columns={["source_row_id", "district", "site", "species", "breeding_site_type", "collection_date", "quality_flag"]}
          />
        </ChartState>
      </SectionCard>
    </div>
  );
}
