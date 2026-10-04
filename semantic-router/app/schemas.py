"""Pydantic schemas for API requests, responses, and metrics."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AnswerRequest(BaseModel):
    """Client request for semantic answer completion."""
    query: str = Field(..., description="User query or prompt text", min_length=1)
    user_id: Optional[str] = Field(default=None, description="Optional user ID for session tracking")
    force_route: Optional[str] = Field(
        default=None,
        description="Optional route override: 'simple', 'complex', 'large', 'small'"
    )


class AnswerResponse(BaseModel):
    """Standardized response from the semantic routing gateway."""
    answer: str = Field(..., description="Generated or cached answer")
    model: str = Field(..., description="Model identifier used for inference or 'cache'")
    route: str = Field(..., description="Route taken: 'cache', 'simple', 'complex', 'escalated', or 'large'")
    cache_hit: bool = Field(default=False, description="Whether the answer was retrieved from semantic cache")
    latency_ms: float = Field(..., description="End-to-end request latency in milliseconds")
    cost: float = Field(..., description="Estimated request cost in USD")
    quality_score: Optional[float] = Field(default=None, description="Quality heuristic or evaluator score (0.0 to 1.0)")
    escalated: bool = Field(default=False, description="Whether request was escalated from small to large model")
    escalation_reason: Optional[str] = Field(default=None, description="Reason for escalation if applicable")
    input_tokens: int = Field(default=0, description="Number of prompt/input tokens")
    output_tokens: int = Field(default=0, description="Number of completion/output tokens")
    total_tokens: int = Field(default=0, description="Total tokens used")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of the response")


class CacheStatsResponse(BaseModel):
    """Vector database and semantic cache statistics."""
    total_entries: int = Field(default=0, description="Total cached vectors stored")
    collection_name: str = Field(default="semantic_cache")
    corpus_version: str = Field(default="v1")
    similarity_threshold: float = Field(default=0.90)
    ttl_seconds: int = Field(default=86400)
    connected_backend: str = Field(default="qdrant")


class RequestLogItem(BaseModel):
    """Schema for individual request history audit log."""
    id: int
    timestamp: str
    query: str
    model: str
    route: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: float
    latency_ms: float
    cache_hit: bool
    escalated: bool
    escalation_reason: Optional[str] = None
    quality_score: Optional[float] = None


class StatsResponse(BaseModel):
    """Aggregate telemetry and performance metrics."""
    total_requests: int = Field(default=0)
    cache_hits: int = Field(default=0)
    cache_hit_rate: float = Field(default=0.0)
    small_model_requests: int = Field(default=0)
    large_model_requests: int = Field(default=0)
    escalated_requests: int = Field(default=0)
    total_cost: float = Field(default=0.0)
    avg_cost_per_request: float = Field(default=0.0)
    avg_latency_ms: float = Field(default=0.0)
    p50_latency_ms: float = Field(default=0.0)
    p95_latency_ms: float = Field(default=0.0)
    avg_quality_score: float = Field(default=0.0)


class BenchmarkComparison(BaseModel):
    """Baseline vs Optimized comparison metrics."""
    total_requests: int
    baseline_cost: float
    optimized_cost: float
    cost_saved: float
    cost_reduction_percent: float
    baseline_p50_latency_ms: float
    optimized_p50_latency_ms: float
    latency_improvement_percent: float
    baseline_avg_quality: float
    optimized_avg_quality: float
    cache_hit_rate_percent: float
    escalation_rate_percent: float
