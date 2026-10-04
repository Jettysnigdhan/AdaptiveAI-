"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Cpu, 
  Layers, 
  ArrowRight,
  Database,
  Search,
  Sliders,
  DollarSign,
  Clock,
  Gauge
} from "lucide-react";

interface SamplePrompt {
  id: string;
  label: string;
  prompt: string;
  selectedTier: "fast" | "balanced" | "powerful";
  modelName: string;
  reason: string;
  cost: string;
  latency: string;
  confidence: string;
  cacheStatus: "HIT" | "MISS";
}

const SAMPLES: SamplePrompt[] = [
  {
    id: "balanced-demo",
    label: "Distributed Systems",
    prompt: "Explain distributed systems consensus algorithms and Paxos vs Raft",
    selectedTier: "balanced",
    modelName: "BALANCED MODEL (Claude 3.5 Haiku)",
    reason: "Good reasoning requirement with moderate complexity. A large model is unnecessary.",
    cost: "$0.004",
    latency: "342ms",
    confidence: "91%",
    cacheStatus: "MISS",
  },
  {
    id: "fast-demo",
    label: "Regex Formatter",
    prompt: "Format this timestamp string to ISO-8601 in Python",
    selectedTier: "fast",
    modelName: "FAST MODEL (Llama 3.1 8B)",
    reason: "Direct syntactic transformation. Fast 8B tier gives sub-120ms execution at 1/20th the cost.",
    cost: "$0.0008",
    latency: "118ms",
    confidence: "96%",
    cacheStatus: "MISS",
  },
  {
    id: "powerful-demo",
    label: "Formal Proof",
    prompt: "Prove convergence bounds of Adam optimizer on non-convex manifolds with momentum",
    selectedTier: "powerful",
    modelName: "POWERFUL MODEL (Claude 3.7 Sonnet)",
    reason: "Deep mathematical rigor and complex reasoning. Heavy parameters required for accuracy.",
    cost: "$0.018",
    latency: "840ms",
    confidence: "99%",
    cacheStatus: "MISS",
  },
];

