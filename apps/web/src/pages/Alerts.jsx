import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle, ClipboardCheck, Clock, Columns, List,
  Plus, RefreshCw, Shield, Table2, Users,
} from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, EmptyState, MetricStrip, SectionCard, Spinner } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const RISK_BADGE = { high: "red", medium: "amber", low: "green" };
const STATUS_BADGE = {
  pending_review: "amber", active: "red", field_verification_requested: "blue",
  acknowledged: "blue", verified: "green", resolved: "green",
  closed: "gray", escalated: "red", rejected: "gray",
};
const STATUS_LABELS = {
  pending_review: "Pending Review", active: "Active",
  field_verification_requested: "Field Verification", acknowledged: "Acknowledged",
  verified: "Verified", resolved: "Resolved", closed: "Closed",
  escalated: "Escalated", rejected: "Rejected",
};
const VALID_TRANSITIONS = {
  pending_review: ["active", "rejected"],
  active: ["field_verification_requested", "acknowledged", "escalated"],
  field_verification_requested: ["verified", "escalated"],
  acknowledged: ["resolved", "escalated"],
  verified: ["resolved", "closed"],
};
const KANBAN_COLUMNS = ["pending_review", "active", "field_verification_requested", "verified", "resolved"];
const DISTRICTS = ["Bugesera", "Gasabo", "Kicukiro", "Nyarugenge", "Musanze", "Rubavu", "Huye", "Nyagatare", "Rwamagana", "Kayonza"];

