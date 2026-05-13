.PHONY: help setup install check-env \
        dev dev-frontend dev-ml dev-supabase \
        build build-frontend build-docker \
        test test-frontend test-ml test-supabase \
        lint seed train clean \
        deploy deploy-functions

# ── Default ───────────────────────────────────────────────────────────────────

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ─────────────────────────────────────────────────────────────────────

setup: ## First-time bootstrap: create .env and install all dependencies
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — fill in your values before continuing.")
	$(MAKE) install

install: ## Install dependencies for all services (npm + Python venv)
	cd frontend && npm install
	test -d ml-service/.venv || python3.11 -m venv ml-service/.venv
	. ml-service/.venv/bin/activate && pip install -r ml-service/requirements.txt -r ml-service/requirements-dev.txt

check-env:
	@test -f .env || (echo "Error: .env not found. Run 'make setup' first." && exit 1)

# ── Dev ───────────────────────────────────────────────────────────────────────

dev: ## Print instructions to start all three services (each needs its own terminal)
	@echo ""
	@echo "Open three terminals and run one target per terminal:"
	@echo ""
	@echo "  Terminal 1 (Supabase):  make dev-supabase"
	@echo "  Terminal 2 (ML service): make dev-ml"
	@echo "  Terminal 3 (Frontend):  make dev-frontend"
	@echo ""
	@echo "Frontend will be at http://localhost:3000"
	@echo "ML service will be at  http://localhost:8000"
	@echo "Supabase API will be at http://localhost:54321"
	@echo ""

dev-supabase: check-env ## Start Supabase local stack and serve Edge Functions
	supabase start && supabase db reset && supabase functions serve --env-file=.env

dev-ml: check-env ## Start ML service with hot-reload (port 8000)
	. ml-service/.venv/bin/activate && cd ml-service && uvicorn app.main:app --reload --port 8000

dev-frontend: check-env ## Start frontend dev server (port 3000)
	cd frontend && npm run dev

# ── Build ─────────────────────────────────────────────────────────────────────

build: build-frontend build-docker ## Build all services for production

build-frontend: check-env ## Build frontend for production (output: frontend/dist/)
	cd frontend && npm run build

build-docker: ## Build ML service Docker image (tag: fairlance-ml)
	cd ml-service && docker build -t fairlance-ml .

# ── Test ──────────────────────────────────────────────────────────────────────

test: test-frontend test-ml ## Run frontend and ML tests (for Supabase tests run: make test-supabase)

test-frontend: ## Run frontend tests (Vitest)
	cd frontend && npm test

test-ml: ## Run ML service tests (pytest)
	. ml-service/.venv/bin/activate && cd ml-service && python -m pytest tests/ -v

test-supabase: check-env ## Run Supabase Edge Function tests (requires all 3 services running first)
	deno test supabase/functions/ --allow-net --allow-env --env-file=.env --ignore=supabase/functions/_shared

# ── Utilities ─────────────────────────────────────────────────────────────────

lint: ## Type-check the frontend (tsc --noEmit)
	cd frontend && npm run lint

seed: check-env ## Seed demo pricing data into Supabase
	. ml-service/.venv/bin/activate && cd ml-service && python -m app.data.seed_loader

train: check-env ## Train the price prediction model and save to ml-service/app/trained_models/
	. ml-service/.venv/bin/activate && cd ml-service && python -m app.models.price_predictor --train

clean: ## Remove build artifacts (frontend/dist/)
	cd frontend && npm run clean

# ── Deploy ────────────────────────────────────────────────────────────────────

deploy: deploy-functions ## Push DB migrations and deploy all Edge Functions
	supabase db push
	@echo ""
	@echo "Database migrations pushed."
	@echo "Edge Functions deployed."
	@echo ""
	@echo "Frontend and ML service deploy automatically on push to main:"
	@echo "  Frontend  → Vercel"
	@echo "  ML service → Railway"
	@echo ""

deploy-functions: ## Deploy all Supabase Edge Functions to production
	supabase functions deploy generate-pricing-report
	supabase functions deploy accept-reject-offer
	supabase functions deploy counter-offer
	supabase functions deploy complete-transaction
	supabase functions deploy submit-review
	supabase functions deploy manage-listing
