import React from "react";
import {
  Activity, BarChart3, CheckCircle2, CloudRain,
  Database, FlaskConical, Globe2, MapPin,
  ShieldCheck, Target, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  Badge, ChartState, MetricStrip, PhaseTimeline,
  ProgressBar, PulseIndicator, SectionCard, StatCard,
  SkeletonStatCard, SkeletonLine,
} from "../components/UI";

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function fmt(v) { return Number(v ?? 0).toLocaleString(); }

const PHASES = [
  { label: "MVP Build",        sub: "Current data · done",    status: "done" },
  { label: "Proposal Polish",  sub: "Docs + diagrams",        status: "active" },
  { label: "Pilot Collection", sub: "Aedes traps + surveys",  status: "pending" },
  { label: "Partner Data",     sub: "Dengue outcomes",        status: "pending" },
  { label: "Validation",       sub: "Model + field",          status: "pending" },
];

const EVIDENCE_NOW = [
  { name: "mosquito_behavior_raw.xls", desc: "3,547 ecology rows — breeding sites, habitats, agricultural exposure", badge: "green", tag: "PI primary" },
  { name: "IR_data.xls",               desc: "3,547 susceptibility rows — insecticide, concentration, 24h deaths",  badge: "green", tag: "PI primary" },
  { name: "NASA POWER",                desc: "30 Rwanda districts × 4 years daily climate (2021–2025)",             badge: "blue",  tag: "Public" },
  { name: "GBIF vector occurrence",    desc: "329 Aedes + 51 Culex regional records across Great Lakes",            badge: "blue",  tag: "Public" },
  { name: "ERA5-Land monthly",         desc: "Rwanda bbox rainfall, temperature, dewpoint, runoff baseline",        badge: "blue",  tag: "Public" },
  { name: "33 sentinel sites",         desc: "Lecturer WKT coordinates — mapped and operational for MVP",           badge: "teal",  tag: "Spatial" },
];

