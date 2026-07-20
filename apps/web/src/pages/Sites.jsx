import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BarChart3, CloudRain, Database, Droplets, Globe2, Map as MapIcon, MapPin, TestTube2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, InterpretationPanel, MetricStrip, SectionCard } from "../components/UI";
import ExportToolbar from "../components/ExportToolbar";

const SITE_COLORS = ["#2f6f4e", "#087f8c", "#d5a642", "#3b82f6", "#f59e0b", "#64748b"];

function asNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function markerColor(quality) {
  return String(quality).includes("validated") || String(quality).includes("lecturer") ? "#22c55e" : "#f59e0b";
}

function fmt(value) {
  return Number(value ?? 0).toLocaleString();
}

function RwandaMap({ sites }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([-1.94, 29.87], 8);
    instanceRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    const rwandaBounds = [
      [-2.84, 28.86],
      [-1.05, 30.9],
    ];
    L.rectangle(rwandaBounds, { color: "#0d9488", weight: 1.5, fill: false, dashArray: "4" }).addTo(map);

    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      instanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = instanceRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points = [];

    sites.forEach((site) => {
      const lat = asNumber(site.latitude);
      const lng = asNumber(site.longitude);
      if (lat === null || lng === null) return;

      const color = markerColor(site.coordinate_quality);
      const records = Number(site.records ?? 0) || 0;
      const size = Math.max(12, Math.min(26, 10 + Math.sqrt(records)));
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.32)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([lat, lng], { icon })
        .addTo(layer)
        .bindPopup(
          `<strong>${site.site_name}</strong><br/>${site.district ?? ""}<br/>Records: ${records}<br/>Habitat: ${site.dominant_habitat || "Not set"}<br/><small>${String(site.coordinate_quality).replace(/_/g, " ")}</small>`
        );
      points.push([lat, lng]);
    });

    if (points.length) {
      map.fitBounds(points, { padding: [24, 24], maxZoom: 9 });
    }
    setTimeout(() => map.invalidateSize(), 50);
  }, [sites]);

  return <div ref={mapRef} className="map-container" />;
}

function RegionalMap({ sites, regionalPoints }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([-1.7, 30.7], 6);
    instanceRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 50);
    return () => {
      map.remove();
      instanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = instanceRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points = [];

    sites.forEach((site) => {
      const lat = asNumber(site.latitude);
      const lng = asNumber(site.longitude);
      if (lat === null || lng === null) return;
      L.circleMarker([lat, lng], {
        radius: 4,
        color: "#ffffff",
        weight: 1,
        fillColor: "#22c55e",
        fillOpacity: 0.85,
      })
        .addTo(layer)
        .bindPopup(`<strong>${site.site_name}</strong><br/>Rwanda sentinel site<br/><small>${String(site.coordinate_quality).replace(/_/g, " ")}</small>`);
      points.push([lat, lng]);
    });

    regionalPoints.forEach((point) => {
      const lat = asNumber(point.latitude);
      const lng = asNumber(point.longitude);
      if (lat === null || lng === null) return;
      const high = String(point.climate_signal).includes("high");
      L.circleMarker([lat, lng], {
        radius: high ? 10 : 8,
        color: "#0b3d42",
        weight: 2,
        fillColor: high ? "#ef4444" : "#2563eb",
        fillOpacity: 0.82,
      })
        .addTo(layer)
        .bindPopup(
          `<strong>${point.location}, ${point.country}</strong><br/>30d rain: ${point.rainfall_latest_30d_mm} mm<br/>Mean temp: ${point.tmean_mean_c} C<br/><small>${String(point.climate_signal).replace(/_/g, " ")}</small>`
        );
      points.push([lat, lng]);
    });

    if (points.length) {
      map.fitBounds(points, { padding: [28, 28], maxZoom: 7 });
    }
    setTimeout(() => map.invalidateSize(), 50);
  }, [sites, regionalPoints]);

  return <div ref={mapRef} className="map-container" />;
}

