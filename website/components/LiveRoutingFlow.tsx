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
  Gauge,
  Send,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { simulateAdaptiveRouting } from "@/lib/mockData";

export function LiveRoutingFlow() {
  const [prompt, setPrompt] = useState("Explain distributed systems consensus algorithms and Paxos vs Raft");
  const [prioritySlider, setPrioritySlider] = useState<number>(50); // 0 = Pure Speed/Cost, 50 = Balanced, 100 = Max Quality
  const [isRouting, setIsRouting] = useState(false);
  const [stage, setStage] = useState<"analyzing" | "cache" | "scoring" | "selected">("selected");
  const [activeTier, setActiveTier] = useState<"fast" | "balanced" | "powerful">("balanced");
  
  // Quick preset triggers
  const presets = [
    { label: "Distributed Systems", text: "Explain distributed systems consensus algorithms and Paxos vs Raft" },
    { label: "Format Timestamp", text: "Format this timestamp string to ISO-8601 in Python with datetime" },
    { label: "Mathematical Proof", text: "Prove convergence bounds of Adam optimizer on non-convex manifolds with momentum" },
    { label: "What is TCP?", text: "What is TCP protocol 3-way handshake?" },
  ];

  // Routing evaluation function
  const evaluateRoute = (text: string, sliderVal: number) => {
    setIsRouting(true);
    setStage("analyzing");

    setTimeout(() => {
      setStage("cache");
    }, 350);

    setTimeout(() => {
      setStage("scoring");
    }, 700);

    setTimeout(() => {
      const res = simulateAdaptiveRouting(text);
      let tier: "fast" | "balanced" | "powerful" = res.selectedTier;

      // Adjust based on user's manual slider override
      if (sliderVal <= 25 && !res.cacheHit) {
        tier = "fast";
      } else if (sliderVal >= 75) {
        tier = "powerful";
      }

      setActiveTier(tier);
      setStage("selected");
      setIsRouting(false);
    }, 1100);
  };

  // Trigger evaluation when slider changes
  const handleSliderChange = (newVal: number) => {
    setPrioritySlider(newVal);
    evaluateRoute(prompt, newVal);
  };

  // Quick preset click
  const selectPreset = (text: string) => {
    setPrompt(text);
    evaluateRoute(text, prioritySlider);
  };

  // Compute live readout stats
  const isCache = prompt.toLowerCase().includes("tcp");
  const currentCost = isCache ? "$0.0001" : activeTier === "fast" ? "$0.0008" : activeTier === "balanced" ? "$0.0040" : "$0.0185";
  const currentLatency = isCache ? "14ms" : activeTier === "fast" ? "118ms" : activeTier === "balanced" ? "342ms" : "840ms";
  const currentConfidence = isCache ? "98%" : activeTier === "fast" ? "96%" : activeTier === "balanced" ? "92%" : "99%";
  const currentReason = isCache
    ? "Instant semantic match (>97% similarity). Zero model compute required."
    : activeTier === "fast"
    ? "Low complexity syntactic task. Fast 8B tier gives sub-120ms execution at 1/20th the cost."
    : activeTier === "balanced"
    ? "Good reasoning requirement with moderate complexity. A large model is unnecessary."
    : "Deep algorithmic rigor and complex reasoning. Heavy parameters required for accuracy.";

  return (
    <div className="w-full rounded-3xl border border-zinc-800 bg-[#0c0e14]/95 p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00f0ff]/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 right-10 w-72 h-72 bg-emerald-500/10 blur-[90px] pointer-events-none rounded-full" />

      {/* Top Header & Strategy Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00f0ff]"></span>
            </span>
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 font-semibold">
              Live Interactive Router
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/90 text-[#00f0ff] border border-zinc-700/60">
              Interactive Simulation
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-zinc-100 mt-1">
            Real-Time Request Orchestration & Particle Routing
          </p>
        </div>

        {/* Interactive Strategy Slider */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#00f0ff]" />
            <span>Priority Bias:</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-48">
            <span className="text-[10px] text-zinc-400">Speed</span>
            <input
              type="range"
              min="0"
              max="100"
              step="25"
              value={prioritySlider}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
            <span className="text-[10px] text-purple-400">Quality</span>
          </div>

          <span className="text-[11px] font-bold text-[#00f0ff] px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
            {prioritySlider === 0 ? "Fast" : prioritySlider === 50 ? "Balanced" : prioritySlider === 100 ? "Frontier" : "Adaptive"}
          </span>
        </div>
      </div>

      {/* STAGE 1: Interactive Prompt Input Box */}
      <div className="py-6 flex flex-col items-center">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-4 shadow-lg relative group">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
            <span className="flex items-center gap-2 text-zinc-300 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              INCOMING USER REQUEST (Type or select a sample)
            </span>
            <span className="text-zinc-400">POST /v1/chat/completions</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") evaluateRoute(prompt, prioritySlider);
              }}
              placeholder="Type any AI prompt here to test routing..."
              className="w-full rounded-xl bg-zinc-950/90 border border-zinc-700 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
            />
            <button
              onClick={() => evaluateRoute(prompt, prioritySlider)}
              disabled={isRouting}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_-2px_rgba(0,240,255,0.4)] disabled:opacity-60 cursor-pointer"
            >
              {isRouting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Route</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Quick Test:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => selectPreset(p.text)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  prompt === p.text
                    ? "bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/40 font-semibold"
                    : "bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Animated Connector 1: Flowing Stream from Request to Router Core */}
        <div className="relative flex flex-col items-center my-3 h-10 justify-center">
          <div className="w-0.5 h-full bg-zinc-700/80"></div>
          <motion.div
            animate={{ y: [-18, 18], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            className="absolute h-3 w-3 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff]"
          />
        </div>

        {/* STAGE 2: AdaptiveRoute Router Engine */}
        <div className="w-full max-w-xl rounded-2xl border border-[#00f0ff]/40 bg-zinc-900/95 p-4 sm:p-5 shadow-[0_0_30px_-5px_rgba(0,240,255,0.25)] relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                ◈
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-zinc-100 tracking-wide block">
                  ADAPTIVEROUTE INTELLIGENCE ENGINE
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Latency Overhead: <strong className="text-emerald-400">3.4ms</strong>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-[#00f0ff] border border-zinc-700 font-semibold">
              Live Gateway
            </span>
          </div>

          {/* Sequential Illuminated Pipeline Steps */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
            <div
              className={`p-2 rounded-lg border transition-all ${
                stage === "analyzing"
                  ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-bold shadow-sm"
                  : "border-zinc-800 bg-zinc-950/70 text-zinc-400"
              }`}
            >
              1. Classify
            </div>
            <div
              className={`p-2 rounded-lg border transition-all ${
                stage === "cache"
                  ? "border-emerald-400 bg-emerald-950/40 text-emerald-400 font-bold shadow-sm"
                  : "border-zinc-800 bg-zinc-950/70 text-zinc-400"
              }`}
            >
              2. Vector Cache
            </div>
            <div
              className={`p-2 rounded-lg border transition-all ${
                stage === "scoring"
                  ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-bold shadow-sm"
                  : "border-zinc-800 bg-zinc-950/70 text-zinc-400"
              }`}
            >
              3. Complexity
            </div>
            <div
              className={`p-2 rounded-lg border transition-all ${
                stage === "selected"
                  ? "border-[#00f0ff] bg-[#00f0ff]/25 text-[#00f0ff] font-bold shadow-sm"
                  : "border-zinc-800 bg-zinc-950/70 text-zinc-400"
              }`}
            >
              4. Score Route
            </div>
          </div>
        </div>

        {/* Dynamic Curved SVG Conduit branching from Router to 3 Models */}
        <div className="w-full max-w-3xl h-14 relative hidden md:block">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 50">
            {/* Base gray conduit paths */}
            <path d="M 300 0 C 300 25, 100 25, 100 50" fill="none" stroke="#27272a" strokeWidth="2" />
            <path d="M 300 0 C 300 25, 300 25, 300 50" fill="none" stroke="#27272a" strokeWidth="2" />
            <path d="M 300 0 C 300 25, 500 25, 500 50" fill="none" stroke="#27272a" strokeWidth="2" />

            {/* Glowing active path based on active tier */}
            {activeTier === "fast" && (
              <>
                <path d="M 300 0 C 300 25, 100 25, 100 50" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="6,4" className="animate-pulse" />
                <circle cx="100" cy="50" r="4" fill="#00f0ff" className="shadow-lg" />
              </>
            )}
            {activeTier === "balanced" && (
              <>
                <path d="M 300 0 C 300 25, 300 25, 300 50" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="6,4" className="animate-pulse" />
                <circle cx="300" cy="50" r="4" fill="#00f0ff" className="shadow-lg" />
              </>
            )}
            {activeTier === "powerful" && (
              <>
                <path d="M 300 0 C 300 25, 500 25, 500 50" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="6,4" className="animate-pulse" />
                <circle cx="500" cy="50" r="4" fill="#00f0ff" className="shadow-lg" />
              </>
            )}
          </svg>
        </div>

        {/* STAGE 3: Three Model Tiers */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mt-2">
          {/* FAST MODEL */}
          <div
            onClick={() => {
              setActiveTier("fast");
              setPrioritySlider(0);
            }}
            className={`rounded-2xl p-5 border transition-all duration-300 relative cursor-pointer ${
              activeTier === "fast" && stage === "selected"
                ? "border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_30px_-5px_rgba(0,240,255,0.35)] ring-1 ring-[#00f0ff]"
                : "border-zinc-800/80 bg-zinc-900/40 opacity-40 hover:opacity-85 hover:border-zinc-700"
            }`}
          >
            {activeTier === "fast" && stage === "selected" && (
              <span className="absolute -top-3 right-4 bg-[#00f0ff] text-zinc-950 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                ✓ SELECTED
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
                Fast Model
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">120ms</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 font-mono">Llama 3.1 8B Instant</p>
            <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="text-emerald-400 font-semibold">$0.08 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span className="text-zinc-200">98% Highest</span>
              </div>
            </div>
          </div>

          {/* BALANCED MODEL */}
          <div
            onClick={() => {
              setActiveTier("balanced");
              setPrioritySlider(50);
            }}
            className={`rounded-2xl p-5 border transition-all duration-300 relative cursor-pointer ${
              activeTier === "balanced" && stage === "selected"
                ? "border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_30px_-5px_rgba(0,240,255,0.35)] ring-1 ring-[#00f0ff]"
                : "border-zinc-800/80 bg-zinc-900/40 opacity-40 hover:opacity-85 hover:border-zinc-700"
            }`}
          >
            {activeTier === "balanced" && stage === "selected" && (
              <span className="absolute -top-3 right-4 bg-[#00f0ff] text-zinc-950 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                ✓ SELECTED
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
                Balanced Model
              </span>
              <span className="text-[10px] font-mono text-[#00f0ff] font-semibold">340ms</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 font-mono">Claude 3.5 Haiku</p>
            <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="text-emerald-400 font-semibold">$0.42 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span>Reasoning:</span>
                <span className="text-[#00f0ff] font-semibold">Strong (96%)</span>
              </div>
            </div>
          </div>

          {/* POWERFUL MODEL */}
          <div
            onClick={() => {
              setActiveTier("powerful");
              setPrioritySlider(100);
            }}
            className={`rounded-2xl p-5 border transition-all duration-300 relative cursor-pointer ${
              activeTier === "powerful" && stage === "selected"
                ? "border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_30px_-5px_rgba(0,240,255,0.35)] ring-1 ring-[#00f0ff]"
                : "border-zinc-800/80 bg-zinc-900/40 opacity-40 hover:opacity-85 hover:border-zinc-700"
            }`}
          >
            {activeTier === "powerful" && stage === "selected" && (
              <span className="absolute -top-3 right-4 bg-[#00f0ff] text-zinc-950 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                ✓ SELECTED
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
                Powerful Model
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-semibold">820ms</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 font-mono">Claude 3.7 Sonnet</p>
            <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="text-zinc-300 font-semibold">$2.10 / 1M</span>
              </div>
              <div className="flex justify-between">
                <span>Reasoning:</span>
                <span className="text-purple-400 font-semibold">Advanced (99%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Connector 3 */}
        <div className="relative flex flex-col items-center my-3 h-8 justify-center">
          <div className="w-0.5 h-full bg-zinc-700"></div>
          <motion.div
            animate={{ y: [-14, 14], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]"
          />
        </div>

        {/* STAGE 4: Selected Model Telemetry Banner */}
        <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wide">
                {isCache ? "SEMANTIC CACHE SERVED" : `${activeTier.toUpperCase()} MODEL SELECTED`}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Confidence: <strong className="text-[#00f0ff]">{currentConfidence}</strong>
            </span>
          </div>

          <p className="text-xs text-zinc-300 mb-3">
            <span className="text-zinc-400 font-mono text-[11px]">Reason: </span>
            {currentReason}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center font-mono">
            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase">Billed Cost</span>
              <span className="text-xs font-bold text-emerald-400">{currentCost}</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase">Execution Latency</span>
              <span className="text-xs font-bold text-[#00f0ff]">{currentLatency}</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block uppercase">Model Match</span>
              <span className="text-xs font-bold text-zinc-200">{currentConfidence}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
