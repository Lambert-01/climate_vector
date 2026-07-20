import React, { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Biohazard, BrainCircuit, Cloud, CloudSun, Database, FileCheck, FlaskConical, Home, KeyRound, LockKeyhole, Map as MapIcon, Menu, Radar, ShieldCheck, Smartphone, X } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import { api, clearSession, getSessionUser, hasOperatorKey } from "./api.js";

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

function Topbar({ mobileOpen, onToggleMobile }) {
  const { pathname } = useLocation();
  const [accessOpen, setAccessOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [accessError, setAccessError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [operatorActive, setOperatorActive] = useState(hasOperatorKey());
  const [sessionUser, setSessionUser] = useState(getSessionUser());
  const meta = PAGE_META[pathname] ?? PAGE_META["/"];
  const Icon = meta.icon;
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-nav-trigger" onClick={onToggleMobile} aria-label="Toggle navigation">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
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
            title="Account access"
            aria-label="Account access"
          >
            {operatorActive ? <KeyRound size={14} /> : <LockKeyhole size={14} />}
            <span>{sessionUser?.full_name?.split(" ")[0] || (operatorActive ? "Operator" : "Sign in")}</span>
          </button>
          {accessOpen && (
            <form
              className="operator-access-panel"
              onSubmit={async (event) => {
                event.preventDefault();
                setSigningIn(true); setAccessError("");
                try {
                  const result = await api.login(credentials.email, credentials.password);
                  setSessionUser(result.user); setOperatorActive(true);
                  setCredentials({ email: "", password: "" }); setAccessOpen(false);
                } catch (error) { setAccessError(error.message); }
                finally { setSigningIn(false); }
              }}
            >
              <strong>{sessionUser ? sessionUser.full_name : "Secure workspace"}</strong>
              <span>{sessionUser ? `${sessionUser.role.replace(/_/g, " ")} · session active` : "Role-based operator access"}</span>
              {!sessionUser && <input
                type="email"
                value={credentials.email}
                onChange={(event) => setCredentials({ ...credentials, email: event.target.value })}
                placeholder="Work email"
                autoComplete="username"
                required
              />}
              {!sessionUser && <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
                placeholder="Password"
                autoComplete="current-password"
                required
              />}
              {accessError && <span className="form-error">{accessError}</span>}
              <div>
                {operatorActive && (
                  <button type="button" className="btn btn-outline" onClick={() => {
                    clearSession(); setSessionUser(null);
                    setOperatorActive(false);
                    setAccessOpen(false);
                  }}>Sign out</button>
                )}
                {!sessionUser && <button className="btn btn-primary" disabled={signingIn}>{signingIn ? "Signing in..." : "Sign in"}</button>}
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
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="layout">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <div className="main-content">
        <Topbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen((open) => !open)} />
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
