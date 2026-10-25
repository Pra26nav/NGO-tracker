"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLedger } from "@/context/ledger-context";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Activity,
  ArrowRight,
  ExternalLink,
  Coins,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function LiveSyncBanner() {
  const {
    totalDonated,
    vaultBalance,
    releasedAmount,
    escrowStatus,
    frozenReason,
    recentTxs,
    resetToBaseline,
    unfreezeEscrow,
  } = useLedger();

  const [isResetting, setIsResetting] = useState(false);
  const isFrozen = escrowStatus === "FROZEN";

  const handleReset = () => {
    setIsResetting(true);
    resetToBaseline();
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <div
      className={`w-full border-b transition-colors duration-300 py-2.5 px-4 sm:px-6 lg:px-8 text-xs font-mono relative z-40 backdrop-blur-md ${
        isFrozen
          ? "bg-red-950/80 border-red-500/60 text-red-200 shadow-[0_4px_20px_rgba(239,68,68,0.25)]"
          : "bg-slate-950/75 border-slate-800/80 text-slate-300"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: The Prominent Narrative Banner */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isFrozen ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-bold text-red-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span>🚨 Circuit Breaker Active: PurposeBoundEscrow.sol FROZEN</span>
              </span>
              <span className="hidden md:inline text-red-300/80">•</span>
              <span className="hidden md:inline text-red-200/90 truncate max-w-md">
                {frozenReason || "Double-spend nullifier collision flagged. Capital protected."}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-emerald-400">
                🟢 Live Sync: Connected to PurposeBoundEscrow.sol &amp; Multi-Hop DAG
              </span>
            </div>
          )}
        </div>

        {/* Right: Real-time Synchronized Badges & Quick Reset */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Vault Balance Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200">
            <Coins className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-400">Vault:</span>
            <span className="font-bold text-white">{vaultBalance.toFixed(2)} ETH</span>
          </div>

          {/* Total Donated Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200">
            <span className="text-slate-400">Total:</span>
            <span className="font-bold text-emerald-400">{totalDonated.toFixed(2)} ETH</span>
          </div>

          {/* Recorded Txs Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Txs:</span>
            <span className="font-bold text-cyan-300">{recentTxs.length}</span>
          </div>

          {/* If Frozen, provide unfreeze action */}
          {isFrozen && (
            <button
              onClick={unfreezeEscrow}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition-all shadow-sm"
            >
              Unfreeze Escrow
            </button>
          )}

          {/* Reset Demo State Button */}
          <button
            onClick={handleReset}
            disabled={isResetting}
            title="Reset demo balances and state to baseline seed"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reset State</span>
          </button>
        </div>
      </div>
    </div>
  );
}
