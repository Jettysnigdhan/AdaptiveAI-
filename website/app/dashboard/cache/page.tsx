"use client";

import React, { useState } from "react";
import { 
  Database, 
  Search, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  Zap, 
  DollarSign, 
  Clock,
  ArrowRight
} from "lucide-react";
import { CACHE_MATCHES, SYSTEM_METRICS } from "@/lib/mockData";

export default function CacheObservabilityPage() {
  const [similarityThreshold, setSimilarityThreshold] = useState(0.88);
  const [cacheList, setCacheList] = useState(CACHE_MATCHES);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMatches = cacheList.filter((c) =>
    c.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.matchedQuery.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              Semantic Cache Observability
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
              68.2% Hit Ratio
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Zero-compute vector cache matching for semantically equivalent prompts across users.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Re-index Vector Store</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-mono transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Flush Cache</span>
          </button>
        </div>
      </div>

      {/* Top 5 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 font-mono">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
            Cache Hits
          </span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">16,976</p>
          <p className="text-[10px] text-zinc-400 mt-1">Instant returns (~16ms)</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
            Cache Misses
          </span>
          <p className="text-xl sm:text-2xl font-bold text-zinc-300">7,916</p>
          <p className="text-[10px] text-zinc-400 mt-1">Dispatched to models</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
            Hit Ratio
          </span>
          <p className="text-xl sm:text-2xl font-bold text-zinc-100">68.2%</p>
          <p className="text-[10px] text-emerald-400 mt-1">Optimal threshold</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
            Tokens Saved
          </span>
          <p className="text-xl sm:text-2xl font-bold text-purple-400">14.6M</p>
          <p className="text-[10px] text-zinc-400 mt-1">Unbilled tokens</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
            Cost Avoided
          </span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">
            ${SYSTEM_METRICS.costSavedUsd.toFixed(2)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">Direct dollar savings</p>
        </div>
      </div>

      {/* Threshold Slider Simulation Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 font-mono">
              Cosine Similarity Threshold Tuning
            </h3>
            <p className="text-xs text-zinc-400">
              Control the semantic sensitivity required before serving a cached response
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-zinc-950 border border-zinc-800 text-[#00f0ff] font-bold">
            Threshold: {similarityThreshold.toFixed(2)}
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <input
            type="range"
            min="0.75"
            max="0.98"
            step="0.01"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="w-full accent-[#00f0ff] cursor-pointer"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-2">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase">Projected Hit Rate</span>
              <span className="text-zinc-100 font-bold">
                {(68.2 - (similarityThreshold - 0.88) * 45).toFixed(1)}%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase">False Positive Risk</span>
              <span className="text-emerald-400 font-bold">
                {similarityThreshold >= 0.85 ? "< 0.4% (Safe)" : "1.8% (Moderate)"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase">Vector Embedding Index</span>
              <span className="text-[#00f0ff] font-bold">all-MiniLM-L6-v2 (384-dim)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cache Matches Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 font-mono">
              Recent Semantic Match Audit
            </h3>
            <p className="text-xs text-zinc-400">
              Log of semantic distance comparisons between inbound queries and stored vectors
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search query logs..."
              className="bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none w-full text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 font-medium">Inbound Query</th>
                <th className="pb-3 font-medium">Matched Prior Query</th>
                <th className="pb-3 font-medium">Cosine Similarity</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Latency</th>
                <th className="pb-3 font-medium text-right">Cost Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredMatches.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 text-zinc-200 max-w-xs font-sans pr-4 truncate font-medium">
                    &ldquo;{m.query}&rdquo;
                  </td>
                  <td className="py-3 text-zinc-400 max-w-xs font-sans pr-4 truncate">
                    &ldquo;{m.matchedQuery}&rdquo;
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        m.similarity >= 90
                          ? "text-emerald-400"
                          : m.similarity >= 80
                          ? "text-[#00f0ff]"
                          : "text-zinc-400"
                      }`}
                    >
                      {m.similarity}%
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.action === "CACHE HIT"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {m.action}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-300 whitespace-nowrap">
                    {m.actualLatencyMs} ms
                  </td>
                  <td className="py-3 text-right text-emerald-400 font-semibold whitespace-nowrap">
                    +${m.costSavedUsd.toFixed(4)}
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
