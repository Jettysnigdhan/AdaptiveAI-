import time
import json
import asyncio
import httpx
from typing import List, Dict, Any, Optional, AsyncGenerator
from backend.app.models.base import (
    BaseModelProvider,
    GenerationRequest,
    GenerationResponse,
    ModelTier,
)
from backend.app.core.logging import logger


class AnthropicProvider(BaseModelProvider):
    """
    Model provider for Anthropic's Claude API (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus).
    Supports direct connections to https://api.anthropic.com/v1/messages.
    """

    def __init__(
        self,
        api_key: Optional[str],
        base_url: str = "https://api.anthropic.com/v1",
        timeout_seconds: float = 60.0,
    ):
        self.api_key = api_key or ""
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Initialize or reuse cached httpx.AsyncClient with Anthropic headers."""
        if self._client is None or self._client.is_closed:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=httpx.Timeout(self.timeout_seconds, connect=10.0),
            )
        return self._client

    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def health_check(self) -> bool:
        """Check API key presence and connectivity."""
        if not self.api_key:
            return False
        return True

    async def list_available_models(self) -> List[str]:
        """Return supported Claude models."""
        return [
            "claude-3-5-haiku-20241022",
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
        ]

    async def generate(self, request: GenerationRequest) -> GenerationResponse:
        """Execute non-streaming completion with Claude."""
        if not self.api_key:
            raise ValueError(
                "Missing Anthropic API Key. Please configure ANTHROPIC_API_KEY in your .env file."
            )

        client = await self._get_client()

        payload: Dict[str, Any] = {
            "model": request.model_name or "claude-3-5-haiku-20241022",
            "max_tokens": request.max_tokens or 1024,
            "temperature": request.temperature,
            "messages": [{"role": "user", "content": request.prompt}],
        }
        payload["system"] = request.system_prompt or "You are AdaptiveRoute AI, a helpful, precise assistant. Always respond in English unless the user explicitly requests another language."

        start_time = time.perf_counter()
        resp = await client.post("/messages", json=payload)
        wall_latency_ms = (time.perf_counter() - start_time) * 1000.0

        if resp.status_code != 200:
            raise RuntimeError(f"Anthropic API error ({resp.status_code}): {resp.text}")

        data = resp.json()
        text_content = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text_content += block.get("text", "")

        usage = data.get("usage", {})
        prompt_tokens = usage.get("input_tokens", 0)
        completion_tokens = usage.get("output_tokens", 0)
        total_tokens = prompt_tokens + completion_tokens

        tier = request.tier or (
            ModelTier.LARGE if "sonnet" in (request.model_name or "").lower() or "opus" in (request.model_name or "").lower()
            else ModelTier.MEDIUM
        )

        tokens_per_sec = (completion_tokens / (wall_latency_ms / 1000.0)) if wall_latency_ms > 0 else 0.0

        return GenerationResponse(
            text=text_content,
            model_name=request.model_name,
            tier=tier,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=round(wall_latency_ms, 2),
            tokens_per_second=round(tokens_per_sec, 1),
            finish_reason=data.get("stop_reason", "stop"),
            raw_metadata={"id": data.get("id"), "model": data.get("model")},
        )

    async def generate_stream(self, request: GenerationRequest) -> AsyncGenerator[str, None]:
        """Stream token chunks asynchronously from Claude."""
        if not self.api_key:
            raise ValueError(
                "Missing Anthropic API Key. Please configure ANTHROPIC_API_KEY in your .env file."
            )

        client = await self._get_client()

        payload: Dict[str, Any] = {
            "model": request.model_name or "claude-3-5-haiku-20241022",
            "max_tokens": request.max_tokens or 1024,
            "temperature": request.temperature,
            "stream": True,
            "messages": [{"role": "user", "content": request.prompt}],
        }
        payload["system"] = request.system_prompt or "You are AdaptiveRoute AI, a helpful, precise assistant. Always respond in English unless the user explicitly requests another language."

        async with client.stream("POST", "/messages", json=payload) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise RuntimeError(f"Anthropic streaming failed ({response.status_code}): {body.decode()}")

            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    raw_data = line[6:].strip()
                    try:
                        event = json.loads(raw_data)
                        ev_type = event.get("type")
                        if ev_type == "content_block_delta":
                            delta = event.get("delta", {})
                            if delta.get("type") == "text_delta":
                                text = delta.get("text", "")
                                if text:
                                    yield text
                    except Exception:
                        continue
