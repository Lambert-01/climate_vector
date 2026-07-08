import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Biohazard, BrainCircuit, Cloud, CloudSun, Database, FlaskConical, Home, Map as MapIcon, Radar } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Overview from "./pages/Overview.jsx";
import Sites from "./pages/Sites.jsx";
import Mosquito from "./pages/Mosquito.jsx";
import Resistance from "./pages/Resistance.jsx";
import Climate from "./pages/Climate.jsx";
import LiveWeather from "./pages/LiveWeather.jsx";
import Alerts from "./pages/Alerts.jsx";
import DataReadiness from "./pages/DataReadiness.jsx";
import Modeling from "./pages/Modeling.jsx";
import Arboviral from "./pages/Arboviral.jsx";

const PAGE_META = {
  "/":              { title: "Command Overview",        sub: "Great Lakes climate-vector preparedness intelligence", icon: Home },
  "/arboviral":     { title: "Arboviral Preparedness",  sub: "Aedes · Culex · RVF · Great Lakes regional context",  icon: Biohazard },
  "/sites":         { title: "Spatial Operations",      sub: "33 sentinel sites · coordinate status · map view",     icon: MapIcon },
  "/mosquito":      { title: "Vector Evidence",         sub: "Ecology · species context · habitats",                 icon: Activity },
  "/resistance":    { title: "Vector Control Context",  sub: "Susceptibility assay signal review",                   icon: FlaskConical },
  "/climate":       { title: "Climate Context",         sub: "Rainfall · temperature · humidity · regional signals", icon: Cloud },
  "/live-weather":  { title: "Live Weather",            sub: "Open-Meteo nowcast and field window",                  icon: CloudSun },
  "/modeling":      { title: "Preparedness Priority",   sub: "Policy-facing prioritization and confidence",          icon: BrainCircuit },
  "/alerts":        { title: "Response Board",          sub: "Signal review and action workflow",                    icon: AlertTriangle },
  "/data-readiness":{ title: "Data Control",            sub: "Readiness · validation queue · governance",            icon: Database },
};

function Topbar() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] ?? PAGE_META["/"];
  const Icon = meta.icon;
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>
          <Icon size={17} />
          {meta.title}
        </h1>
        <div className="topbar-divider" />
        <p>{meta.sub}</p>
      </div>
      <div className="topbar-right">
        <div className="topbar-status">
          <span className="topbar-status-dot" />
          System live
        </div>
        <div className="topbar-mission">
          <Radar size={12} />
          <span>Readiness</span>
          <span>Aedes</span>
          <span>RVF</span>
          <span>Climate</span>
        </div>
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
          <Route path="/"              element={<Overview />} />
          <Route path="/arboviral"     element={<Arboviral />} />
          <Route path="/sites"         element={<Sites />} />
          <Route path="/mosquito"      element={<Mosquito />} />
          <Route path="/resistance"    element={<Resistance />} />
          <Route path="/climate"       element={<Climate />} />
          <Route path="/live-weather"  element={<LiveWeather />} />
          <Route path="/modeling"      element={<Modeling />} />
          <Route path="/alerts"        element={<Alerts />} />
          <Route path="/data-readiness" element={<DataReadiness />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
