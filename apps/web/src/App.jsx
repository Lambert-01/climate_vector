import React, { lazy, Suspense, useCallback, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Biohazard, BrainCircuit, Cloud, CloudSun, Database, FileCheck, FlaskConical, Home, KeyRound, Loader2, LogIn, LogOut, BookOpen, Map as MapIcon, Menu, Radar, Shield, ShieldCheck, Smartphone, X } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import { api, clearSession, getSessionUser } from "./api.js";

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
const SystemGuide = lazy(() => import("./pages/SystemGuide.jsx"));

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
  "/system-guide":  { title: "Platform Guide",          sub: "System documentation and user guidance",             icon: BookOpen },
};

function LoginModal({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await api.login(email, password);
      setSuccess(true);
      setTimeout(() => onLogin(result.user), 800);
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  }, [email, password, onLogin]);

  if (success) {
    return (
      <div className="login-overlay">
        <div className="login-modal login-success">
          <div className="login-success-icon"><ShieldCheck size={48} /></div>
          <h2>Welcome back</h2>
          <p>Authenticated successfully. Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-brand">
          <div className="login-logo"><Shield size={28} color="#fff" /></div>
          <h1>DengueEW-GL</h1>
          <p>Climate-informed Aedes surveillance &amp; dengue early-warning</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Sign in to workspace</h2>
          <p className="login-sub">Role-based access for authorized operators</p>
          {error && <div className="login-error">{error}</div>}
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.org"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="login-submit" disabled={loading || !email || !password}>
            {loading ? <><Loader2 size={16} className="spin" /> Signing in...</> : <><LogIn size={16} /> Sign in</>}
          </button>
          <p className="login-footer">Authorized personnel only. All access is audited.</p>
        </form>
      </div>
    </div>
  );
}

function Topbar({ mobileOpen, onToggleMobile, sessionUser, onLogout }) {
  const { pathname } = useLocation();
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
            className="operator-access-trigger is-active"
            title={`${sessionUser.full_name} (${sessionUser.role})`}
          >
            <KeyRound size={14} />
            <span>{sessionUser.full_name?.split(" ")[0]}</span>
          </button>
          <button className="operator-access-trigger" onClick={onLogout} title="Sign out">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
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
  const [sessionUser, setSessionUser] = useState(getSessionUser());

  const handleLogin = useCallback((user) => setSessionUser(user), []);
  const handleLogout = useCallback(() => {
    clearSession(); setSessionUser(null);
  }, []);

  if (!sessionUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="layout">
      <Sidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <div className="main-content">
        <Topbar mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen((open) => !open)} sessionUser={sessionUser} onLogout={handleLogout} />
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
            <Route path="/system-guide" element={<SystemGuide />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
