from typing import Dict, Optional
from backend.app.core.config import get_settings, Settings
from backend.app.models.base import BaseModelProvider
from backend.app.models.registry import registry
from backend.app.models.providers.ollama import OllamaProvider
from backend.app.models.providers.openai_compatible import OpenAICompatibleProvider
from backend.app.core.logging import logger


class ProviderFactory:
    """Factory creating and caching model providers based on configuration."""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self._providers: Dict[str, BaseModelProvider] = {}

    def get_provider(self, provider_type: str = "groq") -> BaseModelProvider:
        """Get or initialize provider by name ('groq', 'ollama', 'xai')."""
        normalized = provider_type.lower()

        if normalized not in self._providers:
            if normalized in ("xai", "grok"):
                from backend.app.models.providers.grok import GrokProvider
                logger.info(f"Initializing GrokProvider at {self.settings.xai_base_url}")
                self._providers[normalized] = GrokProvider(
                    api_key=self.settings.xai_api_key,
                    base_url=self.settings.xai_base_url,
                    timeout_seconds=60.0,
                )
            elif normalized == "openai":
                from backend.app.models.providers.openai import OpenAIProvider
                logger.info(f"Initializing OpenAIProvider at {self.settings.openai_base_url}")
                self._providers["openai"] = OpenAIProvider(
                    api_key=self.settings.openai_api_key,
                    base_url=self.settings.openai_base_url,
                    timeout_seconds=60.0,
                )
            elif normalized in ("anthropic", "claude"):
                from backend.app.models.providers.anthropic import AnthropicProvider
                logger.info(f"Initializing AnthropicProvider at {self.settings.anthropic_base_url}")
                self._providers[normalized] = AnthropicProvider(
                    api_key=self.settings.anthropic_api_key,
                    base_url=self.settings.anthropic_base_url,
                    timeout_seconds=60.0,
                )
            elif normalized == "groq":
                logger.info(f"Initializing Groq LPU provider at {self.settings.groq_base_url}")
                self._providers["groq"] = OpenAICompatibleProvider(
                    api_key=self.settings.groq_api_key,
                    base_url=self.settings.groq_base_url,
                    timeout_seconds=60.0,
                    provider_name="groq",
                )
            else:
                from backend.app.models.providers.local import LocalProvider
                logger.info(f"Initializing LocalProvider at {self.settings.ollama_base_url}")
                self._providers["ollama"] = LocalProvider(
                    base_url=self.settings.ollama_base_url,
                    timeout_seconds=self.settings.ollama_timeout_seconds,
                )

        return self._providers.get(normalized, self._providers.get("ollama"))

    def get_provider_for_model(self, model_name: str) -> BaseModelProvider:
        """Resolve the appropriate provider for any given model name via the registry."""
        meta = registry.get_model(model_name)
        if meta:
            if meta.provider in ("anthropic", "claude"):
                return self.get_provider("anthropic")
            elif meta.provider == "openai":
                return self.get_provider("openai")
            elif meta.provider == "groq":
                return self.get_provider("groq")
            elif meta.provider in ("xai", "grok"):
                return self.get_provider("xai")
        # Default based on active_provider setting
        return self.get_provider(self.settings.active_provider)


provider_factory = ProviderFactory()
