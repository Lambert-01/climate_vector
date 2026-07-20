import React, { useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Biohazard, BrainCircuit, CheckCircle2,
  ChevronRight, ClipboardCheck, Cloud, CloudSun, Database, FileCheck,
  FlaskConical, HelpCircle, Home, ShieldCheck, Map, MapPin,
  Smartphone, Target, Users, Zap, BookOpen, Layers,
  Lock, Eye, Microscope, BarChart3, Workflow,
} from "lucide-react";
import { Badge, SectionCard, ProgressBar } from "../components/UI";

const GUIDE_SECTIONS = [
  "overview",
  "workflow",
  "pages",
  "roles",
  "maturity",
  "reading",
  "boundaries",
  "governance",
];

const PAGE_CATALOG = [
  {
    id: "overview",
    route: "/",
    title: "Dengue Command Overview",
    icon: Home,
    purpose: "Single-screen executive summary of the entire platform status, data readiness, and district priority signals.",
    audience: "Policy makers, principal investigators, programme managers",
    data: "Aggregated from all backend modules — executive summary, climate summary, district risk model, database status.",
    outputs: "Top-level metrics, district risk chart, module status table, data gap alerts.",
    decisions: "Whether to proceed with pilot activation, request additional data, or escalate to partners.",
    caveat: "Metrics reflect PoC-stage data. Numbers are screening signals, not validated case counts.",
    nexa: "Demonstrates proof-of-concept readiness for the Nexa funding proposal — shows integrated data flow from ingestion to prioritization.",
  },
  {
    id: "decision-room",
    route: "/decision-room",
    title: "Decision Room",
    icon: ShieldCheck,
    purpose: "Translates climate-vector signals into a prioritized action queue for health teams, with one-click alert creation and field verification requests.",
    audience: "Technical reviewers, programme managers, field coordinators",
    data: "District risk model, live weather feeds, data validation status, arboviral scoring, existing alerts.",
    outputs: "Ranked priority cards per district, confidence indicators, recommended actions, alert creation workflow.",
    decisions: "Which districts need immediate attention, whether to create alerts or request field verification.",
    caveat: "Priority ranking is rule-based. It does not predict outbreaks — it flags where signals warrant human review.",
    nexa: "Core decision-support workflow in the Nexa proposal — demonstrates how climate data becomes actionable for district health teams.",
  },
  {
    id: "arboviral",
    route: "/arboviral",
    title: "Dengue Intelligence",
    icon: Biohazard,
    purpose: "Regional dengue and Aedes context for the African Great Lakes area, combining vector ecology, disease profiles, and partner landscape.",
    audience: "Technical reviewers, epidemiologists, regional health planners",
    data: "GBIF vector occurrences, PI ecology data, climate context, disease profiles, partner governance data.",
    outputs: "Regional intelligence dashboard, vector taxonomy, disease profile cards, readiness assessment, partner landscape.",
    decisions: "Understanding regional context, identifying surveillance gaps, planning cross-border coordination.",
    caveat: "Vector occurrence data is contextual (from public databases), not site-specific validated surveillance.",
    nexa: "Provides the regional scientific context that justifies the Nexa intervention area and Aedes focus.",
  },
  {
    id: "dengue-operations",
    route: "/dengue-operations",
    title: "Pilot Operations",
    icon: Smartphone,
    purpose: "Operational workspace for community-based Aedes surveillance, genomic analysis, and monitoring & evaluation.",
    audience: "Field officers, lab analysts, data managers, M&E staff",
    data: "Community reports, Aedes surveillance records, genomic samples and artifacts, MEL observations.",
    outputs: "Community report queue, Aedes surveillance tracker, genomic registry, MEL summary, photo evidence.",
    decisions: "Field deployment priorities, lab processing schedule, M&E reporting, community engagement follow-up.",
    caveat: "All pilot data is from simulated or test records during PoC validation phase.",
    nexa: "Operational proof that the platform supports end-to-end community surveillance workflows proposed to Nexa.",
  },
  {
    id: "sites",
    route: "/sites",
    title: "Spatial Operations",
    icon: Map,
    purpose: "Sentinel site registry, coordinate validation, and map-based spatial operations for 33 pilot sites.",
    audience: "Field officers, GIS analysts, data managers",
    data: "Sentinel site registry, coordinate candidates, site metadata.",
    outputs: "Site table with coordinates, map view, coordinate validation status, site detail panels.",
    decisions: "Which sites need coordinate validation, field deployment planning, spatial coverage assessment.",
    caveat: "Site coordinates are from the pilot registry. Field validation of GPS accuracy is pending.",
    nexa: "Demonstrates spatial infrastructure readiness for the 33-site pilot network in the Nexa proposal.",
  },
  {
    id: "mosquito",
    route: "/mosquito",
    title: "Vector Evidence",
    icon: Activity,
    purpose: "Entomological evidence review — Aedes species distribution, breeding site ecology, and field collection context.",
    audience: "Entomologists, lab analysts, technical reviewers",
    data: "PI mosquito records, GBIF context, breeding site data, species distribution.",
    outputs: "Species breakdown, breeding site analysis, district distribution, field record table.",
    decisions: "Vector identification priorities, breeding site intervention planning, species-specific control strategies.",
    caveat: "Species data is contextual from public sources and PI ecology studies, not real-time surveillance.",
    nexa: "Establishes the entomological baseline that the Nexa pilot will build upon with prospective surveillance.",
  },
  {
    id: "resistance",
    route: "/resistance",
    title: "Vector Control Context",
    icon: FlaskConical,
    purpose: "Insecticide susceptibility and resistance context for vector control decision-making.",
    audience: "Vector control specialists, technical reviewers, policy makers",
    data: "PI susceptibility assays, resistance records, insecticide classification.",
    outputs: "Resistance by insecticide, death summary, district breakdown, assay records.",
    decisions: "Insecticide selection for IRS/LLIN, resistance monitoring priorities, control strategy adjustments.",
    caveat: "Resistance data is from published PI studies. Prospective monitoring is part of the Nexa pilot plan.",
    nexa: "Links vector control evidence to the One Health approach in the Nexa proposal.",
  },
  {
    id: "climate",
    route: "/climate",
    title: "Climate Context",
    icon: Cloud,
    purpose: "Historical and regional climate variables relevant to Aedes ecology — rainfall, temperature, humidity from ERA5 and NASA POWER.",
    audience: "Climate-health modelers, technical reviewers, policy makers",
    data: "ERA5-Land reanalysis, NASA POWER archive, Copernicus CDS, Open-Meteo.",
    outputs: "District-level climate time series, variable summaries, regional comparison charts.",
    decisions: "Climate window identification, seasonal pattern recognition, model input validation.",
    caveat: "Climate data is reanalysis/product data, not ground-truthed station observations for each site.",
    nexa: "Shows the climate data infrastructure that enables the ECV-integrated early warning system proposed to Nexa.",
  },
  {
    id: "live-weather",
    route: "/live-weather",
    title: "Live Weather",
    icon: CloudSun,
    purpose: "Real-time and forecast weather from Open-Meteo for current field conditions and near-term planning.",
    audience: "Field officers, technical reviewers, programme managers",
    data: "Open-Meteo API — current conditions, daily forecasts, district geocoding.",
    outputs: "Current weather per district, 7-day forecast, field window indicators, risk overlays.",
    decisions: "Field deployment timing, spray operation windows, community mobilization scheduling.",
    caveat: "Forecasts are open-source weather model outputs. Accuracy varies by location and lead time.",
    nexa: "Demonstrates operational nowcast integration for field-level decision support in the Nexa pilot.",
  },
  {
    id: "modeling",
    route: "/modeling",
    title: "Preparedness Priority",
    icon: BrainCircuit,
    purpose: "Climate-driven district risk scoring and prioritization for preparedness resource allocation.",
    audience: "Policy makers, technical reviewers, programme managers",
    data: "Climate time series, vector ecology signals, district metadata, confidence scoring.",
    outputs: "District risk scores, confidence indices, prioritization rankings, model readiness assessment.",
    decisions: "Resource allocation priorities, pilot site selection, preparedness investment decisions.",
    caveat: "Risk scores are screening-level indicators. Validated outbreak prediction requires prospective surveillance data not yet available.",
    nexa: "Core analytical engine proposed to Nexa — shows how ECVs and vector data can inform preparedness prioritization.",
  },
  {
    id: "alerts",
    route: "/alerts",
    title: "Response Board",
    icon: AlertTriangle,
    purpose: "Operational alert-to-response workflow — track alerts from creation through assignment, field response, and closure.",
    audience: "Field officers, technical reviewers, programme managers",
    data: "System-generated alerts, response actions, progress updates, completion evidence.",
    outputs: "Alert queue with status workflow, response action tracker, assignment and progress log.",
    decisions: "Alert triage, response team assignment, progress monitoring, closure verification.",
    caveat: "Alerts are signal-triggered screening items. They indicate where human review is needed, not confirmed outbreaks.",
    nexa: "Demonstrates the closed-loop workflow from signal detection to field response in the Nexa proposal.",
  },
  {
    id: "field-verification",
    route: "/field-verification",
    title: "Field Verification",
    icon: FileCheck,
    purpose: "Structured field verification requests with checklists for ground-truthing climate-vector signals.",
    audience: "Field officers, lab analysts, technical reviewers",
    data: "Verification requests, checklist templates, field evidence uploads.",
    outputs: "Verification request queue, checklist completion status, evidence gallery.",
    decisions: "Which signals need ground verification, field team deployment, evidence collection priorities.",
    caveat: "Verification requests are generated from screening signals. Completion data feeds back to improve model confidence.",
    nexa: "Key feedback mechanism — field verification data will validate and improve the early warning system over time.",
  },
  {
    id: "data-readiness",
    route: "/data-readiness",
    title: "Data Control",
    icon: Database,
    purpose: "Data governance dashboard — source registry, validation status, dataset readiness, and audit trail.",
    audience: "Data managers, technical reviewers, governance leads",
    data: "Dataset registry (18 sources), validation engine, audit log, readiness checklist.",
    outputs: "Source readiness matrix, validation status per dataset, audit event log, governance compliance view.",
    decisions: "Data pipeline priorities, source validation scheduling, governance compliance tracking.",
    caveat: "Readiness reflects PoC-stage data integration. Full validation requires institutional data-sharing agreements.",
    nexa: "Shows the data governance infrastructure that ensures the Nexa platform meets ethical and quality standards.",
  },
];

