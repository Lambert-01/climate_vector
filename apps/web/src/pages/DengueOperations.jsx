import React, { useMemo, useState } from "react";
import {
  BarChart3, CheckCircle2, ClipboardList, Dna, FileCheck2,
  MapPin, Microscope, Plus, Send, ShieldCheck, Smartphone, Target,
} from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, EmptyState, MetricStrip, ProgressBar, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const TABS = [
  { id: "readiness", label: "Submission readiness", icon: ShieldCheck },
  { id: "aedes", label: "Aedes surveillance", icon: Microscope },
  { id: "community", label: "Community reports", icon: Smartphone },
  { id: "genomics", label: "Genomic registry", icon: Dna },
  { id: "mel", label: "MEL", icon: BarChart3 },
];

const DISTRICTS = [
  "Bugesera", "Burera", "Gasabo", "Gakenke", "Gatsibo", "Gicumbi", "Gisagara", "Huye",
  "Kamonyi", "Karongi", "Kayonza", "Kicukiro", "Kirehe", "Muhanga", "Musanze", "Ngoma",
  "Ngororero", "Nyabihu", "Nyagatare", "Nyamagabe", "Nyamasheke", "Nyanza", "Nyarugenge",
  "Nyaruguru", "Rubavu", "Ruhango", "Rulindo", "Rusizi", "Rutsiro", "Rwamagana",
];

const today = () => new Date().toISOString().slice(0, 10);
const numberOrNull = (value) => value === "" ? null : Number(value);

function statusBadge(status) {
  if (["implemented", "ready", "validated", "accepted", "complete", "active"].includes(status)) return "green";
  if (["workflow_ready", "context_only", "pilot_active", "pending_review", "queued"].includes(status)) return "blue";
  if (["grant_period_work", "pilot_required", "formal_access_required", "baseline_pending"].includes(status)) return "amber";
  return "gray";
}

