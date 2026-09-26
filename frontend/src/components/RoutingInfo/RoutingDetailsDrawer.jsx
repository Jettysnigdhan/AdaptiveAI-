import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, CheckCircle, AlertTriangle, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export default function RoutingDetailsDrawer({ metadata }) {
  const [expanded, setExpanded] = useState(false);

  if (!metadata) return null;

  const {
    tier = 'small',
    selected_model,
    initial_model,
    final_model,
    latency_ms,
    quality_score,
    confidence,
    escalated,
    escalation_count,
    explanation,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    predicted_qualities = {},
    routing_path = [],
    category = 'general'
  } = metadata;

  const getTierClass = (t) => {
    if (t === 'small') return 'badge-tier-small';
    if (t === 'medium') return 'badge-tier-medium';
    return 'badge-tier-large';
  };

  return (
    <div className="glass-panel" style={{ marginTop: '16px', overflow: 'hidden' }}>
      {/* Primary Summary Strip */}
      <div style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: expanded ? '1px solid var(--border)' : 'none',
        background: 'rgba(255, 255, 255, 0.015)'
      }}>
        {/* Tier & Model Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '6px'
          }} className={getTierClass(tier)}>
            {tier} Tier
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>
            {final_model || selected_model}
          </span>
          {category && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {category}
            </span>
          )}
        </div>

        {/* Telemetry Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8' }}>
            <Zap size={14} />
            <span className="mono">{latency_ms} ms</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399' }}>
            <ShieldCheck size={14} />
            <span>Score: <span className="mono">{quality_score}</span></span>
          </div>

          {escalated ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#f43f5e',
              background: 'rgba(244, 63, 94, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              <AlertTriangle size={14} />
              <span>Escalated ({escalation_count})</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
              <CheckCircle size={14} color="#10b981" />
              <span>Direct Pass</span>
            </div>
          )}

          {/* Toggle Details Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-sub)',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 500
            }}
          >
            <span>{expanded ? 'Hide Details' : 'Explain Routing'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable Technical Analysis Panel */}
      {expanded && (
        <div style={{ padding: '18px', background: 'rgba(0, 0, 0, 0.25)', fontSize: '0.86rem' }}>
          {/* Explanation Box */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            borderLeft: '3px solid var(--accent-indigo)',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0',
            marginBottom: '16px',
            lineHeight: 1.5,
            color: '#cbd5e1'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: '#818cf8', marginBottom: '4px' }}>
              Routing Explanation
            </div>
            {explanation}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Cascading Path */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                Execution Path
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {routing_path && routing_path.length > 0 ? (
                  routing_path.map((m, idx) => (
                    <React.Fragment key={idx}>
                      <span className="mono" style={{
                        padding: '3px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: idx === routing_path.length - 1 ? '#38bdf8' : 'var(--text-sub)'
                      }}>
                        {m}
                      </span>
                      {idx < routing_path.length - 1 && <ArrowRight size={12} color="#64748b" />}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="mono" style={{ color: 'var(--text-sub)' }}>{final_model}</span>
                )}
              </div>
            </div>

            {/* Token & Throughput Metrics */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                Compute & Tokens
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                <div>Prompt: <span className="mono" style={{ color: '#fff' }}>{prompt_tokens}</span></div>
                <div>Completion: <span className="mono" style={{ color: '#fff' }}>{completion_tokens}</span></div>
                <div>Total: <span className="mono" style={{ color: '#818cf8', fontWeight: 600 }}>{total_tokens}</span></div>
              </div>
            </div>

            {/* Model Router Probabilities / Predicted Qualities */}
            {predicted_qualities && Object.keys(predicted_qualities).length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                  Predicted Tier Quality P(Q | Tier)
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {Object.entries(predicted_qualities).map(([t, prob]) => (
                    <div key={t} style={{ fontSize: '0.82rem' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{t}: </span>
                      <span className="mono" style={{ fontWeight: 600, color: prob >= 0.82 ? '#10b981' : '#f59e0b' }}>
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
