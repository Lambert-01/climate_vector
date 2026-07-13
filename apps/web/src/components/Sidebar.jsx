import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Biohazard,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  CloudSun,
  Database,
  FileCheck,
  FlaskConical,
  Home,
  Map,
  Radar,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api";

const NAV_GROUPS = [
  {
    label: "Command",
    items: [
      { to: "/",             label: "Overview",       icon: Home,         hint: "MVP status",     pulse: true },
      { to: "/decision-room", label: "Decision Room", icon: ShieldCheck,  hint: "Action brief" },
      { to: "/arboviral",    label: "Arboviral Prep", icon: Biohazard,    hint: "Great Lakes" },
      { to: "/data-readiness", label: "Data Control", icon: Database,     hint: "Quality centre" },
    ],
  },
  {
    label: "Evidence",
    items: [
      { to: "/mosquito",    label: "Vector Evidence", icon: Activity,     hint: "PI + GBIF" },
      { to: "/resistance",  label: "Control Context", icon: FlaskConical, hint: "24h mortality" },
      { to: "/sites",       label: "Sites + Map",     icon: Map,          hint: "33 sentinel" },
    ],
  },
  {
    label: "Climate to Action",
    items: [
      { to: "/climate",      label: "Climate Context", icon: Cloud,         hint: "RWA + GL" },
      { to: "/live-weather", label: "Live Weather",    icon: CloudSun,      hint: "nowcast" },
      { to: "/modeling",     label: "Priority Engine", icon: BrainCircuit,  hint: "screening" },
      { to: "/alerts",       label: "Response Board",  icon: AlertTriangle, hint: "review flow" },
      { to: "/field-verification", label: "Field Verification", icon: FileCheck, hint: "pilot ready" },
    ],
  },
];

const MVP_STEPS = ["Readiness", "Aedes", "RVF", "Climate", "Response"];

function SystemStatusPanel() {
  const [status, setStatus] = useState({ api: "checking", db: "checking" });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const r = await api.health();
        if (!cancelled) {
          const dbOk = r?.database === "connected" || r?.database === "ok";
          setStatus({ api: "ok", db: dbOk ? "ok" : "err" });
        }
      } catch {
        if (!cancelled) setStatus({ api: "err", db: "err" });
      }
    }
    check();
    const id = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="system-status-panel">
      <div className="system-status-title">System Status</div>
      <div className="system-status-row">
        <span className={`system-status-dot ${status.api}`} />
        <span>API {status.api === "ok" ? "online" : status.api === "checking" ? "checking…" : "offline"}</span>
      </div>
      <div className="system-status-row">
        <span className={`system-status-dot ${status.db}`} />
        <span>Database {status.db === "ok" ? "connected" : status.db === "checking" ? "checking…" : "unreachable"}</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand-panel">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <Shield size={17} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <strong>ArboRisk-GL</strong>
            <span>Arboviral intelligence · v1.0</span>
          </div>
        </div>
        <div className="sidebar-product-meta">
          <span>Great Lakes</span>
          <span>Preparedness</span>
          <span>MVP</span>
        </div>
      </div>

      <div className="sidebar-mission">
        <div className="mission-title">
          <Radar size={13} />
          MVP Modules
        </div>
        <div className="mission-steps">
          {MVP_STEPS.map((step) => (
            <div className="mission-step" key={step}>
              <CheckCircle2 size={11} />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map(({ to, label, icon: Icon, hint, pulse }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={15} />
                <span className="nav-copy">
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </span>
                {pulse && <span className="nav-pulse" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <SystemStatusPanel />
        <div className="sidebar-kpis">
          <div>
            <span>Records</span>
            <strong>13k+</strong>
          </div>
          <div>
            <span>Sentinel sites</span>
            <strong>33</strong>
          </div>
          <div>
            <span>GL points</span>
            <strong>7</strong>
          </div>
          <div>
            <span>Evidence layers</span>
            <strong>18</strong>
          </div>
        </div>
        <div className="sidebar-badge">
          <BarChart3 size={12} />
          Field validation ready
        </div>
      </div>
    </aside>
  );
}
