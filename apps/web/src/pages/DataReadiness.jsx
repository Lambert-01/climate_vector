import React, { useState } from "react";
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Database, Eye,
  Filter, FlaskConical, Globe2, MapPin, Microscope, Search,
  Shield, XCircle,
} from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  Badge, ChartState, DataTable, MetricStrip, PhaseTimeline,
  ProgressBar, SectionCard, SkeletonStatCard,
} from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "pi", label: "PI Data" },
  { id: "climate", label: "Climate" },
  { id: "vector", label: "Vector" },
  { id: "spatial", label: "Spatial" },
  { id: "pilot", label: "Pilot Required" },
];

const GOVERNANCE_PHASES = [
  { label: "Not requested", sub: "Default", status: "pending" },
  { label: "Requested", sub: "Letter sent", status: "pending" },
  { label: "Approved", sub: "MoU signed", status: "pending" },
  { label: "Received", sub: "Data in hand", status: "pending" },
  { label: "Validated", sub: "QC complete", status: "pending" },
  { label: "Integrated", sub: "In dashboard", status: "pending" },
];

const PILOT_ITEMS = [
  { label: "Prospective Aedes counts and sampling effort", priority: "high", owner: "Entomology team" },
  { label: "Approved dengue outcome series", priority: "high", owner: "RBC / MoH governance" },
  { label: "Mosquito-pool virome and dengue results", priority: "high", owner: "Virology + genomics team" },
  { label: "Consented community breeding-site reports", priority: "high", owner: "Community engagement team" },
  { label: "Official validation of candidate sentinel sites", priority: "high", owner: "PI / district teams" },
  { label: "Population and aggregate mobility exposure", priority: "medium", owner: "NISR + approved partner" },
  { label: "Temporal and spatial model evaluation", priority: "medium", owner: "Modelling team" },
];

const DOMAIN_ICONS = { pi: FlaskConical, climate: Globe2, vector: Globe2, spatial: MapPin, public: Globe2 };

