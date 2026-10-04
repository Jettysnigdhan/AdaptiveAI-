"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Cpu, 
  Database,
  ExternalLink,
  ChevronRight,
  X
} from "lucide-react";
import { INITIAL_ROUTE_LOGS, RouteLogEntry } from "@/lib/mockData";

export default function RoutingActivityPage() {
  const [logs, setLogs] = useState<RouteLogEntry[]>(INITIAL_ROUTE_LOGS);
  const [filter, setFilter] = useState<"All" | "Cache Hit" | "Cache Miss" | "Small" | "Medium" | "Large">("All");
  const [search, setSearch] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<RouteLogEntry | null>(null);

  // Simulated real-time streaming
  useEffect(() => {
    if (!isStreaming) return;

    const streamPrompts = [
      { text: "Analyze memory leak in Node.js worker threads", complexity: "High" as const, tier: "powerful" as const, model: "Powerful Model (Claude 3.7)", latency: 810, cost: 0.017 },
      { text: "Format SQL query with prettier indentation", complexity: "Low" as const, tier: "fast" as const, model: "Fast Model (Llama 3.1 8B)", latency: 112, cost: 0.0006 },
      { text: "Explain CAP theorem with real world examples", complexity: "Medium" as const, tier: "balanced" as const, model: "Balanced Model (Claude 3.5 Haiku)", latency: 334, cost: 0.0039 },
      { text: "What is TCP protocol 3-way handshake?", complexity: "Low" as const, tier: "fast" as const, model: "Fast Model (Llama 3.1 8B)", latency: 16, cost: 0.0001, hit: true },
      { text: "Implement LRU cache in Go with sync.RWMutex", complexity: "Medium" as const, tier: "balanced" as const, model: "Balanced Model (Claude 3.5 Haiku)", latency: 328, cost: 0.0041 },
    ];

    const interval = setInterval(() => {
      const randomPrompt = streamPrompts[Math.floor(Math.random() * streamPrompts.length)];
      const now = new Date();
      const timeFormatted = now.toTimeString().split(" ")[0];

      const newEntry: RouteLogEntry = {
        id: `req-${Date.now().toString().slice(-4)}`,
        timestamp: now.toISOString(),
        timeFormatted,
        promptPreview: randomPrompt.text,
        complexity: randomPrompt.complexity,
        complexityScore: randomPrompt.complexity === "High" ? 92 : randomPrompt.complexity === "Medium" ? 64 : 19,
        reasoningScore: randomPrompt.complexity === "High" ? 94 : randomPrompt.complexity === "Medium" ? 68 : 22,
        contextScore: 50,
        costSensitivity: randomPrompt.complexity === "High" ? 25 : randomPrompt.complexity === "Medium" ? 55 : 85,
        selectedModel: randomPrompt.model,
        modelTier: randomPrompt.tier,
        latencyMs: randomPrompt.latency,
        costUsd: randomPrompt.cost,
        cacheStatus: randomPrompt.hit ? "HIT" : "MISS",
        reason: randomPrompt.hit ? "Instant semantic cache match found (>96%)." : `Heuristic evaluation determined ${randomPrompt.complexity.toLowerCase()} tier allocation.`,
        confidence: 94 + Math.floor(Math.random() * 5),
        tokens: { prompt: 110, completion: 240, total: 350 },
      };

      setLogs((prev) => [newEntry, ...prev.slice(0, 35)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Filtering
  const filteredLogs = logs.filter((log) => {
    // Filter chip
    if (filter === "Cache Hit" && log.cacheStatus !== "HIT") return false;
    if (filter === "Cache Miss" && log.cacheStatus !== "MISS") return false;
    if (filter === "Small" && log.modelTier !== "fast") return false;
    if (filter === "Medium" && log.modelTier !== "balanced") return false;
    if (filter === "Large" && log.modelTier !== "powerful") return false;

    // Search input
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPrompt = log.promptPreview.toLowerCase().includes(q);
      const matchModel = log.selectedModel.toLowerCase().includes(q);
      const matchComplexity = log.complexity.toLowerCase().includes(q);
      if (!matchPrompt && !matchModel && !matchComplexity) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Real-Time Routing Activity
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <span className={`h-2 w-2 rounded-full ${isStreaming ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`}></span>
              <span>{isStreaming ? "Live Feed Active" : "Feed Paused"}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Audit every request dispatched through the AdaptiveRoute gateway with full telemetry headers.
          </p>
        </div>

        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
            isStreaming
              ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          {isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{isStreaming ? "Pause Live Stream" : "Resume Stream"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Chips */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs font-mono">
          {(["All", "Cache Hit", "Cache Miss", "Small", "Medium", "Large"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === tab
                  ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 w-full md:w-80">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by prompt, model, or complexity..."
            className="bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Request Prompt</th>
                <th className="pb-3 font-medium">Complexity</th>
                <th className="pb-3 font-medium">Selected Model</th>
                <th className="pb-3 font-medium">Latency</th>
                <th className="pb-3 font-medium">Cost</th>
                <th className="pb-3 font-medium">Cache</th>
                <th className="pb-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              <AnimatePresence>
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedEntry(log)}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 text-zinc-400 whitespace-nowrap">{log.timeFormatted}</td>
                    <td className="py-3 text-zinc-200 max-w-sm truncate pr-4 font-sans font-medium">
                      {log.promptPreview}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] border ${
                          log.complexity === "High"
                            ? "bg-purple-950/60 text-purple-300 border-purple-800 font-semibold"
                            : log.complexity === "Medium"
                            ? "bg-blue-950/60 text-blue-300 border-blue-800 font-semibold"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {log.complexity} ({log.complexityScore}%)
                      </span>
                    </td>
                    <td className="py-3 text-zinc-300 whitespace-nowrap">
                      {log.selectedModel}
                    </td>
                    <td className="py-3 text-[#00f0ff] font-semibold whitespace-nowrap">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-3 text-emerald-400 font-semibold whitespace-nowrap">
                      ${log.costUsd.toFixed(4)}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.cacheStatus === "HIT"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {log.cacheStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-[#00f0ff] transition-colors ml-auto" />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center font-mono text-zinc-500 text-xs">
            No routing events match current filter.
          </div>
        )}
      </div>

      {/* Slide-over Telemetry Modal when row is selected */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Request Telemetry Trace
                  </span>
                  <h3 className="text-base font-bold font-mono text-zinc-100 mt-0.5">
                    {selectedEntry.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Prompt box */}
              <div className="my-5 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs">
                <span className="text-[10px] text-zinc-400 block uppercase mb-1">Raw Inbound Prompt</span>
                <p className="text-zinc-200">{selectedEntry.promptPreview}</p>
              </div>

              {/* Scoring breakdown */}
              <div className="space-y-3 font-mono text-xs pb-5 border-b border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Selected Model:</span>
                  <span className="text-[#00f0ff] font-semibold">{selectedEntry.selectedModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Routing Rationale:</span>
                  <span className="text-zinc-300 text-right max-w-xs">{selectedEntry.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Task Complexity:</span>
                  <span className="text-zinc-200">{selectedEntry.complexityScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Reasoning Depth:</span>
                  <span className="text-zinc-200">{selectedEntry.reasoningScore} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Execution Latency:</span>
                  <span className="text-zinc-200">{selectedEntry.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Actual Billed Cost:</span>
                  <span className="text-emerald-400 font-bold">${selectedEntry.costUsd.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Vector Cache:</span>
                  <span className="text-zinc-200 font-bold">{selectedEntry.cacheStatus}</span>
                </div>
              </div>

              {/* Telemetry headers */}
              <div className="mt-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                  Response Headers
                </span>
                <pre className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 overflow-x-auto">
{`x-adaptiveroute-model: ${selectedEntry.modelTier}
x-adaptiveroute-latency: ${selectedEntry.latencyMs}ms
x-adaptiveroute-cost: $${selectedEntry.costUsd}
x-adaptiveroute-cache: ${selectedEntry.cacheStatus}
x-adaptiveroute-confidence: ${selectedEntry.confidence}%`}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-6 w-full py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-medium text-zinc-300 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
