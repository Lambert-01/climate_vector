import React from "react";
import { CheckCircle2, ClipboardCheck, Database, FlaskConical, Globe2, MapPin, Microscope, Shield, XCircle } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  Badge, ChartState, MetricStrip, PhaseTimeline,
  ProgressBar, SectionCard, Spinner,
} from "../components/UI";

const GOVERNANCE_PHASES = [
  { label: "Not requested",  sub: "Default state",   status: "pending" },
  { label: "Requested",      sub: "Letter sent",      status: "pending" },
  { label: "Approved",       sub: "MoU signed",       status: "pending" },
  { label: "Received",       sub: "Data in hand",     status: "pending" },
  { label: "Validated",      sub: "QC complete",      status: "pending" },
  { label: "Integrated",     sub: "In dashboard",     status: "pending" },
];

const HAVE_NOW = [
  { icon: FlaskConical, label: "PI ecology records",        value: "3,547 rows",  note: "mosquito_behavior_raw.xls — breeding sites, habitats, agricultural exposure", status: "ready" },
  { icon: FlaskConical, label: "PI susceptibility records", value: "3,547 rows",  note: "IR_data.xls — insecticide, concentration, 24h deaths, vector-control context", status: "ready" },
  { icon: Globe2,       label: "NASA POWER climate",        value: "30 districts",note: "Daily rainfall, temperature, humidity 2021–2025 for all Rwanda districts",      status: "ready" },
  { icon: Globe2,       label: "GBIF vector occurrence",    value: "380+ records",note: "Aedes aegypti (329) + Culex (51) regional Great Lakes context",                 status: "ready" },
  { icon: Globe2,       label: "ERA5-Land monthly",         value: "Rwanda bbox", note: "Rainfall, temperature, dewpoint, runoff baseline for Rwanda",                   status: "ready" },
  { icon: MapPin,       label: "33 sentinel sites",         value: "Mapped",      note: "Lecturer WKT coordinates — operational for MVP mapping and field planning",     status: "ready" },
  { icon: Globe2,       label: "WorldClim + elevation",     value: "Local files", note: "ESA WorldCover, elevation, land cover — environmental suitability context",     status: "ready" },
  { icon: Globe2,       label: "Great Lakes climate points",value: "7 points",    note: "NASA POWER for Kigali, Goma, Kampala, Nairobi, Bujumbura, Dar, Mwanza",        status: "ready" },
];

const PILOT_COLLECT = [
  { label: "Full sample dates (month + year per row)",                                priority: "high",   owner: "PI / field team" },
  { label: "GPS coordinates for all sentinel sites",                                  priority: "high",   owner: "PI / field officer" },
  { label: "Mosquito counts and sampling effort",                                     priority: "high",   owner: "Entomology team" },
  { label: "Susceptibility test denominator (likely 25 — PI confirmation)",           priority: "high",   owner: "PI / lab team" },
  { label: "Test protocol (WHO susceptibility / CDC bottle / PBO assay)",             priority: "high",   owner: "PI / lab team" },
  { label: "Control mortality records",                                               priority: "high",   owner: "PI / lab team" },
  { label: "Aedes/Culex field surveillance (ovitraps, container index, adult traps)", priority: "high",   owner: "Entomology team" },
  { label: "Arboviral case or febrile illness data",                                  priority: "medium", owner: "RBC/MoH (formal access)" },
  { label: "Livestock density and RVF event data",                                    priority: "medium", owner: "Rwanda Agriculture Board" },
  { label: "Yellow fever vaccination coverage",                                       priority: "medium", owner: "RBC/MoH immunisation" },
];

const PRIORITY_BADGE = { high: "red", medium: "amber", low: "green" };

