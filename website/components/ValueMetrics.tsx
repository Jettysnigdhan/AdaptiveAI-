"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingDown, Zap, Database, Layers } from "lucide-react";

interface CounterProps {
  from?: number;
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

function AnimatedCounter({ from = 0, to, decimals = 1, prefix = "", suffix = "" }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(from);

  useEffect(() => {
    if (!isInView) return;
    let startTimestamp: number | null = null;
    const duration = 1800; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = from + (to - from) * easeProgress;
      setVal(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isInView, from, to]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function ValueMetrics() {
  return (
    <section className="py-20 border-y border-zinc-800/80 bg-zinc-950/60 relative overflow-hidden">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
            BENCHMARKED INFRASTRUCTURE EFFICIENCY
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Don&apos;t use the biggest model. Use the right model.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Routing queries by semantic complexity reduces raw compute bills and response latencies
            while maintaining benchmark quality parity across all tasks.
          </p>
        </div>

        {/* 4 Large Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* METRIC 1: Cost Reduction */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Cost Reduction
              </span>
              <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-1 flex items-baseline gap-1">
              <span className="text-emerald-400">↓</span>
              <AnimatedCounter to={42.8} decimals={1} suffix="%" />
            </div>
            <p className="text-xs text-zinc-400">
              Versus default routing to heavyweight frontier LLMs
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Saved this week:</span>
              <span className="text-emerald-400 font-medium">$18.42</span>
            </div>
          </div>

          {/* METRIC 2: Average Latency */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Average Latency
              </span>
              <div className="h-7 w-7 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-1 flex items-baseline gap-1">
              <span className="text-[#00f0ff]">↓</span>
              <AnimatedCounter to={31.4} decimals={1} suffix="%" />
            </div>
            <p className="text-xs text-zinc-400">
              Down from 640ms p50 to 284ms across all requests
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Edge P95:</span>
              <span className="text-[#00f0ff] font-medium">340ms</span>
            </div>
          </div>

          {/* METRIC 3: Cache Hit Rate */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Cache Hit Rate
              </span>
              <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-1">
              <AnimatedCounter to={68.2} decimals={1} suffix="%" />
            </div>
            <p className="text-xs text-zinc-400">
              Semantic embeddings resolve repetitive queries instantly
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Cache Latency:</span>
              <span className="text-emerald-400 font-medium">~16ms</span>
            </div>
          </div>

          {/* METRIC 4: Requests Routed */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">
                Requests Routed
              </span>
              <div className="h-7 w-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-1">
              <AnimatedCounter to={24.8} decimals={1} suffix="K" />
            </div>
            <p className="text-xs text-zinc-400">
              Evaluated across production gateway clusters
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Zero Dropouts:</span>
              <span className="text-purple-400 font-medium">99.98% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
