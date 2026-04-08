from fastapi import APIRouter

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}