function label(value) {
  return String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Field({ label: fieldLabel, required, children }) {
  return (
    <label className="pilot-field">
      <span>{fieldLabel}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function ReadinessView({ readiness, modelReadiness }) {
  const pillars = readiness?.pillars ?? [];
  const gates = modelReadiness?.gates ?? [];
  const implemented = pillars.filter((row) => row.status === "implemented").length;
  const workflows = pillars.filter((row) => ["workflow_ready", "pilot_active"].includes(row.status)).length;
  const grantWork = pillars.filter((row) => ["grant_period_work", "formal_access_required"].includes(row.status)).length;
  const readinessPct = pillars.length ? Math.round(((implemented + workflows * 0.65) / pillars.length) * 100) : 0;

  return (
    <>
      <div className="pilot-kpi-grid">
        <div className="pilot-kpi accent-green"><span>Architecture</span><strong>{implemented}</strong><small>implemented pillars</small></div>
        <div className="pilot-kpi accent-blue"><span>Pilot workflows</span><strong>{workflows}</strong><small>ready to receive data</small></div>
        <div className="pilot-kpi accent-amber"><span>Grant work</span><strong>{grantWork}</strong><small>requires prospective evidence</small></div>
        <div className="pilot-kpi accent-teal"><span>Submission position</span><strong>{readinessPct}%</strong><small>technical foundation</small></div>
      </div>

      <div className="grid-2 pilot-section-gap">
        <SectionCard title="Proposal delivery pillars" icon={Target}>
          <div className="pilot-status-list">
            {pillars.map((row) => (
              <div className="pilot-status-row" key={row.pillar}>
                <div className="pilot-status-icon"><CheckCircle2 size={15} /></div>
                <div className="pilot-status-copy"><strong>{row.pillar}</strong><span>{row.evidence}</span></div>
                <Badge variant={statusBadge(row.status)}>{label(row.status)}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Forecast training gates" icon={FileCheck2}>
          <div className="pilot-status-list">
            {gates.map((gate) => (
              <div className="pilot-status-row" key={gate.gate}>
                <div className="pilot-status-copy">
                  <strong>{label(gate.gate)}</strong>
                  <span>{gate.requirement}</span>
                </div>
                <div className="pilot-gate-count">{gate.count}</div>
                <Badge variant={statusBadge(gate.status)}>{label(gate.status)}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Validation design registered for the funded pilot" icon={BarChart3}>
        <div className="pilot-validation-grid">
          {(modelReadiness?.validation_plan ?? []).map((item, index) => (
            <div className="pilot-validation-item" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}

function AedesView({ payload, summary, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    district: "", collection_date: today(), trap_type: "ovitrap", site_id: "",
    trap_hours: "", traps_deployed: "", containers_inspected: "", containers_positive: "",
    eggs_count: "", larvae_count: "", adults_count: "", species: "", identification_method: "",
    collector_code: "", notes: "",
  });
  const rows = payload?.items ?? [];
  const validated = rows.filter((row) => row.quality_status === "validated").length;

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await api.createDengueAedesSurveillance({
        ...form,
        site_id: form.site_id || null,
        trap_hours: numberOrNull(form.trap_hours),
        traps_deployed: numberOrNull(form.traps_deployed),
        containers_inspected: numberOrNull(form.containers_inspected),
        containers_positive: numberOrNull(form.containers_positive),
        eggs_count: numberOrNull(form.eggs_count),
        larvae_count: numberOrNull(form.larvae_count),
        adults_count: numberOrNull(form.adults_count),
        species: form.species || null,
        identification_method: form.identification_method || null,
        collector_code: form.collector_code || null,
        notes: form.notes || null,
      });
      setShowForm(false);
      refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally { setSaving(false); }
  }

  return (
    <>
      <MetricStrip items={[
        { label: "Pilot records", value: rows.length },
        { label: "Validated", value: validated },
        { label: "Container index", value: summary?.indices?.container_index_pct == null ? "Pending" : `${summary.indices.container_index_pct}%` },
        { label: "Adults / 24 trap-hours", value: summary?.indices?.adults_per_24_trap_hours ?? "Pending" },
      ]} />
      <div className="pilot-toolbar">
        <ExportToolbar csvFilename="dengue_aedes_surveillance" csvRows={rows} jsonData={rows} />
        <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}><Plus size={14} /> Add observation</button>
      </div>
      {showForm && (
        <form className="pilot-form-band" onSubmit={submit}>
          <div className="pilot-form-heading"><Microscope size={17} /><div><strong>Prospective Aedes observation</strong><span>Counts and effort are mandatory for scientific use.</span></div></div>
          <div className="pilot-form-grid">
            <Field label="District" required><select required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}><option value="">Select district</option>{DISTRICTS.map((district) => <option key={district}>{district}</option>)}</select></Field>
            <Field label="Collection date" required><input required type="date" max={today()} value={form.collection_date} onChange={(e) => setForm({ ...form, collection_date: e.target.value })} /></Field>
            <Field label="Method" required><select value={form.trap_type} onChange={(e) => setForm({ ...form, trap_type: e.target.value })}><option>ovitrap</option><option>BG-Sentinel</option><option>larval survey</option><option>aspirator</option><option>other</option></select></Field>
            <Field label="Site ID"><input value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} placeholder="Approved site code" /></Field>
            <Field label="Trap hours"><input type="number" min="0" step="0.5" value={form.trap_hours} onChange={(e) => setForm({ ...form, trap_hours: e.target.value })} /></Field>
            <Field label="Traps deployed"><input type="number" min="0" value={form.traps_deployed} onChange={(e) => setForm({ ...form, traps_deployed: e.target.value })} /></Field>
            <Field label="Containers inspected"><input type="number" min="0" value={form.containers_inspected} onChange={(e) => setForm({ ...form, containers_inspected: e.target.value })} /></Field>
            <Field label="Containers positive"><input type="number" min="0" value={form.containers_positive} onChange={(e) => setForm({ ...form, containers_positive: e.target.value })} /></Field>
            <Field label="Eggs"><input type="number" min="0" value={form.eggs_count} onChange={(e) => setForm({ ...form, eggs_count: e.target.value })} /></Field>
            <Field label="Larvae"><input type="number" min="0" value={form.larvae_count} onChange={(e) => setForm({ ...form, larvae_count: e.target.value })} /></Field>
            <Field label="Adults"><input type="number" min="0" value={form.adults_count} onChange={(e) => setForm({ ...form, adults_count: e.target.value })} /></Field>
            <Field label="Species"><input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} placeholder="Pending confirmation allowed" /></Field>
            <Field label="Identification"><input value={form.identification_method} onChange={(e) => setForm({ ...form, identification_method: e.target.value })} placeholder="Morphological / molecular" /></Field>
            <Field label="Collector code"><input value={form.collector_code} onChange={(e) => setForm({ ...form, collector_code: e.target.value })} placeholder="No personal name" /></Field>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="pilot-form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}><Send size={13} /> {saving ? "Saving..." : "Submit for review"}</button></div>
        </form>
      )}
      <SectionCard title="Prospective Aedes observations" icon={Microscope}>
        {!rows.length ? <EmptyState icon={Microscope} title="Pilot collection has not started" description="The workflow is ready for ovitrap, BG-Sentinel, larval survey and aspirator observations." /> : (
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>District</th><th>Method</th><th>Effort</th><th>Eggs</th><th>Larvae</th><th>Adults</th><th>Species</th><th>QC</th></tr></thead><tbody>{rows.map((row) => <tr key={row.record_id}><td>{row.collection_date}</td><td><strong>{row.district}</strong></td><td>{row.trap_type}</td><td>{row.trap_hours != null ? `${row.trap_hours} h` : row.containers_inspected != null ? `${row.containers_inspected} containers` : "—"}</td><td>{row.eggs_count ?? "—"}</td><td>{row.larvae_count ?? "—"}</td><td>{row.adults_count ?? "—"}</td><td>{row.species ?? "Pending"}</td><td><Badge variant={statusBadge(row.quality_status)}>{label(row.quality_status)}</Badge></td></tr>)}</tbody></table></div>
        )}
      </SectionCard>
    </>
  );
}

function CommunityView({ payload, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ reporter_role: "community_health_worker", district: "", site_name: "", latitude: "", longitude: "", breeding_source: "", water_present: "unknown", larvae_seen: "unknown", mosquito_level: "unknown", action_taken: "", notes: "", consent_confirmed: false });
  const rows = payload?.items ?? [];

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await api.createDengueCommunityReport({
        ...form,
        site_name: form.site_name || null,
        latitude: numberOrNull(form.latitude), longitude: numberOrNull(form.longitude),
        water_present: form.water_present === "unknown" ? null : form.water_present === "yes",
        larvae_seen: form.larvae_seen === "unknown" ? null : form.larvae_seen === "yes",
        action_taken: form.action_taken || null, notes: form.notes || null,
      });
      setShowForm(false); refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <MetricStrip items={[
        { label: "Reports", value: rows.length },
        { label: "Pending review", value: rows.filter((row) => row.review_status === "pending_review").length },
        { label: "Districts", value: new Set(rows.map((row) => row.district)).size },
        { label: "Reporter groups", value: new Set(rows.map((row) => row.reporter_role)).size },
      ]} />
      <div className="pilot-toolbar"><ExportToolbar csvFilename="dengue_community_reports" csvRows={rows} jsonData={rows} /><button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}><Plus size={14} /> New report</button></div>
      {showForm && (
        <form className="pilot-form-band" onSubmit={submit}>
          <div className="pilot-form-heading"><Smartphone size={17} /><div><strong>Community breeding-site observation</strong><span>No names, phone numbers or clinical diagnoses are collected.</span></div></div>
          <div className="pilot-form-grid">
            <Field label="Reporter role" required><select value={form.reporter_role} onChange={(e) => setForm({ ...form, reporter_role: e.target.value })}><option value="community_health_worker">Community health worker</option><option value="environmental_health_officer">Environmental health officer</option><option value="teacher">Teacher</option><option value="local_leader">Local leader</option><option value="farmer">Farmer</option><option value="community_member">Community member</option><option value="research_team">Research team</option></select></Field>
            <Field label="District" required><select required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}><option value="">Select district</option>{DISTRICTS.map((district) => <option key={district}>{district}</option>)}</select></Field>
            <Field label="Site or landmark"><input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></Field>
            <Field label="Breeding source" required><input required value={form.breeding_source} onChange={(e) => setForm({ ...form, breeding_source: e.target.value })} placeholder="Container, tyre, gutter..." /></Field>
            <Field label="Latitude"><input type="number" step="any" min="-12" max="6" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Field>
            <Field label="Longitude"><input type="number" step="any" min="27" max="36" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Field>
            <Field label="Water present"><select value={form.water_present} onChange={(e) => setForm({ ...form, water_present: e.target.value })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
            <Field label="Larvae seen"><select value={form.larvae_seen} onChange={(e) => setForm({ ...form, larvae_seen: e.target.value })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
            <Field label="Mosquito level"><select value={form.mosquito_level} onChange={(e) => setForm({ ...form, mosquito_level: e.target.value })}><option value="unknown">Unknown</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></Field>
            <Field label="Action taken"><input value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} placeholder="Source reduction / referred" /></Field>
          </div>
          <label className="pilot-consent"><input type="checkbox" checked={form.consent_confirmed} onChange={(e) => setForm({ ...form, consent_confirmed: e.target.checked })} /><span>I confirm informed participation and that this report contains no personal health information.</span></label>
          {error && <div className="form-error">{error}</div>}
          <div className="pilot-form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving || !form.consent_confirmed}><Send size={13} /> {saving ? "Saving..." : "Submit report"}</button></div>
        </form>
      )}
      <SectionCard title="Community observation queue" icon={ClipboardList}>
        {!rows.length ? <EmptyState icon={Smartphone} title="No community reports yet" description="The consent-aware reporting workflow is ready for pilot deployment." /> : <div className="table-wrap"><table><thead><tr><th>Submitted</th><th>District</th><th>Reporter</th><th>Source</th><th>Water</th><th>Larvae</th><th>Level</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.report_id}><td>{String(row.submitted_at).slice(0, 10)}</td><td><strong>{row.district}</strong></td><td>{label(row.reporter_role)}</td><td>{row.breeding_source}</td><td>{row.water_present == null ? "—" : row.water_present ? "Yes" : "No"}</td><td>{row.larvae_seen == null ? "—" : row.larvae_seen ? "Yes" : "No"}</td><td>{label(row.mosquito_level)}</td><td><Badge variant={statusBadge(row.review_status)}>{label(row.review_status)}</Badge></td></tr>)}</tbody></table></div>}
      </SectionCard>
    </>
  );
}

function GenomicsView({ payload, refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ sample_id: "", surveillance_record_id: "", district: "", collection_date: today(), mosquito_species: "Aedes aegypti", pool_size: "", extraction_status: "registered", sequencing_platform: "Oxford Nanopore MinION", sequencing_status: "not_started", dengue_result: "not_tested", qc_status: "pending", notes: "" });
  const rows = payload?.items ?? [];

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await api.createDengueGenomicSample({ ...form, sample_id: form.sample_id || null, surveillance_record_id: form.surveillance_record_id || null, pool_size: Number(form.pool_size), notes: form.notes || null, dengue_serotype: null, genome_accession: null });
      setShowForm(false); refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <MetricStrip items={[
        { label: "Pools registered", value: rows.length },
        { label: "Sequencing complete", value: rows.filter((row) => row.sequencing_status === "complete").length },
        { label: "Dengue positive", value: rows.filter((row) => row.dengue_result === "positive").length },
        { label: "QC passed", value: rows.filter((row) => row.qc_status === "passed").length },
      ]} />
      <div className="pilot-toolbar"><ExportToolbar csvFilename="dengue_genomic_registry" csvRows={rows} jsonData={rows} /><button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}><Plus size={14} /> Register pool</button></div>
      {showForm && <form className="pilot-form-band" onSubmit={submit}>
        <div className="pilot-form-heading"><Dna size={17} /><div><strong>Mosquito-pool registry</strong><span>Results remain pending until laboratory and QC review.</span></div></div>
        <div className="pilot-form-grid">
          <Field label="Sample ID"><input value={form.sample_id} onChange={(e) => setForm({ ...form, sample_id: e.target.value })} placeholder="Auto-generated when blank" /></Field>
          <Field label="Surveillance record"><input value={form.surveillance_record_id} onChange={(e) => setForm({ ...form, surveillance_record_id: e.target.value })} /></Field>
          <Field label="District" required><select required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}><option value="">Select district</option>{DISTRICTS.map((district) => <option key={district}>{district}</option>)}</select></Field>
          <Field label="Collection date" required><input required type="date" max={today()} value={form.collection_date} onChange={(e) => setForm({ ...form, collection_date: e.target.value })} /></Field>
          <Field label="Mosquito species"><input value={form.mosquito_species} onChange={(e) => setForm({ ...form, mosquito_species: e.target.value })} /></Field>
          <Field label="Pool size" required><input required type="number" min="1" max="100" value={form.pool_size} onChange={(e) => setForm({ ...form, pool_size: e.target.value })} /></Field>
          <Field label="Extraction"><select value={form.extraction_status} onChange={(e) => setForm({ ...form, extraction_status: e.target.value })}><option value="registered">Registered</option><option value="extracted">Extracted</option><option value="failed">Failed</option></select></Field>
          <Field label="Platform"><input value={form.sequencing_platform} onChange={(e) => setForm({ ...form, sequencing_platform: e.target.value })} /></Field>
          <Field label="Sequencing"><select value={form.sequencing_status} onChange={(e) => setForm({ ...form, sequencing_status: e.target.value })}><option value="not_started">Not started</option><option value="queued">Queued</option><option value="sequencing">Sequencing</option><option value="analysis">Analysis</option><option value="complete">Complete</option><option value="failed">Failed</option></select></Field>
          <Field label="Dengue result"><select value={form.dengue_result} onChange={(e) => setForm({ ...form, dengue_result: e.target.value })}><option value="not_tested">Not tested</option><option value="pending">Pending</option><option value="negative">Negative</option><option value="positive">Positive</option><option value="inconclusive">Inconclusive</option></select></Field>
          <Field label="QC"><select value={form.qc_status} onChange={(e) => setForm({ ...form, qc_status: e.target.value })}><option value="pending">Pending</option><option value="review">Review</option><option value="passed">Passed</option><option value="failed">Failed</option></select></Field>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="pilot-form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}><Send size={13} /> {saving ? "Saving..." : "Register pool"}</button></div>
      </form>}
      <SectionCard title="Dengue virome workflow" icon={Dna}>
        {!rows.length ? <EmptyState icon={Dna} title="No mosquito pools registered" description="The MinION-compatible registry is ready; it does not create inferred or simulated genomic results." /> : <div className="table-wrap"><table><thead><tr><th>Sample</th><th>Date</th><th>District</th><th>Species</th><th>Pool</th><th>Extraction</th><th>Sequencing</th><th>Dengue</th><th>QC</th></tr></thead><tbody>{rows.map((row) => <tr key={row.sample_id}><td><strong>{row.sample_id}</strong></td><td>{row.collection_date}</td><td>{row.district}</td><td>{row.mosquito_species ?? "Pending"}</td><td>{row.pool_size}</td><td>{label(row.extraction_status)}</td><td><Badge variant={statusBadge(row.sequencing_status)}>{label(row.sequencing_status)}</Badge></td><td><Badge variant={row.dengue_result === "positive" ? "red" : row.dengue_result === "negative" ? "green" : "gray"}>{label(row.dengue_result)}</Badge></td><td>{label(row.qc_status)}</td></tr>)}</tbody></table></div>}
      </SectionCard>
    </>
  );
}

