import time
import json
import httpx
from typing import List, Dict, Any, Optional, AsyncGenerator
from backend.app.models.base import (
    BaseModelProvider,
    GenerationRequest,
    GenerationResponse,
    ModelTier,
)
from backend.app.core.logging import logger


class OllamaProvider(BaseModelProvider):
    """Local LLM provider interfacing with the Ollama REST API."""

    def __init__(self, base_url: str = "http://localhost:11434", timeout_seconds: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Lazily initialize and return the async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout_seconds, connect=10.0),
            )
        return self._client

    async def close(self):
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def health_check(self) -> bool:
        """Check if Ollama server is responsive."""
        try:
            client = await self._get_client()
            resp = await client.get("/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed at {self.base_url}: {e}")
            return False

    async def list_available_models(self) -> List[str]:
        """Fetch names of all locally available models installed in Ollama."""
        try:
            client = await self._get_client()
            resp = await client.get("/api/tags")
            resp.raise_for_status()
            data = resp.json()
            models = [m.get("name") for m in data.get("models", []) if m.get("name")]
            return models
        except Exception as e:
            logger.error(f"Failed to query Ollama model list: {e}")
            return []

    async def generate(self, request: GenerationRequest) -> GenerationResponse:
        """Execute text generation against the specified local Ollama model."""
        if not request.model_name:
            raise ValueError("GenerationRequest must contain a valid model_name for OllamaProvider.")

        client = await self._get_client()
        payload: Dict[str, Any] = {
            "model": request.model_name,
            "prompt": request.prompt,
            "stream": False,
            "options": {
                "temperature": request.temperature,
            },
        }

        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens

        if request.system_prompt:
            payload["system"] = request.system_prompt

        start_time = time.perf_counter()
        try:
            resp = await client.post("/api/generate", json=payload)
            wall_latency_ms = (time.perf_counter() - start_time) * 1000.0

            if resp.status_code == 404:
                raise RuntimeError(
                    f"Model '{request.model_name}' was not found in Ollama runtime. "
                    f"Run `ollama pull {request.model_name}` to install it."
                )

            resp.raise_for_status()
            data = resp.json()

            # Parse Ollama telemetry
            prompt_tokens = data.get("prompt_eval_count", 0)
            completion_tokens = data.get("eval_count", 0)
            total_tokens = prompt_tokens + completion_tokens

            total_duration_ns = data.get("total_duration", 0)
            load_duration_ns = data.get("load_duration", 0)
            eval_duration_ns = data.get("eval_duration", 0)

            eval_duration_sec = eval_duration_ns / 1e9 if eval_duration_ns > 0 else (wall_latency_ms / 1000.0)
            tps = (completion_tokens / eval_duration_sec) if eval_duration_sec > 0 else 0.0

            tier = request.tier or ModelTier.SMALL

            return GenerationResponse(
                text=data.get("response", "").strip(),
                model_name=request.model_name,
                tier=tier,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                latency_ms=round(wall_latency_ms, 2),
                tokens_per_second=round(tps, 2),
                load_duration_ms=round(load_duration_ns / 1e6, 2),
                eval_duration_ms=round(eval_duration_ns / 1e6, 2),
                finish_reason=data.get("done_reason", "stop"),
                raw_metadata={
                    "total_duration_ns": total_duration_ns,
                    "load_duration_ns": load_duration_ns,
                    "eval_duration_ns": eval_duration_ns,
                    "created_at": data.get("created_at"),
                },
            )

        except httpx.ConnectError as ce:
            logger.error(f"Cannot connect to Ollama daemon at {self.base_url}: {ce}")
            raise ConnectionError(
                f"Ollama server is not running or unreachable at {self.base_url}. "
                f"Please start Ollama service using `ollama serve`."
            ) from ce
        except httpx.TimeoutException as te:
            logger.error(f"Ollama request timed out after {self.timeout_seconds}s for model {request.model_name}: {te}")
            raise TimeoutError(f"Inference request for model '{request.model_name}' timed out.") from te
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            raise

    async def generate_stream(self, request: GenerationRequest) -> AsyncGenerator[str, None]:
        """Stream token chunks from Ollama."""
        if not request.model_name:
            raise ValueError("GenerationRequest must contain a valid model_name for OllamaProvider.")

        client = await self._get_client()
        payload: Dict[str, Any] = {
            "model": request.model_name,
            "prompt": request.prompt,
            "stream": True,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens
        if request.system_prompt:
            payload["system"] = request.system_prompt

        async with client.stream("POST", "/api/generate", json=payload) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise RuntimeError(f"Ollama stream failed with status {response.status_code}: {body.decode()}")

            async for line in response.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                try:
                    chunk_data = json.loads(line)
                    token = chunk_data.get("response", "")
                    if token:
                        yield token
                except json.JSONDecodeError:
                    continue
