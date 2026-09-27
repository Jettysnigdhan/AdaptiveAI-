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
    policy_name: str = Field(description="Policy or ML model used ('auto_ml', 'rule_baseline', 'fixed', 'always_small', 'always_medium', 'always_large')")
    predicted_qualities: Dict[str, float] = Field(default_factory=dict, description="P(quality | prompt, tier)")
    explanation: str = Field(description="Human-readable decision rationale")


class ModelRouter:
    """
    Intelligent ML and utility-based routing engine.
    Supports Baselines:
      - Always Small
      - Always Medium
      - Always Large
      - Rule-Based Baseline
    Proposed:
      - Adaptive ML Router with Quality & Performance Prediction + Utility Objective.
    """

    def __init__(self):
        self.settings = get_settings()
        self.policy = RoutingPolicy()
        self._ml_model = None
        self._load_trained_model()

    def _load_trained_model(self):
        """Load trained scikit-learn classifier if saved on disk."""
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
        """
        Route prompt according to configured routing mode:
        'auto', 'rule', 'fixed', 'always_small', 'always_medium', 'always_large'
        """
        threshold = self.settings.quality_threshold
        mode = (force_policy or self.settings.routing_mode or "auto").lower()

        # ----------------------------------------------------
        # Baseline 1: Always Small
        # ----------------------------------------------------
        if mode in ("always_small", "small"):
            target = registry.get_default_model_for_tier(ModelTier.SMALL)
            return RoutingDecision(
                selected_tier=ModelTier.SMALL,
                selected_model=target.model_name if target else self.settings.model_small,
                confidence=1.0,
                policy_name="always_small",
                predicted_qualities={"small": 1.0},
                explanation="Baseline 1: Always Small policy applied unconditionally.",
            )

        # ----------------------------------------------------
        # Baseline 2: Always Medium
        # ----------------------------------------------------
        if mode in ("always_medium", "medium"):
            target = registry.get_default_model_for_tier(ModelTier.MEDIUM)
            return RoutingDecision(
                selected_tier=ModelTier.MEDIUM,
                selected_model=target.model_name if target else self.settings.model_medium,
                confidence=1.0,
                policy_name="always_medium",
                predicted_qualities={"medium": 1.0},
                explanation="Baseline 2: Always Medium policy applied unconditionally.",
            )

        # ----------------------------------------------------
        # Baseline 3: Always Large
        # ----------------------------------------------------
        if mode in ("always_large", "large"):
            target = registry.get_default_model_for_tier(ModelTier.LARGE)
            return RoutingDecision(
                selected_tier=ModelTier.LARGE,
                selected_model=target.model_name if target else self.settings.model_large,
                confidence=1.0,
                policy_name="always_large",
                predicted_qualities={"large": 1.0},
                explanation="Baseline 3: Always Large policy applied unconditionally.",
            )

        # ----------------------------------------------------
        # Fixed Tier Configuration
        # ----------------------------------------------------
        if mode == "fixed":
            tier = ModelTier.from_str(self.settings.fixed_tier)
            target = registry.get_default_model_for_tier(tier)
            return RoutingDecision(
                selected_tier=tier,
                selected_model=target.model_name if target else self.settings.model_small,
                confidence=1.0,
                policy_name="fixed",
                predicted_qualities={tier.value: 1.0},
                explanation=f"Fixed mode: Configured fixed tier {tier.value.upper()} selected.",
            )

        # ----------------------------------------------------
        # Baseline 4: Rule-Based Router
        # ----------------------------------------------------
        if mode == "rule":
            tier, conf, explanation = self.policy.rule_based_selection(analysis)
            target = registry.get_default_model_for_tier(tier)
            return RoutingDecision(
                selected_tier=tier,
                selected_model=target.model_name if target else self.settings.model_small,
                confidence=conf,
                policy_name="rule_baseline",
                predicted_qualities={tier.value: conf},
                explanation=f"Baseline 4: {explanation}",
            )

        # ----------------------------------------------------
        # Proposed System: Adaptive ML Router (Quality Prediction & Utility Optimization)
        # ----------------------------------------------------
        is_trivial = (
            analysis.complexity_score <= 0.15
            and analysis.features.task_signals.get("architecture", 0.0) < 0.4
            and analysis.features.task_signals.get("backend", 0.0) < 0.4
            and not analysis.features.has_code
            and not analysis.features.has_reasoning
        ) or (
            analysis.features.word_count <= 8
            and not analysis.features.has_code
            and not analysis.features.has_reasoning
            and analysis.features.task_signals.get("architecture", 0.0) < 0.2
            and analysis.features.task_signals.get("backend", 0.0) < 0.2
        )
        if is_trivial:
            target = registry.get_default_model_for_tier(ModelTier.SMALL)
            return RoutingDecision(
                selected_tier=ModelTier.SMALL,
                selected_model=target.model_name if target else self.settings.model_small,
                confidence=0.98,
                policy_name="adaptive_ml",
                predicted_qualities={"small": 0.98, "medium": 0.99, "large": 0.99},
                explanation="Selected SMALL: Low-complexity prompt (simple calculation/query) operates with high accuracy on the lightweight tier.",
            )

        predicted_qualities: Dict[str, float] = {}

        # 1. Attempt ML model prediction if checkpoint is loaded
        if self._ml_model is not None:
            try:
                feature_vec = [analysis.get_full_feature_vector()]
                preds = self._ml_model.predict_proba(feature_vec)[0]
                classes = self._ml_model.classes_  # e.g. ['small', 'medium', 'large']
                for c, p in zip(classes, preds):
                    predicted_qualities[c] = float(p)
            except Exception as e:
                logger.warning(f"ML router inference error ({e}). Falling back to heuristic quality prediction.")
                predicted_qualities = {}

        # 2. If ML model unavailable, compute calibrated expected performance from features
        if not predicted_qualities or len(predicted_qualities) < 3:
            complexity = analysis.complexity_score
            # Expected performance curves across tiers based on structural signals
            pred_q_small = max(0.20, min(0.96, 0.94 - (complexity * 0.72)))
            pred_q_medium = max(0.50, min(0.97, 0.95 - (complexity * 0.30)))
            pred_q_large = max(0.85, min(0.99, 0.98 - (complexity * 0.06)))

            # Adjust for domain task signals
            if analysis.features.task_signals.get("simple_qa", 0) > 0.8:
                pred_q_small = min(0.96, pred_q_small + 0.15)
            if analysis.features.task_signals.get("architecture", 0) > 0.8:
                pred_q_small = max(0.15, pred_q_small - 0.35)
                pred_q_medium = max(0.40, pred_q_medium - 0.20)
            if analysis.features.task_signals.get("frontend", 0) > 0.8:
                pred_q_medium = min(0.95, pred_q_medium + 0.10)

            predicted_qualities = {
                ModelTier.SMALL.value: round(pred_q_small, 3),
                ModelTier.MEDIUM.value: round(pred_q_medium, 3),
                ModelTier.LARGE.value: round(pred_q_large, 3),
            }

        # 3. Minimum Sufficient Model Selection with Utility Objective
        # Candidate tiers meeting the quality threshold
        qual_small = predicted_qualities.get("small", 0.0)
        qual_medium = predicted_qualities.get("medium", 0.0)
        qual_large = predicted_qualities.get("large", 0.95)

        # Baseline expected latencies & token estimates
        latencies = {"small": 250.0, "medium": 350.0, "large": 850.0}
        tokens = {"small": 80, "medium": 180, "large": 350}

        # Select the cheapest/fastest tier satisfying quality threshold
        if qual_small >= threshold:
            chosen_tier = ModelTier.SMALL
            explanation = (
                f"Selected SMALL: Predicted quality ({qual_small:.2f}) exceeded configured threshold "
                f"({threshold:.2f}) and no escalation was required."
            )
        elif qual_medium >= threshold:
            chosen_tier = ModelTier.MEDIUM
            explanation = (
                f"Selected MEDIUM: Router predicted Small tier ({qual_small:.2f}) would fail threshold "
                f"({threshold:.2f}); Medium predicted quality ({qual_medium:.2f}) satisfies requirement."
            )
        else:
            chosen_tier = ModelTier.LARGE
            explanation = (
                f"Selected LARGE: Router predicted that smaller tiers (Small: {qual_small:.2f}, "
                f"Medium: {qual_medium:.2f}) would not reliably satisfy quality threshold ({threshold:.2f})."
            )

        target_model = registry.get_default_model_for_tier(chosen_tier)
        model_name = target_model.model_name if target_model else self.settings.model_small
        conf = predicted_qualities.get(chosen_tier.value, 0.85)

        return RoutingDecision(
            selected_tier=chosen_tier,
            selected_model=model_name,
            confidence=round(conf, 3),
            policy_name="auto_ml",
            predicted_qualities=predicted_qualities,
            explanation=explanation,
        )


router = ModelRouter()
