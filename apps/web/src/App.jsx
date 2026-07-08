import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, Biohazard, BrainCircuit, Cloud, CloudSun, Database, FlaskConical, Home, Map, Radar } from "lucide-react";
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
  "/": { title: "Arboviral Command View", sub: "Great Lakes climate-vector preparedness intelligence", icon: Home },
  "/arboviral": { title: "Arboviral Preparedness", sub: "Aedes, Culex, RVF, and Great Lakes regional context", icon: Biohazard },
  "/sites": { title: "Regional Spatial Operations", sub: "Great Lakes points, Rwanda sentinel sites, coordinate quality, and map view", icon: Map },
  "/mosquito": { title: "Regional Vector Evidence", sub: "Aedes, Culex, Anopheles, ecology, species context, and habitats", icon: Activity },
  "/resistance": { title: "Vector Control Intelligence", sub: "Susceptibility context, intervention readiness, and validation needs", icon: FlaskConical },
  "/climate": { title: "Great Lakes Climate Context", sub: "Regional rainfall, temperature, humidity, ERA5, and Rwanda district signals", icon: Cloud },
  "/live-weather": { title: "Live Weather Operations", sub: "Open-Meteo nowcast, field windows, and climate-vector review", icon: CloudSun },
  "/modeling": { title: "Preparedness Prioritization", sub: "Regional indices, Rwanda district screening, confidence, and next actions", icon: BrainCircuit },
  "/alerts": { title: "Field Verification Board", sub: "Signal review, action queue, partner workflow, and response tracking", icon: AlertTriangle },
  "/data-readiness": { title: "Evidence Control Center", sub: "All-source validation, partner governance, and pilot data queue", icon: Database },
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
        <div className="topbar-mission">
          <Radar size={13} />
          <span>Readiness</span>
          <span>Aedes</span>
          <span>RVF</span>
          <span>Climate</span>
          <span>Response</span>
        </div>
        <span className="badge badge-teal" style={{ fontSize: 11 }}>MVP</span>
        <span className="badge badge-amber" style={{ fontSize: 11 }}>Pilot Next</span>
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
          <Route path="/arboviral" element={<Arboviral />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/mosquito" element={<Mosquito />} />
          <Route path="/resistance" element={<Resistance />} />
          <Route path="/climate" element={<Climate />} />
          <Route path="/live-weather" element={<LiveWeather />} />
          <Route path="/modeling" element={<Modeling />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/data-readiness" element={<DataReadiness />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
