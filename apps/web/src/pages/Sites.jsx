import React, { useEffect, useRef } from "react";
import { Map, MapPin } from "lucide-react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Badge, DataTable, SectionCard, Spinner } from "../components/UI";

function RwandaMap({ sites }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([-1.94, 29.87], 8);
    instanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    // Rwanda approximate bounds overlay
    const rwandaBounds = [[-2.84, 28.86], [-1.05, 30.9]];
    L.rectangle(rwandaBounds, { color: "#0d9488", weight: 1.5, fill: false, dashArray: "4" }).addTo(map);

    return () => { map.remove(); instanceRef.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!L || !instanceRef.current) return;
    const map = instanceRef.current;

    sites?.forEach((site) => {
      const lat = parseFloat(site.latitude);
      const lng = parseFloat(site.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:12px;height:12px;background:#0d9488;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${site.site_name}</strong><br/>${site.district ?? ""}`);
      }
    });
  }, [sites]);

  return <div ref={mapRef} className="map-container" />;
}

export default function Sites() {
  const { data, loading } = useFetch(api.sites);
  const sites = data?.items ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Sentinel Sites</h2>
        <p>Registered mosquito surveillance sites across Rwanda</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <SectionCard title="Site Map" icon={Map}>
          <div className="card-body">
            {loading ? <Spinner /> : <RwandaMap sites={sites} />}
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
              GPS coordinates pending PI confirmation. Map shows placeholder positions.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Site Registry" icon={MapPin}>
          {loading ? (
            <Spinner />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>District</th>
                    <th>Province</th>
                    <th>GPS</th>
                    <th>Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((s, i) => (
                    <tr key={i}>
                      <td><strong>{s.site_name ?? s.site_id}</strong></td>
                      <td>{s.district ?? "—"}</td>
                      <td>{s.province ?? "—"}</td>
                      <td>
                        {s.latitude && s.longitude
                          ? `${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`
                          : <Badge variant="red">Missing</Badge>}
                      </td>
                      <td>
                        <Badge variant={s.coordinate_quality === "validated" ? "green" : "amber"}>
                          {s.coordinate_quality ?? "unconfirmed"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {!sites.length && (
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No sites registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
