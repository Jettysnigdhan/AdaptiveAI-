"use client";

import React from "react";
import Link from "next/link";
import { 
  Activity, 
  DollarSign, 
  Clock, 
  Database, 
  Cpu, 
  ArrowUpRight, 
  Layers, 
  ShieldCheck, 
  TrendingDown,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { 
  RequestsPerformanceChart, 
  ModelDistributionChart, 
  CostComparisonWidget 
} from "@/components/dashboard/Charts";
import { INITIAL_ROUTE_LOGS, SYSTEM_METRICS } from "@/lib/mockData";

export default function DashboardOverviewPage() {
  const recentLogs = INITIAL_ROUTE_LOGS.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              System Healthy
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Monitor real-time routing performance, model efficiency, and cost telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/routing"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 text-xs font-mono font-medium transition-colors"
          >
            <span>Live Stream</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/dashboard/playground"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#38bdf8] text-zinc-950 px-3.5 py-1.5 text-xs font-mono font-bold transition-all shadow-[0_0_15px_-3px_rgba(0,240,255,0.3)]"
          >
            <span>Route Test Prompt</span>
          </Link>
        </div>
      </div>

      {/* Top Metric KPI Cards (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Requests */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Total Requests
            </span>
            <Layers className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {SYSTEM_METRICS.totalRequests.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            +12.4% vs last week
          </p>
        </div>

        {/* Card 2: Cost Saved */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Cost Saved
            </span>
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            ${SYSTEM_METRICS.costSavedUsd.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            ↓ 42.8% net reduction
          </p>
        </div>

        {/* Card 3: Average Latency */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Avg Latency
            </span>
            <Clock className="h-3.5 w-3.5 text-[#00f0ff]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#00f0ff]">
            {SYSTEM_METRICS.avgLatencyMs} ms
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            ↓ 31.4% faster
          </p>
        </div>

        {/* Card 4: Cache Hit Rate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Cache Hit Rate
            </span>
            <Database className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {SYSTEM_METRICS.cacheHitRatePercent}%
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            16,976 vector matches
          </p>
        </div>

        {/* Card 5: Models Used */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Models Active
            </span>
            <Cpu className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {SYSTEM_METRICS.modelsActive}
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">
            All 3 tiers operational
          </p>
        </div>
      </div>

      {/* Row 2: Performance Chart + Model Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
          <RequestsPerformanceChart />
        </div>

        {/* Model Distribution Donut */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <ModelDistributionChart />
        </div>
      </div>

      {/* Row 3: Cost Comparison Bar + Routing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <CostComparisonWidget />
        </div>

        {/* Live Router Gateway Snapshot */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Gateway Health & Latency SLA</h3>
                <p className="text-xs text-zinc-400">Cluster heartbeat and endpoint ping times</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                P95 &lt; 350ms
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs pt-2">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-200">Fast Tier (Llama 3.1 8B Instant)</span>
                </div>
                <span className="text-zinc-400">120ms • $0.08/1M</span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-200">Balanced Tier (Claude 3.5 Haiku)</span>
                </div>
                <span className="text-zinc-400">340ms • $0.42/1M</span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-200">Powerful Tier (Claude 3.7 Sonnet)</span>
                </div>
                <span className="text-zinc-400">820ms • $2.10/1M</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Automatic provider failover:</span>
            <span className="text-emerald-400 font-semibold">ENABLED</span>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Real-Time Routing Activity Feed */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 font-mono">
              Recent Live Routing Events
            </h3>
            <p className="text-xs text-zinc-400">
              Streaming trace log of recent completions evaluated by the gateway
            </p>
          </div>
          <Link
            href="/dashboard/routing"
            className="text-xs font-mono text-[#00f0ff] hover:underline flex items-center gap-1"
          >
            <span>View all live requests</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Request Prompt</th>
                <th className="pb-2 font-medium">Complexity</th>
                <th className="pb-2 font-medium">Selected Model</th>
                <th className="pb-2 font-medium">Latency</th>
                <th className="pb-2 font-medium">Cost</th>
                <th className="pb-2 font-medium">Cache</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 text-zinc-400 whitespace-nowrap">{log.timeFormatted}</td>
                  <td className="py-2.5 text-zinc-200 max-w-xs truncate pr-4">
                    {log.promptPreview}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] border ${
                        log.complexity === "High"
                          ? "bg-purple-950/60 text-purple-300 border-purple-800"
                          : log.complexity === "Medium"
                          ? "bg-blue-950/60 text-blue-300 border-blue-800"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {log.complexity} ({log.complexityScore}%)
                    </span>
                  </td>
                  <td className="py-2.5 text-zinc-300 whitespace-nowrap">
                    {log.selectedModel.split("(")[0]}
                  </td>
                  <td className="py-2.5 text-[#00f0ff] whitespace-nowrap">{log.latencyMs}ms</td>
                  <td className="py-2.5 text-emerald-400 whitespace-nowrap">
                    ${log.costUsd.toFixed(4)}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.cacheStatus === "HIT"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {log.cacheStatus}
                    </span>
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
