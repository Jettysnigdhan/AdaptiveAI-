"""Cost-aware model router with deterministic rule matching and quality escalation."""

import logging
from typing import Optional, Dict, Any, Tuple

from app.config import get_settings
from app.models.llm import llm_client, LLMResult
from app.routing.rules import evaluate_query_complexity, evaluate_response_quality

logger = logging.getLogger("semantic_router.router")


class CostAwareRouter:
    """Routes queries to appropriate model tier and manages quality escalations."""

    def __init__(self):
        self.settings = get_settings()
        self.llm = llm_client

    def route_query(self, query: str, force_route: Optional[str] = None) -> Tuple[str, str, str]:
        """
        Determines the target route and model.
        Returns: (route: str, model: str, reason: str)
        """
        if force_route:
            f_lower = force_route.lower()
            if f_lower in ("large", "complex"):
                return "complex", self.settings.large_model, "forced_by_client:complex"
            elif f_lower in ("small", "simple"):
                return "simple", self.settings.small_model, "forced_by_client:simple"

        route, reason = evaluate_query_complexity(query)
        target_model = self.settings.large_model if route == "complex" else self.settings.small_model

        return route, target_model, reason

    def execute_and_escalate(
        self,
        query: str,
        force_route: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> Tuple[LLMResult, str, bool, Optional[str]]:
        """
        Executes query on routed model, evaluates response quality,
        and escalates to the large model if the small-model output is weak.

        Returns: (llm_result, final_route, escalated, escalation_reason)
        """
        route, initial_model, routing_reason = self.route_query(query, force_route)
        logger.info(f"Initial routing decision: route='{route}', model='{initial_model}', reason='{routing_reason}'")

        # 1. Initial generation
        result = self.llm.generate(
            prompt=query,
            model=initial_model,
            system_prompt=system_prompt,
        )

        # 2. Check for escalation if initial route was 'simple' (small model)
        escalated = False
        escalation_reason = None

        if route == "simple":
            is_weak, reason = evaluate_response_quality(query, result.text)
            if is_weak:
                escalated = True
                escalation_reason = reason
                logger.warning(
                    f"Small model output identified as weak ({reason}). Escalating to Large Model '{self.settings.large_model}'"
                )

                # Escalate to Large Model
                escalated_result = self.llm.generate(
                    prompt=query,
                    model=self.settings.large_model,
                    system_prompt=system_prompt,
                )

                # Total tokens and cost include both attempts for full transparency
                total_in = result.input_tokens + escalated_result.input_tokens
                total_out = result.output_tokens + escalated_result.output_tokens
                combined_cost = round(result.cost + escalated_result.cost, 6)
                combined_latency = round(result.latency_ms + escalated_result.latency_ms, 2)

                result = LLMResult(
                    text=escalated_result.text,
                    model=self.settings.large_model,
                    input_tokens=total_in,
                    output_tokens=total_out,
                    total_tokens=total_in + total_out,
                    latency_ms=combined_latency,
                    cost=combined_cost,
                )
                route = "escalated"

        return result, route, escalated, escalation_reason


router = CostAwareRouter()