export default function DataReadiness() {
  const { data,             loading }       = useFetch(api.readiness);
  const { data: validation, loading: vL, error: vE } = useFetch(api.publicValidation);
  const { data: governance, loading: gL    } = useFetch(api.arboviralPartnerGovernance);
  const { data: sourceRegistry, loading: srL } = useFetch(api.sourceRegistry);
  const { data: valEngine, loading: veL } = useFetch(api.validationEngine);

  const items      = data?.items ?? [];
  const ready      = items.filter(i => String(i.ready).toLowerCase() === "true").length;
  const validRows  = validation?.items ?? [];
  const usableSrc  = validRows.filter(r => ["usable","validated","downloaded"].some(k => String(r.status ?? "").includes(k))).length;
  const readyPct   = items.length ? Math.round((ready / items.length) * 100) : 0;
  const govRows    = governance?.items ?? [];
  const registryItems = sourceRegistry?.items ?? [];
  const valChecks = valEngine?.checks ?? [];
  const valPassed = valEngine?.summary?.passed ?? 0;
  const valTotal = valEngine?.summary?.total ?? 0;

  return (
    <div className="page">

      {/* HERO */}
      <div className="page-hero">
        <div className="eyebrow">Data operations · readiness control</div>
        <h2>Source registry · validation · governance</h2>
        <p>
          This system is built on real, integrated data. Every source is tracked with provenance,
          limitations, and validation status. Items labelled "pilot" are the honest scientific
          roadmap that makes this proposal credible.
        </p>
        <div className="hero-badges">
          <Badge variant="green">{registryItems.length} sources tracked</Badge>
          <Badge variant="blue">{valPassed}/{valTotal} validation checks pass</Badge>
          <Badge variant="amber">{PILOT_COLLECT.length} pilot items</Badge>
        </div>
        <div className="page-hero-kpis">
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{registryItems.length}</div>
            <div className="page-hero-kpi-label">Sources tracked</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{vL ? "…" : usableSrc}</div>
            <div className="page-hero-kpi-label">Usable sources</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{valPassed}</div>
            <div className="page-hero-kpi-label">Validation checks pass</div>
          </div>
          <div className="page-hero-kpi">
            <div className="page-hero-kpi-value">{readyPct}%</div>
            <div className="page-hero-kpi-label">Current readiness</div>
          </div>
        </div>
      </div>

      {/* READINESS BARS */}
      <SectionCard title="Readiness overview" icon={ClipboardCheck}>
        <div style={{ padding: "18px 20px", display: "grid", gap: 14 }}>
          <ProgressBar label="Overall data readiness" value={readyPct} color="teal" />
          <ProgressBar label="Usable evidence sources" value={usableSrc} max={validRows.length || 18} color="green" />
          <ProgressBar label="Validation checks" value={valPassed} max={valTotal || 1} color="blue" />
        </div>
        <MetricStrip items={[
          { label: "Ready groups",   value: ready },
          { label: "Pilot fields",   value: items.length - ready },
          { label: "Usable sources", value: vL ? "…" : usableSrc },
          { label: "Total indexed",  value: vL ? "…" : validRows.length },
        ]} />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* VALIDATION ENGINE */}
      <SectionCard title="Data validation engine — file and record checks" icon={Shield}>
        <ChartState loading={veL} rows={valChecks} empty="Validation engine not loaded.">
          <div style={{ padding: "16px 20px", display: "grid", gap: 6 }}>
            {valChecks.map((check) => (
              <div key={check.check_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: check.status === "pass" ? "var(--green-50)" : check.status === "missing" ? "#fef2f2" : "#fffbeb", borderRadius: 6, border: `1px solid ${check.status === "pass" ? "var(--green-200)" : check.status === "missing" ? "#fecaca" : "#fde68a"}` }}>
                <div className={`readiness-dot ${check.status === "pass" ? "ready" : check.status === "missing" ? "missing" : "partial"}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{check.description}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{check.file}</div>
                </div>
                <Badge variant={check.status === "pass" ? "green" : check.status === "missing" ? "red" : "amber"}>
                  {check.status === "pass" ? `${check.record_count} records` : check.status}
                </Badge>
              </div>
            ))}
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* SOURCE REGISTRY */}
      <SectionCard title="Data source registry — provenance and limitations" icon={Database}>
        <ChartState loading={srL} rows={registryItems} empty="Source registry not loaded.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Domain</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Supports</th>
                  <th>Cannot Prove</th>
                  <th>Validation Required</th>
                </tr>
              </thead>
              <tbody>
                {registryItems.map((src) => (
                  <tr key={src.source_id}>
                    <td><strong>{src.name}</strong></td>
                    <td style={{ fontSize: 11 }}>{src.domain}</td>
                    <td><Badge variant={src.source_type === "public" || src.source_type === "public_api" ? "blue" : src.source_type === "pi_provided" ? "teal" : "gray"}>{src.source_type?.replace(/_/g, " ")}</Badge></td>
                    <td><Badge variant={src.status?.includes("validated") || src.status?.includes("usable") ? "green" : src.status?.includes("pilot") ? "amber" : "gray"}>{src.status?.replace(/_/g, " ")}</Badge></td>
                    <td style={{ fontSize: 11, maxWidth: 200 }}>{src.supports}</td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 200 }}>{src.cannot_prove}</td>
                    <td style={{ fontSize: 11, color: "var(--text-secondary)", maxWidth: 200 }}>{src.required_for_validation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartState>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* WHAT WE HAVE NOW */}
      <div className="section-label"><CheckCircle2 size={13} /> Evidence integrated and operational now</div>
      <div className="source-chip-grid" style={{ padding: 0, marginBottom: 22 }}>
        {HAVE_NOW.map(item => {
          const Icon = item.icon;
          return (
            <div className="source-chip" key={item.label} style={{ borderLeft: "3px solid var(--green-500)" }}>
              <div className="source-chip-status">
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon size={14} color="var(--green-600)" />
                  <span className="source-chip-name">{item.label}</span>
                </div>
                <Badge variant="green">{item.value}</Badge>
              </div>
              <span className="source-chip-meta">{item.note}</span>
            </div>
          );
        })}
      </div>

      {/* PILOT ROADMAP */}
      <div className="section-label"><Microscope size={13} /> Pilot collection roadmap — what the grant funds</div>
      <div style={{ display: "grid", gap: 8, marginBottom: 22 }}>
        {PILOT_COLLECT.map((item, i) => (
          <div key={i} className={`readiness-item ${item.priority === "high" ? "pilot-item" : "readiness-item"}`}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: item.priority === "high" ? "linear-gradient(90deg,#fffbeb,#fff)" : "var(--surface-2)", borderLeft: `3px solid ${item.priority === "high" ? "var(--amber-500)" : "var(--border)"}`, borderRadius: "var(--radius)", border: "1px solid var(--border-light)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Owner: {item.owner}</div>
            </div>
            <Badge variant={PRIORITY_BADGE[item.priority]}>{item.priority}</Badge>
          </div>
        ))}
      </div>

      {/* GOVERNANCE PIPELINE */}
      <SectionCard title="Partner data governance pipeline — RBC/MoH and partners" icon={Database}>
        <PhaseTimeline phases={GOVERNANCE_PHASES} />
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* PARTNER GOVERNANCE TABLE */}
      <SectionCard title="Partner governance status by dataset" icon={Database}>
        <div style={{ padding: "16px 20px", display: "grid", gap: 8 }}>
          {gL ? <Spinner /> : govRows.map(row => (
            <div key={row.dataset} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{row.dataset}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{row.partner} · {row.data_type}</div>
                <div style={{ fontSize: 12, color: "var(--teal-700)", marginTop: 4, fontWeight: 600 }}>→ {row.next_step}</div>
              </div>
              <Badge variant={row.governance_status === "partial" ? "amber" : row.governance_status === "pilot_required" ? "orange" : "gray"}>
                {String(row.governance_status).replace(/_/g, " ")}
              </Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 22 }} />

      {/* VALIDATED SOURCES */}
      <SectionCard title="Validated public evidence registry" icon={CheckCircle2}>
        <ChartState loading={vL} error={vE} rows={validRows} empty="Validation registry not loaded.">
          <div style={{ padding: "16px 20px", display: "grid", gap: 8 }}>
            {validRows.map(row => {
              const isReady = ["usable","validated","downloaded"].some(k => String(row.status ?? "").includes(k));
              return (
                <div key={row.source_id} className={`readiness-item ${isReady ? "ready-item" : "pilot-item"}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
                  <div className={`readiness-dot ${isReady ? "ready" : "partial"}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{row.source_name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>{row.records_or_files} records/files · {row.frontend_use}</div>
                  </div>
                  <Badge variant={isReady ? "green" : "amber"}>{String(row.status).replace(/_/g, " ")}</Badge>
                </div>
              );
            })}
          </div>
        </ChartState>
      </SectionCard>

    </div>
  );
}
