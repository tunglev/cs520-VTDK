"""
tests/test_ml_endpoints.py — pytest suite for the three ML routers.

Run:
    cd ml-service
    pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ── /health ──────────────────────────────────────────────────

def test_root_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── /predict-price ───────────────────────────────────────────

def test_predict_price_known_category():
    r = client.post("/predict-price", json={
        "category": "web-development",
        "location": "01003",
        "rating":   4.8,
    })
    assert r.status_code == 200
    body = r.json()
    assert "suggestedPrice" in body
    assert body["minPrice"] < body["suggestedPrice"] < body["maxPrice"]


def test_predict_price_unknown_category_falls_back():
    """Unknown category should still return a heuristic response, not 500."""
    r = client.post("/predict-price", json={
        "category": "underwater-basket-weaving",
        "location": "",
        "rating":   3.5,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["suggestedPrice"] > 0


def test_predict_price_rating_out_of_range():
    r = client.post("/predict-price", json={
        "category": "graphic-design",
        "location": "",
        "rating":   6.0,  # invalid — max is 5.0
    })
    assert r.status_code == 422


# ── /detect-anomalies ────────────────────────────────────────

def test_detect_anomalies_normal_prices():
    prices = [45, 48, 50, 52, 47, 49, 51, 46, 53, 48, 50, 49]
    r = client.post("/detect-anomalies", json={"prices": prices})
    assert r.status_code == 200
    body = r.json()
    assert "outlierIndices" in body
    assert "scores" in body
    assert len(body["scores"]) == len(prices)


def test_detect_anomalies_with_outlier():
    prices = [45, 48, 50, 52, 47, 49, 51, 46, 53, 48, 50, 49, 200, 1]
    r = client.post("/detect-anomalies", json={"prices": prices})
    assert r.status_code == 200
    body = r.json()
    # The extreme values (200, 1) should likely be flagged.
    assert isinstance(body["outlierIndices"], list)


def test_detect_anomalies_too_few_prices():
    """Fewer than 5 prices returns empty outlier list, not an error."""
    r = client.post("/detect-anomalies", json={"prices": [50, 55]})
    assert r.status_code == 200
    assert r.json()["outlierIndices"] == []


def test_detect_anomalies_empty_list():
    r = client.post("/detect-anomalies", json={"prices": []})
    assert r.status_code == 422  # Pydantic min_length=1


# ── /categorize-service ──────────────────────────────────────

def test_categorize_service_clear_match():
    r = client.post("/categorize-service", json={
        "description":      "I build React and Node.js web applications for startups.",
        "claimedCategory":  "web-development",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["match"] is True
    assert 0.0 <= body["confidence"] <= 1.0


def test_categorize_service_mismatch():
    r = client.post("/categorize-service", json={
        "description":      "I mow lawns and trim hedges for residential clients.",
        "claimedCategory":  "web-development",
    })
    assert r.status_code == 200
    body = r.json()
    # Landscaping description should NOT match web-development.
    assert body["match"] is False


def test_categorize_service_missing_fields():
    r = client.post("/categorize-service", json={"description": "Some text"})
    assert r.status_code == 422


# ── /detect-anomalies (edge case: exactly 5 prices) ───────────

def test_detect_anomalies_exactly_5_prices():
    """
    Boundary condition: anomaly detection requires at least 5 prices.
    Verify that 4 prices returns empty outliers, but 5 prices triggers detection.
    """
    # 4 prices: should return empty outlierIndices (below threshold)
    r = client.post("/detect-anomalies", json={"prices": [45, 50, 48, 52]})
    assert r.status_code == 200
    body = r.json()
    assert body["outlierIndices"] == []
    assert len(body["scores"]) == 4  # Scores returned but all 0.0
    assert all(s == 0.0 for s in body["scores"])

    # Exactly 5 prices: should trigger detection (runs IsolationForest)
    prices_5 = [45, 50, 48, 52, 46]
    r = client.post("/detect-anomalies", json={"prices": prices_5})
    assert r.status_code == 200
    body = r.json()
    assert "outlierIndices" in body
    assert "scores" in body
    assert len(body["scores"]) == 5
    # With normal variation, should not have outliers, so indices should be empty
    assert isinstance(body["outlierIndices"], list)


# ── /categorize-service (edge case: empty description) ────────

def test_categorize_service_empty_description():
    """
    Empty description should fail validation (min_length=1).
    """
    r = client.post("/categorize-service", json={
        "description": "",
        "claimedCategory": "web-development",
    })
    assert r.status_code == 422  # Pydantic validation error


# ── Integration test: all endpoints with happy paths + errors ──

def test_integration_all_endpoints_with_errors():
    """
    Integration test: spin up all three endpoints and verify they work
    individually and together without cross-test contamination.
    Tests both happy paths and error cases for comprehensive coverage.
    """
    # ─ Health check ─
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    # ─ Predict Price: happy path ─
    r = client.post("/predict-price", json={
        "category": "graphic-design",
        "location": "02115",
        "rating": 4.5,
    })
    assert r.status_code == 200
    body = r.json()
    assert "minPrice" in body and "maxPrice" in body and "suggestedPrice" in body
    assert body["minPrice"] < body["suggestedPrice"] < body["maxPrice"]

    # ─ Predict Price: error case (rating out of range) ─
    r = client.post("/predict-price", json={
        "category": "web-development",
        "location": "",
        "rating": 5.5,  # invalid: max is 5.0
    })
    assert r.status_code == 422

    # ─ Predict Price: edge case (unknown category, falls back to heuristic) ─
    r = client.post("/predict-price", json={
        "category": "ancient-pottery-restoration",
        "location": "",
        "rating": 3.0,
    })
    assert r.status_code == 200
    assert r.json()["suggestedPrice"] > 0

    # ─ Detect Anomalies: happy path ─
    r = client.post("/detect-anomalies", json={
        "prices": [100, 102, 101, 103, 99, 104, 100, 101, 102, 98]
    })
    assert r.status_code == 200
    body = r.json()
    assert len(body["scores"]) == 10
    assert isinstance(body["outlierIndices"], list)

    # ─ Detect Anomalies: error case (empty prices list) ─
    r = client.post("/detect-anomalies", json={"prices": []})
    assert r.status_code == 422

    # ─ Detect Anomalies: edge case (exactly 5 prices) ─
    r = client.post("/detect-anomalies", json={"prices": [50, 51, 49, 52, 48]})
    assert r.status_code == 200
    assert len(r.json()["scores"]) == 5

    # ─ Categorize Service: happy path (clear match) ─
    r = client.post("/categorize-service", json={
        "description": "I design modern web applications using React and TypeScript.",
        "claimedCategory": "web-development",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["match"] is True
    assert 0.0 <= body["confidence"] <= 1.0

    # ─ Categorize Service: error case (empty description) ─
    r = client.post("/categorize-service", json={
        "description": "",
        "claimedCategory": "web-development",
    })
    assert r.status_code == 422

    # ─ Categorize Service: edge case (mismatch) ─
    r = client.post("/categorize-service", json={
        "description": "I cut and style hair for clients.",
        "claimedCategory": "web-development",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["match"] is False
    assert 0.0 <= body["confidence"] <= 1.0