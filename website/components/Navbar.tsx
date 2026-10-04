"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Cpu, 
  Menu, 
  X, 
  ArrowUpRight, 
  Sparkles,
  Layers,
  Activity,
  GitCompare,
  Database,
  BarChart3,
  Terminal
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Overview", href: "/dashboard", icon: Activity },
    { label: "Playground", href: "/dashboard/playground", icon: Terminal },
    { label: "Routing", href: "/dashboard/routing", icon: Layers },
    { label: "Models", href: "/dashboard/models", icon: Cpu },
    { label: "Comparisons", href: "/dashboard/comparisons", icon: GitCompare },
    { label: "Cache", href: "/dashboard/cache", icon: Database },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/60 text-[#00f0ff] shadow-sm group-hover:border-[#00f0ff]/50 transition-all">
              <span className="font-mono text-base font-bold leading-none">◈</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                AdaptiveRoute
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-400">
                v1.2
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-[#00f0ff] bg-zinc-900 border border-zinc-800"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400">System</span>
            <span className="text-emerald-400 font-medium">Healthy</span>
          </div>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/Jettysnigdhan/AdaptiveAI-"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            aria-label="GitHub Repository"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Playground CTA Button */}
          <Link
            href="/dashboard/playground"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all shadow-[0_0_15px_-3px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_-2px_rgba(0,240,255,0.4)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Try Playground</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors"
          >
            <span>Dashboard</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-800 bg-zinc-950/95 px-4 pt-3 pb-5 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "text-[#00f0ff] bg-zinc-900 border border-zinc-800"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <Icon className="h-4 w-4 text-zinc-400" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Gateway: 127.0.0.1:8000
            </span>
            <span className="text-[#00f0ff]">Latency 284ms</span>
          </div>
        </div>
      )}
    </header>
  );
}
