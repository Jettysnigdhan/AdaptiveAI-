import re
from typing import Dict, Any, List
from pydantic import BaseModel, Field


class PromptFeatures(BaseModel):
    """Engineered scalar features extracted from user prompts."""
    char_length: int = Field(description="Total character count")
    word_count: int = Field(description="Total word count")
    token_estimate: int = Field(description="Estimated token count (~1.3 tokens per word)")
    num_questions: int = Field(description="Count of question marks & query clauses")
    has_code: int = Field(description="1 if code blocks or syntax keywords detected, 0 otherwise")
    has_math: int = Field(description="1 if mathematical operators, LaTeX or formulas detected, 0 otherwise")
    has_reasoning: int = Field(description="1 if multi-step analytical reasoning requested, 0 otherwise")
    has_summarization: int = Field(description="1 if summarization/distillation requested, 0 otherwise")
    has_translation: int = Field(description="1 if translation keywords detected, 0 otherwise")
    has_structured_data: int = Field(description="1 if JSON/YAML/CSV/Markdown table requested, 0 otherwise")
    complexity_indicator: float = Field(description="Composite heuristic complexity score [0.0 - 1.0]")

    def to_vector(self) -> List[float]:
        """Convert features to a standardized numerical list for ML modeling."""
        return [
            float(self.char_length) / 1000.0,
            float(self.word_count) / 200.0,
            float(self.token_estimate) / 250.0,
            float(self.num_questions),
            float(self.has_code),
            float(self.has_math),
            float(self.has_reasoning),
            float(self.has_summarization),
            float(self.has_translation),
            float(self.has_structured_data),
            self.complexity_indicator,
        ]


class FeatureExtractor:
    """Extracts lexical, structural, and semantic signals from prompts."""

    CODE_PATTERNS = [
        r"```",
        r"\bdef\s+\w+\(",
        r"\bclass\s+\w+",
        r"\bimport\s+[\w\.]+",
        r"\bfrom\s+[\w\.]+\s+import",
        r"\bfunction\s*\w*\(",
        r"\bconst\s+\w+\s*=",
        r"\blet\s+\w+\s*=",
        r"\bvar\s+\w+\s*=",
        r"\bpublic\s+(static\s+)?void",
        r"\bSELECT\s+.+\s+FROM",
        r"[{};]\s*$",
    ]

    MATH_PATTERNS = [
        r"\b(calculate|solve|equation|integral|derivative|matrix|vector|probability|variance|standard deviation|induction|arithmetic|geometric)\b",
        r"\b\d+\s*[\+\-\*\/\^%]\s*\d+",
        r"\\frac",
        r"\\int",
        r"\\sum",
        r"\\sqrt",
        r"\b(sin|cos|tan|log|ln|exp)\(",
    ]

    REASONING_PATTERNS = [
        r"\b(step[- ]by[- ]step|think carefully|prove\b|proof\b|why is|explain the rationale|chain of thought|analyze why|deduce|conclude|counterargument|trade[- ]off)\b",
        r"\b(compare and contrast|pros and cons|evaluate the impact)\b",
    ]

    SUMMARIZATION_PATTERNS = [
        r"\b(summarize|summary|tldr|tl;dr|key points|bullet points|brief overview|condense)\b",
    ]

    TRANSLATION_PATTERNS = [
        r"\b(translate|translation|in spanish|in french|in german|in chinese|in japanese|in arabic|in russian|into english)\b",
    ]

    STRUCTURED_PATTERNS = [
        r"\b(json|yaml|xml|csv|schema|markdown table|key[- ]value)\b",
    ]

    def extract(self, prompt: str) -> PromptFeatures:
        text = prompt.strip()
        words = text.split()
        word_count = len(words)
        char_length = len(text)
        token_est = int(word_count * 1.33) + 1

        # Count questions
        num_questions = text.count("?") + len(re.findall(r"\b(how|what|why|where|when|who|which)\b", text, re.I))

        # Flags
        has_code = 1 if any(re.search(pat, text, re.I | re.M) for pat in self.CODE_PATTERNS) else 0
        has_math = 1 if any(re.search(pat, text, re.I) for pat in self.MATH_PATTERNS) else 0
        has_reasoning = 1 if any(re.search(pat, text, re.I) for pat in self.REASONING_PATTERNS) else 0
        has_summarization = 1 if any(re.search(pat, text, re.I) for pat in self.SUMMARIZATION_PATTERNS) else 0
        has_translation = 1 if any(re.search(pat, text, re.I) for pat in self.TRANSLATION_PATTERNS) else 0
        has_structured = 1 if any(re.search(pat, text, re.I) for pat in self.STRUCTURED_PATTERNS) else 0

        # Heuristic complexity [0.0 - 1.0]
        complexity = 0.1
        if has_code:
            complexity += 0.35
        if has_reasoning:
            complexity += 0.35
        if has_math:
            complexity += 0.30
        if token_est > 80:
            complexity += 0.15
        if num_questions > 2:
            complexity += 0.10
        if has_summarization and not has_reasoning:
            complexity -= 0.10

        complexity = max(0.05, min(0.98, complexity))

        return PromptFeatures(
            char_length=char_length,
            word_count=word_count,
            token_estimate=token_est,
            num_questions=num_questions,
            has_code=has_code,
            has_math=has_math,
            has_reasoning=has_reasoning,
            has_summarization=has_summarization,
            has_translation=has_translation,
            has_structured_data=has_structured,
            complexity_indicator=round(complexity, 3),
        )