function AlertCard({ alert, onStatusChange, onRequestVerification }) {
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
        {alert.recommended_action && <div className="alert-card-action">→ {alert.recommended_action}</div>}
        {alert.uncertainty_level && (
          <Badge variant={alert.uncertainty_level === "high" ? "amber" : "blue"}>Uncertainty: {alert.uncertainty_level}</Badge>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {nextStatuses.includes("active") && (
            <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => onStatusChange(alert.alert_id, "active")}>
              <CheckCircle size={11} /> Approve
            </button>
          )}
          {nextStatuses.includes("field_verification_requested") && (
            <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => { onStatusChange(alert.alert_id, "field_verification_requested"); onRequestVerification(alert); }}>
              <ClipboardCheck size={11} /> Verify
            </button>
          )}
          {nextStatuses.includes("resolved") && (
            <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => onStatusChange(alert.alert_id, "resolved")}>
              <CheckCircle size={11} /> Resolve
            </button>
          )}
          {nextStatuses.includes("escalated") && (
            <button className="btn btn-outline" style={{ fontSize: 11, padding: "4px 10px", borderColor: "var(--red-400)", color: "var(--red-600)" }} onClick={() => onStatusChange(alert.alert_id, "escalated")}>
              <AlertTriangle size={11} /> Escalate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanView({ items, onStatusChange, onRequestVerification }) {
  const grouped = useMemo(() => {
    const g = {};
    KANBAN_COLUMNS.forEach((c) => { g[c] = []; });
    items.forEach((a) => { if (g[a.status]) g[a.status].push(a); });
    return g;
  }, [items]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(200px, 1fr))`, gap: 12, padding: "14px 16px", overflowX: "auto" }}>
      {KANBAN_COLUMNS.map((col) => (
        <div key={col} style={{ minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "0 4px" }}>
            <Badge variant={STATUS_BADGE[col]}>{STATUS_LABELS[col]}</Badge>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{grouped[col].length}</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {grouped[col].map((a) => (
              <div key={a.alert_id} style={{ padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <strong style={{ fontSize: 12 }}>{a.district}</strong>
                  <Badge variant={RISK_BADGE[a.risk_level] ?? "gray"}>{a.risk_level}</Badge>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.4 }}>{a.risk_reason?.slice(0, 80)}{a.risk_reason?.length > 80 ? "…" : ""}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {VALID_TRANSITIONS[a.status]?.includes("active") && (
                    <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--teal-200)", background: "var(--teal-50)", color: "var(--teal-700)", fontWeight: 600, cursor: "pointer" }} onClick={() => onStatusChange(a.alert_id, "active")}>Approve</button>
                  )}
                  {VALID_TRANSITIONS[a.status]?.includes("field_verification_requested") && (
                    <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--blue-100)", background: "#eff6ff", color: "var(--blue-600)", fontWeight: 600, cursor: "pointer" }} onClick={() => { onStatusChange(a.alert_id, "field_verification_requested"); onRequestVerification(a); }}>Verify</button>
                  )}
                  {VALID_TRANSITIONS[a.status]?.includes("resolved") && (
                    <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--green-100)", background: "var(--green-50)", color: "var(--green-600)", fontWeight: 600, cursor: "pointer" }} onClick={() => onStatusChange(a.alert_id, "resolved")}>Resolve</button>
                  )}
                </div>
              </div>
            ))}
            {grouped[col].length === 0 && (
              <div style={{ padding: 16, textAlign: "center", fontSize: 11, color: "var(--text-muted)", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)" }}>No alerts</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Alerts() {
  const { data, loading, refresh } = useFetch(api.alerts);
  const { data: actionsData, refresh: refreshActions } = useFetch(api.responseActions);
  const { data: intelligence, loading: iL } = useFetch(api.arboviralIntelligence);

  const [viewMode, setViewMode] = useState("kanban");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ district: "Bugesera", risk_level: "medium", risk_reason: "", recommended_action: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionForm, setActionForm] = useState({ alert_id: "", action_type: "", responsible_organization: "", action_due_date: "" });

  const items = data?.items ?? [];
  const actionRows = intelligence?.action_queue ?? [];
  const responseActions = actionsData?.items ?? [];

  async function handleCreateAction(event) {
    event.preventDefault();
    try {
      await api.createResponseAction({ ...actionForm, action_due_date: actionForm.action_due_date || null });
      setShowActionForm(false); setActionForm({ alert_id: "", action_type: "", responsible_organization: "", action_due_date: "" });
      refreshActions(); setToast({ message: "Response action assigned", type: "success" });
    } catch (error) { setToast({ message: error.message, type: "error" }); }
  }

  async function advanceAction(action, nextStatus) {
    const evidence = nextStatus === "completed" ? window.prompt("Enter completion evidence or follow-up result") : null;
    if (nextStatus === "completed" && !evidence) return;
    try { await api.updateResponseAction(action.action_id, { action_status: nextStatus, follow_up_result: evidence }); refreshActions(); }
    catch (error) { setToast({ message: error.message, type: "error" }); }
  }

  const filteredItems = items.filter((a) => {
    if (districtFilter !== "all" && a.district !== districtFilter) return false;
    if (riskFilter !== "all" && a.risk_level !== riskFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateAlertStatus(id, status);
      refresh?.();
    } catch (e) { console.error(e); }
  }

  async function handleRequestVerification(alert) {
    try {
      await api.createFieldVerification({
        district: alert.district,
        reason_for_visit: alert.recommended_action || `Field verification for ${alert.district} preparedness signal`,
        climate_trigger: alert.risk_reason,
        alert_id: alert.alert_id,
        suspected_vector_group: "Aedes",
      });
      setToast({ message: `Verification request created for ${alert.district}`, type: "success" });
    } catch {
      setToast({ message: `Failed to create verification request`, type: "error" });
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.risk_reason.trim()) return;
    setSubmitting(true);
    try {
      await api.createAlert(form);
      refresh?.();
      setShowForm(false);
      setForm({ district: "Bugesera", risk_level: "medium", risk_reason: "", recommended_action: "" });
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  const pending = items.filter((a) => a.status === "pending_review").length;
  const active = items.filter((a) => a.status === "active").length;
  const escalated = items.filter((a) => a.status === "escalated").length;

  const csvRows = filteredItems.map((a) => ({
    district: a.district, risk_level: a.risk_level, status: a.status,
    risk_reason: a.risk_reason, date: a.alert_date,
  }));

  return (
    <div className="page">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Response Board</h2>
          <div className="page-subtitle">Preparedness alert review and operational action tracking</div>
          <div className="page-header-badges">
            <Badge variant="amber">Review workflow</Badge>
            <Badge variant="blue">Not official outbreak alerts</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar csvFilename="dengueew_gl_alerts" csvRows={csvRows} jsonData={filteredItems} />
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 12 }}>
            <Plus size={13} /> New Alert
          </button>
        </div>
      </div>

      {/* ── METRICS ── */}
      <SectionCard title="Queue status" icon={AlertTriangle}>
        <MetricStrip items={[
          { label: "Pending", value: pending },
          { label: "Active", value: active },
          { label: "Escalated", value: escalated },
          { label: "Total", value: items.length },
          { label: "System actions", value: iL ? "…" : actionRows.length },
        ]} />
      </SectionCard>

      <div style={{ marginBottom: 20 }} />

      {/* ── FILTERS + VIEW TOGGLE ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff" }}>
          <option value="all">All districts</option>
          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff" }}>
          <option value="all">All risk</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff" }}>
          <option value="all">All status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button onClick={() => setViewMode("kanban")} style={{ padding: "5px 10px", fontSize: 11, border: `1px solid ${viewMode === "kanban" ? "var(--teal-400)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", background: viewMode === "kanban" ? "var(--teal-50)" : "#fff", color: viewMode === "kanban" ? "var(--teal-700)" : "var(--text-muted)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Columns size={12} /> Kanban
          </button>
          <button onClick={() => setViewMode("table")} style={{ padding: "5px 10px", fontSize: 11, border: `1px solid ${viewMode === "table" ? "var(--teal-400)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", background: viewMode === "table" ? "var(--teal-50)" : "#fff", color: viewMode === "table" ? "var(--teal-700)" : "var(--text-muted)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Table2 size={12} /> Table
          </button>
        </div>
      </div>

      {/* ── CREATE FORM ── */}
      {showForm && (
        <SectionCard title="Create preparedness alert" icon={Plus}>
          <form onSubmit={handleCreate} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>District</label>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12 }}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>Risk Level</label>
                <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12 }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>Risk Reason *</label>
              <input value={form.risk_reason} onChange={(e) => setForm({ ...form, risk_reason: e.target.value })} placeholder="Describe the preparedness signal…" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>Recommended Action</label>
              <input value={form.recommended_action} onChange={(e) => setForm({ ...form, recommended_action: e.target.value })} placeholder="e.g. Increase larval surveillance…" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontSize: 12 }}>
                {submitting ? <RefreshCw size={12} /> : <Plus size={12} />} Create
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} style={{ fontSize: 12 }}>Cancel</button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* ── KANBAN OR TABLE VIEW ── */}
      <SectionCard title="Alert queue" icon={AlertTriangle} action={<Badge variant="gray">{filteredItems.length} alerts</Badge>}>
        {loading ? <Spinner /> : filteredItems.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No alerts match your filter" description="Try adjusting the district, risk, or status filters above." />
        ) : viewMode === "kanban" ? (
          <KanbanView items={filteredItems} onStatusChange={handleStatusChange} onRequestVerification={handleRequestVerification} />
        ) : (
          <div style={{ padding: "12px 16px", display: "grid", gap: 8 }}>
            {filteredItems.map((a) => (
              <AlertCard key={a.alert_id} alert={a} onStatusChange={handleStatusChange} onRequestVerification={handleRequestVerification} />
            ))}
          </div>
        )}
      </SectionCard>

      <div style={{ marginBottom: 20 }} />
      <SectionCard title="Assigned response actions" icon={Users} action={<button className="btn btn-primary" onClick={() => setShowActionForm((value) => !value)}><Plus size={12} /> Assign</button>}>
        {showActionForm && <form onSubmit={handleCreateAction} className="pilot-form-band">
          <div className="pilot-form-grid">
            <label className="pilot-field"><span>Alert *</span><select required value={actionForm.alert_id} onChange={(e) => setActionForm({ ...actionForm, alert_id: e.target.value })}><option value="">Select alert</option>{items.map((alert) => <option value={alert.alert_id} key={alert.alert_id}>{alert.district} · {alert.alert_date}</option>)}</select></label>
            <label className="pilot-field"><span>Action *</span><input required value={actionForm.action_type} onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })} placeholder="Larval source inspection" /></label>
            <label className="pilot-field"><span>Responsible organization *</span><input required value={actionForm.responsible_organization} onChange={(e) => setActionForm({ ...actionForm, responsible_organization: e.target.value })} /></label>
            <label className="pilot-field"><span>Due date</span><input type="date" value={actionForm.action_due_date} onChange={(e) => setActionForm({ ...actionForm, action_due_date: e.target.value })} /></label>
          </div>
          <div className="pilot-form-actions"><button className="btn btn-primary">Assign action</button></div>
        </form>}
        {!responseActions.length ? <EmptyState icon={Users} title="No response actions assigned" description="Approve a signal, then assign an accountable field or service response." /> : <div className="table-wrap"><table><thead><tr><th>Action</th><th>Organization</th><th>Due</th><th>Status</th><th>Follow-up</th><th>Next</th></tr></thead><tbody>{responseActions.map((action) => { const next = { assigned: "acknowledged", acknowledged: "in_progress", in_progress: "completed" }[action.action_status]; return <tr key={action.action_id}><td><strong>{action.action_type}</strong></td><td>{action.responsible_organization}</td><td>{action.action_due_date ?? "—"}</td><td><Badge variant={action.action_status === "completed" ? "green" : "blue"}>{action.action_status?.replace(/_/g, " ")}</Badge></td><td>{action.follow_up_result ?? "—"}</td><td>{next ? <button className="btn btn-outline" onClick={() => advanceAction(action, next)}>{next.replace(/_/g, " ")}</button> : "—"}</td></tr>; })}</tbody></table></div>}
      </SectionCard>
    </div>
  );
}
