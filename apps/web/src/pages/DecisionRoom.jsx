import React, { useCallback, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, Clock,
  Database, FileText, MapPin, ShieldCheck, Target, Zap,
} from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  Badge, ChartState, MetricStrip, ProgressBar, RiskGauge,
  SectionCard, SkeletonStatCard,
} from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
function today() { return new Date().toISOString().slice(0, 10); }

function confidenceFromSignal(row) {
  if (row.uncertainty_level === "low") return "high";
  if (row.uncertainty_level === "medium") return "medium";
  return "low";
}

function ownerFor(row) {
  if (row.risk_level === "high") return "Surveillance / vector-control";
  if ((row.recent_records ?? 0) > 0) return "Entomology team";
  return "District health office";
}

function actionFor(row) {
  if (row.risk_level === "high") return "Field verification + larval-source inspection";
  if (row.risk_level === "medium") return "Monitor climate signal + sentinel verification";
  return "Routine monitoring";
}

function limitationFor(row) {
  const gap = (row.reason_codes ?? []).find((c) => c.category === "gap");
  return gap?.message ?? "No official case data connected";
}

function signalFor(row) {
  const climate = (row.reason_codes ?? []).find((c) => c.category === "climate");
  return climate?.message ?? row.reason ?? "Climate-vector signal";
}

