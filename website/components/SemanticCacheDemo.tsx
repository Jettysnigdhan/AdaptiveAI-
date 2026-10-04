"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Clock, 
  DollarSign, 
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface CachePair {
  label: string;
  query1: string;
  query2: string;
  similarity: number;
  isHit: boolean;
}

const SAMPLE_PAIRS: CachePair[] = [
  {
    label: "Networking Protocol",
    query1: "What is TCP protocol 3-way handshake?",
    query2: "Explain the TCP three way handshake SYN ACK",
    similarity: 97.4,
    isHit: true,
  },
  {
    label: "Algorithm / Python",
    query1: "How to invert a binary tree in Python recursively",
    query2: "Python code to reverse a binary tree",
    similarity: 95.8,
    isHit: true,
  },
  {
    label: "System Design",
    query1: "Differences between Raft consensus and Paxos consensus",
    query2: "Compare Paxos vs Raft in distributed systems",
    similarity: 94.2,
    isHit: true,
  },
  {
    label: "Distinct Topics (Miss)",
    query1: "What is quantum entanglement?",
    query2: "How does Docker container networking work?",
    similarity: 32.1,
    isHit: false,
  },
];

export function SemanticCacheDemo() {
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentSimilarity, setCurrentSimilarity] = useState(SAMPLE_PAIRS[0].similarity);
  const [queryInput, setQueryInput] = useState(SAMPLE_PAIRS[0].query2);

  const activePair = SAMPLE_PAIRS[selectedPairIndex];

  const handleSelectPair = (idx: number) => {
    setSelectedPairIndex(idx);
    const p = SAMPLE_PAIRS[idx];
    setQueryInput(p.query2);
    setIsEvaluating(true);

    setTimeout(() => {
      setCurrentSimilarity(p.similarity);
      setIsEvaluating(false);
    }, 400);
  };

  const handleTestMatch = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      // Heuristic: If it has similar keywords
      const base = activePair.query1.toLowerCase();
      const input = queryInput.toLowerCase();
      let sim = 45;
      if (input.includes("tcp") && base.includes("tcp")) sim = 97.4;
      else if (input.includes("tree") && base.includes("tree")) sim = 95.8;
      else if (input.includes("raft") && base.includes("raft")) sim = 94.2;
      else sim = Math.min(99, Math.max(25, Math.floor(Math.random() * 40) + 50));

      setCurrentSimilarity(sim);
      setIsEvaluating(false);
    }, 500);
  };

  const isHit = currentSimilarity >= 90;

  return (
    <section className="py-20 bg-zinc-950 border-t border-zinc-800/80 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
            <Database className="h-3.5 w-3.5" />
            <span>INTERACTIVE VECTOR MATCHING</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Semantic Vector Cache Simulator
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Compare two semantically similar prompts. Watch how cosine distance triggers instant cache returns without waking up heavy frontier LLMs.
          </p>
        </div>

        {/* Quick Sample Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {SAMPLE_PAIRS.map((pair, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPair(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                selectedPairIndex === idx
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800"
              }`}
            >
              {pair.label} ({pair.similarity}%)
            </button>
          ))}
        </div>

        {/* Main Interactive Canvas */}
        <div className="rounded-3xl border border-zinc-800 bg-[#0d1017] p-6 sm:p-10 shadow-2xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Prompts to compare */}
            <div className="lg:col-span-7 space-y-4">
              {/* Existing Stored Vector */}
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                  1. Previously Cached Prompt (Stored Vector in Index)
                </span>
                <p className="font-mono text-xs sm:text-sm text-zinc-200 font-semibold">
                  &ldquo;{activePair.query1}&rdquo;
                </p>
              </div>

              {/* Inbound Prompt (Editable by user) */}
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-zinc-950 relative">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
                  2. Inbound Query (Type or modify below)
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTestMatch();
                    }}
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleTestMatch}
                    disabled={isEvaluating}
                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_-2px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    {isEvaluating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Compare"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>Vector Dimension: 384-dim Dense Float</span>
                <span>Threshold: Cosine &gt; 0.90</span>
              </div>
            </div>

            {/* Right Column: Similarity Gauge & Decision */}
            <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col items-center text-center justify-between shadow-inner">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Semantic Cosine Similarity
              </span>

              {/* Gauge Circle */}
              <div className="relative w-40 h-40 flex items-center justify-center my-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#1f242d" strokeWidth="8" fill="none" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={isHit ? "#10b981" : "#f59e0b"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * currentSimilarity) / 100}
                    strokeLinecap="round"
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className={`text-3xl font-extrabold ${isHit ? "text-emerald-400" : "text-amber-400"}`}>
                    {currentSimilarity.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-zinc-400">Match Score</span>
                </div>
              </div>

              {/* Status Outcome */}
              <div className="w-full pt-3 border-t border-zinc-800/80 font-mono text-xs">
                {isHit ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-400 font-semibold space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>CACHE HIT — ZERO MODEL BILL</span>
                    </div>
                    <div className="text-[11px] font-normal text-zinc-300">
                      Returned in <strong className="text-emerald-400">14ms</strong> (Saved $0.0040)
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-400 font-semibold space-y-1">
                    <div>CACHE MISS — ROUTING TO MODEL</div>
                    <div className="text-[11px] font-normal text-zinc-300">
                      Full model invocation required (~340ms)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
