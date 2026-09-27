from typing import Dict, Any, Tuple
from backend.app.models.base import ModelTier
from backend.app.analyzer.prompt_analyzer import PromptAnalysisResult
from backend.app.core.config import get_settings


class RoutingPolicy:
    """
    Computes tier utility using the objective function:
    Utility = Quality - lambda_latency * ExpectedLatency - lambda_compute * ExpectedCompute
    """

    def __init__(self):
        self.settings = get_settings()
        self.lambda_lat = self.settings.routing_lambda_latency
        self.lambda_compute = self.settings.routing_lambda_compute

    def evaluate_utility(
        self,
        predicted_quality: float,
        expected_latency_ms: float,
        expected_tokens: int
    ) -> float:
        """Utility calculation penalizing latency and compute."""
        utility = predicted_quality - (self.lambda_lat * expected_latency_ms) - (self.lambda_compute * expected_tokens)
        return round(utility, 4)

    def rule_based_selection(self, analysis: PromptAnalysisResult) -> Tuple[ModelTier, float, str]:
        """
        Intelligent IDE & Agent task router:
        - Complex Backend architecture / security / database / hard debugging -> Large Tier
        - Frontend UI / components / CSS / moderate code -> Medium Tier
        - Low complexity / simple syntax / docstrings / git / terminal / factual -> Small Tier
        """
        features = analysis.features
        complexity = analysis.complexity_score
        prompt_lower = analysis.prompt.lower()

        # Keywords for Backend Architecture, Security, Database, Concurrency
        is_backend_complex = any(
            k in prompt_lower for k in [
                "architecture", "database schema", "relational", "concurrency", "thread-safe",
                "jwt", "cryptograph", "microservice", "distributed", "transaction isolation",
                "race condition", "memory leak", "deadlock", "sql injection", "authorization"
            ]
        )
        # Keywords for Stack trace / Crash debugging
        is_hard_debugging = any(
            k in prompt_lower for k in [
                "traceback (most recent call last)", "segmentation fault", "nullpointerexception",
                "stack trace", "fatal error", "core dumped", "unhandled exception"
            ]
        )
        # Keywords for Frontend UI / Styling
        is_frontend = any(
            k in prompt_lower for k in [
                "react", "vue", "tailwind", "css", "html", "jsx", "tsx", "button", "modal",
                "navbar", "ui component", "flexbox", "grid", "styling", "frontend", "form layout"
            ]
        )
        # Keywords for Lightweight / Low complexity tasks
        is_lightweight_task = any(
            k in prompt_lower for k in [
                "rename variable", "add docstring", "add comment", "git commit", "bash command",
                "regex to", "explain syntax", "format json", "what does this mean", "typo"
            ]
        ) or (len(prompt_lower.split()) < 15 and not features.has_reasoning and not is_backend_complex and not is_hard_debugging)

        # 1. High Complexity / Backend Architecture / Critical Debugging -> LARGE Tier
        if is_backend_complex or is_hard_debugging or features.has_reasoning or (features.has_math and complexity > 0.6) or complexity >= 0.70:
            reason = "Selected Large Tier: Task requires advanced backend architecture, complex multi-step reasoning, or deep debugging."
            if is_backend_complex:
                reason = "Selected Large Tier: Backend architecture, database schema, or security logic detected."
            elif is_hard_debugging:
                reason = "Selected Large Tier: Critical crash or stack trace debugging detected."
            return (ModelTier.LARGE, 0.92, reason)

        # 2. Frontend UI / Standard Code / Moderate Complexity -> MEDIUM Tier
        elif is_frontend or (features.has_code and not is_lightweight_task) or features.has_summarization or features.has_structured_data or complexity >= 0.35:
            reason = "Selected Medium Tier: Frontend UI component, styling, or standard coding task."
            if is_frontend:
                reason = "Selected Medium Tier: Frontend UI/React/CSS design task routed to fast, efficient code model."
            return (ModelTier.MEDIUM, 0.90, reason)

        # 3. Low Complexity / Simple Queries / Lightweight Edits -> SMALL Tier
        else:
            return (
                ModelTier.SMALL,
                0.94,
                "Selected Small Tier: Low-complexity task, simple edit, docstring, or factual query offloaded to zero-cost/fast tier."
            )
