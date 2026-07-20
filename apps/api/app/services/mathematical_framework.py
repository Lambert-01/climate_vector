from __future__ import annotations


def mathematical_framework() -> dict:
    """Return the governed model ladder without implying unavailable validation."""
    return {
        "scientific_lead": {
            "role": "Co-PI",
            "name": "NDACYAYISENGA Lambert",
            "institution": "University of Rwanda",
            "responsibility": "Essential climate variables, mathematical modelling, predictive modelling, uncertainty, validation, and risk forecasting",
        },
        "current_operational_models": [
            {
                "model_id": "aedes-screen-v1",
                "name": "District Aedes climate-screening index",
                "status": "implemented_unvalidated_proxy",
                "output": "District field-review priority",
                "formula": "CSI=0.42*S_T+0.40*S_R+0.18*S_E",
                "claim_boundary": "Climate and evidence suitability only; not dengue incidence or outbreak probability",
            },
            {
                "model_id": "lcsi-v1",
                "name": "Live Climate Suitability Index",
                "status": "implemented_unvalidated_proxy",
                "output": "Near-term habitat follow-up and field-window priority",
                "formula": "LCSI=0.32*S_T+0.22*S_H+0.26*S_R+0.12*S_B+0.08*S_D",
                "claim_boundary": "Weather-based operational screening; not confirmed vector abundance or disease transmission",
            },
            {
                "model_id": "aedes-indices-v1",
                "name": "Effort-standardized Aedes surveillance indices",
                "status": "implemented_waiting_for_pilot_data",
                "output": "Container index, eggs per trap, and adults per 24 trap-hours",
                "formula": "CI=100*positive_containers/inspected_containers",
                "claim_boundary": "Descriptive entomological indices after field and QC validation",
            },
        ],
        "grant_period_models": [
            {
                "stage": 1,
                "name": "Aedes abundance model",
                "family": "Negative-binomial generalized additive mixed model",
                "status": "blocked_pending_prospective_aedes_data",
                "required_outcome": "Effort-standardized eggs, larvae, or adult counts",
            },
            {
                "stage": 2,
                "name": "Climate lag-response model",
                "family": "Distributed lag nonlinear model",
                "status": "blocked_pending_repeated_time_series",
                "required_outcome": "Repeated Aedes abundance and/or governed dengue outcome series",
            },
            {
                "stage": 3,
                "name": "Dengue early-warning model",
                "family": "Bayesian hierarchical spatiotemporal negative-binomial model",
                "status": "blocked_pending_governed_dengue_outcomes",
                "required_outcome": "District-week suspected/confirmed dengue counts with reporting metadata",
            },
            {
                "stage": 4,
                "name": "Machine-learning benchmarks",
                "family": "Regularized baseline, random forest, and gradient boosting",
                "status": "blocked_pending_labelled_training_data",
                "required_outcome": "Time-indexed outbreak labels or dengue counts",
            },
        ],
        "validation": {
            "temporal": "Rolling-origin evaluation",
            "spatial": "Leave-one-district-out evaluation",
            "probabilistic": ["calibration slope", "calibration intercept", "Brier score"],
            "discrimination": ["sensitivity", "specificity", "precision", "recall", "PR-AUC", "ROC-AUC"],
            "operational": ["lead time", "false-alert burden", "verification workload", "action completion time"],
        },
        "governance": "Only models with frozen versions, documented data lineage, out-of-sample validation, calibration review, and public-health approval may produce operational dengue alerts.",
    }
