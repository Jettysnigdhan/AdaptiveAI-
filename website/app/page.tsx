"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { LiveRoutingFlow } from "@/components/LiveRoutingFlow";
import { StaticVsAdaptiveSection } from "@/components/StaticVsAdaptiveSection";
import { ValueMetrics } from "@/components/ValueMetrics";
import { CostCalculator } from "@/components/CostCalculator";
import { ModelComparisonTable } from "@/components/ModelComparisonTable";
import { RoutingPipeline } from "@/components/RoutingPipeline";
import { SemanticCacheDemo } from "@/components/SemanticCacheDemo";
import { MiniPlayground } from "@/components/MiniPlayground";
import { 
  ArrowRight, 
  Terminal, 
  Sparkles, 
  Check, 
  Copy, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  GitBranch, 
  Activity 
} from "lucide-react";

export default function LandingPage() {
  const [copied, setCopied] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const snippet = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",  # AdaptiveRoute Gateway
    api_key="sk-adaptiveroute-prod"
)

response = client.chat.completions.create(
    model="adaptive-auto",  # Automatically picks Fast, Balanced, or Powerful
    messages=[{"role": "user", "content": "Explain distributed systems"}]
)

print(response.choices[0].message.content)
print(response.headers.get("x-adaptiveroute-selected-model"))`;

  const copyCode = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#08090c] text-zinc-100 selection:bg-[#00f0ff]/20 selection:text-white flex flex-col relative"
    >
      {/* Interactive cursor spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-60 hidden md:block"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,240,255,0.04), transparent 60%)`,
        }}
      />

      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00f0ff]/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-5xl text-center relative z-10">
            {/* Launch pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-300 mb-6 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span>
              <span>AdaptiveRoute 1.2 Enterprise Gateway</span>
              <span className="text-zinc-400">•</span>
              <span className="text-[#00f0ff]">Zero SDK Rewrite</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
              Route AI intelligently.
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Automatically choose the right model for every request — balancing quality, cost, latency, and complexity. Cut 40%+ of your LLM bill without degrading output quality.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="#playground"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#00f0ff] hover:bg-[#38bdf8] text-zinc-950 font-bold px-6 py-3 text-sm tracking-wide transition-all shadow-[0_0_25px_-5px_rgba(0,240,255,0.4)] uppercase font-mono"
              >
                <span>TRY PLAYGROUND</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 font-semibold px-6 py-3 text-sm tracking-wide transition-all uppercase font-mono"
              >
                <Activity className="h-4 w-4 text-[#00f0ff]" />
                <span>VIEW DASHBOARD</span>
              </Link>
            </div>
          </div>

          {/* LIVE ROUTING VISUALIZATION (Primary Hero Feature) */}
          <div className="mt-14 max-w-5xl mx-auto relative z-10">
            <LiveRoutingFlow />
          </div>
        </section>

        {/* SECTION 2: STATIC ROUTING VS ADAPTIVEROUTE */}
        <StaticVsAdaptiveSection />

        {/* SECTION 3: VALUE METRICS */}
        <ValueMetrics />

        {/* SECTION 4: INTERACTIVE ROI SAVINGS CALCULATOR */}
        <CostCalculator />

        {/* SECTION 5: MODEL COMPARISON TABLE ("See the decision.") */}
        <ModelComparisonTable />

        {/* SECTION 6: HOW IT THINKS (PIPELINE) */}
        <RoutingPipeline />

        {/* SECTION 7: SEMANTIC CACHE DEMO */}
        <SemanticCacheDemo />

        {/* SECTION 8: INTERACTIVE PLAYGROUND (5-step animation) */}
        <MiniPlayground />

        {/* SECTION 9: DEVELOPER INTEGRATION SNIPPET (OpenAI SDK Drop-in) */}
        <section className="py-20 border-t border-zinc-800/80 bg-zinc-950/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-xs font-mono font-medium tracking-wider text-[#00f0ff] uppercase mb-2">
                1-MINUTE DROP-IN INTEGRATION
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Compatible with any OpenAI client
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Point your existing Cursor, VS Code, LangChain, or Python script to AdaptiveRoute.
                Zero changes to application code.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#090b10] p-4 sm:p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-700"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-700"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-800 border border-zinc-700"></div>
                  <span className="ml-2 text-zinc-400">main.py</span>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="mt-4 p-2 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400 font-mono">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-zinc-100">◈ AdaptiveRoute</span>
            <span>—</span>
            <span>Intelligent AI Gateway & Model Orchestration</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/routing" className="hover:text-white transition-colors">
              Live Logs
            </Link>
            <Link href="/dashboard/playground" className="hover:text-white transition-colors">
              Playground
            </Link>
            <a
              href="https://github.com/Jettysnigdhan/AdaptiveAI-"
              target="_blank"
              rel="noreferrer"
              className="text-[#00f0ff] hover:underline"
            >
              GitHub Repository ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
