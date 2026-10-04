"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  BarChart3, 
  Calendar, 
  TrendingDown, 
  Zap, 
  Clock, 
  DollarSign, 
  Download,
  Filter
} from "lucide-react";
import { TIME_SERIES_24H, TIME_SERIES_7D, TIME_SERIES_30D } from "@/lib/mockData";

export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<"Today" | "7 Days" | "30 Days">("7 Days");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data =
    timeFilter === "Today"
      ? TIME_SERIES_24H
      : timeFilter === "7 Days"
      ? TIME_SERIES_7D
      : TIME_SERIES_30D;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              AI Routing Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 text-xs font-mono font-medium">
              Production Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Deep performance diagnostics across throughput, dollar spend, tail latency, and cache hit metrics.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {(["Today", "7 Days", "30 Days"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeFilter === t
                    ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Row 1: Requests & Cost Dual-Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Request Volume */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                Request Volume Over Time
              </h3>
              <p className="text-xs text-zinc-400">Total chat completions routed per interval</p>
            </div>
            <span className="text-xs font-mono text-[#00f0ff] font-bold">Total: 24,892</span>
          </div>

          <div className="h-64 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl text-xs font-mono">
                            <p className="text-zinc-400">{label}</p>
                            <p className="text-[#00f0ff] font-bold">
                              {payload[0].value?.toLocaleString()} requests
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#00f0ff" strokeWidth={2} fill="url(#areaCyan)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-zinc-500">
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Cumulative Dollar Cost (With vs Without AdaptiveRoute) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                Cost Trajectory Comparison ($ USD)
              </h3>
              <p className="text-xs text-zinc-400">AdaptiveRoute vs Traditional Fixed Frontier LLM</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">Saved: $18.42</span>
          </div>

          <div className="h-64 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl text-xs font-mono space-y-1">
                            <p className="text-zinc-400">{label}</p>
                            <p className="text-rose-400">Without: ${Number(payload[0]?.value).toFixed(2)}</p>
                            <p className="text-emerald-400">With Route: ${Number(payload[1]?.value).toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="costWithoutRoute" name="Without Route" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="costWithRoute" name="With Route" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-zinc-500">
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Latency & Cache Hit Rate Dual Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Latency Over Time */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                Average Latency (Milliseconds)
              </h3>
              <p className="text-xs text-zinc-400">End-to-end response time across all routes</p>
            </div>
            <span className="text-xs font-mono text-[#00f0ff] font-bold">Avg: 284ms</span>
          </div>

          <div className="h-64 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaSky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl text-xs font-mono">
                            <p className="text-zinc-400">{label}</p>
                            <p className="text-sky-400 font-bold">{payload[0].value} ms</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="avgLatency" stroke="#38bdf8" strokeWidth={2} fill="url(#areaSky)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-zinc-500">
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Cache Hit Rate Percentage */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                Semantic Cache Hit Rate (%)
              </h3>
              <p className="text-xs text-zinc-400">Percentage of prompts satisfied by vector cache</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">68.2% Avg</span>
          </div>

          <div className="h-64 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} domain={[50, 80]} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl text-xs font-mono">
                            <p className="text-zinc-400">{label}</p>
                            <p className="text-emerald-400 font-bold">{payload[0].value}% hit rate</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="cacheHitRate" stroke="#10b981" strokeWidth={2} fill="url(#areaEmerald)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-zinc-500">
                Loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
