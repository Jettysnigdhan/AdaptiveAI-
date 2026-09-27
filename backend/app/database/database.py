import aiosqlite
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.app.core.config import get_settings
from backend.app.core.logging import logger

DB_PATH = Path("./adaptiveroute.db")


async def get_db():
    """Context-manager or connection supplier for aiosqlite."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


_db_initialized = False


async def init_db():
    """Initialize SQLite database tables and indices."""
    global _db_initialized
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS inference_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE NOT NULL,
                timestamp TEXT NOT NULL,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                initial_model TEXT NOT NULL,
                initial_tier TEXT NOT NULL,
                final_model TEXT NOT NULL,
                final_tier TEXT NOT NULL,
                router_decision TEXT,
                router_confidence REAL,
                quality_score REAL,
                evaluator_confidence REAL,
                escalated INTEGER DEFAULT 0,
                escalation_count INTEGER DEFAULT 0,
                escalation_reason TEXT,
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                latency_ms REAL NOT NULL
            );
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS benchmark_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                category TEXT NOT NULL,
                prompt TEXT NOT NULL,
                model_name TEXT NOT NULL,
                tier TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                prompt_tokens INTEGER,
                completion_tokens INTEGER,
                quality_score REAL,
                passed INTEGER,
                evaluation_reason TEXT
            );
        """)

        await db.execute("CREATE INDEX IF NOT EXISTS idx_inf_timestamp ON inference_logs(timestamp);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_inf_req_id ON inference_logs(request_id);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_bench_run_id ON benchmark_runs(run_id);")
        await db.commit()
    _db_initialized = True
    logger.info("Initialized SQLite database schema at adaptiveroute.db")


async def save_inference_log(log_data: Dict[str, Any]):
    """Insert structured inference log into SQLite, respecting STORE_PROMPTS privacy setting."""
    global _db_initialized
    if not _db_initialized:
        await init_db()

    settings = get_settings()
    stored_prompt = log_data.get("prompt", "") if settings.store_prompts else "[REDACTED_DATA_PRIVACY]"
    stored_response = log_data.get("response", "") if settings.store_prompts else "[REDACTED_DATA_PRIVACY]"

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT OR REPLACE INTO inference_logs (
                request_id, timestamp, prompt, response,
                initial_model, initial_tier, final_model, final_tier,
                router_decision, router_confidence, quality_score, evaluator_confidence,
                escalated, escalation_count, escalation_reason,
                prompt_tokens, completion_tokens, total_tokens, latency_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_data.get("request_id"),
            log_data.get("timestamp"),
            stored_prompt,
            stored_response,
            log_data.get("initial_model"),
            log_data.get("initial_tier"),
            log_data.get("final_model"),
            log_data.get("final_tier"),
            log_data.get("router_decision"),
            log_data.get("router_confidence", 0.0),
            log_data.get("quality_score", 0.0),
            log_data.get("evaluator_confidence", 0.0),
            1 if log_data.get("escalated") else 0,
            log_data.get("escalation_count", 0),
            log_data.get("escalation_reason", ""),
            log_data.get("prompt_tokens", 0),
            log_data.get("completion_tokens", 0),
            log_data.get("total_tokens", 0),
            log_data.get("latency_ms", 0.0),
        ))
        await db.commit()


