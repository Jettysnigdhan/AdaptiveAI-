"""
Automated Test Runner for AdaptiveRoute using Python unittest.
"""

import sys
import unittest
import asyncio
from pathlib import Path

# Ensure root workspace is on python sys.path
root_dir = Path(__file__).resolve().parents[2]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.analyzer.feature_extractor import FeatureExtractor
from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.router.routing_policy import RoutingPolicy
from backend.app.router.model_router import router
from backend.app.models.base import ModelTier
from backend.app.evaluator.validators import ResponseValidators
from backend.app.evaluator.quality_evaluator import QualityEvaluator
from backend.app.core.config import get_settings


class TestAnalyzer(unittest.TestCase):
    def test_feature_extractor_code(self):
        extractor = FeatureExtractor()
        features = extractor.extract("def fibonacci(n): return n if n <= 1 else fib(n-1) + fib(n-2)")
        self.assertEqual(features.has_code, 1)
        self.assertGreater(features.complexity_indicator, 0.3)

    def test_feature_extractor_math(self):
        extractor = FeatureExtractor()
        features = extractor.extract("Calculate the derivative of f(x) = 3x^2 + 5x - 7")
        self.assertEqual(features.has_math, 1)

    def test_feature_extractor_factual(self):
        extractor = FeatureExtractor()
        features = extractor.extract("What is the capital of Spain?")
        self.assertEqual(features.has_code, 0)
        self.assertEqual(features.has_math, 0)
        self.assertLessEqual(features.complexity_indicator, 0.35)

    def test_prompt_analyzer_embedding(self):
        res = analyzer.analyze("Explain machine learning in simple terms")
        self.assertEqual(len(res.embedding), 384)
        self.assertIn(res.detected_category, ("general", "factual_qa"))
        self.assertEqual(len(res.get_full_feature_vector()), 384 + 11)


class TestRouter(unittest.TestCase):
    def test_rule_baseline(self):
        policy = RoutingPolicy()
        simple_res = analyzer.analyze("What is the capital of Italy?")
        tier, conf, explanation = policy.rule_based_selection(simple_res)
        self.assertEqual(tier, ModelTier.SMALL)

        complex_res = analyzer.analyze("Prove by induction that 1 + 2 + ... + n = n(n+1)/2 with rigorous steps")
        tier_c, conf_c, _ = policy.rule_based_selection(complex_res)
        self.assertEqual(tier_c, ModelTier.LARGE)

    def test_router_prediction(self):
        analysis = analyzer.analyze("Implement binary search in Python")
        decision = router.route(analysis)
        self.assertIn(decision.selected_tier, (ModelTier.SMALL, ModelTier.MEDIUM, ModelTier.LARGE))
        self.assertGreater(decision.confidence, 0.0)
        self.assertGreater(len(decision.explanation), 10)


class TestEvaluator(unittest.TestCase):
    def test_empty_validator(self):
        self.assertTrue(ResponseValidators.is_empty_or_whitespace(""))
        self.assertTrue(ResponseValidators.is_empty_or_whitespace("   \n\t"))
        self.assertFalse(ResponseValidators.is_empty_or_whitespace("Paris"))

    def test_repetition_validator(self):
        repetitive_text = "word word word word word word word word word word word word word word word word word word word word "
        is_loop, ratio = ResponseValidators.check_repetition_loop(repetitive_text)
        self.assertTrue(is_loop)
        self.assertGreater(ratio, 0.45)

    def test_quality_evaluator(self):
        evaluator = QualityEvaluator(quality_threshold=0.82)
        res_empty = asyncio.run(evaluator.evaluate("Hello", ""))
        self.assertFalse(res_empty.passed)
        self.assertEqual(res_empty.quality_score, 0.0)

        res_valid = asyncio.run(evaluator.evaluate("What is 2+2?", "2 + 2 equals 4.", completion_tokens=6))
        self.assertTrue(res_valid.passed)
        self.assertGreaterEqual(res_valid.quality_score, 0.82)


class TestConfig(unittest.TestCase):
    def test_settings_loaded(self):
        settings = get_settings()
        self.assertEqual(settings.app_name, "AdaptiveRoute")
        self.assertIsNotNone(settings.groq_api_key)
        self.assertIn(settings.active_provider, ("groq", "ollama", "hybrid"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
