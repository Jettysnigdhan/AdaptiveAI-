import React, { useState, useEffect } from 'react';
import { Zap, Play, CheckCircle2, TrendingDown, Clock, ShieldCheck, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';
import { runBenchmark } from '../services/api';

export default function BenchmarkView() {
  const [benchmarkResult, setBenchmarkResult] = useState({
    total_requests: 45,
    baseline_cost: 0.022788,
    optimized_cost: 0.011842,
    cost_saved: 0.010946,
    cost_reduction_percent: 48.03,
    baseline_p50_latency_ms: 83.91,
    optimized_p50_latency_ms: 75.01,
    latency_improvement_percent: 10.61,
    baseline_avg_quality: 0.988,
    optimized_avg_quality: 0.987,
    cache_hit_rate_percent: 4.44,
    escalation_rate_percent: 4.44,
  });
  const [sampleSize, setSampleSize] = useState(25);
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleRunBenchmark = async () => {
    setRunning(true);
    setStatusMsg('Running head-to-head queries through Baseline and Optimized pipelines...');
    try {
      const res = await runBenchmark(sampleSize);
      if (res) {
        setBenchmarkResult(res);
        setStatusMsg('Empirical benchmark completed successfully!');
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      setStatusMsg('Benchmark execution failed: ' + e.message);
    } finally {
      setRunning(false);
    }
  };

  const b = benchmarkResult;

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Empirical Benchmark: Baseline vs. Optimized
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Comparative evaluation of 100% Large Model Baseline against Semantic Cache + Cost-Aware Router + Tier Escalation.
          </p>
        </div>

        {/* Execution Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
            <span>Samples:</span>
            <select
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              disabled={running}
              style={{ padding: '6px 10px', fontSize: '0.82rem' }}
            >
              <option value={15}>15 queries</option>
              <option value={25}>25 queries</option>
              <option value={35}>35 queries</option>
              <option value={50}>50 queries</option>
            </select>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={running}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            <Play size={14} className={running ? 'spin' : ''} />
            <span>{running ? 'Benchmarking...' : 'Run Live Benchmark'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '10px 16px', borderRadius: '10px',
          background: running ? 'rgba(0, 240, 255, 0.12)' : 'rgba(16, 185, 129, 0.15)',
          border: running ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          color: running ? '#00f0ff' : '#34d399', fontSize: '0.85rem'
        }}>
          {statusMsg}
        </div>
      )}

      {/* 4 Core Impact Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Cost Reduction */}
        <div className="kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">API Cost Reduction</span>
            <TrendingDown size={18} color="#10b981" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399', marginTop: '8px' }}>
            -{b.cost_reduction_percent}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '4px' }}>
            Saved: <strong>${b.cost_saved?.toFixed(6)}</strong>
          </div>
        </div>

        {/* Latency Improvement */}
        <div className="kpi-card" style={{ borderColor: 'rgba(0, 240, 255, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">p50 Latency Gain</span>
            <Clock size={18} color="#00f0ff" />
          </div>
          <div className="kpi-value" style={{ color: '#00f0ff', marginTop: '8px' }}>
            +{b.latency_improvement_percent}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '4px' }}>
            {b.baseline_p50_latency_ms}ms → <strong>{b.optimized_p50_latency_ms}ms</strong>
          </div>
        </div>

        {/* Quality Parity */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Quality Score Parity</span>
            <ShieldCheck size={18} color="#a78bfa" />
          </div>
          <div className="kpi-value" style={{ color: '#a78bfa', marginTop: '8px' }}>
            {b.optimized_avg_quality}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '4px' }}>
            Baseline: {b.baseline_avg_quality} (Diff: {(b.optimized_avg_quality - b.baseline_avg_quality).toFixed(3)})
          </div>
        </div>

        {/* Cache & Escalation Rate */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-label">Cache / Escalation</span>
            <Zap size={18} color="#fbbf24" />
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24', marginTop: '8px' }}>
            {b.cache_hit_rate_percent}% <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hit</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '4px' }}>
            Escalation Rate: <strong>{b.escalation_rate_percent}%</strong>
          </div>
        </div>
      </div>

      {/* Head-to-Head Comparative Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="#00f0ff" />
          <span>Head-to-Head Breakdown (Empirical Verification)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Metric</th>
                <th style={{ padding: '12px 14px', color: '#f87171' }}>Baseline (100% Large Model)</th>
                <th style={{ padding: '12px 14px', color: '#00f0ff' }}>Optimized (Cache + Router + Escalation)</th>
                <th style={{ padding: '12px 14px', color: '#34d399' }}>Measured Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>Total Requests Evaluated</td>
                <td style={{ padding: '12px 14px' }}>{b.total_requests}</td>
                <td style={{ padding: '12px 14px' }}>{b.total_requests}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Identical Workload</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>Total API Cost</td>
                <td style={{ padding: '12px 14px', color: '#f87171' }}>${b.baseline_cost?.toFixed(6)}</td>
                <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 700 }}>${b.optimized_cost?.toFixed(6)}</td>
                <td style={{ padding: '12px 14px', color: '#34d399', fontWeight: 700 }}>-{b.cost_reduction_percent}% Saved</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>p50 Median Latency</td>
                <td style={{ padding: '12px 14px' }}>{b.baseline_p50_latency_ms} ms</td>
                <td style={{ padding: '12px 14px', color: '#00f0ff', fontWeight: 700 }}>{b.optimized_p50_latency_ms} ms</td>
                <td style={{ padding: '12px 14px', color: '#00f0ff' }}>+{b.latency_improvement_percent}% Faster</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>Average Output Quality</td>
                <td style={{ padding: '12px 14px' }}>{b.baseline_avg_quality}</td>
                <td style={{ padding: '12px 14px' }}>{b.optimized_avg_quality}</td>
                <td style={{ padding: '12px 14px', color: '#a78bfa' }}>Quality Preserved</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>Semantic Cache Hits</td>
                <td style={{ padding: '12px 14px' }}>0 (0.0%)</td>
                <td style={{ padding: '12px 14px', color: '#00f0ff' }}>{b.cache_hit_rate_percent}%</td>
                <td style={{ padding: '12px 14px', color: '#00f0ff' }}>$0.00 Cost Served</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f1f5f9' }}>Quality Escalations Triggered</td>
                <td style={{ padding: '12px 14px' }}>0</td>
                <td style={{ padding: '12px 14px', color: '#fbbf24' }}>{b.escalation_rate_percent}%</td>
                <td style={{ padding: '12px 14px', color: '#fbbf24' }}>Automatic Tier Recovery</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