const ROLES = [
  {
    id: "policy",
    title: "Policy Maker / Programme Manager",
    icon: Target,
    color: "blue",
    pages: ["Overview", "Decision Room", "Modeling", "Response Board"],
    focus: "High-level status, district prioritization, resource allocation decisions",
    guidance: "Start with Overview for the big picture. Use Decision Room to see which districts need attention. The Preparedness Priority page shows risk rankings. Avoid interpreting raw metrics as case counts — these are screening signals.",
  },
  {
    id: "technical",
    title: "Technical Reviewer",
    icon: Eye,
    color: "teal",
    pages: ["Decision Room", "Dengue Intelligence", "Climate Context", "Modeling", "Data Control"],
    focus: "Evidence quality, confidence assessment, methodology review",
    guidance: "Review the Decision Room confidence indicators. Check Data Control for source readiness. Cross-reference Climate Context with Modeling outputs. Pay attention to limitation notes on each priority card.",
  },
  {
    id: "field",
    title: "Field Officer",
    icon: MapPin,
    color: "green",
    pages: ["Response Board", "Field Verification", "Pilot Operations", "Live Weather", "Spatial Operations"],
    focus: "Actionable field tasks, weather windows, site coordination",
    guidance: "Monitor the Response Board for new alerts. Check Field Verification for assigned tasks. Live Weather shows current conditions and 7-day forecasts for deployment planning. Spatial Operations shows your assigned sites.",
  },
  {
    id: "lab",
    title: "Laboratory Analyst",
    icon: Microscope,
    color: "purple",
    pages: ["Pilot Operations", "Vector Evidence", "Vector Control Context"],
    focus: "Sample tracking, species identification, resistance data",
    guidance: "Pilot Operations shows the genomic registry and sample queue. Vector Evidence provides species context. Vector Control Context shows resistance data relevant to your analysis protocols.",
  },
  {
    id: "data",
    title: "Data Manager",
    icon: Database,
    color: "amber",
    pages: ["Data Control", "Spatial Operations", "Pilot Operations"],
    focus: "Data quality, source validation, pipeline monitoring",
    guidance: "Data Control is your primary workspace — monitor source readiness, validation status, and audit trails. Spatial Operations shows coordinate validation status. Pilot Operations tracks data entry from field teams.",
  },
  {
    id: "modeler",
    title: "Climate-Health Modeler",
    icon: BrainCircuit,
    color: "blue",
    pages: ["Climate Context", "Live Weather", "Modeling", "Dengue Intelligence"],
    focus: "Climate variable analysis, model inputs, confidence assessment",
    guidance: "Climate Context provides historical ECV time series. Live Weather shows current conditions. Modeling displays the risk scoring methodology. Dengue Intelligence provides the regional epidemiological context for model calibration.",
  },
];

