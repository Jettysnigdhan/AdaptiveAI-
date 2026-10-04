"""Unit tests for semantic cache, normalization, TTL, and safety guards."""

import time
import pytest
from app.cache.semantic_cache import SemanticCache
from app.config import get_settings


@pytest.fixture
def cache():
    """Provides a clean semantic cache instance for testing."""
    c = SemanticCache()
    c.invalidate_cache()
    return c


def test_query_normalization(cache):
    """Verifies lowercase, punctuation removal, and whitespace trimming."""
    raw = "   How do I reset my password???   "
    expected = "how do i reset my password"
    assert cache.normalize_query(raw) == expected

    complex_raw = "What's the TCP/IP congestion-control??"
    clean = cache.normalize_query(complex_raw)
    assert "?" not in clean
    assert "/" not in clean
    assert clean == "whats the tcpip congestioncontrol"


def test_cache_miss_on_empty(cache):
    """Verifies that empty queries return None."""
    assert cache.search_cache("") is None
    assert cache.search_cache("   ") is None


def test_cache_hit_and_miss(cache):
    """Tests successful store, exact hit, semantic hit, and distant miss."""
    query = "How do I reset my password?"
    answer = "Go to Settings > Security > Reset Password."

    stored = cache.store_cache(query, answer)
    assert stored is True

    # 1. Exact query hit
    result = cache.search_cache(query, threshold=0.85)
    assert result is not None
    assert result["answer"] == answer
    assert result["similarity_score"] >= 0.95

    # 2. Semantic paraphrase hit
    paraphrase = "What are the steps for resetting my password?"
    para_result = cache.search_cache(paraphrase, threshold=0.85)
    assert para_result is not None
    assert para_result["answer"] == answer

    # 3. Unrelated query miss
    distant = "What is the capital of France?"
    miss_result = cache.search_cache(distant, threshold=0.85)
    assert miss_result is None


def test_corpus_version_invalidation(cache):
    """Verifies that cache rejects entries with mismatched corpus version."""
    query = "What is the refund policy?"
    answer = "Refunds are processed within 14 days."

    # Store with current version
    cache.store_cache(query, answer)

    # Change current corpus version
    old_version = cache.settings.corpus_version
    cache.settings.corpus_version = "v2_updated"

    try:
        # Search should miss due to version mismatch
        result = cache.search_cache(query, threshold=0.85)
        assert result is None
    finally:
        cache.settings.corpus_version = old_version


def test_ttl_expiration(cache, monkeypatch):
    """Verifies that entries older than cache_ttl_seconds are rejected."""
    query = "What is the server status?"
    answer = "Server is operational."

    cache.store_cache(query, answer)

    # Fast forward time beyond TTL
    current_time = time.time()
    monkeypatch.setattr(time, "time", lambda: current_time + cache.settings.cache_ttl_seconds + 100)

    result = cache.search_cache(query, threshold=0.85)
    assert result is None


def test_cache_safety_rejects_empty_and_error(cache):
    """Verifies that empty answers and error traces are rejected from storage."""
    assert cache.store_cache("valid query", "") is False
    assert cache.store_cache("valid query", "   ") is False
    assert cache.store_cache("valid query", "Error: Connection timed out.") is False
    assert cache.store_cache("valid query", "Traceback (most recent call last):") is False
