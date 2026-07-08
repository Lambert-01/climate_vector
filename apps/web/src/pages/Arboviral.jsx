import React from "react";
import {
  ClipboardCheck,
  Database,
  Biohazard,
  Bug,
  CloudRain,
  Globe2,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
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
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(value) {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("usable") || text.includes("available") || text.includes("validated") || text.includes("mapping")) return "green";
  if (text.includes("partial") || text.includes("context") || text.includes("planned") || text.includes("downloaded")) return "amber";
  return "red";
}

function IndexGauge({ label, value, level, note }) {
  const pct = Math.round(n(value) * 100);
  const color =
    level === "high" || level === "watch"
      ? "#ef4444"
      : level === "moderate" || level === "monitor"
      ? "#f59e0b"
      : "#0d9488";
  return (
    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-light)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
        <Badge variant={level === "high" || level === "watch" ? "red" : level === "moderate" || level === "monitor" ? "amber" : "green"}>
          {title(level)}
        </Badge>
      </div>
      <div className="signal-meter">
        <i style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{note}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
    </div>
  );
}

function GovernanceStatusDot({ status }) {
  const map = {
    not_requested: { cls: "missing", label: "Not requested" },
    pilot_required: { cls: "partial", label: "Pilot required" },
    partial: { cls: "partial", label: "Partial" },
    requested: { cls: "partial", label: "Requested" },
    approved: { cls: "ready", label: "Approved" },
    received: { cls: "ready", label: "Received" },
    validated: { cls: "ready", label: "Validated" },
    integrated: { cls: "ready", label: "Integrated" },
  };
  const s = map[status] ?? { cls: "missing", label: title(status) };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className={`readiness-dot ${s.cls}`} />
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
    </div>
  );
}

