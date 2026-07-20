import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Biohazard, BrainCircuit, Cloud, CloudSun, Database, FileCheck, FlaskConical, Home, Map as MapIcon, Radar, ShieldCheck, Smartphone } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";

const Overview = lazy(() => import("./pages/Overview.jsx"));
const Sites = lazy(() => import("./pages/Sites.jsx"));
const Mosquito = lazy(() => import("./pages/Mosquito.jsx"));
const Resistance = lazy(() => import("./pages/Resistance.jsx"));
const Climate = lazy(() => import("./pages/Climate.jsx"));
const LiveWeather = lazy(() => import("./pages/LiveWeather.jsx"));
const Alerts = lazy(() => import("./pages/Alerts.jsx"));
const DataReadiness = lazy(() => import("./pages/DataReadiness.jsx"));
const Modeling = lazy(() => import("./pages/Modeling.jsx"));
const Arboviral = lazy(() => import("./pages/Arboviral.jsx"));
const DecisionRoom = lazy(() => import("./pages/DecisionRoom.jsx"));
const FieldVerification = lazy(() => import("./pages/FieldVerification.jsx"));
const DengueOperations = lazy(() => import("./pages/DengueOperations.jsx"));

const PAGE_META = {
  "/":              { title: "Dengue Command Overview", sub: "Climate-informed Aedes preparedness · Proof of Concept", icon: Home },
  "/decision-room": { title: "Decision Room",           sub: "Dengue preparedness signals and review actions",         icon: ShieldCheck },
  "/arboviral":     { title: "Dengue Intelligence",     sub: "Aedes · climate · Great Lakes regional context",          icon: Biohazard },
  "/dengue-operations": { title: "Pilot Operations",    sub: "Aedes surveillance · community · genomics · MEL",         icon: Smartphone },
  "/sites":         { title: "Spatial Operations",      sub: "33 sentinel sites · coordinate status · map view",     icon: MapIcon },
  "/mosquito":      { title: "Vector Evidence",         sub: "Ecology · species context · habitats",                 icon: Activity },
  "/resistance":    { title: "Vector Control Context",  sub: "Susceptibility assay signal review",                   icon: FlaskConical },
  "/climate":       { title: "Climate Context",         sub: "Rainfall · temperature · humidity · regional signals", icon: Cloud },
  "/live-weather":  { title: "Live Weather",            sub: "Open-Meteo nowcast and field window",                  icon: CloudSun },
  "/modeling":      { title: "Preparedness Priority",   sub: "Policy-facing prioritization and confidence",          icon: BrainCircuit },
  "/alerts":        { title: "Response Board",          sub: "Signal review and action workflow",                    icon: AlertTriangle },
  "/field-verification": { title: "Field Verification", sub: "Verification requests and pilot checklists",          icon: FileCheck },
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
          <span>Dengue</span>
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
        <Suspense fallback={<div className="page-loading" role="status">Loading workspace...</div>}>
          <Routes>
            <Route path="/"              element={<Overview />} />
            <Route path="/decision-room" element={<DecisionRoom />} />
            <Route path="/arboviral"     element={<Arboviral />} />
            <Route path="/dengue-operations" element={<DengueOperations />} />
            <Route path="/sites"         element={<Sites />} />
            <Route path="/mosquito"      element={<Mosquito />} />
            <Route path="/resistance"    element={<Resistance />} />
            <Route path="/climate"       element={<Climate />} />
            <Route path="/live-weather"  element={<LiveWeather />} />
            <Route path="/modeling"      element={<Modeling />} />
            <Route path="/alerts"        element={<Alerts />} />
            <Route path="/field-verification" element={<FieldVerification />} />
            <Route path="/data-readiness" element={<DataReadiness />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
