import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Zap, Code, Cpu, ArrowRight, X } from 'lucide-react';
import SleekZap from './SleekZap';

export default function LocalSetupModal({ isOpen, onClose, onEnterApp }) {
  const [activeTab, setActiveTab] = useState('quickstart'); // 'quickstart' | 'extension' | 'claude' | 'docker'
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
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        color: copiedIndex === idx ? '#4ade80' : '#a1a1aa',
        padding: '4px 8px',
        fontSize: '11px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = copiedIndex === idx ? '#4ade80' : '#a1a1aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
    >
      {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
      <span>{copiedIndex === idx ? 'Copied!' : 'Copy'}</span>
    </button>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d11',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: '#ededed',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #00F0FF, #7000FF)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 8px #00F0FF',
              }} />
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                LOCAL SETUP GUIDE
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              Run AdaptiveRoute Locally
            </h2>
            <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px', lineHeight: 1.4 }}>
              Set up the intelligent ML routing gateway on your machine in under 2 minutes.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#a1a1aa',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: '#09090b',
        }}>
          {[
            { id: 'quickstart', label: 'Python Quickstart', icon: SleekZap },
            { id: 'extension', label: 'VS Code / Cursor Extension', icon: Code },
            { id: 'claude', label: 'Claude CLI & SDK', icon: Cpu },
            { id: 'docker', label: 'Docker Compose', icon: Zap },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(255, 255, 255, 0.16)' : 'transparent'}`,
                  borderRadius: '8px',
                  color: active ? '#fff' : '#71717a',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} color={active ? '#00F0FF' : '#71717a'} />
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
        }}>
          {activeTab === 'quickstart' && (
            <>
              {/* Step 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#1c1c24', color: '#00F0FF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>1</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>Clone repository & install dependencies</span>
                </div>
                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#4ade80' }}>
                    git clone https://github.com/Jettysnigdhan/AdaptiveAI-.git && cd AdaptiveAI && pip install -r backend/requirements.txt
                  </code>
                  {copyBtn('git clone https://github.com/Jettysnigdhan/AdaptiveAI-.git && cd AdaptiveAI && pip install -r backend/requirements.txt', 1)}
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#1c1c24', color: '#00F0FF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>2</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>Configure environment (Optional cloud keys or 100% local Ollama)</span>
                </div>
                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#cbd5e1' }}>
                    cp backend/.env.example backend/.env
                  </code>
                  {copyBtn('cp backend/.env.example backend/.env', 2)}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '6px', lineHeight: 1.4 }}>
                  Supports <b>Groq LPU</b> (fastest), <b>Anthropic Claude</b>, <b>OpenAI</b>, <b>xAI Grok</b>, or <b>Ollama</b> (100% free local models).
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#1c1c24', color: '#00F0FF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>3</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>Start the AdaptiveRoute Gateway Server</span>
                </div>
                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#38bdf8' }}>
                    python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
                  </code>
                  {copyBtn('python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000', 3)}
                </div>
                <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  Server runs at <b>http://localhost:8000</b>. Both <code>/v1/chat/completions</code> and <code>/v1/messages</code> are live!
                </div>
              </div>
            </>
          )}

          {activeTab === 'extension' && (
            <>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                  1-Click Installation in Cursor, Antigravity, or VS Code
                </h4>
                <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, marginBottom: '14px' }}>
                  The extension provides a sidebar chat with live automatic model downscaling (e.g. asking <code>3*4</code> auto-downscales from Claude 3.5 Sonnet to Small Tier with live savings telemetry).
                </p>

                <div style={{ background: '#111116', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Option A: Install via Command Palette</div>
                  <div style={{ fontSize: '12px', color: '#e4e4e7', lineHeight: 1.6 }}>
                    1. In Cursor / VS Code, press <code style={{ background: '#1f1f28', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+Shift+P</code> (or Cmd+Shift+P).<br />
                    2. Select <b>Extensions: Install from VSIX...</b><br />
                    3. Pick: <code>extension/adaptiveroute-ai-1.0.0.vsix</code>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Option B: Install via Terminal</div>
                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#818cf8' }}>
                    code --install-extension extension/adaptiveroute-ai-1.0.0.vsix
                  </code>
                  {copyBtn('code --install-extension extension/adaptiveroute-ai-1.0.0.vsix', 4)}
                </div>
              </div>
            </>
          )}

          {activeTab === 'claude' && (
            <>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                  Route Claude Chat / CLI through AdaptiveRoute
                </h4>
                <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, marginBottom: '14px' }}>
                  When using Claude Code CLI or official Anthropic SDK, point the base URL to AdaptiveRoute. Even if you select <code>claude-3-5-sonnet</code>, simple prompts like <code>3*4</code> automatically route to the Small tier model!
                </p>

                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Claude Code CLI (Terminal)</div>
                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#4ade80' }}>
                    export ANTHROPIC_BASE_URL="http://localhost:8000" && claude
                  </code>
                  {copyBtn('export ANTHROPIC_BASE_URL="http://localhost:8000" && claude', 5)}
                </div>

                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Anthropic Python SDK</div>
                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
                  <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
{`import anthropic
client = anthropic.Anthropic(base_url="http://localhost:8000/v1", api_key="any")
resp = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{"role": "user", "content": "3*4"}]
)
print(resp.content[0].text)  # "12" (Auto-routed to Small tier in 206ms!)`}
                  </pre>
                </div>
              </div>
            </>
          )}

          {activeTab === 'docker' && (
            <>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                  Run with Docker Compose
                </h4>
                <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, marginBottom: '14px' }}>
                  Deploy AdaptiveRoute backend and frontend with a single Docker command.
                </p>

                <div style={{ background: '#070709', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#38bdf8' }}>
                    docker-compose up --build
                  </code>
                  {copyBtn('docker-compose up --build', 6)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#09090b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <a
            href="https://github.com/Jettysnigdhan/AdaptiveAI-"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '12px',
              color: '#71717a',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
          >
            <span>Documentation & Source Code</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                color: '#a1a1aa',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onEnterApp?.();
              }}
              style={{
                background: '#fff',
                color: '#09090b',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 16px rgba(255,255,255,0.2)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span>Test Live in Web Chat</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
