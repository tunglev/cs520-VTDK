from fastapi import APIRouter

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

@router.get("/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}
