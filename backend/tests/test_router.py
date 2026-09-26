import pytest
from backend.app.router.model_router import router, ModelRouter
from backend.app.router.routing_policy import RoutingPolicy
from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.models.base import ModelTier


def test_rule_baseline_routing():
    policy = RoutingPolicy()
    simple_analysis = analyzer.analyze("What is the capital of Italy?")
    tier, conf, explanation = policy.rule_based_selection(simple_analysis)
    assert tier == ModelTier.SMALL

    complex_analysis = analyzer.analyze("Prove by induction that 1 + 2 + ... + n = n(n+1)/2 with rigorous steps")
    tier_c, conf_c, _ = policy.rule_based_selection(complex_analysis)
    assert tier_c == ModelTier.LARGE


def test_router_predictions():
    analysis = analyzer.analyze("Implement binary search in Python")
    decision = router.route(analysis)
    assert decision.selected_tier in (ModelTier.SMALL, ModelTier.MEDIUM, ModelTier.LARGE)
    assert decision.confidence > 0.0
    assert len(decision.explanation) > 10
