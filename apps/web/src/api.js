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
  databaseStatus: () => req("/dashboard/database-status"),
  readiness: () => req("/dashboard/readiness"),
  missingDataSources: () => req("/readiness/missing-data-sources"),
  climateSummary: () => req("/dashboard/climate-summary"),

  sites: () => req("/sites"),
  sentinelRegistry: () => req("/sites/sentinel-registry"),
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
  publicSummary: () => req("/public-data/summary"),

  arboviralOverview: () => req("/arboviral/overview"),
  arboviralClimate: () => req("/arboviral/great-lakes-climate"),
  arboviralVectors: () => req("/arboviral/vector-occurrences"),
  arboviralDiseaseProfiles: () => req("/arboviral/disease-profiles"),
  arboviralReadiness: () => req("/arboviral/readiness"),
  arboviralIntelligence: () => req("/arboviral/intelligence"),
  arboviralScoring: () => req("/arboviral/scoring"),
  arboviralVectorTaxonomy: () => req("/arboviral/vector-taxonomy"),
  arboviralPartnerGovernance: () => req("/arboviral/partner-governance"),

  dengueSubmissionReadiness: () => req("/dengue/submission-readiness"),
  dengueModelReadiness: () => req("/dengue/model-readiness"),
  dengueCommunityReports: () => req("/dengue/community-reports"),
  createDengueCommunityReport: (body) => req("/dengue/community-reports", { method: "POST", body: JSON.stringify(body) }),
  updateDengueCommunityReportStatus: (id, status) => req(`/dengue/community-reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  dengueAedesSurveillance: () => req("/dengue/aedes-surveillance"),
  createDengueAedesSurveillance: (body) => req("/dengue/aedes-surveillance", { method: "POST", body: JSON.stringify(body) }),
  updateDengueAedesStatus: (id, status) => req(`/dengue/aedes-surveillance/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  dengueGenomicSamples: () => req("/dengue/genomic-samples"),
  createDengueGenomicSample: (body) => req("/dengue/genomic-samples", { method: "POST", body: JSON.stringify(body) }),
  dengueModelEvaluations: () => req("/dengue/model-evaluations"),
  createDengueModelEvaluation: (body) => req("/dengue/model-evaluations", { method: "POST", body: JSON.stringify(body) }),
  dengueMelSummary: () => req("/dengue/mel-summary"),
  dengueMelObservations: () => req("/dengue/mel-observations"),
  createDengueMelObservation: (body) => req("/dengue/mel-observations", { method: "POST", body: JSON.stringify(body) }),

  sourceRegistry: () => req("/source-registry"),
  sourceRegistryDetail: (id) => req(`/source-registry/${id}`),
  validationEngine: () => req("/validation-engine"),

  fieldVerifications: () => req("/field-verifications"),
  createFieldVerification: (body) => req("/field-verifications", { method: "POST", body: JSON.stringify(body) }),
  updateFieldVerification: (id, body) =>
    req(`/field-verifications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  fieldVerificationChecklistTemplates: () => req("/field-verifications/checklist/templates"),
};
