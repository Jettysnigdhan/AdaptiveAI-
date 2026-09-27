import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, Zap, ArrowDown, Info } from 'lucide-react';

export default function RoutingDetailsDrawer({ metadata }) {
  const [expanded, setExpanded] = useState(false);

  if (!metadata) return null;

  const {
    tier = 'small',
    selected_model,
    final_model,
    latency_ms = 0,
    quality_score = 0,
    confidence = 0,
    escalated = false,
    escalation_count = 0,
    explanation,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    predicted_qualities = {},
    routing_path = [],
    category = 'general'
  } = metadata;

  // Format percentages
  const confPct = Math.round((confidence || 0) * 100);
  const qualPct = Math.round((quality_score || 0) * 100);
  const latMs = Math.round(latency_ms || 0);

  return (
    <div className="glass-panel" style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      {/* Section 20: Compact Routing Panel */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              AdaptiveRoute
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {final_model || selected_model}
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
            }}
          >
            <span>{expanded ? 'Less' : 'Details'}</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Compact Metrics Strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '0.8rem',
          color: '#e2e8f0',
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Model: </span>
            <strong style={{
              color: tier === 'small' ? '#34d399' : tier === 'medium' ? '#38bdf8' : '#a855f7',
              textTransform: 'uppercase'
            }}>
              {tier}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Confidence: </span>
            <strong>{confPct}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Quality: </span>
            <strong>{qualPct}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Latency: </span>
            <strong className="mono">{latMs}ms</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Escalated: </span>
            <strong style={{ color: escalated ? '#f43f5e' : '#10b981' }}>
              {escalated ? `Yes (${escalation_count})` : 'No'}
            </strong>
          </div>
        </div>

        {/* Escalation Path Visualization (Section 20) */}
        {escalated && (
          <div style={{
            marginTop: '6px',
            padding: '10px 12px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '6px',
            border: '1px solid rgba(244, 63, 94, 0.2)',
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#fb7185',
              marginBottom: '6px',
            }}>
              Routing Path
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem' }}>
              <div style={{ color: '#94a3b8' }}>SMALL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '0.74rem' }}>
                <ArrowDown size={11} /> <span>failed quality threshold</span>
              </div>
              <div style={{ color: '#94a3b8' }}>MEDIUM</div>
              {escalation_count > 1 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '0.74rem' }}>
                    <ArrowDown size={11} /> <span>failed quality threshold</span>
                  </div>
                  <div style={{ color: '#c084fc', fontWeight: 600 }}>LARGE</div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.74rem' }}>
                <ArrowDown size={11} /> <span>Returned</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details Drawer */}
      {expanded && (
        <div style={{
          padding: '14px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.82rem',
        }}>
          {explanation && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              borderLeft: '3px solid #818cf8',
              padding: '8px 12px',
              borderRadius: '0 6px 6px 0',
              marginBottom: '12px',
              color: '#cbd5e1',
              lineHeight: 1.4,
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', marginBottom: '2px' }}>
                Reason
              </div>
              {explanation}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Tokens</div>
              <div style={{ marginTop: '3px', color: '#fff' }}>
                P: {prompt_tokens || 0} | C: {completion_tokens || 0} | Total: <strong style={{ color: '#818cf8' }}>{total_tokens || 0}</strong>
              </div>
            </div>

            {predicted_qualities && Object.keys(predicted_qualities).length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Predicted Quality</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                  {Object.entries(predicted_qualities).map(([tierKey, score]) => (
                    <span key={tierKey} style={{ textTransform: 'capitalize', color: score >= 0.82 ? '#34d399' : '#f59e0b' }}>
                      {tierKey}: {Math.round(score * 100)}%
                    </span>
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

