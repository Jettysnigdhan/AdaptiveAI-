"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, TrendingDown, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function CostCalculator() {
  const [requests, setRequests] = useState(250000);
  const [avgTokens, setAvgTokens] = useState(750);
  const [currentModel, setCurrentModel] = useState<"gpt-4o" | "sonnet" | "opus">("gpt-4o");

  // Cost per 1M tokens for dominant models
  const modelRates = {
    "gpt-4o": { name: "GPT-4o ($2.50 / 1M input, $10.00 / 1M output)", blendedPer1M: 5.00 },
    "sonnet": { name: "Claude 3.7 Sonnet ($3.00 / 1M input, $15.00 / 1M output)", blendedPer1M: 6.50 },
    "opus": { name: "Claude 3 Opus ($15.00 / 1M input, $75.00 / 1M output)", blendedPer1M: 30.00 },
  };

  // Calculations
  const totalTokens = (requests * avgTokens) / 1000000; // in millions
  const costWithout = totalTokens * modelRates[currentModel].blendedPer1M;

  // AdaptiveRoute distributes traffic: 68% cache hit (virtually free $0.05/1M), 52% of remaining to 8B ($0.08/1M), 31% to Haiku ($0.42/1M), 17% to Sonnet ($6.50/1M)
  // Overall savings benchmark is approx ~42.8% to 68% depending on cache hits
  const effectiveBlendedRate = 0.32 * (0.52 * 0.15 + 0.31 * 0.60 + 0.17 * modelRates[currentModel].blendedPer1M) + 0.68 * 0.02;
  const costWith = Math.max(12, totalTokens * effectiveBlendedRate);
  const monthlySavings = Math.max(0, costWithout - costWith);
  const savingsPercent = costWithout > 0 ? ((monthlySavings / costWithout) * 100).toFixed(1) : "0";
  const annualSavings = monthlySavings * 12;

  const formatNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <section className="py-20 border-t border-zinc-800/80 bg-zinc-950 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
            <Calculator className="h-3.5 w-3.5" />
            <span>INTERACTIVE ROI CALCULATOR</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Calculate Your Organization&apos;s Savings
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Drag the sliders to model your actual LLM query volume and see projected monthly and annual cost avoidance.
          </p>
        </div>

        {/* Split Calculator Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-3xl border border-zinc-800 bg-[#0d1017] p-6 sm:p-10 shadow-2xl relative">
          {/* Left Column: Sliders */}
          <div className="lg:col-span-7 space-y-6">
            {/* Slider 1: Monthly Requests */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300 font-semibold">Monthly API Requests:</span>
                <span suppressHydrationWarning className="text-[#00f0ff] font-bold text-sm px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {formatNum(requests)} reqs / mo
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="2000000"
                step="20000"
                value={requests}
                onChange={(e) => setRequests(parseInt(e.target.value))}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>20K</span>
                <span>500K</span>
                <span>1M</span>
                <span>2M Reqs</span>
              </div>
            </div>

            {/* Slider 2: Average Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300 font-semibold">Average Tokens per Prompt + Completion:</span>
                <span className="text-[#00f0ff] font-bold text-sm px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {avgTokens} tokens
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="3000"
                step="50"
                value={avgTokens}
                onChange={(e) => setAvgTokens(parseInt(e.target.value))}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>200 (Short)</span>
                <span>1,000 (Medium)</span>
                <span>2,000</span>
                <span>3,000 (Code/Docs)</span>
              </div>
            </div>

            {/* Selector: Current Default LLM */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-zinc-300 font-semibold block">
                Current Unrouted Default Model:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                {(["gpt-4o", "sonnet", "opus"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setCurrentModel(m)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      currentModel === m
                        ? "border-[#00f0ff] bg-[#00f0ff]/10 text-white font-bold"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-xs font-bold">{m === "gpt-4o" ? "GPT-4o" : m === "sonnet" ? "Claude 3.7 Sonnet" : "Claude Opus"}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 font-normal">
                      ${modelRates[m].blendedPer1M.toFixed(2)}/1M blended
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Bill Savings Output */}
          <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono text-zinc-400">
                <span>ESTIMATED ROI SUMMARY</span>
                <span className="text-emerald-400 font-bold">↓ {savingsPercent}% Net Reduction</span>
              </div>

              {/* Monthly Savings Dial */}
              <div className="my-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                  Monthly Direct Savings
                </span>
                <div suppressHydrationWarning className="text-4xl sm:text-5xl font-extrabold font-mono text-emerald-400">
                  ${formatNum(monthlySavings)}
                </div>
                <span suppressHydrationWarning className="text-xs font-mono text-zinc-400 mt-1 block">
                  or <strong className="text-white">${formatNum(annualSavings)}</strong> / year saved
                </span>
              </div>

              {/* Comparison Bars */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>Without AdaptiveRoute:</span>
                    <span suppressHydrationWarning className="text-rose-400 font-bold">${formatNum(costWithout)} / mo</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2">
                    <div className="bg-rose-500/80 h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span className="text-[#00f0ff]">With AdaptiveRoute:</span>
                    <span suppressHydrationWarning className="text-emerald-400 font-bold">${formatNum(costWith)} / mo</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#00f0ff] to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, (costWith / costWithout) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Zero quality degradation</span>
              </span>
              <span className="text-[#00f0ff]">68.2% cache factor</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
