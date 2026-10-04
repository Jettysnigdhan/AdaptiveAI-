import json
import re
from typing import Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from backend.app.models.base import GenerationRequest, ModelTier, ModelMetadata
from backend.app.models.factory import provider_factory
from backend.app.models.registry import registry
from backend.app.core.config import get_settings
from backend.app.core.logging import logger


class ComplexityEvaluation(BaseModel):
    """Result of LLM-based prompt complexity search and classification."""
    tier: ModelTier = Field(description="Selected tier: SMALL or LARGE")
    selected_model: str = Field(description="Target model name from available models")
    complexity_score: float = Field(description="Normalized complexity score [0.0 - 1.0]")
    reason: str = Field(description="Explanation of prompt complexity from LLM")
    provider_used: str = Field(description="Provider that performed the complexity evaluation")
    smallest_model: str = Field(description="The smallest available model detected")
    largest_model: str = Field(description="The largest available model detected")


class LLMComplexityEvaluator:
    """
    Evaluates prompt complexity using an ultra-fast LLM (Grok / Groq LPU)
    and automatically switches between the SMALLEST and LARGEST available models.
    """

    def __init__(self):
        self.settings = get_settings()

    def get_available_smallest_and_largest(self) -> Tuple[Optional[ModelMetadata], Optional[ModelMetadata]]:
        """
        Dynamically find the SMALLEST and LARGEST available models among registered, enabled models.
        """
        small_model = registry.get_default_model_for_tier(ModelTier.SMALL)
        large_model = registry.get_default_model_for_tier(ModelTier.LARGE)

        # Fallbacks across all enabled models if default tier models are not enabled
        if not small_model:
            enabled_smalls = registry.list_models_by_tier(ModelTier.SMALL, only_enabled=True)
            if enabled_smalls:
                small_model = enabled_smalls[0]

        if not large_model:
            enabled_larges = registry.list_models_by_tier(ModelTier.LARGE, only_enabled=True)
            if enabled_larges:
                large_model = enabled_larges[0]

        return small_model, large_model

    async def evaluate_complexity(self, prompt: str) -> ComplexityEvaluation:
        """
        Search and evaluate prompt complexity using Grok / Groq LPU,
        then automatically switch between the smallest and largest available models.
        """
        small_meta, large_meta = self.get_available_smallest_and_largest()
        small_name = small_meta.model_name if small_meta else self.settings.effective_grok_small
        large_name = large_meta.model_name if large_meta else self.settings.effective_grok_large

        # Choose evaluation provider: Grok (xAI) if key is set, else Groq LPU, else active provider
        eval_provider_name = (
            "xai"
            if self.settings.xai_api_key
            else ("groq" if self.settings.groq_api_key else self.settings.active_provider)
        )
        provider = provider_factory.get_provider(eval_provider_name)

        eval_model_name = (
            self.settings.effective_grok_small
            if eval_provider_name in ("xai", "grok")
            else self.settings.groq_model_small
        )

        judge_prompt = (
            f"Evaluate the technical, algorithmic, and cognitive complexity of this user prompt:\n\n"
            f"\"\"\"{prompt[:1500]}\"\"\"\n\n"
            f"Classify into either:\n"
            f"- 'small': For basic queries, simple arithmetic, syntax questions, short translations, greetings, simple scripts.\n"
            f"- 'large': For system architecture, multi-step algorithmic reasoning, distributed systems, deep debugging, complex codebases, mathematical proofs.\n\n"
            f"Output ONLY valid JSON with no markdown wrapping in this format:\n"
            f'{{"tier": "small" or "large", "score": 0.0 to 1.0, "reason": "brief 1-sentence reason"}}'
        )

        req = GenerationRequest(
            prompt=judge_prompt,
            system_prompt="You are an AI router prompt complexity judge. Always answer with valid JSON only, without markdown fences.",
            model_name=eval_model_name,
            tier=ModelTier.SMALL,
            max_tokens=300,
            temperature=0.1,
        )

        try:
            res = await provider.generate(req)
            text = (res.text or "").strip()
            # Extract JSON block
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                data = json.loads(match.group(0))
                tier_str = str(data.get("tier", "small")).lower().strip()
                score = float(data.get("score", 0.5))
                reason = str(data.get("reason", "Evaluated by LLM complexity judge."))

                chosen_tier = ModelTier.LARGE if ("large" in tier_str or score >= 0.55) else ModelTier.SMALL
                chosen_model = large_name if chosen_tier == ModelTier.LARGE else small_name

                logger.info(
                    f"[LLM Complexity Judge ({eval_provider_name})] Prompt: '{prompt[:45]}...' -> "
                    f"Tier: {chosen_tier.value.upper()} ({chosen_model}), Score: {score:.2f}, Reason: '{reason}'"
                )

                return ComplexityEvaluation(
                    tier=chosen_tier,
                    selected_model=chosen_model,
                    complexity_score=score,
                    reason=reason,
                    provider_used=eval_provider_name,
                    smallest_model=small_name,
                    largest_model=large_name,
                )
        except Exception as e:
            logger.warning(f"LLM complexity evaluation error ({e}). Falling back to local heuristic analyzer.")

        # Robust Fallback to local prompt analyzer if offline or network error
        from backend.app.analyzer.prompt_analyzer import analyzer
        analysis = analyzer.analyze(prompt)
        is_large = (
            analysis.complexity_score >= 0.35
            or bool(analysis.features.has_reasoning)
            or analysis.features.task_signals.get("architecture", 0.0) >= 0.35
            or analysis.features.task_signals.get("backend", 0.0) >= 0.4
        )
        chosen_tier = ModelTier.LARGE if is_large else ModelTier.SMALL
        chosen_model = large_name if chosen_tier == ModelTier.LARGE else small_name
        score = analysis.complexity_score

        return ComplexityEvaluation(
            tier=chosen_tier,
            selected_model=chosen_model,
            complexity_score=score,
            reason=f"Local heuristic analyzer scored complexity as {score:.2f} -> selected {chosen_tier.value.upper()}.",
            provider_used="local_heuristic",
            smallest_model=small_name,
            largest_model=large_name,
        )


llm_complexity_evaluator = LLMComplexityEvaluator()