export default function Sites() {
  const [activeView, setActiveView] = useState("map");
  const { data, loading, error } = useFetch(api.sites);
  const { data: sentinelData, loading: sL, error: sError } = useFetch(api.sentinelRegistry);
  const { data: candidates, loading: cL, error: cError } = useFetch(api.siteCoordinateCandidates);
  const { data: intelligence, loading: iL, error: iError } = useFetch(api.arboviralIntelligence);

  const rawSites = data?.items ?? [];
  const sentinelRows = sentinelData?.items ?? [];
  const candidateRows = candidates?.items ?? [];
  const mappedSites = useMemo(() => {
    const piById = new Map(
      rawSites.map((site) => [String(site.site_id ?? site.site_name ?? "").toLowerCase(), site])
    );
    const sentinelSites = sentinelRows.map((site) => {
      const pi = piById.get(String(site.site_id ?? "").toLowerCase()) ?? {};
      return {
        site_id: site.site_id,
        site_name: site.sentinel_name ?? site.site_label ?? site.site_id,
        district: pi.district ?? "",
        province: pi.province ?? "",
        latitude: site.latitude,
        longitude: site.longitude,
        coordinate_quality: site.coordinate_quality ?? "lecturer_provided_wkt_coordinate",
        coordinate_source: site.coordinate_source ?? "map_33_sentinel_xls",
        records: pi.records ?? "",
        dominant_habitat: pi.dominant_habitat ?? "—",
        dominant_species_context: pi.dominant_species_context ?? "—",
        dominant_agri_insecticide: pi.dominant_agri_insecticide ?? "—",
        rainfall_mean_daily_mm: pi.rainfall_mean_daily_mm ?? "—",
        tmean_c_mean: pi.tmean_c_mean ?? "—",
        gbif_occurrence_count: pi.gbif_occurrence_count ?? "—",
      };
    });
    if (sentinelSites.length) return sentinelSites;

    const validSites = rawSites
      .map((site) => ({
        site_id: site.site_id ?? site.site_name,
        site_name: site.site_name ?? site.site_id,
        district: site.district,
        province: site.province,
        latitude: site.latitude,
        longitude: site.longitude,
        coordinate_quality: site.coordinate_quality ?? "validated",
        coordinate_source: site.coordinate_source ?? "site_registry",
        records: site.records ?? "",
        dominant_habitat: site.dominant_habitat ?? "—",
        dominant_species_context: site.dominant_species_context ?? "—",
        dominant_agri_insecticide: site.dominant_agri_insecticide ?? "—",
        rainfall_mean_daily_mm: site.rainfall_mean_daily_mm ?? "—",
        tmean_c_mean: site.tmean_c_mean ?? "—",
        gbif_occurrence_count: site.gbif_occurrence_count ?? "—",
      }))
      .filter((site) => asNumber(site.latitude) !== null && asNumber(site.longitude) !== null);

    if (validSites.length) return validSites;

    return candidateRows.map((site) => ({
      site_id: site.site_name,
      site_name: site.site_name,
      district: site.district,
      province: "",
      latitude: site.candidate_latitude,
      longitude: site.candidate_longitude,
      coordinate_quality: site.coordinate_quality,
      coordinate_source: site.coordinate_source,
      records: site.records,
      dominant_habitat: site.dominant_habitat ?? "—",
      dominant_species_context: site.dominant_species_context ?? "—",
      dominant_agri_insecticide: site.dominant_agri_insecticide ?? "—",
      rainfall_mean_daily_mm: site.rainfall_mean_daily_mm ?? "—",
      tmean_c_mean: site.tmean_c_mean ?? "—",
      gbif_occurrence_count: site.gbif_occurrence_count ?? "—",
    }));
  }, [rawSites, sentinelRows, candidateRows]);

  const provisional = mappedSites.filter((s) => String(s.coordinate_quality).includes("provisional")).length;
  const lecturerProvided = mappedSites.filter((s) => String(s.coordinate_quality).includes("lecturer")).length;
  const totalRecords = mappedSites.reduce((sum, site) => sum + (Number(site.records) || 0), 0);
  const districts = new Set(mappedSites.map((site) => site.district).filter(Boolean)).size;
  const topSites = [...mappedSites]
    .sort((a, b) => (Number(b.records) || 0) - (Number(a.records) || 0))
    .slice(0, 12)
    .map((site) => ({
      site: site.site_name,
      records: Number(site.records) || 0,
      district: site.district,
    }));
  const topSite = topSites[0]?.site ?? "—";
  const topHabitat = mappedSites.find((site) => site.dominant_habitat)?.dominant_habitat ?? "—";
  const topInsecticide = mappedSites.find((site) => site.dominant_agri_insecticide)?.dominant_agri_insecticide ?? "—";
  const regionalPoints = intelligence?.regional_climate?.items ?? [];
  const highRegionalPoints = regionalPoints.filter((p) => String(p.climate_signal).includes("high")).length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Sentinel sites</h2>
          <div className="page-subtitle">Great Lakes spatial coverage and Rwanda sentinel map</div>
          <div className="page-header-badges">
            <Badge variant={lecturerProvided ? "green" : provisional ? "amber" : "green"}>{lecturerProvided ? "Lecturer WKT" : provisional ? "GPS validation needed" : "GPS ready"}</Badge>
            <Badge variant="blue">{regionalPoints.length} regional points</Badge>
          </div>
        </div>
        <div className="page-header-actions">
          <ExportToolbar
            csvFilename="dengueew_gl_sentinel_sites"
            csvRows={mappedSites.map((s) => ({
              district: s.district,
              name: s.site_name,
              latitude: s.latitude,
              longitude: s.longitude,
              coordinate_quality: s.coordinate_quality,
              records: s.records,
            }))}
            jsonData={{ sites: mappedSites, regional_points: regionalPoints }}
          />
        </div>
      </div>

      <SectionCard title="Spatial coverage" icon={Database}>
        <MetricStrip
          items={[
            { label: "Mapped locations", value: loading || cL || sL ? "..." : mappedSites.length },
            { label: "Regional climate points", value: iL ? "..." : regionalPoints.length },
            { label: "High regional signals", value: iL ? "..." : highRegionalPoints },
            { label: "Lecturer WKT", value: loading || cL || sL ? "..." : lecturerProvided },
          ]}
        />
      </SectionCard>

      <InterpretationPanel
        title="Spatial interpretation"
        verdict="The map supports pilot planning: regional climate points frame the Great Lakes context, while 33 lecturer-provided locations remain candidate sentinel sites until PI and district validation."
        tone="blue"
        confidence="Lecturer WKT coordinates are usable for MVP mapping; official PI confirmation is still recommended before formal reporting."
        items={[
          {
            label: "Regional layer",
            value: `${regionalPoints.length} Great Lakes points`,
            note: "Used for cross-border climate-vector context.",
          },
          {
            label: "Sentinel layer",
            value: `${lecturerProvided} mapped sites`,
            note: "Usable for field verification planning and site registry cleaning.",
          },
          {
            label: "Next action",
            value: "Confirm administrative metadata",
            note: "District/province/facility names should be harmonized with PI records.",
          },
        ]}
      />

      <div className="workspace-tabs" role="tablist" aria-label="Sentinel site views">
        {[["map", "Operational maps"], ["analysis", "Coverage analysis"], ["records", "Site registry"]].map(([id, label]) => (
          <button key={id} className={activeView === id ? "active" : ""} onClick={() => setActiveView(id)}>{label}</button>
        ))}
      </div>

      {activeView === "analysis" && <>
      <div className="insight-grid">
        <div className="insight-card"><MapPin size={17} /><span>Highest-volume site</span><strong>{topSite}</strong></div>
        <div className="insight-card"><Droplets size={17} /><span>Main habitat signal</span><strong>{topHabitat}</strong></div>
        <div className="insight-card"><TestTube2 size={17} /><span>Main exposure signal</span><strong>{topInsecticide}</strong></div>
      </div>
      </>}

      {activeView === "map" && <>
      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="Great Lakes operational map" icon={Globe2}>
          <div className="card-body">
            <ChartState loading={loading || cL || sL || iL} error={error || cError || sError || iError} rows={[...mappedSites, ...regionalPoints]} empty="No regional map coordinates available.">
              <RegionalMap sites={mappedSites} regionalPoints={regionalPoints} />
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Rwanda sentinel map" icon={MapIcon}>
          <div className="card-body">
            <ChartState loading={loading || cL || sL} error={error || cError || sError} rows={mappedSites} empty="No mappable site coordinates available.">
              <RwandaMap sites={mappedSites} />
            </ChartState>
          </div>
        </SectionCard>
      </div>
      </>}

      {activeView === "analysis" && <>
      <div className="grid-2" style={{ marginBottom: 20 }}>

        <SectionCard title="Site volume" icon={BarChart3}>
          <ChartState loading={loading || cL || sL} error={error || cError || sError} rows={topSites} empty="No site records available.">
            <div className="card-body">
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSites} margin={{ top: 6, right: 12, left: -18, bottom: 54 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f4" vertical={false} />
                    <XAxis dataKey="site" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #d8e2e4" }} />
                    <Bar dataKey="records" name="Records" radius={[4, 4, 0, 0]}>
                      {topSites.map((_, index) => <Cell key={index} fill={SITE_COLORS[index % SITE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartState>
        </SectionCard>

        <SectionCard title="Regional climate points" icon={CloudRain}>
          <ChartState loading={iL} error={iError} rows={regionalPoints} empty="No Great Lakes climate points loaded.">
            <DataTable
              rows={regionalPoints}
              maxRows={10}
              columns={["location", "country", "latitude", "longitude", "rainfall_latest_30d_mm", "tmean_mean_c", "climate_signal"]}
            />
          </ChartState>
        </SectionCard>
      </div>
      </>}

      {activeView === "records" && <>
      <SectionCard title="Operational site registry" icon={MapPin}>
        <DataTable
          rows={mappedSites}
          maxRows={50}
          columns={[
            "site_name",
            "district",
            "records",
            "dominant_habitat",
            "dominant_species_context",
            "dominant_agri_insecticide",
            "rainfall_mean_daily_mm",
            "tmean_c_mean",
            "gbif_occurrence_count",
          ]}
        />
      </SectionCard>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <SectionCard title="Map coordinates" icon={MapPin}>
          <DataTable
            rows={mappedSites}
            maxRows={50}
            columns={["site_name", "district", "records", "latitude", "longitude", "coordinate_quality", "coordinate_source"]}
          />
        </SectionCard>

        <SectionCard title="Climate context" icon={CloudRain}>
          <DataTable
            rows={mappedSites}
            maxRows={50}
            columns={["site_name", "district", "rainfall_mean_daily_mm", "tmean_c_mean", "gbif_occurrence_count"]}
          />
        </SectionCard>
      </div>
      </>}
    </div>
  );
}
