import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, XCircle, Zap, Shield, Hash, RefreshCw, Search, Filter } from 'lucide-react';
import { fetchModels, toggleModel } from '../services/api';

export default function Models() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadModels = async () => {
    try {
      const data = await fetchModels(false);
      setModels(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleToggle = async (modelName, currentState) => {
    try {
      await toggleModel(modelName, !currentState);
      setModels(prev =>
        prev.map(m => m.model_name === modelName ? { ...m, enabled: !currentState } : m)
      );
    } catch (e) {
      alert('Failed to toggle model: ' + e.message);
    }
  };

  const getTierClass = (tier) => {
    if (tier === 'small') return 'badge-tier-small';
    if (tier === 'medium') return 'badge-tier-medium';
    return 'badge-tier-large';
  };

  const providers = ['ALL', 'grok', 'groq', 'openai', 'anthropic', 'local'];

  const filteredModels = models.filter(m => {
    if (providerFilter !== 'ALL' && (m.provider || '').toLowerCase() !== providerFilter.toLowerCase()) {
      return false;
    }
    if (tierFilter !== 'ALL' && (m.tier || '').toLowerCase() !== tierFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (m.model_name || '').toLowerCase().includes(q);
      const matchDesc = (m.description || '').toLowerCase().includes(q);
      const matchCap = (m.capabilities || []).some(c => c.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCap) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Model Registry & Tier Configuration
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginTop: '4px' }}>
            Model catalog with dynamic latency metrics, capability profiles, and active routing toggles.
          </p>
        </div>

        <button
          onClick={loadModels}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            color: 'var(--text-sub)',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-sub)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <RefreshCw size={14} />
          <span>Refresh Catalog</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Provider Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {providers.map(p => (
            <button
              key={p}
              onClick={() => setProviderFilter(p)}
              style={{
                background: providerFilter === p ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${providerFilter === p ? 'rgba(99, 102, 241, 0.4)' : 'var(--border)'}`,
                color: providerFilter === p ? '#fff' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono',monospace",
                transition: 'all 0.15s',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Tier Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px' }}
          >
            <option value="ALL">All Tiers</option>
            <option value="small">Small Tier</option>
            <option value="medium">Medium Tier</option>
            <option value="large">Large Tier</option>
          </select>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search model or capability..."
              style={{
                padding: '6px 12px 6px 30px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                width: '180px',
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading registered models...
        </div>
      ) : filteredModels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          No models match the selected filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredModels.map((model) => (
            <div key={model.model_name} className="glass-panel" style={{ padding: '22px', position: 'relative' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }} className={getTierClass(model.tier)}>
                    {model.tier} Tier
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                    {model.model_name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 500, textTransform: 'uppercase', marginTop: '2px' }}>
                    Provider: {model.provider}
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  onClick={() => handleToggle(model.model_name, model.enabled)}
                  style={{
                    background: model.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${model.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: model.enabled ? '#34d399' : '#f87171',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {model.enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>{model.enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.84rem', color: 'var(--text-sub)', marginBottom: '16px', minHeight: '40px', lineHeight: 1.5 }}>
                {model.description || 'No description provided.'}
              </p>

              {/* Capabilities */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {(model.capabilities || []).map((cap) => (
                  <span
                    key={cap}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Stats Footer */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Latency</div>
                  <div className="mono" style={{ color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                    {model.measured_latency_ms ? `${model.measured_latency_ms} ms` : `~${model.expected_latency_ms} ms`}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Requests</div>
                  <div className="mono" style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>
                    {model.request_count || 0}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Tokens</div>
                  <div className="mono" style={{ color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>
                    {model.token_usage_total || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
