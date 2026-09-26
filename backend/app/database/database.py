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
    """Insert structured inference log into SQLite."""
    global _db_initialized
    if not _db_initialized:
        await init_db()

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
            log_data.get("prompt"),
            log_data.get("response"),
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
    """Calculate aggregated telemetry metrics across all logged inferences."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT 
                COUNT(*) as total_requests,
                AVG(latency_ms) as avg_latency_ms,
                AVG(quality_score) as avg_quality_score,
                SUM(CASE WHEN escalated = 1 THEN 1 ELSE 0 END) as escalated_count,
                SUM(total_tokens) as total_tokens,
                SUM(CASE WHEN final_tier = 'small' THEN 1 ELSE 0 END) as small_count,
                SUM(CASE WHEN final_tier = 'medium' THEN 1 ELSE 0 END) as medium_count,
                SUM(CASE WHEN final_tier = 'large' THEN 1 ELSE 0 END) as large_count
            FROM inference_logs
        """) as cursor:
            row = await cursor.fetchone()
            if not row or row["total_requests"] == 0:
                return {
                    "total_requests": 0,
                    "avg_latency_ms": 0.0,
                    "avg_quality_score": 0.0,
                    "escalation_rate": 0.0,
                    "total_tokens": 0,
                    "model_distribution": {"small": 0, "medium": 0, "large": 0},
                }

            total = row["total_requests"]
            esc = row["escalated_count"] or 0
            return {
                "total_requests": total,
                "avg_latency_ms": round(row["avg_latency_ms"] or 0.0, 1),
                "avg_quality_score": round(row["avg_quality_score"] or 0.0, 3),
                "escalation_rate": round((esc / total) * 100.0, 1),
                "total_tokens": row["total_tokens"] or 0,
                "model_distribution": {
                    "small": row["small_count"] or 0,
                    "medium": row["medium_count"] or 0,
                    "large": row["large_count"] or 0,
                },
            }
