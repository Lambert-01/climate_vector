import React, { useMemo, useState } from "react";
import {
  Activity, Bug, Database, Droplets, Download, Globe2, MapPin, Search, Shield,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, SectionCard, SkeletonChart } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";
import { downloadCsv } from "../utils/exports";

const COLORS = ["#0d9488", "#0b6b77", "#2dd4bf", "#14b8a6", "#5eead4", "#99f6e4", "#99f6e4"];
const PIE_COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

function cleanRecord(row) {
  const dateParts = [row.day_only, row.month, row.year].filter(Boolean).join("/");
  const dayLabel = row.day_only ? `Day ${String(row.day_only).replace(/\.0$/, "")}` : "Date queue";
  return {
    source_row_id: row.source_row_id ?? row.observation_id ?? "—",
    district: row.district_raw ?? row.district ?? "—",
    site: row.site_raw ?? row.site_name ?? row.visit_id ?? "—",
    species: row.anopheles_species_raw ?? row.species_clean ?? row.species_raw ?? "—",
    breeding_source: row.origin_larvae_collection_raw ?? row.breeding_source_context ?? row.breeding_site_type_raw ?? "—",
    breeding_site_type: row.breeding_site_type_raw ?? row.habitat_type ?? "—",
    collection_date: (row.collection_date ?? row.visit_date ?? dateParts) || dayLabel,
    quality_flag: row.quality_flag ?? "needs_review",
  };
}

