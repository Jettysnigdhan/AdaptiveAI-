import uuid
import time
from datetime import datetime
from typing import Optional, Dict, Any, AsyncGenerator
from pydantic import BaseModel, Field

from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.router.model_router import router, RoutingDecision
from backend.app.router.escalation import CascadingSummary, EscalationTrace
from backend.app.evaluator.quality_evaluator import evaluator, EvaluationResult
from backend.app.models.base import GenerationRequest, GenerationResponse, ModelTier
from backend.app.models.registry import registry
from backend.app.models.factory import provider_factory
from backend.app.database.database import save_inference_log
from backend.app.core.config import get_settings
from backend.app.core.logging import logger


class ChatResponse(BaseModel):
    """Complete API response for a routed chat completion."""
    request_id: str
    response: str
    selected_model: str
    tier: str
    initial_model: str
    final_model: str
    quality_score: float
    confidence: float
    latency_ms: float
    escalated: bool
    escalation_count: int
    explanation: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    category: str
    predicted_qualities: Dict[str, float]
    routing_path: list


class InferenceService:
    """Core orchestration engine coordinating Analyzer, Router, Provider, and Evaluator."""

    def __init__(self):
        self.settings = get_settings()

    async def process_chat(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        force_tier: Optional[str] = None,
        force_policy: Optional[str] = None,
    ) -> ChatResponse:
        """Execute end-to-end adaptive routing and cascading pipeline."""
        request_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()

        logger.info(f"[{request_id}] Processing prompt: '{prompt[:60]}...'")

        # 1. Prompt Analyzer (Embeddings & Feature Extraction)
        analysis = analyzer.analyze(prompt)

        # 2. Model Router
        if force_tier:
            try:
                selected_tier = ModelTier.from_str(force_tier)
                target_model = registry.get_default_model_for_tier(selected_tier)
                model_name = target_model.model_name if target_model else self.settings.groq_model_small
                decision = RoutingDecision(
                    selected_tier=selected_tier,
                    selected_model=model_name,
                    confidence=1.0,
                    policy_name="manual_override",
                    explanation=f"Manual override forced {selected_tier.value.upper()} tier.",
                )
            except Exception:
                decision = router.route(analysis, force_policy=force_policy)
        else:
            # Automatic dynamic routing with LLM Grok/Groq complexity evaluation:
            # Evaluates prompt complexity and auto-switches between smallest and largest available models
            try:
                from backend.app.router.llm_complexity_evaluator import llm_complexity_evaluator
                eval_res = await llm_complexity_evaluator.evaluate_complexity(prompt)
                decision = RoutingDecision(
                    selected_tier=eval_res.tier,
                    selected_model=eval_res.selected_model,
                    confidence=0.95 if eval_res.tier == ModelTier.SMALL else 0.98,
                    policy_name="llm_grok_complexity",
                    predicted_qualities={
                        "small": 0.95 if eval_res.tier == ModelTier.SMALL else 0.25,
                        "large": 0.98 if eval_res.tier == ModelTier.LARGE else 0.35,
                    },
                    explanation=f"LLM Grok/Groq evaluation ({eval_res.reason}) -> Auto-switched to {eval_res.tier.value.upper()} [{eval_res.selected_model}] from available models [{eval_res.smallest_model} | {eval_res.largest_model}].",
                )
            except Exception as e:
                logger.warning(f"Error in LLM complexity evaluator ({e}). Falling back to heuristic router.")
                decision = router.route(analysis, force_policy=force_policy)

        current_tier = decision.selected_tier
        current_model_name = decision.selected_model
        initial_model = current_model_name
        initial_tier = current_tier

        escalation_count = 0
        escalated = False
        escalation_reason = ""
        routing_path = [current_model_name]
        traces = []

        total_prompt_tokens = 0
        total_completion_tokens = 0
        final_response_text = ""
        final_eval: Optional[EvaluationResult] = None

        max_escalations = self.settings.max_escalations

        # 3. Execution & Adaptive Cascading Loop
        while True:
            provider = provider_factory.get_provider_for_model(current_model_name)
            req = GenerationRequest(
                prompt=prompt,
                model_name=current_model_name,
                tier=current_tier,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            gen_resp: GenerationResponse = await provider.generate(req)
            total_prompt_tokens += gen_resp.prompt_tokens
            total_completion_tokens += gen_resp.completion_tokens
            final_response_text = gen_resp.text

            # Update rolling registry telemetry
            registry.record_inference_metrics(
                model_name=current_model_name,
                latency_ms=gen_resp.latency_ms,
                tokens=gen_resp.total_tokens,
            )

            # 4. Quality Evaluation
            eval_result: EvaluationResult = await evaluator.evaluate(
                prompt=prompt,
                response_text=gen_resp.text,
                completion_tokens=gen_resp.completion_tokens,
                finish_reason=gen_resp.finish_reason or "stop",
                model_name=current_model_name,
                tier_level=current_tier.level,
            )
            final_eval = eval_result

            trace = EscalationTrace(
                tier=current_tier,
                model_name=current_model_name,
                quality_score=eval_result.quality_score,
                passed=eval_result.passed,
                latency_ms=gen_resp.latency_ms,
                reason=eval_result.reason,
            )
            traces.append(trace)

            # Check if passed or reached max escalations
            if eval_result.passed or escalation_count >= max_escalations:
                break

            # Escalate to next tier if available
            next_tier = current_tier.next_tier()
            if not next_tier:
                break

            escalated = True
            escalation_count += 1
            escalation_reason = (
                f"{current_tier.value.upper()} response scored {eval_result.quality_score:.2f} "
                f"(below threshold {self.settings.quality_threshold:.2f}). Escalated to {next_tier.value.upper()} tier."
            )
            logger.info(f"[{request_id}] Escalating: {escalation_reason}")

            next_model = registry.get_default_model_for_tier(next_tier)
            if not next_model:
                break

            current_tier = next_tier
            current_model_name = next_model.model_name
            routing_path.append(current_model_name)

        total_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # Build full explanation
        explanation_full = decision.explanation
        if escalated:
            explanation_full += f" [Escalated {escalation_count} time(s): {escalation_reason}]"

        log_payload = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "response": final_response_text,
            "initial_model": initial_model,
            "initial_tier": initial_tier.value,
            "final_model": current_model_name,
            "final_tier": current_tier.value,
            "router_decision": decision.policy_name,
            "router_confidence": decision.confidence,
            "quality_score": final_eval.quality_score if final_eval else 0.8,
            "evaluator_confidence": final_eval.confidence if final_eval else 0.8,
            "escalated": escalated,
            "escalation_count": escalation_count,
            "escalation_reason": escalation_reason,
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "total_tokens": total_prompt_tokens + total_completion_tokens,
            "latency_ms": total_latency_ms,
        }

        # Asynchronously log to SQLite database
        try:
            await save_inference_log(log_payload)
        except Exception as e:
            logger.warning(f"Failed to record inference log to database: {e}")

        return ChatResponse(
            request_id=request_id,
            response=final_response_text,
            selected_model=current_model_name,
            tier=current_tier.value,
            initial_model=initial_model,
            final_model=current_model_name,
            quality_score=final_eval.quality_score if final_eval else 0.8,
            confidence=final_eval.confidence if final_eval else 0.8,
            latency_ms=total_latency_ms,
            escalated=escalated,
            escalation_count=escalation_count,
            explanation=explanation_full,
            prompt_tokens=total_prompt_tokens,
            completion_tokens=total_completion_tokens,
            total_tokens=total_prompt_tokens + total_completion_tokens,
            category=analysis.detected_category,
            predicted_qualities=decision.predicted_qualities,
            routing_path=routing_path,
        )


inference_service = InferenceService()
