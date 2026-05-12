"""
tests/test_service_categorizer.py — Unit tests for the ServiceCategorizer class.

These tests load the sentence-transformer model on first run (~80 MB download
on a cold machine). Subsequent runs use the cached model.
"""
import pytest
from app.models.service_categorizer import ServiceCategorizer, CATEGORY_DISPLAY_NAMES, SIMILARITY_THRESHOLD


@pytest.fixture(scope="module")
def categorizer():
    """Single categorizer shared across all tests in this module (model load is expensive)."""
    return ServiceCategorizer()


class TestCategorizeKnownMatches:
    def test_web_dev_description_matches_web_development(self, categorizer):
        result = categorizer.categorize(
            "I build React and Node.js web applications for startups.",
            "web-development",
        )
        assert result.match is True
        assert result.confidence >= SIMILARITY_THRESHOLD

    def test_landscaping_description_matches_landscaping(self, categorizer):
        result = categorizer.categorize(
            "I mow lawns, trim hedges, and maintain gardens for homeowners.",
            "landscaping",
        )
        assert result.match is True

    def test_writing_description_matches_writing_editing(self, categorizer):
        result = categorizer.categorize(
            "I write SEO articles, blog posts, and marketing copy.",
            "writing-editing",
        )
        assert result.match is True


class TestCategorizeKnownMismatches:
    def test_landscaping_description_does_not_match_web_development(self, categorizer):
        result = categorizer.categorize(
            "I mow lawns and trim hedges for residential clients.",
            "web-development",
        )
        assert result.match is False

    def test_web_dev_description_does_not_match_cleaning(self, categorizer):
        result = categorizer.categorize(
            "I build React and TypeScript applications for enterprise clients.",
            "cleaning",
        )
        assert result.match is False


class TestConfidenceRange:
    def test_confidence_is_between_0_and_1(self, categorizer):
        result = categorizer.categorize(
            "I take portrait and landscape photographs.",
            "photography",
        )
        assert 0.0 <= result.confidence <= 1.0

    def test_strong_match_has_higher_confidence_than_mismatch(self, categorizer):
        match_result = categorizer.categorize(
            "I design logos and visual brand identities.",
            "graphic-design",
        )
        mismatch_result = categorizer.categorize(
            "I design logos and visual brand identities.",
            "moving-help",
        )
        assert match_result.confidence > mismatch_result.confidence


class TestCategoryDisplayNames:
    def test_all_known_slugs_have_display_names(self):
        expected_slugs = {
            "web-development", "graphic-design", "photography", "video-editing",
            "tutoring", "writing-editing", "music-audio", "landscaping",
            "cleaning", "moving-help", "handyman-services", "data-entry",
            "social-media", "translation", "event-planning",
        }
        assert expected_slugs == set(CATEGORY_DISPLAY_NAMES.keys())

    def test_unknown_category_humanizes_slug(self, categorizer):
        result = categorizer.categorize(
            "I repair and restore vintage furniture.",
            "furniture-restoration",
        )
        # Should not raise; falls back to slug humanization
        assert isinstance(result.match, bool)
        assert 0.0 <= result.confidence <= 1.0
