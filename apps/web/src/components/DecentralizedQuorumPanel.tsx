"use client";

import React from "react";
import { useLedger } from "@/context/ledger-context";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  Check,
} from "lucide-react";

interface DecentralizedQuorumPanelProps {
  escrowStatus?: "ACTIVE" | "FROZEN";
  activeScenario?: string | null;
  className?: string;
  forceFraudDetected?: boolean;
}

const WATCHERS = [
  { id: "W1", name: "FundWatcher", desc: "Balance & Taint Auditor", role: "MONITOR", status: "AGREED" },
  { id: "W2", name: "NullifierWatcher", desc: "Cross-Donor Deduplication", role: "COLLISION_FLAG", status: "AGREED" },
  { id: "W3", name: "ProofWatcher", desc: "ZK & Merkle Path Verifier", role: "CIRCUIT_CHECK", status: "AGREED" },
  { id: "W4", name: "EscrowWatcher", desc: "Opcode Circuit Breaker", role: "FREEZE_ENFORCER", status: "AGREED" },
  { id: "W5", name: "BridgeWatcher", desc: "Chainlink Gas Oracle Monitor", role: "SLIPPAGE_DEFENDER", status: "AGREED" },
  { id: "W6", name: "DiscrepancyWatcher", desc: "6-Domain Corroboration", role: "MULTI_VECTOR", status: "AGREED" },
];

export function DecentralizedQuorumPanel({
  escrowStatus: propStatus,
  activeScenario,
  className = "",
  forceFraudDetected = false,
}: DecentralizedQuorumPanelProps) {
  const ledger = useLedger();
  const currentStatus = propStatus || ledger.escrowStatus;
  const isFrozen = currentStatus === "FROZEN";

  return (
    <div className={`card-brutal p-6 rounded-2xl flex flex-col gap-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sage border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-black uppercase tracking-tight">
              DECENTRALIZED WATCHER QUORUM
            </h3>
            <p className="font-mono text-xs text-black/60">
              4-of-6 Multi-Validator Consensus for Autonomous Circuit Breaking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-sage text-black font-mono font-bold text-xs px-3 py-1 rounded-lg border-2 border-black shadow-brutal-sm">
            6 / 6 NODES ONLINE
          </span>
          <span className="bg-primary text-black font-heading font-black text-xs px-3 py-1 rounded-lg border-2 border-black shadow-brutal-sm">
            QUORUM REACHED
          </span>
        </div>
      </div>

      {/* 6 Watcher Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WATCHERS.map((node) => (
          <div
            key={node.id}
            className="border-2 border-black rounded-xl p-4 bg-white flex flex-col justify-between gap-3 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-black text-base text-black">{node.name}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" />
            </div>

            <p className="font-body text-xs text-black/75">{node.desc}</p>

            <div className="flex items-center justify-between pt-2 border-t border-black/20 text-[10px] font-mono">
              <span className="text-black/60">{node.role}</span>
              <span className="bg-primary px-1.5 py-0.5 rounded border border-black font-bold text-black flex items-center gap-1">
                <Check className="w-3 h-3 text-black" />
                <span>ACTIVE</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quorum Summary Bar */}
      <div className="bg-primary/20 border-2 border-black rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black" />
          <span className="font-heading font-black text-sm uppercase">Byzantine Fault Tolerance:</span>
          <span>Requires 4 independent cryptographic signatures before calling freeze() opcode.</span>
        </div>
        <div className="bg-white px-2.5 py-1 rounded border border-black font-bold">
          LATENCY: &lt; 350 MS
        </div>
      </div>
    </div>
  );
}
