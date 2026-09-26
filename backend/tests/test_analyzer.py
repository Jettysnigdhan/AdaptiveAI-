import pytest
from backend.app.analyzer.feature_extractor import FeatureExtractor
from backend.app.analyzer.prompt_analyzer import analyzer


def test_feature_extractor_code():
    extractor = FeatureExtractor()
    features = extractor.extract("def fibonacci(n): return n if n <= 1 else fib(n-1) + fib(n-2)")
    assert features.has_code == 1
    assert features.complexity_indicator > 0.3


def test_feature_extractor_math():
    extractor = FeatureExtractor()
    features = extractor.extract("Calculate the derivative of f(x) = 3x^2 + 5x - 7")
    assert features.has_math == 1


def test_feature_extractor_factual():
    extractor = FeatureExtractor()
    features = extractor.extract("What is the capital of Spain?")
    assert features.has_code == 0
    assert features.has_math == 0
    assert features.complexity_indicator <= 0.35


def test_prompt_analyzer_embedding():
    res = analyzer.analyze("Explain machine learning in simple terms")
    assert len(res.embedding) == 384
    assert res.detected_category in ("general", "factual_qa")
    assert len(res.get_full_feature_vector()) == 384 + 11
