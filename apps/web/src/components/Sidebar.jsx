import React from "react";
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
  FlaskConical,
  Home,
  Map,
  Radar,
  Shield,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Command",
    items: [
      { to: "/", label: "Overview", icon: Home, hint: "MVP status" },
      { to: "/arboviral", label: "Arboviral Prep", icon: Biohazard, hint: "Great Lakes" },
      { to: "/data-readiness", label: "Data Control", icon: Database, hint: "Quality centre" },
    ],
  },
  {
    label: "Evidence",
    items: [
      { to: "/mosquito", label: "Vector Evidence", icon: Activity, hint: "PI + GBIF" },
      { to: "/resistance", label: "Control Context", icon: FlaskConical, hint: "24h mortality" },
      { to: "/sites", label: "Sites + Map", icon: Map, hint: "30 mapped" },
    ],
  },
  {
    label: "Climate To Action",
    items: [
      { to: "/climate", label: "Climate Context", icon: Cloud, hint: "RWA + GL" },
      { to: "/live-weather", label: "Live Weather", icon: CloudSun, hint: "nowcast" },
      { to: "/modeling", label: "Priority Engine", icon: BrainCircuit, hint: "screening" },
      { to: "/alerts", label: "Response Board", icon: AlertTriangle, hint: "review flow" },
    ],
  },
];

const MVP_STEPS = [
  "Readiness",
  "Aedes",
  "RVF",
  "Climate",
  "Response",
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand-panel">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <Shield size={18} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <strong>ArboRisk-GL</strong>
            <span>Arboviral intelligence</span>
          </div>
        </div>
        <div className="sidebar-product-meta">
          <span>Great Lakes</span>
          <span>Preparedness</span>
        </div>
      </div>

      <div className="sidebar-mission">
        <div className="mission-title">
          <Radar size={14} />
          MVP Modules
        </div>
        <div className="mission-steps">
          {MVP_STEPS.map((step) => (
            <div className="mission-step" key={step}>
              <CheckCircle2 size={12} />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map(({ to, label, icon: Icon, hint }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={16} />
                <span className="nav-copy">
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-kpis">
          <div>
            <span>Records</span>
            <strong>13k+</strong>
          </div>
          <div>
            <span>Sites</span>
            <strong>30</strong>
          </div>
        </div>
        <div className="sidebar-badge">
          <BarChart3 size={13} />
          Field validation ready
        </div>
      </div>
    </aside>
  );
}
