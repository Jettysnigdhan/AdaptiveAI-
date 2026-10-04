"""Unit tests for deterministic router, cost computation, and quality escalation."""

import pytest
from app.routing.router import CostAwareRouter
from app.routing.rules import evaluate_query_complexity, evaluate_response_quality
from app.config import get_settings


@pytest.fixture
def router():
    return CostAwareRouter()


@pytest.fixture
def settings():
    return get_settings()


def test_simple_routing_decision(router):
    """Tests that short or factual queries map to the simple route (small model)."""
    route, model, reason = router.route_query("What is 2 + 2?")
    assert route == "simple"
    assert "short_query" in reason or "simple_pattern" in reason

    route2, _, _ = router.route_query("Capital of France")
    assert route2 == "simple"


def test_complex_routing_decision(router):
    """Tests that queries containing complexity keywords map to complex route (large model)."""
    route, model, reason = router.route_query("Explain the CAP theorem in distributed systems")
    assert route == "complex"
    assert "complexity_keyword:explain" in reason

    route2, _, reason2 = router.route_query("Design an end-to-end architecture for real-time fraud detection")
    assert route2 == "complex"
    assert "complexity_keyword" in reason2

    route3, _, reason3 = router.route_query("Compare synchronous and asynchronous programming paradigms")
    assert route3 == "complex"
    assert "complexity_keyword:compare" in reason3


def test_forced_routing_override(router, settings):
    """Tests that client force_route overrides rule evaluation."""
    route, model, reason = router.route_query("Explain quicksort", force_route="small")
    assert route == "simple"
    assert model == settings.small_model
    assert "forced_by_client:simple" in reason

    route2, model2, reason2 = router.route_query("2+2", force_route="large")
    assert route2 == "complex"
    assert model2 == settings.large_model
    assert "forced_by_client:complex" in reason2


def test_quality_escalation_detection():
    """Tests heuristic detection of weak responses."""
    # Weak responses that should trigger escalation
    is_weak, reason = evaluate_response_quality("What is TCP?", "I don't know the answer.")
    assert is_weak is True
    assert "weak_phrase" in reason

    is_weak2, reason2 = evaluate_response_quality("Write a python function to sort", "Here is your answer.")
    assert is_weak2 is True
    assert reason2 == "missing_expected_code_block"

    is_weak3, reason3 = evaluate_response_quality("What is DNS?", "")
    assert is_weak3 is True
    assert reason3 == "empty_answer"

    # Strong response that should not escalate
    good_answer = "TCP (Transmission Control Protocol) is a reliable, connection-oriented transport layer protocol."
    is_weak_good, _ = evaluate_response_quality("What is TCP?", good_answer)
    assert is_weak_good is False


def test_cost_calculation(settings):
    """Verifies that cost calculation correctly prices small vs large models."""
    # 1000 input tokens, 500 output tokens
    small_cost = settings.calculate_cost(settings.small_model, 1000, 500)
    expected_small = (1000 * settings.small_model_input_price) + (500 * settings.small_model_output_price)
    assert small_cost == round(expected_small, 6)

    large_cost = settings.calculate_cost(settings.large_model, 1000, 500)
    expected_large = (1000 * settings.large_model_input_price) + (500 * settings.large_model_output_price)
    assert large_cost == round(expected_large, 6)

    # Large model must cost more than small model
    assert large_cost > small_cost
