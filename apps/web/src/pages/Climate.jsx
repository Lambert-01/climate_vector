import React, { useMemo, useState } from "react";
import { Cloud, CloudRain, Database, Globe2, ThermometerSun } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import { Badge, ChartState, DataTable, InterpretationPanel, MetricStrip, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

function numberValue(value) {
  return Number.parseFloat(value ?? 0) || 0;
}

export default function Climate() {
  const [selectedDistrict, setSelectedDistrict] = useState("bugesera");
  const [days, setDays] = useState(90);
  const [activeView, setActiveView] = useState("regional");

  const { data: districts } = useFetch(api.climateDistricts);
  const { data: publicFeatures } = useFetch(api.publicDistrictFeatures);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);
  const { data: regionalClimate, loading: rcL, error: rcError } = useFetch(api.arboviralClimate);
  const { data: era5, loading: eL, error: eError } = useFetch(api.publicEra5);
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
  const era5Rows = (era5?.monthly ?? []).map((r) => ({
    month: r.month,
    rain: numberValue(r.rainfall_total_estimated_mm),
    tmean: numberValue(r.tmean_c),
    dewpoint: numberValue(r.dewpoint_c),
    runoff: numberValue(r.runoff_total_estimated_mm),
  }));
  const era5Latest = era5Rows[era5Rows.length - 1];
  const regionalRows = (regionalClimate?.items ?? intelligence?.regional_climate?.items ?? []).map((r) => ({
    location: r.location,
    country: r.country,
    rain30: numberValue(r.rainfall_latest_30d_mm),
    tmean: numberValue(r.tmean_mean_c),
    humidity: numberValue(r.humidity_mean_pct),
    signal: r.climate_signal,
  }));
  const topRegionalWetness = [...regionalRows].sort((a, b) => b.rain30 - a.rain30).slice(0, 7);
  const highRegionalCount = regionalRows.filter((row) => String(row.signal).includes("high")).length;

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
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Climate signals</h2>
          <div className="page-subtitle">Great Lakes regional climate screening — NASA POWER regional + Rwanda district-level</div>
          <div className="page-header-badges">
            <Badge variant="green">NASA POWER regional</Badge>
            <Badge variant="blue">Rwanda PoC: {label}</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename="arborisk_climate_regional"
            csvRows={regionalRows.map((r) => ({
              location: r.location,
              country: r.country,
              rainfall_30d_mm: r.rain30,
              tmean_c: r.tmean,
              humidity_pct: r.humidity,
              signal: r.signal,
            }))}
            jsonData={{ regional: regionalRows, selected_district: selectedDistrict, district_rows: districtRows }}
          />
        </div>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Climate views">
        {[["regional", "Regional interpretation"], ["district", "District explorer"], ["baseline", "ERA5 & reference"]].map(([id, viewLabel]) => (
          <button key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}>{viewLabel}</button>
        ))}
      </div>

      {activeView === "regional" && <>
      <SectionCard title="Great Lakes climate intelligence" icon={Globe2}>
        <MetricStrip
          items={[
            { label: "Regional points", value: rcL || iL ? "..." : regionalRows.length },
            { label: "High signals", value: iL ? "..." : intelligence?.summary?.high_climate_context_points ?? "..." },
            { label: "Wettest point", value: topRegionalWetness[0]?.location ?? "..." },
            { label: "Rwanda districts", value: publicFeatures?.items?.length ?? "..." },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="Climate interpretation"
        verdict={`${topRegionalWetness[0]?.location ?? "Regional climate"} is currently the strongest wetness context point; Rwanda district climate remains useful as a proof-of-concept layer.`}
        tone={highRegionalCount > 0 ? "amber" : "teal"}
        confidence="NASA POWER and ERA5 are robust public climate inputs; they require field and disease validation before outbreak claims."
        items={[
          {
            label: "Regional signal",
            value: `${highRegionalCount} high climate-context points`,
            note: "Use for regional preparedness scanning and cross-border discussion.",
          },
          {
            label: "Rwanda layer",
            value: `${publicFeatures?.items?.length ?? 0} district summaries`,
            note: "Use for district screening and sentinel-site planning.",
          },
          {
            label: "Decision use",
            value: "Field window and wetness prioritization",
            note: "Good for planning verification, not confirming transmission.",
          },
        ]}
      />

      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="Regional 30-day wetness" icon={CloudRain}>
          <ChartState loading={rcL || iL} error={rcError || iError} rows={topRegionalWetness} empty="No Great Lakes climate rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRegionalWetness} margin={{ top: 4, right: 8, left: -20, bottom: 52 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="rain30" fill="#0d9488" radius={[4, 4, 0, 0]} name="30d rainfall mm" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Regional climate point table" icon={Database}>
          <ChartState loading={rcL || iL} error={rcError || iError} rows={regionalRows} empty="No regional climate rows available.">
            <DataTable rows={regionalRows} columns={["location", "country", "rain30", "tmean", "humidity", "signal"]} />
          </ChartState>
        </SectionCard>
      </div>
      </>}

      {activeView === "district" && <>
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

      <SectionCard title={`${label} Rwanda district coverage`} icon={Database}>
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
            { label: "ERA5 monthly rows", value: eL ? "..." : era5Rows.length },
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
      </>}

      {activeView === "baseline" && <>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="ERA5-Land monthly Rwanda baseline" icon={Database}>
          <MetricStrip
            items={[
              { label: "Coverage", value: era5Rows.length ? `${era5Rows[0].month} to ${era5Latest?.month}` : "..." },
              { label: "Latest rain", value: era5Latest ? `${era5Latest.rain.toFixed(1)} mm` : "..." },
              { label: "Latest temp", value: era5Latest ? `${era5Latest.tmean.toFixed(1)} C` : "..." },
              { label: "Mode", value: "Rwanda bbox inside Great Lakes system" },
            ]}
          />
          <ChartState loading={eL} error={eError} rows={era5Rows} empty="No ERA5 monthly rows loaded.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={era5Rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} interval={Math.max(1, Math.floor(era5Rows.length / 8))} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Line type="monotone" dataKey="rain" stroke="#0d9488" strokeWidth={1.5} dot={false} name="Rainfall total mm" />
                    <Line type="monotone" dataKey="tmean" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="T mean C" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="ERA5 validation table" icon={Database}>
          <ChartState loading={eL} error={eError} rows={era5Rows} empty="No ERA5 monthly rows loaded.">
            <DataTable rows={era5Rows.slice(-12)} columns={["month", "rain", "tmean", "dewpoint", "runoff"]} />
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard title="Gasabo/Kigali live reference" icon={Cloud}>
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
      </>}
    </div>
  );
}
