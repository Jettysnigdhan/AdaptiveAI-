"""FastAPI application entrypoint for Semantic Cost-Aware LLM Router."""

from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.schemas import (
    AnswerRequest,
    AnswerResponse,
    StatsResponse,
    CacheStatsResponse,
    RequestLogItem,
    BenchmarkComparison,
)
from app.rag.pipeline import pipeline
from app.cache.semantic_cache import semantic_cache
from app.database.logger import db_logger
from app.evaluation.evaluator import evaluator

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    # Ensure database tables exist
    db_logger.init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-grade AI inference layer with semantic caching, deterministic routing, and quality escalation.",
    lifespan=lifespan,
)

# Enable CORS for dashboard and external consumers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    """Root metadata endpoint."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "healthy",
        "endpoints": {
            "answer": "POST /answer",
            "health": "GET /health",
            "stats": "GET /stats",
            "cache_stats": "GET /cache/stats",
            "requests": "GET /requests",
            "evaluation": "GET /evaluation",
            "benchmark": "POST /benchmark/run",
            "docs": "/docs",
        },
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """System health check including Qdrant and SQLite connectivity."""
    cache_stats = semantic_cache.get_stats()
    return {
        "status": "healthy",
        "llm_provider": settings.llm_provider,
        "small_model": settings.small_model,
        "large_model": settings.large_model,
        "qdrant_status": "connected",
        "qdrant_backend": cache_stats.get("connected_backend", "qdrant"),
        "qdrant_entries": cache_stats.get("total_entries", 0),
        "corpus_version": settings.corpus_version,
    }


@app.post("/answer", response_model=AnswerResponse, tags=["Inference"])
async def answer_query(request: AnswerRequest) -> AnswerResponse:
    """
    Main inference endpoint:
    Checks semantic cache -> Routes to optimal model tier ->
    Escalates if weak -> Caches valid answers -> Logs to SQLite.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query text must not be empty.")

    try:
        response = pipeline.process_query(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@app.get("/stats", response_model=StatsResponse, tags=["Telemetry"])
async def get_stats() -> StatsResponse:
    """Retrieves aggregate inference telemetry, costs, and latencies."""
    stats = db_logger.get_aggregate_stats()
    return StatsResponse(**stats)


@app.get("/cache/stats", response_model=CacheStatsResponse, tags=["Cache"])
async def get_cache_stats() -> CacheStatsResponse:
    """Retrieves semantic cache and Qdrant vector statistics."""
    stats = semantic_cache.get_stats()
    return CacheStatsResponse(**stats)


@app.delete("/cache", tags=["Cache"])
async def clear_cache():
    """Clears and invalidates the semantic cache."""
    semantic_cache.invalidate_cache()
    return {"message": "Semantic cache successfully invalidated."}


@app.get("/requests", response_model=List[RequestLogItem], tags=["Telemetry"])
async def get_request_logs(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Retrieves paginated SQLite request audit logs."""
    logs = db_logger.get_requests(limit=limit, offset=offset)
    return logs


@app.get("/evaluation", tags=["Evaluation"])
async def get_threshold_evaluation():
    """
    Runs threshold evaluation on ground-truth paraphrase and near-miss pairs,
    returning precision, recall, and false-hit rate for thresholds 0.85 - 0.97.
    """
    results = evaluator.evaluate_thresholds()
    return {
        "evaluation_dataset_size": len(evaluator.load_dataset()),
        "threshold_metrics": results,
    }


@app.post("/benchmark/run", response_model=BenchmarkComparison, tags=["Evaluation"])
async def run_benchmark(sample_size: int = Query(default=30, ge=5, le=100)):
    """
    Runs empirical benchmark comparing 100% Large Model Baseline
    against Optimized (Semantic Cache + Router + Escalation).
    """
    try:
        comparison = evaluator.run_benchmark(sample_size=sample_size)
        return comparison
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Benchmark error: {str(e)}",
        )
