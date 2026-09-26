import re
from typing import Tuple, Optional


class ResponseValidators:
    """Deterministic validation rules for LLM generation responses."""

    REPETITION_THRESHOLD = 0.45  # Max duplicate 4-grams ratio

    @staticmethod
    def is_empty_or_whitespace(text: str) -> bool:
        return not text or not text.strip()

    @staticmethod
    def is_truncated_or_error(text: str) -> Tuple[bool, Optional[str]]:
        """Check for common LLM failure strings or cut-off indications."""
        lower = text.lower()
        error_triggers = [
            "i cannot answer",
            "as an ai language model, i cannot",
            "an error occurred",
            "rate limit exceeded",
            "internal server error",
        ]
        for trigger in error_triggers:
            if trigger in lower and len(text) < 150:
                return True, f"Response matched failure pattern: '{trigger}'"
        return False, None

    @classmethod
    def check_repetition_loop(cls, text: str) -> Tuple[bool, float]:
        """Detect degenerate looping/hallucinatory repetition."""
        words = text.split()
        if len(words) < 20:
            return False, 0.0

        quads = [tuple(words[i:i+4]) for i in range(len(words)-3)]
        if not quads:
            return False, 0.0

        unique_quads = set(quads)
        repetition_ratio = 1.0 - (len(unique_quads) / len(quads))
        is_looping = repetition_ratio > cls.REPETITION_THRESHOLD
        return is_looping, round(repetition_ratio, 3)

    @staticmethod
    def validate_code_blocks(text: str) -> bool:
        """If markdown code fence is started, verify it is closed."""
        fences = text.count("```")
        return (fences % 2 == 0)

    @staticmethod
    def validate_json_structure(text: str) -> bool:
        """Attempt extracting and parsing JSON if prompt implies JSON."""
        import json
        match = re.search(r"\{.*\}|\[.*\]", text, re.DOTALL)
        if match:
            try:
                json.loads(match.group(0))
                return True
            except Exception:
                return False
        return False