function MelView({ summary }) {
  const indicators = summary?.indicators ?? [];
  return (
    <>
      <div className="pilot-kpi-grid">
        {indicators.slice(0, 4).map((item, index) => <div className={`pilot-kpi ${index % 2 ? "accent-blue" : "accent-teal"}`} key={item.code}><span>{item.label}</span><strong>{item.value}</strong><small>{label(item.status)}</small></div>)}
      </div>
      <SectionCard title="Monitoring, evaluation and learning framework" icon={BarChart3}>
        <div className="pilot-mel-list">
          {indicators.map((item) => (
            <div className="pilot-mel-row" key={item.code}>
              <div><strong>{item.label}</strong><span>{item.target}</span></div>
              <div className="pilot-mel-value">{item.value}</div>
              <Badge variant={statusBadge(item.status)}>{label(item.status)}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="grid-2 pilot-section-gap">
        {(summary?.evaluation_schedule ?? []).map((stage, index) => <div className="pilot-stage" key={stage}><span>{index + 1}</span><div><strong>{label(stage)}</strong><small>{index === 0 ? "Pilot baseline and target confirmation" : index === 1 ? "Automated operational monitoring" : "Mixed-methods evaluation"}</small></div></div>)}
      </div>
    </>
  );
}

export default function DengueOperations() {
  const [activeTab, setActiveTab] = useState("readiness");
  const submission = useFetch(api.dengueSubmissionReadiness);
  const model = useFetch(api.dengueModelReadiness);
  const community = useFetch(api.dengueCommunityReports);
  const surveillance = useFetch(api.dengueAedesSurveillance);
  const aedesSummary = useFetch(api.dengueAedesSummary);
  const genomics = useFetch(api.dengueGenomicSamples);
  const mel = useFetch(api.dengueMelSummary);

  const allExports = useMemo(() => ({
    submission: submission.data,
    model_readiness: model.data,
    community_reports: community.data?.items ?? [],
    aedes_surveillance: surveillance.data?.items ?? [],
    genomic_samples: genomics.data?.items ?? [],
    mel: mel.data,
  }), [submission.data, model.data, community.data, surveillance.data, genomics.data, mel.data]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <div className="eyebrow">Nexa Proof of Concept · 24-month pilot architecture</div>
          <h2>Dengue pilot operations</h2>
          <div className="page-subtitle">One controlled workspace for Aedes surveillance, community evidence, mosquito-pool genomics and MEL.</div>
          <div className="page-header-badges"><Badge variant="green">Workflow operational</Badge><Badge variant="amber">Prospective evidence pending</Badge><Badge variant="blue">No synthetic records</Badge></div>
        </div>
        <ExportToolbar csvFilename="dengue_poc_submission_readiness" csvRows={submission.data?.pillars ?? []} jsonData={allExports} />
      </div>

      <div className="pilot-tabs" role="tablist" aria-label="Dengue pilot modules">
        {TABS.map(({ id, label: tabLabel, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)} role="tab" aria-selected={activeTab === id}><Icon size={14} /><span>{tabLabel}</span></button>)}
      </div>

      <div className="pilot-tab-panel">
        {activeTab === "readiness" && <ReadinessView readiness={submission.data} modelReadiness={model.data} />}
        {activeTab === "aedes" && <AedesView payload={surveillance.data} summary={aedesSummary.data} refresh={() => { surveillance.refresh(); aedesSummary.refresh(); }} />}
        {activeTab === "community" && <CommunityView payload={community.data} refresh={community.refresh} />}
        {activeTab === "genomics" && <GenomicsView payload={genomics.data} refresh={genomics.refresh} />}
        {activeTab === "mel" && <MelView summary={mel.data} />}
      </div>
    </div>
  );
}
