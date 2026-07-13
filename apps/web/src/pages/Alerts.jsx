import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, ClipboardCheck, Clock, Plus, RefreshCw, Shield, Users } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, EmptyState, InterpretationPanel, MetricStrip, SectionCard, Spinner } from "../components/UI";

const RISK_BADGE = {
  high: "red",
  medium: "amber",
  low: "green",
};

const STATUS_BADGE = {
  pending_review: "amber",
  active: "red",
  field_verification_requested: "blue",
  acknowledged: "blue",
  verified: "green",
  resolved: "green",
  closed: "gray",
  escalated: "red",
  rejected: "gray",
};

const STATUS_LABELS = {
  pending_review: "Pending Review",
  active: "Active",
  field_verification_requested: "Field Verification",
  acknowledged: "Acknowledged",
  verified: "Verified",
  resolved: "Resolved",
  closed: "Closed",
  escalated: "Escalated",
  rejected: "Rejected",
};

const VALID_TRANSITIONS = {
  pending_review: ["active", "rejected"],
  active: ["field_verification_requested", "acknowledged", "escalated"],
  field_verification_requested: ["verified", "escalated"],
  acknowledged: ["resolved", "escalated"],
  verified: ["resolved", "closed"],
};

function AlertCard({ alert, onStatusChange }) {
  const nextStatuses = VALID_TRANSITIONS[alert.status] || [];
  return (
    <div className="alert-card">
      <div className={`alert-card-risk ${alert.risk_level ?? "low"}`}>
        <AlertTriangle size={18} />
      </div>
      <div className="alert-card-body">
        <div className="alert-card-title">
          <strong>{alert.district}</strong>
          <Badge variant={RISK_BADGE[alert.risk_level] ?? "gray"}>{alert.risk_level}</Badge>
          <Badge variant={STATUS_BADGE[alert.status] ?? "gray"}>{STATUS_LABELS[alert.status] ?? alert.status?.replace(/_/g, " ")}</Badge>
        </div>
        <div className="alert-card-meta">{alert.alert_date}</div>
        <div className="alert-card-reason">{alert.risk_reason}</div>
        {alert.recommended_action && (
          <div className="alert-card-action">→ {alert.recommended_action}</div>
        )}
        {alert.rule_or_model_version && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Model: {alert.rule_or_model_version}</div>
        )}
        {alert.uncertainty_level && (
          <Badge variant={alert.uncertainty_level === "high" ? "amber" : alert.uncertainty_level === "low" ? "green" : "blue"}>
            Uncertainty: {alert.uncertainty_level}
          </Badge>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {nextStatuses.includes("active") && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "active")}>
              <CheckCircle size={12} /> Approve
            </button>
          )}
          {nextStatuses.includes("rejected") && (
            <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "rejected")}>
              Reject
            </button>
          )}
          {nextStatuses.includes("field_verification_requested") && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "field_verification_requested")}>
              <ClipboardCheck size={12} /> Request Field Verification
            </button>
          )}
          {nextStatuses.includes("acknowledged") && (
            <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "acknowledged")}>
              <Clock size={12} /> Acknowledge
            </button>
          )}
          {nextStatuses.includes("verified") && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "verified")}>
              <Shield size={12} /> Mark Verified
            </button>
          )}
          {nextStatuses.includes("resolved") && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "resolved")}>
              <CheckCircle size={12} /> Resolve
            </button>
          )}
          {nextStatuses.includes("escalated") && (
            <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px", borderColor: "var(--red-400)", color: "var(--red-600)" }}
              onClick={() => onStatusChange(alert.alert_id, "escalated")}>
              <AlertTriangle size={12} /> Escalate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const DISTRICTS = ["Bugesera", "Gasabo", "Kicukiro", "Nyarugenge", "Musanze", "Rubavu", "Huye", "Nyagatare", "Rwamagana", "Kayonza"];

export default function Alerts() {
  const { data, loading, error } = useFetch(api.alerts);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);
  const [alerts, setAlerts] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    district: "Bugesera",
    risk_level: "medium",
    risk_reason: "",
    recommended_action: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data?.items) setAlerts(null);
  }, [data]);

  const items = alerts ?? data?.items ?? [];
  const actionRows = intelligence?.action_queue ?? [];

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateAlertStatus(id, status);
      setAlerts(items.map((a) => a.alert_id === id ? { ...a, ...updated } : a));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.risk_reason.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.createAlert(form);
      setAlerts([created, ...items]);
      setShowForm(false);
      setForm({ district: "Bugesera", risk_level: "medium", risk_reason: "", recommended_action: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const pending = items.filter((a) => a.status === "pending_review").length;
  const active = items.filter((a) => a.status === "active").length;
  const fieldRequested = items.filter((a) => a.status === "field_verification_requested").length;
  const escalated = items.filter((a) => a.status === "escalated").length;

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Field verification board</div>
          <h2>Regional signal review and operational actions</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="amber">Review workflow</Badge>
          <Badge variant="blue">Prototype</Badge>
        </div>
      </div>

      <SectionCard title="Signal and action queue" icon={AlertTriangle}>
        <MetricStrip
          items={[
            { label: "Pending Review", value: pending },
            { label: "Active", value: active },
            { label: "Field Verification", value: fieldRequested },
            { label: "Escalated", value: escalated },
            { label: "System Actions", value: iL ? "..." : actionRows.length },
            { label: "Sentinels Mapped", value: iL ? "..." : intelligence?.summary?.mapped_sentinel_sites ?? 0 },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="Response interpretation"
        verdict="The response board supports a preparedness verification workflow: review evidence, assign owners, request field verification, and document decisions before any public-health action label."
        tone={escalated > 0 ? "red" : active > 0 ? "amber" : pending > 0 ? "amber" : "teal"}
        confidence="Current actions are operational planning tasks; official alerts require technical and institutional review."
        items={[
          {
            label: "Queue status",
            value: `${actionRows.length} system actions · ${items.length} manual alerts`,
            note: "Use this board for team coordination and PI review.",
          },
          {
            label: "Workflow",
            value: "Review → Approve → Field Verify → Resolve",
            note: "Each alert follows a structured status workflow with clear transitions.",
          },
          {
            label: "Governance",
            value: "Review before action",
            note: "Preparedness signal does not equal official outbreak alert.",
          },
        ]}
      />

      <SectionCard title="Preparedness action board" icon={ClipboardCheck}>
        <ChartState loading={iL} error={iError} rows={actionRows} empty="No preparedness actions loaded.">
          <DataTable
            rows={actionRows}
            columns={["priority", "action", "owner", "evidence", "decision_use"]}
          />
        </ChartState>
      </SectionCard>

      <SectionCard
        title="Manual review board"
        icon={AlertTriangle}
        action={
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> New Alert
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>District</label>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Risk Level</label>
                <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Risk Reason *</label>
              <input value={form.risk_reason} onChange={(e) => setForm({ ...form, risk_reason: e.target.value })}
                placeholder="Describe the risk signal..."
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Recommended Action</label>
              <input value={form.recommended_action} onChange={(e) => setForm({ ...form, recommended_action: e.target.value })}
                placeholder="e.g. Increase larval surveillance..."
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <RefreshCw size={13} /> : <Plus size={13} />} Create Alert
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? <Spinner /> : items.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No alerts yet"
              description="Create a preparedness alert to start the review workflow. Alerts track climate signals, vector context, and field verification status."
            />
          ) : (
            items.map((a) => (
              <AlertCard key={a.alert_id} alert={a} onStatusChange={handleStatusChange} />
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
