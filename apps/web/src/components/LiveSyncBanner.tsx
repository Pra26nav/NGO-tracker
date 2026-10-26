"use client";

import React, { useState, useEffect } from "react";
import { useLedger } from "@/context/ledger-context";
import { isDemoSafeMode } from "@/lib/demo-safe";
import { Lock, RefreshCw, Zap, Coins, ShieldAlert } from "lucide-react";

export function LiveSyncBanner() {
  const {
    totalDonated,
    vaultBalance,
    escrowStatus,
    frozenReason,
    recentTxs,
    resetToBaseline,
    unfreezeEscrow,
  } = useLedger();

  const [isResetting, setIsResetting] = useState(false);
  const [demoSafeActive, setDemoSafeActive] = useState(false);
  const isFrozen = escrowStatus === "FROZEN";

  useEffect(() => {
    setDemoSafeActive(isDemoSafeMode());
  }, []);

  const handleReset = () => {
    setIsResetting(true);
    resetToBaseline();
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <div
      className={`w-full border-b-2 border-black transition-colors py-2 px-4 sm:px-6 text-xs font-mono relative z-40 ${
        isFrozen
          ? "bg-brutal-red text-white"
          : "bg-sage text-black"
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Narrative Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isFrozen ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-white rounded-full border border-black animate-ping" />
              <span className="font-heading font-black text-sm text-white flex items-center gap-1.5 uppercase tracking-tight">
                <Lock className="w-4 h-4 text-white" />
                <span>AUTONOMOUS CIRCUIT BREAKER TRIPPED: ESCROW FROZEN</span>
              </span>
              <span className="hidden md:inline font-bold">•</span>
              <span className="hidden md:inline font-mono font-bold text-white/90 truncate max-w-xl">
                {frozenReason || "Double-spend nullifier collision flagged. Capital locked on Base Sepolia."}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" />
              <span className="font-heading font-extrabold text-black tracking-tight">
                LIVE SYNC: Connected to PurposeBoundEscrow.sol &amp; Multi-Hop DAG (Base Sepolia)
              </span>
            </div>
          )}

          {demoSafeActive && (
            <span className="px-2 py-0.5 rounded bg-white text-black border border-black text-[10px] font-mono font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-black" />
              <span>DEMO SAFE MODE</span>
            </span>
          )}
        </div>

        {/* Right Metric Pills & Tactile Reset Button */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Vault Balance Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border-2 border-black text-black font-mono font-bold shadow-brutal-sm">
            <Coins className="w-3.5 h-3.5" />
            <span className="text-black/60">Vault:</span>
            <span>{vaultBalance.toFixed(1)} ETH</span>
          </div>

          {/* Total Donated Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border-2 border-black text-black font-mono font-bold shadow-brutal-sm">
            <span className="text-black/60">Total:</span>
            <span>{totalDonated.toFixed(1)} ETH</span>
          </div>

          {/* Unfreeze Action if Frozen */}
          {isFrozen && (
            <button
              onClick={unfreezeEscrow}
              className="btn-brutal bg-white hover:bg-primary text-black font-heading font-black text-[11px] px-3 py-1 rounded-lg"
            >
              UNFREEZE ESCROW
            </button>
          )}

          {/* Reset Demo State Button */}
          <button
            id="global-reset-demo-btn"
            onClick={handleReset}
            disabled={isResetting}
            title="Reset demo balances and state to baseline seed"
            className="btn-brutal bg-white hover:bg-primary text-black text-[11px] font-heading font-black flex items-center gap-1.5 px-3 py-1 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>RESET DEMO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
