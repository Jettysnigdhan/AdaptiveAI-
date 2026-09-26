import os
import joblib
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from backend.app.models.base import ModelTier
from backend.app.analyzer.prompt_analyzer import PromptAnalysisResult
from backend.app.models.registry import registry
from backend.app.router.routing_policy import RoutingPolicy
from backend.app.core.config import get_settings
from backend.app.core.logging import logger

MODEL_DIR = Path("./ml/models/trained")
MODEL_FILE = MODEL_DIR / "router_model.joblib"


class RoutingDecision(BaseModel):
    """Result of the model router's decision."""
    selected_tier: ModelTier
    selected_model: str
    confidence: float = Field(description="Confidence in routing choice [0.0 - 1.0]")
    policy_name: str = Field(description="Policy or ML model used ('ml_classifier', 'utility_optimizer', 'rule_baseline')")
    predicted_qualities: Dict[str, float] = Field(default_factory=dict, description="P(quality | prompt, tier)")
    explanation: str = Field(description="Human-readable decision rationale")


class ModelRouter:
    """Intelligent ML and utility-based routing engine."""

    def __init__(self):
        self.settings = get_settings()
        self.policy = RoutingPolicy()
        self._ml_model = None
        self._load_trained_model()

    def _load_trained_model(self):
        """Load trained scikit-learn/XGBoost classifier if saved on disk."""
        if MODEL_FILE.exists():
            try:
                self._ml_model = joblib.load(MODEL_FILE)
                logger.info(f"Loaded trained ML router weights from {MODEL_FILE}")
            except Exception as e:
                logger.warning(f"Could not load ML router checkpoint ({e}). Using utility policy.")
                self._ml_model = None
        else:
            self._ml_model = None

    def route(self, analysis: PromptAnalysisResult, force_policy: Optional[str] = None) -> RoutingDecision:
        """Route prompt to the minimum sufficient model tier."""
        threshold = self.settings.quality_threshold

        # 1. If explicit rule baseline requested
        if force_policy == "rule":
            tier, conf, explanation = self.policy.rule_based_selection(analysis)
            target_model = registry.get_default_model_for_tier(tier)
            model_name = target_model.model_name if target_model else self.settings.model_small
            return RoutingDecision(
                selected_tier=tier,
                selected_model=model_name,
                confidence=conf,
                policy_name="rule_baseline",
                predicted_qualities={tier.value: conf},
                explanation=explanation,
            )

        # 2. ML Classifier Prediction if trained
        if self._ml_model is not None and force_policy != "utility":
            try:
                feature_vec = [analysis.get_full_feature_vector()]
                preds = self._ml_model.predict_proba(feature_vec)[0]
                classes = self._ml_model.classes_  # e.g. ['small', 'medium', 'large']

                qualities = {c: float(p) for c, p in zip(classes, preds)}
                # Pick lowest tier with quality >= threshold
                tier_order = [ModelTier.SMALL, ModelTier.MEDIUM, ModelTier.LARGE]
                chosen_tier = ModelTier.LARGE
                for t in tier_order:
                    if qualities.get(t.value, 0.0) >= threshold:
                        chosen_tier = t
                        break

                target_model = registry.get_default_model_for_tier(chosen_tier)
                model_name = target_model.model_name if target_model else ""
                conf = qualities.get(chosen_tier.value, 0.85)

                return RoutingDecision(
                    selected_tier=chosen_tier,
                    selected_model=model_name,
                    confidence=round(conf, 3),
                    policy_name="ml_classifier",
                    predicted_qualities={k: round(v, 3) for k, v in qualities.items()},
                    explanation=(
                        f"ML Router selected {chosen_tier.value.upper()} tier (confidence: {conf*100:.1f}%): "
                        f"Predicted quality satisfies threshold {threshold:.2f} with minimal latency."
                    ),
                )
            except Exception as e:
                logger.warning(f"ML router inference failed: {e}. Falling back to utility policy.")

        # 3. Dynamic Utility Optimizer
        complexity = analysis.complexity_score
        pred_q_small = max(0.40, min(0.98, 0.95 - (complexity * 0.70)))
        pred_q_medium = max(0.60, min(0.98, 0.96 - (complexity * 0.35)))
        pred_q_large = max(0.85, min(0.99, 0.98 - (complexity * 0.08)))

        predicted_qualities = {
            ModelTier.SMALL.value: round(pred_q_small, 3),
            ModelTier.MEDIUM.value: round(pred_q_medium, 3),
            ModelTier.LARGE.value: round(pred_q_large, 3),
        }

        # Select minimum tier meeting threshold
        if pred_q_small >= threshold:
            selected_tier = ModelTier.SMALL
            rationale = (
                f"Router selected the Small tier because the prompt was classified as a low-complexity "
                f"informational task ({analysis.detected_category}) and predicted quality ({pred_q_small:.2f}) "
                f"exceeds threshold {threshold:.2f}."
            )
        elif pred_q_medium >= threshold:
            selected_tier = ModelTier.MEDIUM
            rationale = (
                f"Router selected the Medium tier because task complexity ({complexity:.2f}) requires "
                f"intermediate capabilities ({analysis.detected_category}), and predicted quality ({pred_q_medium:.2f}) "
                f"meets threshold {threshold:.2f}."
            )
        else:
            selected_tier = ModelTier.LARGE
            rationale = (
                f"Router selected the Large tier because task complexity ({complexity:.2f}) in "
                f"{analysis.detected_category} exceeds small/medium confidence thresholds."
            )

        target_model = registry.get_default_model_for_tier(selected_tier)
        model_name = target_model.model_name if target_model else self.settings.model_small

        return RoutingDecision(
            selected_tier=selected_tier,
            selected_model=model_name,
            confidence=round(predicted_qualities[selected_tier.value], 3),
            policy_name="utility_optimizer",
            predicted_qualities=predicted_qualities,
            explanation=rationale,
        )


router = ModelRouter()
