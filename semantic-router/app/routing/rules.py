"""Deterministic rules for model routing and quality escalation."""

import re
from typing import Tuple, Optional

# Core complexity indicators explicitly required by design
COMPLEXITY_KEYWORDS = [
    "compare",
    "why",
    "explain",
    "analyze",
    "design",
    "architecture",
    "difference",
    "tradeoff",
    "optimize",
    "synthesize",
    "distributed",
    "concurrency",
    "security vulnerability",
]

# Simple / transactional keywords
SIMPLE_KEYWORDS = [
    "what is",
    "define",
    "capital of",
    "who is",
    "when did",
    "translate",
    "spell",
    "synonym",
]

SHORT_QUERY_WORD_LIMIT = 8
LONG_QUERY_WORD_LIMIT = 30


def evaluate_query_complexity(query: str) -> Tuple[str, str]:
    """
    Deterministic rule-based routing evaluation.
    Returns: (route: 'simple' | 'complex', reason: str)
    """
    clean_q = query.strip()
    words = clean_q.split()
    word_count = len(words)
    q_lower = clean_q.lower()

    # 1. Match against explicit complexity keywords
    for kw in COMPLEXITY_KEYWORDS:
        # Check whole word match or substring
        if re.search(rf"\b{re.escape(kw)}\b", q_lower):
            return "complex", f"complexity_keyword:{kw}"

    # 2. Long queries indicate multi-part or detailed reasoning
    if word_count >= LONG_QUERY_WORD_LIMIT:
        return "complex", f"long_query:word_count_{word_count}"

    # 3. Simple factual or short queries
    if word_count <= SHORT_QUERY_WORD_LIMIT:
        return "simple", f"short_query:word_count_{word_count}"

    # 4. Check for known simple question patterns
    for sk in SIMPLE_KEYWORDS:
        if q_lower.startswith(sk):
            return "simple", f"simple_pattern:{sk}"

    # 5. Default heuristic: medium length without complexity signals is simple
    return "simple", "default_standard_tier"


def evaluate_response_quality(query: str, answer: str) -> Tuple[bool, Optional[str]]:
    """
    Evaluates whether a small-model answer is weak and warrants escalation.
    Returns: (is_weak: bool, reason: Optional[str])
    """
    if not answer or not answer.strip():
        return True, "empty_answer"

    trimmed = answer.strip()
    ans_lower = trimmed.lower()

    # 1. Very short evasive answer (< 12 characters)
    if len(trimmed) < 12 and not any(char.isdigit() for char in trimmed):
        return True, "insufficient_length"

    # 2. Uncertainty or refusal patterns
    evasive_phrases = [
        "i don't know",
        "i do not know",
        "as an ai",
        "cannot answer",
        "unable to answer",
        "not enough information",
        "i am not sure",
        "cannot provide",
    ]
    for phrase in evasive_phrases:
        if phrase in ans_lower:
            return True, f"weak_phrase:{phrase}"

    # 3. If query asked for code/python/function, verify code presence
    q_lower = query.lower()
    if any(code_kw in q_lower for code_kw in ["code", "python function", "write a script", "implement in"]):
        has_code_block = "```" in answer or "def " in answer or "return " in answer or "function(" in answer
        if not has_code_block:
            return True, "missing_expected_code_block"

    return False, None
