from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from backend.app.models.registry import ModelRegistry, registry
from backend.app.models.base import ModelMetadata
from backend.app.api.dependencies import get_model_registry

router = APIRouter(tags=["Models"])


@router.get("/models", response_model=List[ModelMetadata])
async def list_models(
    only_enabled: bool = False,
    reg: ModelRegistry = Depends(get_model_registry)
) -> List[ModelMetadata]:
    """Retrieve full catalog of registered models and their telemetry profiles."""
    return reg.list_models(only_enabled=only_enabled)


@router.get("/models/summary")
async def get_models_summary(
    reg: ModelRegistry = Depends(get_model_registry)
) -> Dict[str, Any]:
    """
    Returns an observed summary of all models, explicitly identifying:
    - Smallest (lowest) available model for simple tasks
    - Largest (highest) available model for complex architecture
    - Enabled models spectrum
    """
    from backend.app.router.llm_complexity_evaluator import llm_complexity_evaluator
    from backend.app.core.config import get_settings
    settings = get_settings()

    small_meta, large_meta = llm_complexity_evaluator.get_available_smallest_and_largest()
    enabled_models = reg.list_models(only_enabled=True)

    return {
        "active_provider": settings.active_provider,
        "smallest_model": {
            "model_name": small_meta.model_name if small_meta else settings.model_small,
            "tier": "small",
            "provider": small_meta.provider if small_meta else "default",
            "latency_ms": small_meta.expected_latency_ms if small_meta else 200.0,
        },
        "largest_model": {
            "model_name": large_meta.model_name if large_meta else settings.model_large,
            "tier": "large",
            "provider": large_meta.provider if large_meta else "default",
            "latency_ms": large_meta.expected_latency_ms if large_meta else 850.0,
        },
        "total_models": len(reg.list_models()),
        "enabled_models_count": len(enabled_models),
        "available_models": [
            {
                "model_name": m.model_name,
                "tier": m.tier.value,
                "provider": m.provider,
                "latency_ms": m.expected_latency_ms,
                "description": m.description,
            }
            for m in enabled_models
        ],
    }


@router.post("/models/{model_name}/toggle")
async def toggle_model(
    model_name: str,
    enabled: bool,
    reg: ModelRegistry = Depends(get_model_registry)
) -> Dict[str, Any]:
    """Dynamically enable or disable a model for routing."""
    success = reg.set_enabled(model_name, enabled)
    if not success:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found in registry.")
    return {"model_name": model_name, "enabled": enabled}
