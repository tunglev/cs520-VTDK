"""
main.py — FastAPI application entry point.

Registers all three ML routers and configures CORS so the React
frontend (Vercel) and Supabase Edge Functions can call the service.
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.price_predictor import router as price_router
from app.models.anomaly_detector import router as anomaly_router
from app.models.service_categorizer import router as category_router

load_dotenv(".env.local")

app = FastAPI(
    title="Fairlance ML Service",
    description=(
        "Price prediction, anomaly detection, and service categorization "
        "for the Fairlance freelance marketplace."
    ),
    version="1.0.0",
)

# Allow the Vercel frontend and Supabase Edge Functions to call this service.
# In production, tighten allowed_origins to your exact domains.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(price_router)
app.include_router(anomaly_router)
app.include_router(category_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "fairlance-ml"}