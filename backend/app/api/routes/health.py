from fastapi import APIRouter, Depends
from typing import Dict, Any
from backend.app.core.config import get_settings, Settings
from backend.app.models.registry import ModelRegistry, registry
from backend.app.models.factory import provider_factory

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(settings: Settings = Depends(get_settings)) -> Dict[str, Any]:
    """Check gateway operational status and active provider connectivity."""
    provider = provider_factory.get_provider(settings.active_provider)
    is_healthy = await provider.health_check()

    return {
        "status": "healthy" if is_healthy else "degraded",
        "app_name": settings.app_name,
        "environment": settings.environment,
        "active_provider": settings.active_provider,
        "provider_healthy": is_healthy,
        "models_registered": len(registry.list_models()),
        "quality_threshold": settings.quality_threshold,
    }
