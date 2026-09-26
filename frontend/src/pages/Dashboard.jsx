import React, { useState, useEffect } from 'react';
import { BarChart2, Activity, Play, Shield, Clock, TrendingDown, Layers, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { fetchMetrics, fetchRecentInferences, runBenchmarkComparison } from '../services/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [inferences, setInferences] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [m, inf] = await Promise.all([fetchMetrics(), fetchRecentInferences(25)]);
      setMetrics(m);
      setInferences(inf);
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
      const results = await runBenchmarkComparison();
      setBenchmarkData(results);
      loadData();
    } catch (e) {
      console.error('Benchmark failed:', e);
      alert('Benchmark error: ' + e.message);
    } finally {
      setBenchmarking(false);
    }
  };

  const total = metrics?.total_requests || 0;
  const dist = metrics?.model_distribution || { small: 0, medium: 0, large: 0 };
  const smallPct = total > 0 ? ((dist.small / total) * 100).toFixed(0) : 0;
  const mediumPct = total > 0 ? ((dist.medium / total) * 100).toFixed(0) : 0;
  const largePct = total > 0 ? ((dist.large / total) * 100).toFixed(0) : 0;

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
          <Play size={16} />
          <span>{benchmarking ? 'Running Benchmark (12 prompts x 5 policies)...' : 'Run Full Benchmark Experiment'}</span>
        </button>
      </div>

      {/* Aggregate Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Requests</span>
            <Activity size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, marginTop: '10px', color: '#fff' }}>
            {metrics?.total_requests || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Logged in local SQLite database
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Average Latency</span>
            <Clock size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, marginTop: '10px', color: '#38bdf8' }}>
            {metrics?.avg_latency_ms || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>ms</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            End-to-end wall clock latency
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Average Quality</span>
            <Shield size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, marginTop: '10px', color: '#34d399' }}>
            {metrics?.avg_quality_score || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>/ 1.0</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Evaluated against 0.82 threshold
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Escalation Rate</span>
            <TrendingDown size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, marginTop: '10px', color: '#f59e0b' }}>
            {metrics?.escalation_rate || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hops to higher capacity tiers
          </div>
        </div>
      </div>

      {/* Tier Distribution Progress */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: '#f1f5f9' }}>
          Model Tier Distribution (Workload Offloading)
        </h3>
        {total === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No inferences recorded yet. Send prompts in the Chat Gateway.</div>
        ) : (
          <div>
            <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${smallPct}%`, background: 'var(--tier-small)' }} title={`Small: ${dist.small}`} />
              <div style={{ width: `${mediumPct}%`, background: 'var(--tier-medium)' }} title={`Medium: ${dist.medium}`} />
              <div style={{ width: `${largePct}%`, background: 'var(--tier-large)' }} title={`Large: ${dist.large}`} />
            </div>

            <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--tier-small)' }} />
                <span>Small Tier: <strong>{dist.small}</strong> ({smallPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--tier-medium)' }} />
                <span>Medium Tier: <strong>{dist.medium}</strong> ({mediumPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--tier-large)' }} />
                <span>Large Tier: <strong>{dist.large}</strong> ({largePct}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Comparison Section (Section 11 & 12) */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
            Empirical Baseline Comparison (Section 11)
          </h3>
          {benchmarkData?.latency_reduction_percent && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              ⚡ {benchmarkData.latency_reduction_percent}% Latency Reduction vs Always Large
            </span>
          )}
        </div>

        {benchmarkData ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Policy / System</th>
                  <th style={{ padding: '10px 14px' }}>Avg Latency</th>
                  <th style={{ padding: '10px 14px' }}>Total Tokens</th>
                  <th style={{ padding: '10px 14px' }}>Avg Quality</th>
                  <th style={{ padding: '10px 14px' }}>Escalation Rate</th>
                  <th style={{ padding: '10px 14px' }}>Tier Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(benchmarkData.comparison).map(([policy, data]) => {
                  const isAdaptive = policy === 'adaptive_route';
                  return (
                    <tr
                      key={policy}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isAdaptive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        fontWeight: isAdaptive ? 600 : 400
                      }}
                    >
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>
                        {isAdaptive ? '⭐ AdaptiveRoute (Proposed)' : policy.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '12px 14px' }} className="mono">
                        {data.avg_latency_ms} ms
                      </td>
                      <td style={{ padding: '12px 14px' }} className="mono">{data.total_tokens}</td>
                      <td style={{ padding: '12px 14px' }} className="mono">
                        <span style={{ color: data.avg_quality >= 0.82 ? '#34d399' : '#f59e0b' }}>
                          {data.avg_quality}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{data.escalation_rate}%</td>
                      <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                        S: {data.tier_distribution?.small || 0} | M: {data.tier_distribution?.medium || 0} | L: {data.tier_distribution?.large || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Click <strong>"Run Full Benchmark Experiment"</strong> above to empirically measure and compare all 5 baseline policies.
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