export default function Arboviral() {
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);
  const { data: overview, loading: oL, error: oError } = useFetch(api.arboviralOverview);
  const { data: climate, loading: cL, error: cError } = useFetch(api.arboviralClimate);
  const { data: vectors, loading: vL, error: vError } = useFetch(api.arboviralVectors);
  const { data: profiles, loading: pL, error: pError } = useFetch(api.arboviralDiseaseProfiles);
  const { data: readiness, loading: rL, error: rError } = useFetch(api.arboviralReadiness);
  const { data: scoring, loading: scL, error: scError } = useFetch(api.arboviralScoring);
  const { data: taxonomy, loading: tL, error: tError } = useFetch(api.arboviralVectorTaxonomy);
  const { data: governance, loading: gL, error: gError } = useFetch(api.arboviralPartnerGovernance);

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
  const vectorChart = vectorRows.map((row) => ({ species: row.species, records: n(row.records) }));

  const climateSuiteRows = scoring?.climate_suitability_scores ?? [];
  const aedesPrep = scoring?.aedes_preparedness ?? {};
  const rvfWatch = scoring?.rvf_watch ?? {};
  const confidenceData = scoring?.data_confidence ?? {};
  const confidenceComponents = confidenceData?.components ?? [];
  const taxonomyRows = taxonomy?.items ?? [];
  const governanceRows = governance?.items ?? [];
  const intelSummary = intelligence?.summary ?? {};
  const validationCards = intelligence?.data_validation_cards ?? [];
  const actionQueue = intelligence?.action_queue ?? [];
  const sourceRegistry = intelligence?.source_registry ?? [];
  const sentinelQuality = intelligence?.sentinel_quality ?? {};
  const wetnessPoints = intelligence?.regional_climate?.top_wetness_points ?? topClimate;

  const climateSuiteChart = climateSuiteRows.map((r) => ({
    location: r.location,
    suitability: n(r.climate_suitability_index),
    level: r.suitability_level,
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

      <section className="intel-command">
        <div className="intel-command-copy">
          <div className="eyebrow">ArboRisk-GL command build</div>
          <h3>{intelligence?.mission ?? "Climate-vector preparedness intelligence"}</h3>
          <p>{intelligence?.governance ?? "Evidence supports preparedness, field verification, and partner coordination."}</p>
        </div>
        <div className="intel-command-grid">
          <div>
            <span>Indexed evidence</span>
            <strong>{iL ? "..." : Number(intelSummary.records_or_files_indexed ?? 0).toLocaleString()}</strong>
          </div>
          <div>
            <span>Mapped sentinels</span>
            <strong>{iL ? "..." : `${intelSummary.mapped_sentinel_sites ?? 0}/${intelSummary.sentinel_sites ?? 0}`}</strong>
          </div>
          <div>
            <span>Ready sources</span>
            <strong>{iL ? "..." : intelSummary.ready_or_usable_sources ?? 0}</strong>
          </div>
          <div>
            <span>Formal gaps</span>
            <strong>{iL ? "..." : intelSummary.formal_or_required_sources ?? 0}</strong>
          </div>
        </div>
      </section>

      <ChartState loading={iL} error={iError} rows={validationCards} empty="No validated dataset bundle loaded.">
        <div className="dataset-command-grid">
          {validationCards.map((card) => (
            <div className="dataset-command-card" key={card.domain}>
              <div className="dataset-command-top">
                <Database size={16} />
                <Badge variant={statusVariant(card.status)}>{title(card.status)}</Badge>
              </div>
              <strong>{card.domain}</strong>
              <div className="dataset-command-value">{Number(card.records ?? 0).toLocaleString()}</div>
              <p>{card.result}</p>
              <small>{card.limitation}</small>
            </div>
          ))}
        </div>
      </ChartState>

      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="Operational action queue" icon={ClipboardCheck}>
          <ChartState loading={iL} error={iError} rows={actionQueue} empty="No operational actions loaded.">
            <div className="action-queue">
              {actionQueue.map((item) => (
                <div className="action-row" key={item.action}>
                  <Badge variant={item.priority === "high" ? "red" : "amber"}>{title(item.priority)}</Badge>
                  <div>
                    <strong>{item.action}</strong>
                    <span>{item.evidence}</span>
                  </div>
                  <small>{item.decision_use}</small>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Sentinel coordinate coverage" icon={MapPin}>
          <ChartState loading={iL} error={iError} rows={[sentinelQuality]} empty="No sentinel quality data loaded.">
            <div className="sentinel-coverage-card">
              <div className="coverage-ring">
                <strong>{Math.round(n(sentinelQuality.coverage_pct))}%</strong>
                <span>mapped</span>
              </div>
              <div>
                <h4>{sentinelQuality.mapped ?? 0} of {sentinelQuality.total ?? 0} lecturer sites mapped</h4>
                <p>{sentinelQuality.quality_note}</p>
                <div className="mini-chip-row">
                  <Badge variant="green">{sentinelQuality.coordinate_source}</Badge>
                  <Badge variant={(sentinelQuality.duplicate_site_names ?? []).length ? "amber" : "green"}>
                    {(sentinelQuality.duplicate_site_names ?? []).length} duplicate names
                  </Badge>
                </div>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      {/* Regional snapshot */}
      <SectionCard title="Regional readiness snapshot" icon={Biohazard}>
        <MetricStrip
          items={[
            { label: "Regional points", value: iL || oL ? "..." : intelSummary.great_lakes_climate_points ?? summary.regional_points ?? 0 },
            { label: "High climate signals", value: iL || oL ? "..." : intelSummary.high_climate_context_points ?? summary.high_climate_context_points ?? 0 },
            { label: "Aedes records", value: iL || oL ? "..." : Number(intelSummary.aedes_records ?? summary.aedes_occurrence_records ?? 0).toLocaleString() },
            { label: "Culex records", value: iL || oL ? "..." : Number(intelSummary.culex_records ?? summary.culex_occurrence_records ?? 0).toLocaleString() },
          ]}
        />
      </SectionCard>

      {/* Scoring indices */}
      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="Preparedness indices" icon={TrendingUp}>
          <ChartState loading={scL} error={scError} rows={[aedesPrep]} empty="Scoring not loaded.">
            <IndexGauge
              label="Aedes-borne preparedness index"
              value={aedesPrep.index}
              level={aedesPrep.level}
              note={`${aedesPrep.aedes_gbif_records ?? 0} GBIF Aedes records · ${aedesPrep.high_climate_points ?? 0} high-climate points`}
            />
            <IndexGauge
              label="RVF One Health watch index"
              value={rvfWatch.index}
              level={rvfWatch.level}
              note={`${rvfWatch.culex_gbif_records ?? 0} Culex records · max 30d rain ${rvfWatch.max_regional_rain30d_mm ?? 0} mm`}
            />
            <IndexGauge
              label="Overall data confidence index"
              value={confidenceData.overall_index}
              level={n(confidenceData.overall_index) >= 0.6 ? "high" : n(confidenceData.overall_index) >= 0.35 ? "moderate" : "low"}
              note="Reflects current data completeness across all evidence domains"
            />
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {aedesPrep.use_boundary}
              </p>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Climate suitability by location" icon={CloudRain}>
          <ChartState loading={scL} error={scError} rows={climateSuiteChart} empty="Climate suitability scores not loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={climateSuiteChart} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="suitability" name="Suitability index" radius={[4, 4, 0, 0]}>
                      {climateSuiteChart.map((row, i) => (
                        <Cell
                          key={i}
                          fill={row.level === "high" ? "#ef4444" : row.level === "moderate" ? "#f59e0b" : "#0d9488"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      {/* Recommended actions from scoring */}
      <ChartState loading={scL} error={scError} rows={[aedesPrep]} empty="">
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <SectionCard title="Aedes preparedness action" icon={Target}>
            <div style={{ padding: "16px" }}>
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55, marginBottom: 12 }}>
                {aedesPrep.recommended_action}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(aedesPrep.data_gaps ?? []).map((gap) => (
                  <Badge key={gap} variant="amber">{gap}</Badge>
                ))}
              </div>
            </div>
          </SectionCard>
          <SectionCard title="RVF One Health action" icon={Target}>
            <div style={{ padding: "16px" }}>
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55, marginBottom: 12 }}>
                {rvfWatch.recommended_action}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(rvfWatch.data_gaps ?? []).map((gap) => (
                  <Badge key={gap} variant="amber">{gap}</Badge>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </ChartState>

      {/* Disease profiles + data governance */}
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

        <SectionCard title="Data governance layers" icon={ShieldCheck}>
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

      {/* Vector taxonomy */}
      <SectionCard title="Vector group taxonomy" icon={Bug} style={{ marginBottom: 20 }}>
        <ChartState loading={tL} error={tError} rows={taxonomyRows} empty="Vector taxonomy not loaded.">
          <DataTable
            rows={taxonomyRows}
            columns={["vector_group", "key_species", "arboviral_relevance", "climate_drivers", "gbif_records_region", "surveillance_priority", "pilot_need"]}
          />
        </ChartState>
      </SectionCard>

      {/* Partner governance */}
      <SectionCard title="Partner data governance" icon={Users} style={{ marginBottom: 20 }}>
        <ChartState loading={gL} error={gError} rows={governanceRows} empty="Partner governance not loaded.">
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {governanceRows.map((row) => (
              <div
                key={row.dataset}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(200px, 1.4fr) minmax(140px, .8fr) minmax(0, 1fr) minmax(0, 1.2fr)",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12.5,
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: 13, marginBottom: 2 }}>{row.dataset}</strong>
                  <span style={{ color: "var(--text-muted)" }}>{row.partner}</span>
                </div>
                <GovernanceStatusDot status={row.governance_status} />
                <span style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>{row.required_for}</span>
                <span style={{ color: "var(--teal-700)", fontWeight: 500 }}>{row.next_step}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {governance?.governance_note}
            </p>
          </div>
        </ChartState>
      </SectionCard>

      <SectionCard title="Full data source registry" icon={Database} style={{ marginBottom: 20 }}>
        <ChartState loading={iL} error={iError} rows={sourceRegistry} empty="No source registry loaded.">
          <DataTable
            rows={sourceRegistry}
            maxRows={18}
            columns={["source_name", "category", "status", "records_or_files", "date_start", "date_end", "frontend_use", "limitation"]}
          />
        </ChartState>
      </SectionCard>

      {/* Data confidence components */}
      <SectionCard title="Data confidence breakdown" icon={ShieldCheck} style={{ marginBottom: 20 }}>
        <ChartState loading={scL} error={scError} rows={confidenceComponents} empty="Confidence components not loaded.">
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {confidenceComponents.map((c) => (
              <div key={c.component} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)" }}>
                <div className={`readiness-dot ${n(c.score) >= 0.7 ? "ready" : n(c.score) >= 0.4 ? "partial" : "missing"}`} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.component}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>{c.note}</span>
                <Badge variant={n(c.score) >= 0.7 ? "green" : n(c.score) >= 0.4 ? "amber" : "red"}>{title(c.status)}</Badge>
                <span style={{ fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: "right" }}>{Math.round(n(c.score) * 100)}%</span>
              </div>
            ))}
          </div>
        </ChartState>
      </SectionCard>

      {/* Climate + vector charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Regional rainfall context" icon={CloudRain}>
          <ChartState loading={cL || iL} error={cError || iError} rows={wetnessPoints} empty="No Great Lakes climate rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wetnessPoints.map((row) => ({ ...row, rain30: n(row.rainfall_latest_30d_mm) }))} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="rain30" name="Latest 30d rainfall mm" radius={[4, 4, 0, 0]}>
                      {wetnessPoints.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

      {/* Tables */}
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