const MATURITY_LEVELS = [
  {
    level: "Available Now",
    color: "green",
    icon: CheckCircle2,
    description: "Operational in the PoC platform with real or production-grade data.",
    items: [
      "Climate variables (ERA5-Land, NASA POWER, Open-Meteo)",
      "District-level risk prioritization (rule-based)",
      "Sentinel site registry (33 sites)",
      "Vector ecology context (GBIF, PI studies)",
      "Alert-to-response workflow",
      "Data governance and audit trail",
      "Operational API with JWT authentication",
    ],
  },
  {
    level: "Pilot Collection Needed",
    color: "amber",
    icon: ClipboardCheck,
    description: "Infrastructure exists but requires prospective field data collection during the pilot phase.",
    items: [
      "Aedes mosquito surveillance records",
      "Ovitraps and BG-Sentinel trap data",
      "Community-based field reports",
      "Field verification evidence",
      "Genomic sample tracking and lineage results",
      "Insecticide susceptibility assay updates",
    ],
  },
  {
    level: "Validation Required",
    color: "red",
    icon: AlertTriangle,
    description: "Requires institutional data-sharing agreements, ethical approval, or external validation before operational use.",
    items: [
      "Official dengue case data from RBC/MoH",
      "Validated outbreak prediction model",
      "Prospective Aedes-dengue correlation analysis",
      "Genomic lineage-to-outbreak linkage",
      "Cross-border Great Lakes surveillance data",
      "Full One Health integration metrics",
    ],
  },
];

