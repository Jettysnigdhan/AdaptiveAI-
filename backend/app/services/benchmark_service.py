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
        """Execute all baselines and AdaptiveRoute for experimental evaluation and save to report."""
        import json
        from pathlib import Path
        from backend.app.core.config import settings

        logger.info("Executing full benchmark comparison across baselines...")
        policies = {
            "always_small": "Always Small (Baseline 1)",
            "always_medium": "Always Medium (Baseline 2)",
            "always_large": "Always Large (Baseline 3)",
            "rule": "Rule-Based Router (Baseline 4)",
            "auto": "Adaptive ML + Cascading (Proposed)",
        }
        policy_results = {}
        for p_key, p_name in policies.items():
            res = await self.run_policy_benchmark(p_key if p_key != "rule" else "rule_baseline")
            policy_results[p_key] = {
                "name": p_name,
                "avg_latency_ms": res.avg_latency_ms,
                "avg_output_tokens": round(res.total_tokens / max(1, res.total_prompts), 1),
                "avg_quality_score": res.avg_quality,
                "escalation_rate": res.escalation_rate,
                "tier_distribution": res.tier_distribution,
            }

        exp_id = f"exp_{time.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        report_data = {
            "experiment_id": exp_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "metadata": {
                "provider": settings.active_provider,
                "quality_threshold": settings.quality_threshold,
                "max_escalations": settings.max_escalations,
                "dataset_version": "v1.0",
                "prompt_count": len(BENCHMARK_PROMPTS),
            },
            "policies": policy_results,
        }

        report_dir = Path("./evaluation/reports")
        report_dir.mkdir(parents=True, exist_ok=True)
        report_path = report_dir / "baseline_comparison_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)

        return report_data


benchmark_service = BenchmarkService()

