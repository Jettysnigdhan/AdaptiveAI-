"""Project CLI runner for FastAPI, Streamlit, and Benchmarks."""

import sys
import argparse
import subprocess
import uvicorn
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))


def run_api(host: str = "0.0.0.0", port: int = 8000, reload: bool = True):
    """Starts the FastAPI inference gateway."""
    print(f"\n[API] Starting Semantic Cost-Aware LLM Router API on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)


def run_dashboard():
    """Starts the Streamlit analytics dashboard."""
    dashboard_path = Path(__file__).resolve().parent / "dashboard" / "app.py"
    print(f"\n[DASHBOARD] Starting Streamlit Dashboard from {dashboard_path}...")
    subprocess.run([sys.executable, "-m", "streamlit", "run", str(dashboard_path)])


def run_eval():
    """Runs threshold evaluation script and displays precision/recall metrics."""
    from app.evaluation.evaluator import evaluator
    print("\n[EVALUATION] Running Empirical Similarity Threshold Evaluation...")
    results = evaluator.evaluate_thresholds()

    headers = ["Threshold", "Precision", "Recall", "False-Hit Rate", "F1 Score"]
    row_fmt = "{:<12} {:<12} {:<12} {:<16} {:<10}"
    print("\n" + "=" * 66)
    print(row_fmt.format(*headers))
    print("=" * 66)

    best_th = None
    best_f1 = -1.0

    for r in results:
        print(row_fmt.format(
            f"{r['threshold']:.2f}",
            f"{r['precision']:.3f}",
            f"{r['recall']:.3f}",
            f"{r['false_hit_rate']:.3f}",
            f"{r['f1_score']:.3f}"
        ))
        if r['f1_score'] > best_f1:
            best_f1 = r['f1_score']
            best_th = r['threshold']

    print("=" * 66)
    print(f"\n[RESULT] Recommended Optimal Similarity Threshold: {best_th} (Max F1: {best_f1:.3f})\n")


def run_benchmark(sample_size: int = 25):
    """Executes baseline vs optimized benchmark comparison."""
    from app.evaluation.evaluator import evaluator
    print(f"\n[BENCHMARK] Running Empirical Benchmark (Sample Size: {sample_size})...")
    res = evaluator.run_benchmark(sample_size=sample_size)

    print("\n" + "=" * 60)
    print("        EMPIRICAL BENCHMARK: BASELINE vs OPTIMIZED")
    print("=" * 60)
    print(f"Total Requests Evaluated   : {res.total_requests}")
    print(f"Baseline Cost (Large Only) : ${res.baseline_cost:.6f}")
    print(f"Optimized Cost             : ${res.optimized_cost:.6f}")
    print(f"Cost Saved ($)             : ${res.cost_saved:.6f}")
    print(f"Cost Reduction %           : {res.cost_reduction_percent}%")
    print(f"Baseline p50 Latency       : {res.baseline_p50_latency_ms} ms")
    print(f"Optimized p50 Latency      : {res.optimized_p50_latency_ms} ms")
    print(f"Latency Improvement %      : {res.latency_improvement_percent}%")
    print(f"Baseline Avg Quality       : {res.baseline_avg_quality}")
    print(f"Optimized Avg Quality      : {res.optimized_avg_quality}")
    print(f"Cache Hit Rate %           : {res.cache_hit_rate_percent}%")
    print(f"Escalation Rate %          : {res.escalation_rate_percent}%")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Semantic Cost-Aware LLM Router CLI")
    parser.add_argument("mode", nargs="?", default="api", choices=["api", "dashboard", "eval", "benchmark"], help="Execution mode")
    parser.add_argument("--port", type=int, default=8000, help="Port for FastAPI server")
    parser.add_argument("--samples", type=int, default=25, help="Sample size for benchmark")

    args = parser.parse_args()

    if args.mode == "api":
        run_api(port=args.port)
    elif args.mode == "dashboard":
        run_dashboard()
    elif args.mode == "eval":
        run_eval()
    elif args.mode == "benchmark":
        run_benchmark(sample_size=args.samples)


if __name__ == "__main__":
    main()
