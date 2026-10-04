"""Bridge mounting the Semantic Cost-Aware LLM Router into the main FastAPI application."""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

# Ensure semantic-router package is in sys.path
sr_dir = Path(__file__).resolve().parents[4] / "semantic-router"
if str(sr_dir) not in sys.path:
    sys.path.insert(0, str(sr_dir))

from app.schemas import AnswerRequest, AnswerResponse
from app.rag.pipeline import pipeline
from app.cache.semantic_cache import semantic_cache
from app.database.logger import db_logger
from app.evaluation.evaluator import evaluator

router = APIRouter(tags=["Semantic Router"])


@router.post("/answer", response_model=AnswerResponse)
async def answer_query(request: AnswerRequest) -> AnswerResponse:
    """Main Semantic Cost-Aware Router endpoint."""
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query text must not be empty.")
    try:
        return pipeline.process_query(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.get("/stats")
async def get_stats():
    """Aggregate telemetry from SQLite."""
    return db_logger.get_aggregate_stats()


@router.get("/cache/stats")
async def get_cache_stats():
    """Qdrant vector collection telemetry."""
    return semantic_cache.get_stats()


@router.delete("/cache")
async def invalidate_cache():
    """Flushes cached points in Qdrant collection."""
    semantic_cache.invalidate_cache()
    return {"status": "success", "message": "Semantic cache invalidated successfully."}


@router.get("/requests")
async def get_requests(limit: int = Query(default=50, ge=1, le=200)):
    """Recent inference audit logs from SQLite."""
    return db_logger.get_recent_requests(limit=limit)


@router.get("/evaluation")
async def get_evaluation():
    """Empirical precision/recall threshold evaluation metrics."""
    metrics = evaluator.evaluate_thresholds()
    best_th = 0.85
    best_f1 = -1.0
    for m in metrics:
        if m["f1_score"] > best_f1:
            best_f1 = m["f1_score"]
            best_th = m["threshold"]
    return {
        "status": "success",
        "threshold_metrics": metrics,
        "evaluation_dataset_size": len(evaluator.dataset),
        "recommended_optimal_threshold": best_th,
        "recommended_f1_score": round(best_f1, 4),
    }


@router.post("/benchmark/run")
async def run_benchmark_endpoint(sample_size: int = Query(default=25, ge=5, le=50)):
    """Runs live empirical benchmark comparing Baseline vs. Optimized pipeline."""
    return evaluator.run_benchmark(sample_size=sample_size)
