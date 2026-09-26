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
        Rule-based baseline router using heuristic signals:
        - High reasoning / complex math -> Large
        - Coding / summarization / moderate complexity -> Medium
        - Factual lookup / simple prompt -> Small
        """
        features = analysis.features
        complexity = analysis.complexity_score

        if features.has_reasoning or (features.has_math and complexity > 0.6) or complexity >= 0.70:
            return (
                ModelTier.LARGE,
                0.85,
                "Rule baseline selected Large tier: Prompt contains complex reasoning, advanced math, or high multi-step complexity."
            )
        elif features.has_code or features.has_summarization or features.has_structured_data or complexity >= 0.35:
            return (
                ModelTier.MEDIUM,
                0.88,
                "Rule baseline selected Medium tier: Prompt involves code, structured data, or moderate algorithmic logic."
            )
        else:
            return (
                ModelTier.SMALL,
                0.92,
                "Rule baseline selected Small tier: Prompt classified as standard factual query or low-complexity task."
            )
