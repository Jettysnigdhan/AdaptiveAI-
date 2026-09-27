from typing import Dict, List, Optional
from backend.app.models.base import ModelMetadata, ModelTier, ModelCapability, BaseModelProvider
from backend.app.core.config import Settings, get_settings
from backend.app.core.logging import logger


class ModelRegistry:
    """Central registry managing model tiers, capability metadata, and runtime health."""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self._models: Dict[str, ModelMetadata] = {}
        self._tier_defaults: Dict[ModelTier, str] = {}
        self._initialize_default_registry()

    def _initialize_default_registry(self):
        """Register the default local models for Small, Medium, and Large tiers."""
        # 1. SMALL Tier (Local Ollama)
        small_meta = ModelMetadata(
            model_name=self.settings.model_small,
            tier=ModelTier.SMALL,
            provider="ollama",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.EXTRACTION.value],
            context_length=32768,
            expected_latency_ms=350.0,
            resource_requirements={"ram_mb": 400, "params": "0.5B", "device": "cpu"},
            quality_score_avg=0.76,
            enabled=True,
            description="Ultra-lightweight local model ideal for simple queries, greetings, and basic extraction."
        )
        self.register_model(small_meta, is_tier_default=(self.settings.active_provider in ("ollama", "hybrid")))

        # 2. MEDIUM Tier (Local Ollama)
        medium_meta = ModelMetadata(
            model_name=self.settings.model_medium,
            tier=ModelTier.MEDIUM,
            provider="ollama",
            capabilities=[
                ModelCapability.GENERAL.value,
                ModelCapability.CODE.value,
                ModelCapability.REASONING.value,
                ModelCapability.SUMMARIZATION.value,
            ],
            context_length=32768,
            expected_latency_ms=850.0,
            resource_requirements={"ram_mb": 1100, "params": "1.5B", "device": "cpu"},
            quality_score_avg=0.88,
            enabled=True,
            description="Intermediate local model specialized in code, debugging, and structured reasoning."
        )
        self.register_model(medium_meta, is_tier_default=(self.settings.active_provider in ("ollama", "hybrid")))

        # 3. LARGE Tier (Local Ollama)
        large_meta = ModelMetadata(
            model_name=self.settings.model_large,
            tier=ModelTier.LARGE,
            provider="ollama",
            capabilities=[
                ModelCapability.GENERAL.value,
                ModelCapability.REASONING.value,
                ModelCapability.MATH.value,
                ModelCapability.CREATIVE.value,
                ModelCapability.CODE.value,
            ],
            context_length=32768,
            expected_latency_ms=2500.0,
            resource_requirements={"ram_mb": 5200, "params": "8B", "device": "cpu/ram"},
            quality_score_avg=0.95,
            enabled=True,
            description="High-capacity local 8B reasoning model for multi-step math and deep analysis."
        )
        self.register_model(large_meta, is_tier_default=(self.settings.active_provider == "ollama"))

        # 4. Groq LPU Models (Cloud Zero-Cost / Generous Tier, ultra-fast)
        groq_small = ModelMetadata(
            model_name=self.settings.groq_model_small,
            tier=ModelTier.SMALL,
            provider="groq",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.EXTRACTION.value],
            context_length=8192,
            expected_latency_ms=270.0,
            resource_requirements={"cloud_api": True, "lpu": True},
            quality_score_avg=0.82,
            enabled=bool(self.settings.groq_api_key),
            description="Groq LPU high-speed model for fast factual Q&A (~270ms)."
        )
        self.register_model(groq_small, is_tier_default=(self.settings.active_provider == "groq"))

        groq_medium = ModelMetadata(
            model_name=self.settings.groq_model_medium,
            tier=ModelTier.MEDIUM,
            provider="groq",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.CODE.value, ModelCapability.REASONING.value],
            context_length=32768,
            expected_latency_ms=170.0,
            resource_requirements={"cloud_api": True, "lpu": True},
            quality_score_avg=0.92,
            enabled=bool(self.settings.groq_api_key),
            description="Groq Qwen 27B model on LPU (~170ms latency)."
        )
        self.register_model(groq_medium, is_tier_default=(self.settings.active_provider == "groq"))

        groq_large = ModelMetadata(
            model_name=self.settings.groq_model_large,
            tier=ModelTier.LARGE,
            provider="groq",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.REASONING.value, ModelCapability.MATH.value, ModelCapability.CODE.value],
            context_length=32768,
            expected_latency_ms=860.0,
            resource_requirements={"cloud_api": True, "lpu": True},
            quality_score_avg=0.98,
            enabled=bool(self.settings.groq_api_key),
            description="Groq GPT-OSS 120B Flagship model on LPU (~860ms latency)."
        )
        self.register_model(groq_large, is_tier_default=(self.settings.active_provider in ("groq", "hybrid")))

        # 5. Anthropic Claude Models
        claude_small = ModelMetadata(
            model_name=self.settings.anthropic_model_small,
            tier=ModelTier.SMALL,
            provider="anthropic",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.EXTRACTION.value, ModelCapability.CODE.value],
            context_length=200000,
            expected_latency_ms=220.0,
            resource_requirements={"cloud_api": True, "vendor": "anthropic"},
            quality_score_avg=0.88,
            enabled=bool(self.settings.anthropic_api_key),
            description="Claude 3.5 Haiku: Ultra-fast, highly capable lightweight model for low/medium tasks."
        )
        self.register_model(claude_small, is_tier_default=(self.settings.active_provider == "anthropic"))

        claude_large = ModelMetadata(
            model_name=self.settings.anthropic_model_large,
            tier=ModelTier.LARGE,
            provider="anthropic",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.CODE.value, ModelCapability.REASONING.value, ModelCapability.MATH.value],
            context_length=200000,
            expected_latency_ms=750.0,
            resource_requirements={"cloud_api": True, "vendor": "anthropic"},
            quality_score_avg=0.99,
            enabled=bool(self.settings.anthropic_api_key),
            description="Claude 3.5 Sonnet: State-of-the-art coding and architectural reasoning model."
        )
        self.register_model(claude_large, is_tier_default=(self.settings.active_provider == "anthropic"))

        # 6. OpenAI Models
        openai_small = ModelMetadata(
            model_name=self.settings.openai_model_small,
            tier=ModelTier.SMALL,
            provider="openai",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.CODE.value],
            context_length=128000,
            expected_latency_ms=250.0,
            resource_requirements={"cloud_api": True, "vendor": "openai"},
            quality_score_avg=0.87,
            enabled=bool(self.settings.openai_api_key),
            description="OpenAI GPT-4o-mini: Fast and cost-efficient model for lightweight tasks."
        )
        self.register_model(openai_small, is_tier_default=(self.settings.active_provider == "openai"))

        openai_large = ModelMetadata(
            model_name=self.settings.openai_model_large,
            tier=ModelTier.LARGE,
            provider="openai",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.CODE.value, ModelCapability.REASONING.value, ModelCapability.MATH.value],
            context_length=128000,
            expected_latency_ms=800.0,
            resource_requirements={"cloud_api": True, "vendor": "openai"},
            quality_score_avg=0.98,
            enabled=bool(self.settings.openai_api_key),
            description="OpenAI GPT-4o: High-capacity flagship reasoning and multimodal model."
        )
        # 7. Grok / xAI Models (Primary Cloud Provider)
        grok_small = ModelMetadata(
            model_name=self.settings.effective_grok_small,
            tier=ModelTier.SMALL,
            provider="xai",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.EXTRACTION.value],
            context_length=131072,
            expected_latency_ms=280.0,
            resource_requirements={"cloud_api": True, "vendor": "xai"},
            quality_score_avg=0.86,
            enabled=bool(self.settings.xai_api_key),
            description=f"Grok Small ({self.settings.effective_grok_small}): Fast cloud model for low complexity tasks."
        )
        self.register_model(grok_small, is_tier_default=(self.settings.active_provider == "xai"))

        grok_medium = ModelMetadata(
            model_name=self.settings.effective_grok_medium,
            tier=ModelTier.MEDIUM,
            provider="xai",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.CODE.value],
            context_length=131072,
            expected_latency_ms=350.0,
            resource_requirements={"cloud_api": True, "vendor": "xai"},
            quality_score_avg=0.91,
            enabled=bool(self.settings.xai_api_key),
            description=f"Grok Medium ({self.settings.effective_grok_medium}): Balanced model for code and reasoning."
        )
        self.register_model(grok_medium, is_tier_default=(self.settings.active_provider == "xai"))

        grok_large = ModelMetadata(
            model_name=self.settings.effective_grok_large,
            tier=ModelTier.LARGE,
            provider="xai",
            capabilities=[ModelCapability.GENERAL.value, ModelCapability.CODE.value, ModelCapability.REASONING.value, ModelCapability.MATH.value],
            context_length=131072,
            expected_latency_ms=900.0,
            resource_requirements={"cloud_api": True, "vendor": "xai"},
            quality_score_avg=0.97,
            enabled=bool(self.settings.xai_api_key),
            description=f"Grok Large ({self.settings.effective_grok_large}): Flagship model for complex architecture and deep logic."
        )
        self.register_model(grok_large, is_tier_default=(self.settings.active_provider in ("xai", "hybrid")))

    def register_model(self, metadata: ModelMetadata, is_tier_default: bool = False):
        """Add or update a model in the registry."""
        self._models[metadata.model_name] = metadata
        if is_tier_default or metadata.tier not in self._tier_defaults:
            self._tier_defaults[metadata.tier] = metadata.model_name
        logger.info(f"Registered model: {metadata.model_name} [{metadata.tier.value}]")

    def get_model(self, model_name: str) -> Optional[ModelMetadata]:
        """Fetch model metadata by its exact model name."""
        return self._models.get(model_name)

    def get_default_model_for_tier(self, tier: ModelTier) -> Optional[ModelMetadata]:
        """Return the default active model for a specific tier."""
        model_name = self._tier_defaults.get(tier)
        if model_name and model_name in self._models:
            model = self._models[model_name]
            if model.enabled:
                return model
        # Fallback to any enabled model in that tier
        for m in self._models.values():
            if m.tier == tier and m.enabled:
                return m
        return None

    def list_models(self, only_enabled: bool = False) -> List[ModelMetadata]:
        """List all models registered."""
        if only_enabled:
            return [m for m in self._models.values() if m.enabled]
        return list(self._models.values())

    def list_models_by_tier(self, tier: ModelTier, only_enabled: bool = False) -> List[ModelMetadata]:
        """List models registered for a given tier."""
        models = [m for m in self._models.values() if m.tier == tier]
        if only_enabled:
            models = [m for m in models if m.enabled]
        return models

    def set_enabled(self, model_name: str, enabled: bool) -> bool:
        """Enable or disable a model for routing."""
        if model_name in self._models:
            self._models[model_name].enabled = enabled
            logger.info(f"Model '{model_name}' enabled status set to: {enabled}")
            return True
        return False

    def record_inference_metrics(
        self,
        model_name: str,
        latency_ms: float,
        tokens: int,
        quality_score: Optional[float] = None
    ):
        """Update rolling latency, token counts, and quality metrics."""
        meta = self.get_model(model_name)
        if not meta:
            return

        meta.request_count += 1
        meta.token_usage_total += tokens

        # Exponential moving average for latency
        if meta.measured_latency_ms is None:
            meta.measured_latency_ms = latency_ms
        else:
            meta.measured_latency_ms = round(0.8 * meta.measured_latency_ms + 0.2 * latency_ms, 2)

        if quality_score is not None:
            meta.quality_score_avg = round(0.85 * meta.quality_score_avg + 0.15 * quality_score, 3)

    async def sync_with_provider(self, provider: BaseModelProvider) -> Dict[str, bool]:
        """Verify which registered models are currently installed in the provider."""
        available = await provider.list_available_models()
        # Ollama names can include tags like :latest or :0.5b
        available_normalized = {name.split(":")[0]: name for name in available}
        available_exact = set(available)

        status = {}
        for name, meta in self._models.items():
            base_name = name.split(":")[0]
            is_present = (name in available_exact) or (base_name in available_normalized)
            status[name] = is_present
            if not is_present:
                logger.warning(f"Registered model '{name}' is not currently installed in provider.")
        return status


# Singleton instance
registry = ModelRegistry()
