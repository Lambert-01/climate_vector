import React from "react";
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Database, FileText,
  MapPin, ShieldCheck, Target, Zap,
} from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  Badge, ChartState, InterpretationPanel, MetricStrip,
  ProgressBar, RiskGauge, SectionCard, StatCard,
} from "../components/UI";

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }

const PRIORITY_DISTRICTS = [
  { district: "Bugesera", signal: "Warm and wet climate window with relevant vector context", evidence: "NASA POWER + GBIF Aedes + sentinel registry", confidence: "medium", action: "Field verification and Aedes/Culex larval-source inspection", limitation: "No official arboviral case data connected yet", owner: "Surveillance / vector-control team" },
  { district: "Gasabo", signal: "Moderate climate suitability with urban vector context", evidence: "NASA POWER + GBIF + PI ecology data", confidence: "medium", action: "Sentinel site coordinate validation and trap deployment planning", limitation: "Sentinel coordinates need PI confirmation", owner: "Entomology team" },
  { district: "Kicukiro", signal: "Urban setting with potential Aedes breeding habitat", evidence: "GBIF occurrence context + land cover", confidence: "low", action: "Community health worker observation deployment", limitation: "No local Aedes/Culex field data yet", owner: "Community health team" },
  { district: "Nyarugenge", signal: "Central urban district with vector occurrence context", evidence: "GBIF + NASA POWER climate", confidence: "low", action: "Urban breeding site survey and source reduction planning", limitation: "Limited PI ecology records for this district", owner: "District health office" },
];

