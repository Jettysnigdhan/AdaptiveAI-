"""
Milestone 1: Local Inference Verification Test Script.

Tests:
1. Ollama connection & health check
2. Model discovery & Registry synchronization
3. Synchronous text generation across Small, Medium, and Large tiers
4. Streaming token generation
5. Error handling for non-existent/unavailable models
6. Latency, token metrics, and throughput measurement
"""

import sys
import os
import asyncio
import time
from pathlib import Path

# Ensure stdout handles utf-8 if supported
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
from backend.app.models.providers.ollama import OllamaProvider


async def run_milestone1_tests():
    settings = get_settings()
    print("=" * 70)
    print("  AdaptiveRoute - Milestone 1: Local Inference Verification")
    print("=" * 70)
    print(f"Ollama Base URL : {settings.ollama_base_url}")
    print(f"Small Model     : {settings.model_small}")
    print(f"Medium Model    : {settings.model_medium}")
    print(f"Large Model     : {settings.model_large}")
    print("-" * 70)

    provider = OllamaProvider(
        base_url=settings.ollama_base_url,
        timeout_seconds=settings.ollama_timeout_seconds,
    )
    registry = ModelRegistry(settings=settings)

    # Test 1: Health Check
    print("\n[Test 1/5] Checking Ollama Provider Health...")
    is_healthy = await provider.health_check()
    if not is_healthy:
        print("[FAIL] Ollama daemon is unreachable at", settings.ollama_base_url)
        print("Please run `ollama serve` and ensure Ollama is running.")
        return False
    print("[PASS] Ollama daemon is healthy and reachable.")

    # Test 2: Model Synchronization
    print("\n[Test 2/5] Listing installed models & syncing registry...")
    available_models = await provider.list_available_models()
    print(f"Found {len(available_models)} models in Ollama: {', '.join(available_models)}")

    sync_status = await registry.sync_with_provider(provider)
    for model_name, available in sync_status.items():
        meta = registry.get_model(model_name)
        tier_label = meta.tier.value.upper() if meta else "UNKNOWN"
        status_sym = "[OK]  " if available else "[MISS]"
        print(f"  {status_sym} [{tier_label:6}] {model_name:25} -> Available: {available}")

    # Test 3: Inference across tiers
    print("\n[Test 3/5] Testing Local Inference Across Model Tiers...")
    test_prompts = [
        (
            ModelTier.SMALL,
            settings.model_small,
            "State the capital of Japan in one concise sentence."
        ),
        (
            ModelTier.MEDIUM,
            settings.model_medium,
            "Write a Python function `is_palindrome(s: str) -> bool` with a one-line docstring."
        ),
    ]

    # Include Large model test if installed in Ollama
    if sync_status.get(settings.model_large, False):
        test_prompts.append((
            ModelTier.LARGE,
            settings.model_large,
            "Explain in 2 bullet points why binary search requires a sorted array."
        ))
    else:
        print(f"[INFO] Large model '{settings.model_large}' not yet installed. Testing Small & Medium.")

    for tier, model_name, prompt in test_prompts:
        print(f"\n--- Testing Tier: {tier.value.upper()} ({model_name}) ---")
        print(f"Prompt: \"{prompt}\"")
        req = GenerationRequest(
            prompt=prompt,
            model_name=model_name,
            tier=tier,
            max_tokens=150,
            temperature=0.3,
        )

        try:
            t0 = time.perf_counter()
            resp = await provider.generate(req)
            elapsed_sec = time.perf_counter() - t0

            # Record in registry metrics
            registry.record_inference_metrics(
                model_name=model_name,
                latency_ms=resp.latency_ms,
                tokens=resp.total_tokens,
            )

            preview = resp.text.replace("\n", " ")
            if len(preview) > 120:
                preview = preview[:120] + "..."
            print(f"Response: {preview}")
            print(f"  * Latency      : {resp.latency_ms:.1f} ms (Wall clock: {elapsed_sec*1000:.1f} ms)")
            print(f"  * Prompt Tokens: {resp.prompt_tokens}")
            print(f"  * Compl. Tokens: {resp.completion_tokens}")
            print(f"  * Throughput   : {resp.tokens_per_second:.1f} tokens/sec")
            print(f"  * Load Time    : {resp.load_duration_ms:.1f} ms")
            print(f"  * Eval Time    : {resp.eval_duration_ms:.1f} ms")
            print(f"[PASS] Tier {tier.value.upper()} inference succeeded.")
        except Exception as e:
            print(f"[FAIL] Tier {tier.value.upper()} inference failed: {e}")
            return False

    # Test 4: Streaming Generation
    print("\n[Test 4/5] Testing Streaming Generation (Small Tier)...")
    stream_req = GenerationRequest(
        prompt="Count from 1 to 5 separated by commas.",
        model_name=settings.model_small,
        tier=ModelTier.SMALL,
        max_tokens=30,
        temperature=0.1,
    )
    stream_tokens = []
    try:
        print("Stream Output: ", end="", flush=True)
        async for chunk in provider.generate_stream(stream_req):
            print(chunk, end="", flush=True)
            stream_tokens.append(chunk)
        print()
        assert len(stream_tokens) > 0, "No stream chunks received"
        print(f"[PASS] Streaming succeeded ({len(stream_tokens)} chunks received).")
    except Exception as e:
        print(f"[FAIL] Streaming failed: {e}")
        return False

    # Test 5: Error Handling & Fallback for Missing Model
    print("\n[Test 5/5] Testing Error Handling for Missing Model...")
    missing_req = GenerationRequest(
        prompt="Hello world",
        model_name="nonexistent-dummy-model:999b",
        tier=ModelTier.SMALL,
    )
    try:
        await provider.generate(missing_req)
        print("[FAIL] Missing model should have thrown an error!")
        return False
    except (RuntimeError, Exception) as expected_err:
        print(f"[PASS] Caught expected error gracefully:\n    \"{expected_err}\"")

    # Cleanup
    await provider.close()

    print("\n" + "=" * 70)
    print("  ALL MILESTONE 1 LOCAL INFERENCE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = asyncio.run(run_milestone1_tests())
    sys.exit(0 if success else 1)
