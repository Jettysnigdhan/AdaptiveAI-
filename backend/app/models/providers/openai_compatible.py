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


class OpenAICompatibleProvider(BaseModelProvider):
    """
    Model provider for OpenAI-compatible REST APIs.
    Supports Grok (xAI at https://api.x.ai/v1), Groq, OpenAI, Together, and self-hosted vLLM/Ollama OpenAI endpoints.
    """

    def __init__(
        self,
        api_key: Optional[str],
        base_url: str = "https://api.x.ai/v1",
        timeout_seconds: float = 60.0,
        provider_name: str = "xai",
    ):
        self.api_key = api_key or ""
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.provider_name = provider_name
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Initialize and cache the async HTTP client with authorization headers."""
        if self._client is None or self._client.is_closed:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=httpx.Timeout(self.timeout_seconds, connect=10.0),
            )
        return self._client

    async def close(self):
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def health_check(self) -> bool:
        """Check API connectivity and authorization."""
        if not self.api_key:
            logger.warning(f"No API key provided for {self.provider_name} provider.")
            return False
        try:
            client = await self._get_client()
            resp = await client.get("/models", timeout=8.0)
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"{self.provider_name} health check failed at {self.base_url}: {e}")
            return False

    async def list_available_models(self) -> List[str]:
        """Fetch list of available models from the OpenAI-compatible /models endpoint."""
        if not self.api_key:
            return []
        try:
            client = await self._get_client()
            resp = await client.get("/models")
            resp.raise_for_status()
            data = resp.json()
            models = [m.get("id") for m in data.get("data", []) if m.get("id")]
            return models
        except Exception as e:
            logger.error(f"Failed to query {self.provider_name} models: {e}")
            return []

    async def generate(self, request: GenerationRequest) -> GenerationResponse:
        """Execute chat completion via /chat/completions."""
        if not self.api_key:
            raise ValueError(
                f"Cannot execute request with {self.provider_name} provider: "
                f"Missing API key. Please configure XAI_API_KEY in your .env file."
            )
        if not request.model_name:
            raise ValueError("GenerationRequest must contain a valid model_name.")

        client = await self._get_client()

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        else:
            messages.append({"role": "system", "content": "You are AdaptiveRoute AI, a helpful, precise assistant. Always respond in English unless the user explicitly requests another language."})
        messages.append({"role": "user", "content": request.prompt})

        payload: Dict[str, Any] = {
            "model": request.model_name,
            "messages": messages,
            "temperature": request.temperature,
            "stream": False,
        }
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        start_time = time.perf_counter()
        max_retries = 3
        resp = None

        try:
            for attempt in range(max_retries):
                resp = await client.post("/chat/completions", json=payload)
                if resp.status_code == 429 and attempt < max_retries - 1:
                    wait_time = float(resp.headers.get("retry-after", 1.0 * (attempt + 1)))
                    logger.warning(
                        f"Rate limited (429) by {self.provider_name} for model '{request.model_name}'. "
                        f"Retrying in {wait_time:.1f}s (attempt {attempt+1}/{max_retries})..."
                    )
                    await asyncio.sleep(min(wait_time, 4.0))
                    continue
                break

            wall_latency_ms = (time.perf_counter() - start_time) * 1000.0

            if resp.status_code == 401:
                raise PermissionError(
                    f"Invalid {self.provider_name} API key. Please check your credentials in .env."
                )
            if resp.status_code == 404:
                raise RuntimeError(
                    f"Model '{request.model_name}' was not found on {self.provider_name} API."
                )
            if resp.status_code != 200:
                try:
                    err_json = resp.json()
                    err_msg = err_json.get("error", {}).get("message", resp.text)
                except Exception:
                    err_msg = resp.text
                raise RuntimeError(f"{self.provider_name} API error ({resp.status_code}): {err_msg}")

            data = resp.json()

            choice = data.get("choices", [{}])[0]
            message_content = choice.get("message", {}).get("content", "").strip()
            finish_reason = choice.get("finish_reason", "stop")

            usage = data.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)

            duration_sec = wall_latency_ms / 1000.0
            tps = (completion_tokens / duration_sec) if duration_sec > 0 else 0.0

            tier = request.tier or ModelTier.SMALL

            return GenerationResponse(
                text=message_content,
                model_name=request.model_name,
                tier=tier,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                latency_ms=round(wall_latency_ms, 2),
                tokens_per_second=round(tps, 2),
                load_duration_ms=0.0,
                eval_duration_ms=round(wall_latency_ms, 2),
                finish_reason=finish_reason,
                raw_metadata={
                    "id": data.get("id"),
                    "provider": self.provider_name,
                    "usage": usage,
                },
            )

        except httpx.ConnectError as ce:
            logger.error(f"Cannot connect to {self.provider_name} API at {self.base_url}: {ce}")
            raise ConnectionError(f"Connection to {self.provider_name} at {self.base_url} failed.") from ce
        except httpx.TimeoutException as te:
            logger.error(f"Request to {self.provider_name} timed out after {self.timeout_seconds}s: {te}")
            raise TimeoutError(f"Inference request for model '{request.model_name}' timed out.") from te
        except Exception as e:
            logger.error(f"{self.provider_name} generation error: {e}")
            raise

    async def generate_stream(self, request: GenerationRequest) -> AsyncGenerator[str, None]:
        """Stream chunks from /chat/completions."""
        if not self.api_key:
            raise ValueError(f"Missing API key for {self.provider_name}.")
        if not request.model_name:
            raise ValueError("GenerationRequest must contain a valid model_name.")

        client = await self._get_client()

        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        else:
            messages.append({"role": "system", "content": "You are AdaptiveRoute AI, a helpful, precise assistant. Always respond in English unless the user explicitly requests another language."})
        messages.append({"role": "user", "content": request.prompt})

        payload: Dict[str, Any] = {
            "model": request.model_name,
            "messages": messages,
            "temperature": request.temperature,
            "stream": True,
        }
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens

        async with client.stream("POST", "/chat/completions", json=payload) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise RuntimeError(f"{self.provider_name} stream failed ({response.status_code}): {body.decode()}")

            async for line in response.aiter_lines():
                line = line.strip()
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    token = delta.get("content", "")
                    if token:
                        yield token
                except json.JSONDecodeError:
                    continue
