"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Sparkles,
  HeartHandshake,
  FileClock,
  Images,
  Layers,
  Cpu,
  Lock,
} from "lucide-react";

import { useLedger } from "@/context/ledger-context";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const { vaultBalance, escrowStatus } = useLedger();

  // Poll escrow state and health
  useEffect(() => {
    let isMounted = true;
    const checkState = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/health", {
          signal: AbortSignal.timeout(2000),
        });
        if (isMounted) setApiOnline(res.ok);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };
    checkState();
    const interval = setInterval(checkState, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/history");
    }
  };

  interface NavLinkItem {
    href: string;
    label: string;
    icon: string;
    description: string;
    highlight?: boolean;
    badge?: string;
  }

  const navLinks: NavLinkItem[] = [
    { href: "/", label: "Attack Story", icon: "🚀", description: "20s Cinematic Demo", highlight: true, badge: "20s" },
    { href: "/red-team", label: "Red-Team", icon: "⚡", description: "Adversarial Stress Engine" },
    { href: "/flow-tracer", label: "Flow-Tracer", icon: "🌐", description: "5-Hop DAG & ZK Auditor" },
    { href: "/dashboard", label: "Dashboard", icon: "🏛️", description: "Escrow & Tranche Drip" },
    { href: "/reconciliation", label: "Reconciliation", icon: "⚖️", description: "Report vs On-Chain Diff", badge: "DIFF" },
    { href: "/donate", label: "Donate", icon: "💳", description: "Crypto & Fiat UPI Gateway" },
    { href: "/judge-pitch", label: "Judge Q&A", icon: "🎯", description: "Top 5 Defense Defenses", badge: "DEFENSE" },
    { href: "/pitch", label: "Pitch Runner", icon: "🎬", description: "Scenario Runner & Live Terminal" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 md:gap-6">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-900 border border-indigo-500/30 group-hover:border-indigo-400 transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" fill="#818cf8" />
                  <circle cx="12" cy="12" r="8" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="3 2" />
                  <circle cx="12" cy="12" r="11" stroke="rgba(99,102,241,0.4)" strokeWidth="1" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                    BLACK HOLE LEDGER
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    PS2
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-none">
                  Verifiable NGO Escrow
                </div>
              </div>
            </Link>
          </div>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md hidden md:block"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tx, nullifier, UTR, invoice, vendor..."
                className="w-full pl-9 pr-12 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-all font-mono"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700 pointer-events-none">
                ↵
              </kbd>
            </div>
          </form>

          {/* Right Status Badges & Quick Action */}
          <div className="flex items-center gap-2.5">
            {/* Live Probabilistic Trust Score Gauge */}
            <TrustScoreGauge size="compact" />

            {/* Glowing Web3 Connect Wallet Button */}
            <ConnectWalletButton />

            {/* Status indicator */}
            <div className="hidden xl:flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                escrowStatus === "FROZEN"
                  ? "bg-red-950/70 text-red-400 border border-red-500/40"
                  : "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${escrowStatus === "FROZEN" ? "bg-red-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
                <span>{escrowStatus === "FROZEN" ? "🚨 ESCROW FROZEN" : `🟢 ${vaultBalance.toFixed(1)} ETH LOCKED`}</span>
              </span>
            </div>

            {/* Quick Donate CTA */}
            <Link
              href="/donate"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-[0_0_12px_rgba(99,102,241,0.35)] flex items-center gap-1.5 shrink-0"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Donate</span>
            </Link>
          </div>

        </div>

        {/* Global Feature Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                  isActive
                    ? link.highlight
                      ? "bg-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-indigo-400"
                      : "bg-slate-800 text-white border border-slate-700 shadow-sm"
                    : link.highlight
                    ? "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 tracking-wider">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
}
