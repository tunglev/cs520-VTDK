"""
tests/test_schemas.py — Unit tests for Pydantic request/response schemas.

Validates field constraints without hitting the HTTP layer.
"""
import pytest
from pydantic import ValidationError

from app.schemas.price_schemas import PricePredictRequest, PricePredictResponse
from app.schemas.anomaly_schemas import AnomalyDetectRequest, AnomalyDetectResponse
from app.schemas.category_schemas import CategorizationRequest, CategorizationResponse


class TestPricePredictRequest:
    def test_valid_request_parses_correctly(self):
        req = PricePredictRequest(category="web-development", location="01003", rating=4.5)
        assert req.category == "web-development"
        assert req.rating == 4.5

    def test_default_rating_is_4_5(self):
        req = PricePredictRequest(category="tutoring", location="")
        assert req.rating == pytest.approx(4.5)

    def test_default_location_is_empty_string(self):
        req = PricePredictRequest(category="design")
        assert req.location == ""

    def test_rating_below_1_raises_validation_error(self):
        with pytest.raises(ValidationError):
            PricePredictRequest(category="design", rating=0.9)

    def test_rating_above_5_raises_validation_error(self):
        with pytest.raises(ValidationError):
            PricePredictRequest(category="design", rating=5.1)

    def test_rating_at_boundary_1_is_valid(self):
        req = PricePredictRequest(category="design", rating=1.0)
        assert req.rating == 1.0

    def test_rating_at_boundary_5_is_valid(self):
        req = PricePredictRequest(category="design", rating=5.0)
        assert req.rating == 5.0

    def test_missing_category_raises_validation_error(self):
        with pytest.raises(ValidationError):
            PricePredictRequest()  # type: ignore[call-arg]


class TestAnomalyDetectRequest:
    def test_valid_request_parses_correctly(self):
        req = AnomalyDetectRequest(prices=[50.0, 55.0, 48.0])
        assert req.prices == [50.0, 55.0, 48.0]

    def test_empty_prices_list_raises_validation_error(self):
        with pytest.raises(ValidationError):
            AnomalyDetectRequest(prices=[])

    def test_single_price_is_valid(self):
        req = AnomalyDetectRequest(prices=[100.0])
        assert len(req.prices) == 1

    def test_missing_prices_field_raises_validation_error(self):
        with pytest.raises(ValidationError):
            AnomalyDetectRequest()  # type: ignore[call-arg]

    def test_integer_prices_are_accepted(self):
        req = AnomalyDetectRequest(prices=[10, 20, 30])
        assert req.prices == [10.0, 20.0, 30.0]


class TestCategorizationRequest:
    def test_valid_request_parses_correctly(self):
        req = CategorizationRequest(
            description="I build React applications.",
            claimedCategory="web-development",
        )
        assert req.claimedCategory == "web-development"

    def test_empty_description_raises_validation_error(self):
        with pytest.raises(ValidationError):
            CategorizationRequest(description="", claimedCategory="design")

    def test_missing_claimed_category_raises_validation_error(self):
        with pytest.raises(ValidationError):
            CategorizationRequest(description="Some text")  # type: ignore[call-arg]

    def test_missing_description_raises_validation_error(self):
        with pytest.raises(ValidationError):
            CategorizationRequest(claimedCategory="design")  # type: ignore[call-arg]


class TestResponseSchemas:
    def test_price_predict_response(self):
        r = PricePredictResponse(minPrice=40.0, suggestedPrice=55.0, maxPrice=75.0)
        assert r.minPrice == 40.0

    def test_anomaly_detect_response(self):
        r = AnomalyDetectResponse(outlierIndices=[2, 5], scores=[-0.1, -0.2, 0.5, -0.3, -0.1, 0.6])
        assert r.outlierIndices == [2, 5]

    def test_categorization_response(self):
        r = CategorizationResponse(match=True, confidence=0.82)
        assert r.match is True
        assert r.confidence == pytest.approx(0.82)
