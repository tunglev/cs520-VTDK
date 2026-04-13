"""
anomaly_detector.py — AnomalyDetector class + FastAPI router.

Uses scikit-learn IsolationForest to flag outlier prices in a
list of completed transaction amounts.
"""
import numpy as np
from fastapi import APIRouter
from sklearn.ensemble import IsolationForest

from app.schemas.anomaly_schemas import AnomalyDetectRequest, AnomalyDetectResponse

router = APIRouter(tags=["anomalies"])


class AnomalyDetector:
    """
    Fits a fresh IsolationForest on every request (stateless).
    For large datasets a pre-trained model can be cached similarly
    to PricePredictor.
    """

    def detect(self, prices: list[float]) -> AnomalyDetectResponse:
        if len(prices) < 5:
            # Not enough data to fit the model meaningfully.
            return AnomalyDetectResponse(outlierIndices=[], scores=[0.0] * len(prices))

        X = np.array(prices).reshape(-1, 1)
        clf = IsolationForest(contamination=0.1, random_state=42)
        clf.fit(X)

        preds  = clf.predict(X)           # 1 = inlier, -1 = outlier
        scores = clf.score_samples(X).tolist()
        outlier_indices = [i for i, p in enumerate(preds) if p == -1]

        return AnomalyDetectResponse(outlierIndices=outlier_indices, scores=scores)


_detector = AnomalyDetector()


@router.post("/detect-anomalies", response_model=AnomalyDetectResponse)
def detect_anomalies(req: AnomalyDetectRequest) -> AnomalyDetectResponse:
    return _detector.detect(req.prices)


@router.get("/detect-anomalies/health")
def health() -> dict:
    return {"status": "ok"}