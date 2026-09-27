import React, { useState, useEffect } from 'react';
import { Activity, Play, Shield, Clock, Layers, RefreshCw } from 'lucide-react';
import { fetchMetrics, fetchRecentInferences, fetchBaselineComparison, runBenchmarkComparison } from '../services/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [inferences, setInferences] = useState([]);
  const [baselineReport, setBaselineReport] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [m, inf, base] = await Promise.all([
        fetchMetrics().catch(() => null),
        fetchRecentInferences(25).catch(() => []),
        fetchBaselineComparison().catch(() => null),
      ]);
      setMetrics(m);
      setInferences(inf || []);
      setBaselineReport(base);
    } catch (e) {
      console.error('Failed to load metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      await runBenchmarkComparison();
      await loadData();
    } catch (e) {
      console.error('Benchmark failed:', e);
      alert('Benchmark error: ' + e.message);
    } finally {
      setBenchmarking(false);
    }
  };

  const req = metrics?.requests || {
    total_requests: metrics?.total_requests || 0,
    small_requests: metrics?.model_distribution?.small || 0,
    medium_requests: metrics?.model_distribution?.medium || 0,
    large_requests: metrics?.model_distribution?.large || 0,
    escalated_requests: 0,
  };

  const qual = metrics?.quality || {
    avg_quality: metrics?.avg_quality_score || 0.0,
    median_quality: 0.0,
    quality_threshold_violations: 0,
  };

  const perf = metrics?.performance || {
    avg_latency_ms: metrics?.avg_latency_ms || 0.0,
    p50_latency_ms: 0.0,
    p95_latency_ms: 0.0,
    avg_output_tokens: 0.0,
  };

  const rout = metrics?.routing || {
    small_utilization_pct: 0.0,
    medium_utilization_pct: 0.0,
    large_utilization_pct: 0.0,
    escalation_pct: metrics?.escalation_rate || 0.0,
  };

  const hasBaselines = baselineReport?.status === 'available' && baselineReport?.policies && Object.keys(baselineReport.policies).length > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Experimental Telemetry & Benchmark Dashboard
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginTop: '4px' }}>
            Empirical measurements comparing ML-based adaptive routing against static baselines.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={benchmarking}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
        >
          {benchmarking ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
          <span>{benchmarking ? 'Running Benchmark...' : 'Run Benchmark Experiment'}</span>
        </button>
      </div>

      {/* SECTION 16: EXPERIMENT DASHBOARD METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        {/* Panel 1: Requests */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
            <span>Requests</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
            {req.total_requests} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Small Requests:</span>
              <span className="mono" style={{ color: '#34d399' }}>{req.small_requests}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Medium Requests:</span>
              <span className="mono" style={{ color: '#38bdf8' }}>{req.medium_requests}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Large Requests:</span>
              <span className="mono" style={{ color: '#a855f7' }}>{req.large_requests}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Escalated Requests:</span>
              <span className="mono" style={{ color: '#f43f5e' }}>{req.escalated_requests}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Quality */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
            <span>Quality</span>
            <Shield size={16} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', marginBottom: '12px' }}>
            {qual.avg_quality} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 1.0</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Average Quality:</span>
              <span className="mono">{qual.avg_quality}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Median Quality:</span>
              <span className="mono">{qual.median_quality}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Threshold Violations:</span>
              <span className="mono" style={{ color: qual.quality_threshold_violations > 0 ? '#f43f5e' : '#10b981' }}>
                {qual.quality_threshold_violations}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Performance */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
            <span>Performance</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
            {perf.avg_latency_ms} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>ms avg</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>P50 Latency:</span>
              <span className="mono">{perf.p50_latency_ms} ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>P95 Latency:</span>
              <span className="mono">{perf.p95_latency_ms} ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Avg Output Tokens:</span>
              <span className="mono">{perf.avg_output_tokens}</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Routing */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
            <span>Routing</span>
            <Layers size={16} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', marginBottom: '12px' }}>
            {rout.escalation_pct}% <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>escalation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Small Utilization:</span>
              <span className="mono">{rout.small_utilization_pct}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Medium Utilization:</span>
              <span className="mono">{rout.medium_utilization_pct}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Large Utilization:</span>
              <span className="mono">{rout.large_utilization_pct}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Escalation %:</span>
              <span className="mono">{rout.escalation_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 17: BASELINE COMPARISON DASHBOARD (AdaptiveRoute vs Baselines) */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              AdaptiveRoute vs Baselines
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
              Measured comparison across 5 policies. Experiments recorded locally without fabricated scores.
            </p>
          </div>
          {hasBaselines && baselineReport?.experiment_id && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }} className="mono">
              ID: {baselineReport.experiment_id}
            </span>
          )}
        </div>

        {hasBaselines ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Policy</th>
                  <th style={{ padding: '10px 14px' }}>Quality</th>
                  <th style={{ padding: '10px 14px' }}>Latency</th>
                  <th style={{ padding: '10px 14px' }}>Tokens</th>
                  <th style={{ padding: '10px 14px' }}>Model Utilization</th>
                  <th style={{ padding: '10px 14px' }}>Escalation Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(baselineReport.policies).map(([key, data]) => {
                  const isAdaptive = key === 'auto';
                  const dist = data.tier_distribution || {};
                  return (
                    <tr
                      key={key}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isAdaptive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        fontWeight: isAdaptive ? 600 : 400,
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        {isAdaptive ? '⭐ ' : ''}{data.name || key}
                      </td>
                      <td style={{ padding: '12px 14px' }} className="mono">
                        {data.avg_quality_score != null ? data.avg_quality_score : '-'}
                      </td>
                      <td style={{ padding: '12px 14px' }} className="mono">
                        {data.avg_latency_ms != null ? `${data.avg_latency_ms} ms` : '-'}
                      </td>
                      <td style={{ padding: '12px 14px' }} className="mono">
                        {data.avg_output_tokens != null ? data.avg_output_tokens : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                        S: {dist.small || 0} | M: {dist.medium || 0} | L: {dist.large || 0}
                      </td>
                      <td style={{ padding: '12px 14px' }} className="mono">
                        {data.escalation_rate != null ? `${data.escalation_rate}%` : '0%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            <p style={{ fontWeight: 500, color: '#e2e8f0' }}>Benchmark not available.</p>
            <p>Run benchmark to generate results.</p>
          </div>
        )}
      </div>

      {/* Inferences Table */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: '#f8fafc' }}>
          Recent Inferences Log (SQLite Audit Trail)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Request ID</th>
                <th style={{ padding: '8px 12px' }}>Prompt Preview</th>
                <th style={{ padding: '8px 12px' }}>Initial Model</th>
                <th style={{ padding: '8px 12px' }}>Final Model</th>
                <th style={{ padding: '8px 12px' }}>Latency</th>
                <th style={{ padding: '8px 12px' }}>Quality</th>
                <th style={{ padding: '8px 12px' }}>Escalated</th>
              </tr>
            </thead>
            <tbody>
              {inferences.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No inferences logged yet.
                  </td>
                </tr>
              ) : (
                inferences.map((inf) => (
                  <tr key={inf.request_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px' }} className="mono">{inf.request_id}</td>
                    <td style={{ padding: '10px 12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inf.prompt}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-sub)' }}>{inf.initial_model}</td>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 500 }}>{inf.final_model}</td>
                    <td style={{ padding: '10px 12px' }} className="mono">{inf.latency_ms} ms</td>
                    <td style={{ padding: '10px 12px' }} className="mono">{inf.quality_score}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {inf.escalated ? (
                        <span style={{ color: '#f43f5e', fontWeight: 600 }}>Yes ({inf.escalation_count})</span>
                      ) : (
                        <span style={{ color: '#10b981' }}>No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

