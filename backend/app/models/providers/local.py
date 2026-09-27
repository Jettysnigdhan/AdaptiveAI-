from typing import Optional
from backend.app.models.providers.ollama import OllamaProvider
from backend.app.core.logging import logger


class LocalProvider(OllamaProvider):
    """
    Dedicated model provider for offline / local models (via Ollama or local daemons).
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        timeout_seconds: float = 120.0,
    ):
        super().__init__(base_url=base_url, timeout_seconds=timeout_seconds)
        logger.info(f"Initialized LocalProvider (offline) targeting {self.base_url}")
