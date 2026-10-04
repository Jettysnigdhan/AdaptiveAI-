"""Configuration management using Pydantic Settings."""

import os
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Central configuration for Semantic Cost-Aware LLM Router."""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    app_name: str = "Semantic Cost-Aware LLM Router"
    app_version: str = "1.0.0"
    debug: bool = False

    # LLM Provider & Models
    llm_provider: str = Field(default="groq", description="Provider: groq, openai, anthropic, ollama, mock")
    small_model: str = Field(default="groq/openai/gpt-oss-20b", description="Small/fast model identifier")
    large_model: str = Field(default="groq/openai/gpt-oss-120b", description="Large/flagship model identifier")

    # API Keys
    api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    # Vector Cache (Qdrant)
    qdrant_url: str = Field(default="http://localhost:6333", description="Qdrant service URL")
    qdrant_collection: str = Field(default="semantic_cache", description="Collection name for semantic cache")
    qdrant_storage_path: str = Field(default="data/qdrant_storage", description="Local on-disk fallback path if Docker is down")

    # Semantic Cache Settings
    cache_similarity_threshold: float = Field(default=0.90, description="Cosine similarity threshold for cache hit")
    cache_ttl_seconds: int = Field(default=86400, description="Time to live in seconds (default 24h)")
    corpus_version: str = Field(default="v1", description="Corpus version for invalidation")
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", description="HuggingFace model for embeddings")

    # Pricing Table (USD per token)
    small_model_input_price: float = Field(default=0.0000001, description="Small model input price per token ($0.10/M)")
    small_model_output_price: float = Field(default=0.0000002, description="Small model output price per token ($0.20/M)")
    large_model_input_price: float = Field(default=0.000001, description="Large model input price per token ($1.00/M)")
    large_model_output_price: float = Field(default=0.000002, description="Large model output price per token ($2.00/M)")

    # Database
    database_path: str = Field(default="data/semantic_router.db", description="SQLite database file path")

    def get_price_table(self) -> Dict[str, Dict[str, float]]:
        """Returns the configurable pricing table for registered models."""
        return {
            self.small_model: {
                "input": self.small_model_input_price,
                "output": self.small_model_output_price,
            },
            self.large_model: {
                "input": self.large_model_input_price,
                "output": self.large_model_output_price,
            },
        }

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        """Calculates request cost based on model and token counts."""
        price_table = self.get_price_table()
        # Find matching model rates or determine tier from model string
        if model_name in price_table:
            rates = price_table[model_name]
        elif any(s in model_name.lower() for s in ["small", "mini", "20b", "0.5b", "1.5b", "haiku"]):
            rates = {
                "input": self.small_model_input_price,
                "output": self.small_model_output_price,
            }
        else:
            rates = {
                "input": self.large_model_input_price,
                "output": self.large_model_output_price,
            }

        cost = (input_tokens * rates["input"]) + (output_tokens * rates["output"])
        return round(cost, 6)


_settings_instance: Optional[Settings] = None


def get_settings() -> Settings:
    """Returns singleton settings instance."""
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance
