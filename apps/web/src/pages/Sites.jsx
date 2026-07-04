import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BarChart3, CloudRain, Database, Droplets, Map, MapPin, TestTube2 } from "lucide-react";
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
import { Badge, ChartState, DataTable, MetricStrip, SectionCard } from "../components/UI";

const SITE_COLORS = ["#2f6f4e", "#087f8c", "#d5a642", "#3b82f6", "#f59e0b", "#64748b"];

function asNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function markerColor(quality) {
  return String(quality).includes("validated") ? "#22c55e" : "#f59e0b";
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

export default function Sites() {
  const { data, loading, error } = useFetch(api.sites);
  const { data: candidates, loading: cL, error: cError } = useFetch(api.siteCoordinateCandidates);

  const rawSites = data?.items ?? [];
  const candidateRows = candidates?.items ?? [];
  const mappedSites = useMemo(() => {
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
  }, [rawSites, candidateRows]);

  const provisional = mappedSites.filter((s) => String(s.coordinate_quality).includes("provisional")).length;
  const validated = mappedSites.length - provisional;
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

  return (
    <div className="page ops-page">
      <div className="ops-header">
        <div>
          <div className="eyebrow">Spatial module</div>
          <h2>Sites and map</h2>
        </div>
        <div className="hero-badges">
          <Badge variant={provisional ? "amber" : "green"}>{provisional ? "GPS validation needed" : "GPS ready"}</Badge>
          <Badge variant="blue">{mappedSites.length} mapped</Badge>
        </div>
      </div>

      <SectionCard title="Coordinate coverage" icon={Database}>
        <MetricStrip
          items={[
            { label: "Mapped locations", value: loading || cL ? "..." : mappedSites.length },
            { label: "PI records", value: loading || cL ? "..." : fmt(totalRecords) },
            { label: "Districts", value: loading || cL ? "..." : districts },
            { label: "Provisional GPS", value: loading || cL ? "..." : provisional },
          ]}
        />
      </SectionCard>

      <div className="insight-grid">
        <div className="insight-card"><MapPin size={17} /><span>Highest-volume site</span><strong>{topSite}</strong></div>
        <div className="insight-card"><Droplets size={17} /><span>Main habitat signal</span><strong>{topHabitat}</strong></div>
        <div className="insight-card"><TestTube2 size={17} /><span>Main exposure signal</span><strong>{topInsecticide}</strong></div>
      </div>

      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="National map" icon={Map}>
          <div className="card-body">
            <ChartState loading={loading || cL} error={error || cError} rows={mappedSites} empty="No mappable site coordinates available.">
              <RwandaMap sites={mappedSites} />
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Site volume" icon={BarChart3}>
          <ChartState loading={loading || cL} error={error || cError} rows={topSites} empty="No site records available.">
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
      </div>

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
    </div>
  );
}
