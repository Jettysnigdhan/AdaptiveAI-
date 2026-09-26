"""
Test script for optional Grok (xAI) OpenAI-compatible Provider.

Usage:
  1. Add your xAI API key to backend/.env:
       XAI_API_KEY=xai-...
       ACTIVE_PROVIDER=xai  (or hybrid)
  2. Run:
       python scripts/development/test_grok_inference.py
"""

import sys
import asyncio
import time
from pathlib import Path

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure root workspace is on python sys.path
root_dir = Path(__file__).resolve().parents[2]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.core.config import get_settings
from backend.app.models.base import GenerationRequest, ModelTier
from backend.app.models.providers.openai_compatible import OpenAICompatibleProvider


async def test_grok():
    settings = get_settings()
    print("=" * 70)
    print("  AdaptiveRoute - Grok (xAI) API Provider Test")
    print("=" * 70)
    print(f"Base URL        : {settings.xai_base_url}")
    print(f"API Key Set     : {'Yes' if settings.xai_api_key else 'No (Missing XAI_API_KEY)'}")
    print(f"Small Grok Model: {settings.grok_model_small}")
    print(f"Large Grok Model: {settings.grok_model_large}")
    print("-" * 70)

    if not settings.xai_api_key:
        print("\n[INFO] No XAI_API_KEY detected in backend/.env or environment.")
        print("To enable Grok:")
        print("  1. Copy backend/.env.example to backend/.env")
        print("  2. Add your key: XAI_API_KEY=xai-your-api-key-here")
        print("  3. Set ACTIVE_PROVIDER=xai (or 'hybrid')")
        print("  4. Re-run this test.")
        return False

    provider = OpenAICompatibleProvider(
        api_key=settings.xai_api_key,
        base_url=settings.xai_base_url,
        provider_name="xai",
    )

    # 1. Health check
    print("\n[Test 1/3] Testing Grok API Connectivity & Auth...")
    is_healthy = await provider.health_check()
    if not is_healthy:
        print("[FAIL] Could not authenticate with xAI API. Verify your XAI_API_KEY.")
        await provider.close()
        return False
    print("[PASS] Grok API is authenticated and responsive.")

    # 2. List models
    models = await provider.list_available_models()
    print(f"Available xAI models: {', '.join(models[:6])}...")

    # 3. Test generation with grok-2-mini
    print(f"\n[Test 2/3] Generating completion with {settings.grok_model_small}...")
    req = GenerationRequest(
        prompt="Explain the difference between stack and queue in 2 sentences.",
        model_name=settings.grok_model_small,
        tier=ModelTier.SMALL,
        max_tokens=150,
    )
    t0 = time.perf_counter()
    resp = await provider.generate(req)
    t1 = time.perf_counter()

    print(f"Response: {resp.text}")
    print(f"  * Latency      : {resp.latency_ms:.1f} ms (Wall clock: {(t1-t0)*1000:.1f} ms)")
    print(f"  * Tokens       : {resp.prompt_tokens} prompt + {resp.completion_tokens} completion")
    print(f"  * Throughput   : {resp.tokens_per_second:.1f} tokens/sec")
    print("[PASS] Grok generation succeeded.")

    # 4. Test streaming
    print(f"\n[Test 3/3] Testing streaming with {settings.grok_model_small}...")
    stream_req = GenerationRequest(
        prompt="Count from 1 to 5.",
        model_name=settings.grok_model_small,
        tier=ModelTier.SMALL,
        max_tokens=50,
    )
    print("Stream Output: ", end="", flush=True)
    async for chunk in provider.generate_stream(stream_req):
        print(chunk, end="", flush=True)
    print()
    print("[PASS] Grok streaming succeeded.")

    await provider.close()
    print("\n" + "=" * 70)
    print("  ALL GROK (xAI) TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    asyncio.run(test_grok())
