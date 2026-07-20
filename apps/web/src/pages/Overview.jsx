import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, CheckCircle2, CloudRain, Database,
  FileSearch, MapPin, Microscope, ShieldCheck,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, PageHeader, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

function n(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function title(value) {
  return String(value ?? "").replace(/\b\w/g, (character) => character.toUpperCase());
}

const RISK_COLOR = { high: "#dc2626", medium: "#d97706", low: "#0d9488" };

function CommandMetric({ label, value, note, tone = "neutral" }) {
  return (
    <div className={`command-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function AttentionItem({ icon: Icon, tone, title: itemTitle, detail, action, to }) {
  return (
    <div className={`attention-item tone-${tone}`}>
      <div className="attention-icon"><Icon size={17} /></div>
      <div className="attention-copy">
        <strong>{itemTitle}</strong>
        <span>{detail}</span>
      </div>
      <Link to={to} className="attention-link">{action}<ArrowRight size={13} /></Link>
    </div>
  );
}

export default function Overview() {
  const { data: databaseStatus } = useFetch(api.databaseStatus);
  const { data: climate, loading: climateLoading } = useFetch(api.climateSummary);
  const { data: validation } = useFetch(api.publicValidation);
  const { data: risk, loading: riskLoading } = useFetch(() => api.districtRisk(30));
  const { data: readiness } = useFetch(api.readiness);
  const { data: submission } = useFetch(api.dengueSubmissionReadiness);
  const { data: alerts } = useFetch(api.alerts);

  const validationRows = validation?.items ?? [];
  const riskRows = risk?.items ?? [];
  const readinessRows = readiness?.items ?? [];
  const pilotCounts = submission?.counts ?? {};
  const alertRows = alerts?.items ?? [];
  const activeReviews = alertRows.filter((row) => !["closed", "rejected", "resolved"].includes(row.status)).length;
  const highPriority = riskRows.filter((row) => row.risk_level === "high");
  const usableSources = validationRows.filter((row) => ["usable", "validated", "downloaded"].some((status) => String(row.status).includes(status))).length;
  const validationIssues = validationRows.filter((row) => ["failed", "missing", "warning"].some((status) => String(row.status).includes(status))).length;
  const readyGroups = readinessRows.filter((row) => String(row.ready).toLowerCase() === "true").length;
  const readinessPercent = readinessRows.length ? Math.round((readyGroups / readinessRows.length) * 100) : 0;

  const climateRows = (climate?.items ?? []).slice(-60).map((row) => ({
    date: row.date ?? row.DATE ?? "",
    rain: n(row.rainfall_mm ?? row.PRECTOTCORR),
  }));
  const topDistricts = riskRows.slice(0, 7).map((row) => ({
    district: title(row.district),
    score: n(row.suitability_index),
    level: row.risk_level,
  }));
  const leadDistrict = topDistricts[0];

  return (
    <div className="page command-page">
      <PageHeader
        title="Dengue preparedness command"
        subtitle="Current operational position, priority signals and evidence confidence"
        badges={<><Badge variant="green">Pilot architecture ready</Badge><Badge variant="amber">Forecast validation pending</Badge></>}
        actions={<ExportToolbar csvFilename="dengue_command_snapshot" csvRows={riskRows} jsonData={{ submission, readiness: readinessRows, priorities: riskRows }} />}
      />

      <section className="command-status" aria-label="Current system position">
        <div className="command-status-main">
          <span className="command-status-label">Current position</span>
          <strong>Ready to operate the proof-of-concept pilot</strong>
          <p>Climate and public evidence can prioritize review. Dengue forecasting remains blocked until prospective Aedes and governed health outcomes are collected.</p>
        </div>
        <div className="command-status-health">
          <span className={`health-dot ${databaseStatus?.connected ? "online" : "offline"}`} />
          <div><strong>{databaseStatus?.connected ? "Data services online" : "Database needs attention"}</strong><small>Neon and API operational status</small></div>
        </div>
      </section>

      <div className="command-metrics" aria-label="Key operating metrics">
        <CommandMetric label="Priority districts" value={highPriority.length} note="screening signal, not case forecast" tone={highPriority.length ? "alert" : "good"} />
        <CommandMetric label="Open reviews" value={activeReviews} note="human review queue" tone={activeReviews ? "warning" : "good"} />
        <CommandMetric label="Prospective Aedes" value={n(pilotCounts.aedes_surveillance_records)} note="validated pilot observations" tone="neutral" />
        <CommandMetric label="Evidence readiness" value={`${readinessPercent}%`} note={`${usableSources} usable sources`} tone="good" />
      </div>

      <div className="section-heading">
        <div><span>Action brief</span><h3>What needs attention now</h3></div>
        <Badge variant={validationIssues ? "amber" : "green"}>{validationIssues} data issues</Badge>
      </div>
      <div className="attention-list">
        <AttentionItem
          icon={MapPin}
          tone="alert"
          title={leadDistrict ? `${leadDistrict.district} leads the current screening signal` : "District screening is awaiting data"}
          detail={leadDistrict ? `Preparedness score ${leadDistrict.score.toFixed(2)}. Review the evidence and assign field verification before action.` : "No district score is available for review."}
          action="Review districts"
          to="/decision-room"
        />
        <AttentionItem
          icon={Microscope}
          tone="warning"
          title="Prospective Aedes evidence is the critical pilot gap"
          detail="Ovitrap, BG-Sentinel and larval-source observations need dates, locations, counts and sampling effort."
          action="Open pilot workspace"
          to="/dengue-operations"
        />
        <AttentionItem
          icon={Database}
          tone={validationIssues ? "warning" : "good"}
          title={validationIssues ? `${validationIssues} evidence checks need review` : "Evidence checks are clear"}
          detail={`${usableSources} sources are currently usable. Detailed provenance and limitations remain in Data Control.`}
          action="Inspect data control"
          to="/data-readiness"
        />
      </div>

      <div className="section-heading">
        <div><span>Signal view</span><h3>Where teams should look</h3></div>
        <Badge variant="blue">30-day screening window</Badge>
      </div>
      <div className="command-chart-grid">
        <SectionCard title="District preparedness priority" icon={MapPin}>
          <div className="chart-interpretation"><strong>{leadDistrict?.district ?? "Pending"}</strong><span>Highest current climate-vector screening score</span></div>
          <ChartState loading={riskLoading} rows={topDistricts} empty="No district screening rows available.">
            <div className="command-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDistricts} layout="vertical" margin={{ top: 4, right: 18, left: 12, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" horizontal={false} />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="district" width={82} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                  <Bar dataKey="score" name="Preparedness score" radius={[0, 4, 4, 0]}>
                    {topDistricts.map((row) => <Cell key={row.district} fill={RISK_COLOR[row.level] ?? RISK_COLOR.low} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Recent rainfall context" icon={CloudRain}>
          <div className="chart-interpretation"><strong>{climateRows.length} days</strong><span>Climate context for field planning, not outbreak proof</span></div>
          <ChartState loading={climateLoading} rows={climateRows} empty="No recent climate rows available.">
            <div className="command-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={climateRows} margin={{ top: 6, right: 14, left: -18, bottom: 2 }}>
                  <defs><linearGradient id="commandRain" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={11} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                  <Area type="monotone" dataKey="rain" name="Rainfall mm" stroke="#2563eb" strokeWidth={2} fill="url(#commandRain)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <div className="section-heading">
        <div><span>Evidence boundary</span><h3>What the system can support</h3></div>
      </div>
      <div className="evidence-boundary-grid">
        <div className="evidence-boundary ready"><CheckCircle2 size={17} /><div><strong>Use now</strong><span>Climate monitoring, candidate-site planning, evidence review and field-verification workflow.</span></div></div>
        <div className="evidence-boundary collect"><FileSearch size={17} /><div><strong>Collect during pilot</strong><span>Aedes abundance, community observations, mosquito-pool results and governed dengue outcomes.</span></div></div>
        <div className="evidence-boundary blocked"><ShieldCheck size={17} /><div><strong>Do not claim yet</strong><span>Validated outbreak prediction, national incidence forecasting or confirmed local transmission.</span></div></div>
      </div>

      <details className="command-details">
        <summary><Database size={14} /> View technical readiness and source detail</summary>
        <div className="command-detail-grid">
          {(submission?.pillars ?? []).map((row) => (
            <div className="command-detail-row" key={row.pillar}>
              <div><strong>{row.pillar}</strong><span>{row.evidence}</span></div>
              <Badge variant={row.status === "implemented" ? "green" : row.status === "context_only" ? "blue" : "amber"}>{String(row.status).replace(/_/g, " ")}</Badge>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
