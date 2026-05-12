"""
tests/test_price_predictor.py — Unit tests for the PricePredictor class.

These tests exercise the class directly (bypassing HTTP) so they run fast
without spinning up the full FastAPI server.
"""
import pytest
from app.models.price_predictor import PricePredictor


@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset the singleton before each test so state doesn't bleed across tests."""
    PricePredictor._instance = None
    yield
    PricePredictor._instance = None


class TestHeuristic:
    """Tests for the no-model heuristic fallback."""

    def test_known_category_returns_positive_prices(self):
        p = PricePredictor()
        r = p._heuristic("web-development", 4.5)
        assert r.suggestedPrice > 0
        assert r.minPrice > 0
        assert r.maxPrice > 0

    def test_price_range_ordering(self):
        p = PricePredictor()
        r = p._heuristic("graphic-design", 4.0)
        assert r.minPrice < r.suggestedPrice < r.maxPrice

    def test_unknown_category_falls_back_to_base_50(self):
        p = PricePredictor()
        r = p._heuristic("underwater-basket-weaving", 4.5)
        # base = 50, rating 4.5 multiplier ≈ 0.8 + (3.5/4)*0.5 = 1.2375
        expected = round(50 * (0.8 + (4.5 - 1) / 4 * 0.5), 2)
        assert r.suggestedPrice == pytest.approx(expected, abs=0.01)

    def test_minimum_rating_applies_lowest_multiplier(self):
        p = PricePredictor()
        # rating=1.0 → multiplier = 0.8 + 0/4 * 0.5 = 0.8
        r_min = p._heuristic("cleaning", 1.0)
        r_max = p._heuristic("cleaning", 5.0)
        assert r_min.suggestedPrice < r_max.suggestedPrice

    def test_maximum_rating_applies_highest_multiplier(self):
        p = PricePredictor()
        r = p._heuristic("tutoring", 5.0)
        # multiplier = 0.8 + (4.0/4)*0.5 = 1.3, base = 40
        expected = round(40 * 1.3, 2)
        assert r.suggestedPrice == pytest.approx(expected, abs=0.01)

    def test_min_price_is_75_percent_of_suggested(self):
        p = PricePredictor()
        r = p._heuristic("photography", 4.0)
        assert r.minPrice == pytest.approx(r.suggestedPrice * 0.75, abs=0.01)

    def test_max_price_is_135_percent_of_suggested(self):
        p = PricePredictor()
        r = p._heuristic("photography", 4.0)
        assert r.maxPrice == pytest.approx(r.suggestedPrice * 1.35, abs=0.01)

    @pytest.mark.parametrize("category", [
        "web-development", "graphic-design", "photography", "video-editing",
        "tutoring", "writing-editing", "music-audio", "landscaping",
        "cleaning", "moving-help", "handyman-services", "data-entry",
        "social-media", "translation", "event-planning",
    ])
    def test_all_known_categories_return_valid_prices(self, category: str):
        p = PricePredictor()
        r = p._heuristic(category, 4.0)
        assert r.minPrice < r.suggestedPrice < r.maxPrice


class TestPredict:
    """Tests for the public predict() method which falls back to heuristic when no model is trained."""

    def test_predict_without_model_uses_heuristic(self):
        p = PricePredictor()
        assert p.model is None
        r = p.predict("web-development", "01003", 4.5)
        assert r.suggestedPrice > 0
        assert r.minPrice < r.suggestedPrice < r.maxPrice

    def test_predict_unknown_category_returns_fallback_price(self):
        p = PricePredictor()
        r = p.predict("nonexistent-category", "", 3.0)
        assert r.suggestedPrice > 0

    def test_predict_returns_price_predict_response_shape(self):
        from app.schemas.price_schemas import PricePredictResponse
        p = PricePredictor()
        r = p.predict("tutoring", "02116", 4.2)
        assert isinstance(r, PricePredictResponse)
        assert hasattr(r, "minPrice")
        assert hasattr(r, "maxPrice")
        assert hasattr(r, "suggestedPrice")


class TestSingleton:
    def test_get_returns_same_instance(self):
        a = PricePredictor.get()
        b = PricePredictor.get()
        assert a is b

    def test_get_creates_instance_on_first_call(self):
        assert PricePredictor._instance is None
        instance = PricePredictor.get()
        assert instance is not None
        assert PricePredictor._instance is instance
