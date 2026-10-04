"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Inbox, 
  Search, 
  Database, 
  Cpu, 
  Sliders, 
  CheckCircle, 
  Send, 
  MessageSquare,
  Play,
  RotateCcw
} from "lucide-react";

export function RoutingPipeline() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      num: "01",
      title: "REQUEST",
      icon: Inbox,
      desc: "Incoming developer prompt received via standard /v1/chat/completions endpoint.",
      tag: "REST / Edge",
    },
    {
      num: "02",
      title: "CLASSIFY",
      icon: Search,
      desc: "Extract syntactic complexity, token volume, domain intent, and algorithmic cues.",
      tag: "Feature Extraction",
    },
    {
      num: "03",
      title: "CHECK CACHE",
      icon: Database,
      desc: "Search semantically similar previous requests in vector store before invoking a model.",
      tag: "Cosine > 0.90",
    },
    {
      num: "04",
      title: "ANALYZE COMPLEXITY",
      icon: Cpu,
      desc: "Compute multi-dimensional scores for reasoning, context length, and mathematical depth.",
      tag: "ML Classifier",
    },
    {
      num: "05",
      title: "SCORE MODELS",
      icon: Sliders,
      desc: "Evaluate models using quality benchmarks, real-time latency, dollar cost, and provider health.",
      tag: "Utility Function",
    },
    {
      num: "06",
      title: "SELECT MODEL",
      icon: CheckCircle,
      desc: "Choose optimal tier (Fast, Balanced, Powerful) that satisfies task SLA at lowest cost.",
      tag: "Dynamic Routing",
    },
    {
      num: "07",
      title: "EXECUTE",
      icon: Send,
      desc: "Invoke provider endpoint via low-latency connection with automatic retry & fallback.",
      tag: "Streaming Gateway",
    },
    {
      num: "08",
      title: "RESPOND",
      icon: MessageSquare,
      desc: "Stream response to client with telemetry headers: model, latency, cost, and routing reason.",
      tag: "Audit Telemetry",
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  return (
    <section className="py-20 border-t border-zinc-800/80 bg-zinc-950/70 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
              INTERNAL DECISION PIPELINE
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              How AdaptiveRoute Thinks
            </h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
              From the instant a prompt hits the gateway to the final token streamed back, every
              step is tuned for sub-millisecond overhead and optimal quality routing.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <Play className={`h-3 w-3 ${isPlaying ? "text-[#00f0ff]" : "text-zinc-500"}`} />
              <span>{isPlaying ? "Auto-cycling" : "Paused"}</span>
            </button>
            <button
              onClick={() => setActiveStep(0)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              title="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 8-Stage Sequential Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = activeStep === idx;
            const isPast = activeStep > idx;

            return (
              <div
                key={step.num}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(idx);
                }}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? "border-[#00f0ff] bg-zinc-900/90 shadow-[0_0_20px_-3px_rgba(0,240,255,0.25)] ring-1 ring-[#00f0ff]/50"
                    : isPast
                    ? "border-zinc-800 bg-zinc-900/50 text-zinc-300"
                    : "border-zinc-800/60 bg-zinc-950/40 opacity-60 hover:opacity-100 hover:border-zinc-700"
                }`}
              >
                {/* Active step progress line indicator */}
                {isCurrent && (
                  <motion.div
                    layoutId="pipeline-indicator"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-[#00f0ff]"
                  />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isCurrent ? "text-[#00f0ff]" : "text-zinc-500"
                      }`}
                    >
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-400">
                      {step.tag}
                    </span>
                  </div>
                  <div
                    className={`p-1.5 rounded-md ${
                      isCurrent
                        ? "bg-[#00f0ff]/15 text-[#00f0ff]"
                        : "bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>

                <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-100 uppercase mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
