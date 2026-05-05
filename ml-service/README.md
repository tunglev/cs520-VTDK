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

```bash
python -m pytest tests/ -v
```
