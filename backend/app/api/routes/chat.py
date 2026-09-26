import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional

from backend.app.services.inference_service import InferenceService, ChatResponse
from backend.app.api.dependencies import get_inference_service
from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.router.model_router import router as model_router
from backend.app.models.base import GenerationRequest, ModelTier
from backend.app.models.registry import registry
from backend.app.models.factory import provider_factory

router = APIRouter(tags=["Chat"])


class ChatRequest(BaseModel):
    """Client prompt submission payload."""
    prompt: str = Field(description="User prompt text")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1024, ge=1, le=8192)
    force_tier: Optional[str] = Field(default=None, description="Optional tier override: 'small', 'medium', 'large'")
    force_policy: Optional[str] = Field(default=None, description="Optional policy override: 'rule', 'ml', 'utility'")


@router.post("/chat", response_model=ChatResponse)
async def chat_gateway(
    request: ChatRequest,
    service: InferenceService = Depends(get_inference_service)
) -> ChatResponse:
    """
    Main AdaptiveRoute gateway endpoint.
    Performs prompt feature analysis, intelligent ML routing, execution,
    quality evaluation, and conditional adaptive escalation.
    """
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    try:
        response = await service.process_chat(
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            force_tier=request.force_tier,
            force_policy=request.force_policy,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream_gateway(
    request: ChatRequest,
    service: InferenceService = Depends(get_inference_service)
):
    """
    Server-Sent Events (SSE) streaming chat endpoint.
    Routes to the optimal model and streams token chunks in real-time.
    """
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    # 1. Route to determine model
    analysis = analyzer.analyze(request.prompt)
    decision = model_router.route(analysis, force_policy=request.force_policy)
    selected_model = decision.selected_model
    selected_tier = decision.selected_tier

    provider = provider_factory.get_provider_for_model(selected_model)
    gen_req = GenerationRequest(
        prompt=request.prompt,
        model_name=selected_model,
        tier=selected_tier,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
    )

    async def event_generator():
        # First event: Send routing metadata
        meta_event = {
            "type": "meta",
            "selected_model": selected_model,
            "tier": selected_tier.value,
            "explanation": decision.explanation,
            "confidence": decision.confidence,
            "category": analysis.detected_category,
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        # Token chunks
        try:
            async for token in provider.generate_stream(gen_req):
                chunk_event = {"type": "token", "content": token}
                yield f"data: {json.dumps(chunk_event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
