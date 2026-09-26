# AdaptiveRoute REST API Specification

Base URL: `http://localhost:8000/api/v1`

---

## 1. Chat Completion Gateway

### `POST /api/v1/chat`
Routes prompt, generates response, performs quality evaluation, and cascades if necessary.

**Request Body**:
```json
{
  "prompt": "Explain quicksort in Python with an example",
  "temperature": 0.7,
  "max_tokens": 1024,
  "force_tier": null,
  "force_policy": null
}
```

**Response**:
```json
{
  "request_id": "e243d8cf",
  "response": "Quicksort is a divide-and-conquer sorting algorithm...",
  "selected_model": "qwen/qwen3.8-27b",
  "tier": "medium",
  "initial_model": "qwen/qwen3.8-27b",
  "final_model": "qwen/qwen3.8-27b",
  "quality_score": 0.88,
  "confidence": 0.92,
  "latency_ms": 173.3,
  "escalated": false,
  "escalation_count": 0,
  "explanation": "Router selected Medium tier because task complexity requires code capabilities.",
  "prompt_tokens": 33,
  "completion_tokens": 85,
  "total_tokens": 118,
  "category": "coding",
  "predicted_qualities": {
    "small": 0.65,
    "medium": 0.88,
    "large": 0.96
  },
  "routing_path": ["qwen/qwen3.8-27b"]
}
```

---

### `POST /api/v1/chat/stream`
Server-Sent Events (SSE) streaming tokens in real-time.

**Stream Events**:
- `data: {"type": "meta", "selected_model": "...", "tier": "...", "explanation": "..."}`
- `data: {"type": "token", "content": "Hello"}`
- `data: {"type": "done"}`

---

## 2. Model Registry

### `GET /api/v1/models`
Returns list of all models registered across tiers, capabilities, expected/measured latency, and active state.

### `POST /api/v1/models/{model_name}/toggle?enabled=true`
Dynamically enables or disables a model for routing.

---

## 3. Telemetry & Metrics

### `GET /api/v1/metrics`
Returns aggregate statistics:
```json
{
  "total_requests": 42,
  "avg_latency_ms": 210.5,
  "avg_quality_score": 0.892,
  "escalation_rate": 4.8,
  "total_tokens": 8420,
  "model_distribution": {
    "small": 24,
    "medium": 14,
    "large": 4
  }
}
```

### `GET /api/v1/metrics/inferences?limit=50`
Returns recent SQLite inference log audit entries.

### `GET /api/v1/routing/{request_id}`
Returns granular trace for an individual request.

### `POST /api/v1/benchmark/run`
Runs empirical benchmark comparison across all 5 policies and returns comparative metrics.

---

## 4. Health Check

### `GET /api/v1/health`
Returns gateway operational status and active model provider connectivity.
