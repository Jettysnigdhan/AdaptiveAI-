from backend.app.evaluator.validators import ResponseValidators


class ConfidenceScorer:
    """Estimates the confidence level of a generation response."""

    @staticmethod
    def calculate_confidence(
        prompt: str,
        response_text: str,
        completion_tokens: int,
        finish_reason: str = "stop"
    ) -> float:
        """
        Produce a confidence score [0.0 - 1.0] reflecting generation reliability.
        Factors:
        - Finish reason ('stop' vs 'length' or 'error')
        - Repetition ratio
        - Response length adequacy relative to prompt complexity
        """
        if ResponseValidators.is_empty_or_whitespace(response_text):
            return 0.0

        score = 0.85

        # Deduct if generation was abruptly truncated by max_tokens limit
        if finish_reason != "stop":
            score -= 0.25

        # Check repetition loops
        is_loop, rep_ratio = ResponseValidators.check_repetition_loop(response_text)
        if is_loop:
            score -= (rep_ratio * 0.5)

        # Check if code block wasn't closed
        if not ResponseValidators.validate_code_blocks(response_text):
            score -= 0.15

        # Very short responses to long prompts
        prompt_words = len(prompt.split())
        resp_words = len(response_text.split())
        if prompt_words > 40 and resp_words < 10:
            score -= 0.20

        return max(0.05, min(0.99, round(score, 3)))
