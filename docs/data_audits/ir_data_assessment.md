# Assessment of New Dataset: IR_data.xls

Date assessed: 2026-07-02  
Raw file location: `data/raw/IR_data.xls`  
Compared with: `data/raw/mosquito_behavior_raw.xls`

## 1. Short Verdict

`IR_data.xls` is a real improvement. It solves **some** important problems, especially for insecticide-resistance analysis, but it does **not** solve all major modelling gaps.

The new file is not a duplicate of the old mosquito spreadsheet. It is larger and contains three sheets:

1. `Sheet1`
2. `selected_variables`
3. `sites`

## 2. What Big Problems It Helps Solve

### A. Species information is now partly available

`Sheet1` adds:

- `Anopheles species`

This is important because the old dataset did not clearly support species-specific analysis.

Observed examples:

- `An.gambiae s.l`
- `An.gambiae ss`
- `An.gambiae, An.ziemani`
- mixed or misspelled species entries

Benefit:

Species information can support descriptive species profiles and, after cleaning, some species-specific summaries.

Remaining issue:

Species names are inconsistent and need cleaning. Some records contain mixed species or spelling variation.

### B. Resistance test information is now available

The `selected_variables` sheet includes:

- `Insecticide Tested+Concentration`
- `conc`
- `# death observed_24h`
- `Mortality_rate`

Observed insecticide test examples:

- `Deltamethrin 0.05%`
- `Permethrin 0.75%`
- `Alphacypermethrin 0.05%`
- `Alphacypermethrin 0.25%`
- `Alphacypermethrin 0.5%`
- `Alphacypermethrin 0.05% + PBO`

Benefit:

This is the first dataset that can support insecticide-resistance descriptive analysis.

Possible analysis:

- Death count by insecticide and district.
- Death count by site.
- Possible mortality rate calculation if denominator is confirmed.
- Comparison of 1X, 5X, 10X, and PBO tests.

Remaining issue:

`Mortality_rate` is blank. The column `# death observed_24h` is present, but the denominator is not explicitly documented. Many values suggest the denominator may be 25 mosquitoes per test replicate, but this must be confirmed by the PI/lab before calculating mortality.

### C. Site-year information is partly available

The `sites` sheet lists sites by year:

- `2021(n=12)`
- `2022(n=27)`
- `2023(n=16)`
- `2024(n=14)`
- `2025(n=15)`

Benefit:

This may help recover which sites were sampled in each year.

Remaining issue:

The main sheets still have blank `Month` and `Year` columns. Site-year lists do not automatically give the year for every row unless each site appears in only one year or the PI confirms how rows map to years.

## 3. What It Still Does Not Solve

| Missing item | Solved by IR_data.xls? | Comment |
|---|---:|---|
| Full sampling date | No | `Date` still appears as day-of-month values only |
| Month | No | Blank in main sheets |
| Year | Partly | Site-year reference exists, but row-level year is still blank |
| GPS coordinates | No | No latitude/longitude found |
| Mosquito abundance counts | No | Death counts are resistance-test deaths, not field abundance |
| Sampling effort for field collection | No | No dips, trap nights, collection effort |
| Positive/negative habitat observations | No | No absence/negative habitat visits |
| Species | Partly yes | `Anopheles species` exists but needs cleaning |
| Resistance outcome | Partly yes | Death observed after 24h exists; mortality rate denominator/protocol needed |
| Malaria outcome data | No | No malaria cases/incidence |
| Alert/action records | No | No response-action workflow data |

## 4. What Models Are Now More Feasible

### Descriptive surveillance analysis

Status: **Ready / improved**

Can now summarize:

- sites;
- districts;
- habitats;
- agricultural insecticide exposure;
- Anopheles species;
- resistance test insecticides;
- 24h death counts.

### Habitat profile analysis

Status: **Partially ready**

Still descriptive only because negative habitat observations are missing.

### Agricultural insecticide-exposure mapping

Status: **Partially ready**

Agricultural insecticide fields remain useful, but pesticide timing, dose, crop, and distance to habitat are still missing.

### Insecticide-resistance descriptive analysis

Status: **Partially ready / newly possible**

This is the biggest improvement.

Possible now:

- summarize deaths after 24h by insecticide tested;
- summarize test type by district and site;
- compare pyrethroid tests and PBO test records;
- calculate mortality rate only after denominator is confirmed.

Not yet safe:

- claiming confirmed resistance without protocol, denominator, control mortality, species cleaning, and interpretation rules.

### Mosquito abundance modelling

Status: **Not ready**

The new death-count variable is not field mosquito abundance.

### Larval presence/absence modelling

Status: **Not ready**

Still no negative habitat observations.

### Malaria early-warning modelling

Status: **Not ready**

Still no malaria outcome data.

## 5. Questions to Ask the PI Immediately

1. Does `# death observed_24h` use 25 mosquitoes as the denominator for every row?
2. Are there control mortality values?
3. Are these WHO susceptibility tests, CDC bottle assays, intensity assays, or another protocol?
4. What does each row represent: one test replicate, one tube, one site-test, or one mosquito group?
5. How should `conc` values like `Delth_1X`, `Acyp_5X`, `Acyp_10X`, and `Acyp_1X+PBO` be interpreted?
6. Can the PI provide month and year for each row?
7. Can the PI provide GPS coordinates for each site?
8. Are species names lab-confirmed, morphologically identified, molecularly identified, or mixed?
9. Are agricultural insecticide records linked to the same sites and dates as resistance tests?
10. Is there a data dictionary or original lab form?

## 6. Updated Scientific Position

Before `IR_data.xls`:

The project had descriptive mosquito ecology and agricultural insecticide exposure data, but no resistance outcome.

After `IR_data.xls`:

The project now has a **partial insecticide-resistance testing dataset** with death counts after 24h and tested insecticide concentrations.

This is a major improvement for the proposal.

However:

The dataset is still not complete enough for validated climate-linked resistance modelling because row-level dates, GPS, denominator/protocol, control mortality, and clean species information are not fully documented.

## 7. Best Way to Use This New Dataset

Use it for:

- resistance-test descriptive summaries;
- insecticide test profile by site/district;
- species distribution summaries after cleaning;
- Nexa justification that the team has early resistance-relevant data;
- designing prospective resistance data collection.

Do not yet use it for:

- final predictive resistance modelling;
- malaria early warning;
- abundance modelling;
- strong operational alert thresholds.

## 8. Updated Verdict

`IR_data.xls` solves one of the biggest earlier weaknesses: it adds resistance-test variables and species information.

It does **not** solve the full modelling problem.

The project is now stronger for a Nexa Proof of Concept, especially if framed as:

> a climate-informed mosquito surveillance and insecticide-resistance monitoring prototype that will clean historical data, add site-level climate/environment covariates, and collect prospective model-ready field and laboratory data.

