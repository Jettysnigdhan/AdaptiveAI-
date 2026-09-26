"""
AdaptiveRoute MCP (Model Context Protocol) Adapter.

Exposes AdaptiveRoute capabilities as standardized tools for MCP-compatible AI clients:
1. `route_and_generate`: Dynamically routes prompt to minimum required model tier and returns response.
2. `analyze_prompt_complexity`: Inspects lexical & semantic signals without generating.
3. `get_routing_metrics`: Inspects real-time telemetry and tier distribution.

Architecture:
AI Client (Cursor / Claude Desktop / Custom Agent)
      │
      ▼
MCP Tool Call
      │
      ▼
AdaptiveRoute Gateway
      │
      ▼
Model Registry & Providers
"""

import asyncio
import json
from typing import Dict, Any, Optional

from backend.app.services.inference_service import inference_service
from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.router.model_router import router
from backend.app.database.database import get_system_metrics


class AdaptiveRouteMCP:
    """MCP Adapter exposing AdaptiveRoute routing tools."""

    @staticmethod
    def get_tool_definitions() -> list:
        """Returns standard MCP tool schemas."""
        return [
            {
                "name": "route_and_generate",
                "description": "Intelligently routes a prompt to the lowest-cost sufficient model tier (Small, Medium, or Large) and generates a completion with automated quality evaluation.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "The user prompt to answer"},
                        "max_tokens": {"type": "integer", "default": 1024},
                        "temperature": {"type": "number", "default": 0.7},
                    },
                    "required": ["prompt"],
                },
            },
            {
                "name": "analyze_prompt_complexity",
                "description": "Analyzes prompt complexity, extracting mathematical, coding, and reasoning indicators, and predicting the optimal model tier without executing inference.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "The prompt to analyze"},
                    },
                    "required": ["prompt"],
                },
            },
            {
                "name": "get_routing_metrics",
                "description": "Retrieves real-time system metrics, latency averages, quality ratings, and model tier offloading distribution.",
                "inputSchema": {"type": "object", "properties": {}},
            },
        ]

    @classmethod
    async def call_tool(cls, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch MCP tool calls."""
        if name == "route_and_generate":
            prompt = arguments.get("prompt", "")
            temp = float(arguments.get("temperature", 0.7))
            max_tok = int(arguments.get("max_tokens", 1024))
            resp = await inference_service.process_chat(prompt, temperature=temp, max_tokens=max_tok)
            return resp.model_dump()

        elif name == "analyze_prompt_complexity":
            prompt = arguments.get("prompt", "")
            analysis = analyzer.analyze(prompt)
            decision = router.route(analysis)
            return {
                "detected_category": analysis.detected_category,
                "complexity_score": analysis.complexity_score,
                "token_estimate": analysis.extracted_tokens,
                "predicted_tier": decision.selected_tier.value,
                "recommended_model": decision.selected_model,
                "confidence": decision.confidence,
                "routing_explanation": decision.explanation,
            }

        elif name == "get_routing_metrics":
            return await get_system_metrics()

        else:
            raise ValueError(f"Unknown MCP tool: {name}")


mcp_adapter = AdaptiveRouteMCP()