async def get_recent_inferences(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve the most recent inference logs."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM inference_logs ORDER BY id DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


async def get_system_metrics() -> Dict[str, Any]:
    """Calculate aggregated telemetry metrics across all logged inferences according to Section 16."""
    import numpy as np
    from backend.app.core.config import settings

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT 
                COUNT(*) as total_requests,
                AVG(latency_ms) as avg_latency_ms,
                AVG(quality_score) as avg_quality_score,
                AVG(completion_tokens) as avg_output_tokens,
                SUM(CASE WHEN escalated = 1 THEN 1 ELSE 0 END) as escalated_count,
                SUM(total_tokens) as total_tokens,
                SUM(CASE WHEN final_tier = 'small' THEN 1 ELSE 0 END) as small_count,
                SUM(CASE WHEN final_tier = 'medium' THEN 1 ELSE 0 END) as medium_count,
                SUM(CASE WHEN final_tier = 'large' THEN 1 ELSE 0 END) as large_count,
                SUM(CASE WHEN quality_score < ? THEN 1 ELSE 0 END) as quality_violations
            FROM inference_logs
        """, (settings.quality_threshold,)) as cursor:
            row = await cursor.fetchone()

        if not row or row["total_requests"] == 0:
            return {
                "total_requests": 0,
                "avg_latency_ms": 0.0,
                "avg_quality_score": 0.0,
                "escalation_rate": 0.0,
                "total_tokens": 0,
                "model_distribution": {"small": 0, "medium": 0, "large": 0},
                "requests": {
                    "total_requests": 0,
                    "small_requests": 0,
                    "medium_requests": 0,
                    "large_requests": 0,
                    "escalated_requests": 0,
                },
                "quality": {
                    "avg_quality": 0.0,
                    "median_quality": 0.0,
                    "quality_threshold_violations": 0,
                },
                "performance": {
                    "avg_latency_ms": 0.0,
                    "p50_latency_ms": 0.0,
                    "p95_latency_ms": 0.0,
                    "avg_output_tokens": 0.0,
                },
                "routing": {
                    "small_utilization_pct": 0.0,
                    "medium_utilization_pct": 0.0,
                    "large_utilization_pct": 0.0,
                    "escalation_pct": 0.0,
                }
            }

        total = row["total_requests"]
        esc = row["escalated_count"] or 0
        small_cnt = row["small_count"] or 0
        med_cnt = row["medium_count"] or 0
        lg_cnt = row["large_count"] or 0

        # Retrieve latencies and qualities for percentiles and median
        async with db.execute("SELECT latency_ms, quality_score FROM inference_logs WHERE latency_ms IS NOT NULL") as cursor:
            records = await cursor.fetchall()

        latencies = [float(r["latency_ms"]) for r in records if r["latency_ms"] is not None]
        qualities = [float(r["quality_score"]) for r in records if r["quality_score"] is not None]

        p50_lat = round(float(np.percentile(latencies, 50)), 1) if latencies else 0.0
        p95_lat = round(float(np.percentile(latencies, 95)), 1) if latencies else 0.0
        med_qual = round(float(np.median(qualities)), 3) if qualities else 0.0

        return {
            "total_requests": total,
            "avg_latency_ms": round(row["avg_latency_ms"] or 0.0, 1),
            "avg_quality_score": round(row["avg_quality_score"] or 0.0, 3),
            "escalation_rate": round((esc / total) * 100.0, 1),
            "total_tokens": row["total_tokens"] or 0,
            "model_distribution": {
                "small": small_cnt,
                "medium": med_cnt,
                "large": lg_cnt,
            },
            "requests": {
                "total_requests": total,
                "small_requests": small_cnt,
                "medium_requests": med_cnt,
                "large_requests": lg_cnt,
                "escalated_requests": esc,
            },
            "quality": {
                "avg_quality": round(row["avg_quality_score"] or 0.0, 3),
                "median_quality": med_qual,
                "quality_threshold_violations": row["quality_violations"] or 0,
            },
            "performance": {
                "avg_latency_ms": round(row["avg_latency_ms"] or 0.0, 1),
                "p50_latency_ms": p50_lat,
                "p95_latency_ms": p95_lat,
                "avg_output_tokens": round(row["avg_output_tokens"] or 0.0, 1),
            },
            "routing": {
                "small_utilization_pct": round((small_cnt / total) * 100.0, 1),
                "medium_utilization_pct": round((med_cnt / total) * 100.0, 1),
                "large_utilization_pct": round((lg_cnt / total) * 100.0, 1),
                "escalation_pct": round((esc / total) * 100.0, 1),
            }
        }

