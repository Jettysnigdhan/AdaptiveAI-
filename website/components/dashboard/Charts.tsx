"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TIME_SERIES_24H, TIME_SERIES_7D, TIME_SERIES_30D } from "@/lib/mockData";

export function RequestsPerformanceChart() {
  const [range, setRange] = useState<"24H" | "7D" | "30D">("7D");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data =
    range === "24H"
      ? TIME_SERIES_24H
      : range === "7D"
      ? TIME_SERIES_7D
      : TIME_SERIES_30D;

  if (!isMounted) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-xs text-zinc-500">
        Loading chart metrics...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Requests & Routing Performance
          </h3>
          <p className="text-xs text-zinc-400">
            Inbound throughput and model allocation volume
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
          {(["24H", "7D", "30D"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                range === r
                  ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl text-xs font-mono">
                      <p className="text-zinc-400 mb-1">{label}</p>
                      <p className="text-[#00f0ff] font-bold">
                        {payload[0].value?.toLocaleString()} requests
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="requests"
              stroke="#00f0ff"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cyanArea)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ModelDistributionChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = [
    { name: "Small Model (8B)", value: 52, color: "#00f0ff", desc: "Fast & Lightweight" },
    { name: "Medium Model (Haiku)", value: 31, color: "#38bdf8", desc: "Balanced Reasoning" },
    { name: "Large Model (Sonnet)", value: 17, color: "#a855f7", desc: "High Complexity" },
  ];

  if (!isMounted) {
    return <div className="h-56 flex items-center justify-center font-mono text-xs text-zinc-500">Loading distribution...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Model Distribution</h3>
        <p className="text-xs text-zinc-400">Proportion of total requests routed per tier</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Donut Chart */}
        <div className="h-44 w-44 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={48}
                outerRadius={68}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#090a0f" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-mono text-zinc-400">Total</span>
            <span className="text-sm font-mono font-bold text-white">100%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 w-full font-mono text-xs">
          {data.map((item) => (
            <div
              key={item.name}
              className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-zinc-200">{item.name}</span>
              </div>
              <span className="font-bold text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CostComparisonWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Cost Comparison</h3>
          <p className="text-xs text-zinc-400">
            Estimated Cost Without AdaptiveRoute vs With AdaptiveRoute
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
          ↓ 42.8% lower cost
        </span>
      </div>

      <div className="space-y-4 pt-2">
        {/* Without AdaptiveRoute */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Traditional Routing (Default to frontier LLMs)</span>
            <span className="text-zinc-300 font-bold">$32.18 / wk</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-lg h-3 overflow-hidden border border-zinc-800">
            <div className="bg-zinc-600 h-full rounded-lg" style={{ width: "100%" }} />
          </div>
        </div>

        {/* With AdaptiveRoute */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-zinc-400">
            <span className="text-[#00f0ff] font-medium">With AdaptiveRoute (Semantic Caching + Tiering)</span>
            <span className="text-emerald-400 font-bold">$18.42 / wk (-$13.76)</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-lg h-3 overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-[#00f0ff] to-emerald-400 h-full rounded-lg transition-all"
              style={{ width: "57.2%" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
        <span>Projected Annual Net Savings:</span>
        <span className="text-emerald-400 font-bold font-mono">$715.52 / organization</span>
      </div>
    </div>
  );
}
