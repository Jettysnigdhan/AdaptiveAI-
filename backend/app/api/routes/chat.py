import json
import time
import uuid
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

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


class OpenAIMessage(BaseModel):
    role: str
    content: Union[str, List[Any]]


class OpenAIChatCompletionRequest(BaseModel):
    """Standard OpenAI Chat Completion request payload."""
    model: Optional[str] = "adaptive-auto"
    messages: List[OpenAIMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False


@router.post("/chat/completions")
async def openai_chat_completions(
    request: OpenAIChatCompletionRequest,
    service: InferenceService = Depends(get_inference_service),
):
    """
    OpenAI-Compatible Chat Completions Gateway.
    Allows Cursor, Antigravity, VS Code (Continue/Cline/Roo-Code), Claude Code,
    or any AI agent to use AdaptiveRoute as a drop-in proxy.

    Automatically switches between:
    - Small model (Fast/Zero-cost) for low-complexity tasks, syntax, git, docstrings.
    - Medium model for frontend UI, React, CSS, and standard components.
    - Large model (Claude 3.5 Sonnet / GPT-4o / DeepSeek R1) for complex backend,
      database architecture, security, and hard debugging.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty.")

    # 1. Reconstruct prompt and extract system instruction
    system_prompt = None
    user_contents = []

    for msg in request.messages:
        content_text = ""
        if isinstance(msg.content, str):
            content_text = msg.content
        elif isinstance(msg.content, list):
            # Multimodal or multipart content list
            for part in msg.content:
                if isinstance(part, dict) and part.get("type") == "text":
                    content_text += part.get("text", "") + "\n"
        if msg.role == "system":
            system_prompt = content_text
        elif msg.role == "user":
            user_contents.append(content_text)
        elif msg.role == "assistant":
            user_contents.append(f"Assistant: {content_text}")

    full_prompt = "\n".join(user_contents)
    if not full_prompt.strip():
        full_prompt = system_prompt or "Hello"

    # 2. Dynamic Model Routing
    # Adaptive Intelligent Interception:
    # Even if the client passed a default higher model (e.g. "claude-3-5-sonnet", "gpt-4o"),
    # we inspect the prompt. A simple prompt like "3*4" will dynamically downscale to the SMALL tier.
    raw_req_model = (request.model or "adaptive-auto").strip()
    req_model = raw_req_model.lower()
    force_tier = None
    force_model = None

    if req_model.startswith("direct:"):
        force_model = raw_req_model[7:].strip()
    elif req_model in ("small", "medium", "large"):
        force_tier = req_model
    # Otherwise, perform adaptive routing across tiers based on prompt semantics!

    if force_model:
        selected_model = force_model
        meta = registry.get_model(selected_model)
        selected_tier = meta.tier if meta else ModelTier.MEDIUM
        decision_explanation = f"Direct model specified by client: {selected_model}"
        confidence = 1.0
    else:
        analysis = analyzer.analyze(full_prompt)
        decision = model_router.route(analysis, force_policy="rule" if not model_router._ml_model else None)
        if force_tier:
            target_model = registry.get_default_model_for_tier(ModelTier.from_str(force_tier))
            selected_model = target_model.model_name if target_model else decision.selected_model
            selected_tier = ModelTier.from_str(force_tier)
        else:
            selected_model = decision.selected_model
            selected_tier = decision.selected_tier
        decision_explanation = decision.explanation
        confidence = decision.confidence

    provider = provider_factory.get_provider_for_model(selected_model)
    gen_req = GenerationRequest(
        prompt=full_prompt,
        system_prompt=system_prompt,
        model_name=selected_model,
        tier=selected_tier,
        max_tokens=request.max_tokens,
        temperature=request.temperature or 0.7,
    )

    created_timestamp = int(time.time())
    completion_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"

    # 3. Streaming Mode (SSE standard format)
    if request.stream:
        async def openai_stream_generator():
            # Initial chunk (role)
            first_chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created_timestamp,
                "model": selected_model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {"role": "assistant", "content": ""},
                        "finish_reason": None,
                    }
                ],
            }
            yield f"data: {json.dumps(first_chunk)}\n\n"

            # Token chunks
            try:
                async for token in provider.generate_stream(gen_req):
                    chunk = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created_timestamp,
                        "model": selected_model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"content": token},
                                "finish_reason": None,
                            }
                        ],
                    }
                    yield f"data: {json.dumps(chunk)}\n\n"
            except Exception as e:
                err_chunk = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created_timestamp,
                    "model": selected_model,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {"content": f"\n\n[Gateway Error: {str(e)}]"},
                            "finish_reason": "error",
                        }
                    ],
                }
                yield f"data: {json.dumps(err_chunk)}\n\n"

            # Final stop chunk
            final_chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": created_timestamp,
                "model": selected_model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop",
                    }
                ],
            }
            yield f"data: {json.dumps(final_chunk)}\n\n"
            yield "data: [DONE]\n\n"

        headers = {
            "X-Adaptive-Model": selected_model,
            "X-Adaptive-Tier": selected_tier.value,
            "X-Adaptive-Reason": decision_explanation[:200],
            "X-Adaptive-Confidence": str(round(confidence, 3)),
            "X-Adaptive-Quality": str(round(decision.predicted_qualities.get(selected_tier.value, 0.85), 3)),
            "X-Adaptive-Escalated": "false",
            "X-Adaptive-Latency": "streaming",
            "X-Adaptive-Request-ID": completion_id,
        }
        return StreamingResponse(
            openai_stream_generator(),
            media_type="text/event-stream",
            headers=headers,
        )

    # 4. Synchronous / Non-Streaming Mode
    try:
        if not force_model:
            # Full AdaptiveRoute Pipeline: ML Routing + Generation + Quality Evaluation + Cascading
            chat_resp = await service.process_chat(
                prompt=full_prompt,
                temperature=request.temperature or 0.7,
                max_tokens=request.max_tokens or 1024,
                force_tier=force_tier,
            )
            response_body = {
                "id": f"chatcmpl-{chat_resp.request_id}",
                "object": "chat.completion",
                "created": created_timestamp,
                "model": chat_resp.final_model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": chat_resp.response,
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": chat_resp.prompt_tokens,
                    "completion_tokens": chat_resp.completion_tokens,
                    "total_tokens": chat_resp.total_tokens,
                },
                "adaptive_routing": {
                    "tier": chat_resp.tier,
                    "initial_model": chat_resp.initial_model,
                    "final_model": chat_resp.final_model,
                    "escalated": chat_resp.escalated,
                    "escalation_count": chat_resp.escalation_count,
                    "quality_score": chat_resp.quality_score,
                    "confidence": chat_resp.confidence,
                    "latency_ms": chat_resp.latency_ms,
                    "explanation": chat_resp.explanation,
                    "routing_path": chat_resp.routing_path,
                },
            }
            is_downscaled = (
                chat_resp.tier != "large"
                and any(h in req_model for h in ["large", "sonnet", "opus", "gpt-4", "deepseek-r1"])
            )
            headers = {
                "X-Adaptive-Model": chat_resp.final_model,
                "X-Adaptive-Tier": chat_resp.tier,
                "X-Adaptive-Requested-Model": raw_req_model,
                "X-Adaptive-Downscaled": "true" if is_downscaled else "false",
                "X-Adaptive-Reason": chat_resp.explanation[:200],
                "X-Adaptive-Confidence": str(round(chat_resp.confidence, 3)),
                "X-Adaptive-Quality": str(round(chat_resp.quality_score, 3)),
                "X-Adaptive-Escalated": "true" if chat_resp.escalated else "false",
                "X-Adaptive-Latency": str(round(chat_resp.latency_ms, 1)),
                "X-Adaptive-Request-ID": chat_resp.request_id,
            }
            return JSONResponse(content=response_body, headers=headers)
        else:
            # Direct model requested
            gen_resp = await provider.generate(gen_req)
            response_body = {
                "id": completion_id,
                "object": "chat.completion",
                "created": created_timestamp,
                "model": selected_model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": gen_resp.text,
                        },
                        "finish_reason": gen_resp.finish_reason or "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": gen_resp.prompt_tokens,
                    "completion_tokens": gen_resp.completion_tokens,
                    "total_tokens": gen_resp.total_tokens,
                },
                "adaptive_routing": {
                    "tier": selected_tier.value,
                    "selected_model": selected_model,
                    "latency_ms": gen_resp.latency_ms,
                    "explanation": decision_explanation,
                    "confidence": confidence,
                },
            }
            headers = {
                "X-Adaptive-Model": selected_model,
                "X-Adaptive-Tier": selected_tier.value,
                "X-Adaptive-Requested-Model": raw_req_model,
                "X-Adaptive-Downscaled": "false",
                "X-Adaptive-Reason": decision_explanation[:200],
                "X-Adaptive-Confidence": str(round(confidence, 3)),
                "X-Adaptive-Quality": "1.0",
                "X-Adaptive-Escalated": "false",
                "X-Adaptive-Latency": str(round(gen_resp.latency_ms, 1)),
                "X-Adaptive-Request-ID": completion_id,
            }
            return JSONResponse(content=response_body, headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error with model '{selected_model}': {e}")


# ==============================================================================
# Native Anthropic Messages API Endpoint (/v1/messages and /messages)
# Compatible with Claude Code CLI, Claude Desktop, Anthropic Python/Node SDK,
# Cline, Cursor, Continue, and any Claude integration.
# ==============================================================================

class AnthropicMessage(BaseModel):
    role: str
    content: Union[str, List[Any]]


class AnthropicMessagesRequest(BaseModel):
    """Anthropic Messages API request format."""
    model: Optional[str] = "claude-3-5-sonnet-20241022"
    messages: List[AnthropicMessage]
    system: Optional[Union[str, List[Any]]] = None
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    stop_sequences: Optional[List[str]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/messages")
async def anthropic_messages(
    request: AnthropicMessagesRequest,
    service: InferenceService = Depends(get_inference_service),
):
    """
    Native Anthropic Messages API endpoint (/v1/messages and /messages).
    Allows Claude Chat, Claude Code CLI, and Anthropic SDK tools to use AdaptiveRoute.

    Automatic Dynamic Downscaling:
    Even when the client selects a high model like 'claude-3-5-sonnet', simple prompts
    (such as '3*4', greetings, or basic syntax queries) are automatically routed to
    the Small tier (e.g. grok-2-mini / Claude 3.5 Haiku / local fast model), delivering
    sub-second latency and dramatic cost savings.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty.")

    # 1. Parse system prompt and user text from Anthropic content blocks
    system_prompt = None
    if isinstance(request.system, str):
        system_prompt = request.system
    elif isinstance(request.system, list):
        sys_blocks = []
        for blk in request.system:
            if isinstance(blk, dict) and blk.get("type") == "text":
                sys_blocks.append(blk.get("text", ""))
            elif isinstance(blk, str):
                sys_blocks.append(blk)
        system_prompt = "\n".join(sys_blocks)

    user_contents = []
    for msg in request.messages:
        text = ""
        if isinstance(msg.content, str):
            text = msg.content
        elif isinstance(msg.content, list):
            for part in msg.content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text += part.get("text", "") + "\n"
                elif isinstance(part, str):
                    text += part + "\n"
        if msg.role == "user":
            user_contents.append(text)
        elif msg.role == "assistant":
            user_contents.append(f"Assistant: {text}")

    full_prompt = "\n".join(user_contents).strip()
    if not full_prompt:
        full_prompt = system_prompt or "Hello"

    # 2. Dynamic Adaptive Routing: Intercept and determine minimum sufficient tier
    raw_req_model = (request.model or "claude-3-5-sonnet").strip()
    req_model = raw_req_model.lower()
    force_tier = None
    force_model = None

    if req_model.startswith("direct:"):
        force_model = raw_req_model[7:].strip()
    elif req_model in ("small", "medium", "large"):
        force_tier = req_model

    if force_model:
        selected_model = force_model
        meta = registry.get_model(selected_model)
        selected_tier = meta.tier if meta else ModelTier.MEDIUM
        decision_explanation = f"Direct model specified: {selected_model}"
        confidence = 1.0
        predicted_qualities = {selected_tier.value: 1.0}
    else:
        # Evaluate prompt semantics
        analysis = analyzer.analyze(full_prompt)
        decision = model_router.route(analysis, force_policy="rule" if not model_router._ml_model else None)
        if force_tier:
            target_model = registry.get_default_model_for_tier(ModelTier.from_str(force_tier))
            selected_model = target_model.model_name if target_model else decision.selected_model
            selected_tier = ModelTier.from_str(force_tier)
        else:
            selected_model = decision.selected_model
            selected_tier = decision.selected_tier
        decision_explanation = decision.explanation
        confidence = decision.confidence
        predicted_qualities = decision.predicted_qualities

    provider = provider_factory.get_provider_for_model(selected_model)
    gen_req = GenerationRequest(
        prompt=full_prompt,
        system_prompt=system_prompt,
        model_name=selected_model,
        tier=selected_tier,
        max_tokens=request.max_tokens or 1024,
        temperature=request.temperature or 0.7,
    )

    message_id = f"msg_{uuid.uuid4().hex[:24]}"
    is_downscaled = (
        selected_tier != ModelTier.LARGE
        and any(h in req_model for h in ["large", "sonnet", "opus", "gpt-4", "deepseek-r1"])
    )

    common_headers = {
        "anthropic-version": "2023-06-01",
        "X-Adaptive-Model": selected_model,
        "X-Adaptive-Tier": selected_tier.value,
        "X-Adaptive-Requested-Model": raw_req_model,
        "X-Adaptive-Downscaled": "true" if is_downscaled else "false",
        "X-Adaptive-Reason": decision_explanation[:200],
        "X-Adaptive-Confidence": str(round(confidence, 3)),
        "X-Adaptive-Quality": str(round(predicted_qualities.get(selected_tier.value, 0.85), 3)),
        "X-Adaptive-Request-ID": message_id,
    }

    # 3. Streaming Mode (Anthropic SSE Protocol)
    if request.stream:
        async def anthropic_stream_generator():
            # Event 1: message_start
            start_event = {
                "type": "message_start",
                "message": {
                    "id": message_id,
                    "type": "message",
                    "role": "assistant",
                    "content": [],
                    "model": selected_model,
                    "stop_reason": None,
                    "stop_sequence": None,
                    "usage": {
                        "input_tokens": max(1, len(full_prompt) // 4),
                        "output_tokens": 1,
                    },
                },
            }
            yield f"event: message_start\ndata: {json.dumps(start_event)}\n\n"

            # Event 2: content_block_start
            block_start = {
                "type": "content_block_start",
                "index": 0,
                "content_block": {"type": "text", "text": ""},
            }
            yield f"event: content_block_start\ndata: {json.dumps(block_start)}\n\n"

            # Event 3: content_block_delta chunks
            token_count = 0
            try:
                async for token in provider.generate_stream(gen_req):
                    token_count += 1
                    delta_event = {
                        "type": "content_block_delta",
                        "index": 0,
                        "delta": {"type": "text_delta", "text": token},
                    }
                    yield f"event: content_block_delta\ndata: {json.dumps(delta_event)}\n\n"
            except Exception as e:
                err_delta = {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "text_delta", "text": f"\n\n[AdaptiveRoute Error: {str(e)}]"},
                }
                yield f"event: content_block_delta\ndata: {json.dumps(err_delta)}\n\n"

            # Event 4: content_block_stop
            yield f"event: content_block_stop\ndata: {json.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"

            # Event 5: message_delta (stop reason and usage)
            delta_msg = {
                "type": "message_delta",
                "delta": {"stop_reason": "end_turn", "stop_sequence": None},
                "usage": {"output_tokens": max(1, token_count)},
            }
            yield f"event: message_delta\ndata: {json.dumps(delta_msg)}\n\n"

            # Event 6: message_stop
            yield f"event: message_stop\ndata: {json.dumps({'type': 'message_stop'})}\n\n"

        return StreamingResponse(
            anthropic_stream_generator(),
            media_type="text/event-stream",
            headers=common_headers,
        )

    # 4. Synchronous Non-Streaming Mode
    try:
        gen_resp = await provider.generate(gen_req)
        response_body = {
            "id": message_id,
            "type": "message",
            "role": "assistant",
            "model": selected_model,
            "content": [
                {
                    "type": "text",
                    "text": gen_resp.text,
                }
            ],
            "stop_reason": "end_turn",
            "stop_sequence": None,
            "usage": {
                "input_tokens": gen_resp.prompt_tokens,
                "output_tokens": gen_resp.completion_tokens,
            },
            "adaptive_routing": {
                "tier": selected_tier.value,
                "requested_model": raw_req_model,
                "selected_model": selected_model,
                "downscaled": is_downscaled,
                "latency_ms": gen_resp.latency_ms,
                "explanation": decision_explanation,
                "confidence": confidence,
            },
        }
        common_headers["X-Adaptive-Latency"] = str(round(gen_resp.latency_ms, 1))
        return JSONResponse(content=response_body, headers=common_headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error with model '{selected_model}': {e}")

