"""
price_schemas.py — Pydantic request/response models for /predict-price.
"""
from pydantic import BaseModel, Field


class PricePredictRequest(BaseModel):
    category: str = Field(..., description="Category slug, e.g. 'web-development'")
    location: str = Field("", description="ZIP code or city name for locale adjustment")
    rating: float = Field(4.5, ge=1.0, le=5.0, description="Freelancer's average rating")


class PricePredictResponse(BaseModel):
    minPrice: float
    maxPrice: float
    suggestedPrice: float