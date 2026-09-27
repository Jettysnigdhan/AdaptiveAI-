from typing import Optional
from backend.app.models.providers.openai_compatible import OpenAICompatibleProvider
from backend.app.core.logging import logger


class GrokProvider(OpenAICompatibleProvider):
    """
    Dedicated model provider for Grok (xAI) API.
    Interacts with xAI's OpenAI-compatible REST API at https://api.x.ai/v1.
    """

    def __init__(
        self,
        api_key: Optional[str],
        base_url: str = "https://api.x.ai/v1",
        timeout_seconds: float = 60.0,
    ):
        super().__init__(
            api_key=api_key,
            base_url=base_url,
            timeout_seconds=timeout_seconds,
            provider_name="xai",
        )
        logger.info(f"Initialized GrokProvider (xAI) targeting {self.base_url}")
