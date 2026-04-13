"""
service_categorizer.py — ServiceCategorizer class + FastAPI router.

Uses a Hugging Face sentence-transformer to embed the service description
and the category name, then computes cosine similarity. A threshold of
0.35 is used to determine a match (tunable).
"""
from fastapi import APIRouter
from sentence_transformers import SentenceTransformer, util

from app.schemas.category_schemas import CategorizationRequest, CategorizationResponse

router = APIRouter(tags=["categories"])

# Readable category names for better embedding quality.
CATEGORY_DISPLAY_NAMES: dict[str, str] = {
    "web-development":   "web development and programming",
    "graphic-design":    "graphic design and visual branding",
    "photography":       "photography and photo editing",
    "video-editing":     "video editing and production",
    "tutoring":          "tutoring and academic help",
    "writing-editing":   "writing, editing, and copywriting",
    "music-audio":       "music production and audio recording",
    "landscaping":       "landscaping and outdoor maintenance",
    "cleaning":          "house cleaning and janitorial services",
    "moving-help":       "moving and heavy lifting help",
    "handyman-services": "handyman repair and home improvement",
    "data-entry":        "data entry and spreadsheet work",
    "social-media":      "social media management and marketing",
    "translation":       "translation and language services",
    "event-planning":    "event planning and coordination",
}

SIMILARITY_THRESHOLD = 0.35


class ServiceCategorizer:
    """
    Lazy-loads the sentence transformer on first use to avoid blocking
    the FastAPI startup event.
    """

    _model: SentenceTransformer | None = None

    def _get_model(self) -> SentenceTransformer:
        if self._model is None:
            # all-MiniLM-L6-v2 is small (80 MB) and fast on CPU.
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._model

    def categorize(self, description: str, claimed_category: str) -> CategorizationResponse:
        model = self._get_model()
        category_text = CATEGORY_DISPLAY_NAMES.get(claimed_category, claimed_category.replace("-", " "))

        desc_emb = model.encode(description, convert_to_tensor=True)
        cat_emb  = model.encode(category_text, convert_to_tensor=True)

        similarity = float(util.cos_sim(desc_emb, cat_emb).item())
        return CategorizationResponse(
            match=similarity >= SIMILARITY_THRESHOLD,
            confidence=round(similarity, 4),
        )


_categorizer = ServiceCategorizer()


@router.post("/categorize-service", response_model=CategorizationResponse)
def categorize_service(req: CategorizationRequest) -> CategorizationResponse:
    return _categorizer.categorize(req.description, req.claimedCategory)


@router.get("/categorize-service/health")
def health() -> dict:
    return {"status": "ok"}