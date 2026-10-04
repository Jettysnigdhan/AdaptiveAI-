"""SQLite request and evaluation logger."""

import sqlite3
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

from app.config import get_settings


class SQLiteLogger:
    """Manages SQLite request and telemetry logging."""

    def __init__(self, db_path: Optional[str] = None):
        self.settings = get_settings()
        self.db_path = db_path or self.settings.database_path
        self._ensure_db_dir()
        self.init_db()

    def _ensure_db_dir(self):
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Creates the request_logs table if it does not already exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS request_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    query TEXT NOT NULL,
                    model TEXT NOT NULL,
                    route TEXT NOT NULL,
                    input_tokens INTEGER DEFAULT 0,
                    output_tokens INTEGER DEFAULT 0,
                    total_tokens INTEGER DEFAULT 0,
                    cost REAL DEFAULT 0.0,
                    latency_ms REAL DEFAULT 0.0,
                    cache_hit INTEGER DEFAULT 0,
                    escalated INTEGER DEFAULT 0,
                    escalation_reason TEXT,
                    quality_score REAL,
                    answer TEXT,
                    corpus_version TEXT
                )
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON request_logs(timestamp);
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_logs_route ON request_logs(route);
            """)
            conn.commit()

    def log_request(
        self,
        query: str,
        model: str,
        route: str,
        input_tokens: int,
        output_tokens: int,
        total_tokens: int,
        cost: float,
        latency_ms: float,
        cache_hit: bool,
        escalated: bool = False,
        escalation_reason: Optional[str] = None,
        quality_score: Optional[float] = None,
        answer: Optional[str] = None,
        corpus_version: Optional[str] = None,
    ) -> int:
        """Inserts a request log record and returns its ID."""
        ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO request_logs (
                    timestamp, query, model, route, input_tokens, output_tokens, total_tokens,
                    cost, latency_ms, cache_hit, escalated, escalation_reason,
                    quality_score, answer, corpus_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ts,
                query,
                model,
                route,
                input_tokens,
                output_tokens,
                total_tokens,
                float(cost),
                float(latency_ms),
                1 if cache_hit else 0,
                1 if escalated else 0,
                escalation_reason,
                quality_score,
                answer,
                corpus_version or self.settings.corpus_version,
            ))
            conn.commit()
            return cursor.lastrowid

    def get_requests(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Retrieves recent request logs."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM request_logs
                ORDER BY id DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculates aggregate metrics across all request logs."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM request_logs")
            total_requests = cursor.fetchone()[0]

            if total_requests == 0:
                return {
                    "total_requests": 0,
                    "cache_hits": 0,
                    "cache_hit_rate": 0.0,
                    "small_model_requests": 0,
                    "large_model_requests": 0,
                    "escalated_requests": 0,
                    "total_cost": 0.0,
                    "avg_cost_per_request": 0.0,
                    "avg_latency_ms": 0.0,
                    "p50_latency_ms": 0.0,
                    "p95_latency_ms": 0.0,
                    "avg_quality_score": 0.0,
                }

            cursor.execute("SELECT COUNT(*) FROM request_logs WHERE cache_hit = 1")
            cache_hits = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM request_logs WHERE route = 'simple' AND escalated = 0")
            small_model_reqs = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM request_logs WHERE route IN ('complex', 'large') OR escalated = 1")
            large_model_reqs = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM request_logs WHERE escalated = 1")
            escalated_reqs = cursor.fetchone()[0]

            cursor.execute("SELECT SUM(cost), AVG(cost), AVG(latency_ms) FROM request_logs")
            sum_cost, avg_cost, avg_lat = cursor.fetchone()

            cursor.execute("SELECT AVG(quality_score) FROM request_logs WHERE quality_score IS NOT NULL")
            avg_qual = cursor.fetchone()[0] or 0.0

            cursor.execute("SELECT latency_ms FROM request_logs WHERE latency_ms IS NOT NULL")
            latencies = [row[0] for row in cursor.fetchall()]

            p50 = float(np.percentile(latencies, 50)) if latencies else 0.0
            p95 = float(np.percentile(latencies, 95)) if latencies else 0.0

            return {
                "total_requests": total_requests,
                "cache_hits": cache_hits,
                "cache_hit_rate": round(cache_hits / total_requests, 4),
                "small_model_requests": small_model_reqs,
                "large_model_requests": large_model_reqs,
                "escalated_requests": escalated_reqs,
                "total_cost": round(float(sum_cost or 0.0), 6),
                "avg_cost_per_request": round(float(avg_cost or 0.0), 6),
                "avg_latency_ms": round(float(avg_lat or 0.0), 2),
                "p50_latency_ms": round(p50, 2),
                "p95_latency_ms": round(p95, 2),
                "avg_quality_score": round(float(avg_qual), 3),
            }

    def clear_logs(self):
        """Clears all request logs (useful for benchmark resets)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM request_logs")
            conn.commit()


# Singleton database instance
db_logger = SQLiteLogger()
