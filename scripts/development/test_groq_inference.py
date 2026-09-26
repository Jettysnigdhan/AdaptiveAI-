"""
Milestone 1 Verification Test for Groq LPU Provider.

Tests:
1. Groq connection & health check
2. Model discovery
3. Inference across Small (allam-2-7b), Medium (qwen/qwen3.8-27b), and Large (openai/gpt-oss-120b)
4. Streaming token chunks
5. Measured latency, token count, and tokens/sec throughput
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
from backend.app.models.registry import ModelRegistry
from backend.app.models.factory import provider_factory


async def run_groq_tests():
    settings = get_settings()
    print("=" * 70)
    print("  AdaptiveRoute - Groq LPU Provider Verification")
    print("=" * 70)
    print(f"Active Provider : {settings.active_provider}")
    print(f"Groq Base URL   : {settings.groq_base_url}")
    print(f"Small Tier Model: {settings.groq_model_small}")
    print(f"Medium Tier     : {settings.groq_model_medium}")
    print(f"Large Tier Model: {settings.groq_model_large}")
    print("-" * 70)

    provider = provider_factory.get_provider("groq")
    registry = ModelRegistry(settings=settings)

    # 1. Health check
    print("\n[Test 1/4] Checking Groq API Health & Auth...")
    is_healthy = await provider.health_check()
    if not is_healthy:
        print("[FAIL] Could not authenticate with Groq API.")
        return False
    print("[PASS] Groq API is authenticated and responsive.")

    # 2. List available models
    print("\n[Test 2/4] Listing Groq models...")
    models = await provider.list_available_models()
    print(f"Found {len(models)} models on Groq: {', '.join(models[:6])}...")

    # 3. Test inference across tiers
    test_cases = [
        (
            ModelTier.SMALL,
            settings.groq_model_small,
            "State the capital of France in 3 words.",
        ),
        (
            ModelTier.MEDIUM,
            settings.groq_model_medium,
            "Write a Python function `reverse_list(lst: list) -> list` with a one-line docstring.",
        ),
        (
            ModelTier.LARGE,
            settings.groq_model_large,
            "Explain in 2 bullet points why binary search requires a sorted array.",
        ),
    ]

    print("\n[Test 3/4] Testing Multi-Tier Generation on Groq LPU...")
    for tier, model_name, prompt in test_cases:
        print(f"\n--- Testing Tier: {tier.value.upper()} ({model_name}) ---")
        print(f"Prompt: \"{prompt}\"")
        req = GenerationRequest(
            prompt=prompt,
            model_name=model_name,
            tier=tier,
            max_tokens=200,
            temperature=0.3,
        )

        try:
            t0 = time.perf_counter()
            resp = await provider.generate(req)
            elapsed_sec = time.perf_counter() - t0

            registry.record_inference_metrics(
                model_name=model_name,
                latency_ms=resp.latency_ms,
                tokens=resp.total_tokens,
            )

            preview = resp.text.replace("\n", " ").encode("ascii", "ignore").decode()
            if len(preview) > 120:
                preview = preview[:120] + "..."
            print(f"Response: {preview}")
            print(f"  * Latency      : {resp.latency_ms:.1f} ms (Wall clock: {elapsed_sec*1000:.1f} ms)")
            print(f"  * Prompt Tokens: {resp.prompt_tokens}")
            print(f"  * Compl. Tokens: {resp.completion_tokens}")
            print(f"  * Throughput   : {resp.tokens_per_second:.1f} tokens/sec")
            print(f"[PASS] Tier {tier.value.upper()} inference succeeded on Groq.")
        except Exception as e:
            print(f"[FAIL] Tier {tier.value.upper()} inference failed: {e}")
            return False

    # 4. Test streaming
    print("\n[Test 4/4] Testing Streaming on Groq LPU...")
    stream_req = GenerationRequest(
        prompt="Count from 1 to 5 separated by commas.",
        model_name=settings.groq_model_medium,
        tier=ModelTier.MEDIUM,
        max_tokens=30,
        temperature=0.1,
    )
    stream_tokens = []
    try:
        print("Stream Output: ", end="", flush=True)
        async for chunk in provider.generate_stream(stream_req):
            print(chunk.encode("ascii", "ignore").decode(), end="", flush=True)
            stream_tokens.append(chunk)
        print()
        assert len(stream_tokens) > 0, "No stream chunks received"
        print(f"[PASS] Streaming succeeded ({len(stream_tokens)} chunks received).")
    except Exception as e:
        print(f"[FAIL] Streaming failed: {e}")
        return False

    await provider.close()
    print("\n" + "=" * 70)
    print("  ALL GROQ INFERENCE TESTS PASSED WITH BLAZING LATENCY!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = asyncio.run(run_groq_tests())
    sys.exit(0 if success else 1)
