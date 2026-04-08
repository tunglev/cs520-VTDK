from fastapi import FastAPI
from app.models.price_predictor import router as price_router
from app.models.anomaly_detector import router as anomaly_router
from app.models.service_categorizer import router as category_router

app = FastAPI(title="Freelance Marketplace ML Service")

app.include_router(price_router)
app.include_router(anomaly_router)
app.include_router(category_router)