export default function DecisionRoom() {
  const { data: risk, loading: rL } = useFetch(() => api.districtRisk(30));
  const { data: liveWeather, loading: lwL } = useFetch(api.liveWeatherDistricts);
  const { data: readiness } = useFetch(api.readiness);
  const { data: validation, loading: vL } = useFetch(api.publicValidation);
  const { data: scoring, loading: sL } = useFetch(api.arboviralScoring);
  const { data: alerts } = useFetch(api.alerts);

  const riskItems = risk?.items ?? [];
  const highRisk = riskItems.filter((r) => r.risk_level === "high");
  const medRisk = riskItems.filter((r) => r.risk_level === "medium");
  const topDistricts = riskItems.slice(0, 5);

  const validRows = validation?.items ?? [];
  const usableSrc = validRows.filter((r) => ["usable", "validated", "downloaded"].some((k) => String(r.status).includes(k))).length;
  const readyItems = (readiness?.items ?? []).filter((r) => String(r.ready).toLowerCase() === "true");
  const readyPct = readiness?.items?.length ? Math.round((readyItems.length / readiness.items.length) * 100) : 0;

  const aedesIndex = scoring?.aedes_preparedness?.index ?? 0;
  const aedesLevel = scoring?.aedes_preparedness?.level ?? "low";
  const rvfIndex = scoring?.rvf_watch?.index ?? 0;
  const rvfLevel = scoring?.rvf_watch?.level ?? "routine";
  const confidenceIdx = scoring?.data_confidence?.overall_index ?? 0;

  const pendingAlerts = (alerts?.items ?? []).filter((a) => a.status === "pending_review").length;
  const activeAlerts = (alerts?.items ?? []).filter((a) => a.status === "active").length;

  const liveItems = liveWeather?.items ?? [];
  const highLive = liveItems.filter((i) => i.risk_level === "high");

  return (
    <div className="page">

      {/* HERO */}
      <div className="page-hero">
        <div className="eyebrow">Policy Intelligence · Decision Room</div>
        <h2>Preparedness action brief</h2>
        <p>
          Translating climate-vector signals into prioritized actions for health actors.
          This page shows what the system knows, what it recommends, and what limitations remain.
        </p>
        <div className="hero-badges">
          <Badge variant="green">Proof of Concept ready</Badge>
          <Badge variant="amber">Not validated prediction</Badge>
          <Badge variant="blue">Pilot validation required</Badge>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="kpi-row">
        <div className="kpi-tile">
          <div className="kpi-tile-accent red" />
          <div className="kpi-tile-label">High priority districts</div>
          <div className="kpi-tile-value">{highRisk.length}</div>
          <div className="kpi-tile-sub">Climate signal + vector context</div>
          <Target size={48} className="kpi-tile-icon" />
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-accent amber" />
          <div className="kpi-tile-label">Medium priority</div>
          <div className="kpi-tile-value">{medRisk.length}</div>
          <div className="kpi-tile-sub">Monitor and review</div>
          <AlertTriangle size={48} className="kpi-tile-icon" />
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-accent teal" />
          <div className="kpi-tile-label">Data readiness</div>
          <div className="kpi-tile-value">{readyPct}%</div>
          <div className="kpi-tile-sub">{readyItems.length} of {readiness?.items?.length ?? 0} groups ready</div>
          <Database size={48} className="kpi-tile-icon" />
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-accent blue" />
          <div className="kpi-tile-label">Active review items</div>
          <div className="kpi-tile-value">{pendingAlerts + activeAlerts}</div>
          <div className="kpi-tile-sub">{pendingAlerts} pending · {activeAlerts} active</div>
          <ClipboardCheck size={48} className="kpi-tile-icon" />
        </div>
      </div>

      {/* CONFIDENCE GAUGES */}
      <SectionCard title="Confidence and readiness indicators" icon={ShieldCheck}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, padding: "20px 16px" }}>
          <RiskGauge label="Data Confidence" value={confidenceIdx} level={confidenceIdx >= 0.6 ? "low" : confidenceIdx >= 0.35 ? "medium" : "high"} sub={`${Math.round(confidenceIdx * 100)}% overall data completeness`} />
          <RiskGauge label="Aedes Preparedness" value={aedesIndex} level={aedesLevel} sub={`${aedesLevel} readiness signal`} />
          <RiskGauge label="RVF Watch" value={rvfIndex} level={rvfLevel === "watch" ? "high" : rvfLevel === "monitor" ? "medium" : "low"} sub={`${rvfLevel} One Health signal`} />
          <RiskGauge label="Field Window" value={highLive.length > 0 ? 0.7 : 0.3} level={highLive.length > 0 ? "medium" : "low"} sub={`${highLive.length} locations with high live signal`} />
        </div>
        <InterpretationPanel
          title="Confidence interpretation"
          verdict="The system provides descriptive preparedness context. Current data supports climate-vector screening but does not confirm disease transmission. Formal validation requires pilot field data and partner data integration."
          tone={confidenceIdx >= 0.5 ? "teal" : "amber"}
          confidence="Confidence index reflects data completeness across climate, vector, and evidence domains."
          items={[
            { label: "Climate data", value: "Ready", note: "NASA POWER + ERA5 + Open-Meteo" },
            { label: "Vector context", value: "Context only", note: "GBIF + PI ecology" },
            { label: "Case data", value: "Not available", note: "RBC/MoH approval required" },
            { label: "Field surveillance", value: "Pilot required", note: "Aedes/Culex traps needed" },
          ]}
        />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* PRIORITY DISTRICTS TABLE */}
      <SectionCard title="Top priority locations for action" icon={Target}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>District</th>
                <th>Signal</th>
                <th>Evidence</th>
                <th>Confidence</th>
                <th>Recommended Action</th>
                <th>Limitation</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {PRIORITY_DISTRICTS.map((p, i) => (
                <tr key={i}>
                  <td><Badge variant={i === 0 ? "red" : i < 3 ? "amber" : "blue"}>{i === 0 ? "High" : i < 3 ? "Medium" : "Low"}</Badge></td>
                  <td><strong>{p.district}</strong></td>
                  <td style={{ fontSize: 12 }}>{p.signal}</td>
                  <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>{p.evidence}</td>
                  <td><Badge variant={p.confidence === "medium" ? "amber" : "gray"}>{p.confidence}</Badge></td>
                  <td style={{ fontSize: 12 }}>{p.action}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.limitation}</td>
                  <td style={{ fontSize: 11 }}>{p.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* QUICK ACTIONS */}
      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="Immediate actions required" icon={Zap}>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { action: "Validate sentinel site coordinates", priority: "high", owner: "PI / field team", deadline: "Week 1-2" },
              { action: "Deploy Aedes/Culex pilot surveillance", priority: "high", owner: "Entomology team", deadline: "Month 1" },
              { action: "Initiate RBC/MoH data-sharing request", priority: "high", owner: "Data governance", deadline: "Month 1" },
              { action: "Confirm PI susceptibility protocols", priority: "medium", owner: "PI / lab team", deadline: "Month 2" },
              { action: "Extract surface water and urban exposure layers", priority: "medium", owner: "Data engineering", deadline: "Month 2" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: item.priority === "high" ? "#fef2f2" : "#fffbeb", borderRadius: 8, border: `1px solid ${item.priority === "high" ? "#fecaca" : "#fde68a"}` }}>
                <Badge variant={item.priority === "high" ? "red" : "amber"}>{item.priority}</Badge>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.action}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.owner} · {item.deadline}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="System readiness summary" icon={Database}>
          <div style={{ padding: "16px 20px", display: "grid", gap: 10 }}>
            <ProgressBar label="Data readiness" value={readyPct} color="teal" />
            <ProgressBar label="Evidence sources loaded" value={usableSrc} max={14} color="green" />
            <ProgressBar label="Confidence index" value={Math.round(confidenceIdx * 100)} color="blue" />
            <ProgressBar label="Aedes preparedness" value={Math.round(aedesIndex * 100)} color="amber" />
            <div style={{ marginTop: 8, padding: "12px 14px", background: "var(--teal-50)", borderRadius: 8, border: "1px solid var(--teal-200)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700)", marginBottom: 4 }}>What this system supports now</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                <li>District field verification prioritization</li>
                <li>Proposal and funding readiness tracking</li>
                <li>Climate-vector signal screening</li>
                <li>Sentinel site operational planning</li>
              </ul>
            </div>
            <div style={{ padding: "12px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>What requires pilot validation</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.6, color: "#78350f" }}>
                <li>Validated outbreak preparedness model</li>
                <li>Official arboviral surveillance integration</li>
                <li>Confirmed vector species identification</li>
                <li>Livestock/RVF One Health coordination</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* EXPORT SUMMARY */}
      <SectionCard title="Exportable summary" icon={FileText}>
        <div style={{ padding: "16px 20px", fontSize: 13, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>
            <strong>ArboRisk-GL Decision Brief</strong> — Generated from proof-of-concept system<br />
            <strong>Date:</strong> {new Date().toLocaleDateString()}<br />
            <strong>System:</strong> ArboRisk-GL v1.0 — Great Lakes Arboviral Intelligence Prototype<br />
            <strong>Status:</strong> Proof of Concept — descriptive preparedness context, not validated prediction
          </p>
          <p style={{ margin: "12px 0 0" }}>
            <strong>Top priority:</strong> {PRIORITY_DISTRICTS[0].district} district — {PRIORITY_DISTRICTS[0].action.toLowerCase()}.<br />
            <strong>Data confidence:</strong> {Math.round(confidenceIdx * 100)}% overall. Climate data ready; vector context available; case data and field surveillance require pilot.<br />
            <strong>Recommended next steps:</strong> (1) Validate sentinel coordinates, (2) Deploy Aedes/Culex pilot traps, (3) Request RBC/MoH data-sharing agreement.
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
            This system provides preparedness intelligence and field-verification prioritization. It does not provide confirmed outbreak prediction, official disease surveillance conclusions, or validated resistance interpretation.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
