"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2,
  Sliders,
  Check
} from "lucide-react";
import { simulateAdaptiveRouting } from "@/lib/mockData";

type RoutingStep = "idle" | "analyzing" | "cache_check" | "scoring" | "selecting" | "complete";

export function MiniPlayground() {
  const [prompt, setPrompt] = useState("Design a REST API for an e-commerce platform.");
  const [routingStep, setRoutingStep] = useState<RoutingStep>("idle");
  const [decision, setDecision] = useState(() => simulateAdaptiveRouting(prompt));

  const handleRoute = (customText?: string) => {
    const textToRoute = customText !== undefined ? customText : prompt;
    if (!textToRoute.trim()) return;

    // Step 1: ANALYZING
    setRoutingStep("analyzing");

    // Step 2: CACHE CHECK
    setTimeout(() => {
      setRoutingStep("cache_check");
    }, 300);

    // Step 3: SCORING
    setTimeout(() => {
      setRoutingStep("scoring");
    }, 600);

    // Step 4: SELECTING
    setTimeout(() => {
      setRoutingStep("selecting");
    }, 900);

    // Step 5: COMPLETE
    setTimeout(() => {
      const result = simulateAdaptiveRouting(textToRoute);
      setDecision(result);
      setRoutingStep("complete");
    }, 1200);
  };

  const presets = [
    "Design a REST API for an e-commerce platform.",
    "Explain distributed systems consensus algorithms and Paxos vs Raft",
    "What is TCP protocol 3-way handshake?",
    "Prove convergence of gradient descent under Lipschitz conditions",
    "Summarize this 100-word paragraph on GraphQL federation",
  ];

  const isRouting = routingStep !== "idle" && routingStep !== "complete";

  return (
    <section id="playground" className="py-24 border-t border-zinc-800/80 bg-zinc-950 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-mono mb-3">
            <Terminal className="h-3.5 w-3.5" />
            <span>INTERACTIVE ROUTING SANDBOX</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Experience the Decision Engine
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Type any request or click a preset below. Watch the step-by-step heuristic pipeline classify, check cache, score candidate models, and select the optimal route in real time.
          </p>
        </div>

        {/* Step-by-Step Progress Pipeline Bar */}
        <div className="max-w-4xl mx-auto mb-8 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px]">
            <div
              className={`p-2 rounded-xl border transition-all ${
                routingStep === "analyzing"
                  ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-bold shadow"
                  : routingStep !== "idle"
                  ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                  : "border-zinc-800 text-zinc-500"
              }`}
            >
              1. ANALYZING
            </div>
            <div
              className={`p-2 rounded-xl border transition-all ${
                routingStep === "cache_check"
                  ? "border-emerald-400 bg-emerald-950/40 text-emerald-400 font-bold shadow"
                  : routingStep === "scoring" || routingStep === "selecting" || routingStep === "complete"
                  ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                  : "border-zinc-800 text-zinc-500"
              }`}
            >
              2. CACHE CHECK
            </div>
            <div
              className={`p-2 rounded-xl border transition-all ${
                routingStep === "scoring"
                  ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-bold shadow"
                  : routingStep === "selecting" || routingStep === "complete"
                  ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                  : "border-zinc-800 text-zinc-500"
              }`}
            >
              3. SCORING
            </div>
            <div
              className={`p-2 rounded-xl border transition-all ${
                routingStep === "selecting"
                  ? "border-purple-400 bg-purple-950/40 text-purple-400 font-bold shadow"
                  : routingStep === "complete"
                  ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                  : "border-zinc-800 text-zinc-500"
              }`}
            >
              4. SELECTING
            </div>
            <div
              className={`p-2 rounded-xl border transition-all col-span-2 sm:col-span-1 ${
                routingStep === "complete"
                  ? "border-emerald-400 bg-emerald-950/40 text-emerald-400 font-bold shadow"
                  : "border-zinc-800 text-zinc-500"
              }`}
            >
              5. COMPLETE ✓
            </div>
          </div>
        </div>

        {/* Playground Split Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Input Box */}
          <div className="lg:col-span-6 rounded-3xl border border-zinc-800 bg-[#0d1017] p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <Terminal className="h-4 w-4 text-[#00f0ff]" />
                  <span>Request Input</span>
                </span>
                <span className="text-zinc-500">{prompt.length} chars</span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Ask AdaptiveRoute anything..."
                className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-950 p-4 font-mono text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all resize-none shadow-inner"
              />

              {/* Quick Preset Chips */}
              <div className="mt-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                  Sample Requests:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(preset);
                        handleRoute(preset);
                      }}
                      className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors text-left truncate max-w-full"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">
                Engine: <span className="text-zinc-200">OpenAI compatible gateway</span>
              </span>
              <button
                onClick={() => handleRoute()}
                disabled={isRouting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-zinc-950 px-6 py-3 text-xs font-mono font-bold tracking-wide transition-all shadow-[0_0_20px_-3px_rgba(0,240,255,0.4)] disabled:opacity-60 cursor-pointer"
              >
                {isRouting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="uppercase">Routing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>ROUTE REQUEST</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Routing Decision Card */}
          <div className="lg:col-span-6 rounded-3xl border border-zinc-800 bg-[#0c0e14] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {decision.cacheHit && (
              <div className="absolute top-0 left-0 right-0 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 px-4 py-1.5 text-xs font-mono flex items-center gap-2">
                <Database className="h-3.5 w-3.5" />
                <span>Instant Vector Cache Match (&gt;95% Similarity)</span>
              </div>
            )}

            <div className={`flex items-center justify-between pb-4 border-b border-zinc-800 ${decision.cacheHit ? "pt-5" : ""}`}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  ROUTING DECISION
                </span>
                <h3 className="text-lg font-bold text-zinc-100 font-mono mt-0.5">
                  Optimal Model Selected
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#00f0ff] font-bold">
                Confidence: {decision.confidence}%
              </span>
            </div>

            {/* Score Bars */}
            <div className="py-5 space-y-3.5 font-mono text-xs border-b border-zinc-800/80">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Complexity</span>
                  <span className="text-zinc-200 font-bold">{decision.complexityScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#00f0ff] h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.complexityScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Reasoning</span>
                  <span className="text-zinc-200 font-bold">{decision.reasoningScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.reasoningScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Context</span>
                  <span className="text-zinc-200 font-bold">{decision.contextScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${decision.contextScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Cost Sensitivity</span>
                  <span className="text-zinc-200 font-bold">{decision.costSensitivity}%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
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
                  Selected Model:
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    decision.selectedTier === "powerful"
                      ? "bg-purple-950 text-purple-300 border border-purple-800"
                      : decision.selectedTier === "balanced"
                      ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {decision.selectedTier.toUpperCase()} MODEL
                </span>
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {decision.modelName}
              </p>
              <p className="text-xs text-zinc-400 mt-1.5 italic">
                &ldquo;{decision.reason}&rdquo;
              </p>
            </div>

            {/* Bottom Metrics: Cost, Latency, Confidence */}
            <div className="pt-4 grid grid-cols-3 gap-2.5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 uppercase block">Estimated Cost</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  ${decision.cost.toFixed(4)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 uppercase block">Estimated Latency</span>
                <span className="text-sm font-extrabold text-[#00f0ff]">
                  {decision.latencyMs}ms
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 uppercase block">Confidence</span>
                <span className="text-sm font-extrabold text-zinc-200">
                  {decision.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
