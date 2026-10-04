"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox, 
  Search, 
  Database, 
  Cpu, 
  Sliders, 
  CheckCircle, 
  Send, 
  MessageSquare,
  Play,
  RotateCcw,
  ChevronRight,
  Code2
} from "lucide-react";

export function RoutingPipeline() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    {
      num: "01",
      title: "REQUEST",
      icon: Inbox,
      desc: "Incoming developer prompt received via standard /v1/chat/completions endpoint.",
      tag: "REST / Edge",
      telemetry: {
        latency: "0.4ms",
        action: "Parsed HTTP Authorization & JSON body",
        rawCode: `req.headers["Authorization"] -> validated\nprompt_tokens = tokenizer.count(req.messages)`,
      },
    },
    {
      num: "02",
      title: "CLASSIFY",
      icon: Search,
      desc: "Extract syntactic complexity, token volume, domain intent, and algorithmic cues.",
      tag: "Feature Extraction",
      telemetry: {
        latency: "0.8ms",
        action: "Extracted keywords: [consensus, paxos, raft, distributed]",
        rawCode: `intent = classifier.predict(prompt)\nheuristics = { code: 0.15, math: 0.20, reasoning: 0.84 }`,
      },
    },
    {
      num: "03",
      title: "CHECK CACHE",
      icon: Database,
      desc: "Search semantically similar previous requests in vector store before invoking a model.",
      tag: "Cosine > 0.90",
      telemetry: {
        latency: "1.2ms",
        action: "HNSW index queried across 48,000 cached vectors",
        rawCode: `sim = cosine_similarity(query_emb, index)\nif sim > 0.90: return cached_response() # 14ms instant`,
      },
    },
    {
      num: "04",
      title: "ANALYZE COMPLEXITY",
      icon: Cpu,
      desc: "Compute multi-dimensional scores for reasoning, context length, and mathematical depth.",
      tag: "ML Classifier",
      telemetry: {
        latency: "1.0ms",
        action: "Calculated complexity score: 68/100 (Medium tier boundary)",
        rawCode: `score = 0.40 * reasoning + 0.35 * context + 0.25 * math\ncomplexity_tier = "balanced"`,
      },
    },
    {
      num: "05",
      title: "SCORE MODELS",
      icon: Sliders,
      desc: "Evaluate models using quality benchmarks, real-time latency, dollar cost, and provider health.",
      tag: "Utility Function",
      telemetry: {
        latency: "0.6ms",
        action: "Utility scored: Fast (0.81), Balanced (0.94), Powerful (0.76)",
        rawCode: `utility = (quality * 0.5) - (cost * 0.3) - (latency * 0.2)\nbalanced_model = max(utility_scores)`,
      },
    },
    {
      num: "06",
      title: "SELECT MODEL",
      icon: CheckCircle,
      desc: "Choose optimal tier (Fast, Balanced, Powerful) that satisfies task SLA at lowest cost.",
      tag: "Dynamic Routing",
      telemetry: {
        latency: "0.2ms",
        action: "Selected: Claude 3.5 Haiku ($0.0040 vs $0.0180 Sonnet)",
        rawCode: `route_target = "claude-3-5-haiku-20241022"\nfallback = "gpt-4o-mini"`,
      },
    },
    {
      num: "07",
      title: "EXECUTE",
      icon: Send,
      desc: "Invoke provider endpoint via low-latency connection with automatic retry & fallback.",
      tag: "Streaming Gateway",
      telemetry: {
        latency: "338ms",
        action: "Tokens streamed: 480 tokens at 112 tok/sec",
        rawCode: `stream = provider.chat_stream(messages)\nfor chunk in stream: yield chunk`,
      },
    },
    {
      num: "08",
      title: "RESPOND",
      icon: MessageSquare,
      desc: "Stream response to client with telemetry headers: model, latency, cost, and routing reason.",
      tag: "Audit Telemetry",
      telemetry: {
        latency: "0.3ms",
        action: "Appended x-adaptiveroute-* telemetry headers to response",
        rawCode: `response.headers["x-adaptiveroute-model"] = "balanced"\nresponse.headers["x-adaptiveroute-savings"] = "77.8%"`,
      },
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const current = steps[activeStep];

  return (
    <section className="py-20 border-t border-zinc-800/80 bg-zinc-950/70 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
              INTERNAL DECISION PIPELINE
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              How AdaptiveRoute Thinks
            </h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
              Click any stage below to inspect its internal logic, millisecond latency overhead, and decision rule.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <Play className={`h-3 w-3 ${isPlaying ? "text-[#00f0ff]" : "text-zinc-500"}`} />
              <span>{isPlaying ? "Pause Cycling" : "Auto-cycle Steps"}</span>
            </button>
            <button
              onClick={() => setActiveStep(0)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              title="Reset to Step 1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 8-Stage Sequential Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
          {steps.map((step, idx) => {
            const isCurrent = activeStep === idx;
            const isPast = activeStep > idx;

            return (
              <div
                key={step.num}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(idx);
                }}
                className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer relative ${
                  isCurrent
                    ? "border-[#00f0ff] bg-zinc-900/90 shadow-[0_0_15px_-3px_rgba(0,240,255,0.3)] ring-1 ring-[#00f0ff]"
                    : isPast
                    ? "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                    : "border-zinc-800/60 bg-zinc-950/40 opacity-50 hover:opacity-90"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                  <span className={isCurrent ? "text-[#00f0ff] font-bold" : "text-zinc-500"}>
                    {step.num}
                  </span>
                  <span className="text-zinc-500 text-[9px]">{step.telemetry.latency}</span>
                </div>
                <h3 className="text-[11px] font-mono font-bold text-zinc-100 uppercase truncate">
                  {step.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* Active Stage Inspector Box */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0d1017] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-extrabold text-[#00f0ff]">{current.num}</span>
              <div>
                <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Stage {current.num}: {current.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">{current.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                Overhead: <strong className="text-emerald-400">{current.telemetry.latency}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                {current.tag}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                Operation Action Telemetry:
              </span>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-zinc-200">
                {current.telemetry.action}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1))}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
                >
                  ← Previous Stage
                </button>
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                  className="px-3 py-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#38bdf8] text-zinc-950 text-xs font-mono font-bold transition-colors flex items-center gap-1"
                >
                  <span>Next Stage</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>GATEWAY INTERNAL LOGIC (PSEUDOCODE)</span>
                <Code2 className="h-3.5 w-3.5 text-[#00f0ff]" />
              </div>
              <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-[#00f0ff] overflow-x-auto leading-relaxed">
                <code>{current.telemetry.rawCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
