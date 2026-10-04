"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Terminal,
  Layers,
  Cpu,
  GitCompare,
  Database,
  BarChart3,
  Settings,
  ShieldCheck,
  Server,
  Zap,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const mainNav = [
    { label: "Overview", href: "/dashboard", icon: Activity, badge: null },
    { label: "Playground", href: "/dashboard/playground", icon: Terminal, badge: "Live" },
    { label: "Routing", href: "/dashboard/routing", icon: Layers, badge: "Realtime" },
    { label: "Models", href: "/dashboard/models", icon: Cpu, badge: "3 Tiers" },
    { label: "Comparisons", href: "/dashboard/comparisons", icon: GitCompare, badge: "-42.8%" },
    { label: "Cache", href: "/dashboard/cache", icon: Database, badge: "68.2%" },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, badge: null },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      <div className="flex flex-col p-4 space-y-6 overflow-y-auto">
        {/* Project Selector Pill */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/70 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] font-mono text-xs">
              ⚡
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-zinc-200">prod-gateway-01</p>
              <p className="text-[10px] text-zinc-500 font-mono">us-east-1 • edge</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>

        {/* Main Navigation Menu */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-mono font-medium tracking-wider uppercase text-zinc-400 mb-2">
            Platform
          </p>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-[#00f0ff]" : "text-zinc-400 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      isActive
                        ? "bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/30"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Routing Engine Status Card */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Router Core</span>
            <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-zinc-400">
              <span>Policy:</span>
              <span className="text-zinc-200">Adaptive-Cost</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Avg Latency:</span>
              <span className="text-[#00f0ff]">284 ms</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Cache Hit:</span>
              <span className="text-emerald-400">68.2%</span>
            </div>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
            <div className="bg-[#00f0ff] h-full rounded-full" style={{ width: "68%" }}></div>
          </div>
        </div>

        {/* Configuration Links */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-mono font-medium tracking-wider uppercase text-zinc-400 mb-2">
            Settings & Ops
          </p>
          <Link
            href="/dashboard/routing"
            className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 rounded-lg"
          >
            <div className="flex items-center gap-2.5">
              <Server className="h-3.5 w-3.5 text-zinc-400" />
              <span>Gateways & Keys</span>
            </div>
          </Link>
          <a
            href="https://github.com/Jettysnigdhan/AdaptiveAI-"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 rounded-lg"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
              <span>API Docs & Spec</span>
            </div>
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </a>
        </div>
      </div>

      {/* User / Org Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-white">
            AR
          </div>
          <div className="truncate text-xs">
            <p className="font-medium text-zinc-200 truncate">team-infrastructure</p>
            <p className="text-[10px] text-zinc-500 font-mono truncate">enterprise tier</p>
          </div>
        </div>
        <button
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-900"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
