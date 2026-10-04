import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Zap, Code, Cpu, ArrowRight, X, Monitor, Layers, Globe } from 'lucide-react';
import SleekZap from './SleekZap';

export default function LocalSetupModal({ isOpen, onClose, onEnterApp }) {
  const [activeTab, setActiveTab] = useState('web'); // 'web' | 'extension' | 'openai'
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyBtn = (text, idx) => (
    <button
      onClick={() => handleCopy(text, idx)}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '8px',
        color: copiedIndex === idx ? '#00f0ff' : '#cbd5e1',
        padding: '5px 12px',
        fontSize: '11px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'inherit',
        transition: 'all 0.18s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#fff';
        e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)';
        e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = copiedIndex === idx ? '#00f0ff' : '#cbd5e1';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {copiedIndex === idx ? <Check size={12} color="#00f0ff" /> : <Copy size={12} />}
      <span>{copiedIndex === idx ? 'Copied!' : 'Copy'}</span>
    </button>
  );

  const stepBadge = (num) => (
    <span style={{
      background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.06) 100%)',
      border: '1px solid rgba(0, 240, 255, 0.4)',
      boxShadow: '0 0 14px rgba(0, 240, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
      color: '#00F0FF',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      flexShrink: 0,
    }}>
      {num}
    </span>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 4, 8, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Glassmorphic Modal Dialog Window */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(16, 20, 32, 0.8) 0%, rgba(8, 10, 18, 0.92) 100%)',
          backdropFilter: 'blur(36px) saturate(190%)',
          WebkitBackdropFilter: 'blur(36px) saturate(190%)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 100px -10px rgba(0, 0, 0, 0.85), inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), inset 0 0 50px 0 rgba(0, 240, 255, 0.03), 0 0 60px -10px rgba(0, 240, 255, 0.16)',
          overflow: 'hidden',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: '#ededed',
          position: 'relative',
        }}
      >
        {/* Harmonized Subtle Ambient Glass Lights inside modal (Single Theme Color) */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
          zIndex: 0,
        }} />

        {/* Glass Header */}
        <div style={{
          padding: '24px 28px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: '#00F0FF',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 10px #00F0FF',
              }} />
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#00f0ff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                COMPLETE USAGE & SETUP GUIDE
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              How to Use Semantic Cost-Aware Router
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
              Choose from 3 seamless ways to run, test, and integrate this inference layer into your workflow.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '10px',
              color: '#a1a1aa',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Glass Tabs Container (Uniform Accent Color) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 12, 20, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
        }}>
          {[
            { id: 'web', label: '1. Web Playground (Browser)', icon: Globe },
            { id: 'extension', label: '2. IDE Extension (.vsix) & Dashboard', icon: Code },
            { id: 'openai', label: '3. REST & OpenAI API Gateway', icon: Cpu },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.18) 0%, rgba(0, 240, 255, 0.06) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${active ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  color: active ? '#00f0ff' : '#94a3b8',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: active
                    ? '0 0 20px rgba(0, 240, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                    : 'none',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                <Icon size={14} color={active ? '#00f0ff' : '#94a3b8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
          zIndex: 1,
        }}>

          {/* ── TAB 1: WEB PLAYGROUND ── */}
          {activeTab === 'web' && (
            <>
              {/* Glass Top Banner (Uniform Cyan Accent) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(0, 240, 255, 0.03) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 8px 30px rgba(0, 240, 255, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#00f0ff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡ Quickest Method — Zero Installation Required</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Both the backend (port 8000) and frontend (port 5173) are running right now. You can interact with the vector cache immediately in your browser.
                </div>
              </div>

              {/* Step 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {stepBadge(1)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Open the Interactive Chat Gateway</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', paddingLeft: '34px' }}>
                  Click the <strong>"Launch Web Gateway"</strong> button below or switch to the <strong>Chat Gateway</strong> tab in the navigation bar.
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {stepBadge(2)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Test Semantic Vector Caching Live</span>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(14, 18, 30, 0.6) 0%, rgba(8, 10, 18, 0.75) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginLeft: '34px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>FIRST QUERY (Cache Miss):</span>
                    <div style={{ color: '#00f0ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', marginTop: '2px' }}>
                      "What is TCP congestion control?"
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Routes to model, generates response, and stores dense 384d vector in Qdrant.
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 600 }}>PARAPHRASED QUERY (⚡ Cache Hit):</span>
                    <div style={{ color: '#00f0ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', marginTop: '2px' }}>
                      "Can you explain how TCP congestion control works?"
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', fontWeight: 600 }}>
                      ⚡ Instant CACHE HIT • $0.00 Cost • Latency &lt; 15ms!
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {stepBadge(3)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Inspect Live Tuning &amp; Benchmarks</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', paddingLeft: '34px', lineHeight: 1.5 }}>
                  - <strong>Threshold Tuning</strong>: View real cosine similarities across 100 test pairs (0.85 to 0.97).<br />
                  - <strong>Empirical Benchmark</strong>: Run head-to-head queries showing the <strong>-48.0% cost reduction</strong>.<br />
                  - <strong>IDE Extension</strong>: Install the VSIX extension to inspect the live Telemetry Dashboard inside your editor!
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => { onClose(); onEnterApp('chat'); }}
                  style={{
                    padding: '11px 24px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.08) 100%)',
                    border: '1px solid rgba(0, 240, 255, 0.45)',
                    boxShadow: '0 8px 24px rgba(0, 240, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    color: '#00f0ff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 240, 255, 0.35) 0%, rgba(0, 240, 255, 0.16) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 240, 255, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.08) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.45)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 240, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)';
                  }}
                >
                  <span>Launch Web Gateway Now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* ── TAB 2: IDE EXTENSION (.VSIX) WITH BUILT-IN DASHBOARD ── */}
          {activeTab === 'extension' && (
            <>
              {/* Glass Top Banner (Uniform Cyan Accent) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(0, 240, 255, 0.03) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 8px 30px rgba(0, 240, 255, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#00f0ff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💻 Native IDE Assistant &amp; Built-In Telemetry Dashboard</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  The full Telemetry Dashboard is included directly inside the downloadable VS Code &amp; Antigravity extension! Once installed, switch to the <strong>"📊 Telemetry Dashboard"</strong> tab in your sidebar.
                </div>
              </div>

              {/* Step 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {stepBadge(1)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Install the .vsix Extension</span>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(14, 18, 30, 0.6) 0%, rgba(8, 10, 18, 0.75) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginLeft: '34px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
                  <code style={{ color: '#00f0ff', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                    code --install-extension "extension/adaptiveroute-ai-1.0.0.vsix"
                  </code>
                  {copyBtn('code --install-extension "extension/adaptiveroute-ai-1.0.0.vsix"', 41)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '34px', marginTop: '6px' }}>
                  Or in VS Code / Antigravity: Press <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0' }}>Ctrl + Shift + P</kbd>, type <code>Extensions: Install from VSIX...</code> and pick the file.
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {stepBadge(2)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Open the AdaptiveRoute Sidebar View</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', paddingLeft: '34px', lineHeight: 1.5 }}>
                  Click the <strong>circuit bolt</strong> icon in your editor's left Activity Bar. The extension immediately auto-connects to your local gateway at <code>http://localhost:8000</code>.
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {stepBadge(3)}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Switch to the Telemetry Dashboard Tab</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', paddingLeft: '34px', lineHeight: 1.5, marginBottom: '10px' }}>
                  Click <strong>"📊 Telemetry Dashboard"</strong> at the top of the sidebar. It displays all 5 key metrics:
                </div>

                {/* Glass Table for Metrics (Uniform Clean Theme) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(14, 18, 30, 0.6) 0%, rgba(8, 10, 18, 0.75) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginLeft: '34px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0, 240, 255, 0.06)', borderBottom: '1px solid rgba(0, 240, 255, 0.15)', color: '#00f0ff' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Dashboard Metric</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>What It Shows Inside Extension</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { num: '01', name: 'Cost per Request', desc: 'Visual timeline bars ($0.00 cache hits vs small model $0.0002)' },
                        { num: '02', name: 'Cache Hit Rate', desc: 'Live Qdrant vector semantic hits percentage (up to 48.0% savings)' },
                        { num: '03', name: 'Route Split', desc: 'Segmented distribution: Cache vs Small vs Large vs Escalated' },
                        { num: '04', name: 'p50 / p95 Latency', desc: 'Median latency (13.5ms cache) vs 95th percentile tail latency meters' },
                        { num: '05', name: 'Quality Score Over Time', desc: 'Quality rating badges per route (Cache: 0.98, Small: 0.89, Large: 0.97)' },
                      ].map((m, idx, arr) => (
                        <tr key={m.num} style={{ borderBottom: idx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}>
                          <td style={{ padding: '10px 14px', color: '#f1f5f9', fontWeight: 600 }}>
                            <span style={{ color: '#00f0ff', fontFamily: "'JetBrains Mono', monospace", marginRight: '8px' }}>{m.num}.</span>
                            {m.name}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{m.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => handleCopy('code --install-extension "extension/adaptiveroute-ai-1.0.0.vsix"', 42)}
                  style={{
                    padding: '11px 24px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.08) 100%)',
                    border: '1px solid rgba(0, 240, 255, 0.45)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#00f0ff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 8px 24px rgba(0, 240, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 240, 255, 0.35) 0%, rgba(0, 240, 255, 0.16) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 240, 255, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.08) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.45)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 240, 255, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.25)';
                  }}
                >
                  <Copy size={14} />
                  <span>{copiedIndex === 42 ? 'Command Copied!' : 'Copy VSIX Install Command'}</span>
                </button>
              </div>
            </>
          )}

          {/* ── TAB 3: REST & OPENAI-COMPATIBLE API ── */}
          {activeTab === 'openai' && (
            <>
              {/* Glass Top Banner (Uniform Cyan Accent) */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(0, 240, 255, 0.03) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 8px 30px rgba(0, 240, 255, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#00f0ff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔌 Universal Drop-In OpenAI Proxy</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Works with <strong>Cursor</strong>, <strong>Antigravity</strong>, <strong>Continue</strong>, <strong>Cline</strong>, <strong>Roo-Code</strong>, or Python SDK.
                </div>
              </div>

              {/* Settings Configuration Table */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '8px' }}>
                  Enter these 3 fields into your agent configuration:
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(14, 18, 30, 0.6) 0%, rgba(8, 10, 18, 0.75) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 14px', color: '#94a3b8', width: '120px' }}>Provider</td>
                        <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 600 }}>OpenAI-Compatible</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>Base URL</td>
                        <td style={{ padding: '10px 14px', color: '#00f0ff', fontFamily: "'JetBrains Mono', monospace" }}>http://localhost:8000/v1</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>{copyBtn('http://localhost:8000/v1', 21)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>Model Name</td>
                        <td style={{ padding: '10px 14px', color: '#00f0ff', fontFamily: "'JetBrains Mono', monospace" }}>adaptive-auto</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>{copyBtn('adaptive-auto', 22)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 14px', color: '#94a3b8' }}>API Key</td>
                        <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>any (or leave empty)</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Python SDK Example */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
                  Python Code Integration:
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(14, 18, 30, 0.6) 0%, rgba(8, 10, 18, 0.75) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}>
                  <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
{`from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")
response = client.chat.completions.create(
    model="adaptive-auto",
    messages=[{"role": "user", "content": "What is TCP congestion control?"}]
)
print(response.choices[0].message.content)`}
                  </pre>
                  {copyBtn(`from openai import OpenAI

client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")
response = client.chat.completions.create(
    model="adaptive-auto",
    messages=[{"role": "user", "content": "What is TCP congestion control?"}]
)
print(response.choices[0].message.content)`, 25)}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

