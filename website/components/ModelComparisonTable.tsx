"use client";

import React, { useState } from "react";
import { Zap, Scale, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";

export function ModelComparisonTable() {
  const [activeCol, setActiveCol] = useState<"fast" | "balanced" | "powerful">("balanced");

  const tiers = [
    {
      id: "fast" as const,
      name: "FAST",
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
      name: "BALANCED",
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
      name: "POWERFUL",
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
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
            MODEL ARCHITECTURE MATRIX
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Granular Tier Comparison
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Hover or select a tier to observe how AdaptiveRoute weighs trade-offs across latency,
            dollar cost, reasoning depth, and task compatibility.
          </p>
        </div>

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
                {/* Header of Card */}
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