function SectionNav({ active, onNavigate }) {
  return (
    <nav className="guide-section-nav">
      {GUIDE_SECTIONS.map((id) => {
        const labels = {
          overview: "Overview",
          workflow: "Data Flow",
          pages: "Page Guide",
          roles: "By Role",
          maturity: "Maturity",
          reading: "How to Read",
          boundaries: "Claim Boundaries",
          governance: "Governance",
        };
        return (
          <button
            key={id}
            className={`guide-nav-btn ${active === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            {labels[id]}
          </button>
        );
      })}
    </nav>
  );
}

function ExecutiveSummary() {
  return (
    <div className="guide-executive">
      <div className="guide-executive-inner">
        <div className="guide-executive-badge">
          <Badge variant="blue">Proof of Concept</Badge>
          <Badge variant="teal">Nexa / Grand Challenges Rwanda</Badge>
        </div>
        <h1>DengueEW-GL Platform Guide</h1>
        <p className="guide-executive-sub">
          AI-Enabled Community-Based Early Warning Systems Integrating Essential Climate Variables
          and Aedes Mosquito Surveillance for Dengue Prevention in the African Great Lakes Region
        </p>
        <div className="guide-executive-points">
          <div className="guide-point">
            <ShieldCheck size={18} />
            <div>
              <strong>What this is</strong>
              <span>An integrated climate-health proof-of-concept platform for screening dengue preparedness signals across Rwanda districts.</span>
            </div>
          </div>
          <div className="guide-point">
            <AlertTriangle size={18} />
            <div>
              <strong>What this is not</strong>
              <span>A validated dengue outbreak prediction system. Current outputs are preparedness and surveillance prioritization signals requiring prospective validation.</span>
            </div>
          </div>
          <div className="guide-point">
            <Workflow size={18} />
            <div>
              <strong>How it works</strong>
              <span>Climate data flows from ingestion through analysis into district-level risk scores, triggering alerts that field teams can act upon.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowMap() {
  const steps = [
    { icon: Cloud, label: "Climate Ingestion", sub: "ERA5, NASA POWER, Open-Meteo", color: "blue" },
    { icon: Activity, label: "Vector Context", sub: "GBIF, PI ecology, breeding sites", color: "teal" },
    { icon: BrainCircuit, label: "Risk Scoring", sub: "Rule-based district prioritization", color: "purple" },
    { icon: ShieldCheck, label: "Decision Room", sub: "Human review and triage", color: "green" },
    { icon: AlertTriangle, label: "Alert Creation", sub: "Signal-to-action trigger", color: "amber" },
    { icon: MapPin, label: "Field Response", sub: "Verification and action workflow", color: "red" },
    { icon: Database, label: "Feedback Loop", sub: "Audit trail and model improvement", color: "blue" },
  ];

  return (
    <SectionCard title="Data flow: from ingestion to action" icon={Workflow}>
      <div className="guide-workflow">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="guide-workflow-arrow"><ArrowRight size={16} /></div>}
            <div className={`guide-workflow-step ${step.color}`}>
              <div className={`guide-workflow-icon ${step.color}`}><step.icon size={20} /></div>
              <div className="guide-workflow-label">{step.label}</div>
              <div className="guide-workflow-sub">{step.sub}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </SectionCard>
  );
}

function PageCard({ page }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = page.icon;

  return (
    <div className={`guide-page-card ${expanded ? "expanded" : ""}`}>
      <button className="guide-page-header" onClick={() => setExpanded(!expanded)}>
        <div className="guide-page-icon"><Icon size={18} /></div>
        <div className="guide-page-info">
          <div className="guide-page-title">{page.title}</div>
          <div className="guide-page-route">{page.route}</div>
        </div>
        <ChevronRight size={16} className={`guide-page-chevron ${expanded ? "open" : ""}`} />
      </button>
      {expanded && (
        <div className="guide-page-body">
          <div className="guide-page-grid">
            <div className="guide-page-field">
              <div className="guide-page-field-label">Purpose</div>
              <div className="guide-page-field-value">{page.purpose}</div>
            </div>
            <div className="guide-page-field">
              <div className="guide-page-field-label">Primary audience</div>
              <div className="guide-page-field-value">{page.audience}</div>
            </div>
            <div className="guide-page-field">
              <div className="guide-page-field-label">Data sources</div>
              <div className="guide-page-field-value">{page.data}</div>
            </div>
            <div className="guide-page-field">
              <div className="guide-page-field-label">Key outputs</div>
              <div className="guide-page-field-value">{page.outputs}</div>
            </div>
            <div className="guide-page-field">
              <div className="guide-page-field-label">Decisions it supports</div>
              <div className="guide-page-field-value">{page.decisions}</div>
            </div>
            <div className="guide-page-field">
              <div className="guide-page-field-label">Interpretation boundary</div>
              <div className="guide-page-field-value guide-page-caution">{page.caveat}</div>
            </div>
          </div>
          <div className="guide-page-contribution">
            <Zap size={14} />
            <span><strong>Pipeline contribution:</strong> {page.nexa}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleGuide() {
  const [activeRole, setActiveRole] = useState("policy");
  const role = ROLES.find((r) => r.id === activeRole);
  const RoleIcon = role.icon;

  return (
    <SectionCard title="Role-based guide" icon={Users}>
      <div className="guide-role-tabs">
        {ROLES.map((r) => {
          const RIcon = r.icon;
          return (
            <button
              key={r.id}
              className={`guide-role-tab ${activeRole === r.id ? "active" : ""} ${r.color}`}
              onClick={() => setActiveRole(r.id)}
            >
              <RIcon size={14} />
              <span>{r.title.split(" / ")[0]}</span>
            </button>
          );
        })}
      </div>
      {role && (
        <div className="guide-role-detail">
          <div className="guide-role-header">
            <div className={`guide-role-icon ${role.color}`}><RoleIcon size={22} /></div>
            <div>
              <div className="guide-role-title">{role.title}</div>
              <div className="guide-role-focus">{role.focus}</div>
            </div>
          </div>
          <div className="guide-role-pages">
            <div className="guide-role-pages-label">Key pages</div>
            <div className="guide-role-page-list">
              {role.pages.map((p) => <Badge key={p} variant={role.color}>{p}</Badge>)}
            </div>
          </div>
          <div className="guide-role-guidance">
            <BookOpen size={14} />
            <span>{role.guidance}</span>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function MaturityLadder() {
  return (
    <SectionCard title="Evidence maturity ladder" icon={Layers}>
      <div className="guide-maturity-grid">
        {MATURITY_LEVELS.map((level) => {
          const LevelIcon = level.icon;
          return (
            <div key={level.level} className={`guide-maturity-card ${level.color}`}>
              <div className="guide-maturity-header">
                <div className={`guide-maturity-icon ${level.color}`}><LevelIcon size={18} /></div>
                <div className={`guide-maturity-title ${level.color}`}>{level.level}</div>
              </div>
              <div className="guide-maturity-desc">{level.description}</div>
              <ul className="guide-maturity-list">
                {level.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function HowToRead() {
  return (
    <SectionCard title="How to read the dashboard" icon={HelpCircle}>
      <div className="guide-reading-grid">
        <div className="guide-reading-card">
          <div className="guide-reading-icon teal"><BarChart3 size={20} /></div>
          <h4>Risk levels</h4>
          <p>Districts are classified as <Badge variant="red">high</Badge>, <Badge variant="amber">medium</Badge>, or <Badge variant="green">low</Badge> risk based on combined climate and vector signals. These are screening indicators, not outbreak predictions.</p>
        </div>
        <div className="guide-reading-card">
          <div className="guide-reading-icon blue"><Target size={20} /></div>
          <h4>Confidence levels</h4>
          <p>Each signal has a confidence rating reflecting data completeness. <Badge variant="green">High confidence</Badge> means multiple evidence sources agree. Lower confidence indicates data gaps that reduce reliability.</p>
        </div>
        <div className="guide-reading-card">
          <div className="guide-reading-icon amber"><AlertTriangle size={20} /></div>
          <h4>Alert workflow</h4>
          <p>Alerts progress through: <Badge variant="gray">pending review</Badge> → <Badge variant="blue">active</Badge> → <Badge variant="teal">in progress</Badge> → <Badge variant="green">completed</Badge>. Each transition requires human action and evidence.</p>
        </div>
        <div className="guide-reading-card">
          <div className="guide-reading-icon green"><CheckCircle2 size={20} /></div>
          <h4>Data readiness</h4>
          <p>The Data Control page shows source-by-source readiness. <Badge variant="green">Ready</Badge> sources feed the model. <Badge variant="amber">Partial</Badge> sources have limited data. <Badge variant="red">Missing</Badge> sources are not yet connected.</p>
        </div>
        <div className="guide-reading-card">
          <div className="guide-reading-icon purple"><BrainCircuit size={20} /></div>
          <h4>Preparedness scoring</h4>
          <p>The Priority Engine combines climate signals, vector ecology context, and data completeness into a composite risk score. Higher scores indicate greater preparedness attention needed.</p>
        </div>
        <div className="guide-reading-card">
          <div className="guide-reading-icon red"><Lock size={20} /></div>
          <h4>Access control</h4>
          <p>All access is authenticated via JWT. Six role types control what each user can view and modify. The audit log records every data event for governance compliance.</p>
        </div>
      </div>
    </SectionCard>
  );
}

function ClaimBoundaries() {
  return (
    <SectionCard title="Scientific claim boundaries" icon={Lock}>
      <div className="guide-boundaries">
        <div className="guide-boundary-assertion">
          <h4>Current system claims (validated in PoC)</h4>
          <ul>
            <li>Integrated climate data ingestion from three ECV sources (ERA5-Land, NASA POWER, Open-Meteo)</li>
            <li>Automated climate variable computation and district-level aggregation</li>
            <li>Rule-based district prioritization using climate and vector ecology signals</li>
            <li>Operational alert-to-response workflow with audit trail</li>
            <li>Community-based field verification infrastructure</li>
            <li>Genomic artifact registry for lineage tracking</li>
            <li>Data governance framework with role-based access control</li>
          </ul>
        </div>
        <div className="guide-boundary-future">
          <h4>Requires prospective validation (Nexa pilot phase)</h4>
          <ul>
            <li>Correlation between Aedes surveillance data and climate signals</li>
            <li>Predictive accuracy of climate-triggered risk scores for actual dengue transmission</li>
            <li>Optimal climate window thresholds for early warning in the Great Lakes context</li>
            <li>Cost-effectiveness of community-based surveillance integration</li>
            <li>Genomic lineage-to-outbreak linkage for targeted response</li>
            <li>Cross-border surveillance data sharing protocols</li>
          </ul>
        </div>
        <div className="guide-boundary-disclaimer">
          <AlertTriangle size={16} />
          <div>
            <strong>Important disclaimer</strong>
            <p>This system is a proof-of-concept. It does not predict dengue outbreaks. It provides preparedness prioritization signals that require human expert review and prospective field validation before any operational deployment for public health decision-making.</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function GovernanceGuide() {
  return (
    <SectionCard title="Data source and governance guide" icon={Database}>
      <div className="guide-governance">
        <div className="guide-governance-table">
          <div className="guide-gov-header">
            <div>Source</div>
            <div>Type</div>
            <div>Update frequency</div>
            <div>Governance</div>
          </div>
          {[
            { source: "ERA5-Land (Copernicus)", type: "Climate reanalysis", freq: "Monthly ingestion", gov: "Open license (CDS API)" },
            { source: "NASA POWER", type: "Climate archive", freq: "Monthly ingestion", gov: "Open license (API)" },
            { source: "Open-Meteo", type: "Weather forecast", freq: "Daily automated", gov: "Open license (API)" },
            { source: "GBIF", type: "Vector occurrences", freq: "Quarterly", gov: "Open license (CC)" },
            { source: "PI Ecology Studies", type: "Entomological context", freq: "Manual update", gov: "Institutional agreement" },
            { source: "Sentinel Sites", type: "Field registry", freq: "Continuous", gov: "Pilot governance" },
            { source: "Community Reports", type: "Field observations", freq: "Real-time entry", gov: "Field team protocol" },
            { source: "Genomic Samples", type: "Lab records", freq: "Continuous", gov: "Lab SOP + ethical approval" },
            { source: "RBC/MoH Case Data", type: "Official surveillance", freq: "Pending", gov: "Data-sharing agreement required" },
          ].map((row, i) => (
            <div key={i} className="guide-gov-row">
              <div><strong>{row.source}</strong></div>
              <div>{row.type}</div>
              <div>{row.freq}</div>
              <div>{row.gov}</div>
            </div>
          ))}
        </div>
        <div className="guide-governance-note">
          <Lock size={14} />
          <span>All data access is logged in the audit trail. User actions are tied to JWT-authenticated sessions with role-based permissions.</span>
        </div>
      </div>
    </SectionCard>
  );
}

export default function SystemGuide() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="page guide-page">
      <ExecutiveSummary />
      <SectionNav active={activeSection} onNavigate={(id) => {
        setActiveSection(id);
        document.getElementById(`guide-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }} />

      <div id="guide-section-overview">
        <SectionCard title="Executive summary" icon={BookOpen}>
          <div className="guide-overview-content">
            <p>
              DengueEW-GL is a proof-of-concept platform developed for the Nexa / Grand Challenges Rwanda Climate and Health Innovation funding call.
              It integrates essential climate variables (ECVs) with Aedes mosquito surveillance data to create climate-informed dengue preparedness signals
              for districts across Rwanda and the African Great Lakes region.
            </p>
            <p>
              The platform serves six user roles — policy makers, technical reviewers, field officers, laboratory analysts, data managers, and climate-health modelers —
              each with tailored views and permissions. Data flows from climate ingestion through analysis into prioritized action queues, supporting
              evidence-based preparedness decisions.
            </p>
            <div className="guide-overview-badges">
              <Badge variant="blue">React + Vite Frontend</Badge>
              <Badge variant="teal">FastAPI Backend</Badge>
              <Badge variant="green">Neon PostgreSQL</Badge>
              <Badge variant="purple">JWT Auth + 6 Roles</Badge>
              <Badge variant="amber">18 Data Sources</Badge>
              <Badge variant="gray">33 Sentinel Sites</Badge>
            </div>
          </div>
        </SectionCard>
      </div>

      <div id="guide-section-workflow">
        <WorkflowMap />
      </div>

      <div id="guide-section-pages">
        <SectionCard title="Platform page guide" icon={Layers}>
          <div className="guide-pages-intro">
            <p>Each page in the platform serves a specific purpose in the climate-health early warning workflow. Click any page to expand its full documentation.</p>
          </div>
          <div className="guide-page-list">
            {PAGE_CATALOG.map((page) => (
              <PageCard key={page.id} page={page} />
            ))}
          </div>
        </SectionCard>
      </div>

      <div id="guide-section-roles">
        <RoleGuide />
      </div>

      <div id="guide-section-maturity">
        <MaturityLadder />
      </div>

      <div id="guide-section-reading">
        <HowToRead />
      </div>

      <div id="guide-section-boundaries">
        <ClaimBoundaries />
      </div>

      <div id="guide-section-governance">
        <GovernanceGuide />
      </div>
    </div>
  );
}
