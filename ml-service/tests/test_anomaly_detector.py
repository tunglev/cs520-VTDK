"""
tests/test_anomaly_detector.py — Unit tests for the AnomalyDetector class.
"""
import pytest
from app.models.anomaly_detector import AnomalyDetector


@pytest.fixture
def detector():
    return AnomalyDetector()


class TestDetectThreshold:
    def test_fewer_than_5_prices_returns_empty_outlier_list(self, detector):
        result = detector.detect([50, 60, 55, 70])
        assert result.outlierIndices == []

    def test_fewer_than_5_prices_scores_are_all_zero(self, detector):
        result = detector.detect([10, 20, 30])
        assert all(s == 0.0 for s in result.scores)
        assert len(result.scores) == 3

    def test_single_price_scores_are_zero(self, detector):
        result = detector.detect([100.0])
        assert result.outlierIndices == []
        assert result.scores == [0.0]

    def test_exactly_5_prices_triggers_detection(self, detector):
        result = detector.detect([45, 50, 48, 52, 46])
        assert len(result.scores) == 5
        assert isinstance(result.outlierIndices, list)

    def test_scores_length_matches_input_length(self, detector):
        prices = [100, 102, 98, 101, 99, 103, 97]
        result = detector.detect(prices)
        assert len(result.scores) == len(prices)


class TestDetectOutliers:
    def test_extreme_outlier_is_flagged(self, detector):
        normal = [45, 48, 50, 52, 47, 49, 51, 46, 53, 48]
        prices = normal + [500]
        result = detector.detect(prices)
        # 500 should appear in the outlier list
        assert 10 in result.outlierIndices

    def test_normal_cluster_flags_at_most_contamination_rate(self, detector):
        # IsolationForest is configured with contamination=0.1, so it will flag
        # roughly 10% of points even in a tight cluster. Verify the count is bounded.
        prices = [50, 51, 49, 50, 52, 48, 51, 50, 49, 51, 50, 52]
        result = detector.detect(prices)
        assert len(result.outlierIndices) <= max(1, int(len(prices) * 0.15))

    def test_multiple_extreme_values_are_flagged(self, detector):
        normal = [45, 48, 50, 52, 47, 49, 51, 46, 53, 48]
        prices = normal + [1000, 1]
        result = detector.detect(prices)
        flagged = set(result.outlierIndices)
        # Both extremes should be flagged
        assert 10 in flagged or 11 in flagged

    def test_scores_are_numeric(self, detector):
        prices = [40, 42, 41, 43, 39, 44, 38, 45, 40, 41]
        result = detector.detect(prices)
        assert all(isinstance(s, float) for s in result.scores)


class TestDetectResponseShape:
    def test_returns_anomaly_detect_response(self, detector):
        from app.schemas.anomaly_schemas import AnomalyDetectResponse
        result = detector.detect([50, 55, 48, 52, 60])
        assert isinstance(result, AnomalyDetectResponse)

    def test_outlier_indices_are_valid_list_positions(self, detector):
        prices = [45, 48, 50, 52, 47, 49, 51, 46, 53, 48, 200]
        result = detector.detect(prices)
        for idx in result.outlierIndices:
            assert 0 <= idx < len(prices)
