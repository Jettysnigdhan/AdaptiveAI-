"""Streamlit Analytics & Telemetry Dashboard for Semantic Cost-Aware LLM Router."""

import time
import requests
import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="Semantic Router Analytics",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

API_BASE_URL = "http://localhost:8000"

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #1e1e24;
        border: 1px solid #33333f;
        padding: 18px;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 12px;
    }
    .metric-val {
        font-size: 26px;
        font-weight: 700;
        color: #00F0FF;
    }
    .metric-sub {
        font-size: 13px;
        color: #a1a1aa;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .badge-hit {
        background-color: rgba(74, 222, 128, 0.2);
        color: #4ade80;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
    }
    .badge-miss {
        background-color: rgba(248, 113, 113, 0.2);
        color: #f87171;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)


def fetch_stats():
    try:
        r = requests.get(f"{API_BASE_URL}/stats", timeout=2.5)
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def fetch_cache_stats():
    try:
        r = requests.get(f"{API_BASE_URL}/cache/stats", timeout=2.5)
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def fetch_requests(limit=50):
    try:
        r = requests.get(f"{API_BASE_URL}/requests?limit={limit}", timeout=2.5)
        return r.json() if r.status_code == 200 else []
    except Exception:
        return []


def run_benchmark_api(sample_size=25):
    try:
        r = requests.post(f"{API_BASE_URL}/benchmark/run?sample_size={sample_size}", timeout=60.0)
        return r.json() if r.status_code == 200 else None
    except Exception as e:
        st.error(f"Benchmark run failed: {e}")
        return None


def fetch_evaluation():
    try:
        r = requests.get(f"{API_BASE_URL}/evaluation", timeout=30.0)
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


# Sidebar Navigation & Controls
st.sidebar.title("⚡ Semantic Router")
st.sidebar.caption("Production Cost-Aware Inference Layer")

api_health = None
try:
    h = requests.get(f"{API_BASE_URL}/health", timeout=1.5)
    if h.status_code == 200:
        api_health = h.json()
except Exception:
    pass

if api_health:
    st.sidebar.success(f"Gateway: Online ({api_health.get('llm_provider', '').upper()})")
    st.sidebar.caption(f"Qdrant Backend: `{api_health.get('qdrant_backend')}`")
    st.sidebar.caption(f"Corpus Version: `{api_health.get('corpus_version')}`")
else:
    st.sidebar.error("Gateway Offline (http://localhost:8000)")
    st.sidebar.info("Run `python run.py` in your terminal to start.")

st.sidebar.markdown("---")
view_mode = st.sidebar.radio(
    "Navigation",
    ["📊 Telemetry & Overview", "🔍 Query Playground", "📈 Threshold Tuning", "⚡ Benchmark Comparison"]
)

# -------------------------------------------------------------
# VIEW 1: TELEMETRY & OVERVIEW
# -------------------------------------------------------------
if view_mode == "📊 Telemetry & Overview":
    st.title("Inference Telemetry & Cost Dashboard")

    stats = fetch_stats() or {
        "total_requests": 0, "cache_hits": 0, "cache_hit_rate": 0.0,
        "small_model_requests": 0, "large_model_requests": 0, "escalated_requests": 0,
        "total_cost": 0.0, "avg_cost_per_request": 0.0,
        "avg_latency_ms": 0.0, "p50_latency_ms": 0.0, "p95_latency_ms": 0.0,
        "avg_quality_score": 0.0,
    }
    c_stats = fetch_cache_stats() or {"total_entries": 0}

    # Top Overview Metric Cards
    c1, c2, c3, c4, c5, c6, c7 = st.columns(7)
    with c1:
        st.markdown(f"<div class='metric-card'><div class='metric-val'>{stats['total_requests']}</div><div class='metric-sub'>Total Requests</div></div>", unsafe_allow_html=True)
    with c2:
        hit_pct = round(stats['cache_hit_rate'] * 100, 1)
        st.markdown(f"<div class='metric-card'><div class='metric-val'>{hit_pct}%</div><div class='metric-sub'>Cache Hit Rate</div></div>", unsafe_allow_html=True)
    with c3:
        st.markdown(f"<div class='metric-card'><div class='metric-val'>${stats['avg_cost_per_request']:.6f}</div><div class='metric-sub'>Avg Cost</div></div>", unsafe_allow_html=True)
    with c4:
        st.markdown(f"<div class='metric-card'><div class='metric-val'>${stats['total_cost']:.4f}</div><div class='metric-sub'>Total Cost</div></div>", unsafe_allow_html=True)
    with c5:
        st.markdown(f"<div class='metric-card'><div class='metric-val'>{stats['p50_latency_ms']}ms</div><div class='metric-sub'>p50 Latency</div></div>", unsafe_allow_html=True)
    with c6:
        st.markdown(f"<div class='metric-card'><div class='metric-val'>{stats['p95_latency_ms']}ms</div><div class='metric-sub'>p95 Latency</div></div>", unsafe_allow_html=True)
    with c7:
        st.markdown(f"<div class='metric-card'><div class='metric-val'>{stats['avg_quality_score']}</div><div class='metric-sub'>Avg Quality</div></div>", unsafe_allow_html=True)

    st.markdown("---")

    # Routing Distribution & Latency Charts
    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("Model & Route Distribution")
        route_data = {
            "Route": ["Semantic Cache", "Small Model", "Large Model", "Escalated"],
            "Count": [
                stats["cache_hits"],
                stats["small_model_requests"],
                stats["large_model_requests"],
                stats["escalated_requests"],
            ]
        }
        df_route = pd.DataFrame(route_data)
        st.bar_chart(df_route.set_index("Route"))

    with col_right:
        st.subheader("Latency Metrics (ms)")
        latency_data = {
            "Metric": ["Average Latency", "p50 Median", "p95 Tail"],
            "Latency (ms)": [stats["avg_latency_ms"], stats["p50_latency_ms"], stats["p95_latency_ms"]]
        }
        df_lat = pd.DataFrame(latency_data)
        st.bar_chart(df_lat.set_index("Metric"))

    st.markdown("---")

    # Recent Request Logs Table
    st.subheader("Recent Request Logs")
    logs = fetch_requests(limit=30)
    if logs:
        df_logs = pd.DataFrame(logs)
        display_cols = ["timestamp", "query", "route", "model", "cache_hit", "latency_ms", "cost", "escalated", "quality_score"]
        existing_cols = [c for c in display_cols if c in df_logs.columns]
        st.dataframe(df_logs[existing_cols], use_container_width=True)
    else:
        st.info("No inference logs recorded yet. Send queries using the Query Playground or API.")

# -------------------------------------------------------------
# VIEW 2: QUERY PLAYGROUND
# -------------------------------------------------------------
elif view_mode == "🔍 Query Playground":
    st.title("Interactive Semantic Router Playground")
    st.caption("Test semantic caching, deterministic routing, and quality escalation live.")

    sample_prompt = st.selectbox(
        "Choose an Example Prompt or type your own:",
        [
            "What is TCP congestion control?",
            "Can you explain how TCP congestion control works?",
            "What is 2 + 2?",
            "Explain quicksort in Python with an example",
            "Design an event-driven architecture for a distributed streaming pipeline",
            "How do I reset my password?",
            "What are the steps for resetting my password?",
        ]
    )

    query_input = st.text_area("Prompt:", value=sample_prompt, height=100)
    force_override = st.selectbox("Route Override (Optional):", ["Auto (Semantic Router)", "Force Small Model", "Force Large Model"])

    col_btn1, col_btn2 = st.columns([1, 4])
    with col_btn1:
        submit = st.button("🚀 Send Query", type="primary")

    if submit and query_input.strip():
        payload = {"query": query_input.strip()}
        if force_override == "Force Small Model":
            payload["force_route"] = "small"
        elif force_override == "Force Large Model":
            payload["force_route"] = "large"

        with st.spinner("Routing and generating..."):
            t0 = time.perf_counter()
            res = requests.post(f"{API_BASE_URL}/answer", json=payload)
            elapsed = round((time.perf_counter() - t0) * 1000.0, 2)

            if res.status_code == 200:
                data = res.json()
                st.success(f"Completed in {data['latency_ms']}ms")

                # Telemetry Banner
                m1, m2, m3, m4, m5 = st.columns(5)
                with m1:
                    st.metric("Route Taken", data["route"].upper())
                with m2:
                    st.metric("Cache Hit", "YES ⚡" if data["cache_hit"] else "NO")
                with m3:
                    st.metric("Model Used", data["model"].split("/")[-1])
                with m4:
                    st.metric("Cost", f"${data['cost']:.6f}")
                with m5:
                    st.metric("Quality Score", data.get("quality_score") or "N/A")

                if data.get("escalated"):
                    st.warning(f"⚠️ Quality Escalation Triggered: {data.get('escalation_reason')}")

                st.markdown("### Answer:")
                st.markdown(data["answer"])
            else:
                st.error(f"Inference Error: {res.text}")

# -------------------------------------------------------------
# VIEW 3: THRESHOLD TUNING (PHASE 7)
# -------------------------------------------------------------
elif view_mode == "📈 Threshold Tuning":
    st.title("Semantic Similarity Threshold Evaluation")
    st.caption("Empirical Precision, Recall, and False-Hit Rate across thresholds [0.85 - 0.97].")

    if st.button("🔄 Compute Threshold Curve on Evaluation Dataset"):
        with st.spinner("Computing cosine similarities on paraphrase & near-miss datasets..."):
            eval_data = fetch_evaluation()
            if eval_data and "threshold_metrics" in eval_data:
                metrics = eval_data["threshold_metrics"]
                df_metrics = pd.DataFrame(metrics)

                st.subheader(f"Evaluation Metrics Table (Dataset Size: {eval_data.get('evaluation_dataset_size', 0)} Pairs)")
                st.dataframe(df_metrics, use_container_width=True)

                st.subheader("Precision vs Recall vs False-Hit Rate")
                chart_df = df_metrics[["threshold", "precision", "recall", "false_hit_rate"]].set_index("threshold")
                st.line_chart(chart_df)

                # Optimal F1 threshold identification
                best_f1_row = df_metrics.loc[df_metrics["f1_score"].idxmax()]
                st.success(
                    f"🎯 Recommended Optimal Threshold: `{best_f1_row['threshold']}` "
                    f"(Precision: {best_f1_row['precision']:.3f}, Recall: {best_f1_row['recall']:.3f}, F1: {best_f1_row['f1_score']:.3f})"
                )
            else:
                st.error("Failed to load evaluation data.")
    else:
        st.info("Click the button above to run real-time threshold scoring across 100 test pairs.")

# -------------------------------------------------------------
# VIEW 4: BENCHMARK COMPARISON (PHASE 8)
# -------------------------------------------------------------
elif view_mode == "⚡ Benchmark Comparison":
    st.title("Empirical Benchmark: Baseline vs Optimized")
    st.caption("Compares 100% Large Model Baseline against Semantic Cache + Cost-Aware Router + Escalation.")

    sample_size = st.slider("Benchmark Sample Size:", min_value=10, max_value=50, value=25, step=5)

    if st.button("🚀 Run Empirical Benchmark", type="primary"):
        with st.spinner("Executing comparative benchmark runs across evaluation queries..."):
            res = run_benchmark_api(sample_size=sample_size)
            if res:
                st.subheader("Benchmark Comparison Results")

                b1, b2, b3, b4 = st.columns(4)
                with b1:
                    st.metric("Cost Reduction %", f"-{res['cost_reduction_percent']}%", delta=f"${res['cost_saved']:.4f} saved", delta_color="normal")
                with b2:
                    st.metric("Latency Improvement", f"+{res['latency_improvement_percent']}%", delta="Faster p50")
                with b3:
                    st.metric("Cache Hit Rate", f"{res['cache_hit_rate_percent']}%")
                with b4:
                    st.metric("Quality Difference", f"{res['optimized_avg_quality'] - res['baseline_avg_quality']:+.3f}")

                # Detailed Metrics Table
                st.markdown("### Comparative Breakdown")
                comp_data = {
                    "Metric": [
                        "Total Requests Tested",
                        "Total Cost ($)",
                        "p50 Latency (ms)",
                        "Average Quality Score",
                        "Cache Hit Rate (%)",
                        "Escalation Rate (%)",
                    ],
                    "Baseline (Large Model Only)": [
                        res["total_requests"],
                        f"${res['baseline_cost']:.6f}",
                        f"{res['baseline_p50_latency_ms']} ms",
                        res["baseline_avg_quality"],
                        "0.0%",
                        "0.0%",
                    ],
                    "Optimized (Cache + Router + Escalation)": [
                        res["total_requests"],
                        f"${res['optimized_cost']:.6f}",
                        f"{res['optimized_p50_latency_ms']} ms",
                        res["optimized_avg_quality"],
                        f"{res['cache_hit_rate_percent']}%",
                        f"{res['escalation_rate_percent']}%",
                    ]
                }
                st.table(pd.DataFrame(comp_data).set_index("Metric"))
