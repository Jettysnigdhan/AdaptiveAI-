import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Sliders, RefreshCw, AlertCircle, Bot, User, Copy, Check, Trash2, Download, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { sendOpenAIChat } from '../services/api';
import RoutingDetailsDrawer from '../components/RoutingInfo/RoutingDetailsDrawer';
import SleekZap from '../components/SleekZap';

const PRESET_PROMPTS = [
  { label: 'Test Downscale: 3*4', text: '3*4', tag: 'SMALL', isDownscale: true, desc: 'Auto-downscale from Claude 3.5 Sonnet to Small tier (~200ms, -90% cost)' },
  { label: 'Coding (Medium Tier)', text: 'Write a Python function to check for balanced parentheses using a stack.', tag: 'MEDIUM', desc: 'Standard code synthesis' },
  { label: 'Architecture (Large Tier)', text: 'Architect a high-performance distributed streaming engine with Raft consensus and Byzantine fault tolerance in Rust.', tag: 'LARGE', desc: 'Preserves Large Flagship Tier' },
];

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to AdaptiveRoute! Even if you select a high default model like Claude 3.5 Sonnet, AdaptiveRoute reads prompt semantics: simple queries like "3*4" are automatically downscaled to fast, cost-efficient models.',
      metadata: null,
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [clientModel, setClientModel] = useState('claude-3-5-sonnet');
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

  const handleSubmit = async (e, customPrompt = null) => {
    e?.preventDefault();
    const promptText = (customPrompt || inputPrompt).trim();
    if (!promptText || loading) return;

    setError(null);
    setInputPrompt('');

    // Append user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      requestedModel: clientModel,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendOpenAIChat({
        prompt: promptText,
        model: clientModel,
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
      {/* Top Model Selector & Header Bar */}
      <div style={{
        background: '#111114',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Client Model Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Client Default Model:
          </span>
          <select
            value={clientModel}
            onChange={(e) => setClientModel(e.target.value)}
            style={{
              background: '#09090b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.84rem',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Default High Tier)</option>
            <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
            <option value="gpt-4o">OpenAI GPT-4o (High Tier)</option>
            <option value="gpt-4o-mini">OpenAI GPT-4o-mini</option>
            <option value="grok-2">xAI Grok-2</option>
            <option value="grok-2-mini">xAI Grok-2-mini</option>
            <option value="deepseek-r1:8b">DeepSeek R1 (8B)</option>
            <option value="adaptive-auto">Adaptive Auto Router</option>
          </select>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: showConfig ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: showConfig ? '#818cf8' : '#a1a1aa',
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
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#71717a',
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
            onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; }}
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={handleExportChat}
            title="Export JSON Trace"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#71717a',
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
            onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; }}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Preset Prompts Strip with 3*4 Test */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 600 }}>Try:</span>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSubmit(null, p.text)}
            style={{
              background: idx === 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              border: idx === 0 ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              color: idx === 0 ? '#4ade80' : '#d4d4d8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: idx === 0 ? 600 : 400,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = idx === 0 ? '#4ade80' : '#818cf8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = idx === 0 ? 'rgba(74, 222, 128, 0.35)' : 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'none'; }}
          >
            {p.isDownscale && <SleekZap size={13} variant="emerald" />}
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Expandable Controls Shelf */}
      {showConfig && (
        <div style={{
          background: '#111114',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Tier Override
            </label>
            <select
              value={forceTier}
              onChange={(e) => setForceTier(e.target.value)}
              style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="">Auto ML Router (Recommended)</option>
              <option value="small">Force Small Tier</option>
              <option value="medium">Force Medium Tier</option>
              <option value="large">Force Large Tier</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
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
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Max Tokens ({maxTokens})
            </label>
            <input
              type="number"
              min="64"
              max="4096"
              step="64"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', width: '100px', padding: '6px 10px', fontSize: '0.85rem' }}
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
                background: msg.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : '#111114',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} color="#818cf8" />}
              </div>

              {/* Message Content Bubble */}
              <div style={{ flex: 1 }}>
                {/* Dynamic Downscaling Alert Card */}
                {msg.role === 'assistant' && msg.metadata?.downscaled && (
                  <div style={{
                    background: 'linear-gradient(90deg, rgba(74, 222, 128, 0.12), rgba(99, 102, 241, 0.06))',
                    border: '1px solid rgba(74, 222, 128, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SleekZap size={14} variant="emerald" /> DOWNSCALED BY PROMPT SEMANTICS (-90% Cost)
                      </span>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: "'JetBrains Mono',monospace" }}>
                        {msg.metadata.latency_ms?.toFixed(0)}ms
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#e4e4e7', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: '#a1a1aa' }}>Client requested:</span>
                      <code style={{ background: '#09090b', padding: '1px 5px', borderRadius: '4px', color: '#f43f5e' }}>{msg.metadata.requested_model}</code>
                      <span>➔</span>
                      <span style={{ color: '#a1a1aa' }}>Routed to:</span>
                      <code style={{ background: '#09090b', padding: '1px 5px', borderRadius: '4px', color: '#4ade80', fontWeight: 600 }}>{msg.metadata.selected_model} [{msg.metadata.selected_tier?.toUpperCase()}]</code>
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a', fontStyle: 'italic' }}>
                      {msg.metadata.explanation}
                    </div>
                  </div>
                )}

                {/* Flagship Preserved Card */}
                {msg.role === 'assistant' && msg.metadata && !msg.metadata.downscaled && msg.metadata.selected_tier === 'large' && (
                  <div style={{
                    background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.1), rgba(112, 0, 255, 0.06))',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={13} /> FLAGSHIP TIER PRESERVED (Complex Task)
                      </span>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: "'JetBrains Mono',monospace" }}>
                        Quality: {msg.metadata.quality_score}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#e4e4e7' }}>
                      <span style={{ color: '#a1a1aa' }}>Model: </span>
                      <code style={{ background: '#09090b', padding: '1px 5px', borderRadius: '4px', color: '#f43f5e', fontWeight: 600 }}>{msg.metadata.selected_model} [LARGE]</code>
                    </div>
                  </div>
                )}

                {/* Assistant Telemetry Header Strip */}
                {msg.role === 'assistant' && msg.metadata && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#111114',
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
                  background: msg.role === 'user' ? '#181b24' : '#111114',
                  border: msg.role === 'user' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255,255,255,0.08)',
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#a1a1aa' }}>
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
              <span>Analyzing prompt semantics and determining minimum sufficient model tier...</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={{
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={`Ask ${clientModel} (e.g. 3*4 or complex code)...`}
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
          }}
        />

        <button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          style={{
            background: '#818cf8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !inputPrompt.trim() || loading ? 'not-allowed' : 'pointer',
            opacity: !inputPrompt.trim() || loading ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
