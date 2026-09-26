import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "AdaptiveRoute"


def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "active_provider" in data


def test_models_catalog_endpoint():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    models = res.json()
    assert isinstance(models, list)
    assert len(models) >= 3


def test_metrics_endpoint():
    res = client.get("/api/v1/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "total_requests" in data
    assert "avg_latency_ms" in data


def test_invalid_chat_empty_prompt():
    res = client.post("/api/v1/chat", json={"prompt": "   "})
    assert res.status_code == 400
    assert "Prompt must not be empty" in res.json()["detail"]
