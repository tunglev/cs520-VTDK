"""
category_schemas.py — Pydantic models for /categorize-service.
"""
from pydantic import BaseModel, Field


class CategorizationRequest(BaseModel):
    description: str = Field(..., min_length=1, description="The freelancer's service description text")
    claimedCategory: str = Field(..., description="The category slug the freelancer selected")


class CategorizationResponse(BaseModel):
    match: bool
    confidence: float