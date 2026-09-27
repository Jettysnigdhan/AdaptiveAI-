import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class PromptFeatures(BaseModel):
    """Engineered scalar and structural features extracted from user prompts."""
    char_length: int = Field(description="Total character count")
    word_count: int = Field(description="Total word count")
    token_estimate: int = Field(description="Estimated token count (~1.33 tokens per word)")
    num_questions: int = Field(description="Count of question marks & query clauses")
    num_instructions: int = Field(default=0, description="Count of distinct imperative commands/steps")
    num_constraints: int = Field(default=0, description="Count of restrictive constraints (must, never, strictly)")
    has_code: int = Field(description="1 if code blocks or syntax keywords detected, 0 otherwise")
    detected_language: Optional[str] = Field(default=None, description="Primary detected programming language")
    requested_format: str = Field(default="text", description="Detected output format: text, json, yaml, markdown, code")
    context_size: int = Field(default=0, description="Estimated character count of provided context / code snippets")
    has_math: int = Field(description="1 if mathematical operators, LaTeX or formulas detected, 0 otherwise")
    has_reasoning: int = Field(description="1 if multi-step analytical reasoning requested, 0 otherwise")
    has_summarization: int = Field(description="1 if summarization/distillation requested, 0 otherwise")
    has_translation: int = Field(description="1 if translation keywords detected, 0 otherwise")
    has_structured_data: int = Field(description="1 if JSON/YAML/CSV/Markdown table requested, 0 otherwise")
    complexity_indicator: float = Field(description="Composite heuristic complexity score [0.0 - 1.0]")
    task_signals: Dict[str, float] = Field(
        default_factory=dict,
        description="Continuous task signal scores used as features for ML routing"
    )

    def to_vector(self) -> List[float]:
        """
        Convert core features to a standardized 11-dimensional numerical list
        for full compatibility with trained router checkpoints.
        """
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

    def to_extended_vector(self) -> List[float]:
        """Extended vector incorporating structural constraints and task signals."""
        base = self.to_vector()
        extended = [
            float(self.num_instructions) / 10.0,
            float(self.num_constraints) / 5.0,
            float(self.context_size) / 1000.0,
        ]
        # Append sorted task signal values
        signal_keys = [
            "simple_qa", "explanation", "code_generation", "code_modification",
            "debugging", "frontend", "backend", "database", "architecture",
            "mathematics", "reasoning", "summarization", "extraction", "planning", "multi_step"
        ]
        for k in signal_keys:
            extended.append(self.task_signals.get(k, 0.0))
        return base + extended


