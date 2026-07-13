import React, { useState } from "react";
import { CheckCircle, ClipboardCheck, FileText, MapPin, Plus, RefreshCw, Upload } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, InterpretationPanel, MetricStrip, SectionCard, Spinner } from "../components/UI";

const VF_STATUS_BADGE = {
  pending: "amber",
  in_progress: "blue",
  data_collected: "blue",
  larvae_confirmed: "red",
  larvae_not_found: "green",
  adults_collected: "amber",
  completed: "green",
  escalated: "red",
};

const VF_STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  data_collected: "Data Collected",
  larvae_confirmed: "Larvae Confirmed",
  larvae_not_found: "Larvae Not Found",
  adults_collected: "Adults Collected",
  completed: "Completed",
  escalated: "Escalated",
};

const DISTRICTS = ["Bugesera", "Gasabo", "Kicukiro", "Nyarugenge", "Musanze", "Rubavu", "Huye", "Nyagatare", "Rwamagana", "Kayonza"];
const VECTOR_GROUPS = ["Aedes", "Culex", "Anopheles", "Unknown"];
const BREEDING_SOURCES = ["Water storage container", "Tire", "Roof gutter", "Flower pot", "Pond", "Drainage channel", "Rice paddy", "Natural pool", "Other"];

function VerificationCard({ v, onUpdate }) {
  const statusBadge = VF_STATUS_BADGE[v.status] ?? "gray";
  return (
    <div className="alert-card">
      <div className={`alert-card-risk ${v.status === "larvae_confirmed" || v.status === "escalated" ? "high" : v.status === "completed" ? "low" : "medium"}`}>
        <ClipboardCheck size={18} />
      </div>
      <div className="alert-card-body">
        <div className="alert-card-title">
          <strong>{v.district}</strong>
          <Badge variant={statusBadge}>{VF_STATUS_LABELS[v.status] ?? v.status}</Badge>
          {v.suspected_vector_group && <Badge variant="blue">{v.suspected_vector_group}</Badge>}
        </div>
        <div className="alert-card-meta">{v.created_date}</div>
        <div className="alert-card-reason">{v.reason_for_visit}</div>
        {v.site_name && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Site: {v.site_name}</div>}
        {v.climate_trigger && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Climate trigger: {v.climate_trigger}</div>}
        {v.suspected_breeding_source && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Suspected source: {v.suspected_breeding_source}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {v.status === "pending" && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onUpdate(v.verification_id, { status: "in_progress" })}>
              <MapPin size={12} /> Start Verification
            </button>
          )}
          {v.status === "in_progress" && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onUpdate(v.verification_id, { status: "data_collected" })}>
              <Upload size={12} /> Mark Data Collected
            </button>
          )}
          {v.status === "data_collected" && (
            <>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
                onClick={() => onUpdate(v.verification_id, { status: "larvae_confirmed" })}>
                <CheckCircle size={12} /> Larvae Confirmed
              </button>
              <button className="btn btn-outline" style={{ fontSize: 12, padding: "5px 12px" }}
                onClick={() => onUpdate(v.verification_id, { status: "larvae_not_found" })}>
                Larvae Not Found
              </button>
            </>
          )}
          {(v.status === "larvae_confirmed" || v.status === "larvae_not_found" || v.status === "adults_collected") && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 12px" }}
              onClick={() => onUpdate(v.verification_id, { status: "completed" })}>
              <CheckCircle size={12} /> Mark Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FieldVerification() {
  const { data, loading } = useFetch(api.fieldVerifications);
  const { data: templates, loading: tL } = useFetch(api.fieldVerificationChecklistTemplates);
  const { data: risk, loading: rL } = useFetch(() => api.districtRisk(30));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    district: "Bugesera",
    reason_for_visit: "",
    climate_trigger: "",
    suspected_vector_group: "Aedes",
    suspected_breeding_source: "",
    site_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const items = data?.items ?? [];
  const templateItems = templates?.items ?? [];
  const riskItems = risk?.items ?? [];

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.reason_for_visit.trim()) return;
    setSubmitting(true);
    try {
      await api.createFieldVerification(form);
      setShowForm(false);
      setForm({ district: "Bugesera", reason_for_visit: "", climate_trigger: "", suspected_vector_group: "Aedes", suspected_breeding_source: "", site_name: "" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id, updates) {
    try {
      await api.updateFieldVerification(id, updates);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }

  const pending = items.filter((v) => v.status === "pending").length;
  const inProgress = items.filter((v) => v.status === "in_progress").length;
  const completed = items.filter((v) => v.status === "completed").length;

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Field verification module</div>
          <h2>Verification requests and pilot checklists</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="amber">Pilot data pending</Badge>
          <Badge variant="blue">Operational design</Badge>
        </div>
      </div>

      <SectionCard title="Verification status" icon={ClipboardCheck}>
        <MetricStrip
          items={[
            { label: "Pending", value: pending },
            { label: "In Progress", value: inProgress },
            { label: "Completed", value: completed },
            { label: "Total Requests", value: items.length },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="How field verification works"
        verdict="When the system identifies a high-priority climate-vector signal, field teams can create a verification request to inspect the site, check for breeding habitats, and collect evidence. This module is the operational bridge between climate screening and ground truth."
        tone="teal"
        confidence="This module provides the operational workflow design. Actual field data collection begins during the funded pilot phase."
        items={[
          { label: "Workflow", value: "Create → Start → Collect → Verify → Complete", note: "Structured status progression" },
          { label: "Checklists", value: `${templateItems.length} templates available`, note: "Larval inspection, adult trap, community observation" },
          { label: "Data flow", value: "Pilot data pending", note: "Results will feed back into model validation" },
        ]}
      />

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <SectionCard title="Climate triggers for verification" icon={ClipboardCheck}>
          <ChartState loading={rL} rows={riskItems.slice(0, 5)} empty="No risk signals available.">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Risk Level</th>
                    <th>Suitability</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {riskItems.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td><strong>{String(r.district ?? "").replace(/\b\w/g, (c) => c.toUpperCase())}</strong></td>
                      <td><Badge variant={r.risk_level === "high" ? "red" : r.risk_level === "medium" ? "amber" : "green"}>{r.risk_level}</Badge></td>
                      <td>{Number(r.suitability_index ?? 0).toFixed(3)}</td>
                      <td>
                        <button className="btn btn-outline" style={{ fontSize: 11, padding: "3px 8px" }}
                          onClick={() => {
                            setForm({ ...form, district: String(r.district ?? "").replace(/\b\w/g, (c) => c.toUpperCase()), reason_for_visit: `Climate suitability signal: ${r.risk_level} risk with suitability index ${Number(r.suitability_index ?? 0).toFixed(3)}`, climate_trigger: `Temperature ${r.tmean_c}C, 7-day rainfall ${r.rainfall_7d_mm}mm` });
                            setShowForm(true);
                          }}>
                          Create Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Checklist templates" icon={FileText}>
          <ChartState loading={tL} rows={templateItems} empty="No templates available.">
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {templateItems.map((t, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>{t.name}</strong>
                    <Badge variant="gray">{t.items?.length ?? 0} items</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{t.description}</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.5, color: "var(--text-muted)" }}>
                    {(t.items ?? []).slice(0, 4).map((item, j) => <li key={j}>{item}</li>)}
                    {(t.items?.length ?? 0) > 4 && <li>... and {(t.items?.length ?? 0) - 4} more items</li>}
                  </ul>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard
        title="Verification requests"
        icon={ClipboardCheck}
        action={
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> New Request
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>District *</label>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Site Name</label>
                <input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                  placeholder="e.g. Sentinele A"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Suspected Vector</label>
                <select value={form.suspected_vector_group} onChange={(e) => setForm({ ...form, suspected_vector_group: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }}>
                  {VECTOR_GROUPS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Breeding Source</label>
                <select value={form.suspected_breeding_source} onChange={(e) => setForm({ ...form, suspected_breeding_source: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }}>
                  <option value="">Select...</option>
                  {BREEDING_SOURCES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Climate Trigger</label>
                <input value={form.climate_trigger} onChange={(e) => setForm({ ...form, climate_trigger: e.target.value })}
                  placeholder="e.g. Temperature 24C, rainfall 45mm"
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Reason for Visit *</label>
              <input value={form.reason_for_visit} onChange={(e) => setForm({ ...form, reason_for_visit: e.target.value })}
                placeholder="Describe why this site needs field verification..."
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <RefreshCw size={13} /> : <Plus size={13} />} Create Request
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? <Spinner /> : items.length === 0 ? (
            <div className="empty">
              <ClipboardCheck size={18} />
              <div>No verification requests yet.</div>
              <small>Create a request from the climate trigger table above or manually.</small>
            </div>
          ) : (
            items.map((v) => (
              <VerificationCard key={v.verification_id} v={v} onUpdate={handleUpdate} />
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
