import React, { useMemo, useState } from "react";
import { Cloud, CloudRain, Database, ThermometerSun } from "lucide-react";
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
import { Badge, ChartState, MetricStrip, SectionCard } from "../components/UI";

function numberValue(value) {
  return Number.parseFloat(value ?? 0) || 0;
}

export default function Climate() {
  const [selectedDistrict, setSelectedDistrict] = useState("bugesera");
  const [days, setDays] = useState(90);

  const { data: districts } = useFetch(api.climateDistricts);
  const { data: publicFeatures } = useFetch(api.publicDistrictFeatures);
  const { data: districtClimate, loading: dL, error: dError } = useFetch(
    () => api.climateDistrict(selectedDistrict, days),
    [selectedDistrict, days]
  );
  const { data: kigali, loading: kL, error: kError } = useFetch(
    () => api.climateKigali(days),
    [days]
  );

  const districtRows = (districtClimate?.items ?? []).map((r) => ({
    date: r.DATE ?? r.date ?? "",
    rain: numberValue(r.PRECTOTCORR ?? r.rainfall_mm),
    tmax: numberValue(r.T2M_MAX ?? r.tmax_c),
    tmin: numberValue(r.T2M_MIN ?? r.tmin_c),
    tmean: numberValue(r.T2M ?? r.tmean_c),
    rh: numberValue(r.RH2M ?? r.relative_humidity),
  }));

  const kigaliRows = (kigali?.items ?? []).map((r) => ({
    date: r.DATE ?? r.date ?? "",
    rain: numberValue(r.PRECTOTCORR ?? r.rainfall_mm),
    tmean: numberValue(r.T2M ?? r.tmean_c),
  }));

  const feature = useMemo(() => {
    return (publicFeatures?.items ?? []).find(
      (row) => String(row.district).toLowerCase() === selectedDistrict.toLowerCase()
    );
  }, [publicFeatures, selectedDistrict]);

  const totalRain = districtRows.reduce((sum, row) => sum + row.rain, 0);
  const meanTemp = districtRows.length
    ? districtRows.reduce((sum, row) => sum + row.tmean, 0) / districtRows.length
    : 0;
  const rainyDays = districtRows.filter((row) => row.rain >= 1).length;
  const label = selectedDistrict.charAt(0).toUpperCase() + selectedDistrict.slice(1);

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Climate module</div>
          <h2>District climate signals</h2>
        </div>
        <div className="hero-badges">
          <Badge variant="green">NASA POWER loaded</Badge>
          <Badge variant="blue">{label}</Badge>
        </div>
      </div>

      <div className="ops-toolbar">
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
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
        {[30, 90, 180, 365].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`btn ${days === d ? "btn-primary" : "btn-outline"}`}>
            {d}d
          </button>
        ))}
      </div>

      <SectionCard title={`${label} coverage`} icon={Database}>
        <MetricStrip
          items={[
            { label: "Rows in view", value: dL ? "..." : districtRows.length.toLocaleString() },
            { label: "Rainfall total", value: dL ? "..." : `${totalRain.toFixed(1)} mm` },
            { label: "Mean temperature", value: dL ? "..." : `${meanTemp.toFixed(1)} C` },
            { label: "Rainy days >=1mm", value: dL ? "..." : rainyDays },
          ]}
        />
        <MetricStrip
          items={[
            { label: "Full climate records", value: feature?.climate_records ?? "..." },
            { label: "Date range", value: feature ? `${feature.date_start} to ${feature.date_end}` : "..." },
            { label: "GBIF records", value: feature?.gbif_occurrence_count ?? "..." },
            { label: "Public-data status", value: feature ? "Loaded" : "Checking" },
          ]}
        />
      </SectionCard>

      <div className="insight-grid">
        <div className="insight-card"><CloudRain size={17} /><span>Rainfall total</span><strong>{totalRain.toFixed(1)} mm</strong></div>
        <div className="insight-card"><ThermometerSun size={17} /><span>Mean temperature</span><strong>{meanTemp.toFixed(1)} C</strong></div>
        <div className="insight-card"><Cloud size={17} /><span>Rainy days</span><strong>{rainyDays}</strong></div>
      </div>

      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title={`${label} rainfall`} icon={CloudRain}>
          <ChartState loading={dL} error={dError} rows={districtRows} empty={`No climate rows found for ${label}.`}>
            <div className="card-body">
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
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={Math.max(1, Math.floor(districtRows.length / 6))} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Area type="monotone" dataKey="rain" stroke="#0d9488" strokeWidth={2} fill="url(#rainGrad2)" name="Rainfall (mm)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title={`${label} temperature`} icon={ThermometerSun}>
          <ChartState loading={dL} error={dError} rows={districtRows} empty={`No temperature rows found for ${label}.`}>
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={districtRows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={Math.max(1, Math.floor(districtRows.length / 6))} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Line type="monotone" dataKey="tmax" stroke="#ef4444" strokeWidth={1.5} dot={false} name="T max" />
                    <Line type="monotone" dataKey="tmean" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="T mean" />
                    <Line type="monotone" dataKey="tmin" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="T min" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard title="Gasabo reference" icon={Cloud}>
        <ChartState loading={kL} error={kError} rows={kigaliRows} empty="No Kigali reference rows available.">
          <div className="card-body">
            <div className="chart-wrap" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kigaliRows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval={Math.max(1, Math.floor(kigaliRows.length / 8))} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                  <Line yAxisId="left" type="monotone" dataKey="rain" stroke="#0d9488" strokeWidth={1.5} dot={false} name="Rainfall (mm)" />
                  <Line yAxisId="right" type="monotone" dataKey="tmean" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="T mean (C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartState>
      </SectionCard>
    </div>
  );
}
