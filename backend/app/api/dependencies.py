from backend.app.core.config import get_settings, Settings
from backend.app.services.inference_service import inference_service, InferenceService
from backend.app.services.benchmark_service import benchmark_service, BenchmarkService
from backend.app.models.registry import registry, ModelRegistry


def get_inference_service() -> InferenceService:
    return inference_service


def get_benchmark_service() -> BenchmarkService:
    return benchmark_service


def get_model_registry() -> ModelRegistry:
    return registry


def get_app_settings() -> Settings:
    return get_settings()
