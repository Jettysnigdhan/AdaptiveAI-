"""End-to-end inference pipeline integrating Cache, Router, LLM, and SQLite Logging."""

import time
import logging
from typing import Optional, Dict, Any

from app.schemas import AnswerRequest, AnswerResponse
from app.cache.semantic_cache import semantic_cache
from app.routing.router import router
from app.database.logger import db_logger
from app.config import get_settings

logger = logging.getLogger("semantic_router.pipeline")


class InferencePipeline:
    """Coordinates semantic caching, cost-aware model routing, quality evaluation, and logging."""

    def __init__(self):
        self.settings = get_settings()
        self.cache = semantic_cache
        self.router = router
        self.db = db_logger

    def calculate_quality_score(self, query: str, answer: str) -> float:
        """Heuristic quality scoring based on length, structure, and content adequacy."""
        if not answer or not answer.strip():
            return 0.0

        length = len(answer.strip())
        score = 0.50

        # Length adequacy bonus
        if length > 40:
            score += 0.20
        if length > 120:
            score += 0.15

        # Structural bonuses (formatting, punctuation, lists)
        if any(marker in answer for marker in [":", "\n-", "\n*", "1.", "```"]):
            score += 0.10

        # Relevancy overlap check
        q_words = set(query.lower().split())
        ans_words = set(answer.lower().split())
        overlap = len(q_words.intersection(ans_words))
        if overlap >= 2:
            score += 0.05

        return round(min(1.0, score), 3)

    def process_query(self, request: AnswerRequest) -> AnswerResponse:
        """
        Processes a user query:
        1. Check Semantic Cache
        2. If hit -> Return cached answer ($0.0 cost, sub-second latency)
        3. If miss -> Route query to optimal tier (Small vs Large)
        4. Escalate if small model answer is weak
        5. Store valid completion into Semantic Cache
        6. Persist request audit telemetry to SQLite
        """
        start_time = time.perf_counter()
        query = request.query.strip()

        # ---------------------------------------------------------
        # Step 1: Semantic Cache Lookup
        # ---------------------------------------------------------
        # If client explicitly forced a route (e.g. debugging), bypass cache
        cached_result = None
        if not request.force_route:
            cached_result = self.cache.search_cache(query)

        if cached_result:
            latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
            answer = cached_result["answer"]
            quality_score = self.calculate_quality_score(query, answer)

            # Log cache hit
            self.db.log_request(
                query=query,
                model="cache",
                route="cache",
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
                cost=0.0,
                latency_ms=latency_ms,
                cache_hit=True,
                escalated=False,
                quality_score=quality_score,
                answer=answer,
            )

            return AnswerResponse(
                answer=answer,
                model="cache",
                route="cache",
                cache_hit=True,
                latency_ms=latency_ms,
                cost=0.0,
                quality_score=quality_score,
                escalated=False,
                input_tokens=0,
                output_tokens=0,
                total_tokens=0,
            )

        # ---------------------------------------------------------
        # Step 2: Cost-Aware Routing & Execution
        # ---------------------------------------------------------
        llm_result, route_taken, escalated, escalation_reason = self.router.execute_and_escalate(
            query=query,
            force_route=request.force_route,
        )

        total_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        quality_score = self.calculate_quality_score(query, llm_result.text)

        # ---------------------------------------------------------
        # Step 3: Populate Semantic Cache
        # ---------------------------------------------------------
        # Cache valid answers (non-empty, non-error, passing safety guards)
        if quality_score >= 0.50:
            self.cache.store_cache(query=query, answer=llm_result.text)

        # ---------------------------------------------------------
        # Step 4: Persist Request Telemetry in SQLite
        # ---------------------------------------------------------
        self.db.log_request(
            query=query,
            model=llm_result.model,
            route=route_taken,
            input_tokens=llm_result.input_tokens,
            output_tokens=llm_result.output_tokens,
            total_tokens=llm_result.total_tokens,
            cost=llm_result.cost,
            latency_ms=total_latency_ms,
            cache_hit=False,
            escalated=escalated,
            escalation_reason=escalation_reason,
            quality_score=quality_score,
            answer=llm_result.text,
        )

        return AnswerResponse(
            answer=llm_result.text,
            model=llm_result.model,
            route=route_taken,
            cache_hit=False,
            latency_ms=total_latency_ms,
            cost=llm_result.cost,
            quality_score=quality_score,
            escalated=escalated,
            escalation_reason=escalation_reason,
            input_tokens=llm_result.input_tokens,
            output_tokens=llm_result.output_tokens,
            total_tokens=llm_result.total_tokens,
        )


pipeline = InferencePipeline()