function Toast({ message, type = "success", onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}

function PriorityCard({ row, index, onAlert, onVerify }) {
  const confidence = confidenceFromSignal(row);
  return (
    <div className="priority-card">
      <div className={`priority-card-accent ${row.risk_level}`} />
      <div className="priority-card-body">
        <div className="priority-card-head">
          <span className="priority-card-district">{row.district}</span>
          <Badge variant={row.risk_level === "high" ? "red" : row.risk_level === "medium" ? "amber" : "green"}>
            {row.risk_level}
          </Badge>
          <Badge variant={confidence === "medium" ? "amber" : "gray"}>{confidence} confidence</Badge>
        </div>
        <div className="priority-card-meta">
          <div className="priority-card-field">
            <div className="priority-card-field-label">Signal</div>
            <div className="priority-card-field-value">{signalFor(row)}</div>
          </div>
          <div className="priority-card-field">
            <div className="priority-card-field-label">Recommended action</div>
            <div className="priority-card-field-value">{actionFor(row)}</div>
          </div>
          <div className="priority-card-field">
            <div className="priority-card-field-label">Evidence</div>
            <div className="priority-card-field-value">NASA POWER + PI ecology + GBIF</div>
          </div>
          <div className="priority-card-field">
            <div className="priority-card-field-label">Limitation</div>
            <div className="priority-card-field-value" style={{ color: "var(--red-600)" }}>{limitationFor(row)}</div>
          </div>
          <div className="priority-card-field">
            <div className="priority-card-field-label">Owner</div>
            <div className="priority-card-field-value">{ownerFor(row)}</div>
          </div>
        </div>
      </div>
      <div className="priority-card-actions">
        <button className="priority-action-btn alert" onClick={() => onAlert(row)}>
          <AlertTriangle size={12} /> Create Alert
        </button>
        <button className="priority-action-btn verify" onClick={() => onVerify(row)}>
          <ClipboardCheck size={12} /> Request Verification
        </button>
      </div>
    </div>
  );
}

const PIPELINE_STEPS = [
  { label: "Signal detected", icon: Zap },
  { label: "Evidence reviewed", icon: Database },
  { label: "Alert created", icon: AlertTriangle },
  { label: "Field verification", icon: MapPin },
  { label: "Action closed", icon: CheckCircle2 },
];

export default function DecisionRoom() {
  const { data: risk, loading: rL } = useFetch(() => api.districtRisk(30));
  const { data: liveWeather } = useFetch(api.liveWeatherDistricts);
  const { data: readiness } = useFetch(api.readiness);
  const { data: validation, loading: vL } = useFetch(api.publicValidation);
  const { data: scoring, loading: sL } = useFetch(api.arboviralScoring);
  const { data: alerts, refresh: refreshAlerts } = useFetch(api.alerts);

  const [toast, setToast] = useState(null);
  const [creatingAlert, setCreatingAlert] = useState(null);
  const [creatingVerify, setCreatingVerify] = useState(null);
  const [activeView, setActiveView] = useState("priorities");

  const riskItems = risk?.items ?? [];
  const highRisk = riskItems.filter((r) => r.risk_level === "high");
  const medRisk = riskItems.filter((r) => r.risk_level === "medium");
  const topDistricts = riskItems.slice(0, 8);

  const validRows = validation?.items ?? [];
  const usableSrc = validRows.filter((r) => ["usable", "validated", "downloaded"].some((k) => String(r.status).includes(k))).length;
  const readyItems = (readiness?.items ?? []).filter((r) => String(r.ready).toLowerCase() === "true");
  const readyPct = readiness?.items?.length ? Math.round((readyItems.length / readiness.items.length) * 100) : 0;

  const confidenceIdx = scoring?.data_confidence?.overall_index ?? 0;
  const aedesIndex = scoring?.aedes_preparedness?.index ?? 0;
  const aedesLevel = scoring?.aedes_preparedness?.level ?? "low";

  const pendingAlerts = (alerts?.items ?? []).filter((a) => a.status === "pending_review").length;
  const activeAlerts = (alerts?.items ?? []).filter((a) => a.status === "active").length;

  const liveItems = liveWeather?.items ?? [];
  const highLive = liveItems.filter((i) => i.risk_level === "high");

  const handleCreateAlert = useCallback(async (row) => {
    setCreatingAlert(row.district);
    try {
      await api.createAlert({
        district: row.district,
        risk_level: row.risk_level,
        risk_reason: signalFor(row),
        recommended_action: actionFor(row),
        uncertainty_level: row.uncertainty_level ?? "high",
        rule_or_model_version: "rule-v1",
      });
      setToast({ message: `Alert created for ${row.district}`, type: "success" });
      refreshAlerts?.();
    } catch {
      setToast({ message: `Failed to create alert for ${row.district}`, type: "error" });
    } finally {
      setCreatingAlert(null);
    }
  }, [refreshAlerts]);

  const handleCreateVerify = useCallback(async (row) => {
    setCreatingVerify(row.district);
    try {
      await api.createFieldVerification({
        district: row.district,
        reason_for_visit: actionFor(row),
        climate_trigger: signalFor(row),
        suspected_vector_group: "Aedes",
        notes: `Auto-generated from Decision Room priority queue. Limitation: ${limitationFor(row)}`,
      });
      setToast({ message: `Verification request created for ${row.district}`, type: "success" });
    } catch {
      setToast({ message: `Failed to create verification for ${row.district}`, type: "error" });
    } finally {
      setCreatingVerify(null);
    }
  }, []);

  const briefText = [
    `DengueEW-GL Decision Brief — ${today()}`,
    `System: DengueEW-GL — climate-informed dengue preparedness`,
    `Status: Proof of Concept — screening and human review`,
    ``,
    `High-priority districts: ${highRisk.length}`,
    `Medium-priority districts: ${medRisk.length}`,
    `Data confidence: ${Math.round(confidenceIdx * 100)}%`,
    `Data readiness: ${readyPct}%`,
    `Active review items: ${pendingAlerts + activeAlerts}`,
    ``,
    `Top priority: ${topDistricts[0]?.district ?? "Pending"}`,
    `Action: ${actionFor(topDistricts[0] ?? {})}`,
    `Limitation: No approved dengue outcome series is connected. Pilot validation is required.`,
  ].join("\n");

  const csvRows = topDistricts.map((r) => ({
    district: r.district,
    risk_level: r.risk_level,
    signal: signalFor(r),
    confidence: confidenceFromSignal(r),
    action: actionFor(r),
    limitation: limitationFor(r),
    owner: ownerFor(r),
  }));

  return (
    <div className="page">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Decision Room</h2>
          <div className="page-subtitle">Climate-vector signals into prioritized actions for health actors</div>
          <div className="page-header-badges">
            <Badge variant="green">PoC ready</Badge>
            <Badge variant="amber">Not validated prediction</Badge>
            <Badge variant="blue">Pilot required</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename="arborisk_decision_room"
            csvRows={csvRows}
            jsonData={{ date: today(), high_risk: highRisk.length, medium_risk: medRisk.length, confidence: confidenceIdx, districts: csvRows }}
            copyText={briefText}
          />
        </div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Decision Room views">
        {[
          ["priorities", "Priority queue"],
          ["evidence", "Confidence & limits"],
          ["workflow", "Response workflow"],
        ].map(([id, label]) => (
          <button key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}>{label}</button>
        ))}
      </div>

      {/* ── TOP METRICS ── */}
      {activeView === "priorities" && <>
      <div className="kpi-row">
        {rL ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />) : (
          <>
            <div className="kpi-tile">
              <div className="kpi-tile-accent red" />
              <div className="kpi-tile-label">High priority</div>
              <div className="kpi-tile-value">{highRisk.length}</div>
              <div className="kpi-tile-sub">Districts with elevated signal</div>
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
              <div className="kpi-tile-accent blue" />
              <div className="kpi-tile-label">Active reviews</div>
              <div className="kpi-tile-value">{pendingAlerts + activeAlerts}</div>
              <div className="kpi-tile-sub">{pendingAlerts} pending · {activeAlerts} active</div>
              <ClipboardCheck size={48} className="kpi-tile-icon" />
            </div>
            <div className="kpi-tile">
              <div className="kpi-tile-accent teal" />
              <div className="kpi-tile-label">Data confidence</div>
              <div className="kpi-tile-value">{Math.round(confidenceIdx * 100)}%</div>
              <div className="kpi-tile-sub">{readyPct}% readiness · {usableSrc} sources</div>
              <Database size={48} className="kpi-tile-icon" />
            </div>
          </>
        )}
      </div>
      </>}

      {/* ── ACTION PIPELINE ── */}
      {activeView === "workflow" && <>
      <SectionCard title="Action pipeline" icon={Zap}>
        <div className="action-pipeline">
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={`pipeline-connector ${i <= 1 ? "done" : ""}`} />}
              <div className={`pipeline-step ${i === 1 ? "active" : i < 1 ? "" : ""}`}>
                <div className={`pipeline-step-dot ${i < 1 ? "done" : i === 1 ? "active" : "pending"}`}>
                  {i < 1 ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <div className="pipeline-step-label">{step.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />
      </>}

      {/* ── PRIORITY QUEUE ── */}
      {activeView === "priorities" && <>
      <SectionCard
        title="Priority queue"
        icon={Target}
        action={<Badge variant="gray">{topDistricts.length} districts</Badge>}
      >
        <ChartState loading={rL} rows={topDistricts} empty="No district risk signals available. Check modelling endpoint.">
          <div className="priority-card-grid">
            {topDistricts.map((row, i) => (
              <PriorityCard
                key={row.district}
                row={row}
                index={i}
                onAlert={handleCreateAlert}
                onVerify={handleCreateVerify}
              />
            ))}
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />
      </>}

      {/* ── CONFIDENCE + READINESS ── */}
      {activeView === "evidence" && <>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Confidence indicators" icon={ShieldCheck}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, padding: "18px 16px" }}>
            <RiskGauge label="Data Confidence" value={confidenceIdx} level={confidenceIdx >= 0.6 ? "low" : confidenceIdx >= 0.35 ? "medium" : "high"} sub={`${Math.round(confidenceIdx * 100)}% completeness`} />
            <RiskGauge label="Aedes Preparedness" value={aedesIndex} level={aedesLevel} sub={`${aedesLevel} readiness`} />
          </div>
          <div style={{ padding: "0 16px 16px", display: "grid", gap: 6 }}>
            <div className="compact-insight">
              <span className="compact-insight-label">Climate</span>
              <span className="compact-insight-value">NASA POWER + ERA5 ready</span>
              <Badge variant="green">Ready</Badge>
            </div>
            <div className="compact-insight">
              <span className="compact-insight-label">Vector</span>
              <span className="compact-insight-value">GBIF + PI ecology context</span>
              <Badge variant="amber">Context only</Badge>
            </div>
            <div className="compact-insight">
              <span className="compact-insight-label">Case data</span>
              <span className="compact-insight-value">RBC/MoH approval required</span>
              <Badge variant="red">Not available</Badge>
            </div>
            <div className="compact-insight">
              <span className="compact-insight-label">Field</span>
              <span className="compact-insight-value">Aedes pilot surveillance needed</span>
              <Badge variant="amber">Pilot required</Badge>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="System readiness" icon={Database}>
          <div style={{ padding: "18px 16px", display: "grid", gap: 10 }}>
            <ProgressBar label="Data readiness" value={readyPct} color="teal" />
            <ProgressBar label="Evidence sources" value={usableSrc} max={14} color="green" />
            <ProgressBar label="Confidence" value={Math.round(confidenceIdx * 100)} color="blue" />
            <ProgressBar label="Aedes index" value={Math.round(aedesIndex * 100)} color="amber" />
          </div>
          <div style={{ padding: "0 16px 16px", display: "grid", gap: 6 }}>
            <div style={{ padding: "10px 12px", background: "var(--teal-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--teal-100)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-700)" }}>Supported now</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>District prioritization · Proposal readiness · Signal screening</div>
            </div>
            <div style={{ padding: "10px 12px", background: "#fffbeb", borderRadius: "var(--radius-sm)", border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>Requires pilot</div>
              <div style={{ fontSize: 12, color: "#78350f", marginTop: 2 }}>Validated model · Official surveillance · One Health coordination</div>
            </div>
          </div>
        </SectionCard>
      </div>
      </>}

      {/* ── IMMEDIATE ACTIONS ── */}
      {activeView === "workflow" && <>
      <SectionCard title="Immediate actions" icon={Zap}>
        <div style={{ padding: "14px 16px", display: "grid", gap: 8 }}>
          {[
            { action: "Validate sentinel site coordinates", priority: "high", owner: "PI / field team", deadline: "Week 1-2" },
            { action: "Deploy Aedes pilot surveillance", priority: "high", owner: "Entomology team", deadline: "Months 6–12" },
            { action: "Initiate RBC/MoH data-sharing request", priority: "high", owner: "Data governance", deadline: "Month 1" },
            { action: "Confirm PI susceptibility protocols", priority: "medium", owner: "PI / lab team", deadline: "Month 2" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: item.priority === "high" ? "#fef2f2" : "#fffbeb", borderRadius: "var(--radius-sm)", border: `1px solid ${item.priority === "high" ? "#fecaca" : "#fde68a"}` }}>
              <Badge variant={item.priority === "high" ? "red" : "amber"}>{item.priority}</Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.action}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.owner} · {item.deadline}</div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </SectionCard>
      </>}
    </div>
  );
}
