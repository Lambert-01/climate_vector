const configuredBase = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";
const trimmedBase = configuredBase.replace(/\/+$/, "");
const BASE = trimmedBase.endsWith("/api") ? trimmedBase : `${trimmedBase}/api`;

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
  missingDataSources: () => req("/readiness/missing-data-sources"),
  climateSummary: () => req("/dashboard/climate-summary"),

  sites: () => req("/sites"),
  siteCoordinateCandidates: () => req("/sites/coordinate-candidates"),
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
  liveWeatherDistricts: (limit = 30) => req(`/live-weather/districts?limit=${limit}`),
  liveWeatherDistrict: (district, days = 7) => req(`/live-weather/district/${district}?days=${days}`),
  liveWeatherSite: (siteId, days = 7) => req(`/live-weather/site/${siteId}?days=${days}`),

  modelingReadiness: () => req("/modeling/readiness"),
  districtRisk: (days = 30) => req(`/modeling/district-risk?days=${days}`),
  districtModel: (district, days = 30) => req(`/modeling/district/${district}?days=${days}`),

  publicDataSources: () => req("/public-data/sources"),
  publicDistrictFeatures: () => req("/public-data/district-features"),
  publicGbif: (limit = 200) => req(`/public-data/gbif?limit=${limit}`),
  publicWorldclim: () => req("/public-data/worldclim"),
  publicEra5: () => req("/public-data/era5"),
  publicValidation: () => req("/public-data/validation"),
  publicFormulationSources: () => req("/public-data/formulation-sources"),
  publicSummary: () => req("/public-data/summary"),
};
