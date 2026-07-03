import React, { useState } from "react";
import { Cloud } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { SectionCard, Spinner } from "../components/UI";

export default function Climate() {
  const [selectedDistrict, setSelectedDistrict] = useState("bugesera");
  const [days, setDays] = useState(90);

  const { data: districts } = useFetch(api.climateDistricts);
  const { data: districtClimate, loading: dL } = useFetch(
    () => api.climateDistrict(selectedDistrict, days),
    [selectedDistrict, days]
  );
  const { data: kigali, loading: kL } = useFetch(
    () => api.climateKigali(days),
    [days]
  );

  const districtRows = (districtClimate?.items ?? []).map((r) => ({
    date: r.DATE ?? r.date ?? "",
    rain: parseFloat(r.PRECTOTCORR ?? r.rainfall_mm ?? 0) || 0,
    tmax: parseFloat(r.T2M_MAX ?? r.tmax_c ?? 0) || 0,
    tmin: parseFloat(r.T2M_MIN ?? r.tmin_c ?? 0) || 0,
    tmean: parseFloat(r.T2M ?? r.tmean_c ?? 0) || 0,
    rh: parseFloat(r.RH2M ?? r.relative_humidity ?? 0) || 0,
  }));

  const kigaliRows = (kigali?.items ?? []).map((r) => ({
    date: r.DATE ?? r.date ?? "",
    rain: parseFloat(r.PRECTOTCORR ?? r.rainfall_mm ?? 0) || 0,
    tmean: parseFloat(r.T2M ?? r.tmean_c ?? 0) || 0,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Climate Data</h2>
        <p>NASA POWER district climate signals — 2021–2025</p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            fontSize: 13,
            background: "var(--surface)",
            color: "var(--text-primary)",
          }}
        >
          {(districts?.districts ?? ["bugesera", "gasabo", "kicukiro", "musanze", "rubavu"]).map((d) => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        {[30, 90, 180, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`btn ${days === d ? "btn-primary" : "btn-outline"}`}
          >
            {d}d
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title={`${selectedDistrict} — Rainfall (mm)`} icon={Cloud}>
          <div className="card-body">
            {dL ? <Spinner /> : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={districtRows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rainGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={Math.floor(districtRows.length / 6)} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Area type="monotone" dataKey="rain" stroke="#0d9488" strokeWidth={2} fill="url(#rainGrad2)" name="Rainfall (mm)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title={`${selectedDistrict} — Temperature (°C)`} icon={Cloud}>
          <div className="card-body">
            {dL ? <Spinner /> : (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={districtRows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={Math.floor(districtRows.length / 6)} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Line type="monotone" dataKey="tmax" stroke="#ef4444" strokeWidth={1.5} dot={false} name="T max" />
                    <Line type="monotone" dataKey="tmean" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="T mean" />
                    <Line type="monotone" dataKey="tmin" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="T min" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Kigali Reference — Rainfall & Temperature" icon={Cloud}>
        <div className="card-body">
          {kL ? <Spinner /> : (
            <div className="chart-wrap" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kigaliRows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={Math.floor(kigaliRows.length / 8)} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                  <Line yAxisId="left" type="monotone" dataKey="rain" stroke="#0d9488" strokeWidth={1.5} dot={false} name="Rainfall (mm)" />
                  <Line yAxisId="right" type="monotone" dataKey="tmean" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="T mean (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
