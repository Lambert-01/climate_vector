import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Plus, RefreshCw } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { AlertBanner, Badge, SectionCard, Spinner } from "../components/UI";

const RISK_BADGE = {
  high: "red",
  medium: "amber",
  low: "green",
};

const STATUS_BADGE = {
  pending_review: "amber",
  active: "red",
  acknowledged: "blue",
  resolved: "green",
  rejected: "gray",
};

function AlertCard({ alert, onStatusChange }) {
  return (
    <div className="alert-card">
      <div className={`alert-card-risk ${alert.risk_level ?? "low"}`}>
        {alert.risk_level === "high" ? "🔴" : alert.risk_level === "medium" ? "🟡" : "🟢"}
      </div>
      <div className="alert-card-body">
        <div className="alert-card-title">
          <strong>{alert.district}</strong>
          <Badge variant={RISK_BADGE[alert.risk_level] ?? "gray"}>{alert.risk_level}</Badge>
          <Badge variant={STATUS_BADGE[alert.status] ?? "gray"}>{alert.status?.replace(/_/g, " ")}</Badge>
        </div>
        <div className="alert-card-meta">{alert.alert_date}</div>
        <div className="alert-card-reason">{alert.risk_reason}</div>
        {alert.recommended_action && (
          <div className="alert-card-action">→ {alert.recommended_action}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {alert.status === "pending_review" && (
            <>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
                onClick={() => onStatusChange(alert.alert_id, "active")}>
                <CheckCircle size={12} /> Approve
              </button>
              <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}
                onClick={() => onStatusChange(alert.alert_id, "rejected")}>
                Reject
              </button>
            </>
          )}
          {alert.status === "active" && (
            <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "acknowledged")}>
              <Clock size={12} /> Acknowledge
            </button>
          )}
          {alert.status === "acknowledged" && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onStatusChange(alert.alert_id, "resolved")}>
              <CheckCircle size={12} /> Mark Resolved
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
  const [alerts, setAlerts] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    district: "Bugesera",
    risk_level: "medium",
    risk_reason: "",
    recommended_action: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const items = alerts ?? data?.items ?? [];

  async function handleStatusChange(id, status) {
    try {
      await api.updateAlertStatus(id, status);
      setAlerts(items.map((a) => a.alert_id === id ? { ...a, status } : a));
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>Alerts & Response</h2>
        <p>Risk signal review, approval, and action tracking</p>
      </div>

      <AlertBanner
        type="info"
        title="Alert workflow"
        message="All alerts require technical review and approval before being sent to district/RBC actors. Current alerts are prototype rule-based signals only."
      />

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="stat-card" style={{ flex: "1 1 160px" }}>
          <div className="stat-icon amber"><AlertTriangle size={18} /></div>
          <div className="stat-body">
            <div className="stat-value">{pending}</div>
            <div className="stat-label">Pending review</div>
          </div>
        </div>
        <div className="stat-card" style={{ flex: "1 1 160px" }}>
          <div className="stat-icon red"><AlertTriangle size={18} /></div>
          <div className="stat-body">
            <div className="stat-value">{active}</div>
            <div className="stat-label">Active alerts</div>
          </div>
        </div>
        <div className="stat-card" style={{ flex: "1 1 160px" }}>
          <div className="stat-icon teal"><CheckCircle size={18} /></div>
          <div className="stat-body">
            <div className="stat-value">{items.filter((a) => a.status === "resolved").length}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      <SectionCard
        title="Alert List"
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
            <div className="empty">No alerts yet.</div>
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
