"use client";

import React, { useState } from "react";
import { 
  GitCompare, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Database, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  AlertTriangle
} from "lucide-react";

export default function ComparisonsPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "requests">("summary");

  const comparisonRows = [
    {
      prompt: "Explain distributed consensus algorithms and Paxos vs Raft",
      without: { model: "Claude 3.7 Sonnet (Default)", cost: 0.018, latency: 840 },
      withRoute: { model: "Claude 3.5 Haiku (Balanced)", cost: 0.004, latency: 342, reason: "Moderate reasoning" },
      savingsPercent: "77.8%",
      latencySavedMs: "498ms",
    },
    {
      prompt: "Format this JSON payload into TypeScript interfaces",
      without: { model: "GPT-4o (Default)", cost: 0.015, latency: 720 },
      withRoute: { model: "Llama 3.1 8B (Fast)", cost: 0.0008, latency: 114, reason: "Syntactic task" },
      savingsPercent: "94.7%",
      latencySavedMs: "606ms",
    },
    {
      prompt: "What is TCP protocol 3-way handshake?",
      without: { model: "GPT-4o (Default)", cost: 0.012, latency: 680 },
      withRoute: { model: "Semantic Cache (Instant)", cost: 0.0001, latency: 16, reason: "97.4% Cache Hit" },
      savingsPercent: "99.2%",
      latencySavedMs: "664ms",
    },
    {
      prompt: "Prove convergence of SGD under non-convex conditions",
      without: { model: "Claude 3.7 Sonnet (Default)", cost: 0.021, latency: 840 },
      withRoute: { model: "Claude 3.7 Sonnet (Powerful)", cost: 0.021, latency: 840, reason: "High math rigor required" },
      savingsPercent: "0% (Quality Protected)",
      latencySavedMs: "0ms",
    },
    {
      prompt: "Summarize this 100-word paragraph on microfrontends",
      without: { model: "Claude 3.7 Sonnet (Default)", cost: 0.016, latency: 760 },
      withRoute: { model: "Llama 3.1 8B (Fast)", cost: 0.0009, latency: 118, reason: "Standard summary" },
      savingsPercent: "94.4%",
      latencySavedMs: "642ms",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
            See the difference.
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 text-xs font-mono font-medium">
            Side-by-Side Benchmark
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Understand exactly how AdaptiveRoute changes model selection, cost, and latency versus
          naive single-model routing.
        </p>
      </div>

      {/* Side-by-Side Hero Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Without AdaptiveRoute */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                TRADITIONAL ROUTING
              </span>
              <span className="text-xs font-mono text-zinc-400">Fixed Frontier Model</span>
            </div>

            <h3 className="text-lg font-bold font-mono text-zinc-200">
              Without AdaptiveRoute
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-6">
              Every request routes to the most expensive model regardless of simplicity.
            </p>

            {/* Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Total Billed Cost:</span>
                <span className="font-bold text-rose-400 text-sm">$32.18 / wk</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Average Response Latency:</span>
                <span className="font-bold text-zinc-200">640 ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Model Allocation:</span>
                <span className="text-zinc-300">100% Large Tier</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Semantic Cache Hits:</span>
                <span className="text-zinc-400">0% (Every query billed)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Resource Efficiency:</span>
                <span className="text-rose-400">42.2% (High Waste)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-rose-950/15 border border-rose-900/30 text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Overpaying 70%+ on syntactic & general reasoning tasks.</span>
          </div>
        </div>

        {/* Card B: With AdaptiveRoute */}
        <div className="rounded-2xl border border-[#00f0ff]/50 bg-zinc-900/60 p-6 flex flex-col justify-between shadow-[0_0_30px_-5px_rgba(0,240,255,0.2)] ring-1 ring-[#00f0ff]/30">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00f0ff] font-bold">
                ADAPTIVEROUTE GATEWAY
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                ✓ Optimized Pipeline
              </span>
            </div>

            <h3 className="text-lg font-bold font-mono text-white">
              With AdaptiveRoute
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-6">
              Semantic analysis, vector cache, and precision tiering per request.
            </p>

            {/* Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Total Billed Cost:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  $18.42 / wk (↓ 42.8%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Average Response Latency:</span>
                <span className="font-bold text-[#00f0ff]">
                  284 ms (↓ 31.4%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Model Allocation:</span>
                <span className="text-zinc-200">52% Fast • 31% Med • 17% Lrg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Semantic Cache Hits:</span>
                <span className="text-emerald-400 font-bold">68.2% (~16ms instant)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Benchmark Parity:</span>
                <span className="text-emerald-400 font-bold">98.4% (Zero Degradation)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Optimal cost-latency envelope without manual developer orchestration.</span>
          </div>
        </div>
      </div>

      {/* Request-Level Comparison Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 font-mono">
              Request-Level Granular Audit
            </h3>
            <p className="text-xs text-zinc-400">
              Direct telemetry diff across sample developer queries
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            Average Savings: 73.2%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 font-medium">Prompt Task</th>
                <th className="pb-3 font-medium">Default Model (Naive)</th>
                <th className="pb-3 font-medium">AdaptiveRoute Choice</th>
                <th className="pb-3 font-medium">Latency Delta</th>
                <th className="pb-3 font-medium text-right">Cost Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 text-zinc-200 max-w-xs pr-4 font-sans font-medium truncate">
                    {row.prompt}
                  </td>
                  <td className="py-3 text-zinc-400 whitespace-nowrap">
                    <div>{row.without.model}</div>
                    <div className="text-[10px] text-zinc-400">
                      ${row.without.cost.toFixed(4)} • {row.without.latency}ms
                    </div>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <div className="text-[#00f0ff] font-medium">{row.withRoute.model}</div>
                    <div className="text-[10px] text-zinc-400">
                      ${row.withRoute.cost.toFixed(4)} • {row.withRoute.latency}ms
                    </div>
                  </td>
                  <td className="py-3 text-[#00f0ff] font-semibold whitespace-nowrap">
                    ↓ {row.latencySavedMs}
                  </td>
                  <td className="py-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                    ↓ {row.savingsPercent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
