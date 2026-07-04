# Assessment Of Suggested Open-Data Download Guidance

This note evaluates the external guidance that suggests downloading CHIRPS, ERA5-Land, ESA WorldCover, JRC Global Surface Water, SRTM, Rwanda administrative boundaries, WorldPop, and WHO malaria/resistance context data.

## Bottom Line

The guidance is useful and should be implemented, but it will not recover the most important missing PI/field/lab outcome variables.

It can strengthen:

- rainfall and climate covariates,
- hydrology and surface-water context,
- land-cover and agricultural context,
- elevation and slope,
- population-at-risk context,
- district and national mapping,
- external health/resistance background indicators.

It cannot replace:

- exact mosquito sample dates,
- official sentinel-site GPS,
- mosquito counts,
- sampling effort,
- habitat positive/negative status,
- resistance denominator,
- control mortality,
- assay protocol,
- lab-confirmed species.

Therefore, these downloads are valuable for the Climate-Vector Intelligence Prototype, but the proof-of-concept proposal must still include a field/lab validation and data-rescue work package.

## Source-By-Source Assessment

| Source | Should We Use It? | What It Solves | What It Does Not Solve | Priority |
|---|---|---|---|---|
| CHIRPS Africa daily rainfall | Yes | Better rainfall history and anomalies than district centroid NASA POWER alone | Does not recover sample dates or mosquito outcomes | Very high |
| ERA5-Land | Yes, but start small | Temperature, rainfall, soil moisture, evaporation context | Large files; does not replace field observations | High |
| ESA WorldCover | Already partly available; continue | Cropland, built-up, water, vegetation context | Does not give pesticide use intensity | High |
| JRC Global Surface Water | Yes | Permanent/seasonal water occurrence, useful for habitat context | Does not confirm larval habitat positive/negative status | High |
| SRTM DEM/slope | Yes | Elevation and slope covariates | Does not replace GPS or counts | Medium-high |
| Rwanda administrative boundaries | Already available; maintain official version | Maps and district/province aggregation | Does not provide site coordinates | Required |
| WorldPop Rwanda population | Already partly available; continue | Population-at-risk context | Does not provide malaria cases | Medium |
| WHO / malaria / resistance context | Yes if current downloadable data are identified | National/district health context and external resistance context | Does not replace project-specific lab assay rows | Medium |

## Recommended Implementation Order

1. Keep existing NASA POWER district data as the operational baseline.
2. Add CHIRPS rainfall for Rwanda as the next rainfall upgrade.
3. Add JRC Global Surface Water and SRTM/elevation features.
4. Extract features from existing ESA WorldCover and WorldPop rasters.
5. Add ERA5-Land only for selected years or monthly/daily summaries to avoid large files.
6. Add WHO/health context as background indicators only.
7. Build feature tables by district first, then by site after official GPS is confirmed.

## How To Use In Proposal

Recommended wording:

> Public climate and environmental datasets will provide the exposure and suitability covariates for the proof-of-concept model. However, field and laboratory outcome variables such as exact collection dates, mosquito abundance, sampling effort, and resistance assay validity will be obtained through retrospective data rescue and prospective pilot surveillance.

This framing is scientifically honest and funder-friendly.

