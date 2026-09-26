import pytest
import asyncio
from backend.app.evaluator.validators import ResponseValidators
from backend.app.evaluator.quality_evaluator import QualityEvaluator


def test_empty_validator():
    assert ResponseValidators.is_empty_or_whitespace("") is True
    assert ResponseValidators.is_empty_or_whitespace("   \n\t") is True
    assert ResponseValidators.is_empty_or_whitespace("Paris") is False


def test_repetition_validator():
    repetitive_text = "word word word word word word word word word word word word word word word word word word word word "
    is_loop, ratio = ResponseValidators.check_repetition_loop(repetitive_text)
    assert is_loop is True
    assert ratio > 0.45


@pytest.mark.asyncio
async def test_quality_evaluator_empty():
    evaluator = QualityEvaluator(quality_threshold=0.82)
    res = await evaluator.evaluate("Hello", "")
    assert res.passed is False
    assert res.quality_score == 0.0


@pytest.mark.asyncio
async def test_quality_evaluator_valid():
    evaluator = QualityEvaluator(quality_threshold=0.82)
    res = await evaluator.evaluate(
        prompt="What is 2+2?",
        response_text="2 + 2 equals 4.",
        completion_tokens=6,
        finish_reason="stop"
    )
    assert res.passed is True
    assert res.quality_score >= 0.82
