import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Sliders, RefreshCw, AlertCircle, Bot, User, Copy, Check, Trash2, ShieldCheck, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { sendAnswerQuery, clearCache } from '../services/api';
import SleekZap from '../components/SleekZap';

const DEMO_PROMPTS = [
  {
    title: '1. Initial Query (Cache Miss)',
    text: 'What is TCP congestion control?',
    tag: 'INITIAL',
    desc: 'Evaluates complexity -> routes to model -> stores dense vector in Qdrant',
    color: '#818cf8',
  },
  {
    title: '2. Paraphrase (⚡ Cache Hit)',
    text: 'Can you explain how TCP congestion control works?',
    tag: 'CACHE HIT',
    desc: 'Cosine similarity >= 0.90 -> Instant $0.00 cached completion (<15ms)',
    color: '#00f0ff',
  },
  {
    title: '3. Simple Query (Small Model)',
    text: 'What is the capital of France?',
    tag: 'SMALL TIER',
    desc: 'Short query heuristic -> routes to fast, low-cost Small Model',
    color: '#10b981',
  },
  {
    title: '4. Complex Architecture (Large Model)',
    text: 'Design an event-driven microservices architecture for distributed financial transactions with Kafka and Redis.',
    tag: 'LARGE TIER',
    desc: 'Architecture keywords -> routes to reasoning Large Model',
    color: '#f59e0b',
  },
  {
    title: '5. Quality Escalation Demo',
    text: 'Implement a complete quicksort algorithm in Python with test cases.',
    tag: 'ESCALATION',
    desc: 'Small model output inspected -> if weak or missing code, escalates to Large Model',
    color: '#ec4899',
  }
];

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to the Semantic Cost-Aware LLM Router!\n\nThis inference layer combines:\n- ⚡ **Dense Vector Semantic Caching** (Qdrant + MiniLM) for instant $0.00 responses\n- 🎯 **Deterministic Routing** (Small vs Large Model tier)\n- ⚠️ **Quality-Based Escalation** when small models produce weak completions\n\nTry sending **"What is TCP congestion control?"** and then its paraphrase **"Can you explain how TCP congestion control works?"** to witness zero-cost semantic caching!',
      metadata: null,
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheClearMsg, setCacheClearMsg] = useState(null);

  // Router Overrides
  const [forceRoute, setForceRoute] = useState(''); // '' | 'small' | 'large'

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheClearMsg(null);
    try {
      await clearCache();
      setCacheClearMsg('Semantic cache flushed successfully!');
      setTimeout(() => setCacheClearMsg(null), 3500);
    } catch (e) {
      setCacheClearMsg('Cache clear failed: ' + e.message);
    } finally {
      setClearingCache(false);
    }
  };

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
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendAnswerQuery({
        query: promptText,
        force_route: forceRoute || null,
      });

      const assistantMsg = {
        id: Date.now().toString() + '-resp',
        role: 'assistant',
        content: result.response,
        metadata: result,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Inference call failed. Ensure the server is running on http://localhost:8000');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Controls & Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <SleekZap size={18} variant="cyan" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Interactive Inference Playground</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Test vector similarity matching, complexity routing, and automatic escalation live.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Force Route Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Routing Mode:</span>
            <select
              value={forceRoute}
              onChange={(e) => setForceRoute(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.82rem', background: '#131622', border: '1px solid var(--border)', borderRadius: '8px' }}
            >
              <option value="">Auto (Cost-Aware Router)</option>
              <option value="small">Force Small Model Tier</option>
              <option value="large">Force Large Model Tier</option>
            </select>
          </div>

          {/* Clear Cache Button */}
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            title="Clear all Qdrant vector points to test fresh cache misses"
          >
            <Trash2 size={14} />
            <span>{clearingCache ? 'Clearing...' : 'Clear Cache'}</span>
          </button>
        </div>
      </div>

      {cacheClearMsg && (
        <div style={{
          padding: '10px 16px', borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399', fontSize: '0.85rem'
        }}>
          {cacheClearMsg}
        </div>
      )}

      {/* Preset Demo Prompts */}
      <div>
        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
          Interactive Architecture Presets:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
          {DEMO_PROMPTS.map((p, idx) => (
            <div
              key={idx}
              onClick={() => handleSubmit(null, p.text)}
              style={{
                background: 'rgba(18, 20, 29, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = p.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>{p.title}</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                  background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40`
                }}>
                  {p.tag}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
                {p.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="glass-panel" style={{
        minHeight: '440px',
        maxHeight: '620px',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const meta = msg.metadata;

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '14px',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isUser ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(0, 240, 255, 0.15)',
                border: isUser ? '1px solid #818cf8' : '1px solid rgba(0, 240, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="#00f0ff" />}
              </div>

              {/* Message Bubble & Metadata */}
              <div style={{
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}>
                {/* Bubble Content */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: isUser ? '#1e2235' : 'rgba(15, 17, 26, 0.95)',
                  border: isUser ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  fontSize: '0.93rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  position: 'relative'
                }}>
                  {msg.content}
                </div>

                {/* Assistant Telemetry Badges */}
                {!isUser && meta && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {/* Cache Hit Badge */}
                    {meta.cache_hit ? (
                      <span className="badge-cache-hit" style={{ padding: '3px 8px', borderRadius: '5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} />
                        <span>CACHE HIT • $0.00 COST</span>
                      </span>
                    ) : (
                      <span style={{
                        padding: '3px 8px', borderRadius: '5px', fontWeight: 600,
                        background: meta.route === 'complex' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: meta.route === 'complex' ? '#f59e0b' : '#10b981',
                        border: meta.route === 'complex' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        ROUTE: {meta.route?.toUpperCase() || 'DIRECT'}
                      </span>
                    )}

                    {/* Model */}
                    <span style={{ color: 'var(--text-sub)' }}>
                      Model: <strong style={{ color: '#e2e8f0' }}>{meta.model?.split('/')?.pop() || 'cache'}</strong>
                    </span>

                    {/* Latency */}
                    <span style={{ color: 'var(--text-sub)' }}>
                      Latency: <strong style={{ color: '#00f0ff' }}>{meta.latency_ms} ms</strong>
                    </span>

                    {/* Cost */}
                    <span style={{ color: 'var(--text-sub)' }}>
                      Cost: <strong style={{ color: meta.cache_hit ? '#34d399' : '#e2e8f0' }}>${(meta.cost || 0).toFixed(6)}</strong>
                    </span>

                    {/* Quality */}
                    {meta.quality_score != null && (
                      <span style={{ color: 'var(--text-sub)' }}>
                        Quality: <strong style={{ color: '#a78bfa' }}>{meta.quality_score}</strong>
                      </span>
                    )}

                    {/* Copy action */}
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '4px' }}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}

                {/* Escalation Alert */}
                {!isUser && meta?.escalated && (
                  <div className="badge-escalated" style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%'
                  }}>
                    <AlertCircle size={15} />
                    <span>
                      <strong>Quality Escalation Triggered:</strong> {meta.escalation_reason || 'Weak small-model completion detected'} &rarr; Auto-escalated to Large Model Tier.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(0, 240, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={18} color="#00f0ff" />
            </div>
            <div style={{
              padding: '12px 18px', borderRadius: '4px 16px 16px 16px',
              background: 'rgba(15, 17, 26, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--text-sub)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Querying Qdrant Cache & Routing Tier...</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask a question, enter code, or test semantic similarity..."
          style={{
            flex: 1,
            padding: '14px 18px',
            fontSize: '0.95rem',
            background: 'rgba(18, 20, 29, 0.9)',
            border: '1px solid var(--border)',
            borderRadius: '12px'
          }}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !inputPrompt.trim()}
          style={{ padding: '0 24px', borderRadius: '12px' }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
