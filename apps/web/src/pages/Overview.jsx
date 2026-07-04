import React from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Database,
  FlaskConical,
  Globe2,
  Map,
  ShieldCheck,
  Sigma,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import {
  AlertBanner,
  Badge,
  ChartState,
  DataTable,
  MetricStrip,
  SectionCard,
  StatCard,
} from "../components/UI";

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value) {
  return Number(value ?? 0).toLocaleString();
}

function statusVariant(value) {
  const text = String(value ?? "");
  if (text === "yes" || text.includes("ready") || text.includes("usable") || text.includes("validated")) return "green";
  if (text === "partial" || text.includes("context")) return "amber";
  if (text.includes("not")) return "red";
  return "blue";
}

export default function Overview() {
  const { data: stats, loading: statsLoading, error: statsError } = useFetch(api.stats);
  const { data: dbStatus, loading: dbLoading, error: dbError } = useFetch(api.databaseStatus);
  const { data: readiness, loading: readinessLoading, error: readinessError } = useFetch(api.readiness);
  const { data: climate, loading: climateLoading, error: climateError } = useFetch(api.climateSummary);
  const { data: publicSources, loading: sourcesLoading, error: sourcesError } = useFetch(api.publicDataSources);
  const { data: publicFeatures, loading: featuresLoading, error: featuresError } = useFetch(api.publicDistrictFeatures);
  const { data: validation, loading: validationLoading, error: validationError } = useFetch(api.publicValidation);
  const { data: formulas, loading: formulasLoading, error: formulasError } = useFetch(api.publicFormulationSources);
  const { data: gbif } = useFetch(() => api.publicGbif(1));
  const { data: risk, loading: riskLoading, error: riskError } = useFetch(() => api.districtRisk(30));

  const sourceRows = publicSources?.items ?? [];
  const validationRows = validation?.items ?? [];
  const formulaRows = formulas?.items ?? [];
  const featureRows = publicFeatures?.items ?? [];
  const readinessRows = readiness?.items ?? [];
  const availableReadiness = readinessRows.filter((row) => String(row.ready).toLowerCase() === "true");
  const validationNeeds = readinessRows.filter((row) => String(row.ready).toLowerCase() !== "true");
  const loadedSources = sourceRows.filter((row) => num(row.file_count) > 0).length;
  const pendingSources = sourceRows.filter((row) => String(row.use_now).includes("not_downloaded")).length;

  const climateRows = (climate?.items ?? []).slice(-60).map((row) => ({
    date: row.date ?? row.DATE ?? "",
    rain: num(row.rainfall_mm ?? row.PRECTOTCORR),
    temp: num(row.tmean_c ?? row.T2M),
  }));

  const wettestDistricts = featureRows
    .map((row) => ({
      district: row.district,
      rainfall: num(row.rainfall_mean_daily_mm),
      temp: num(row.tmean_c_mean),
      records: num(row.climate_records),
    }))
    .sort((a, b) => b.rainfall - a.rainfall)
    .slice(0, 8);

  const priorityDistricts = (risk?.items ?? [])
    .slice(0, 8)
    .map((row) => ({
      district: row.district,
      suitability: num(row.suitability_index),
      records: num(row.recent_records),
      level: row.risk_level,
    }));

  return (
    <div className="page overview-redesign">
      <section className="overview-hero">
        <div className="overview-hero-main">
          <div className="eyebrow">Rwanda current-data build</div>
          <h2>Climate-vector intelligence prototype</h2>
          <p>
            A professional proof-of-concept using the two PI datasets, public climate layers,
            mosquito occurrence context, and transparent mathematical suitability scores.
          </p>
          <div className="hero-badges">
            <Badge variant="green">Ready for proposal demo</Badge>
            <Badge variant="amber">Descriptive, not validated prediction</Badge>
            <Badge variant="blue">Pilot validation built in</Badge>
          </div>
        </div>
        <div className="overview-hero-side">
          <div className="scope-item">
            <ShieldCheck size={18} />
            <span>What we can claim</span>
            <strong>Evidence integration and surveillance prioritization</strong>
          </div>
          <div className="scope-item">
            <Target size={18} />
            <span>What we do next</span>
            <strong>Validate GPS, dates, effort, denominator, and protocol during pilot</strong>
          </div>
        </div>
      </section>

      {(statsError || readinessError) && (
        <AlertBanner
          type="error"
          title="Dashboard data issue"
          message={statsError || readinessError}
        />
      )}

      {dbError && (
        <AlertBanner
          type="error"
          title="Database connection issue"
          message={dbError}
        />
      )}

      <div className="stats-grid">
        <StatCard
          icon={Activity}
          label="Mosquito ecology rows"
          value={statsLoading ? "..." : fmt(stats?.mosquito_observations)}
          sub="From mosquito_behavior_raw.xls"
          color="teal"
        />
        <StatCard
          icon={FlaskConical}
          label="Resistance rows"
          value={statsLoading ? "..." : fmt(stats?.resistance_tests)}
          sub="From IR_data.xls"
          color="orange"
        />
        <StatCard
          icon={Map}
          label="Named PI sites"
          value={statsLoading ? "..." : fmt(stats?.sites)}
          sub="Mapped provisionally until GPS validation"
          color="blue"
        />
        <StatCard
          icon={Globe2}
          label="Public covariate layers"
          value={validationLoading ? "..." : validation?.summary?.sources ?? loadedSources}
          sub={`${validation?.summary?.ready_or_usable ?? loadedSources} ready or usable`}
          color="green"
        />
      </div>

      <div className="overview-model-strip">
        <div className="model-strip-item">
          <Database size={18} />
          <div>
            <span>Operational database</span>
            <strong>{dbLoading ? "Checking..." : dbStatus?.connected ? "Connected to DB" : "Not connected"}</strong>
          </div>
        </div>
        <div className="model-strip-item">
          <CheckCircle2 size={18} />
          <div>
            <span>Evidence available now</span>
            <strong>{availableReadiness.length} usable evidence groups</strong>
          </div>
        </div>
        <div className="model-strip-item">
          <CloudRain size={18} />
          <div>
            <span>District climate feature rows</span>
            <strong>{fmt(featureRows.length)} Rwanda district summaries</strong>
          </div>
        </div>
        <div className="model-strip-item">
          <Database size={18} />
          <div>
            <span>GBIF mosquito context</span>
            <strong>{fmt(gbif?.count)} public occurrence records</strong>
          </div>
        </div>
      </div>

      <div className="grid-2 overview-grid">
        <SectionCard title="Validated Evidence Registry" icon={ShieldCheck}>
          <MetricStrip
            items={[
              { label: "Sources", value: validationLoading ? "..." : validation?.summary?.sources ?? 0 },
              { label: "Usable", value: validationLoading ? "..." : validation?.summary?.ready_or_usable ?? 0 },
              { label: "PI sources", value: validationLoading ? "..." : validation?.summary?.primary_pi_sources ?? 0 },
              { label: "Formula modules", value: formulasLoading ? "..." : formulaRows.length },
            ]}
          />
          <ChartState loading={validationLoading} error={validationError} rows={validationRows} empty="No validation registry generated yet.">
            <div className="evidence-chip-grid">
              {validationRows.slice(0, 8).map((row) => (
                <div className="evidence-chip" key={row.source_id}>
                  <strong>{row.source_name}</strong>
                  <span>{row.records_or_files} records/files</span>
                  <Badge variant={statusVariant(row.status)}>{String(row.status).replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Formula Integration" icon={Sigma}>
          <ChartState loading={formulasLoading} error={formulasError} rows={formulaRows} empty="No formulation registry generated yet.">
            <div className="formula-stack">
              {formulaRows.slice(0, 4).map((row) => (
                <div className="formula-line" key={row.symbol}>
                  <div>
                    <strong>{row.symbol}</strong>
                    <span>{row.module}</span>
                  </div>
                  <code>{row.formula}</code>
                  <Badge variant={row.status?.includes("blocked") ? "amber" : "green"}>{String(row.status).replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <div className="grid-2 overview-grid">
        <SectionCard title="Current Data Evidence Base" icon={Database}>
          <div className="evidence-list">
            <div className="evidence-row">
              <div>
                <strong>mosquito_behavior_raw.xls</strong>
                <span>Ecology rows, breeding-site type, larval origin, agricultural insecticide-use context.</span>
              </div>
              <Badge variant="green">Primary PI data</Badge>
            </div>
            <div className="evidence-row">
              <div>
                <strong>IR_data.xls</strong>
                <span>Resistance tests, insecticide concentration, 24h deaths, and Anopheles species context.</span>
              </div>
              <Badge variant="green">Primary PI data</Badge>
            </div>
            <div className="evidence-row">
              <div>
                <strong>Public covariates</strong>
                <span>NASA POWER, CHIRPS, WorldClim, elevation, land cover, population, boundaries, OSM, GBIF.</span>
              </div>
              <Badge variant="blue">Context layers</Badge>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Model Scope For The Deadline" icon={BarChart3}>
          <div className="model-scope">
            <div>
              <span>Built now</span>
              <p>Climate suitability, ecology evidence, resistance-pressure summaries, district prioritization, and proposal-ready readiness tracking.</p>
            </div>
            <div>
              <span>Not claimed yet</span>
              <p>No final resistance classification, mosquito abundance model, or malaria alerting until pilot validation data are collected.</p>
            </div>
            <div>
              <span>Funding logic</span>
              <p>The prototype demonstrates feasibility; the grant funds validation, surveillance expansion, and operational modelling.</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid-2 overview-grid">
        <SectionCard title="Gasabo/Kigali Climate Proxy: Recent Rainfall" icon={CloudRain}>
          <ChartState loading={climateLoading} error={climateError} rows={climateRows} empty="No climate rows available.">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={climateRows} margin={{ top: 6, right: 12, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#087f8c" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#087f8c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={9} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                  <Area type="monotone" dataKey="rain" name="Rainfall mm" stroke="#087f8c" strokeWidth={2} fill="url(#overviewRain)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Top Districts By Current Suitability Proxy" icon={Target}>
          <ChartState loading={riskLoading} error={riskError} rows={priorityDistricts} empty="No district suitability rows available.">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityDistricts} margin={{ top: 6, right: 12, left: -22, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" vertical={false} />
                  <XAxis dataKey="district" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                  <Bar dataKey="suitability" name="Suitability index" fill="#2f6f4e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <div className="grid-2 overview-grid">
        <SectionCard title="Public Covariate Coverage" icon={Globe2}>
          <MetricStrip
            items={[
              { label: "Loaded sources", value: sourcesLoading ? "..." : loadedSources },
              { label: "Pending scenario layer", value: sourcesLoading ? "..." : pendingSources },
              { label: "District climate rows", value: featuresLoading ? "..." : featureRows.length },
              { label: "GBIF rows", value: fmt(gbif?.count) },
            ]}
          />
          <ChartState loading={sourcesLoading} error={sourcesError} rows={sourceRows} empty="No public-data inventory generated yet.">
            <div className="compact-source-list">
              {sourceRows.slice(0, 9).map((source) => (
                <div className="compact-source-row" key={source.source_id}>
                  <strong>{source.source_name}</strong>
                  <Badge variant={statusVariant(source.use_now)}>{String(source.use_now).replace(/_/g, " ")}</Badge>
                  <span>{fmt(source.file_count)} files</span>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Pilot Validation Work Package" icon={ClipboardList}>
          <ChartState loading={readinessLoading} error={readinessError} rows={validationNeeds} empty="No validation needs loaded.">
            <div className="validation-list">
              {validationNeeds.map((row) => (
                <div className="validation-row" key={row.item}>
                  <div>
                    <strong>{String(row.item).replace(/_/g, " ")}</strong>
                    <span>{row.proposal_use || row.status}</span>
                  </div>
                  <Badge variant="amber">Pilot</Badge>
                </div>
              ))}
            </div>
          </ChartState>
        </SectionCard>
      </div>

      <SectionCard title="Wettest District Climate Proxies" icon={CloudRain}>
        <ChartState loading={featuresLoading} error={featuresError} rows={wettestDistricts} empty="No district public climate feature rows available.">
          <div className="district-signal-grid">
            {wettestDistricts.map((row) => (
              <div className="district-signal" key={row.district}>
                <strong>{row.district}</strong>
                <span>{row.rainfall.toFixed(2)} mm/day rainfall proxy</span>
                <small>{row.temp.toFixed(1)} C mean temperature; {fmt(row.records)} climate rows</small>
              </div>
            ))}
          </div>
        </ChartState>
      </SectionCard>

      <SectionCard title="Evidence To Result Trace" icon={Database}>
        <ChartState loading={validationLoading} error={validationError} rows={validationRows} empty="No evidence trace available.">
          <DataTable
            rows={validationRows}
            maxRows={12}
            columns={["source_name", "status", "records_or_files", "model_use", "formula_role", "limitation"]}
          />
        </ChartState>
      </SectionCard>
    </div>
  );
}
