"""
forecasting_service.py — ForecastingService (P2 stub).

Demand forecasting and price trend analysis using Facebook Prophet.
Only build this after P0/P1 are stable and real transaction data is flowing.

Endpoints (not registered in main.py until P2 work begins):
    POST /forecast-demand   — forecasts transaction volume for a category
    POST /price-trend       — forecasts price movement over the next N weeks
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["forecasting"])


class ForecastDemandRequest(BaseModel):
    category_id: str
    weeks_ahead: int = 12


class ForecastDemandResponse(BaseModel):
    category_id: str
    forecast: list[dict]  # [{"ds": "2026-05-01", "yhat": 42.3, "yhat_lower": 38.1, "yhat_upper": 46.5}]


class PriceTrendRequest(BaseModel):
    category_id: str
    weeks_ahead: int = 12


class PriceTrendResponse(BaseModel):
    category_id: str
    trend: list[dict]


class ForecastingService:
    """
    P2 stub — raises NotImplementedError until Prophet models are trained.

    To implement:
      1. Pull weekly transaction counts/prices from Supabase grouped by category.
      2. Fit a Prophet model per category.
      3. Serialize with joblib to trained_models/forecast_{category}.pkl.
      4. Serve predictions from the endpoints below.
    """

    def forecast_demand(self, category_id: str, weeks_ahead: int) -> ForecastDemandResponse:
        raise NotImplementedError("ForecastingService is a P2 feature — not yet implemented.")

    def get_price_trend(self, category_id: str, weeks_ahead: int) -> PriceTrendResponse:
        raise NotImplementedError("ForecastingService is a P2 feature — not yet implemented.")


_service = ForecastingService()


@router.post("/forecast-demand", response_model=ForecastDemandResponse)
def forecast_demand(req: ForecastDemandRequest) -> ForecastDemandResponse:
    return _service.forecast_demand(req.category_id, req.weeks_ahead)


@router.post("/price-trend", response_model=PriceTrendResponse)
def price_trend(req: PriceTrendRequest) -> PriceTrendResponse:
    return _service.get_price_trend(req.category_id, req.weeks_ahead)