const configuredBase = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";
const trimmedBase = configuredBase.replace(/\/+$/, "");
const BASE = trimmedBase.endsWith("/api") ? trimmedBase : `${trimmedBase}/api`;
const OPERATOR_KEY_STORAGE = "dengueew_operator_key";
const ACCESS_TOKEN_STORAGE = "dengueew_access_token";
const USER_STORAGE = "dengueew_user";

function getOperatorKey() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(OPERATOR_KEY_STORAGE) ?? "";
}

export function setOperatorKey(value) {
  if (typeof window === "undefined") return;
  const key = String(value ?? "").trim();
  if (key) window.sessionStorage.setItem(OPERATOR_KEY_STORAGE, key);
  else window.sessionStorage.removeItem(OPERATOR_KEY_STORAGE);
}

export function hasOperatorKey() {
  return Boolean(getOperatorKey() || getAccessToken());
}

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE) ?? "";
}

export function getSessionUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.sessionStorage.getItem(USER_STORAGE)); } catch { return null; }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE);
  window.sessionStorage.removeItem(USER_STORAGE);
  window.sessionStorage.removeItem(OPERATOR_KEY_STORAGE);
}

async function req(path, options = {}) {
  const operatorKey = getOperatorKey();
  const accessToken = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(!isFormData ? { "Content-Type": "application/json" } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...(operatorKey ? { "X-Operator-Key": operatorKey } : {}), ...options.headers },
    ...options,
  });
  if (!res.ok) {
    let message = `API ${res.status}: ${path}`;
    try { const body = await res.json(); message = body.detail || message; } catch { /* non-JSON response */ }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  login: async (email, password) => {
    const result = await req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE, result.access_token);
    window.sessionStorage.setItem(USER_STORAGE, JSON.stringify(result.user));
    return result;
  },
  me: () => req("/auth/me"),
  users: () => req("/auth/users"),
  createUser: (body) => req("/auth/users", { method: "POST", body: JSON.stringify(body) }),
  operationalStatus: () => req("/operations/status"),
  operationalDatasets: () => req("/operations/datasets"),
  auditLog: (limit = 200) => req(`/operations/audit?limit=${limit}`),
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
  responseActions: (alertId = "") => req(`/response-actions${alertId ? `?alert_id=${alertId}` : ""}`),
  createResponseAction: (body) => req("/response-actions", { method: "POST", body: JSON.stringify(body) }),
  updateResponseAction: (id, body) => req(`/response-actions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

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
  dengueExecutiveSummary: () => req("/dengue/executive-summary"),
  dengueModelReadiness: () => req("/dengue/model-readiness"),
  dengueMathematicalFramework: () => req("/dengue/mathematical-framework"),
  dengueCommunityReports: () => req("/dengue/community-reports"),
  createDengueCommunityReport: (body) => req("/dengue/community-reports", { method: "POST", body: JSON.stringify(body) }),
  uploadCommunityPhoto: async (file) => { const body = new FormData(); body.append("photo", file); const result = await req("/media/community-photo", { method: "POST", body }); return { ...result, url: `${BASE}/media/${result.asset_id}` }; },
  viewMedia: async (assetId) => {
    const token = getAccessToken(); const operatorKey = getOperatorKey();
    const response = await fetch(`${BASE}/media/${assetId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(operatorKey ? { "X-Operator-Key": operatorKey } : {}) } });
    if (!response.ok) throw new Error("Unable to open protected evidence.");
    const objectUrl = URL.createObjectURL(await response.blob()); window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  },
  updateDengueCommunityReportStatus: (id, status) => req(`/dengue/community-reports/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  dengueAedesSurveillance: () => req("/dengue/aedes-surveillance"),
  dengueAedesSummary: () => req("/dengue/aedes-summary"),
  createDengueAedesSurveillance: (body) => req("/dengue/aedes-surveillance", { method: "POST", body: JSON.stringify(body) }),
  updateDengueAedesStatus: (id, status) => req(`/dengue/aedes-surveillance/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  dengueGenomicSamples: () => req("/dengue/genomic-samples"),
  createDengueGenomicSample: (body) => req("/dengue/genomic-samples", { method: "POST", body: JSON.stringify(body) }),
  dengueGenomicArtifacts: () => req("/dengue/genomic-artifacts"),
  createDengueGenomicArtifact: (body) => req("/dengue/genomic-artifacts", { method: "POST", body: JSON.stringify(body) }),
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
