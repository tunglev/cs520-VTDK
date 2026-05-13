# ML Service

Python FastAPI microservice providing price prediction, anomaly detection, and service categorization for the marketplace.

## Endpoints

| Method | Path | Class | Purpose |
|---|---|---|---|
| POST | `/predict-price` | `PricePredictor` | Returns a fair price range for a service category, location, and freelancer rating |
| POST | `/detect-anomalies` | `AnomalyDetector` | Flags outlier prices in a dataset using Isolation Forest |
| POST | `/categorize-service` | `ServiceCategorizer` | Validates that a service description matches its selected category |
| POST | `/forecast-demand` | `ForecastingService` | (P2 stub) Demand forecasting using Prophet |

Interactive docs available at `/docs` when running.

## Structure

```
ml-service/
├── app/
│   ├── main.py                  # FastAPI app + router registration
│   ├── models/
│   │   ├── price_predictor.py   # scikit-learn regression
│   │   ├── anomaly_detector.py  # Isolation Forest
│   │   ├── service_categorizer.py  # Hugging Face sentence-transformers
│   │   └── forecasting_service.py  # Prophet (P2 stub)
│   ├── schemas/                 # Pydantic request/response models
│   ├── data/
│   │   ├── db.py                # Supabase read connection
│   │   └── seed_loader.py       # Loads demo pricing data for cold start
│   └── trained_models/          # Serialized .pkl files (gitignored)
├── tests/
├── requirements.txt
├── Dockerfile
└── railway.toml
```

## Prerequisites

- Python 3.11 (specifically 3.11.x — 3.12+ is not compatible with the pinned ML dependencies; use `pyenv install 3.11.9`)
- Docker Desktop (for building the production image)

If you use pyenv, `ml-service/.python-version` pins the correct interpreter automatically.

## Setup

### Local development

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

Copy `.env.example` to `.env` at the repo root and fill in your values. The service loads it automatically on startup — no per-service file needed.

```bash
cp .env.example .env   # repo root — fill in your values
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### Environment variables

All read from the root `.env` file. See `.env.example` for where to find each value.

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Bypasses RLS to read aggregate transaction data across all users — **never expose to the browser** |
| `PORT` | no | Server port; Railway sets this automatically in production, defaults to 8000 locally |

## Training the models

On first run (or when enough new transaction data has accumulated), train and serialize the models:

```bash
python -m app.models.price_predictor --train
python -m app.models.anomaly_detector --train
```

Serialized models are saved to `app/trained_models/` as `.pkl` files. These are gitignored — Railway re-trains on deploy or loads from a mounted volume.

## Cold start

At launch the database has no transaction data. The `seed_loader.py` script populates the database with realistic demo pricing for common service categories (graphic design, web development, landscaping, tutoring, photography) so the Market Comparator works from day one.

```bash
python -m app.data.seed_loader
```

## Deployment (Railway)

The service deploys automatically from the `ml-service/` directory on push to `main`.

Set environment variables in the Railway dashboard under Variables:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Railway detects the `Dockerfile` automatically.

## Testing

Tests use [pytest](https://pytest.org). Unit tests exercise classes directly; integration/API tests use FastAPI's `TestClient` against the full app.

### Run all tests

```bash
cd ml-service
source .venv/bin/activate
python -m pytest tests/ -v
```

### Test files

| File | Type | What is tested |
|---|---|---|
| `tests/test_ml_endpoints.py` | API integration | All three HTTP endpoints (`/predict-price`, `/detect-anomalies`, `/categorize-service`), validation, edge cases, happy paths |
| `tests/test_price_predictor.py` | Unit | `PricePredictor` heuristic fallback, rating multiplier math, price-range invariants, singleton, all 15 known categories |
| `tests/test_anomaly_detector.py` | Unit | `AnomalyDetector.detect` — threshold (< 5 prices), extreme outlier detection, response shape, valid index bounds |
| `tests/test_service_categorizer.py` | Unit | `ServiceCategorizer.categorize` — known matches/mismatches, confidence range, all category display names, unknown-slug humanisation |
| `tests/test_schemas.py` | Unit | Pydantic request/response schemas — required fields, boundary validation, type coercion, default values |
| `tests/test_forecasting.py` | Unit | `ForecastingService` P2 stub contract (`NotImplementedError`), `ForecastDemandRequest`/`PriceTrendRequest` schema defaults |

### Notes

- `test_service_categorizer.py` loads the `all-MiniLM-L6-v2` sentence-transformer (~80 MB) on first run; it is cached automatically for subsequent runs.
- The `PricePredictor` singleton is reset between test classes via an `autouse` fixture to prevent state leakage.
- Integration tests (`test_ml_endpoints.py`) do not require a running database — the predictor falls back to its heuristic when no trained model is present.