function SourceDetailDrawer({ source, onClose }) {
  if (!source) return null;
  return (
    <div className="source-drawer-overlay" onClick={onClose}>
      <div className="source-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="source-drawer-header">
          <h3>{source.name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <XCircle size={18} />
          </button>
        </div>
        <div className="source-drawer-body">
          <div className="source-detail-row">
            <span className="source-detail-label">Domain</span>
            <span>{source.domain}</span>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Status</span>
            <Badge variant={source.status?.includes("validated") ? "green" : source.status?.includes("pilot") ? "amber" : "gray"}>
              {source.status?.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Raw file</span>
            <span style={{ fontSize: 12, fontFamily: "monospace" }}>{source.raw_file ?? "—"}</span>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Processed table</span>
            <span style={{ fontSize: 12, fontFamily: "monospace" }}>{source.processed_table ?? "—"}</span>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Supports</span>
            <span style={{ fontSize: 12 }}>{source.supports}</span>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Cannot prove</span>
            <span style={{ fontSize: 12, color: "var(--red-600)" }}>{source.cannot_prove}</span>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Quality limitations</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{source.quality_limitations}</span>
          </div>
          <div className="source-detail-row">
            <span className="source-detail-label">Required for validation</span>
            <span style={{ fontSize: 12 }}>{source.required_for_validation}</span>
          </div>
          {source.provenance_chain && (
            <div className="source-detail-row" style={{ flexDirection: "column", gap: 4 }}>
              <span className="source-detail-label">Provenance chain</span>
              <pre style={{ fontSize: 11, background: "var(--surface-2)", padding: 8, borderRadius: 4, margin: 0, overflow: "auto" }}>
                {source.provenance_chain}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DataReadiness() {
  const { data, loading } = useFetch(api.readiness);
  const { data: validation, loading: vL, error: vE } = useFetch(api.publicValidation);
  const { data: governance, loading: gL } = useFetch(api.arboviralPartnerGovernance);
  const { data: sourceRegistry, loading: srL } = useFetch(api.sourceRegistry);
  const { data: valEngine, loading: veL } = useFetch(api.validationEngine);
  const { data: operations } = useFetch(api.operationalStatus);
  const { data: persistedRegistry } = useFetch(api.operationalDatasets);

  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerSource, setDrawerSource] = useState(null);
  const [workspaceView, setWorkspaceView] = useState("quality");

  const items = data?.items ?? [];
  const ready = items.filter((i) => String(i.ready).toLowerCase() === "true").length;
  const validRows = validation?.items ?? [];
  const usableSrc = validRows.filter((r) => ["usable", "validated", "downloaded"].some((k) => String(r.status ?? "").includes(k))).length;
  const readyPct = items.length ? Math.round((ready / items.length) * 100) : 0;
  const govRows = governance?.items ?? [];
  const registryItems = sourceRegistry?.items ?? [];
  const valChecks = valEngine?.checks ?? [];
  const valPassed = valEngine?.summary?.passed ?? 0;
  const valTotal = valEngine?.summary?.total ?? 0;
  const valWarnings = valChecks.filter((c) => c.status === "warn").length;
  const valFailed = valChecks.filter((c) => c.status === "fail" || c.status === "error").length;
  const valMissing = valChecks.filter((c) => c.status === "missing").length;
  const valIssueCount = valWarnings + valFailed + valMissing;

  const filteredRegistry = registryItems.filter((src) => {
    const matchesSearch = !searchQuery || src.name?.toLowerCase().includes(searchQuery.toLowerCase()) || src.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || src.status?.includes(statusFilter);
    return matchesSearch && matchesStatus;
  });

  const tabFilteredRegistry = filteredRegistry.filter((src) => {
    if (activeTab === "overview") return true;
    if (activeTab === "pilot") return src.status?.includes("pilot");
    const domain = src.domain?.toLowerCase() ?? "";
    if (activeTab === "pi") return domain.includes("pi") || domain.includes("entomology");
    if (activeTab === "climate") return domain.includes("climate") || domain.includes("nasa") || domain.includes("era5");
    if (activeTab === "vector") return domain.includes("vector") || domain.includes("gbif");
    if (activeTab === "spatial") return domain.includes("spatial") || domain.includes("sentinel") || domain.includes("boundary");
    return true;
  });

  const csvRows = tabFilteredRegistry.map((s) => ({
    source: s.name, domain: s.domain, status: s.status, supports: s.supports, cannot_prove: s.cannot_prove,
  }));

  return (
    <div className="page">
      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Data Control</h2>
          <div className="page-subtitle">Evidence source registry, validation engine, and governance tracking</div>
          <div className="page-header-badges">
            <Badge variant="green">{persistedRegistry?.items?.length ?? registryItems.length} persisted sources</Badge>
            <Badge variant="blue">{valPassed}/{valTotal} checks pass</Badge>
            <Badge variant="amber">{PILOT_ITEMS.length} pilot items</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename="dengueew_gl_data_control"
            csvRows={csvRows}
            jsonData={{ sources: tabFilteredRegistry, validation: valChecks }}
          />
        </div>
      </div>

      <div className="command-metrics">
        <div className="command-metric tone-neutral"><span>Tracked sources</span><strong>{persistedRegistry?.items?.length ?? registryItems.length}</strong><small>database registry</small></div>
        <div className="command-metric tone-good"><span>Usable now</span><strong>{usableSrc}</strong><small>validated or downloaded</small></div>
        <div className={`command-metric ${valIssueCount ? "tone-warning" : "tone-good"}`}><span>Quality issues</span><strong>{valIssueCount}</strong><small>{valWarnings} warning · {valFailed + valMissing} blocked</small></div>
        <div className={`command-metric ${operations?.database === "connected" ? "tone-good" : "tone-warning"}`}><span>Platform state</span><strong>{operations?.database === "connected" ? "Live" : "Check"}</strong><small>{operations?.audit_event_count ?? 0} audited changes</small></div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Data Control views">
        {[["quality", "Quality queue"], ["sources", "Source registry"], ["governance", "Governance & pilot gaps"]].map(([id, label]) => (
          <button key={id} className={workspaceView === id ? "active" : ""} onClick={() => setWorkspaceView(id)}>{label}</button>
        ))}
      </div>

      {/* ── READINESS BAR ── */}
      {workspaceView === "quality" && <>
      <SectionCard title="Readiness" icon={ClipboardCheck}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 10 }}>
          <ProgressBar label="Data readiness" value={readyPct} color="teal" />
          <ProgressBar label="Evidence sources" value={usableSrc} max={validRows.length || 18} color="green" />
          <ProgressBar label="Validation" value={valPassed} max={valTotal || 1} color="blue" />
        </div>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />

      {/* ── VALIDATION ISSUE QUEUE ── */}
      <SectionCard
        title="Validation issue queue"
        icon={AlertTriangle}
        action={<Badge variant={valIssueCount > 0 ? "amber" : "green"}>{valIssueCount} issues</Badge>}
      >
        <ChartState loading={veL} rows={valChecks} empty="No validation checks loaded.">
          <div style={{ padding: "12px 16px", display: "grid", gap: 6 }}>
            {valChecks.filter((c) => c.status !== "pass").map((check) => (
              <div key={check.check_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: check.status === "missing" ? "#fef2f2" : "#fffbeb", borderRadius: "var(--radius-sm)", border: `1px solid ${check.status === "missing" ? "#fecaca" : "#fde68a"}` }}>
                <div className={`readiness-dot ${check.status === "missing" ? "missing" : "partial"}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{check.description}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{check.file}</div>
                </div>
                <Badge variant={check.status === "missing" ? "red" : "amber"}>{check.status}</Badge>
              </div>
            ))}
            {valChecks.every((c) => c.status === "pass") && (
              <div style={{ padding: 12, textAlign: "center", color: "var(--green-600)", fontSize: 13, fontWeight: 600 }}>
                All validation checks passing
              </div>
            )}
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />
      </>}

      {/* ── SOURCE REGISTRY ── */}
      {workspaceView === "sources" && <>
      <SectionCard
        title="Source registry"
        icon={Database}
        action={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search sources…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "5px 8px 5px 26px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", width: 150, outline: "none" }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "5px 8px", fontSize: 11, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", outline: "none" }}
            >
              <option value="all">All status</option>
              <option value="validated">Validated</option>
              <option value="usable">Usable</option>
              <option value="pilot">Pilot</option>
            </select>
          </div>
        }
      >
        {/* Tabs */}
        <div className="data-control-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`data-control-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ChartState loading={srL} rows={tabFilteredRegistry} empty="No sources match your filter.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Supports</th>
                  <th>Cannot prove</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tabFilteredRegistry.map((src) => (
                  <tr key={src.source_id} onClick={() => setDrawerSource(src)} style={{ cursor: "pointer" }}>
                    <td><strong>{src.name}</strong></td>
                    <td style={{ fontSize: 11 }}>{src.domain}</td>
                    <td>
                      <Badge variant={src.status?.includes("validated") || src.status?.includes("usable") ? "green" : src.status?.includes("pilot") ? "amber" : "gray"}>
                        {src.status?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td style={{ fontSize: 11, maxWidth: 200 }}>{src.supports}</td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 200 }}>{src.cannot_prove}</td>
                    <td><Eye size={13} style={{ color: "var(--text-muted)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />
      </>}

      {/* ── GOVERNANCE ── */}
      {workspaceView === "governance" && <>
      <SectionCard title="Partner governance pipeline" icon={Database}>
        <PhaseTimeline phases={GOVERNANCE_PHASES} />
        <div style={{ padding: "12px 16px", display: "grid", gap: 6 }}>
          {gL ? (
            <div style={{ padding: 12, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Loading governance data…</div>
          ) : govRows.map((row) => (
            <div key={row.dataset} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{row.dataset}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.partner} · {row.next_step}</div>
              </div>
              <Badge variant={row.governance_status === "partial" ? "amber" : "gray"}>
                {String(row.governance_status).replace(/_/g, " ")}
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 20 }} />

      {/* ── PILOT ROADMAP ── */}
      <SectionCard title="Pilot collection roadmap" icon={Microscope} action={<Badge variant="amber">{PILOT_ITEMS.length} items</Badge>}>
        <div style={{ padding: "12px 16px", display: "grid", gap: 6 }}>
          {PILOT_ITEMS.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: item.priority === "high" ? "#fffbeb" : "var(--surface-2)", borderLeft: `3px solid ${item.priority === "high" ? "var(--amber-500)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.owner}</div>
              </div>
              <Badge variant={item.priority === "high" ? "red" : "amber"}>{item.priority}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
      </>}

      {/* ── SOURCE DETAIL DRAWER ── */}
      <SourceDetailDrawer source={drawerSource} onClose={() => setDrawerSource(null)} />
    </div>
  );
}
