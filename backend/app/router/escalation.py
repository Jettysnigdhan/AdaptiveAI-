from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.base import ModelTier


class EscalationTrace(BaseModel):
    """Details of a single tier step in an execution cascade."""
    model_config = ConfigDict(protected_namespaces=())

    tier: ModelTier
    model_name: str
    quality_score: float
    passed: bool
    latency_ms: float
    reason: str


class CascadingSummary(BaseModel):
    """Complete trace of an adaptive cascading execution."""
    model_config = ConfigDict(protected_namespaces=())
    initial_tier: ModelTier
    initial_model: str
    final_tier: ModelTier
    final_model: str
    escalated: bool = False
    escalation_count: int = 0
    traces: List[EscalationTrace] = Field(default_factory=list)
    overall_explanation: str = ""
