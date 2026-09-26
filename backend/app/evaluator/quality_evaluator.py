import re
from typing import Optional
from pydantic import BaseModel, Field
from backend.app.evaluator.validators import ResponseValidators
from backend.app.evaluator.confidence import ConfidenceScorer
from backend.app.core.config import get_settings
from backend.app.core.logging import logger


class EvaluationResult(BaseModel):
    """Output evaluation report for a generated response."""
    quality_score: float = Field(description="Normalized quality rating [0.0 - 1.0]")
    confidence: float = Field(description="Confidence in evaluation [0.0 - 1.0]")
    passed: bool = Field(description="True if quality_score >= quality_threshold")
    reason: str = Field(description="Detailed reason or criteria explanation")


class QualityEvaluator:
    """Evaluates LLM answer quality using deterministic heuristics and optional LLM judge."""

    def __init__(self, quality_threshold: Optional[float] = None):
        self.settings = get_settings()
        self.quality_threshold = quality_threshold or self.settings.quality_threshold

    async def evaluate(
        self,
        prompt: str,
        response_text: str,
        completion_tokens: int = 0,
        finish_reason: str = "stop",
        model_name: str = "",
        tier_level: int = 1,
    ) -> EvaluationResult:
        """
        Evaluate answer quality against configured threshold.
        Applies deterministic criteria + confidence scoring.
        """
        # 1. Deterministic Failures
        if ResponseValidators.is_empty_or_whitespace(response_text):
            return EvaluationResult(
                quality_score=0.0,
                confidence=1.0,
                passed=False,
                reason="Response is completely empty or whitespace only.",
            )

        is_error, err_msg = ResponseValidators.is_truncated_or_error(response_text)
        if is_error:
            return EvaluationResult(
                quality_score=0.15,
                confidence=0.95,
                passed=False,
                reason=err_msg or "Model returned an explicit refusal or error string.",
            )

        is_looping, rep_ratio = ResponseValidators.check_repetition_loop(response_text)
        if is_looping:
            return EvaluationResult(
                quality_score=0.35,
                confidence=0.90,
                passed=False,
                reason=f"Repetitive loop detected (repetition ratio: {rep_ratio}).",
            )

        # 2. Quality heuristics based on prompt type & response structure
        confidence = ConfidenceScorer.calculate_confidence(
            prompt=prompt,
            response_text=response_text,
            completion_tokens=completion_tokens,
            finish_reason=finish_reason,
        )

        # Base quality estimation
        quality = 0.88

        # Heuristic 1: If prompt asks for code and response has no code block or keywords
        prompt_lower = prompt.lower()
        if any(w in prompt_lower for w in ["write a function", "write code", "implement", "class", "def "]):
            has_code_syntax = "def " in response_text or "class " in response_text or "```" in response_text or "function" in response_text
            if not has_code_syntax:
                quality -= 0.35
            elif not ResponseValidators.validate_code_blocks(response_text):
                quality -= 0.15

        # Heuristic 2: Short prompt demanding explanation but response is trivial
        if any(w in prompt_lower for w in ["explain", "why", "describe"]) and len(response_text.split()) < 15:
            quality -= 0.25

        # Heuristic 3: Deduct if truncated
        if finish_reason != "stop":
            quality -= 0.20

        # Adjust for confidence
        quality = min(0.99, max(0.1, quality * (0.8 + 0.2 * confidence)))
        quality = round(quality, 3)

        passed = quality >= self.quality_threshold
        if passed:
            reason = f"Response satisfied criteria with quality score {quality:.2f} >= threshold {self.quality_threshold:.2f}."
        else:
            reason = f"Response scored {quality:.2f}, below quality threshold {self.quality_threshold:.2f}. Escalation recommended."

        return EvaluationResult(
            quality_score=quality,
            confidence=confidence,
            passed=passed,
            reason=reason,
        )


evaluator = QualityEvaluator()