export default function Overview() {
  const { data: stats,    loading: sL  } = useFetch(api.stats);
  const { data: dbStatus, loading: dbL } = useFetch(api.databaseStatus);
  const { data: climate,  loading: cL  } = useFetch(api.climateSummary);
  const { data: features, loading: fL  } = useFetch(api.publicDistrictFeatures);
  const { data: valid,    loading: vL  } = useFetch(api.publicValidation);
  const { data: risk,     loading: rL  } = useFetch(() => api.districtRisk(30));
  const { data: gbif               } = useFetch(() => api.publicGbif(1));
  const { data: readiness          } = useFetch(api.readiness);

  const validRows   = valid?.items ?? [];
  const featureRows = features?.items ?? [];
  const readyItems  = (readiness?.items ?? []).filter(r => String(r.ready).toLowerCase() === "true");
  const readyPct    = readiness?.items?.length ? Math.round((readyItems.length / readiness.items.length) * 100) : 0;
  const usableSrc   = validRows.filter(r => ["usable","validated","downloaded"].some(k => String(r.status).includes(k))).length;

  const climateRows = (climate?.items ?? []).slice(-60).map(r => ({
    date: r.date ?? r.DATE ?? "",
    rain: n(r.rainfall_mm ?? r.PRECTOTCORR),
    temp: n(r.tmean_c ?? r.T2M),
  }));

  const topDistricts = (risk?.items ?? []).slice(0, 8).map(r => ({
    district: String(r.district ?? "").replace(/\b\w/g, c => c.toUpperCase()),
    suitability: n(r.suitability_index),
    risk: r.risk_level,
  }));

  const RISK_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#0d9488" };

  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="page-hero">
        <div className="eyebrow">African Great Lakes · DengueEW-GL v1.1</div>
        <h2>Climate-informed dengue preparedness</h2>
        <p>
          A proposal-ready digital foundation linking climate evidence, Aedes occurrence context,
          sentinel operations, community reporting, mosquito-pool genomics and reviewable response actions.
        </p>
        <div className="hero-badges">
          <Badge variant="green">Ready for proposal demo</Badge>
          <Badge variant="amber">Descriptive · not validated prediction</Badge>
          <Badge variant="blue">Pilot validation built in</Badge>
          <Badge variant="teal">Nexa PoC eligible</Badge>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
          <PulseIndicator label="System live" active />
          <PulseIndicator label={dbL ? "Checking DB…" : dbStatus?.connected ? "Database connected" : "DB offline"} active={!!dbStatus?.connected} />
        </div>

        <div className="page-hero-kpis">
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{sL ? <span className="skeleton skeleton-line w40" style={{ display: "inline-block", width: 60, height: 24 }} /> : fmt(stats?.mosquito_observations)}</div>
            <div className="page-hero-kpi-label">Ecology rows</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{sL ? <span className="skeleton skeleton-line w40" style={{ display: "inline-block", width: 60, height: 24 }} /> : fmt(stats?.resistance_tests)}</div>
            <div className="page-hero-kpi-label">Susceptibility rows</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">33</div>
            <div className="page-hero-kpi-label">Sentinel sites mapped</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{vL ? <span className="skeleton skeleton-line w40" style={{ display: "inline-block", width: 40, height: 24 }} /> : usableSrc}</div>
            <div className="page-hero-kpi-label">Usable evidence sources</div>
          </div>
        </div>
      </div>

      {/* ── KPI TILES ── */}
      <div className="kpi-row">
        {sL ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />) : (
          <>
            <div className="kpi-tile">
              <div className="kpi-tile-accent teal" />
              <div className="kpi-tile-label">PI ecology records</div>
              <div className="kpi-tile-value">{fmt(stats?.mosquito_observations)}</div>
              <div className="kpi-tile-sub">mosquito_behavior_raw.xls · Rwanda PoC</div>
              <Activity size={48} className="kpi-tile-icon" />
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-accent amber" />
              <div className="kpi-tile-label">Susceptibility assay rows</div>
              <div className="kpi-tile-value">{fmt(stats?.resistance_tests)}</div>
              <div className="kpi-tile-sub">IR_data.xls · vector-control context</div>
              <FlaskConical size={48} className="kpi-tile-icon" />
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-accent blue" />
              <div className="kpi-tile-label">District climate records</div>
              <div className="kpi-tile-value">{fmt(featureRows.length)}</div>
              <div className="kpi-tile-sub">30 Rwanda districts · NASA POWER</div>
              <CloudRain size={48} className="kpi-tile-icon" />
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-accent green" />
              <div className="kpi-tile-label">GBIF vector records</div>
              <div className="kpi-tile-value">{fmt(gbif?.count)}</div>
              <div className="kpi-tile-sub">Aedes + Culex · Great Lakes region</div>
              <Globe2 size={48} className="kpi-tile-icon" />
            </div>
          </>
        )}
      </div>

      {/* ── READINESS PROGRESS ── */}
      <SectionCard title="System readiness" icon={ShieldCheck}>
        <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
          <ProgressBar label="Data readiness — available evidence groups" value={readyPct} color="teal" />
          <ProgressBar label="Evidence sources loaded and usable" value={usableSrc} max={18} color="green" />
          <ProgressBar label="Rwanda district climate coverage" value={featureRows.length} max={30} color="blue" />
        </div>
        <MetricStrip items={[
          { label: "Ready groups",    value: readyItems.length },
          { label: "Pilot fields",    value: (readiness?.items?.length ?? 0) - readyItems.length },
          { label: "Usable sources",  value: usableSrc },
          { label: "Readiness %",     value: `${readyPct}%` },
        ]} />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── CHARTS ── */}
      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="Gasabo/Kigali rainfall proxy — recent 60 days" icon={CloudRain}>
          <ChartState loading={cL} rows={climateRows} empty="No climate rows available.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={climateRows} margin={{ top: 6, right: 12, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={9} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d8e2e4" }} />
                    <Area type="monotone" dataKey="rain" name="Rainfall mm" stroke="#0d9488" strokeWidth={2} fill="url(#ovRain)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Rwanda district preparedness proxy — top 8" icon={Target}>
          <ChartState loading={rL} rows={topDistricts} empty="No district suitability rows available.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDistricts} margin={{ top: 6, right: 12, left: -22, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" vertical={false} />
                    <XAxis dataKey="district" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d8e2e4" }} />
                    <Bar dataKey="suitability" name="Suitability index" radius={[5, 5, 0, 0]}>
                      {topDistricts.map((r, i) => (
                        <Cell key={i} fill={RISK_COLOR[r.risk] ?? RISK_COLOR.low} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      {/* ── IMPLEMENTATION ROADMAP ── */}
      <SectionCard title="Implementation roadmap — 5 phases" icon={Target}>
        <PhaseTimeline phases={PHASES} />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* ── WHAT WE HAVE NOW ── */}
      <div className="section-label"><Database size={13} /> Evidence integrated now</div>
      <div className="source-chip-grid" style={{ padding: 0, marginBottom: 22 }}>
        {EVIDENCE_NOW.map(src => (
          <div className="source-chip" key={src.name}>
            <div className="source-chip-status">
              <span className="source-chip-name">{src.name}</span>
              <Badge variant={src.badge}>{src.tag}</Badge>
            </div>
            <span className="source-chip-meta">{src.desc}</span>
          </div>
        ))}
      </div>

      {/* ── POLICY CARDS ── */}
      <div className="section-label"><Zap size={13} /> What this system supports</div>
      <div className="pilot-grid" style={{ marginBottom: 22 }}>
        <div className="pilot-card ready">
          <div className="pilot-card-phase">Use now</div>
          <div className="pilot-card-title">District field verification prioritization</div>
          <div className="pilot-card-body">Climate, vector ecology, control context, and public evidence combined for review. Identifies which districts to inspect first.</div>
          <Badge variant="green">Operational</Badge>
        </div>
        <div className="pilot-card ready">
          <div className="pilot-card-phase">Use now</div>
          <div className="pilot-card-title">Proposal and funding readiness tracking</div>
          <div className="pilot-card-body">Shows exactly which data must be collected before formal prediction claims. Directly supports Nexa PoC application narrative.</div>
          <Badge variant="green">Operational</Badge>
        </div>
        <div className="pilot-card active">
          <div className="pilot-card-phase">Pilot required</div>
          <div className="pilot-card-title">Validated outbreak preparedness model</div>
          <div className="pilot-card-body">Requires prospective Aedes observations, approved dengue outcomes, genomic results, sampling effort and protocol confirmation.</div>
          <Badge variant="amber">Phase 3 pilot</Badge>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stats-grid">
        {sL ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />) : (
          <>
            <StatCard icon={Activity}    label="Mosquito ecology rows"    value={fmt(stats?.mosquito_observations)} sub="Rwanda PoC vector ecology"            color="teal"   accent="teal" />
            <StatCard icon={FlaskConical} label="Susceptibility rows"     value={fmt(stats?.resistance_tests)}      sub="Vector-control context · IR_data.xls"  color="orange" accent="amber" />
            <StatCard icon={MapPin}       label="Sentinel sites"          value="33"                                sub="Lecturer WKT coordinates · mapped"     color="blue"   accent="blue" />
            <StatCard icon={CheckCircle2} label="Usable evidence sources" value={usableSrc}                         sub={`of ${validRows.length} total indexed`} color="green"  accent="green" />
          </>
        )}
      </div>

    </div>
  );
}
