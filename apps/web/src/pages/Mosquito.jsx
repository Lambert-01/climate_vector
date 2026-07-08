import React from "react";
import { Activity, Bug, Database, Droplets, Globe2, MapPin } from "lucide-react";
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
import { Badge, ChartState, DataTable, InterpretationPanel, MetricStrip, SectionCard } from "../components/UI";

const COLORS = ["#0d9488", "#0b6b77", "#2dd4bf", "#14b8a6", "#5eead4", "#99f6e4"];

function cleanRecord(row) {
  const dateParts = [row.day_only, row.month, row.year].filter(Boolean).join("/");
  const dayLabel = row.day_only ? `Day ${String(row.day_only).replace(/\.0$/, "")}` : "Date queue";
  return {
    source_row_id: row.source_row_id ?? row.observation_id ?? "—",
    district: row.district_raw ?? row.district ?? "—",
    site: row.site_raw ?? row.site_name ?? row.visit_id ?? "—",
    species: row.anopheles_species_raw ?? row.species_clean ?? row.species_raw ?? "—",
    breeding_site_type: row.breeding_site_type_raw ?? row.habitat_type ?? "—",
    collection_date: (row.collection_date ?? row.visit_date ?? dateParts) || dayLabel,
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
  const { data: validation, loading: vL, error: vError } = useFetch(api.publicValidation);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);
  const { data: taxonomy, loading: tL, error: tError } = useFetch(api.arboviralVectorTaxonomy);
  const tableRows = (records?.items ?? []).map(cleanRecord);
  const districtRows = byDistrict?.items ?? [];
  const speciesRows = bySpecies?.items ?? [];
  const breedingRows = byBreeding?.items ?? [];
  const evidenceRows = (validation?.items ?? []).filter((row) =>
    ["pi_mosquito_behavior", "gbif_vector_occurrences", "chirps_daily", "worldclim_baseline"].includes(row.source_id)
  );
  const topDistrict = districtRows[0]?.value ?? "—";
  const topHabitat = breedingRows[0]?.value ?? "—";
  const vectorContext = intelligence?.vector_context?.items ?? [];
  const taxonomyRows = taxonomy?.items ?? [];

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Regional vector evidence</div>
          <h2>Aedes, Culex, Anopheles and Rwanda ecology PoC</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">PI ecology loaded</Badge>
          <Badge variant="blue">GBIF regional context</Badge>
        </div>
      </div>

      <SectionCard title="Vector evidence coverage" icon={Database}>
        <MetricStrip
          items={[
            { label: "Records", value: rL ? "..." : (records?.total ?? tableRows.length).toLocaleString() },
            { label: "Aedes records", value: iL ? "..." : Number(intelligence?.summary?.aedes_records ?? 0).toLocaleString() },
            { label: "Culex records", value: iL ? "..." : Number(intelligence?.summary?.culex_records ?? 0).toLocaleString() },
            { label: "Species labels", value: sL ? "..." : speciesRows.length },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="Vector interpretation"
        verdict="The system now separates arboviral vectors from legacy malaria-vector infrastructure: Aedes/Culex guide the pivot, while Rwanda Anopheles ecology proves surveillance capacity."
        tone="teal"
        confidence="Regional GBIF occurrence is context-only; local Aedes/Culex field surveillance is the validation step."
        items={[
          {
            label: "Arboviral focus",
            value: `${intelligence?.summary?.aedes_records ?? 0} Aedes · ${intelligence?.summary?.culex_records ?? 0} Culex`,
            note: "Supports dengue/chikungunya/Zika/yellow fever and RVF preparedness framing.",
          },
          {
            label: "Rwanda PoC",
            value: `${records?.total ?? tableRows.length} PI ecology rows`,
            note: "Shows habitat and field data infrastructure already exists.",
          },
          {
            label: "Field next",
            value: "Ovitraps, containers, adult traps",
            note: "Needed to convert context into local arboviral vector evidence.",
          },
        ]}
      />

      <div className="insight-grid">
        <div className="insight-card"><MapPin size={17} /><span>Top district</span><strong>{topDistrict}</strong></div>
        <div className="insight-card"><Droplets size={17} /><span>Dominant habitat</span><strong>{topHabitat}</strong></div>
        <div className="insight-card"><Activity size={17} /><span>Dominant species context</span><strong>{speciesRows[0]?.value ?? "—"}</strong></div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <BarChartCard title="District distribution" icon={MapPin} data={districtRows} loading={dL} error={dError} />
        <BarChartCard title="Species context" icon={Activity} data={speciesRows} loading={sL} error={sError} />
        <BarChartCard title="Habitat distribution" icon={Droplets} data={breedingRows} loading={bL} error={bError} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Great Lakes vector occurrence context" icon={Globe2}>
          <ChartState loading={iL} error={iError} rows={vectorContext} empty="No regional vector context loaded.">
            <DataTable
              rows={vectorContext}
              maxRows={8}
              columns={["species", "vector_group", "records", "countries", "top_country", "year_start", "year_end", "use_boundary"]}
            />
          </ChartState>
        </SectionCard>

        <SectionCard title="Arboviral vector groups" icon={Bug}>
          <ChartState loading={tL} error={tError} rows={taxonomyRows} empty="No vector taxonomy loaded.">
            <DataTable
              rows={taxonomyRows}
              maxRows={5}
              columns={["vector_group", "arboviral_relevance", "surveillance_priority", "current_evidence", "pilot_need"]}
            />
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard title="Rwanda PI ecology record explorer" icon={Activity}>
        <ChartState loading={rL} error={rError} rows={tableRows} empty="No mosquito records loaded.">
          <DataTable
            rows={tableRows}
            columns={["source_row_id", "district", "site", "species", "breeding_site_type", "collection_date"]}
          />
        </ChartState>
      </SectionCard>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="Ecology evidence inputs" icon={Database}>
          <ChartState loading={vL} error={vError} rows={evidenceRows} empty="No ecology evidence registry loaded.">
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
