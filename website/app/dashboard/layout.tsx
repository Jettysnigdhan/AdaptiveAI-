"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  Cpu, 
  Activity, 
  ExternalLink,
  Sparkles,
  Command
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-700/60 text-[#00f0ff] flex items-center justify-center font-mono font-bold group-hover:border-[#00f0ff]/50 transition-colors">
              ◈
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              AdaptiveRoute
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway 127.0.0.1:8000</span>
          </div>
        </div>

        {/* Center / Search command */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400 w-72">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search telemetry, requests, models..."
            className="bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none w-full text-xs"
          />
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-[10px] text-zinc-400">
            ⌘K
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Policy: Adaptive-Cost</span>
          </div>

          <Link
            href="/dashboard/playground"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-3 py-1 text-xs font-semibold tracking-wide transition-all"
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Playground</span>
          </Link>

          <a
            href="https://github.com/Jettysnigdhan/AdaptiveAI-"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
            title="GitHub"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex flex-1 relative">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Slide-in Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
            <div className="w-64 bg-zinc-950 h-full border-r border-zinc-800">
              <div className="p-4 flex justify-between items-center border-b border-zinc-800">
                <span className="font-bold text-sm text-zinc-100">AdaptiveRoute Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar />
            </div>
            <div className="flex-1" onClick={() => setMobileSidebarOpen(false)}></div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-grid-pattern">
          {children}
        </main>
      </div>
    </div>
  );
}
