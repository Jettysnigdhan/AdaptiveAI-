from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """AdaptiveRoute Gateway Configuration."""

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=(),
    )

    # Application
    app_name: str = "AdaptiveRoute"
    environment: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # Ollama / Local Model Runtime
    ollama_base_url: str = Field(default="http://localhost:11434", description="Base URL for local Ollama daemon")
    ollama_timeout_seconds: float = Field(default=120.0, description="Inference timeout per request in seconds")

    # Optional Cloud API Providers (Groq / xAI / OpenAI Compatible)
    active_provider: str = Field(default="groq", description="Active provider: 'groq', 'ollama', 'xai', or 'hybrid'")

    # Groq LPU Provider (Ultra-fast LPU inference: https://api.groq.com/openai/v1)
    groq_api_key: Optional[str] = Field(default=None, description="Groq API Key (set via GROQ_API_KEY environment variable)")
    groq_base_url: str = Field(default="https://api.groq.com/openai/v1", description="Groq API base URL")
    groq_model_small: str = Field(default="openai/gpt-oss-20b", description="Groq model for Small tier (~270ms, English)")
    groq_model_medium: str = Field(default="qwen/qwen3.8-27b", description="Groq model for Medium tier (~170ms)")
    groq_model_large: str = Field(default="openai/gpt-oss-120b", description="Groq model for Large tier (~860ms, 120B)")

    # Anthropic / Claude Provider
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API Key for Claude")
    anthropic_base_url: str = Field(default="https://api.anthropic.com/v1", description="Anthropic API base URL")
    anthropic_model_small: str = Field(default="claude-3-5-haiku-20241022", description="Claude model for Small tier")
    anthropic_model_medium: str = Field(default="claude-3-5-haiku-20241022", description="Claude model for Medium tier")
    anthropic_model_large: str = Field(default="claude-3-5-sonnet-20241022", description="Claude model for Large tier")

    # OpenAI Provider (ChatGPT / GPT-4o)
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API Key for ChatGPT/GPT-4o")
    openai_base_url: str = Field(default="https://api.openai.com/v1", description="OpenAI API base URL")
    openai_model_small: str = Field(default="gpt-4o-mini", description="OpenAI model for Small tier")
    openai_model_medium: str = Field(default="gpt-4o-mini", description="OpenAI model for Medium tier")
    openai_model_large: str = Field(default="gpt-4o", description="OpenAI model for Large tier")

    # xAI / Grok Provider
    xai_api_key: Optional[str] = Field(default=None, description="xAI / Grok API key")
    xai_base_url: str = Field(default="https://api.x.ai/v1", description="xAI / Grok API base URL")
    grok_model_small: str = Field(default="grok-2-mini", description="Grok model for Small tier")
    grok_model_medium: str = Field(default="grok-2-mini", description="Grok model for Medium tier")
    grok_model_large: str = Field(default="grok-2", description="Grok model for Large tier")
    xai_model_small: Optional[str] = Field(default=None, description="xAI model for Small tier (alias)")
    xai_model_medium: Optional[str] = Field(default=None, description="xAI model for Medium tier (alias)")
    xai_model_large: Optional[str] = Field(default=None, description="xAI model for Large tier (alias)")

    # Model Tiers Configuration (Local Zero-Cost)
    model_small: str = Field(default="qwen2.5:0.5b", description="Small tier local model (fastest, lowest resource)")
    model_medium: str = Field(default="qwen2.5-coder:1.5b", description="Medium tier local model (code/moderate reasoning)")
    model_large: str = Field(default="deepseek-r1:8b", description="Large tier local model (complex reasoning & synthesis)")

    # Embedding Model (Sentence Transformers)
    embedding_model: str = Field(default="all-MiniLM-L6-v2", description="HuggingFace sentence-transformers model")

    # Routing & Cascading Policy
    routing_mode: str = Field(default="auto", description="Routing mode: 'auto', 'rule', or 'fixed'")
    fixed_tier: str = Field(default="SMALL", description="Tier to use when routing_mode is fixed")
    default_tier: str = Field(default="SMALL", description="Default model tier")
    quality_threshold: float = Field(default=0.85, description="Target minimum quality score before escalating")
    max_escalations: int = Field(default=2, description="Maximum number of escalation hops per request")
    routing_lambda_latency: float = Field(default=0.001, description="Weight penalty for latency in utility function")
    routing_lambda_compute: float = Field(default=0.002, description="Weight penalty for compute/tokens in utility function")

    # Persistence & Privacy
    store_prompts: bool = Field(default=False, description="Persist raw prompts in logs (set true for benchmark/auditing)")
    database_url: str = Field(default="sqlite+aiosqlite:///./adaptiveroute.db", description="Database URI for logs & metrics")

    @property
    def effective_grok_small(self) -> str:
        return self.xai_model_small or self.grok_model_small

    @property
    def effective_grok_medium(self) -> str:
        return self.xai_model_medium or self.grok_model_medium

    @property
    def effective_grok_large(self) -> str:
        return self.xai_model_large or self.grok_model_large


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()


settings = get_settings()
