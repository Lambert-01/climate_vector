import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Biohazard,
  BrainCircuit,
  Cloud,
  CloudSun,
  Database,
  FileCheck,
  FlaskConical,
  Home,
  BookOpen,
  Map,
  Shield,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { api } from "../api";

const NAV_GROUPS = [
  {
    label: "Command",
    items: [
      { to: "/", label: "Overview", icon: Home },
      { to: "/decision-room", label: "Decision Room", icon: ShieldCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/dengue-operations", label: "Pilot Workspace", icon: Smartphone },
      { to: "/alerts", label: "Response Board", icon: AlertTriangle },
      { to: "/field-verification", label: "Field Verification", icon: FileCheck },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/arboviral", label: "Dengue Intelligence", icon: Biohazard },
      { to: "/climate", label: "Climate Context", icon: Cloud },
      { to: "/live-weather", label: "Live Weather", icon: CloudSun },
      { to: "/modeling", label: "Priority Engine", icon: BrainCircuit },
    ],
  },
  {
    label: "Evidence & Data",
    items: [
      { to: "/sites", label: "Sites & Map", icon: Map },
      { to: "/mosquito", label: "Vector Evidence", icon: Activity },
      { to: "/resistance", label: "Legacy Control", icon: FlaskConical },
      { to: "/data-readiness", label: "Data Control", icon: Database },
    ],
  },
  {
    label: "Reference",
    items: [
      { to: "/system-guide", label: "Platform Guide", icon: BookOpen },
    ],
  },
];

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

export default function Sidebar({ mobileOpen = false, onNavigate }) {
  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand-panel">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <Shield size={17} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <strong>DengueEW-GL</strong>
            <span>Climate + Aedes PoC · v1.1</span>
          </div>
        </div>
        <div className="sidebar-product-meta"><span>Great Lakes pilot</span></div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={15} />
                <span className="nav-copy">
                  <strong>{label}</strong>
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <SystemStatusPanel />
      </div>
    </aside>
  );
}
