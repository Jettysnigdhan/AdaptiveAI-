from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from backend.app.database.database import get_system_metrics, get_recent_inferences, aiosqlite, DB_PATH
from backend.app.services.benchmark_service import BenchmarkService
from backend.app.api.dependencies import get_benchmark_service

router = APIRouter(tags=["Metrics & Benchmarks"])


@router.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Retrieve aggregate telemetry and routing statistics."""
    return await get_system_metrics()


@router.get("/metrics/inferences")
async def get_inferences_log(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve detailed execution log for recent inferences."""
    return await get_recent_inferences(limit=limit)


@router.get("/routing/{request_id}")
async def get_routing_detail(request_id: str) -> Dict[str, Any]:
    """Inspect complete routing trace and escalation history for a specific request ID."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM inference_logs WHERE request_id = ?", (request_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Request ID '{request_id}' not found.")
            return dict(row)


@router.post("/benchmark/run")
async def run_benchmark(
    bench: BenchmarkService = Depends(get_benchmark_service)
) -> Dict[str, Any]:
    """
    Execute full empirical comparison across Baselines (Small, Medium, Large, Rule)
    vs AdaptiveRoute.
    """
    return await bench.run_full_comparison()


@router.get("/metrics/baselines")
async def get_baseline_comparison() -> Dict[str, Any]:
    """Retrieve measured baseline comparison report."""
    from pathlib import Path
    import json
    report_file = Path("./evaluation/reports/baseline_comparison_report.json")
    if not report_file.exists():
        return {
            "status": "not_available",
            "message": "Benchmark not available. Run benchmark to generate results.",
            "policies": {}
        }
    try:
        with open(report_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"status": "available", **data}
    except Exception as e:
        return {"status": "error", "message": str(e), "policies": {}}

