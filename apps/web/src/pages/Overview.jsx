import React from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowRight, BellRing, BrainCircuit, CheckCircle2,
  ClipboardCheck, CloudRain, Database, Dna, Droplets, FlaskConical, Map,
  MapPin, Microscope, Radar, ShieldCheck, Smartphone, Target, Thermometer,
  Users,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, PageHeader, SkeletonStatCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const METRIC_ICONS = {
  study_sites: MapPin,
  aedes_records: Activity,
  ovitraps_deployed: CircleIndicator,
  bg_sentinel_deployments: Radar,
  pools_analysed: FlaskConical,
  positive_pools: Dna,
  community_reports: Users,
  alerts_generated: BellRing,
  actions_completed: ClipboardCheck,
};

const METRIC_TONES = {
  study_sites: "blue",
  aedes_records: "teal",
  ovitraps_deployed: "green",
  bg_sentinel_deployments: "blue",
  pools_analysed: "purple",
  positive_pools: "red",
  community_reports: "amber",
  alerts_generated: "orange",
  actions_completed: "green",
};

const RISK_COLOR = { high: "#dc2626", medium: "#d97706", low: "#0d9488" };

function CircleIndicator({ size = 18 }) {
  return (
    <span className="executive-ovitrap-icon" style={{ width: size, height: size }}>
      <span />
    </span>
  );
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function title(value) {
  return String(value ?? "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function metricState(metric) {
  if (["observed", "laboratory_result", "workflow_activity"].includes(metric.state)) {
    return { label: "Recorded", tone: "green" };
  }
  if (metric.state === "candidate_registry") return { label: "Candidate", tone: "blue" };
  if (metric.state === "not_yet_tested") return { label: "Not tested", tone: "gray" };
  return { label: "Pilot pending", tone: "amber" };
}

function ExecutiveMetric({ metric }) {
  const Icon = METRIC_ICONS[metric.key] ?? Database;
  const state = metricState(metric);
  return (
    <div className={`executive-metric executive-tone-${METRIC_TONES[metric.key] ?? "teal"}`}>
      <div className="executive-metric-top">
        <div className="executive-metric-icon"><Icon size={18} /></div>
        <Badge variant={state.tone}>{state.label}</Badge>
      </div>
      <strong>{number(metric.value).toLocaleString()}</strong>
      <span>{metric.label}</span>
      <small>{metric.note}</small>
    </div>
  );
}

function StatusDot({ status }) {
  return <span className={`executive-status-dot is-${status}`} aria-hidden="true" />;
}

function ModuleRow({ icon: Icon, title: moduleTitle, status, statusLabel, metric, note, to }) {
  return (
    <Link to={to} className="executive-module-row">
      <div className={`executive-module-icon is-${status}`}><Icon size={17} /></div>
      <div className="executive-module-copy">
        <strong>{moduleTitle}</strong>
        <span>{note}</span>
      </div>
      <div className="executive-module-state">
        <strong>{metric}</strong>
        <span><StatusDot status={status} />{statusLabel}</span>
      </div>
      <ArrowRight size={15} />
    </Link>
  );
}

function SectionHeading({ eyebrow, title: headingTitle, meta }) {
  return (
    <div className="executive-section-heading">
      <div><span>{eyebrow}</span><h3>{headingTitle}</h3></div>
      {meta}
    </div>
  );
}

export default function Overview() {
  const { data: executive, loading: executiveLoading, error: executiveError } = useFetch(api.dengueExecutiveSummary);
  const { data: databaseStatus } = useFetch(api.databaseStatus);
  const { data: climate, loading: climateLoading, error: climateError } = useFetch(api.climateSummary);
  const { data: risk, loading: riskLoading, error: riskError } = useFetch(() => api.districtRisk(30));

  const metrics = executive?.metrics ?? [];
  const aedes = executive?.aedes ?? {};
  const genomics = executive?.genomics ?? {};
  const community = executive?.community ?? {};
  const workflow = executive?.alerts_and_actions ?? {};
  const model = executive?.model_readiness ?? {};
  const gaps = executive?.data_gaps ?? [];

  const climateRows = (climate?.items ?? []).slice(-45).map((row) => ({
    date: String(row.date ?? "").slice(5),
    rainfall: number(row.rainfall_mm),
    temperature: number(row.tmean_c),
    humidity: number(row.relative_humidity),
  }));
  const climateSnapshot = climateRows.slice(-7);
  const rain7 = climateSnapshot.reduce((sum, row) => sum + row.rainfall, 0);
  const meanTemp = climateSnapshot.length
    ? climateSnapshot.reduce((sum, row) => sum + row.temperature, 0) / climateSnapshot.length
    : 0;
  const meanHumidity = climateSnapshot.length
    ? climateSnapshot.reduce((sum, row) => sum + row.humidity, 0) / climateSnapshot.length
    : 0;

  const priorityRows = (risk?.items ?? []).slice(0, 8).map((row) => ({
    district: title(row.district),
    score: number(row.suitability_index),
    level: row.risk_level,
  }));

  const moduleRows = [
    {
      icon: CloudRain,
      title: "Climate intelligence",
      status: climateRows.length ? "ready" : "pending",
      statusLabel: climateRows.length ? "Context available" : "Awaiting data",
      metric: climateRows.length ? `${climateRows.length} days` : "No series",
      note: "Rainfall, temperature and humidity available; anomaly and lag products pending",
      to: "/climate",
    },
    {
      icon: Microscope,
      title: "Aedes surveillance",
      status: aedes.records ? "active" : "workflow",
      statusLabel: aedes.records ? "Pilot active" : "Workflow ready",
      metric: `${number(aedes.records)} records`,
      note: "Adults, larvae, eggs, trap effort, species and spatial coverage",
      to: "/dengue-operations",
    },
    {
      icon: Dna,
      title: "Dengue genomic surveillance",
      status: genomics.analysed_pools ? "active" : "workflow",
      statusLabel: genomics.analysed_pools ? "Results registered" : "Workflow ready",
      metric: `${number(genomics.analysed_pools)} analysed`,
      note: "Pool and sequencing registry ready; lineage and phylogenetic outputs pending",
      to: "/dengue-operations",
    },
    {
      icon: Smartphone,
      title: "Community reporting",
      status: community.reports ? "active" : "workflow",
      statusLabel: community.reports ? "Reports received" : "Workflow ready",
      metric: `${number(community.reports)} reports`,
      note: "Breeding source, GPS, reporter role and action fields; photo follow-up is partial",
      to: "/dengue-operations",
    },
    {
      icon: Map,
      title: "Risk maps and forecasting",
      status: "limited",
      statusLabel: "Prototype only",
      metric: `${priorityRows.length} priorities`,
      note: "Climate suitability now; validated vector and dengue risk after pilot evidence",
      to: "/modeling",
    },
    {
      icon: BellRing,
      title: "Alerts and actions",
      status: workflow.generated ? "active" : "workflow",
      statusLabel: workflow.generated ? "Review activity" : "Workflow ready",
      metric: `${number(workflow.generated)} signals`,
      note: "Draft-to-acknowledgment works; response-action assignment remains partial",
      to: "/alerts",
    },
    {
      icon: Database,
      title: "Data readiness",
      status: "active",
      statusLabel: "Continuously assessed",
      metric: `${number(model.score_pct)}% gates`,
      note: "GPS, dates, effort, species, genomic and community validation",
      to: "/data-readiness",
    },
    {
      icon: BrainCircuit,
      title: "Modelling roadmap",
      status: "limited",
      statusLabel: "Stage-gated",
      metric: `${number(model.ready_gates)}/${number(model.total_gates)} gates`,
      note: "Occurrence, abundance, virus detection and early-warning validation",
      to: "/modeling",
    },
  ];

  const lifecycle = [
    { label: "Draft signals", value: workflow.draft, icon: BellRing },
    { label: "Technical review", value: workflow.under_technical_review, icon: ShieldCheck },
    { label: "Approved", value: workflow.approved, icon: CheckCircle2 },
    { label: "Acknowledged", value: workflow.acknowledged, icon: Users },
    { label: "Actions assigned", value: workflow.assigned_actions, icon: Target },
    { label: "Actions completed", value: workflow.completed_actions, icon: ClipboardCheck },
  ];

  return (
    <div className="page executive-page">
      <PageHeader
        title="Executive dashboard"
        subtitle="Climate-informed Aedes surveillance and dengue preparedness proof of concept"
        badges={
          <>
            <Badge variant="green">Nexa Proof of Concept</Badge>
            <Badge variant="blue">Rwanda pilot operations</Badge>
            <Badge variant="gray">Great Lakes context</Badge>
          </>
        }
        actions={
          <ExportToolbar
            csvFilename="dengueew_executive_indicators"
            csvRows={metrics}
            jsonData={executive ?? {}}
          />
        }
      />

      <section className="executive-position" aria-label="Project position">
        <div className="executive-position-mark"><Radar size={22} /></div>
        <div className="executive-position-copy">
          <span>Current programme position</span>
          <strong>Digital architecture ready for prospective field validation</strong>
          <p>Climate context and prototype suitability can guide surveillance planning. Aedes abundance and dengue-risk forecasting remain evidence-gated.</p>
        </div>
        <div className="executive-position-status">
          <span className={`health-dot ${databaseStatus?.connected ? "online" : "offline"}`} />
          <div><strong>{databaseStatus?.connected ? "Operational data connected" : "Data connection needs review"}</strong><small>API and Neon persistence</small></div>
        </div>
      </section>

      {executiveError && (
        <div className="executive-error"><AlertTriangle size={16} />Executive indicators could not be loaded: {executiveError}</div>
      )}

      <SectionHeading
        eyebrow="Programme monitoring"
        title="Proof-of-concept indicators"
        meta={<span className="executive-zero-note">Zero = no reviewed pilot record, not absence</span>}
      />
      <div className="executive-metric-grid">
        {executiveLoading
          ? Array.from({ length: 9 }).map((_, index) => <SkeletonStatCard key={index} />)
          : metrics.map((metric) => <ExecutiveMetric key={metric.key} metric={metric} />)}
      </div>

      <div className="executive-main-grid">
        <section className="executive-panel executive-pipeline-panel">
          <div className="executive-panel-header">
            <div><span>Evidence pathway</span><h3>Climate signal to public-health action</h3></div>
            <Badge variant="amber">Prospective validation</Badge>
          </div>
          <div className="executive-pipeline">
            <div className="executive-pipeline-step is-ready"><CloudRain size={17} /><strong>Climate</strong><span>Integrated</span></div>
            <ArrowRight size={14} />
            <div className={`executive-pipeline-step ${aedes.records ? "is-active" : "is-pending"}`}><Microscope size={17} /><strong>Aedes</strong><span>{aedes.records ? "Collecting" : "Pilot pending"}</span></div>
            <ArrowRight size={14} />
            <div className={`executive-pipeline-step ${genomics.analysed_pools ? "is-active" : "is-pending"}`}><Dna size={17} /><strong>Virome</strong><span>{genomics.analysed_pools ? "Analysed" : "Pilot pending"}</span></div>
            <ArrowRight size={14} />
            <div className="executive-pipeline-step is-limited"><BrainCircuit size={17} /><strong>Risk</strong><span>Prototype</span></div>
            <ArrowRight size={14} />
            <div className={`executive-pipeline-step ${workflow.completed_actions ? "is-active" : "is-workflow"}`}><ClipboardCheck size={17} /><strong>Action</strong><span>{workflow.completed_actions ? "Recorded" : "Workflow ready"}</span></div>
          </div>
          <div className="executive-boundary">
            <ShieldCheck size={16} />
            <span>{executive?.claim_boundary ?? "Current outputs are preparedness signals, not validated dengue forecasts."}</span>
          </div>
        </section>

        <section className="executive-panel executive-gate-panel">
          <div className="executive-panel-header">
            <div><span>Forecast gate</span><h3>Model readiness</h3></div>
            <strong className="executive-readiness-value">{number(model.score_pct)}%</strong>
          </div>
          <div className="executive-readiness-track"><span style={{ width: `${number(model.score_pct)}%` }} /></div>
          <div className="executive-gate-list">
            {(model.gates ?? []).map((gate) => (
              <div key={gate.key}>
                {gate.ready ? <CheckCircle2 size={14} /> : <span className="executive-open-gate" />}
                <span>{gate.label}</span>
                <strong>{gate.ready ? "Ready" : "Required"}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SectionHeading
        eyebrow="Climate and spatial intelligence"
        title="Current evidence signals"
        meta={<Badge variant="gray">Context, not outbreak proof</Badge>}
      />
      <div className="executive-chart-grid">
        <section className="executive-panel">
          <div className="executive-panel-header executive-chart-header">
            <div><span>NASA POWER · Gasabo reference</span><h3>Loaded climate history</h3></div>
            <div className="executive-climate-snapshot">
              <div><CloudRain size={13} /><strong>{rain7.toFixed(1)} mm</strong><span>7-day rain</span></div>
              <div><Thermometer size={13} /><strong>{meanTemp.toFixed(1)} C</strong><span>mean temp</span></div>
              <div><Droplets size={13} /><strong>{meanHumidity.toFixed(0)}%</strong><span>humidity</span></div>
            </div>
          </div>
          <ChartState loading={climateLoading} error={climateError} rows={climateRows} empty="No loaded Gasabo climate history is available.">
            <div className="executive-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={climateRows} margin={{ top: 14, right: 10, left: -12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={8} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="rain" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="temp" orientation="right" domain={[10, 35]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar yAxisId="rain" dataKey="rainfall" name="Rainfall (mm)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Mean temperature (C)" stroke="#dc2626" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
          <div className="executive-figure-note">Last 45 loaded daily observations. This is historical climate context for the named reference location.</div>
        </section>

        <section className="executive-panel">
          <div className="executive-panel-header executive-chart-header">
            <div><span>Rwanda district screen · 30-day window</span><h3>Prototype surveillance priority</h3></div>
            <Badge variant="amber">Not dengue risk</Badge>
          </div>
          <ChartState loading={riskLoading} error={riskError} rows={priorityRows} empty="No district climate-suitability rows are available.">
            <div className="executive-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityRows} layout="vertical" margin={{ top: 10, right: 18, left: 2, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef0" horizontal={false} />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="district" width={78} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                  <Bar dataKey="score" name="Climate suitability" radius={[0, 4, 4, 0]}>
                    {priorityRows.map((row) => <Cell key={row.district} fill={RISK_COLOR[row.level] ?? RISK_COLOR.low} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
          <div className="executive-figure-note">Ranks climate suitability for surveillance review. It does not estimate Aedes abundance, dengue incidence or outbreak probability.</div>
        </section>
      </div>

      <SectionHeading eyebrow="Operational accountability" title="Signal-to-response lifecycle" />
      <div className="executive-lifecycle">
        {lifecycle.map((item, index) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.label}>
              <div className="executive-lifecycle-step">
                <div><Icon size={16} /></div>
                <strong>{number(item.value)}</strong>
                <span>{item.label}</span>
              </div>
              {index < lifecycle.length - 1 && <ArrowRight className="executive-lifecycle-arrow" size={14} />}
            </React.Fragment>
          );
        })}
      </div>

      <SectionHeading
        eyebrow="System coverage"
        title="Eight operational modules"
        meta={<Link className="executive-section-link" to="/decision-room">Open Decision Room <ArrowRight size={13} /></Link>}
      />
      <div className="executive-module-grid">
        {moduleRows.map((module) => <ModuleRow key={module.title} {...module} />)}
      </div>

      <div className="executive-bottom-grid">
        <section className="executive-panel">
          <div className="executive-panel-header"><div><span>Data control</span><h3>Critical evidence gaps</h3></div><Link to="/data-readiness">Review <ArrowRight size={13} /></Link></div>
          <div className="executive-gap-list">
            {gaps.map((gap) => (
              <div key={gap.key}>
                <StatusDot status={gap.state === "complete" ? "ready" : gap.state === "review_required" ? "limited" : "pending"} />
                <span>{gap.label}</span>
                <strong>{gap.state === "awaiting_collection" ? "Awaiting pilot" : number(gap.value)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="executive-panel">
          <div className="executive-panel-header"><div><span>Scientific progression</span><h3>Stage-gated modelling roadmap</h3></div><Link to="/modeling">Review <ArrowRight size={13} /></Link></div>
          <div className="executive-roadmap">
            <div className="is-current"><span>1</span><div><strong>Aedes occurrence</strong><small>Detection probability after presence/absence collection</small></div></div>
            <div><span>2</span><div><strong>Aedes abundance</strong><small>Effort-standardized counts and nonlinear climate effects</small></div></div>
            <div><span>3</span><div><strong>Virus detection</strong><small>Pool-level laboratory outcome modelling</small></div></div>
            <div><span>4</span><div><strong>Early warning</strong><small>Only after governed health outcomes and validation</small></div></div>
          </div>
        </section>
      </div>
    </div>
  );
}
