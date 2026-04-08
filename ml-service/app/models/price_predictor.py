from fastapi import APIRouter

router = APIRouter(prefix="/price", tags=["price"])

@router.get("/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}
