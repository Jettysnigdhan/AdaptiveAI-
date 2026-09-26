from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class InferenceLogModel(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    id: Optional[int] = None
    request_id: str
    timestamp: str
    prompt: str
    response: str
    initial_model: str
    initial_tier: str
    final_model: str
    final_tier: str
    router_decision: Optional[str] = None
    router_confidence: float = 0.0
    quality_score: float = 0.0
    evaluator_confidence: float = 0.0
    escalated: bool = False
    escalation_count: int = 0
    escalation_reason: Optional[str] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0


class BenchmarkRunModel(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    id: Optional[int] = None
    run_id: str
    timestamp: str
    category: str
    prompt: str
    model_name: str
    tier: str
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    quality_score: float
    passed: bool
    evaluation_reason: Optional[str] = None
