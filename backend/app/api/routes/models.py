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
