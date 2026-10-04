"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  Zap, 
  Scale, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Server, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  RotateCw
} from "lucide-react";
import { MODEL_TIERS, ModelInfo } from "@/lib/mockData";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>(MODEL_TIERS);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Model Registry & Performance
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
              3 Tiers Online
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure routing priority, monitor provider latency SLAs, and inspect task capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors">
            <RotateCw className="h-3.5 w-3.5" />
            <span>Health Check All</span>
          </button>
        </div>
      </div>

      {/* Escalation Hierarchy Architecture Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#00f0ff] font-semibold">
              Escalation & Fallback Rule
            </span>
            <p className="text-zinc-200 mt-0.5 font-medium">
              Small Model (8B) → Escalate to Balanced (Haiku) on low confidence → Escalate to Large (Sonnet)
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
              Escalation Rate: 3.2%
            </span>
            <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Automatic Retry: ON
            </span>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {models.map((model) => {
          const isFast = model.tier === "fast";
          const isBalanced = model.tier === "balanced";
          const isPowerful = model.tier === "powerful";

          return (
            <div
              key={model.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between bg-zinc-900/40 transition-all ${
                isBalanced
                  ? "border-[#00f0ff]/40 shadow-[0_0_25px_-5px_rgba(0,240,255,0.15)]"
                  : "border-zinc-800"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      {model.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {model.requestsShare}% Traffic Share
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mb-1">
                  <div
                    className={`p-2 rounded-lg border ${
                      isFast
                        ? "border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]"
                        : isBalanced
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                    }`}
                  >
                    {isFast && <Zap className="h-4 w-4" />}
                    {isBalanced && <Scale className="h-4 w-4" />}
                    {isPowerful && <Sparkles className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-mono text-white">
                      {model.displayName.toUpperCase()}
                    </h3>
                    <p className="text-xs text-zinc-400">{model.provider}</p>
                  </div>
                </div>

                <p className="font-mono text-xs text-[#00f0ff] mt-2 mb-4 p-2 rounded bg-zinc-950 border border-zinc-800/80 truncate">
                  {model.modelIdentifier}
                </p>

                {/* Metrics */}
                <div className="space-y-2.5 font-mono text-xs pt-3 border-t border-zinc-800/80">
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Average Latency:</span>
                    <span className="text-zinc-100 font-semibold">{model.latencyAvgMs} ms</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">P95 Tail Latency:</span>
                    <span className="text-zinc-300">{model.p95LatencyMs} ms</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Cost per 1M Tokens:</span>
                    <span className="text-emerald-400 font-semibold">
                      ${model.costPer1MTokens.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Reasoning Depth:</span>
                    <span className="text-zinc-200">{model.reasoningLevel}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Context Window:</span>
                    <span className="text-zinc-300">{model.contextWindow}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Quality Benchmark:</span>
                    <span className="text-[#00f0ff] font-semibold">{model.qualityScore}%</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Efficiency Score:</span>
                    <span className="text-zinc-200">{model.efficiencyScore}%</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-zinc-400">Availability Uptime:</span>
                    <span className="text-emerald-400">{model.uptime}</span>
                  </div>
                </div>

                {/* Best For Tags */}
                <div className="mt-5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                    Optimal Task Profiles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {model.bestFor.map((item, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">Traffic Allocation:</span>
                <span className="text-xs font-mono font-bold text-[#00f0ff]">
                  {model.requestsShare}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
