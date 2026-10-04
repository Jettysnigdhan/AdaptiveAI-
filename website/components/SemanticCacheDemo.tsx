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
  Search
} from "lucide-react";

export function SemanticCacheDemo() {
  const [activeReq, setActiveReq] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerRun = (reqNum: 1 | 2) => {
    setActiveReq(reqNum);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 700);
  };

  return (
    <section className="py-20 bg-zinc-950 border-t border-zinc-800/80 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono font-medium tracking-wider text-emerald-400 uppercase mb-2">
            ZERO-COMPUTE VECTOR CACHING
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Semantic Cache in Action
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            AdaptiveRoute builds dense vector embeddings for every inbound query. Semantically
            similar requests are served instantly from memory without waking up expensive models.
          </p>
        </div>

        {/* Interactive Request Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => triggerRun(1)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeReq === 1
                ? "border-zinc-500 bg-zinc-900/90 ring-1 ring-zinc-500"
                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                REQUEST #1 • INITIAL QUERY
              </span>
              <span className="text-xs font-mono text-amber-400">Cache Miss</span>
            </div>
            <p className="text-sm font-mono text-zinc-200 font-medium">
              &ldquo;What is TCP?&rdquo;
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              First time seeing this semantic intent. Stored into embedding index after execution.
            </p>
          </button>

          <button
            onClick={() => triggerRun(2)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeReq === 2
                ? "border-emerald-500/80 bg-emerald-950/20 ring-1 ring-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800">
                REQUEST #2 • PARAPHRASED QUERY
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                ✓ Cache Hit (97.4%)
              </span>
            </div>
            <p className="text-sm font-mono text-zinc-200 font-medium">
              &ldquo;Explain TCP protocol&rdquo;
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              Syntactically different words, but 97.4% semantic cosine similarity. Zero model cost.
            </p>
          </button>
        </div>

        {/* Visual Flow Canvas */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Step 1: Input Query */}
            <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Incoming Prompt
              </span>
              <p className="font-mono text-xs sm:text-sm font-semibold text-zinc-100">
                {activeReq === 1 ? '"What is TCP?"' : '"Explain TCP protocol"'}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Search className="h-3.5 w-3.5 text-[#00f0ff]" />
                <span>Embedding: 384-dim vector</span>
              </div>
            </div>

            {/* Step 2: Semantic Cache Node */}
            <div className="lg:col-span-4 rounded-xl border border-zinc-700 bg-zinc-900/90 p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#00f0ff]" />
                  <span className="text-xs font-mono font-bold text-zinc-100">
                    SEMANTIC CACHE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Threshold: 0.90</span>
              </div>

              {activeReq === 1 ? (
                <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Similarity:</span>
                    <span className="text-zinc-400">0.42 (No match)</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-400">
                    <span>Status:</span>
                    <span>CACHE MISS</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    Forwarding to Router & Model...
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-zinc-300">
                    <span>Similarity:</span>
                    <span className="text-emerald-400 font-bold">97.4% match</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-400">
                    <span>Status:</span>
                    <span>✓ CACHE HIT</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 pt-1 border-t border-emerald-900/50">
                    Bypassing model completely
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Destination Node (Instant Response OR Model Invocation) */}
            <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              {activeReq === 1 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      Model Invoked
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Standard Flow
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Model:</span>
                      <span className="text-zinc-200">Fast (Llama 3.1 8B)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Latency:</span>
                      <span className="text-zinc-200 font-semibold">121 ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Compute Cost:</span>
                      <span className="text-zinc-200 font-semibold">$0.0010</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      Instant Cached Response
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      100% Cost Avoided
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Model:</span>
                      <span className="text-emerald-400 font-semibold">None (Cache Vector)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Latency:</span>
                      <span className="text-emerald-400 font-bold">14 ms (9x faster)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Compute Cost:</span>
                      <span className="text-emerald-400 font-bold">$0.0000</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
