import React, { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Biohazard, BrainCircuit, Cloud, CloudSun, Database, FileCheck, FlaskConical, Home, KeyRound, LockKeyhole, Map as MapIcon, Radar, ShieldCheck, Smartphone } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import { hasOperatorKey, setOperatorKey } from "./api.js";

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
  const [accessOpen, setAccessOpen] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [operatorActive, setOperatorActive] = useState(hasOperatorKey());
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
        <div className="operator-access">
          <button
            className={`operator-access-trigger ${operatorActive ? "is-active" : ""}`}
            onClick={() => setAccessOpen((open) => !open)}
            title="Pilot operator access"
            aria-label="Pilot operator access"
          >
            {operatorActive ? <KeyRound size={14} /> : <LockKeyhole size={14} />}
            <span>{operatorActive ? "Operator" : "Read only"}</span>
          </button>
          {accessOpen && (
            <form
              className="operator-access-panel"
              onSubmit={(event) => {
                event.preventDefault();
                setOperatorKey(keyValue);
                setOperatorActive(Boolean(keyValue.trim()));
                setKeyValue("");
                setAccessOpen(false);
              }}
            >
              <strong>Pilot operator</strong>
              <span>Session-only write access</span>
              <input
                type="password"
                value={keyValue}
                onChange={(event) => setKeyValue(event.target.value)}
                placeholder="Operator key"
                autoComplete="off"
              />
              <div>
                {operatorActive && (
                  <button type="button" className="btn btn-outline" onClick={() => {
                    setOperatorKey("");
                    setOperatorActive(false);
                    setAccessOpen(false);
                  }}>Lock</button>
                )}
                <button className="btn btn-primary" disabled={!keyValue.trim()}>Unlock</button>
              </div>
            </form>
          )}
        </div>
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
