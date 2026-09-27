import re
import json
import ast
from typing import Tuple, Optional, Dict, Any


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
        match = re.search(r"\{.*\}|\[.*\]", text, re.DOTALL)
        if match:
            try:
                json.loads(match.group(0))
                return True
            except Exception:
                return False
        return False

    @staticmethod
    def validate_python_syntax(code_text: str) -> Tuple[bool, Optional[str]]:
        """Extract and check python syntax using ast.parse."""
        blocks = re.findall(r"```(?:python)?\s*([\s\S]*?)```", code_text)
        target = blocks[0] if blocks else code_text
        try:
            ast.parse(target)
            return True, None
        except SyntaxError as e:
            return False, f"Python SyntaxError at line {e.lineno}: {e.msg}"
        except Exception:
            return True, None

    @classmethod
    def validate_criteria(cls, text: str, criteria: Optional[Dict[str, Any]]) -> Tuple[bool, float, str]:
        """Deterministic evaluation against ground truth criteria dictionary."""
        if not criteria:
            return True, 1.0, "No specific deterministic criteria."

        c_type = criteria.get("type")
        lower = text.lower()

        if c_type == "contains_any":
            vals = criteria.get("values", [])
            match = any(v.lower() in lower for v in vals)
            return match, (1.0 if match else 0.2), (f"Matched one of {vals}" if match else f"Missing expected terms {vals}")

        elif c_type == "contains_all":
            vals = criteria.get("values", [])
            missing = [v for v in vals if v.lower() not in lower]
            passed = len(missing) == 0
            score = 1.0 - (len(missing) / len(vals))
            return passed, round(score, 2), ("All required terms found." if passed else f"Missing: {missing}")

        elif c_type == "json_valid":
            req_keys = criteria.get("required_keys", [])
            match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
            if not match:
                return False, 0.2, "No valid JSON structure found in output."
            try:
                obj = json.loads(match.group(0))
                if isinstance(obj, dict) and req_keys:
                    missing_keys = [k for k in req_keys if k not in obj]
                    if missing_keys:
                        return False, 0.6, f"JSON missing required keys: {missing_keys}"
                return True, 1.0, "Valid JSON structure with required fields."
            except Exception as e:
                return False, 0.3, f"JSON parsing failed: {e}"

        elif c_type == "code_syntax":
            is_closed = cls.validate_code_blocks(text)
            if not is_closed:
                return False, 0.4, "Unclosed code fence in response."
            keywords = criteria.get("keywords", [])
            missing_kw = [k for k in keywords if k not in text]
            if missing_kw:
                return False, 0.6, f"Code missing keywords: {missing_kw}"
            if criteria.get("lang") == "python":
                valid_ast, err = cls.validate_python_syntax(text)
                if not valid_ast:
                    return False, 0.5, err or "Invalid python syntax."
            return True, 1.0, "Code syntax and keywords validated."

        elif c_type == "min_length":
            val = criteria.get("value", 10)
            passed = len(text.strip()) >= val
            return passed, (1.0 if passed else 0.3), f"Length {len(text.strip())} >= {val}"

        return True, 0.9, "Default criteria check passed."
