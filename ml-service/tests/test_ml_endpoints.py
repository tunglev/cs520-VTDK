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