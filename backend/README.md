# AdaptiveRoute Backend

FastAPI gateway and ML routing engine for AdaptiveRoute.

## Structure
- `app/core/`: Configuration via Pydantic settings and structured logging.
- `app/models/`: Model provider abstraction, Ollama integration, and registry.
- `app/analyzer/`: Semantic embedding and prompt feature extraction.
- `app/router/`: ML routing models and escalation policies.
- `app/evaluator/`: Quality and confidence evaluators.
- `app/api/`: REST endpoints for chat, models, metrics, and health.

## Running Tests
To verify local model inference:
```bash
python ../scripts/development/test_local_inference.py
```