export function LiveRoutingFlow() {
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [stage, setStage] = useState<"analyzing" | "cache" | "scoring" | "selected">("selected");
  const [isCycling, setIsCycling] = useState(true);

  const current = SAMPLES[activeSampleIndex];

  // Auto-cycle through samples if cycling is true
  useEffect(() => {
    if (!isCycling) return;
    const interval = setInterval(() => {
      triggerRouting((activeSampleIndex + 1) % SAMPLES.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [activeSampleIndex, isCycling]);

  const triggerRouting = (index: number) => {
    setActiveSampleIndex(index);
    setStage("analyzing");

    setTimeout(() => {
      setStage("cache");
    }, 600);

    setTimeout(() => {
      setStage("scoring");
    }, 1200);

    setTimeout(() => {
      setStage("selected");
    }, 1800);
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-[#0d1017]/90 p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#00f0ff]/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header controls & sample triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00f0ff] animate-pulse"></span>
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
              Live Router Visualization
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-200 mt-0.5">
            Real-Time Request Orchestration Flow
          </p>
        </div>

        {/* Prompt selector buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs">
          {SAMPLES.map((sample, idx) => (
            <button
              key={sample.id}
              onClick={() => {
                setIsCycling(false);
                triggerRouting(idx);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeSampleIndex === idx
                  ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* STAGE 1: Incoming User Request */}
      <div className="py-6 flex flex-col items-center">
        <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
              USER REQUEST
            </span>
            <span className="text-zinc-400 font-mono">POST /v1/chat/completions</span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-zinc-100 font-medium truncate">
            &ldquo;{current.prompt}&rdquo;
          </p>
        </div>

        {/* Animated Connector 1 */}
        <div className="relative flex flex-col items-center my-3 h-8 justify-center">
          <div className="w-0.5 h-full bg-zinc-700"></div>
          <motion.div
            animate={{ y: [-14, 14], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]"
          />
        </div>

        {/* STAGE 2: AdaptiveRoute Router Engine */}
        <div className="w-full max-w-lg rounded-xl border border-[#00f0ff]/30 bg-zinc-900/90 p-4 shadow-[0_0_20px_-5px_rgba(0,240,255,0.2)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs">
                ◈
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-100 tracking-wide">
                ADAPTIVEROUTE ROUTER CORE
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-[#00f0ff] border border-zinc-700">
              latency: 4.8ms
            </span>
          </div>

          {/* Router Pipeline Step Progress */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
            <div
              className={`p-2 rounded border transition-all ${
                stage === "analyzing"
                  ? "border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold"
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
              }`}
            >
              1. Classify
            </div>
            <div
              className={`p-2 rounded border transition-all ${
                stage === "cache"
                  ? "border-emerald-400 bg-emerald-950/30 text-emerald-400 font-bold"
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
              }`}
            >
              2. Check Cache
            </div>
            <div
              className={`p-2 rounded border transition-all ${
                stage === "scoring"
                  ? "border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold"
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
              }`}
            >
              3. Complexity
            </div>
            <div
              className={`p-2 rounded border transition-all ${
                stage === "selected"
                  ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-bold"
                  : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
              }`}
            >
              4. Score Route
            </div>
          </div>
        </div>

        {/* Animated Connector 2 (Branching out to 3 models) */}
        <div className="relative flex flex-col items-center my-3 h-8 justify-center">
          <div className="w-0.5 h-full bg-zinc-700"></div>
          <motion.div
            animate={{ y: [-14, 14], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, ease: "linear" }}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]"
          />
        </div>

        {/* STAGE 3: Three Model Tiers */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-3xl">
          {/* FAST MODEL */}
          <div
            className={`rounded-xl p-4 border transition-all duration-300 relative ${
              current.selectedTier === "fast" && stage === "selected"
                ? "border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_25px_-5px_rgba(0,240,255,0.3)] ring-1 ring-[#00f0ff]"
                : "border-zinc-800/80 bg-zinc-900/40 opacity-45 hover:opacity-75"
            }`}
          >
            {current.selectedTier === "fast" && stage === "selected" && (
              <span className="absolute -top-2.5 right-3 bg-[#00f0ff] text-zinc-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ SELECTED
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                Fast Model
              </span>
              <span className="text-[10px] font-mono text-zinc-400">120ms</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">Llama 3.1 8B Instant</p>
            <div className="space-y-1 font-mono text-[10px] text-zinc-400">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="text-zinc-200">$0.08 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span className="text-emerald-400">98%</span>
              </div>
            </div>
          </div>

          {/* BALANCED MODEL */}
          <div
            className={`rounded-xl p-4 border transition-all duration-300 relative ${
              current.selectedTier === "balanced" && stage === "selected"
                ? "border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_25px_-5px_rgba(0,240,255,0.3)] ring-1 ring-[#00f0ff]"
                : "border-zinc-800/80 bg-zinc-900/40 opacity-45 hover:opacity-75"
            }`}
          >
            {current.selectedTier === "balanced" && stage === "selected" && (
              <span className="absolute -top-2.5 right-3 bg-[#00f0ff] text-zinc-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ SELECTED
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                Balanced Model
              </span>
              <span className="text-[10px] font-mono text-zinc-400">340ms</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">Claude 3.5 Haiku / GPT-4o-mini</p>
            <div className="space-y-1 font-mono text-[10px] text-zinc-400">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="text-zinc-200">$0.42 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span>Reasoning:</span>
                <span className="text-[#00f0ff]">Strong (96%)</span>
              </div>
            </div>
          </div>

          {/* POWERFUL MODEL */}
          <div
            className={`rounded-xl p-4 border transition-all duration-300 relative ${
              current.selectedTier === "powerful" && stage === "selected"
                ? "border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_25px_-5px_rgba(0,240,255,0.3)] ring-1 ring-[#00f0ff]"
                : "border-zinc-800/80 bg-zinc-900/40 opacity-45 hover:opacity-75"
            }`}
          >
            {current.selectedTier === "powerful" && stage === "selected" && (
              <span className="absolute -top-2.5 right-3 bg-[#00f0ff] text-zinc-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ SELECTED
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                Powerful Model
              </span>
              <span className="text-[10px] font-mono text-zinc-400">820ms</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">Claude 3.7 Sonnet / GPT-4o</p>
            <div className="space-y-1 font-mono text-[10px] text-zinc-400">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="text-zinc-200">$2.10 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span>Reasoning:</span>
                <span className="text-violet-400">Advanced (99%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Connector 3 */}
        <div className="relative flex flex-col items-center my-3 h-8 justify-center">
          <div className="w-0.5 h-full bg-zinc-700"></div>
          <motion.div
            animate={{ y: [-14, 14], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.6, repeat: Infinity, ease: "linear" }}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]"
          />
        </div>

        {/* STAGE 4: Selected Model Telemetry Banner */}
        <div className="w-full max-w-xl rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-semibold text-zinc-100 uppercase tracking-wide">
                {current.selectedTier.toUpperCase()} MODEL SELECTED
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Confidence: <strong className="text-[#00f0ff]">{current.confidence}</strong>
            </span>
          </div>

          <p className="text-xs text-zinc-300 mb-3">
            <span className="text-zinc-400 font-mono text-[11px]">Reason: </span>
            {current.reason}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center font-mono">
            <div className="p-1.5 rounded bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase">Cost</span>
              <span className="text-xs font-semibold text-emerald-400">{current.cost}</span>
            </div>
            <div className="p-1.5 rounded bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase">Latency</span>
              <span className="text-xs font-semibold text-[#00f0ff]">{current.latency}</span>
            </div>
            <div className="p-1.5 rounded bg-zinc-950/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase">Confidence</span>
              <span className="text-xs font-semibold text-zinc-200">{current.confidence}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
