const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  health: () => req("/health"),
  stats: () => req("/dashboard/stats"),
  readiness: () => req("/dashboard/readiness"),
  climateSummary: () => req("/dashboard/climate-summary"),

  sites: () => req("/sites"),
  site: (id) => req(`/sites/${id}`),

  mosquitoRecords: (limit = 100) => req(`/mosquito/records?limit=${limit}`),
  mosquitoByDistrict: () => req("/mosquito/by-district"),
  mosquitoBySpecies: () => req("/mosquito/by-species"),
  mosquitoByBreedingSite: () => req("/mosquito/by-breeding-site"),

  resistanceRecords: (limit = 100) => req(`/resistance/records?limit=${limit}`),
  resistanceByInsecticide: () => req("/resistance/by-insecticide"),
  resistanceDeathSummary: () => req("/resistance/death-summary"),
  resistanceByDistrict: () => req("/resistance/by-district"),

  alerts: () => req("/alerts"),
  createAlert: (body) => req("/alerts", { method: "POST", body: JSON.stringify(body) }),
  updateAlertStatus: (id, status) =>
    req(`/alerts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  climateDistricts: () => req("/climate/districts"),
  climateDistrict: (d, days = 90) => req(`/climate/district/${d}?days=${days}`),
  climateKigali: (days = 90) => req(`/climate/kigali?days=${days}`),
};
