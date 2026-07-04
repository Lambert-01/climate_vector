import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Activity, AlertTriangle, BrainCircuit, Cloud, CloudSun, Database, FlaskConical, Home, Map, Radar } from "lucide-react";
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

const PAGE_META = {
  "/": { title: "Prototype Command View", sub: "Current PI data plus public climate/environment intelligence", icon: Home },
  "/sites": { title: "Spatial Operations", sub: "Sites, coordinate status, and map view", icon: Map },
  "/mosquito": { title: "Mosquito Surveillance", sub: "Ecology, species context, and habitats", icon: Activity },
  "/resistance": { title: "Resistance Intelligence", sub: "Insecticide assay signal review", icon: FlaskConical },
  "/climate": { title: "Climate Intelligence", sub: "District rainfall and temperature signals", icon: Cloud },
  "/live-weather": { title: "Live Weather", sub: "Open-Meteo nowcast and field window", icon: CloudSun },
  "/modeling": { title: "Risk Engine", sub: "Suitability and priority scoring", icon: BrainCircuit },
  "/alerts": { title: "Response Board", sub: "Signal review and action workflow", icon: AlertTriangle },
  "/data-readiness": { title: "Data Control", sub: "Readiness and validation queue", icon: Database },
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
          <span>Habitat</span>
          <span>Susceptibility</span>
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
