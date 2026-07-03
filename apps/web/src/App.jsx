import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Cloud, Database, FlaskConical, Home, Map } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Overview from "./pages/Overview.jsx";
import Sites from "./pages/Sites.jsx";
import Mosquito from "./pages/Mosquito.jsx";
import Resistance from "./pages/Resistance.jsx";
import Climate from "./pages/Climate.jsx";
import Alerts from "./pages/Alerts.jsx";
import DataReadiness from "./pages/DataReadiness.jsx";

const PAGE_META = {
  "/": { title: "Overview", sub: "System summary and key indicators", icon: Home },
  "/sites": { title: "Sites & Map", sub: "Sentinel site registry", icon: Map },
  "/mosquito": { title: "Mosquito Data", sub: "Ecology records from field surveys", icon: Activity },
  "/resistance": { title: "Resistance Tests", sub: "Insecticide resistance data", icon: FlaskConical },
  "/climate": { title: "Climate", sub: "NASA POWER district climate signals", icon: Cloud },
  "/alerts": { title: "Alerts & Response", sub: "Risk signal workflow", icon: AlertTriangle },
  "/data-readiness": { title: "Data Readiness", sub: "Validation and gap tracking", icon: Database },
};

function Topbar() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] ?? PAGE_META["/"];
  const Icon = meta.icon;
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={18} style={{ color: "var(--teal-500)" }} />
          {meta.title}
        </h1>
        <p>{meta.sub}</p>
      </div>
      <div className="topbar-right">
        <span className="badge badge-teal" style={{ fontSize: 11 }}>Rwanda PoC</span>
        <span className="badge badge-amber" style={{ fontSize: 11 }}>Descriptive Only</span>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/mosquito" element={<Mosquito />} />
          <Route path="/resistance" element={<Resistance />} />
          <Route path="/climate" element={<Climate />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/data-readiness" element={<DataReadiness />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
