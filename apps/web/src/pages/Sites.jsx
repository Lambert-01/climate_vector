import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Database, Map, MapPin } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, ChartState, DataTable, MetricStrip, SectionCard } from "../components/UI";

function asNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function markerColor(quality) {
  return String(quality).includes("validated") ? "#22c55e" : "#f59e0b";
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
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([lat, lng], { icon })
        .addTo(layer)
        .bindPopup(
          `<strong>${site.site_name}</strong><br/>${site.district ?? ""}<br/><small>${String(site.coordinate_quality).replace(/_/g, " ")}</small>`
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
    }));
  }, [rawSites, candidateRows]);

  const provisional = mappedSites.filter((s) => String(s.coordinate_quality).includes("provisional")).length;
  const validated = mappedSites.length - provisional;

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
            { label: "Validated GPS", value: loading || cL ? "..." : validated },
            { label: "Provisional candidates", value: loading || cL ? "..." : provisional },
            { label: "PI action", value: provisional ? "GPS needed" : "Review" },
          ]}
        />
      </SectionCard>

      <div className="grid-2" style={{ marginTop: 20, marginBottom: 20 }}>
        <SectionCard title="National map" icon={Map}>
          <div className="card-body">
            <ChartState loading={loading || cL} error={error || cError} rows={mappedSites} empty="No mappable site coordinates available.">
              <RwandaMap sites={mappedSites} />
            </ChartState>
          </div>
        </SectionCard>

        <SectionCard title="Map data" icon={MapPin}>
          <DataTable
            rows={mappedSites}
            maxRows={30}
            columns={["site_name", "district", "records", "latitude", "longitude", "coordinate_quality", "coordinate_source"]}
          />
        </SectionCard>
      </div>

      <SectionCard title="Site registry" icon={MapPin}>
        <DataTable
          rows={rawSites}
          maxRows={50}
          columns={["site_id", "site_name", "district", "province", "latitude", "longitude", "coordinate_quality"]}
        />
      </SectionCard>

      <div style={{ marginTop: 20 }}>
        <SectionCard title="GPS validation queue" icon={MapPin}>
          <DataTable
            rows={candidateRows}
            maxRows={50}
            columns={["site_name", "district", "records", "candidate_latitude", "candidate_longitude", "coordinate_quality", "pi_action"]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