class FeatureExtractor:
    """Extracts lexical, structural, and semantic task signals from prompts."""

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

    LANG_PATTERNS = {
        "python": [r"\bpython\b", r"\bdef\b", r"\bself\b", r"\bimport\s+pandas\b", r"\bimport\s+numpy\b", r":\s*$"],
        "typescript": [r"\btypescript\b", r"\binterface\s+\w+", r"\btype\s+\w+\s*=", r":\s*(string|number|boolean|any)"],
        "javascript": [r"\bjavascript\b", r"\bconst\b", r"\blet\b", r"=>", r"console\.log"],
        "sql": [r"\bselect\b", r"\binsert\b", r"\bupdate\b", r"\bdelete\b", r"\bfrom\s+\w+", r"\bwhere\b"],
        "html_css": [r"<[a-z]+>", r"\bcss\b", r"\btailwind\b", r"\bflexbox\b", r"\bgrid\b", r"style="],
        "rust": [r"\brust\b", r"\bfn\s+\w+", r"\blet\s+mut\b", r"\bimpl\b"],
        "go": [r"\bgolang\b", r"\bgo\b", r"\bfunc\s+\w+", r"package\s+main"],
    }

    def _detect_language(self, text: str) -> Optional[str]:
        t = text.lower()
        for lang, pats in self.LANG_PATTERNS.items():
            if any(re.search(p, t) for p in pats):
                return lang
        return None

    def _detect_format(self, text: str) -> str:
        t = text.lower()
        if "json" in t:
            return "json"
        if "yaml" in t or "yml" in t:
            return "yaml"
        if "markdown" in t or "table" in t:
            return "markdown"
        if "code" in t or "function" in t or "class" in t:
            return "code"
        return "text"

    def _extract_task_signals(self, text: str, features_dict: Dict[str, Any]) -> Dict[str, float]:
        """Compute continuous [0.0 - 1.0] domain signal features."""
        t = text.lower()
        signals = {}

        # 1. simple_qa
        is_question = "?" in text or any(w in t for w in ["what is", "who is", "when did", "where is", "capital of"])
        is_short = features_dict["word_count"] < 20
        signals["simple_qa"] = 0.9 if (is_question and is_short and not features_dict["has_code"]) else 0.1

        # 2. explanation
        signals["explanation"] = 0.85 if any(w in t for w in ["explain", "describe", "why does", "how does", "what are the difference"]) else 0.1

        # 3. code_generation
        signals["code_generation"] = 0.9 if any(w in t for w in ["write a function", "implement", "create a script", "write code", "build a class"]) else (0.6 if features_dict["has_code"] else 0.05)

        # 4. code_modification
        signals["code_modification"] = 0.9 if any(w in t for w in ["refactor", "modify", "rewrite", "update this function", "convert to"]) else 0.05

        # 5. debugging
        signals["debugging"] = 0.95 if any(w in t for w in ["fix the error", "bug", "traceback", "exception", "error:", "why is this failing", "debug"]) else 0.05

        # 6. frontend
        signals["frontend"] = 0.9 if any(w in t for w in ["react", "vue", "tailwind", "css", "html", "jsx", "tsx", "button", "modal", "navbar", "ui component", "frontend"]) else 0.05

        # 7. backend
        signals["backend"] = 0.9 if any(w in t for w in ["fastapi", "django", "express", "backend", "api endpoint", "jwt", "auth", "middleware", "concurrency"]) else 0.05

        # 8. database
        signals["database"] = 0.9 if any(w in t for w in ["sql", "postgresql", "database", "schema", "table", "migration", "query", "orm", "nosql", "mongodb"]) else 0.05

        # 9. architecture
        signals["architecture"] = 0.95 if any(w in t for w in ["architect", "system design", "microservice", "distributed", "scalability", "event-driven", "fault tolerance", "consensus", "cluster", "failover", "high availability", "pipeline"]) else 0.05

        # 10. mathematics & simple arithmetic
        is_simple_arithmetic = (
            features_dict.get("has_math", 0)
            and features_dict.get("word_count", 0) <= 8
            and not any(w in t for w in ["integral", "derivative", "matrix", "vector", "theorem", "proof", "differential", "eigen", "polynomial", "calculus", "latex", "solve for", "equation"])
        )
        if is_simple_arithmetic:
            signals["simple_qa"] = 0.95
            signals["mathematics"] = 0.15
        else:
            signals["mathematics"] = 0.9 if features_dict.get("has_math", 0) else 0.05

        # 11. reasoning
        signals["reasoning"] = 0.9 if features_dict["has_reasoning"] else 0.05

        # 12. summarization
        signals["summarization"] = 0.9 if features_dict["has_summarization"] else 0.05

        # 13. extraction
        signals["extraction"] = 0.9 if any(w in t for w in ["extract", "parse", "find all", "list all names", "scrape"]) else 0.05

        # 14. planning
        signals["planning"] = 0.85 if any(w in t for w in ["roadmap", "strategy", "plan", "phases", "step 1", "timeline", "design a plan"]) else 0.05

        # 15. multi_step
        signals["multi_step"] = 0.85 if (len(re.findall(r"\b(1\.|2\.|first|second|then|finally|next)\b", t)) >= 2 or "multi-step" in t) else 0.05

        return signals

    def extract(self, prompt: str) -> PromptFeatures:
        text = prompt.strip()
        words = text.split()
        word_count = len(words)
        char_length = len(text)
        token_est = int(word_count * 1.33) + 1

        # Count questions
        num_questions = text.count("?") + len(re.findall(r"\b(how|what|why|where|when|who|which)\b", text, re.I))

        # Instructions count
        imperatives = len(re.findall(r"\b(write|create|implement|design|explain|analyze|summarize|calculate|find|fix|build|generate|convert)\b", text, re.I))
        bullet_points = len(re.findall(r"(?:^|\n)\s*[-*•\d+.]\s+", text))
        num_instructions = max(1, imperatives + bullet_points)

        # Constraints count
        constraints = len(re.findall(r"\b(must|should not|cannot|never|strictly|limit|without|do not|ensure|only|exact)\b", text, re.I))

        # Context snippet size (quoted blocks or code fences)
        code_blocks = re.findall(r"```[\s\S]*?```", text)
        quotes = re.findall(r'["\'][\s\S]{20,}?["\']', text)
        context_size = sum(len(b) for b in code_blocks) + sum(len(q) for q in quotes)

        # Basic flags
        has_code = 1 if any(re.search(pat, text, re.I | re.M) for pat in self.CODE_PATTERNS) else 0
        has_math = 1 if any(re.search(pat, text, re.I) for pat in self.MATH_PATTERNS) else 0
        has_reasoning = 1 if any(re.search(pat, text, re.I) for pat in self.REASONING_PATTERNS) else 0
        has_summarization = 1 if any(re.search(pat, text, re.I) for pat in self.SUMMARIZATION_PATTERNS) else 0
        has_translation = 1 if any(re.search(pat, text, re.I) for pat in self.TRANSLATION_PATTERNS) else 0
        has_structured = 1 if any(re.search(pat, text, re.I) for pat in self.STRUCTURED_PATTERNS) else 0

        detected_lang = self._detect_language(text)
        requested_format = self._detect_format(text)

        # Task signals dictionary
        raw_dict = {
            "word_count": word_count,
            "has_code": has_code,
            "has_math": has_math,
            "has_reasoning": has_reasoning,
            "has_summarization": has_summarization,
        }
        task_signals = self._extract_task_signals(text, raw_dict)

        # Heuristic complexity score [0.0 - 1.0]
        is_simple_arithmetic = (
            has_math
            and word_count <= 8
            and not any(w in text.lower() for w in ["integral", "derivative", "matrix", "vector", "theorem", "proof", "differential", "eigen", "polynomial", "calculus", "latex", "solve for", "equation"])
        )

        complexity = 0.10
        if has_code:
            complexity += 0.30
        if has_reasoning:
            complexity += 0.30
        if has_math:
            complexity += 0.02 if is_simple_arithmetic else 0.25
        if task_signals.get("architecture", 0.0) > 0.8:
            complexity += 0.35
        if task_signals.get("database", 0.0) > 0.8:
            complexity += 0.20
        if task_signals.get("backend", 0.0) > 0.8:
            complexity += 0.15
        if task_signals.get("debugging", 0.0) > 0.8:
            complexity += 0.20
        if token_est > 80:
            complexity += 0.15
        if num_instructions > 3:
            complexity += 0.10
        if constraints > 2:
            complexity += 0.10
        if task_signals.get("simple_qa", 0.0) > 0.8:
            complexity -= 0.15
        if is_simple_arithmetic:
            complexity = 0.05
        if has_summarization and not has_reasoning:
            complexity -= 0.10

        complexity = max(0.05, min(0.98, complexity))

        return PromptFeatures(
            char_length=char_length,
            word_count=word_count,
            token_estimate=token_est,
            num_questions=num_questions,
            num_instructions=num_instructions,
            num_constraints=constraints,
            has_code=has_code,
            detected_language=detected_lang,
            requested_format=requested_format,
            context_size=context_size,
            has_math=has_math,
            has_reasoning=has_reasoning,
            has_summarization=has_summarization,
            has_translation=has_translation,
            has_structured_data=has_structured,
            complexity_indicator=complexity,
            task_signals=task_signals,
        )
