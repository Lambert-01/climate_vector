import React, { useMemo, useState } from "react";
import {
  CloudSun,
  Globe2,
  Droplets,
  Gauge,
  Info,
  MapPin,
  Radio,
  RefreshCw,
  ThermometerSun,
  Waves,
  Wind,
} from "lucide-react";
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
import { Badge, ChartState, DataTable, InterpretationPanel, MetricStrip, SectionCard, Spinner } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

function n(value, fallback = 0) {
  return Number.parseFloat(value ?? fallback) || fallback;
}

function title(value) {
  return String(value ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function zipHourly(hourly = {}) {
  const times = hourly.time ?? [];
  return times.slice(0, 48).map((time, i) => ({
    time: String(time).replace("T", " ").slice(5, 16),
    temp: n(hourly.temperature_2m?.[i]),
    humidity: n(hourly.relative_humidity_2m?.[i]),
    dew: n(hourly.dew_point_2m?.[i]),
    rain: n(hourly.precipitation?.[i]),
    soil: n(hourly.soil_moisture_0_to_1cm?.[i]),
    et0: n(hourly.et0_fao_evapotranspiration?.[i]),
  }));
}

function zipDaily(daily = {}) {
  const times = daily.time ?? [];
  return times.map((time, i) => ({
    date: String(time).slice(5),
    tmax: n(daily.temperature_2m_max?.[i]),
    tmin: n(daily.temperature_2m_min?.[i]),
    rain: n(daily.precipitation_sum?.[i]),
    et0: n(daily.et0_fao_evapotranspiration?.[i]),
  }));
}

function riskBadge(level) {
  if (level === "high") return "red";
  if (level === "medium") return "amber";
  return "green";
}

function WeatherTile({ icon: Icon, label, value, tone = "teal" }) {
  return (
    <div className={`weather-tile ${tone}`}>
      <div className="weather-tile-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SignalPill({ label, value }) {
  const pct = Math.round(n(value) * 100);
  return (
    <div className="signal-pill">
      <div>
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="signal-meter">
        <i style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ item }) {
  return (
    <div className={`auto-insight ${item.level ?? "medium"}`}>
      <Info size={15} />
      <div>
        <strong>{item.title}</strong>
        <span>{item.detail}</span>
      </div>
    </div>
  );
}

export default function LiveWeather() {
  const [selected, setSelected] = useState("gasabo");
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: summary, loading: summaryLoading, error: summaryError } = useFetch(
    () => api.liveWeatherDistricts(30),
    [refreshKey]
  );
  const { data: detail, loading: detailLoading, error: detailError } = useFetch(
    () => api.liveWeatherDistrict(selected, 7),
    [selected, refreshKey]
  );
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);

  const districts = summary?.items ?? [];
  const current = detail?.current;
  const hourly = useMemo(() => zipHourly(detail?.hourly), [detail]);
  const daily = useMemo(() => zipDaily(detail?.daily), [detail]);
  const topWet = districts.slice(0, 8).map((row) => ({
    district: row.name,
    score: Math.round(n(row.nowcast_score) * 100),
    rain: n(row.precipitation_mm),
    temp: n(row.temperature_c),
  }));
  const rain48 = hourly.reduce((sum, row) => sum + row.rain, 0);
  const meanHumidity = hourly.length ? hourly.reduce((sum, row) => sum + row.humidity, 0) / hourly.length : 0;
  const components = current?.components ?? {};
  const insights = current?.insights ?? [];
  const sourceStatus = detail?.source_status ?? summary?.source_status ?? "checking";
  const regionalPoints = intelligence?.regional_climate?.top_wetness_points ?? [];

  return (
    <div className="page live-weather-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Live weather</h2>
          <div className="page-subtitle">Real-time Open-Meteo nowcast with regional preparedness signals</div>
          <div className="page-header-badges">
            <Badge variant="blue">{selected.charAt(0).toUpperCase() + selected.slice(1)}</Badge>
            {lastRefreshed && <Badge variant="gray">Updated {lastRefreshed.toLocaleTimeString()}</Badge>}
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename={`dengueew_gl_live_weather_${selected}`}
            csvRows={hourly.map((h) => ({ time: h.time, temp: h.temp, rain: h.rain, humidity: h.humidity, wind: h.wind }))}
            jsonData={{ district: selected, summary, hourly }}
          />
          <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ fontSize: 12, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            {(districts.length ? districts : [{ id: "gasabo", name: "Gasabo" }]).map((d) => (
              <option key={d.id} value={d.id}>{title(d.name)}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setRefreshKey((v) => v + 1)} style={{ fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {summaryLoading && <Spinner />}
      {summaryError && <div className="empty">Live weather is temporarily unavailable.<small>{summaryError}</small></div>}

      <SectionCard title="Live-weather role in DengueEW-GL" icon={Globe2}>
        <MetricStrip
          items={[
            { label: "Rwanda live districts", value: summaryLoading ? "..." : districts.length },
            { label: "Great Lakes context points", value: iL ? "..." : intelligence?.summary?.great_lakes_climate_points ?? 0 },
            { label: "High climate signals", value: iL ? "..." : intelligence?.summary?.high_climate_context_points ?? 0 },
            { label: "Mode", value: "field window" },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="Live-weather interpretation"
        verdict="Live weather improves timing: it helps decide when to inspect habitats, deploy teams, or review wetness signals, not whether an outbreak is occurring."
        tone={current?.risk_level === "high" ? "red" : current?.risk_level === "medium" ? "amber" : "teal"}
        confidence={`Source status: ${sourceStatus}. Use with regional climate context and field verification.`}
        items={[
          {
            label: "Current district",
            value: title(current?.district ?? selected),
            note: `${current ? Math.round(n(current.nowcast_score) * 100) : 0}% nowcast score for field-window review.`,
          },
          {
            label: "48h wetness",
            value: `${rain48.toFixed(1)} mm rain`,
            note: "Supports larval habitat inspection planning.",
          },
          {
            label: "Regional link",
            value: `${intelligence?.summary?.high_climate_context_points ?? 0} high climate points`,
            note: "Use live Rwanda signals alongside Great Lakes wetness context.",
          },
        ]}
      />

      <div className="live-now-grid">
        <div className="live-now-card primary">
          <div className="live-now-card-head">
            <div>
              <span>{current?.condition ?? "Checking"}</span>
              <strong>{title(current?.district ?? selected)}</strong>
            </div>
            <Badge variant={riskBadge(current?.risk_level)}>{current?.risk_level ?? "live"}</Badge>
          </div>
          <div className="live-temp">{current ? `${n(current.temperature_c).toFixed(1)} C` : "..."}</div>
          <div className="live-status-row">
            <span><Droplets size={13} /> {current ? `${n(current.humidity_pct).toFixed(0)}%` : "..."}</span>
            <span><Waves size={13} /> {current ? `${n(current.precipitation_mm).toFixed(1)} mm` : "..."}</span>
            <span><Wind size={13} /> {current ? `${n(current.wind_kmh).toFixed(1)} km/h` : "..."}</span>
          </div>
        </div>

        <WeatherTile icon={Radio} label="Nowcast" value={current ? `${Math.round(n(current.nowcast_score) * 100)}%` : "..."} tone="green" />
        <WeatherTile icon={Waves} label="48h Rain" value={`${rain48.toFixed(1)} mm`} tone="blue" />
        <WeatherTile icon={Droplets} label="48h Humidity" value={`${meanHumidity.toFixed(0)}%`} tone="teal" />
        <WeatherTile icon={Gauge} label="Field Window" value={current ? `${Math.round(n(current.field_window_index) * 100)}%` : "..."} tone="amber" />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <SectionCard title="Auto insights" icon={Radio} action={<Badge variant={sourceStatus === "live" ? "green" : "amber"}>{sourceStatus}</Badge>}>
          <div className="auto-insight-grid">
            {(insights.length ? insights : [{ title: "Checking", detail: "Waiting for forecast signal.", level: "medium" }]).map((item, index) => (
              <InsightCard key={`${item.title}-${index}`} item={item} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Field-readiness signals" icon={Gauge}>
          <div className="signal-panel">
            <SignalPill label="Temperature" value={components.temperature_suitability} />
            <SignalPill label="Humidity" value={components.humidity_suitability} />
            <SignalPill label="Rainfall" value={components.rainfall_suitability} />
            <SignalPill label="Moisture" value={components.moisture_balance_suitability} />
            <SignalPill label="Dewpoint" value={components.dewpoint_suitability} />
          </div>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <SectionCard title="48h rain signal" icon={Waves}>
          <ChartState loading={detailLoading} error={detailError} rows={hourly}>
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="liveRain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} interval={7} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Area type="monotone" dataKey="rain" stroke="#2563eb" strokeWidth={2} fill="url(#liveRain)" name="Rain (mm)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="48h thermal profile" icon={ThermometerSun}>
          <ChartState loading={detailLoading} error={detailError} rows={hourly}>
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} interval={7} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp C" />
                    <Line type="monotone" dataKey="dew" stroke="#0d9488" strokeWidth={1.6} dot={false} name="Dewpoint C" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <SectionCard title="District nowcast ranking" icon={MapPin}>
          <ChartState loading={summaryLoading} error={summaryError} rows={topWet}>
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topWet} layout="vertical" margin={{ top: 4, right: 10, left: 58, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef3f4" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="district" tick={{ fontSize: 10 }} tickLine={false} width={70} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #dde6e8" }} />
                    <Bar dataKey="score" fill="#0d9488" radius={[0, 4, 4, 0]} name="Nowcast %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="7d field window" icon={CloudSun}>
          <ChartState loading={detailLoading} error={detailError} rows={daily}>
            <div className="card-body">
              <div className="weather-day-grid">
                {daily.map((day) => (
                  <div className="weather-day" key={day.date}>
                    <span>{day.date}</span>
                    <strong>{day.rain.toFixed(1)} mm</strong>
                    <small>{day.tmin.toFixed(0)}-{day.tmax.toFixed(0)} C</small>
                  </div>
                ))}
              </div>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard title="Regional wetness context for live review" icon={Globe2}>
        <ChartState loading={iL} error={iError} rows={regionalPoints} empty="No regional wetness context loaded.">
          <DataTable
            rows={regionalPoints}
            maxRows={7}
            columns={["location", "country", "rainfall_latest_30d_mm", "tmean_mean_c", "humidity_mean_pct", "climate_signal"]}
          />
        </ChartState>
      </SectionCard>

      <SectionCard title="Operational use" icon={Gauge}>
        <div className="decision-grid">
          <div className="decision-card">
            <span>Today</span>
            <strong>Schedule field checks when wetness and temperature align</strong>
            <small>Use the nowcast to choose districts for verification, not to issue official alerts.</small>
          </div>
          <div className="decision-card">
            <span>48 hours</span>
            <strong>Prepare teams before rainfall peaks</strong>
            <small>Rainfall and humidity help plan larval habitat inspection windows.</small>
          </div>
          <div className="decision-card">
            <span>Governance</span>
            <strong>Review before action</strong>
            <small>All operational recommendations remain pending technical and PI review.</small>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
