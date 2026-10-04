"""Semantic cache with sentence-transformers, Qdrant, TTL, and safety guards."""

import re
import time
import uuid
import string
import logging
from typing import Optional, List, Dict, Any
from sentence_transformers import SentenceTransformer

from app.config import get_settings
from app.cache.qdrant_client import qdrant_manager

logger = logging.getLogger("semantic_router.cache")


class SemanticCache:
    """Manages embedding generation, vector similarity search, TTL, and cache safety."""

    def __init__(self):
        self.settings = get_settings()
        self.qdrant = qdrant_manager
        self._embedder: Optional[SentenceTransformer] = None
        self.stats = {"hits": 0, "misses": 0}

    @property
    def embedder(self) -> SentenceTransformer:
        """Lazy-loaded SentenceTransformer model."""
        if self._embedder is None:
            logger.info(f"Loading embedding model: {self.settings.embedding_model}")
            self._embedder = SentenceTransformer(self.settings.embedding_model)
        return self._embedder

    def normalize_query(self, query: str) -> str:
        """Normalizes queries: lowercase, strip whitespace, remove punctuation."""
        if not query:
            return ""
        # 1. Lowercase
        normalized = query.lower().strip()
        # 2. Remove punctuation
        normalized = normalized.translate(str.maketrans("", "", string.punctuation))
        # 3. Collapse multiple whitespaces
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

    def embed_query(self, query: str) -> List[float]:
        """Generates a dense vector embedding using sentence-transformers."""
        clean_text = self.normalize_query(query)
        embedding = self.embedder.encode(clean_text, normalize_embeddings=True)
        return embedding.tolist()

    def search_cache(
        self,
        query: str,
        threshold: Optional[float] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Searches the cache for a semantically similar query meeting threshold,
        corpus version match, and TTL validity.
        """
        clean_query = self.normalize_query(query)
        if not clean_query:
            self.stats["misses"] += 1
            return None

        effective_threshold = threshold or self.settings.cache_similarity_threshold
        vector = self.embed_query(clean_query)

        results = self.qdrant.search_similar(
            query_vector=vector,
            limit=1,
            score_threshold=effective_threshold,
        )

        if not results:
            self.stats["misses"] += 1
            return None

        top_match = results[0]
        payload = getattr(top_match, "payload", {}) or {}
        similarity_score = getattr(top_match, "score", 0.0)

        # Cache Safety Checks:
        # 1. Corpus version check
        cached_version = payload.get("corpus_version")
        if cached_version != self.settings.corpus_version:
            logger.debug(
                f"Cache rejected: version mismatch (cached '{cached_version}' != current '{self.settings.corpus_version}')"
            )
            self.stats["misses"] += 1
            return None

        # 2. TTL expiration check
        cached_timestamp = payload.get("timestamp", 0)
        current_time = time.time()
        if (current_time - cached_timestamp) > self.settings.cache_ttl_seconds:
            logger.debug(f"Cache rejected: expired TTL ({current_time - cached_timestamp}s > {self.settings.cache_ttl_seconds}s)")
            self.stats["misses"] += 1
            return None

        # 3. Non-empty answer check
        cached_answer = payload.get("answer", "")
        if not cached_answer or not cached_answer.strip():
            self.stats["misses"] += 1
            return None

        self.stats["hits"] += 1
        return {
            "query": payload.get("query"),
            "answer": cached_answer,
            "similarity_score": round(float(similarity_score), 4),
            "sources": payload.get("sources", []),
            "timestamp": cached_timestamp,
            "corpus_version": cached_version,
            "cache_id": str(getattr(top_match, "id", "")),
        }

    def store_cache(
        self,
        query: str,
        answer: str,
        sources: Optional[List[str]] = None,
    ) -> bool:
        """
        Stores query embedding and answer in Qdrant with safety validations.
        Rejects errors, empty answers, and personal data.
        """
        clean_query = self.normalize_query(query)
        if not clean_query:
            return False

        # Safety Check 1: No caching of empty answers
        if not answer or not answer.strip():
            logger.debug("Rejected cache storage: Empty answer.")
            return False

        # Safety Check 2: No caching of errors
        lower_ans = answer.lower()
        if any(err_kw in lower_ans for err_kw in [
            "error:", "exception:", "internal server error", "traceback", "failed to generate", "api error"
        ]):
            logger.debug("Rejected cache storage: Answer contains an error.")
            return False

        # Safety Check 3: Protection against personalized/user-specific data
        if any(sens_kw in lower_ans for sens_kw in [
            "your account number is", "my password is", "your password is", "social security", "ssn:"
        ]):
            logger.debug("Rejected cache storage: Potential personal/sensitive data.")
            return False

        vector = self.embed_query(clean_query)
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, clean_query))

        payload = {
            "query": query,
            "normalized_query": clean_query,
            "answer": answer,
            "sources": sources or [],
            "timestamp": time.time(),
            "corpus_version": self.settings.corpus_version,
        }

        return self.qdrant.insert_point(
            point_id=point_id,
            vector=vector,
            payload=payload,
        )

    def invalidate_cache(self):
        """Clears all cached points in the collection."""
        self.qdrant.clear_collection()
        self.stats = {"hits": 0, "misses": 0}
        logger.info("Semantic cache successfully invalidated.")

    def get_stats(self) -> Dict[str, Any]:
        """Returns cache telemetry."""
        total_queries = self.stats["hits"] + self.stats["misses"]
        hit_rate = round(self.stats["hits"] / total_queries * 100, 2) if total_queries > 0 else 0.0
        return {
            "total_entries": self.qdrant.get_count(),
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate_percent": hit_rate,
            "collection_name": self.settings.qdrant_collection,
            "corpus_version": self.settings.corpus_version,
            "similarity_threshold": self.settings.cache_similarity_threshold,
            "ttl_seconds": self.settings.cache_ttl_seconds,
            "connected_backend": getattr(self.qdrant, "backend_type", "qdrant"),
        }


# Singleton cache instance
semantic_cache = SemanticCache()
