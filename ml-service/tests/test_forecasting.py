"""
tests/test_forecasting.py — Tests for the ForecastingService stub.

The service is a P2 placeholder that raises NotImplementedError for all
methods. These tests verify the stub contract and the schema shapes so
the interface can be implemented without breaking callsites.
"""
import pytest
from app.models.forecasting_service import (
    ForecastingService,
    ForecastDemandRequest,
    ForecastDemandResponse,
    PriceTrendRequest,
    PriceTrendResponse,
)


@pytest.fixture
def service():
    return ForecastingService()


class TestForecastDemand:
    def test_raises_not_implemented(self, service):
        with pytest.raises(NotImplementedError):
            service.forecast_demand("web-development", weeks_ahead=4)

    def test_error_message_mentions_p2(self, service):
        with pytest.raises(NotImplementedError, match="P2"):
            service.forecast_demand("graphic-design", weeks_ahead=12)


class TestPriceTrend:
    def test_raises_not_implemented(self, service):
        with pytest.raises(NotImplementedError):
            service.get_price_trend("tutoring", weeks_ahead=8)

    def test_error_message_mentions_p2(self, service):
        with pytest.raises(NotImplementedError, match="P2"):
            service.get_price_trend("landscaping", weeks_ahead=12)


class TestRequestResponseSchemas:
    def test_forecast_demand_request_defaults(self):
        req = ForecastDemandRequest(category_id="web-development")
        assert req.weeks_ahead == 12

    def test_forecast_demand_request_custom_weeks(self):
        req = ForecastDemandRequest(category_id="design", weeks_ahead=4)
        assert req.weeks_ahead == 4

    def test_price_trend_request_defaults(self):
        req = PriceTrendRequest(category_id="photography")
        assert req.weeks_ahead == 12

    def test_forecast_demand_response_shape(self):
        resp = ForecastDemandResponse(
            category_id="web-development",
            forecast=[{"ds": "2026-06-01", "yhat": 42.0, "yhat_lower": 38.0, "yhat_upper": 46.0}],
        )
        assert resp.category_id == "web-development"
        assert len(resp.forecast) == 1

    def test_price_trend_response_shape(self):
        resp = PriceTrendResponse(
            category_id="tutoring",
            trend=[{"ds": "2026-06-01", "yhat": 55.0}],
        )
        assert resp.category_id == "tutoring"
        assert len(resp.trend) == 1
