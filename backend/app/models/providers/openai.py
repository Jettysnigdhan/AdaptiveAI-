from typing import Optional
from backend.app.models.providers.openai_compatible import OpenAICompatibleProvider
from backend.app.core.logging import logger


class OpenAIProvider(OpenAICompatibleProvider):
    """
    Dedicated model provider for OpenAI API (ChatGPT / GPT-4o).
    Interacts with official OpenAI endpoints at https://api.openai.com/v1.
    """

    def __init__(
        self,
        api_key: Optional[str],
        base_url: str = "https://api.openai.com/v1",
        timeout_seconds: float = 60.0,
    ):
        super().__init__(
            api_key=api_key,
            base_url=base_url,
            timeout_seconds=timeout_seconds,
            provider_name="openai",
        )
        logger.info(f"Initialized OpenAIProvider targeting {self.base_url}")
