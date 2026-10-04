"""
Unit tests for the Quality Evaluator to ensure consistent scoring.
"""
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    import pytest
except ImportError:
    class _MockPytest:
        class mark:
            @staticmethod
            def asyncio(f):
                return f
    pytest = _MockPytest()

import asyncio
from backend.app.evaluator.quality_evaluator import QualityEvaluator


class TestQualityEvaluator:
    """Test suite for quality evaluation logic."""

    @pytest.mark.asyncio
    async def test_simple_qa_gets_reasonable_score(self):
        """Simple factual questions should get decent scores."""
        evaluator = QualityEvaluator(quality_threshold=0.82)
        result = await evaluator.evaluate(
            prompt="What is the capital of Japan?",
            response_text="The capital of Japan is Tokyo.",
            completion_tokens=10
        )
        assert result.quality_score > 0.7
        assert result.quality_score <= 1.0
        print(f"Simple QA score: {result.quality_score}")

    @pytest.mark.asyncio
    async def test_architecture_question_not_penalized(self):
        """Architecture/system design questions should not get 0 scores."""
        evaluator = QualityEvaluator(quality_threshold=0.82)

        # Good architecture answer
        good_response = """
        For a real-time fraud detection system handling 50k transactions/sec:
        1. Use Kafka for event streaming to handle high throughput
        2. Implement microservices for fraud detection logic
        3. Use Redis for caching transaction patterns
        4. Add API gateway for request routing
        5. Implement circuit breakers for fault tolerance
        """

        result = await evaluator.evaluate(
            prompt="Design an end-to-end event-driven architecture for a real-time fraud detection banking platform handling 50k transactions/sec.",
            response_text=good_response,
            completion_tokens=150
        )
        assert result.quality_score > 0.5, f"Architecture answer scored too low: {result.quality_score}"
        print(f"Good architecture answer score: {result.quality_score}")

    @pytest.mark.asyncio
    async def test_code_generation_gets_proper_score(self):
        """Code generation questions should be evaluated properly."""
        evaluator = QualityEvaluator(quality_threshold=0.82)

        good_code_response = """
        ```python
        def is_palindrome(s: str) -> bool:
            \"\"\"Check if a string is a palindrome.\"\"\"
            s = s.lower().replace(" ", "")
            return s == s[::-1]

        # Example usage:
        print(is_palindrome("racecar"))  # True
        print(is_palindrome("hello"))    # False
        ```
        """

        result = await evaluator.evaluate(
            prompt="Write a Python function to check if a string is a palindrome.",
            response_text=good_code_response,
            completion_tokens=100
        )
        assert result.quality_score > 0.6, f"Good code answer scored too low: {result.quality_score}"
        print(f"Good code answer score: {result.quality_score}")

    @pytest.mark.asyncio
    async def test_empty_response_gets_zero_score(self):
        """Empty responses should get minimal scores."""
        evaluator = QualityEvaluator(quality_threshold=0.82)
        result = await evaluator.evaluate(
            prompt="What is 2+2?",
            response_text="",
            completion_tokens=0
        )
        assert result.quality_score < 0.1
        assert result.passed == False
        print(f"Empty response score: {result.quality_score}")

    @pytest.mark.asyncio
    async def test_repetitive_response_penalized(self):
        """Repetitive/hallucinating responses should be penalized."""
        evaluator = QualityEvaluator(quality_threshold=0.82)

        repetitive_response = "The answer is 4. The answer is 4. The answer is 4. The answer is 4. The answer is 4. The answer is 4. The answer is 4."

        result = await evaluator.evaluate(
            prompt="What is 2+2?",
            response_text=repetitive_response,
            completion_tokens=50
        )
        assert result.quality_score < 0.5, f"Repetitive response scored too high: {result.quality_score}"
        print(f"Repetitive response score: {result.quality_score}")

    @pytest.mark.asyncio
    async def test_threshold_logic_works(self):
        """Test that threshold passing logic works correctly."""
        # Test with lower threshold
        evaluator_low = QualityEvaluator(quality_threshold=0.5)
        result_low = await evaluator_low.evaluate(
            prompt="Simple question",
            response_text="Simple answer",
            completion_tokens=10
        )

        # Test with high threshold
        evaluator_high = QualityEvaluator(quality_threshold=0.95)
        result_high = await evaluator_high.evaluate(
            prompt="Simple question",
            response_text="Simple answer",
            completion_tokens=10
        )

        # The same response should pass lower threshold but may fail higher threshold
        assert result_low.passed == True or result_high.passed == False
        print(f"Low threshold passed: {result_low.passed}, High threshold passed: {result_high.passed}")

    @pytest.mark.asyncio
    async def test_mathematical_reasoning_not_overly_penalized(self):
        """Mathematical reasoning questions should get fair evaluation."""
        evaluator = QualityEvaluator(quality_threshold=0.82)

        math_response = """
        Proof by induction:
        Base case: n=1, sum of first 1 odd integer is 1 = 1^2 ✓
        Inductive step: Assume sum of first k odd integers = k^2
        The (k+1)th odd integer is 2k+1
        Sum of first k+1 odd integers = k^2 + (2k+1) = (k+1)^2
        Therefore, sum of first n odd integers = n^2 for all n.
        """

        result = await evaluator.evaluate(
            prompt="Prove by mathematical induction that the sum of first n odd positive integers is n^2.",
            response_text=math_response,
            completion_tokens=120
        )
        assert result.quality_score > 0.4, f"Math proof scored too low: {result.quality_score}"
        print(f"Math proof score: {result.quality_score}")


if __name__ == "__main__":
    # Run tests directly
    async def run_tests():
        tester = TestQualityEvaluator()

        print("Running Quality Evaluator Tests...")
        print("=" * 60)

        await tester.test_simple_qa_gets_reasonable_score()
        await tester.test_architecture_question_not_penalized()
        await tester.test_code_generation_gets_proper_score()
        await tester.test_empty_response_gets_zero_score()
        await tester.test_repetitive_response_penalized()
        await tester.test_threshold_logic_works()
        await tester.test_mathematical_reasoning_not_overly_penalized()

        print("=" * 60)
        print("All tests completed!")

    asyncio.run(run_tests())