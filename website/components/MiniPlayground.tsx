"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Terminal, 
  Sparkles, 
  Send, 
  Cpu, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Loader2
} from "lucide-react";
import { simulateAdaptiveRouting } from "@/lib/mockData";

export function MiniPlayground() {
  const [prompt, setPrompt] = useState("Design a REST API for an e-commerce application");
  const [isRouting, setIsRouting] = useState(false);
  const [decision, setDecision] = useState(() => simulateAdaptiveRouting(prompt));

  const handleRoute = (customText?: string) => {
    const textToRoute = customText !== undefined ? customText : prompt;
    if (!textToRoute.trim()) return;

    setIsRouting(true);
    setTimeout(() => {
      const result = simulateAdaptiveRouting(textToRoute);
      setDecision(result);
      setIsRouting(false);
    }, 500);
  };

  const presets = [
    "Design a REST API for an e-commerce application",
    "Explain distributed consensus with Raft vs Paxos",
    "What is TCP protocol 3-way handshake?",
    "Prove convergence of gradient descent under Lipschitz conditions",
    "Summarize this 100-word paragraph on GraphQL",
  ];

  return (
    <section id="playground" className="py-20 border-t border-zinc-800/80 bg-zinc-950 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
            INTERACTIVE DEMO
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Test the Router Yourself
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Type any prompt or select a sample below to see the dynamic heuristic scoring, model tier
            selection, and resource calculation in real-time.
          </p>
        </div>

        {/* Playground Split Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Input Box */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#00f0ff]" />
                  <span>Interactive Prompt Input</span>
                </span>
                <span className="text-zinc-400">{prompt.length} chars</span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Ask AdaptiveRoute anything..."
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 p-4 font-mono text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all resize-none"
              />

              {/* Quick Preset Chips */}
              <div className="mt-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Try Sample Workloads:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(preset);
                        handleRoute(preset);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors text-left truncate max-w-full"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">
                Model gateway: <span className="text-zinc-300">OpenAI compatible</span>
              </span>
              <button
                onClick={() => handleRoute()}
                disabled={isRouting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-zinc-950 px-5 py-2.5 text-xs font-mono font-bold tracking-wide transition-all shadow-[0_0_20px_-3px_rgba(0,240,255,0.4)] disabled:opacity-60"
              >
                {isRouting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scoring Route...</span>
                  </>
                ) : (
                  <>
                    <span>Route Request</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Routing Decision Card */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-[#0c0e14] p-6 shadow-2xl relative overflow-hidden">
            {decision.cacheHit && (
              <div className="absolute top-0 left-0 right-0 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 px-4 py-1 text-xs font-mono flex items-center gap-2">
                <Database className="h-3.5 w-3.5" />
                <span>Instant Vector Cache Match (&gt;95% Similarity)</span>
              </div>
            )}

            <div className={`flex items-center justify-between pb-4 border-b border-zinc-800 ${decision.cacheHit ? "pt-5" : ""}`}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Routing Decision Engine
                </span>
                <h3 className="text-base font-bold text-zinc-100 mt-0.5">
                  Adaptive Allocation Output
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[#00f0ff]">
                Confidence: {decision.confidence}%
              </span>
            </div>

            {/* Score Bars */}
            <div className="py-4 space-y-3 font-mono text-xs border-b border-zinc-800/80">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Task Complexity</span>
                  <span className="text-zinc-200">{decision.complexityScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#00f0ff] h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.complexityScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Reasoning Requirement</span>
                  <span className="text-zinc-200">{decision.reasoningScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.reasoningScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Context Scope</span>
                  <span className="text-zinc-200">{decision.contextScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.contextScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Cost Sensitivity</span>
                  <span className="text-zinc-200">{decision.costSensitivity}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.costSensitivity}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Selected Model & Rationale */}
            <div className="py-4 border-b border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Selected Model Tier:
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    decision.selectedTier === "powerful"
                      ? "bg-purple-950 text-purple-300 border border-purple-800"
                      : decision.selectedTier === "balanced"
                      ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {decision.selectedTier}
                </span>
              </div>
              <p className="text-sm font-mono font-semibold text-zinc-100">
                {decision.modelName}
              </p>
              <p className="text-xs text-zinc-400 mt-1.5 italic">
                &ldquo;{decision.reason}&rdquo;
              </p>
            </div>

            {/* Bottom Metrics: Cost, Latency, Confidence */}
            <div className="pt-4 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 uppercase block">Est. Cost</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400">
                  ${decision.cost.toFixed(4)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 uppercase block">Est. Latency</span>
                <span className="text-xs sm:text-sm font-bold text-[#00f0ff]">
                  {decision.latencyMs}ms
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 uppercase block">Tokens</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-200">
                  {decision.tokens.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
