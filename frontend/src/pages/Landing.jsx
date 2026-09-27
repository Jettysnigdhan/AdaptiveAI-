import React, { useState, useEffect, useRef } from 'react';

// ─── Tier Color Map ───────────────────────────────────────────────────────────
const TIER_COLORS = { SMALL: '#4ade80', MEDIUM: '#38bdf8', LARGE: '#f59e0b' };

const SAMPLE_PROMPTS = [
  { label: 'Simple factual', text: 'What is the capital of Australia?', expectedTier: 'SMALL' },
  { label: 'Code generation', text: 'Write a Python function to check if a string is a palindrome.', expectedTier: 'MEDIUM' },
  { label: 'Complex reasoning', text: 'Design an event-driven microservices architecture for a real-time fraud detection system handling 50,000 transactions per second.', expectedTier: 'LARGE' },
];

// ─── 3D Card with Tilt & Spotlight Glare ───────────────────────────────────────
function Card3D({ children, style = {}, className = '', intensity = 8, glare = true }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotX = -y * intensity;
    const rotY = x * intensity;
    setTransform(`perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(4px)`);
    setGlarePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      opacity: 0.12,
    });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        transform,
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {glare && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(circle 380px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.09), transparent 70%)`,
            opacity: glarePos.opacity,
            transition: 'opacity 0.25s ease',
            zIndex: 2,
          }}
        />
      )}
      {children}
    </div>
  );
}

// ─── FadeIn Observer ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {}, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.99)',
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Typewriter Line ──────────────────────────────────────────────────────────
function TypewriterLine({ text, delay = 0 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, 15);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return <span style={{ color: '#a1a1aa' }}>{shown}</span>;
}

// ─── Hero 3D Floating Interactive Controls ────────────────────────────────────
function HeroFloatingPills({ tau, setTau, weight, setWeight, autoEscalate, setAutoEscalate }) {
  return (
    <>
      {/* Floating Pill 1: Quality Threshold Slider (Top Center) */}
      <div
        className="hero-pill hero-pill-1"
        style={{
          position: 'absolute',
          top: '-32px',
          right: '12%',
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '10px 18px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
          zIndex: 10,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#71717a', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em' }}>Threshold τ</span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#4ade80', fontFamily: "'JetBrains Mono',monospace" }}>{tau.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.50"
          max="0.99"
          step="0.01"
          value={tau}
          onChange={(e) => setTau(parseFloat(e.target.value))}
          style={{
            width: '90px',
            accentColor: '#4ade80',
            cursor: 'ew-resize',
          }}
        />
      </div>

      {/* Floating Pill 2: Routing Weight (Bottom Left) */}
      <div
        className="hero-pill hero-pill-2"
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '4%',
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '10px 18px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#71717a', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em' }}>Weight</span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#e4e4e7', fontFamily: "'JetBrains Mono',monospace" }}>{weight}</span>
        </div>
        <input
          type="range"
          min="100"
          max="900"
          step="25"
          value={weight}
          onChange={(e) => setWeight(parseInt(e.target.value, 10))}
          style={{
            width: '80px',
            accentColor: '#818cf8',
            cursor: 'ew-resize',
          }}
        />
      </div>

      {/* Floating Pill 3: Auto-Escalate Toggle (Bottom Right) */}
      <div
        className="hero-pill hero-pill-3"
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '6%',
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '10px 16px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Auto-Escalate</span>
        <button
          onClick={() => setAutoEscalate(!autoEscalate)}
          style={{
            background: '#09090b',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '20px',
            padding: '3px',
            display: 'flex',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            padding: '3px 9px',
            borderRadius: '16px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono',monospace",
            color: !autoEscalate ? '#fff' : '#52525b',
            background: !autoEscalate ? '#27272a' : 'transparent',
            transition: 'all 0.2s',
          }}>Off</span>
          <span style={{
            padding: '3px 9px',
            borderRadius: '16px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono',monospace",
            color: autoEscalate ? '#fff' : '#52525b',
            background: autoEscalate ? '#4ade80' : 'transparent',
            fontWeight: autoEscalate ? 600 : 400,
            boxShadow: autoEscalate ? '0 0 10px rgba(74,222,128,0.4)' : 'none',
            transition: 'all 0.2s',
          }}>On</span>
        </button>
      </div>
    </>
  );
}

// ─── Section 2: 3D Revolving Cylindrical Carousel (DialKit Signature Style) ──
function CylinderCarousel3D() {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const animRef = useRef(null);

  const panels = [
    {
      num: '01',
      title: 'Sub-150ms Decision',
      sub: 'Embedding + Classifier',
      tag: 'SPEED',
      accent: '#4ade80',
      detail: 'Predicts minimum viable model tier in ~138ms before the first LLM token is ever fetched.',
      badge: '138ms LATENCY',
    },
    {
      num: '02',
      title: '74% Cost Reduction',
      sub: 'Token arbitrage',
      tag: 'SAVINGS',
      accent: '#38bdf8',
      detail: '80% of routine coding and queries run on Small or Medium tiers without sacrificing output fidelity.',
      badge: '0.0004$ / REQ',
    },
    {
      num: '03',
      title: 'Quality-Aware Ladder',
      sub: 'Dynamic cascading',
      tag: 'ACCURACY',
      accent: '#f59e0b',
      detail: 'Responses are verified against threshold τ. If output is degraded, it escalates to Large automatically.',
      badge: 'τ = 0.82 FLOOR',
    },
    {
      num: '04',
      title: 'IDE Native Gateway',
      sub: 'Antigravity / Cursor / VS Code',
      tag: 'PROTOCOL',
      accent: '#818cf8',
      detail: 'Point your editor to localhost:8000/v1 with model adaptive-auto. Zero SDK rewriting required.',
      badge: 'OPENAI COMPAT',
    },
    {
      num: '05',
      title: '15 Semantic Signals',
      sub: 'Continuous ML features',
      tag: 'ANALYZER',
      accent: '#a78bfa',
      detail: 'Code block counts, math keywords, reasoning markers, and token entropy feed the routing classifier.',
      badge: 'XGBOOST + EMBED',
    },
    {
      num: '06',
      title: 'Multi-Provider Cascading',
      sub: 'Grok, Groq, Anthropic, OpenAI',
      tag: 'PROVIDERS',
      accent: '#ec4899',
      detail: 'Failover gracefully across model providers when upstream APIs rate-limit or experience latency spikes.',
      badge: 'FAILOVER SAFE',
    },
  ];

  // Auto-rotation loop
  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (!isHovered && !isDragging) {
        setRotation((prev) => (prev - delta * 12) % 360);
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isHovered, isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    setRotation((prev) => prev + dx * 0.45);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const count = panels.length;
  const radius = 340; // 3D cylinder radius in px

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '50px 0 90px' }}>
      {/* Ambient glow behind cylinder */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '240px',
        background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, rgba(9,9,11,0) 70%)',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />

      {/* Section label */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <span style={{
          fontSize: '11px',
          fontFamily: "'JetBrains Mono',monospace",
          color: '#52525b',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          3D ENGINE SHOWCASE — DRAG TO ROTATE
        </span>
      </div>

      {/* 3D Stage */}
      <div
        style={{
          perspective: '1300px',
          perspectiveOrigin: '50% 50%',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsDragging(false); }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          style={{
            position: 'relative',
            width: '290px',
            height: '240px',
            transformStyle: 'preserve-3d',
            transform: `rotateX(-6deg) rotateY(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.05s linear',
          }}
        >
          {panels.map((p, i) => {
            const angle = (360 / count) * i;
            return (
              <div
                key={p.num}
                onClick={() => setActiveIdx(i)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  background: 'linear-gradient(145deg, rgba(20,20,24,0.92) 0%, rgba(13,13,15,0.96) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${activeIdx === i ? p.accent + '55' : 'rgba(255,255,255,0.09)'}`,
                  borderRadius: '16px',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: `0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px ${activeIdx === i ? p.accent + '22' : 'transparent'}`,
                  userSelect: 'none',
                  backfaceVisibility: 'hidden',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: p.accent, letterSpacing: '0.08em', fontWeight: 600 }}>{p.tag}</span>
                    <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", color: '#3f3f46' }}>{p.num}</span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 500, color: '#f4f4f5', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>{p.title}</h3>
                  <div style={{ fontSize: '11px', color: '#71717a', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>{p.sub}</div>
                  <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>{p.detail}</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '10px',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent, boxShadow: `0 0 8px ${p.accent}` }} />
                  <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: p.accent, letterSpacing: '0.06em' }}>{p.badge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: DialKit-Style Split Interactive Tuning Playground ─────────────
function InteractivePlayground({ onEnterApp }) {
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [tau, setTau] = useState(0.82);
  const [latencyBudget, setLatencyBudget] = useState(250);
  const [policy, setPolicy] = useState('balanced');
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [provider, setProvider] = useState('grok');
  const [simState, setSimState] = useState('ready'); // ready, streaming, done
  const [outputTokens, setOutputTokens] = useState('');

  const demos = [
    {
      title: 'Python Binary Search',
      prompt: 'Implement an in-place binary search function in Python that returns -1 if not found.',
      tier: 'SMALL',
      model: 'grok-2-mini',
      latency: '124ms',
      cost: '$0.00004',
      tokens: 92,
      output: `def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
    },
    {
      title: 'Distributed Event Bus',
      prompt: 'Design an event-driven architecture with idempotent event processing and DLQ for payment systems.',
      tier: 'LARGE',
      model: 'grok-2',
      latency: '512ms',
      cost: '$0.00140',
      tokens: 418,
      output: `1. Ingestion: Kafka partitioned by account_id to maintain strict ordering.\n2. Idempotency: Redis SETNX with transaction hash + 24h TTL before execution.\n3. Outbox Pattern: PostgreSQL transactional write + Debezium CDC stream.\n4. Failure Handling: Dead Letter Queue (DLQ) with exponential backoff & alerts.`,
    },
    {
      title: 'Explain TCP 3-Way Handshake',
      prompt: 'Explain SYN, SYN-ACK, and ACK in simple developer terms with packet flags.',
      tier: 'SMALL',
      model: 'grok-2-mini',
      latency: '138ms',
      cost: '$0.00006',
      tokens: 140,
      output: `1. SYN: Client sends Synchronize packet with initial sequence number (ISN_c).\n2. SYN-ACK: Server acknowledges (ACK = ISN_c + 1) and responds with own ISN_s.\n3. ACK: Client confirms (ACK = ISN_s + 1). Full-duplex connection established.`,
    },
  ];

  const current = demos[selectedPrompt];

  // Dynamic simulation on prompt change
  useEffect(() => {
    setSimState('streaming');
    setOutputTokens('');
    let i = 0;
    const text = current.output;
    const interval = setInterval(() => {
      i += 3;
      setOutputTokens(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setSimState('done');
      }
    }, 16);
    return () => clearInterval(interval);
  }, [selectedPrompt]);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', letterSpacing: '0.1em' }}>PLAYGROUND</span>
        <h2 style={{ fontSize: '38px', fontWeight: 500, letterSpacing: '-0.025em', color: '#f4f4f5', margin: '12px 0 8px' }}>Tuning & Live Simulation</h2>
        <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '440px', margin: '0 auto' }}>
          Shape routing behavior by feel. Adjust threshold, latency bounds, and escalation rules with immediate tactile feedback.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'stretch' }} className="feat-grid">
        {/* Left Side: Live UI Output */}
        <Card3D intensity={6}>
          <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div>
              {/* Prompt selection tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {demos.map((d, idx) => (
                  <button
                    key={d.title}
                    onClick={() => setSelectedPrompt(idx)}
                    style={{
                      background: selectedPrompt === idx ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: `1px solid ${selectedPrompt === idx ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: selectedPrompt === idx ? '#fff' : '#71717a',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {d.title}
                  </button>
                ))}
              </div>

              {/* Prompt Query Box */}
              <div style={{
                background: '#09090b',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '13px',
                color: '#e4e4e7',
                lineHeight: 1.5,
                marginBottom: '18px',
              }}>
                <span style={{ color: '#52525b', fontFamily: "'JetBrains Mono',monospace", marginRight: '8px' }}>USER ›</span>
                {current.prompt}
              </div>

              {/* Live Output stream */}
              <div style={{
                background: '#0a0a0c',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '16px',
                minHeight: '160px',
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: '12px',
                lineHeight: 1.7,
                color: '#a1a1aa',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}>
                {outputTokens}
                {simState === 'streaming' && <span style={{ display: 'inline-block', width: '8px', height: '14px', background: '#4ade80', marginLeft: '4px', verticalAlign: 'middle', animation: 'pulseGlow 0.8s infinite' }} />}
              </div>
            </div>

            {/* Real-time Telemetry HUD */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              marginTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '16px',
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace" }}>MODEL</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: TIER_COLORS[current.tier] }}>{current.tier}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace" }}>LATENCY</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7', fontFamily: "'JetBrains Mono',monospace" }}>{current.latency}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace" }}>EST. COST</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#4ade80', fontFamily: "'JetBrains Mono',monospace" }}>{current.cost}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace" }}>TOKENS</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', fontFamily: "'JetBrains Mono',monospace" }}>{current.tokens}</div>
              </div>
            </div>
          </div>
        </Card3D>

        {/* Right Side: DialKit Tuning Panel */}
        <Card3D intensity={6}>
          <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#e4e4e7' }}>Routing Controls</span>
                <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: '#52525b' }}>DIALKIT v2</span>
              </div>

              {/* Control 1: Quality Threshold Slider */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Quality Threshold (τ)</span>
                  <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", color: '#4ade80', fontWeight: 600 }}>{tau.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.99"
                  step="0.01"
                  value={tau}
                  onChange={(e) => setTau(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#4ade80', cursor: 'ew-resize' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#3f3f46', fontFamily: "'JetBrains Mono',monospace", marginTop: '2px' }}>
                  <span>0.50 (Permissive)</span>
                  <span>0.99 (Strict)</span>
                </div>
              </div>

              {/* Control 2: Latency Budget Slider */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Latency Budget</span>
                  <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", color: '#38bdf8', fontWeight: 600 }}>{latencyBudget}ms</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="25"
                  value={latencyBudget}
                  onChange={(e) => setLatencyBudget(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'ew-resize' }}
                />
              </div>

              {/* Control 3: Policy Segmented Control */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Optimization Goal</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'cost', label: 'Economy' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'quality', label: 'Max Quality' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPolicy(p.id)}
                      style={{
                        background: policy === p.id ? 'rgba(255,255,255,0.1)' : '#09090b',
                        border: `1px solid ${policy === p.id ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '7px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        color: policy === p.id ? '#fff' : '#71717a',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 4: Auto-Escalate Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Auto-Escalation Ladder</div>
                  <div style={{ fontSize: '10px', color: '#52525b' }}>Small → Medium → Large on τ fail</div>
                </div>
                <button
                  onClick={() => setAutoEscalate(!autoEscalate)}
                  style={{
                    background: autoEscalate ? 'rgba(74,222,128,0.12)' : '#09090b',
                    border: `1px solid ${autoEscalate ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    color: autoEscalate ? '#4ade80' : '#71717a',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono',monospace",
                    transition: 'all 0.2s',
                  }}
                >
                  {autoEscalate ? 'ON ✓' : 'OFF'}
                </button>
              </div>

              {/* Control 5: Provider Selection */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Target Provider</div>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#e4e4e7',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="grok">Grok / xAI (grok-2-mini, grok-2)</option>
                  <option value="groq">Groq LPU (Ultra-low latency)</option>
                  <option value="anthropic">Anthropic Claude (Haiku / Sonnet)</option>
                  <option value="openai">OpenAI (GPT-4o mini / GPT-4o)</option>
                </select>
              </div>

              {/* Dynamic SVG Utility Curve */}
              <div style={{
                background: '#09090b',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", marginBottom: '6px' }}>
                  <span>LOGISTIC ROUTING CURVE</span>
                  <span>τ = {tau.toFixed(2)}</span>
                </div>
                <svg width="100%" height="45" viewBox="0 0 300 45" style={{ overflow: 'visible' }}>
                  <path
                    d={`M 0,40 Q ${tau * 200},${40 - (tau * 35)} 300,5`}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2"
                  />
                  <circle cx={tau * 300} cy={40 - (tau * 35)} r="4" fill="#4ade80" />
                </svg>
              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace" }}>STATUS: ACTIVE</span>
              <button
                onClick={onEnterApp}
                style={{
                  background: '#fff',
                  color: '#09090b',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Launch App →
              </button>
            </div>
          </div>
        </Card3D>
      </div>
    </div>
  );
}

// ─── Section: Animated Architecture Pipeline ──────────────────────────────────
function AnimatedArchPipeline() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 6);
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  const steps = [
    { name: 'AI Client', sub: 'IDE / Editor / Agent', detail: 'Sends standard chat request to localhost:8000/v1' },
    { name: 'Adaptive Gateway', sub: 'Reverse Proxy', detail: 'Interprets model: adaptive-auto and streams response' },
    { name: 'Prompt Analyzer', sub: '15 Feature Signals', detail: 'Computes embeddings, token counts & code density in ~15ms' },
    { name: 'ML Classifier', sub: 'Utility Optimization', detail: 'Routes to minimum viable model tier' },
    { name: 'Tier Execution', sub: 'Small / Medium / Large', detail: 'Fetches inference from configured provider' },
    { name: 'Quality Evaluator', sub: 'Score τ ≥ 0.82', detail: 'Auto-escalates if response fails quality standard' },
  ];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
      {/* Background connector line */}
      <div style={{
        position: 'absolute',
        top: '26px',
        left: '5%',
        right: '5%',
        height: '2px',
        background: 'linear-gradient(90deg, #818cf8 0%, #4ade80 50%, #38bdf8 100%)',
        opacity: 0.25,
        zIndex: 0,
      }} />

      {/* Travelling glowing data pulse */}
      <div
        style={{
          position: 'absolute',
          top: '22px',
          left: `${(activeStep / (steps.length - 1)) * 90 + 5}%`,
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#4ade80',
          boxShadow: '0 0 16px #4ade80, 0 0 30px #4ade80',
          transform: 'translateX(-50%)',
          transition: 'left 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1,
        }}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        position: 'relative',
        zIndex: 2,
      }} className="feat-grid">
        {steps.map((st, i) => {
          const isCurrent = activeStep === i;
          return (
            <div
              key={st.name}
              onClick={() => setActiveStep(i)}
              style={{
                background: isCurrent ? 'rgba(255,255,255,0.06)' : '#111114',
                border: `1px solid ${isCurrent ? '#4ade80' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '12px',
                padding: '16px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: isCurrent ? '0 10px 24px rgba(74,222,128,0.15)' : 'none',
              }}
            >
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: isCurrent ? '#4ade80' : '#27272a',
                margin: '0 auto 10px',
                transition: 'background 0.3s',
                boxShadow: isCurrent ? '0 0 8px #4ade80' : 'none',
              }} />
              <div style={{ fontSize: '12px', fontWeight: 500, color: isCurrent ? '#fff' : '#a1a1aa', marginBottom: '4px' }}>{st.name}</div>
              <div style={{ fontSize: '10px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace" }}>{st.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Active step detail readout */}
      <div style={{
        marginTop: '24px',
        background: '#09090b',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: '12px',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: '#4ade80' }}>STEP {activeStep + 1} / 6</span>
          <span style={{ color: '#52525b' }}>—</span>
          <span style={{ color: '#e4e4e7' }}>{steps[activeStep].detail}</span>
        </div>
        <span style={{ color: '#71717a', fontSize: '11px' }}>LATENCY: ~{activeStep * 28 + 12}ms</span>
      </div>
    </div>
  );
}

// ─── Interactive Routing Demo (Preserved & Enhanced) ─────────────────────────
function RoutingDemo() {
  const [state, setState] = useState('idle');
  const [prompt, setPrompt] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [result, setResult] = useState(null);

  function classifyLocally(text) {
    const lower = text.toLowerCase();
    const complexRe = /architect|design.*system|microservice|distributed|event.driven|fraud|induction|concurren|optimize.*tradeoff|real.time.*platform/;
    const midRe = /function|write.*code|implement|palindrome|sort|search|class|api|sql|debug|fix\s/;
    if (complexRe.test(lower) || text.length > 180) return { tier: 'LARGE', complexity: 'HIGH', reasoning: 'HIGH' };
    if (midRe.test(lower) || text.length > 55) return { tier: 'MEDIUM', complexity: 'MODERATE', reasoning: 'MODERATE' };
    return { tier: 'SMALL', complexity: 'LOW', reasoning: 'LOW' };
  }

  async function analyze(text) {
    if (!text.trim()) return;
    setState('analyzing');
    setResult(null);
    setPrompt(text);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 200));
    setResult(classifyLocally(text));
    setState('result');
  }

  function handleSubmit(e) {
    e.preventDefault();
    analyze(customInput);
  }

  const tierPath = result?.tier === 'LARGE' ? ['SMALL', 'MEDIUM', 'LARGE']
    : result?.tier === 'MEDIUM' ? ['SMALL', 'MEDIUM'] : ['SMALL'];

  return (
    <Card3D intensity={5}>
      <div style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        maxWidth: '680px',
        margin: '0 auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.55)' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: '#52525b', letterSpacing: '0.08em' }}>
            ADAPTIVEROUTE — LIVE ENGINE SIMULATION
          </span>
        </div>

        {/* Preset chips */}
        <div style={{ padding: '18px 20px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SAMPLE_PROMPTS.map(p => (
            <button key={p.label} onClick={() => { setCustomInput(p.text); analyze(p.text); }}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '7px', padding: '5px 11px', color: '#71717a', fontSize: '12px',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#e4e4e7'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#71717a'; }}
            >{p.label}</button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ padding: '14px 20px 20px' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Ask AdaptiveRoute anything to test automatic tier switching…"
              rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              style={{
                width: '100%', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', color: '#e4e4e7', fontSize: '14px', lineHeight: '1.5',
                padding: '12px 64px 12px 14px', resize: 'none', outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button type="submit" disabled={!customInput.trim() || state === 'analyzing'}
              style={{
                position: 'absolute', right: '10px', bottom: '10px',
                background: customInput.trim() ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px',
                padding: '5px 12px', color: customInput.trim() ? '#fff' : '#52525b', fontSize: '11px',
                cursor: customInput.trim() ? 'pointer' : 'default',
                fontFamily: "'JetBrains Mono',monospace",
                transition: 'all 0.15s',
              }}
            >Route →</button>
          </div>
        </form>

        {/* Output */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px',
          minHeight: '130px', fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', lineHeight: '1.75',
        }}>
          {state === 'idle' && (
            <span style={{ color: '#3f3f46' }}>Enter a prompt above or click a preset to see real-time classification.</span>
          )}
          {state === 'analyzing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {['Tokenizing prompt & extracting 15 continuous signals…', 'Querying ML classifier utility matrix…', 'Optimizing cost vs reasoning threshold…'].map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', color: '#52525b' }}>
                  <span style={{ color: '#27272a' }}>›</span>
                  <TypewriterLine text={line} delay={i * 200} />
                </div>
              ))}
            </div>
          )}
          {state === 'result' && result && (
            <div>
              <div style={{ color: '#52525b', marginBottom: '18px', fontSize: '12px' }}>
                › &quot;{prompt.slice(0, 58)}{prompt.length > 58 ? '…' : ''}&quot;
              </div>
              <div style={{ display: 'grid', gap: '7px', marginBottom: '14px' }}>
                {[['Analyzing request', '✓ Complete'], ['Task complexity', result.complexity], ['Required capability', result.reasoning]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#52525b' }}>{k}</span>
                    <span style={{ color: '#a1a1aa' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'grid', gap: '6px' }}>
                {tierPath.slice(0, -1).map(t => (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#3f3f46' }}>Routing: {t}</span>
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>✕ insufficient reasoning depth</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ color: '#71717a' }}>Selected model tier</span>
                  <span style={{
                    color: TIER_COLORS[result.tier], fontWeight: 600, padding: '2px 10px',
                    background: `${TIER_COLORS[result.tier]}14`, borderRadius: '5px',
                    border: `1px solid ${TIER_COLORS[result.tier]}30`,
                  }}>{result.tier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#71717a' }}>Execution status</span>
                  <span style={{ color: '#4ade80' }}>✓ Response ready</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card3D>
  );
}

// ─── Interactive Model Router Viz ─────────────────────────────────────────────
function RouterViz() {
  const [selectedTier, setSelectedTier] = useState(null);
  const [animStep, setAnimStep] = useState(0);

  const tiers = [
    { id: 'SMALL', latency: '~140ms', color: '#4ade80' },
    { id: 'MEDIUM', latency: '~280ms', color: '#38bdf8' },
    { id: 'LARGE', latency: '~540ms', color: '#f59e0b' },
  ];

  function simulate(tier) {
    setSelectedTier(null);
    setAnimStep(1);
    setTimeout(() => setAnimStep(2), 500);
    setTimeout(() => { setAnimStep(3); setSelectedTier(tier.id); }, 1100);
  }

  const cellStyle = (active, color) => ({
    textAlign: 'center', padding: '11px 8px',
    background: active ? `${color}14` : '#0f0f11',
    border: `1px solid ${active ? color + '45' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: '8px', color: active ? color : '#52525b',
    fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', letterSpacing: '0.04em',
    transition: 'all 0.3s ease',
  });

  return (
    <Card3D intensity={5}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', maxWidth: '480px', margin: '0 auto', background: '#111114', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={cellStyle(false, '#818cf8')}>PROMPT INPUT</div>
        <div style={{ color: '#3f3f46', fontSize: '18px' }}>↓</div>
        <div style={cellStyle(animStep === 1, '#818cf8')}>{animStep === 1 ? '⚡ EXTRACTING FEATURES…' : 'PROMPT ANALYZER'}</div>
        <div style={{ color: '#3f3f46', fontSize: '18px' }}>↓</div>
        <div style={cellStyle(animStep === 2, '#818cf8')}>{animStep === 2 ? '🔀 COMPUTING UTILITY…' : 'ML ROUTER'}</div>
        <div style={{ color: '#3f3f46', fontSize: '18px' }}>↓</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%' }}>
          {tiers.map(t => (
            <button key={t.id} onClick={() => simulate(t)}
              style={{
                ...cellStyle(selectedTier === t.id, t.color),
                cursor: 'pointer', border: `1px solid ${selectedTier === t.id ? t.color + '60' : 'rgba(255,255,255,0.08)'}`,
              }}
              onMouseEnter={e => { if (selectedTier !== t.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { if (selectedTier !== t.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <div style={{ marginBottom: '3px', fontWeight: 600 }}>{t.id}</div>
              <div style={{ fontSize: '10px', color: '#52525b' }}>{t.latency}</div>
            </button>
          ))}
        </div>
        {selectedTier
          ? <div style={{ textAlign: 'center', padding: '11px 20px', width: '100%', background: `${TIER_COLORS[selectedTier]}0c`, border: `1px solid ${TIER_COLORS[selectedTier]}35`, borderRadius: '8px', color: TIER_COLORS[selectedTier], fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", marginTop: '8px' }}>
              ✓ {selectedTier} SELECTED — INFERENCE DISPATCHED
            </div>
          : <div style={{ fontSize: '12px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", marginTop: '8px' }}>Click a tier above to simulate routing path</div>
        }
      </div>
    </Card3D>
  );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }
  return (
    <Card3D intensity={4}>
      <div style={{ background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', maxWidth: '640px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '11px', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>{lang}</span>
          <button onClick={copy} style={{ background: 'none', border: 'none', color: copied ? '#4ade80' : '#71717a', fontSize: '11px', cursor: 'pointer', transition: 'color 0.2s', fontFamily: 'inherit' }}>
            {copied ? 'copied ✓' : 'copy'}
          </button>
        </div>
        <pre style={{ padding: '20px', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', lineHeight: '1.72', color: '#a1a1aa', overflowX: 'auto' }}>{code}</pre>
      </div>
    </Card3D>
  );
}

// ─── Live Routing Console ─────────────────────────────────────────────────────
const DEMO_REQ = [
  { prompt: 'Fix this race condition in my Java backend service.', domain: 'Backend', complexity: 'High', routing: [{ tier: 'Small', pass: false }, { tier: 'Medium', pass: false }, { tier: 'Large', pass: true }] },
  { prompt: 'What is the difference between TCP and UDP?', domain: 'General', complexity: 'Low', routing: [{ tier: 'Small', pass: true }] },
  { prompt: 'Implement a LRU cache in Python with O(1) operations.', domain: 'Code', complexity: 'Moderate', routing: [{ tier: 'Small', pass: false }, { tier: 'Medium', pass: true }] },
];

function LivePanel() {
  const [idx, setIdx] = useState(0);
  const demo = DEMO_REQ[idx];
  const selected = demo.routing.find(r => r.pass);
  const mono = { fontFamily: "'JetBrains Mono',monospace" };

  return (
    <Card3D intensity={5}>
      <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', maxWidth: '620px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', ...mono, color: '#52525b', letterSpacing: '0.06em' }}>ADAPTIVEROUTE AUDIT LOG</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {DEMO_REQ.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: '50%', background: idx === i ? '#a1a1aa' : '#3f3f46', border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.2s' }} />
            ))}
          </div>
        </div>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px', color: '#a1a1aa', lineHeight: '1.5' }}>{demo.prompt}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[['DOMAIN', demo.domain], ['COMPLEXITY', demo.complexity]].map(([label, val], i) => (
            <div key={i} style={{ padding: '13px 18px', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ fontSize: '10px', ...mono, color: '#3f3f46', letterSpacing: '0.08em', marginBottom: '5px' }}>{label}</div>
              <div style={{ fontSize: '13px', color: '#71717a' }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '10px', ...mono, color: '#3f3f46', letterSpacing: '0.08em', marginBottom: '10px' }}>ROUTING CASCADES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {demo.routing.map(r => (
              <div key={r.tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', ...mono, color: r.pass ? TIER_COLORS[r.tier.toUpperCase()] : '#52525b' }}>{r.tier}</span>
                <span style={{ fontSize: '12px', color: r.pass ? '#4ade80' : '#ef4444' }}>{r.pass ? '✓ Accepted' : '✕ Escalated'}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', ...mono, color: '#3f3f46', letterSpacing: '0.08em' }}>STATUS</span>
          <span style={{ fontSize: '12px', color: '#4ade80', ...mono }}>Response generated via {selected?.tier}</span>
        </div>
      </div>
    </Card3D>
  );
}

// ─── Sticky Navigation ────────────────────────────────────────────────────────
function Nav({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 36);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      padding: scrolled ? '13px 40px' : '22px 40px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      background: scrolled ? 'rgba(9,9,11,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#818cf8,#a78bfa)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>A</div>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#e4e4e7', letterSpacing: '-0.01em' }}>AdaptiveRoute</span>
      </a>

      <div id="nav-links" style={{ display: 'flex', gap: '26px' }}>
        {['Product', 'Showcase', 'Playground', 'Architecture', 'Docs'].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{ color: '#71717a', fontSize: '14px', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e4e4e7'}
            onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
          >{l}</a>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <a href="https://github.com/Jettysnigdhan/AdaptiveAI-" target="_blank" rel="noreferrer"
          style={{ fontSize: '13px', color: '#71717a', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
          onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
        >GitHub</a>
        <button onClick={onEnterApp} style={{
          background: '#fff', color: '#09090b', border: 'none', borderRadius: '8px',
          padding: '7px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.86'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >Try it</button>
      </div>
    </nav>
  );
}

// ─── Pill Tag ─────────────────────────────────────────────────────────────────
function Tag({ text }) {
  return (
    <span style={{
      fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: '#71717a',
      background: '#1c1c1f', border: '1px solid rgba(255,255,255,0.06)',
      padding: '2px 9px', borderRadius: '4px', display: 'inline-block',
    }}>{text}</span>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────
function SectionHead({ eyebrow, title, sub, center = true }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: '48px' }}>
      <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', letterSpacing: '0.08em', marginBottom: '14px' }}>{eyebrow}</div>
      <h2 style={{ fontSize: '36px', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.12, color: '#e4e4e7', maxWidth: '440px', margin: center ? '0 auto' : '0', marginBottom: sub ? '12px' : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: '14px', color: '#71717a', lineHeight: '1.65', maxWidth: '380px', margin: center ? '0 auto' : '0' }}>{sub}</p>}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Landing({ onEnterApp }) {
  const W = 920; // max content width
  const pad = '0 24px';

  // Hero state
  const [heroTau, setHeroTau] = useState(0.82);
  const [heroWeight, setHeroWeight] = useState(450);
  const [heroAutoEscalate, setHeroAutoEscalate] = useState(true);

  // Hero Parallax Tilt
  const heroRef = useRef(null);
  const [heroTilt, setHeroTilt] = useState({ rx: 0, ry: 0 });

  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroTilt({ rx: -y * 8, ry: x * 10 });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ rx: 0, ry: 0 });
  };

  return (
    <div id="top" style={{ background: '#09090b', minHeight: '100vh', color: '#fff', overflowX: 'hidden', fontFamily: "'Inter',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        @keyframes floatPill1 {
          0%, 100% { transform: perspective(800px) rotateX(-6deg) rotateY(10deg) translateY(0px); }
          50% { transform: perspective(800px) rotateX(-4deg) rotateY(8deg) translateY(-8px); }
        }
        @keyframes floatPill2 {
          0%, 100% { transform: perspective(800px) rotateX(8deg) rotateY(-12deg) translateY(0px); }
          50% { transform: perspective(800px) rotateX(10deg) rotateY(-10deg) translateY(-10px); }
        }
        @keyframes floatPill3 {
          0%, 100% { transform: perspective(800px) rotateX(6deg) rotateY(14deg) translateY(0px); }
          50% { transform: perspective(800px) rotateX(4deg) rotateY(16deg) translateY(-6px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.95); }
        }
        @keyframes ambientGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.12; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.20; }
        }

        .hero-pill-1 { animation: floatPill1 5s ease-in-out infinite; }
        .hero-pill-2 { animation: floatPill2 6s ease-in-out infinite; }
        .hero-pill-3 { animation: floatPill3 5.5s ease-in-out infinite; }

        @media(max-width:768px){
          #nav-links{display:none!important}
          .hero-h1{font-size:42px!important}
          .hero-btns{flex-wrap:wrap;justify-content:center}
          .feat-grid{grid-template-columns:1fr!important}
          .three-col{grid-template-columns:1fr!important}
          .hero-pill{display:none!important}
          nav{padding:14px 20px!important}
        }
        @media(max-width:480px){.hero-h1{font-size:34px!important}}
        @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
      `}</style>

      <Nav onEnterApp={onEnterApp} />

      {/* ── HERO WITH 3D INTERACTIVE CONTROLS ───────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '140px 24px 80px',
          maxWidth: '920px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Ambient breathing orb */}
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          width: '560px',
          height: '360px',
          background: 'radial-gradient(circle, #818cf8 0%, rgba(9,9,11,0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(70px)',
          animation: 'ambientGlow 8s ease-in-out infinite',
          zIndex: 0,
        }} />

        {/* 3D Tilt Wrapper */}
        <div style={{
          position: 'relative',
          width: '100%',
          transform: `perspective(1200px) rotateX(${heroTilt.rx.toFixed(2)}deg) rotateY(${heroTilt.ry.toFixed(2)}deg)`,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
          zIndex: 1,
        }}>
          {/* Status badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(17,17,19,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            color: '#71717a',
            fontFamily: "'JetBrains Mono',monospace",
            marginBottom: '42px',
            letterSpacing: '0.04em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
            adaptive routing engine
          </div>

          {/* Floating DialKit 3D Controls around headline */}
          <HeroFloatingPills
            tau={heroTau}
            setTau={setHeroTau}
            weight={heroWeight}
            setWeight={setHeroWeight}
            autoEscalate={heroAutoEscalate}
            setAutoEscalate={setHeroAutoEscalate}
          />

          <h1 className="hero-h1" style={{ fontSize: '72px', fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.04em', color: '#fff', marginBottom: '24px' }}>
            Let AI Choose<br />the Model.
          </h1>

          <p style={{ fontSize: '16px', color: '#71717a', lineHeight: '1.68', maxWidth: '480px', margin: '0 auto 48px', fontWeight: 400 }}>
            AdaptiveRoute intelligently routes every request to the minimum model capability required — and escalates automatically when the task demands more reasoning.
          </p>

          <div className="hero-btns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button onClick={onEnterApp} style={{ background: '#fff', color: '#09090b', border: 'none', borderRadius: '9px', padding: '12px 24px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.86'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Try AdaptiveRoute
            </button>
            <a href="#showcase" style={{ color: '#71717a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', padding: '12px 24px', fontSize: '14px', fontWeight: 400, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e4e4e7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
              Explore 3D Engine
            </a>
          </div>
        </div>
      </section>

      {/* ── 3D CYLINDRICAL CAROUSEL (DIALKIT SECTION 2) ─────────────────── */}
      <section id="showcase">
        <FadeIn>
          <CylinderCarousel3D />
        </FadeIn>
      </section>

      {/* ── DIALKIT-STYLE INTERACTIVE TUNING PLAYGROUND ───────────────────── */}
      <section id="playground" style={{ padding: pad, paddingBottom: '140px' }}>
        <FadeIn>
          <InteractivePlayground onEnterApp={onEnterApp} />
        </FadeIn>
      </section>

      {/* ── INTERACTIVE ROUTER QUICK DEMO ─────────────────────────────────── */}
      <section id="product" style={{ padding: pad, paddingBottom: '140px', maxWidth: '740px', margin: '0 auto' }}>
        <FadeIn>
          <SectionHead eyebrow="SIMULATION" title="Type a prompt." sub="Watch our feature extraction and tier classifier evaluate complexity in real time." />
          <RoutingDemo />
        </FadeIn>
      </section>

      {/* ── FEATURE ROWS (DIALKIT SPLIT) ─────────────────────────────────── */}
      <section style={{ padding: pad, paddingBottom: '140px', maxWidth: `${W}px`, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              {
                tag: 'routing', title: 'Adaptive routing.', desc: 'Every request is analyzed before a model is selected. Semantic embeddings and 15 continuous task signals feed an ML classifier to predict which tier will produce acceptable quality.',
                right: (
                  <Card3D intensity={6}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', background: '#111114', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {[['SMALL', '#4ade80', true], ['MEDIUM', '#38bdf8', false], ['LARGE', '#f59e0b', false]].map(([t, c, active]) => (
                        <div key={t} style={{ padding: '9px 14px', borderRadius: '8px', background: active ? `${c}12` : 'transparent', border: `1px solid ${active ? c + '38' : 'rgba(255,255,255,0.07)'}`, fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: active ? c : '#52525b' }}>{t}</div>
                      ))}
                    </div>
                  </Card3D>
                ),
              },
              {
                tag: 'quality', title: 'Quality-aware escalation.', desc: 'Responses are evaluated against a configurable quality threshold (τ = 0.82). If a lighter model falls short, the system escalates — Small → Medium → Large — automatically.',
                right: (
                  <Card3D intensity={6}>
                    <div style={{ background: '#0f0f11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '7px', color: '#52525b' }}>
                      {[['Small', 'pass', '0.87'], ['↳ Escalate Medium', 'arrow', null], ['Medium', 'fail', '0.61'], ['↳ Escalate Large', 'arrow', null], ['Large', 'pass', '0.93']].map(([l, s, v], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: s === 'arrow' ? '#27272a' : '#71717a' }}>{l}</span>
                          {v && <span style={{ color: s === 'pass' ? '#4ade80' : '#f87171' }}>{v} {s === 'pass' ? '✓' : '✕'}</span>}
                        </div>
                      ))}
                    </div>
                  </Card3D>
                ),
              },
              {
                tag: 'integration', title: 'One gateway, any client.', desc: 'AdaptiveRoute speaks the OpenAI protocol. Set one base URL and use model "adaptive-auto". Works with Antigravity, Cursor, VS Code Continue, Claude Dev, and any OpenAI-compatible client.',
                right: (
                  <Card3D intensity={6}>
                    <div style={{ background: '#0f0f11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: '#52525b' }}>
                      <div style={{ fontSize: '10px', color: '#3f3f46', letterSpacing: '0.06em', marginBottom: '10px' }}>IDE CONFIG</div>
                      {[['Base URL', 'localhost:8000/v1'], ['Model', 'adaptive-auto'], ['API Key', 'any string']].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>{k}</span><span style={{ color: '#a1a1aa' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </Card3D>
                ),
              },
            ].map((f, i, arr) => (
              <div key={i} className="feat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', padding: '36px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', alignItems: 'center' }}>
                <div>
                  <Tag text={f.tag} /><br />
                  <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#e4e4e7', marginTop: '14px', marginBottom: '10px', letterSpacing: '-0.015em', lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: '#71717a', lineHeight: '1.68' }}>{f.desc}</p>
                </div>
                <div>{f.right}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── ANIMATED DATA PIPELINE ARCHITECTURE ───────────────────────────── */}
      <section id="architecture" style={{ padding: pad, paddingBottom: '140px' }}>
        <FadeIn>
          <SectionHead eyebrow="FLOW" title="Interactive Pipeline" sub="Watch how requests travel through telemetry, classification, and quality cascading." />
          <AnimatedArchPipeline />
        </FadeIn>
      </section>

      {/* ── INTERACTIVE ROUTER TIER SIMULATOR ───────────────────────────────── */}
      <section style={{ padding: pad, paddingBottom: '140px', maxWidth: '680px', margin: '0 auto' }}>
        <FadeIn>
          <SectionHead eyebrow="INTERACTIVE" title="Model Router." sub="Click a tier to simulate how AdaptiveRoute routes to the appropriate model." />
          <RouterViz />
        </FadeIn>
      </section>

      {/* ── DROP-IN GATEWAY CODE / TERMINAL ───────────────────────────────── */}
      <section style={{ padding: pad, paddingBottom: '140px', maxWidth: '720px', margin: '0 auto' }}>
        <FadeIn>
          <SectionHead eyebrow="INTEGRATION" title="Drop-in gateway." sub="No SDK changes. Set one environment variable and all routing happens automatically." />
          <CodeBlock lang="env" code={`# Configure your IDE or AI client
BASE_URL=http://localhost:8000/v1
MODEL=adaptive-auto
API_KEY=any-string          # any value works

# Every response includes telemetry headers:
# X-Adaptive-Model:     grok-2-mini
# X-Adaptive-Tier:      small
# X-Adaptive-Confidence: 0.912
# X-Adaptive-Latency:   142.5
# X-Adaptive-Escalated: false`} />
          <div style={{ height: '24px' }} />
          <CodeBlock lang="python" code={`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="any-string",
)

# AdaptiveRoute handles model selection and auto-cascading automatically
response = client.chat.completions.create(
    model="adaptive-auto",
    messages=[{"role": "user", "content": "..."}]
)

print(response.choices[0].message.content)`} />
        </FadeIn>
      </section>

      {/* ── LIVE AUDIT LOG CONSOLE ────────────────────────────────────────── */}
      <section style={{ padding: pad, paddingBottom: '140px', maxWidth: '680px', margin: '0 auto' }}>
        <FadeIn>
          <SectionHead eyebrow="CONSOLE" title="Request trace." sub="Every request leaves an audit trail. Use the dots to cycle through examples." />
          <LivePanel />
        </FadeIn>
      </section>

      {/* ── PROVIDER ECOSYSTEM ─────────────────────────────────────────────── */}
      <section style={{ padding: pad, paddingBottom: '140px', maxWidth: '680px', margin: '0 auto' }}>
        <FadeIn>
          <SectionHead eyebrow="PROVIDERS" title="Provider-agnostic." sub="Swap the underlying provider without touching your integration. One config variable." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              ['Grok / xAI  (grok-2-mini, grok-2)', 'active'],
              ['Groq LPU  (allam-2-7b, qwen3.8-27b, gpt-oss-120b)', 'active'],
              ['OpenAI  (gpt-4o-mini, gpt-4o)', 'adapter available'],
              ['Anthropic  (claude-3-5-haiku, claude-3-5-sonnet)', 'adapter available'],
              ['Local / Ollama  (offline, zero-egress)', 'adapter available'],
            ].map(([name, status]) => (
              <div key={name} style={{ padding: '14px 18px', background: '#111113', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{name}</span>
                <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: status === 'active' ? '#4ade80' : '#52525b', background: status === 'active' ? 'rgba(74,222,128,0.08)' : 'transparent', border: `1px solid ${status === 'active' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`, padding: '2px 8px', borderRadius: '4px' }}>{status}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── BENCHMARK RUNNER ──────────────────────────────────────────────── */}
      <section id="docs" style={{ padding: pad, paddingBottom: '140px', maxWidth: '680px', margin: '0 auto' }}>
        <FadeIn>
          <Card3D intensity={4}>
            <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '36px' }}>
              <SectionHead eyebrow="BENCHMARK RESULTS" title="Measured. Not claimed." sub="Run the experiment to populate real results from your environment. No fabricated numbers." />
              <div className="bench-policies" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '28px' }}>
                {['Always Small', 'Always Medium', 'Always Large', 'Rule-Based', 'Adaptive ML'].map((label, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '13px 8px', background: i === 4 ? 'rgba(129,140,248,0.07)' : '#0f0f11', border: `1px solid ${i === 4 ? 'rgba(129,140,248,0.22)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '9px' }}>
                    <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: i === 4 ? '#818cf8' : '#52525b', letterSpacing: '0.04em', marginBottom: '6px' }}>{i === 4 ? '★ ' : ''}{label.split(' ').pop().toUpperCase()}</div>
                    <div style={{ fontSize: '13px', color: '#3f3f46', fontFamily: "'JetBrains Mono',monospace" }}>—</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button onClick={onEnterApp} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', color: '#a1a1aa', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#a1a1aa'; }}>
                  Run benchmark experiment →
                </button>
              </div>
            </div>
          </Card3D>
        </FadeIn>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: pad, paddingBottom: '140px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <FadeIn>
          <h2 style={{ fontSize: '52px', fontWeight: 500, letterSpacing: '-0.033em', lineHeight: 1.08, color: '#e4e4e7', marginBottom: '20px' }}>Route smarter.</h2>
          <p style={{ fontSize: '15px', color: '#71717a', lineHeight: '1.65', maxWidth: '340px', margin: '0 auto 38px' }}>Stop overspending on large models for simple tasks. Let AdaptiveRoute decide automatically.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={onEnterApp} style={{ background: '#fff', color: '#09090b', border: 'none', borderRadius: '9px', padding: '12px 24px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.86'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Try AdaptiveRoute
            </button>
            <a href="https://github.com/Jettysnigdhan/AdaptiveAI-" target="_blank" rel="noreferrer" style={{ color: '#71717a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', padding: '12px 24px', fontSize: '14px', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e4e4e7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
              View source
            </a>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '26px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 18, height: 18, background: 'linear-gradient(135deg,#818cf8,#a78bfa)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>A</div>
          <span style={{ fontSize: '13px', color: '#52525b' }}>AdaptiveRoute</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['GitHub', 'https://github.com/Jettysnigdhan/AdaptiveAI-'], ['Docs', '#docs']].map(([l, h]) => (
            <a key={l} href={h} target={h.startsWith('http') ? '_blank' : undefined} rel={h.startsWith('http') ? 'noreferrer' : undefined}
              style={{ fontSize: '13px', color: '#52525b', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'} onMouseLeave={e => e.currentTarget.style.color = '#52525b'}>
              {l}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
