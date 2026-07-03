from __future__ import annotations

from dataclasses import dataclass


REQUIRED_TRAINING_FIELDS = {
    "sample_date",
    "latitude",
    "longitude",
    "mosquito_count",
    "sampling_effort",
    "habitat_status",
    "species",
}


@dataclass(frozen=True)
class TrainingReadiness:
    ready: bool
    missing_fields: tuple[str, ...]
    message: str


def evaluate_training_readiness(available_fields: set[str]) -> TrainingReadiness:
    missing = tuple(sorted(REQUIRED_TRAINING_FIELDS - available_fields))
    if missing:
        return TrainingReadiness(
            ready=False,
            missing_fields=missing,
            message="Prediction training is blocked until critical outcome, date, location, and effort fields are available.",
        )
    return TrainingReadiness(
        ready=True,
        missing_fields=(),
        message="Minimum training fields are present; scientific validation is still required before operational use.",
    )
