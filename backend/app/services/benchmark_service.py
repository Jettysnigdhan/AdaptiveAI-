import asyncio
import time
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from backend.app.models.base import GenerationRequest, ModelTier
from backend.app.models.registry import registry
from backend.app.models.factory import provider_factory
from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.router.model_router import router
from backend.app.evaluator.quality_evaluator import evaluator
from backend.app.services.inference_service import inference_service
from backend.app.core.logging import logger

BENCHMARK_PROMPTS = [
    {"category": "general", "prompt": "What is the capital of Australia?"},
    {"category": "general", "prompt": "Name the three states of matter."},
    {"category": "coding", "prompt": "Write a Python function to check if a word is an anagram of another word."},
    {"category": "coding", "prompt": "Implement binary search in Python returning index or -1."},
    {"category": "mathematics", "prompt": "Solve for x: 3x^2 - 12x + 9 = 0 using factorization."},
    {"category": "mathematics", "prompt": "What is the probability of rolling a sum of 7 with two fair 6-sided dice?"},
    {"category": "reasoning", "prompt": "Explain the difference between deductive and inductive reasoning with an example of each."},
    {"category": "reasoning", "prompt": "Why does hot air rise while cold air sinks? Detail the thermodynamic principle."},
    {"category": "summarization", "prompt": "Summarize the primary benefits of microservices architecture in 3 bullet points."},
    {"category": "structured_data", "prompt": "Return a valid JSON object with keys 'name', 'version', and 'tags' for a mock web service."},
    {"category": "debugging", "prompt": "Identify the bug in this Python snippet: def add(a, b): return a - b"},
    {"category": "planning", "prompt": "Outline a 4-phase roadmap for migrating a legacy monolith to containerized cloud deployment."},
]


class BenchmarkResult(BaseModel):
    policy: str
    total_prompts: int
    avg_latency_ms: float
    total_tokens: int
    avg_quality: float
    escalation_rate: float
    tier_distribution: Dict[str, int]


class BenchmarkService:
    """Automated benchmark pipeline comparing Baselines against AdaptiveRoute."""

    async def run_policy_benchmark(self, policy: str) -> BenchmarkResult:
        """
        Runs benchmark prompts under a specific policy:
        - 'always_small'
        - 'always_medium'
        - 'always_large'
        - 'rule_baseline'
        - 'adaptive_route'
        """
        latencies = []
        tokens = []
        qualities = []
        escalated_count = 0
        distribution = {"small": 0, "medium": 0, "large": 0}

        for item in BENCHMARK_PROMPTS:
            prompt = item["prompt"]

            if policy == "always_small":
                resp = await inference_service.process_chat(prompt, force_tier="small")
            elif policy == "always_medium":
                resp = await inference_service.process_chat(prompt, force_tier="medium")
            elif policy == "always_large":
                resp = await inference_service.process_chat(prompt, force_tier="large")
            elif policy == "rule_baseline":
                resp = await inference_service.process_chat(prompt, force_policy="rule")
            else:  # 'adaptive_route'
                resp = await inference_service.process_chat(prompt)

            latencies.append(resp.latency_ms)
            tokens.append(resp.total_tokens)
            qualities.append(resp.quality_score)
            if resp.escalated:
                escalated_count += 1
            distribution[resp.tier] = distribution.get(resp.tier, 0) + 1

        total = len(BENCHMARK_PROMPTS)
        return BenchmarkResult(
            policy=policy,
            total_prompts=total,
            avg_latency_ms=round(sum(latencies) / total, 1),
            total_tokens=sum(tokens),
            avg_quality=round(sum(qualities) / total, 3),
            escalation_rate=round((escalated_count / total) * 100.0, 1),
            tier_distribution=distribution,
        )

    async def run_full_comparison(self) -> Dict[str, Any]:
        """Execute all baselines and AdaptiveRoute for experimental evaluation."""
        logger.info("Executing full benchmark comparison across baselines...")
        policies = ["always_small", "always_medium", "always_large", "rule_baseline", "adaptive_route"]
        results = {}
        for p in policies:
            results[p] = (await self.run_policy_benchmark(p)).model_dump()

        # Compute savings relative to Always Large
        always_large_lat = results["always_large"]["avg_latency_ms"]
        adaptive_lat = results["adaptive_route"]["avg_latency_ms"]
        lat_reduction_pct = round(((always_large_lat - adaptive_lat) / always_large_lat) * 100.0, 1) if always_large_lat > 0 else 0.0

        return {
            "comparison": results,
            "latency_reduction_percent": lat_reduction_pct,
            "quality_delta": round(results["adaptive_route"]["avg_quality"] - results["always_large"]["avg_quality"], 3),
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }


benchmark_service = BenchmarkService()
