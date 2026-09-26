from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Dict, Any, Optional, AsyncGenerator
from pydantic import BaseModel, Field, ConfigDict


class ModelTier(str, Enum):
    """Hierarchy of model capability tiers."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

    @classmethod
    def from_str(cls, val: str) -> "ModelTier":
        """Parse string case-insensitively into ModelTier."""
        normalized = val.strip().lower()
        for member in cls:
            if member.value == normalized:
                return member
        raise ValueError(f"Unknown ModelTier: '{val}'. Valid tiers are: {[m.value for m in cls]}")

    @property
    def level(self) -> int:
        """Numerical order: 1 (Small), 2 (Medium), 3 (Large)."""
        mapping = {ModelTier.SMALL: 1, ModelTier.MEDIUM: 2, ModelTier.LARGE: 3}
        return mapping[self]

    def next_tier(self) -> Optional["ModelTier"]:
        """Return the next escalation tier if available, otherwise None."""
        if self == ModelTier.SMALL:
            return ModelTier.MEDIUM
        elif self == ModelTier.MEDIUM:
            return ModelTier.LARGE
        return None


class ModelCapability(str, Enum):
    """Categorized capability tags for LLM models."""
    GENERAL = "general"
    CODE = "code"
    MATH = "math"
    REASONING = "reasoning"
    SUMMARIZATION = "summarization"
    CREATIVE = "creative"
    EXTRACTION = "extraction"


class ModelMetadata(BaseModel):
    """Complete metadata profile for a registered model."""
    model_config = ConfigDict(protected_namespaces=())

    model_name: str = Field(description="Name or identifier of the model (e.g. qwen2.5:0.5b)")
    tier: ModelTier = Field(description="Model capability tier: small, medium, or large")
    provider: str = Field(default="ollama", description="Provider backend (e.g. ollama, openai-compatible)")
    capabilities: List[str] = Field(default_factory=lambda: ["general"], description="Supported capabilities")
    context_length: int = Field(default=4096, description="Maximum context window in tokens")
    expected_latency_ms: float = Field(default=500.0, description="Baseline expected latency in milliseconds")
    measured_latency_ms: Optional[float] = Field(default=None, description="Rolling average of measured latency")
    token_usage_total: int = Field(default=0, description="Total tokens generated over lifetime")
    request_count: int = Field(default=0, description="Total requests processed")
    resource_requirements: Dict[str, Any] = Field(
        default_factory=lambda: {"ram_mb": 1000, "recommended_device": "cpu"},
        description="Estimated RAM/VRAM resource footprint"
    )
    quality_score_avg: float = Field(default=0.8, description="Historical average quality score [0.0 - 1.0]")
    enabled: bool = Field(default=True, description="Whether this model is active for routing")
    description: str = Field(default="", description="Human-readable model notes")


class GenerationRequest(BaseModel):
    """Standardized generation request."""
    model_config = ConfigDict(protected_namespaces=())

    prompt: str = Field(description="The input user prompt")
    model_name: Optional[str] = Field(default=None, description="Specific model override name if requested")
    tier: Optional[ModelTier] = Field(default=None, description="Requested tier if explicitly routed")
    system_prompt: Optional[str] = Field(default=None, description="Optional system instruction")
    max_tokens: Optional[int] = Field(default=1024, description="Maximum generation token limit")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    stream: bool = Field(default=False, description="Whether to stream token chunks")


class GenerationResponse(BaseModel):
    """Standardized generation output with performance instrumentation."""
    model_config = ConfigDict(protected_namespaces=())
    text: str = Field(description="Generated LLM response content")
    model_name: str = Field(description="Exact model name that generated the response")
    tier: ModelTier = Field(description="Tier of the model used")
    prompt_tokens: int = Field(default=0, description="Tokens in input prompt")
    completion_tokens: int = Field(default=0, description="Tokens generated in completion")
    total_tokens: int = Field(default=0, description="Sum of prompt and completion tokens")
    latency_ms: float = Field(description="End-to-end wall clock latency in milliseconds")
    tokens_per_second: float = Field(default=0.0, description="Generation throughput (tokens/sec)")
    load_duration_ms: float = Field(default=0.0, description="Model cold/warm load duration")
    eval_duration_ms: float = Field(default=0.0, description="Actual token evaluation duration")
    finish_reason: Optional[str] = Field(default="stop", description="Stop condition")
    raw_metadata: Dict[str, Any] = Field(default_factory=dict, description="Underlying provider-specific metadata")


class BaseModelProvider(ABC):
    """Abstract base class for all LLM providers (Ollama, local HF, optional APIs)."""

    @abstractmethod
    async def generate(self, request: GenerationRequest) -> GenerationResponse:
        """Execute a text completion synchronously and return structured response."""
        pass

    @abstractmethod
    async def generate_stream(self, request: GenerationRequest) -> AsyncGenerator[str, None]:
        """Yield text token chunks asynchronously as they are produced."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider daemon/backend is accessible and operational."""
        pass

    @abstractmethod
    async def list_available_models(self) -> List[str]:
        """Return list of models available in the provider's runtime."""
        pass
