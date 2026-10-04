"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Scale, Sparkles, Check, ArrowRight, ShieldCheck, BarChart2 } from "lucide-react";

export function ModelComparisonTable() {
  const [activeCol, setActiveCol] = useState<"fast" | "balanced" | "powerful">("balanced");
  const [activeBenchmark, setActiveBenchmark] = useState<"overview" | "code" | "math" | "latency" | "cost">("overview");

  const benchmarks = [
    { id: "overview", label: "General Specs" },
    { id: "code", label: "Code (HumanEval)" },
    { id: "math", label: "Math (GSM8K)" },
    { id: "latency", label: "Speed (TTFT ms)" },
    { id: "cost", label: "Cost ($/1M Tokens)" },
  ];

  const benchmarkValues = {
    overview: { fast: 92, balanced: 96, powerful: 99, unit: "% Quality" },
    code: { fast: 72, balanced: 86, powerful: 94, unit: "% Pass@1" },
    math: { fast: 68, balanced: 84, powerful: 96, unit: "% Accuracy" },
    latency: { fast: 120, balanced: 340, powerful: 820, unit: "ms (Lower is faster)" },
    cost: { fast: 0.08, balanced: 0.42, powerful: 2.10, unit: "$ per 1M" },
  };

  const tiers = [
    {
      id: "fast" as const,
      name: "FAST TIER",
      subtitle: "Sub-150ms Speed",
      headlineModel: "Llama 3.1 8B Instant",
      icon: Zap,
      accentColor: "#00f0ff",
      badge: "Highest Throughput",
      specs: {
        latency: "120ms",
        cost: "$0.08 / 1M",
        reasoning: "Basic reasoning",
        context: "Short (8K tokens)",
        quality: "92%",
        efficiency: "Excellent efficiency",
        recommendedTasks: [
          "Simple questions & FAQs",
          "Extraction & Summarization",
          "Classification & Tagging",
          "JSON formatting & transforms",
        ],
      },
    },
    {
      id: "balanced" as const,
      name: "BALANCED TIER",
      subtitle: "Optimal Price / Performance",
      headlineModel: "Claude 3.5 Haiku / GPT-4o-mini",
      icon: Scale,
      accentColor: "#38bdf8",
      badge: "Best Overall Choice",
      specs: {
        latency: "340ms",
        cost: "$0.42 / 1M",
        reasoning: "Strong reasoning",
        context: "Medium (128K tokens)",
        quality: "96%",
        efficiency: "Best overall balance",
        recommendedTasks: [
          "Code generation & review",
          "Multi-turn conversational reasoning",
          "API schema synthesis",
          "General workflow orchestration",
        ],
      },
    },
    {
      id: "powerful" as const,
      name: "POWERFUL TIER",
      subtitle: "Maximum Reasoning Capability",
      headlineModel: "Claude 3.7 Sonnet / GPT-4o",
      icon: Sparkles,
      accentColor: "#a855f7",
      badge: "Frontier Logic",
      specs: {
        latency: "820ms",
        cost: "$2.10 / 1M",
        reasoning: "Advanced reasoning",
        context: "Large (200K tokens)",
        quality: "99%",
        efficiency: "High complexity tier",
        recommendedTasks: [
          "Complex algorithmic proofs",
          "Multi-file software refactors",
          "Deep causal reasoning",
          "Edge-case architectural decisions",
        ],
      },
    },
  ];

  return (
    <section className="py-20 relative bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
              MODEL CAPABILITY MATRIX
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Granular Tier Comparison
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-xl">
              Hover over cards or click benchmark filters to see how AdaptiveRoute evaluates quality and cost curves.
            </p>
          </div>

          {/* Interactive Benchmark Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-mono">
            {benchmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBenchmark(b.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeBenchmark === b.id
                    ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Benchmark Score Bar (When a specific benchmark is selected) */}
        {activeBenchmark !== "overview" && (
          <div className="mb-8 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs">
            <div className="flex justify-between items-center mb-3">
              <span className="text-zinc-300 font-semibold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#00f0ff]" />
                <span>
                  Metric: {benchmarks.find((b) => b.id === activeBenchmark)?.label} ({benchmarkValues[activeBenchmark].unit})
                </span>
              </span>
              <span className="text-zinc-400 text-[11px]">Dynamic Benchmark Comparison</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Fast (8B):</span>
                  <span className="text-zinc-100 font-bold">
                    {benchmarkValues[activeBenchmark].fast}
                    {activeBenchmark === "cost" ? "$/1M" : activeBenchmark === "latency" ? "ms" : "%"}
                  </span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2">
                  <div
                    className="bg-[#00f0ff] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        activeBenchmark === "cost"
                          ? (benchmarkValues[activeBenchmark].fast / 2.1) * 100
                          : activeBenchmark === "latency"
                          ? (benchmarkValues[activeBenchmark].fast / 820) * 100
                          : benchmarkValues[activeBenchmark].fast
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Balanced (Haiku):</span>
                  <span className="text-sky-400 font-bold">
                    {benchmarkValues[activeBenchmark].balanced}
                    {activeBenchmark === "cost" ? "$/1M" : activeBenchmark === "latency" ? "ms" : "%"}
                  </span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2">
                  <div
                    className="bg-sky-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        activeBenchmark === "cost"
                          ? (benchmarkValues[activeBenchmark].balanced / 2.1) * 100
                          : activeBenchmark === "latency"
                          ? (benchmarkValues[activeBenchmark].balanced / 820) * 100
                          : benchmarkValues[activeBenchmark].balanced
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Powerful (Sonnet):</span>
                  <span className="text-purple-400 font-bold">
                    {benchmarkValues[activeBenchmark].powerful}
                    {activeBenchmark === "cost" ? "$/1M" : activeBenchmark === "latency" ? "ms" : "%"}
                  </span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-2">
                  <div
                    className="bg-purple-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        activeBenchmark === "cost"
                          ? (benchmarkValues[activeBenchmark].powerful / 2.1) * 100
                          : activeBenchmark === "latency"
                          ? (benchmarkValues[activeBenchmark].powerful / 820) * 100
                          : benchmarkValues[activeBenchmark].powerful
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isHoveredOrActive = activeCol === tier.id;

            return (
              <div
                key={tier.id}
                onMouseEnter={() => setActiveCol(tier.id)}
                onClick={() => setActiveCol(tier.id)}
                className={`rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between cursor-pointer relative ${
                  isHoveredOrActive
                    ? "border-[#00f0ff]/60 bg-gradient-to-b from-zinc-900 to-zinc-900/60 shadow-[0_0_30px_-8px_rgba(0,240,255,0.25)] ring-1 ring-[#00f0ff]/40"
                    : "border-zinc-800 bg-zinc-900/30 opacity-70 hover:opacity-100 hover:border-zinc-700"
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                        isHoveredOrActive
                          ? "bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30 font-semibold"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {tier.badge}
                    </span>
                    <div
                      className={`p-2 rounded-lg border ${
                        isHoveredOrActive
                          ? "border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]"
                          : "border-zinc-800 bg-zinc-950 text-zinc-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-mono tracking-tight text-white">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{tier.subtitle}</p>
                  <p className="text-[11px] font-mono text-[#00f0ff] mt-2 mb-6 font-medium">
                    {tier.headlineModel}
                  </p>

                  {/* Spec Rows */}
                  <div className="space-y-3 pt-4 border-t border-zinc-800/80 font-mono text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Latency:</span>
                      <span className="font-semibold text-zinc-200">{tier.specs.latency}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Cost:</span>
                      <span className="font-semibold text-emerald-400">{tier.specs.cost}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Reasoning:</span>
                      <span className="font-semibold text-zinc-200">{tier.specs.reasoning}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Context:</span>
                      <span className="font-semibold text-zinc-200">{tier.specs.context}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Quality:</span>
                      <span className="font-semibold text-[#00f0ff]">{tier.specs.quality}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                      <span className="text-zinc-400">Efficiency:</span>
                      <span className="font-semibold text-zinc-200">{tier.specs.efficiency}</span>
                    </div>
                  </div>

                  {/* Recommended Tasks */}
                  <div className="mt-5">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2.5">
                      Recommended Workloads
                    </p>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {tier.specs.recommendedTasks.map((task, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isHoveredOrActive ? "text-[#00f0ff]" : "text-zinc-500"
                            }`}
                          />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Routing Priority:</span>
                  <span className={isHoveredOrActive ? "text-[#00f0ff]" : "text-zinc-400"}>
                    {tier.id === "fast" ? "52% of traffic" : tier.id === "balanced" ? "31% of traffic" : "17% of traffic"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
