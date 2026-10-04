"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Zap, Scale, Sparkles, ArrowRight, CornerDownRight } from "lucide-react";

export function StaticVsAdaptiveSection() {
  const [activeRequestType, setActiveRequestType] = useState<"easy" | "medium" | "complex">("medium");

  const requests = [
    {
      id: "easy" as const,
      label: "Easy Request",
      sample: "Format timestamp string to ISO-8601",
      staticResult: {
        model: "Frontier LLM (GPT-4o / Claude 3.7)",
        cost: "$0.0150",
        latency: "740ms",
        waste: "94% Overpaid (Extreme Waste)",
      },
      adaptiveResult: {
        model: "Fast Model (Llama 3.1 8B)",
        cost: "$0.0008",
        latency: "118ms",
        waste: "0% Waste (Optimal Fit)",
        savings: "94.7%",
      },
    },
    {
      id: "medium" as const,
      label: "Medium Request",
      sample: "Write REST API schema for auth & session cookies",
      staticResult: {
        model: "Frontier LLM (GPT-4o / Claude 3.7)",
        cost: "$0.0180",
        latency: "820ms",
        waste: "78% Overpaid",
      },
      adaptiveResult: {
        model: "Balanced Model (Claude 3.5 Haiku)",
        cost: "$0.0040",
        latency: "340ms",
        waste: "0% Waste (Balanced Reasoning)",
        savings: "77.8%",
      },
    },
    {
      id: "complex" as const,
      label: "Complex Request",
      sample: "Derive convergence bounds of stochastic optimization",
      staticResult: {
        model: "Frontier LLM (GPT-4o / Claude 3.7)",
        cost: "$0.0210",
        latency: "840ms",
        waste: "Correct Model, but needed no cache",
      },
      adaptiveResult: {
        model: "Powerful Model (Claude 3.7 Sonnet)",
        cost: "$0.0210",
        latency: "840ms",
        waste: "Full Reasoning Allocated",
        savings: "0% (Quality Protected)",
      },
    },
  ];

  const current = requests.find((r) => r.id === activeRequestType)!;

  return (
    <section className="py-24 border-t border-zinc-800/80 bg-zinc-950 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
            ARCHITECTURAL PARADIGM SHIFT
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Don&apos;t use the biggest model. Use the right model.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400">
            Sending every request to the biggest model burns 70%+ of your engineering budget on simple syntactic tasks. AdaptiveRoute dispatches queries to the exact tier they require.
          </p>
        </div>

        {/* Interactive Request Category Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRequestType(r.id)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeRequestType === r.id
                    ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sample Prompt Badge */}
        <div className="max-w-xl mx-auto mb-10 text-center font-mono text-xs">
          <span className="text-zinc-500 text-[10px] uppercase block mb-1">Active Query Example:</span>
          <p className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 font-semibold truncate">
            &ldquo;{current.sample}&rdquo;
          </p>
        </div>

        {/* Side-by-Side Architectural Flow Diagrams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT: STATIC ROUTING */}
          <div className="rounded-3xl border border-rose-900/30 bg-[#0c0d12] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-6 font-mono text-xs">
                <span className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  STATIC ROUTING (NAIVE)
                </span>
                <span className="text-zinc-500">Fixed Endpoint</span>
              </div>

              {/* Visual Flow diagram */}
              <div className="space-y-4 font-mono text-xs">
                {/* Node 1: Request */}
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-zinc-300">
                  EVERY INBOUND REQUEST
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-zinc-600">
                  <div className="h-6 w-0.5 bg-zinc-700"></div>
                </div>

                {/* Node 2: Same Model */}
                <div className="p-4 rounded-xl border border-rose-800/50 bg-rose-950/20 text-center space-y-1">
                  <span className="text-[10px] uppercase text-rose-400 font-bold">Same Expensive Model</span>
                  <p className="text-sm font-bold text-zinc-100 font-mono">Frontier LLM (GPT-4o / Claude 3.7)</p>
                  <p className="text-[11px] text-zinc-400">Full parameters invoked unconditionally</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-zinc-600">
                  <div className="h-6 w-0.5 bg-zinc-700"></div>
                </div>

                {/* Node 3: Unnecessary Cost Outcome */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Latency:</span>
                    <span className="text-zinc-300 font-bold">{current.staticResult.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Compute Cost:</span>
                    <span className="text-rose-400 font-bold">{current.staticResult.cost}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-500">Efficiency:</span>
                    <span className="text-rose-400 font-semibold">{current.staticResult.waste}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
              <span>Result: Massive compute overhead</span>
              <span className="text-rose-400 font-semibold">100% Frontier Cost</span>
            </div>
          </div>

          {/* RIGHT: ADAPTIVEROUTE */}
          <div className="rounded-3xl border border-[#00f0ff]/40 bg-[#0d1017] p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_35px_-8px_rgba(0,240,255,0.2)] ring-1 ring-[#00f0ff]/30">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-6 font-mono text-xs">
                <span className="flex items-center gap-2 text-[#00f0ff] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  ADAPTIVEROUTE (INTELLIGENT)
                </span>
                <span className="text-emerald-400 font-semibold">Dynamic Precision</span>
              </div>

              {/* Visual Flow diagram */}
              <div className="space-y-4 font-mono text-xs">
                {/* Node 1: Request */}
                <div className="p-3 rounded-xl bg-zinc-900 border border-[#00f0ff]/30 text-center text-zinc-100 flex items-center justify-center gap-2">
                  <span>INCOMING REQUEST:</span>
                  <span className="text-[#00f0ff] font-bold uppercase">{activeRequestType} TIER</span>
                </div>

                {/* Animated Bezier Conduits */}
                <div className="relative h-14 flex items-center justify-center">
                  <div className="w-full grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className={`p-1.5 rounded border transition-all ${activeRequestType === "easy" ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-bold" : "border-zinc-800 text-zinc-600"}`}>
                      Easy → Small
                    </div>
                    <div className={`p-1.5 rounded border transition-all ${activeRequestType === "medium" ? "border-sky-400 bg-sky-950/40 text-sky-400 font-bold" : "border-zinc-800 text-zinc-600"}`}>
                      Med → Balanced
                    </div>
                    <div className={`p-1.5 rounded border transition-all ${activeRequestType === "complex" ? "border-purple-400 bg-purple-950/40 text-purple-400 font-bold" : "border-zinc-800 text-zinc-600"}`}>
                      Cpx → Large
                    </div>
                  </div>
                </div>

                {/* Node 2: Selected Target Model */}
                <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/20 text-center space-y-1">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold">Intelligently Routed Model</span>
                  <p className="text-sm font-bold text-white font-mono">{current.adaptiveResult.model}</p>
                  <p className="text-[11px] text-zinc-300">Exact compute required with zero quality loss</p>
                </div>

                {/* Node 3: Resulting Cost Outcome */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Latency:</span>
                    <span className="text-[#00f0ff] font-bold">{current.adaptiveResult.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Compute Cost:</span>
                    <span className="text-emerald-400 font-bold">{current.adaptiveResult.cost}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-400">Efficiency:</span>
                    <span className="text-emerald-400 font-bold">{current.adaptiveResult.waste}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Savings on this query:</span>
              <span className="text-emerald-400 font-bold text-sm">↓ {current.adaptiveResult.savings}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
