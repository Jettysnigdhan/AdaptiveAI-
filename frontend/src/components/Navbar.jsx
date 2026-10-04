import React from 'react';
import { Cpu, TrendingUp, Zap, Database, ArrowLeft } from 'lucide-react';
import SleekZap from './SleekZap';

export default function Navbar({ activeTab, setActiveTab, health, onReturnToLanding }) {
  const providerLabel = health?.llm_provider ? health.llm_provider.toUpperCase() : 'GROQ / OLLAMA';
  const qdrantBackend = health?.qdrant_backend || 'QDRANT VECTOR DB';
  const corpusVersion = health?.corpus_version || 'v1';
  const qdrantEntries = health?.qdrant_entries ?? 0;

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(9, 10, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Brand */}
        <div
          onClick={onReturnToLanding}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          title="Return to Landing Page"
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <SleekZap size={22} variant="cyan" glow={true} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                SemanticRouter
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(0, 240, 255, 0.12)',
                color: '#00f0ff',
                border: '1px solid rgba(0, 240, 255, 0.3)'
              }}>
                Cost-Aware AI
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Qdrant Semantic Cache • Deterministic Routing • Tier Escalation
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onReturnToLanding}
            className="nav-link"
            style={{ color: '#94a3b8', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={15} />
            <span>Landing</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <Cpu size={16} />
            <span>Chat Gateway</span>
          </button>
          <button
            onClick={() => setActiveTab('tuning')}
            className={`nav-link ${activeTab === 'tuning' ? 'active' : ''}`}
          >
            <TrendingUp size={16} />
            <span>Threshold Tuning</span>
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`nav-link ${activeTab === 'benchmark' ? 'active' : ''}`}
          >
            <Zap size={16} />
            <span>Empirical Benchmark</span>
          </button>
        </nav>

        {/* Operational Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Vector Cache Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '5px 12px',
            borderRadius: '20px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            color: '#00f0ff'
          }}>
            <Database size={13} />
            <span>Vector Cache: {qdrantEntries} points ({corpusVersion})</span>
          </div>

          {/* Provider status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '5px 12px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}></span>
            <span>{providerLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
