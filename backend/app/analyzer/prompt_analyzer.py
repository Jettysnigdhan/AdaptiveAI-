import numpy as np
import hashlib
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.analyzer.feature_extractor import FeatureExtractor, PromptFeatures
from backend.app.core.config import get_settings
from backend.app.core.logging import logger


class PromptAnalysisResult(BaseModel):
    """Unified container for all extracted semantic and structural signals."""
    prompt: str
    features: PromptFeatures
    embedding: List[float] = Field(description="Dense semantic embedding vector")
    detected_category: str = Field(description="Primary category classification")
    complexity_score: float = Field(description="Normalized prompt complexity [0.0 - 1.0]")
    extracted_tokens: int

    def get_full_feature_vector(self) -> List[float]:
        """Concatenate semantic embedding with scalar engineered features."""
        return self.embedding + self.features.to_vector()


class PromptAnalyzer:
    """Extracts semantic embeddings and structural domain features for ML routing."""

    def __init__(self, model_name: Optional[str] = None):
        settings = get_settings()
        self.model_name = model_name or settings.embedding_model
        self.feature_extractor = FeatureExtractor()
        self._st_model = None
        self._embedding_cache: Dict[str, List[float]] = {}
        self._init_encoder()

    def _init_encoder(self):
        """Lazily attempt loading SentenceTransformer; fallback to fast pseudo-semantic vector if offline."""
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SentenceTransformer: {self.model_name}")
            self._st_model = SentenceTransformer(self.model_name)
            logger.info("SentenceTransformer loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({e}). Using deterministic semantic vector fallback.")
            self._st_model = None

    def _get_embedding(self, text: str) -> List[float]:
        """Compute dense semantic embedding vector."""
        if text in self._embedding_cache:
            return self._embedding_cache[text]

        if self._st_model is not None:
            try:
                emb = self._st_model.encode(text, convert_to_numpy=True)
                emb_list = emb.tolist()
                self._embedding_cache[text] = emb_list
                return emb_list
            except Exception as e:
                logger.warning(f"Embedding generation failed: {e}. Falling back.")

        # Robust deterministic semantic projection fallback (384-dimensional)
        emb_list = self._fallback_embedding(text, dim=384)
        self._embedding_cache[text] = emb_list
        return emb_list

    def _fallback_embedding(self, text: str, dim: int = 384) -> List[float]:
        """Generates a normalized 384-dim semantic fingerprint from text n-grams."""
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 4) % 2 == 0) else -1.0
            vec[idx] += sign * (1.0 / (i + 1)**0.5)

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec.tolist()

    def _detect_category(self, features: PromptFeatures, text: str) -> str:
        """Categorize prompt domain based on signals."""
        t_lower = text.lower()
        if features.has_code:
            return "coding"
        if features.has_math:
            return "mathematics"
        if features.has_reasoning:
            return "reasoning"
        if features.has_translation:
            return "translation"
        if features.has_summarization:
            return "summarization"
        if features.has_structured_data:
            return "structured_data"
        if any(w in t_lower for w in ["who", "what", "where", "when", "capital", "define", "name"]):
            return "factual_qa"
        if any(w in t_lower for w in ["story", "poem", "write a", "imagine", "creative"]):
            return "creative"
        return "general"

    def analyze(self, prompt: str) -> PromptAnalysisResult:
        """Run full analysis pipeline on user prompt."""
        features = self.feature_extractor.extract(prompt)
        embedding = self._get_embedding(prompt)
        category = self._detect_category(features, prompt)

        return PromptAnalysisResult(
            prompt=prompt,
            features=features,
            embedding=embedding,
            detected_category=category,
            complexity_score=features.complexity_indicator,
            extracted_tokens=features.token_estimate,
        )


# Singleton instance
analyzer = PromptAnalyzer()
