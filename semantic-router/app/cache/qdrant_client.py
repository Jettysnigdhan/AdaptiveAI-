"""Qdrant vector database wrapper with fallback to embedded storage."""

import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FilterSelector,
    FieldCondition,
    MatchValue,
)

from app.config import get_settings

logger = logging.getLogger("semantic_router.qdrant")


class QdrantManager:
    """Manages Qdrant vector collection and similarity operations."""

    VECTOR_SIZE = 384  # Standard for sentence-transformers/all-MiniLM-L6-v2

    def __init__(self):
        self.settings = get_settings()
        self.collection_name = self.settings.qdrant_collection
        self.client = self._initialize_client()
        self.ensure_collection()

    def _initialize_client(self) -> QdrantClient:
        """Attempts connection to external Qdrant URL; falls back to embedded storage."""
        # 1. Try remote Qdrant (e.g., Docker container)
        try:
            client = QdrantClient(url=self.settings.qdrant_url, timeout=2.0, check_compatibility=False)
            client.get_collections()
            logger.info(f"Connected to remote Qdrant at {self.settings.qdrant_url}")
            self.backend_type = "docker_qdrant"
            return client
        except Exception as e:
            logger.warning(
                f"Could not connect to Qdrant at {self.settings.qdrant_url} ({e}). "
                f"Falling back to embedded local storage at '{self.settings.qdrant_storage_path}'."
            )

        # 2. Embedded on-disk or memory fallback
        storage_path = Path(self.settings.qdrant_storage_path)
        storage_path.mkdir(parents=True, exist_ok=True)
        self.backend_type = "embedded_qdrant"
        return QdrantClient(path=str(storage_path))

    def ensure_collection(self):
        """Ensures the vector collection exists with cosine distance."""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.VECTOR_SIZE, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection: {e}")

    def insert_point(
        self,
        point_id: str,
        vector: List[float],
        payload: Dict[str, Any],
    ) -> bool:
        """Stores a vector and payload in the collection."""
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload,
                    )
                ],
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upsert point to Qdrant: {e}")
            return False

    def search_similar(
        self,
        query_vector: List[float],
        limit: int = 1,
        score_threshold: Optional[float] = None,
    ) -> List[Any]:
        """Searches for top nearest vectors with optional threshold."""
        try:
            # Qdrant client 1.10+ uses query_points or search
            if hasattr(self.client, "search"):
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=limit,
                    score_threshold=score_threshold,
                )
                return results
            elif hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=limit,
                    score_threshold=score_threshold,
                )
                return response.points
        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}")
            return []
        return []

    def get_count(self) -> int:
        """Returns total entries stored in the cache collection."""
        try:
            info = self.client.get_collection(self.collection_name)
            return getattr(info, "points_count", 0) or 0
        except Exception:
            return 0

    def clear_collection(self):
        """Deletes all entries in the collection cleanly."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=FilterSelector(filter=Filter()),
            )
            logger.info(f"Cleared Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.warning(f"FilterSelector clear failed ({e}), falling back to collection recreation.")
            try:
                self.client.delete_collection(self.collection_name)
                self.ensure_collection()
                logger.info(f"Recreated Qdrant collection: {self.collection_name}")
            except Exception as e2:
                logger.error(f"Error recreating Qdrant collection: {e2}")


qdrant_manager = QdrantManager()
