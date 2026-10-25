"use client";

import React, { useState } from "react";
import { useLedger } from "@/context/ledger-context";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  Cpu,
  FileCheck,
  Check,
  Flame,
  AlertTriangle,
} from "lucide-react";

interface DecentralizedQuorumPanelProps {
  escrowStatus?: "ACTIVE" | "FROZEN";
  activeScenario?: string | null;
  className?: string;
  forceFraudDetected?: boolean;
}

export function DecentralizedQuorumPanel({
  escrowStatus: propStatus,
  activeScenario,
  className = "",
  forceFraudDetected = false,
}: DecentralizedQuorumPanelProps) {
  const ledger = useLedger();
  const currentStatus = propStatus || ledger.escrowStatus;
  
  // Simulated interactive toggle between Fraud Detected Consensus and Standby Quorum
  // By default, if escrow is FROZEN or an attack scenario is active, fraud is detected.
  // In red-team context, default to showing the fraud detection consensus or allow user inspection.
  const isFrozen = currentStatus === "FROZEN";
  const isAttackScenario =
    activeScenario === "CROSS_DONOR_DOUBLE_SPEND" ||
    activeScenario === "BATCH_30_PERCENT_FORGERY" ||
    activeScenario === "CATEGORY_MISMATCH";

  const showFraudConsensus = forceFraudDetected || isFrozen || isAttackScenario || !activeScenario;

  return (
    <div
      id="decentralized-quorum-panel"
      className={`glass-elevated rounded-2xl p-5 sm:p-6 relative overflow-hidden transition-all duration-300 ${
        showFraudConsensus
          ? "border-red-500/40 bg-gradient-to-b from-red-950/25 via-slate-950/90 to-slate-950/95 shadow-[0_0_35px_rgba(239,68,68,0.15)]"
          : "border-indigo-500/30 bg-slate-950/80 shadow-[0_0_30px_rgba(99,102,241,0.12)]"
      } ${className}`}
    >
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/5 via-red-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ── Widget Header ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              showFraudConsensus
                ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
            }`}
          >
            {showFraudConsensus ? (
              <ShieldAlert className="w-5 h-5 animate-pulse text-red-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                N-of-M Consensus (N=2, M=3)
              </span>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  showFraudConsensus
                    ? "bg-red-500/20 text-red-300 border-red-500/50"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {showFraudConsensus ? "2/3 QUORUM EXECUTED" : "2/3 QUORUM LISTENING"}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Decentralized Escrow Freeze Quorum (2/3 Active Nodes)
            </h2>
          </div>
        </div>

        {/* Quorum Metric Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Consensus Threshold
            </div>
            <div
              className={`text-sm font-bold ${
                showFraudConsensus ? "text-red-400" : "text-emerald-400"
              }`}
            >
              2 / 3 Nodes (66.7%)
            </div>
          </div>
          <div className="flex gap-1 items-center px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                showFraudConsensus ? "bg-red-500 animate-pulse" : "bg-emerald-500"
              }`}
              title="Node 1: Agreed"
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                showFraudConsensus ? "bg-red-500 animate-pulse" : "bg-emerald-500"
              }`}
              title="Node 2: Agreed"
            />
            <span
              className="w-2.5 h-2.5 rounded-full bg-slate-600"
              title="Node 3: Abstained (Timeout)"
            />
          </div>
        </div>
      </div>

      {/* ── 3 Independent Validator Nodes Grid ───── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 relative z-10">
        {/* Node 1 */}
        <div
          id="quorum-node-1"
          className={`p-4 rounded-xl border transition-all ${
            showFraudConsensus
              ? "bg-slate-900/90 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Validator 1
              </span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
              Base L2
            </span>
          </div>

          <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <span>Node 1 (0x71C9...b901 - Base L2 Validator)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Check: <strong className="text-slate-200">Verified ELA Check</strong>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Voting Status</span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  showFraudConsensus
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {showFraudConsensus ? (
                  <>
                    <Check className="w-3 h-3 text-red-400" />
                    <span>Status: AGREED - FRAUD DETECTED</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Status: AGREED - VERIFIED CLEAN</span>
                  </>
                )}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Sig: <span className="text-slate-500">0x98f2...e311</span> (secp256k1 on Base L2)
            </div>
          </div>
        </div>

        {/* Node 2 */}
        <div
          id="quorum-node-2"
          className={`p-4 rounded-xl border transition-all ${
            showFraudConsensus
              ? "bg-slate-900/90 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Validator 2
              </span>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
              Polygon Amoy
            </span>
          </div>

          <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <span>Node 2 (0x3A21...4E82 - Polygon Amoy Node)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Check: <strong className="text-slate-200">Verified pHash Collision</strong>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Voting Status</span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  showFraudConsensus
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {showFraudConsensus ? (
                  <>
                    <Check className="w-3 h-3 text-red-400" />
                    <span>Status: AGREED - FRAUD DETECTED</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Status: AGREED - NO COLLISION</span>
                  </>
                )}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Sig: <span className="text-slate-500">0x41b8...77a9</span> (ECDSA on Polygon Amoy)
            </div>
          </div>
        </div>

        {/* Node 3 */}
        <div
          id="quorum-node-3"
          className="p-4 rounded-xl border bg-slate-900/60 border-slate-800/90 text-slate-400"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400/80" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Sentinel 3
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
              Community P2P
            </span>
          </div>

          <div className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
            <span>Node 3 (0x8F12...9C34 - Decentralized Community Sentinel)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Check: <strong className="text-slate-400">Pending / Timeout</strong>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Voting Status</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Status: ABSTAINED</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              P2P Gossip SLA: <span className="text-amber-400/70">Timeout (&gt;3000ms)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Autonomous Smart Contract Execution Notice ─── */}
      <div
        id="quorum-execution-banner"
        className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 ${
          showFraudConsensus
            ? "bg-red-950/50 border-red-500/40 text-red-200"
            : "bg-indigo-950/40 border-indigo-500/30 text-indigo-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
              showFraudConsensus ? "bg-red-500/20 text-red-300" : "bg-indigo-500/20 text-indigo-300"
            }`}
          >
            ⚡
          </div>
          <div className="text-xs font-semibold leading-relaxed">
            Show that the smart contract{" "}
            <code className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-white text-[11px]">
              PurposeBoundEscrow.sol
            </code>{" "}
            automatically executed{" "}
            <code className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-red-300 font-bold text-[11px]">
              .freeze()
            </code>{" "}
            the moment the 2/3 quorum was met, requiring zero centralized human auditors.
          </div>
        </div>

        <div className="shrink-0 font-mono text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 self-end sm:self-auto">
          Block #20491850 · EVM Consensus
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════════╗
          ║  THE CRYPTOGRAPHIC HARD GUARANTEE NOTE           ║
          ╚══════════════════════════════════════════════════╝ */}
      <div
        id="cryptographic-hard-guarantee-note"
        className="mt-4 p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-indigo-950/50 shadow-[0_0_25px_rgba(245,158,11,0.12)] backdrop-blur-md relative z-10"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 select-none pt-0.5">💡</span>
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span>Cryptographic Hard Guarantee</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 normal-case">ZK-Nullifier Hard Proof vs. ELA AI Heuristic</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-100 font-medium leading-relaxed">
              💡 Trust Architecture Note: Error Level Analysis (ELA) acts as an AI heuristic for initial anomaly detection; however, the semantic nullifier collision check serves as the immutable, mathematical hard guarantee that prevents double-spending on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DecentralizedQuorumPanel;
