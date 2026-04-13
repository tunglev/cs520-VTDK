"""
anomaly_schemas.py — Pydantic models for /detect-anomalies.
"""
from typing import List
from pydantic import BaseModel, Field


class AnomalyDetectRequest(BaseModel):
    prices: List[float] = Field(..., min_length=1, description="List of transaction prices to inspect")


class AnomalyDetectResponse(BaseModel):
    outlierIndices: List[int]
    scores: List[float]