function VectorGroupCard({ label, count, icon: Icon, color, relevance, priority }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{relevance}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
        <Badge variant={priority === "high" ? "red" : priority === "moderate" ? "amber" : "gray"}>{priority}</Badge>
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, dataKey = "count", nameKey = "value", height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 12, left: 60, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={55} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={14}>
          {data.slice(0, 10).map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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

  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [activeView, setActiveView] = useState("summary");

  const tableRows = (records?.items ?? []).map(cleanRecord);
  const districtRows = byDistrict?.items ?? [];
  const speciesRows = bySpecies?.items ?? [];
  const breedingRows = byBreeding?.items ?? [];
  const evidenceRows = (validation?.items ?? []).filter((row) =>
    ["pi_mosquito_behavior", "gbif_vector_occurrences", "chirps_daily", "worldclim_baseline"].includes(row.source_id)
  );
  const vectorContext = intelligence?.vector_context?.items ?? [];
  const taxonomyRows = taxonomy?.items ?? [];

  const aedesCount = Number(intelligence?.summary?.aedes_records ?? 0);
  const culexCount = Number(intelligence?.summary?.culex_records ?? 0);
  const totalRecords = records?.total ?? tableRows.length;

  const districts = useMemo(() => [...new Set(tableRows.map((r) => r.district).filter(Boolean))].sort(), [tableRows]);
  const speciesList = useMemo(() => [...new Set(tableRows.map((r) => r.species).filter(Boolean))].sort(), [tableRows]);

  const filteredRecords = tableRows.filter((r) => {
    const matchesSearch = !searchQuery || Object.values(r).some((v) => String(v).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDistrict = districtFilter === "all" || r.district === districtFilter;
    const matchesSpecies = speciesFilter === "all" || r.species === speciesFilter;
    return matchesSearch && matchesDistrict && matchesSpecies;
  });

  const vectorGroupPie = useMemo(() => {
    const groups = {};
    vectorContext.forEach((v) => { groups[v.vector_group] = (groups[v.vector_group] ?? 0) + (v.records ?? 0); });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [vectorContext]);

  const districtRanking = useMemo(() => [...districtRows].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 10), [districtRows]);

  return (
    <div className="page">
      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Vector Evidence</h2>
          <div className="page-subtitle">Aedes evidence for the dengue pilot with legacy vector-surveillance context</div>
          <div className="page-header-badges">
            <Badge variant="green">PI ecology loaded</Badge>
            <Badge variant="blue">GBIF regional context</Badge>
            <Badge variant="teal">{totalRecords.toLocaleString()} records</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename="arborisk_vector_evidence"
            csvRows={filteredRecords}
            jsonData={{ districts: districtRows, species: speciesRows, breeding: breedingRows, taxonomy: taxonomyRows }}
          />
        </div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Vector evidence views">
        {[["summary", "Interpretation"], ["habitats", "Breeding sources"], ["context", "Regional context"], ["records", "PI records"]].map(([id, label]) => (
          <button key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}>{label}</button>
        ))}
      </div>

      {activeView === "summary" && (
        <div className="evidence-brief">
          <div><span>Primary interpretation</span><strong>Regional Aedes occurrence supports pilot targeting, not local dengue transmission claims.</strong></div>
          <div><Badge variant="red">Priority</Badge><span>Deploy standardized Aedes traps and larval-source surveys at approved sentinel sites.</span></div>
        </div>
      )}

      {/* ── VECTOR GROUP CARDS ── */}
      {activeView === "summary" && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
        <VectorGroupCard label="Aedes" count={aedesCount} icon={Bug} color="#0d9488" relevance="Dengue/chikungunya/Zika/yellow fever" priority="high" />
        <VectorGroupCard label="Other public vectors" count={culexCount} icon={Bug} color="#f59e0b" relevance="Future scale context" priority="secondary" />
        <VectorGroupCard label="Legacy PI ecology" count={totalRecords} icon={Bug} color="#3b82f6" relevance="Field-infrastructure evidence; not dengue surveillance" priority="context-only" />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {/* Donut: vector group composition */}
        <SectionCard title="Vector group composition" icon={Bug}>
          <ChartState loading={iL} rows={vectorGroupPie} empty="No vector group data.">
            <div style={{ padding: "12px 16px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={vectorGroupPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {vectorGroupPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
        </SectionCard>

        {/* Horizontal bar: species records */}
        <SectionCard title="Records by species" icon={Activity}>
          <ChartState loading={sL} rows={speciesRows} empty="No species data.">
            <div style={{ padding: "0 8px" }}>
              <HorizontalBarChart data={speciesRows} height={200} />
            </div>
          </ChartState>
        </SectionCard>

        {/* District ranking */}
        <SectionCard title="District ranking" icon={MapPin}>
          <ChartState loading={dL} rows={districtRanking} empty="No district data.">
            <div style={{ padding: "0 8px" }}>
              <HorizontalBarChart data={districtRanking} height={200} />
            </div>
          </ChartState>
        </SectionCard>
      </div>
      </>}

      {/* ── BREEDING SOURCE GRID ── */}
      {activeView === "habitats" && <>
      <SectionCard title="Breeding source distribution" icon={Droplets}>
        <ChartState loading={bL} rows={breedingRows} empty="No breeding source data.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, padding: "14px 16px" }}>
            {breedingRows.slice(0, 8).map((b, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{b.count}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginTop: 2 }}>{b.value}</div>
              </div>
            ))}
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />
      </>}

      {/* ── EVIDENCE QUALITY MATRIX ── */}
      {activeView === "context" && <>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Great Lakes vector occurrence" icon={Globe2}>
          <ChartState loading={iL} rows={vectorContext} empty="No regional context.">
            <DataTable
              rows={vectorContext}
              maxRows={6}
              columns={["species", "vector_group", "records", "countries", "top_country"]}
            />
          </ChartState>
        </SectionCard>

        <SectionCard title="Vector group classification" icon={Bug}>
          <ChartState loading={tL} rows={taxonomyRows} empty="No taxonomy data.">
            <div style={{ padding: "12px 16px", display: "grid", gap: 8 }}>
              {taxonomyRows.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{t.vector_group}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.arboviral_relevance}</div>
                  </div>
                  <Badge variant={t.surveillance_priority === "high" ? "red" : t.surveillance_priority === "moderate" ? "amber" : "gray"}>
                    {t.surveillance_priority}
                  </Badge>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>
      </div>
      </>}

      {/* ── PI ECOLOGY EXPLORER ── */}
      {activeView === "records" && <>
      <SectionCard
        title="PI ecology explorer"
        icon={Activity}
        action={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search records…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "5px 8px 5px 26px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", width: 140, outline: "none" }}
              />
            </div>
            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} style={{ padding: "5px 8px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", outline: "none" }}>
              <option value="all">All districts</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)} style={{ padding: "5px 8px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", outline: "none" }}>
              <option value="all">All species</option>
              {speciesList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => downloadCsv(`arborisk_ecology_${new Date().toISOString().slice(0,10)}.csv`, filteredRecords)} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 600, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Download size={12} /> CSV
            </button>
          </div>
        }
      >
        <ChartState loading={rL} rows={filteredRecords} empty="No records match your filter.">
          <div style={{ padding: "6px 16px 4px", fontSize: 11, color: "var(--text-muted)" }}>
            {filteredRecords.length} of {tableRows.length} records
          </div>
          <DataTable
            rows={filteredRecords}
            columns={["source_row_id", "district", "site", "species", "breeding_source", "breeding_site_type", "collection_date", "quality_flag"]}
          />
        </ChartState>
      </SectionCard>
      </>}
    </div>
  );
}
