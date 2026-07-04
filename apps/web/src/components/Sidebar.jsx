import React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  BrainCircuit,
  Cloud,
  Database,
  FlaskConical,
  Home,
  Map,
  Shield,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/sites", label: "Sites", icon: Map },
  { to: "/mosquito", label: "Mosquito", icon: Activity },
  { to: "/resistance", label: "Resistance", icon: FlaskConical },
  { to: "/climate", label: "Climate", icon: Cloud },
  { to: "/modeling", label: "Risk Engine", icon: BrainCircuit },
  { to: "/alerts", label: "Response", icon: AlertTriangle },
  { to: "/data-readiness", label: "Data Control", icon: Database },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <Shield size={18} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <strong>RCVIS</strong>
            <span>Operations dashboard</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-badge">
          <BarChart2 size={13} />
          Current-data build
        </div>
      </div>
    </aside>
  );
}
