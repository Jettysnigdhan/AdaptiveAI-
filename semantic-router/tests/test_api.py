"""Integration tests for FastAPI endpoints, cache hit workflows, and SQLite telemetry."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.cache.semantic_cache import semantic_cache
from app.database.logger import db_logger


@pytest.fixture(autouse=True)
def clean_environment():
    """Clears cache and database before each test run."""
    semantic_cache.invalidate_cache()
    db_logger.clear_logs()
    yield
    semantic_cache.invalidate_cache()
    db_logger.clear_logs()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    """Verifies GET /health status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_provider" in data
    assert "qdrant_status" in data


def test_answer_endpoint_and_semantic_cache_hit(client):
    """Tests POST /answer initial generation followed by semantic cache hit."""
    query = "How do I reset my password?"

    # 1. Initial request (Cache Miss)
    resp1 = client.post("/answer", json={"query": query})
    assert resp1.status_code == 200
    data1 = resp1.json()

    assert data1["cache_hit"] is False
    assert data1["answer"] != ""
    assert data1["cost"] >= 0.0
    assert data1["latency_ms"] > 0.0
    assert data1["route"] in ("simple", "complex", "large", "escalated")

    # 2. Repeated exact query (Should Hit Cache -> $0.0 cost)
    resp2 = client.post("/answer", json={"query": query})
    assert resp2.status_code == 200
    data2 = resp2.json()

    assert data2["cache_hit"] is True
    assert data2["cost"] == 0.0
    assert data2["route"] == "cache"
    assert data2["model"] == "cache"
    assert data2["answer"] == data1["answer"]

    # 3. Paraphrased query (Cosine similarity ~0.929 > 0.90 -> Hits Cache)
    paraphrase = "What are the steps for resetting my password?"
    resp3 = client.post("/answer", json={"query": paraphrase})
    assert resp3.status_code == 200
    data3 = resp3.json()
    assert data3["cache_hit"] is True
    assert data3["cost"] == 0.0


def test_empty_query_validation(client):
    """Tests that empty queries return 400 or 422 validation errors."""
    resp = client.post("/answer", json={"query": ""})
    assert resp.status_code in (400, 422)

    resp2 = client.post("/answer", json={"query": "   "})
    assert resp2.status_code in (400, 422)


def test_telemetry_and_cache_stats(client):
    """Verifies /stats, /cache/stats, and /requests endpoints."""
    # Send a query to generate data
    client.post("/answer", json={"query": "Explain quicksort algorithm"})

    # Check /stats
    stats_resp = client.get("/stats")
    assert stats_resp.status_code == 200
    s_data = stats_resp.json()
    assert s_data["total_requests"] >= 1

    # Check /cache/stats
    c_resp = client.get("/cache/stats")
    assert c_resp.status_code == 200
    c_data = c_resp.json()
    assert "total_entries" in c_data
    assert "similarity_threshold" in c_data

    # Check /requests
    reqs_resp = client.get("/requests?limit=10")
    assert reqs_resp.status_code == 200
    r_data = reqs_resp.json()
    assert len(r_data) >= 1
    assert r_data[0]["query"] == "Explain quicksort algorithm"


def test_threshold_evaluation_endpoint(client):
    """Verifies GET /evaluation returns real precision/recall table."""
    resp = client.get("/evaluation")
    assert resp.status_code == 200
    data = resp.json()
    assert "threshold_metrics" in data
    assert len(data["threshold_metrics"]) > 0
    # Check that threshold metrics contain expected keys
    first = data["threshold_metrics"][0]
    assert "threshold" in first
    assert "precision" in first
    assert "recall" in first
    assert "false_hit_rate" in first
