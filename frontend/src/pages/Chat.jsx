import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Sliders, RefreshCw, AlertCircle, Bot, User, Copy, Check, Trash2, Download, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { sendChatPrompt } from '../services/api';
import RoutingDetailsDrawer from '../components/RoutingInfo/RoutingDetailsDrawer';

const PRESET_PROMPTS = [
  { label: 'Factual (Small Tier)', text: 'What is the capital of Canada in one concise sentence?', tag: 'SMALL' },
  { label: 'Coding (Medium Tier)', text: 'Write a Python function to check for balanced parentheses using a stack.', tag: 'MEDIUM' },
  { label: 'Reasoning (Large Tier)', text: 'Explain the Byzantine Generals Problem and compare how PBFT and Raft solve distributed consensus.', tag: 'LARGE' },
];

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to AdaptiveRoute! Send any prompt to observe intelligent dynamic routing across Small, Medium, and Large models with automated quality evaluation and cascading escalation.',
      metadata: null,
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Settings / Overrides
  const [showConfig, setShowConfig] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [forceTier, setForceTier] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const promptText = inputPrompt.trim();
    if (!promptText || loading) return;

    setError(null);
    setInputPrompt('');

    // Append user message
    const userMsg = { id: Date.now().toString(), role: 'user', content: promptText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendChatPrompt({
        prompt: promptText,
        temperature,
        maxTokens,
        forceTier: forceTier || null,
      });

      const assistantMsg = {
        id: result.request_id || Date.now().toString(),
        role: 'assistant',
        content: result.response,
        metadata: result,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during inference.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation cleared. Send a new prompt to test AdaptiveRoute.',
        metadata: null,
      }
    ]);
  };

  const handleExportChat = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `adaptiveroute_chat_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTierColor = (tier) => {
    const t = (tier || '').toUpperCase();
    if (t === 'SMALL') return '#4ade80';
    if (t === 'MEDIUM') return '#38bdf8';
    return '#f59e0b';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Configuration & Action Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        {/* Preset Prompts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try:</span>
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInputPrompt(p.text)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '5px 11px',
                fontSize: '0.78rem',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: showConfig ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: showConfig ? '#818cf8' : 'var(--text-sub)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Sliders size={14} />
            <span>Options</span>
          </button>

          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={handleExportChat}
            title="Export JSON Trace"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e4e4e7'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Expandable Controls Shelf */}
      {showConfig && (
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Tier Override
            </label>
            <select
              value={forceTier}
              onChange={(e) => setForceTier(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="">Auto ML Router (Recommended)</option>
              <option value="small">Force Small Tier</option>
              <option value="medium">Force Medium Tier</option>
              <option value="large">Force Large Tier</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Temperature ({temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '120px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Max Tokens ({maxTokens})
            </label>
            <input
              type="number"
              min="64"
              max="4096"
              step="64"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              style={{ width: '100px', padding: '6px 10px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      )}

      {/* Messages Thread Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingRight: '8px',
        marginBottom: '16px',
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              maxWidth: msg.role === 'user' ? '80%' : '94%',
              alignItems: 'flex-start'
            }}>
              {/* Role Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} color="#818cf8" />}
              </div>

              {/* Message Content Bubble */}
              <div style={{ flex: 1 }}>
                {/* Assistant Telemetry Header Strip */}
                {msg.role === 'assistant' && msg.metadata && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    marginBottom: '8px',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono',monospace",
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        color: getTierColor(msg.metadata.selected_tier),
                        background: `${getTierColor(msg.metadata.selected_tier)}15`,
                        border: `1px solid ${getTierColor(msg.metadata.selected_tier)}30`,
                        borderRadius: '4px',
                        padding: '1px 7px',
                        fontWeight: 600,
                      }}>
                        {msg.metadata.selected_tier?.toUpperCase()}
                      </span>
                      <span style={{ color: '#a1a1aa' }}>{msg.metadata.selected_model}</span>
                      {msg.metadata.latency_ms && (
                        <span style={{ color: '#71717a' }}>{msg.metadata.latency_ms.toFixed(1)}ms</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {msg.metadata.escalated && (
                        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ArrowUpRight size={12} /> Escalated
                        </span>
                      )}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === msg.id ? '#4ade80' : '#71717a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontFamily: 'inherit',
                        }}
                      >
                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div style={{
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%)' : 'var(--bg-card)',
                  border: msg.role === 'user' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border)',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  padding: '14px 18px',
                  fontSize: '0.94rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  color: '#f8fafc',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}>
                  {msg.content}
                </div>

                {/* Technical Routing Details Drawer Attached to Assistant Messages */}
                {msg.metadata && <RoutingDetailsDrawer metadata={msg.metadata} />}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-sub)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={16} className="spin" color="#818cf8" />
            </div>
            <div style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Analyzing prompt features and routing to optimal tier...</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} style={{ position: 'relative', marginTop: 'auto' }}>
        <textarea
          rows={2}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask anything... e.g. 'Explain quicksort in Python' or 'Calculate the integral of e^(2x)'"
          style={{
            width: '100%',
            padding: '14px 64px 14px 18px',
            fontSize: '0.94rem',
            resize: 'none',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: '#fff',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          className="btn-primary"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '8px 14px',
            borderRadius: '10px'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
