"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  DollarSign,
  Building2,
  Workflow,
  Cpu,
} from "lucide-react";
import type { FundNode, FundEdge, FundGraphData } from "@shared/types";

interface CanonicalFundGraphProps {
  campaignId?: number;
  isSkimmingSimulated?: boolean;
  className?: string;
}

export function CanonicalFundGraph({
  campaignId = 1,
  isSkimmingSimulated = false,
  className = "",
}: CanonicalFundGraphProps) {
  const [graphData, setGraphData] = useState<FundGraphData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-escrow");
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch from FastAPI provenance endpoint or fallback
  useEffect(() => {
    let isMounted = true;
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/provenance/graph/${campaignId}?is_skimming=${isSkimmingSimulated}`,
          { signal: AbortSignal.timeout(2500) }
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setGraphData(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Graceful offline fallback
      }

      if (isMounted) {
        // High-fidelity fallback graph matching target architecture
        setGraphData({
          nodes: [
            {
              id: "node-donor",
              type: "DONATION",
              label: "Donor Lock (50.0 ETH)",
              source: "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
              timestamp: "2026-10-24 10:15:00 UTC",
              chain: "Ethereum L1",
              transactionHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
              amount: 50.0,
              asset: "ETH",
              confidence: 1.0,
              provenance: 1.0,
              status: "CONFIRMED",
            },
            {
              id: "node-escrow",
              type: "CAMPAIGN",
              label: "PurposeBoundEscrow (Water Infra)",
              source: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
              timestamp: "2026-10-24 10:15:20 UTC",
              chain: "Ethereum L1",
              amount: 50.0,
              asset: "ETH",
              confidence: 1.0,
              provenance: 1.0,
              status: isSkimmingSimulated ? "FROZEN" : "ACTIVE",
            },
            {
              id: "node-mixed-wallet",
              type: "WALLET",
              label: "NGO Vault (Haircut: 0.833)",
              source: "0x217e9C3182B0058b76D63E666C2c502b4e89991A",
              timestamp: "2026-10-24 10:45:00 UTC",
              chain: "Ethereum L1",
              amount: 60.0,
              asset: "ETH",
              confidence: 0.98,
              provenance: 0.8333,
              status: "MIXED_POOL",
            },
            {
              id: "node-dex-swap",
              type: "SWAP",
              label: "Uniswap v3 (ETH -> 159,840 USDC)",
              source: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
              timestamp: "2026-10-24 11:20:00 UTC",
              chain: "Ethereum L1",
              transactionHash: "0x4a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
              amount: 159840.0,
              asset: "USDC",
              confidence: 1.0,
              provenance: 0.8333,
              status: "SWAPPED",
            },
            {
              id: "node-bridge",
              type: "BRIDGE",
              label: "Across / Polygon Bridge",
              source: "L1 SpokePool -> L2 Receiver",
              timestamp: "2026-10-24 12:05:00 UTC",
              chain: "L1 -> Polygon/Base L2",
              transactionHash: "0x7c9a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8",
              amount: isSkimmingSimulated ? 136183.68 : 159776.1,
              asset: "USDC.e",
              confidence: isSkimmingSimulated ? 0.4 : 0.99,
              provenance: isSkimmingSimulated ? 0.71 : 0.8333,
              status: isSkimmingSimulated ? "FLAGGED_SKIMMING" : "BRIDGED",
            },
            ...(isSkimmingSimulated
              ? [
                  {
                    id: "node-shadow",
                    type: "WALLET" as const,
                    label: "Offshore Shadow Wallet ($23,656 Diverted)",
                    source: "0x9b31De710F5D92186c3B5f80bF23a0740E7D6318",
                    timestamp: "2026-10-24 12:05:30 UTC",
                    chain: "Ethereum L1",
                    amount: 23656.32,
                    asset: "USDC",
                    confidence: 0.05,
                    provenance: 0.148,
                    status: "CRITICAL_FRAUD",
                  },
                ]
              : []),
            {
              id: "node-offramp",
              type: "OFF_RAMP",
              label: "Fiat Settlement (INR 1.34 Cr)",
              source: "Licensed Partner #IND-8821",
              timestamp: "2026-10-24 13:40:00 UTC",
              chain: "Banking Settlement Rail",
              amount: 13464000.0,
              asset: "INR",
              confidence: 0.99,
              provenance: 0.8333,
              status: "SETTLED",
            },
            {
              id: "node-vendor",
              type: "VENDOR",
              label: "Maharashtra Borewell Supply",
              source: "GSTIN-27WATER9988Z",
              timestamp: "2026-10-25 09:30:00 UTC",
              chain: "Vendor NEFT (UTR Verified)",
              amount: 120000.0,
              asset: "INR",
              confidence: 1.0,
              provenance: 0.8333,
              status: "VERIFIED_SUPPLIER",
            },
            {
              id: "node-expenditure",
              type: "EXPENDITURE",
              label: "Borewell Drilling & PVC (INV-9001)",
              source: "Invoice INV-2026-9001",
              timestamp: "2026-10-25 10:15:00 UTC",
              chain: "ZK Commitment + Nullifier",
              amount: 120000.0,
              asset: "INR",
              confidence: 1.0,
              provenance: 0.8333,
              status: "VERIFIED_MILESTONE",
            },
            {
              id: "node-impact",
              type: "IMPACT",
              label: "Potable Water: 142 Households",
              source: "Ward 4 Rameshwar Grampanchayat",
              timestamp: "2026-10-25 11:30:00 UTC",
              chain: "Salted Merkle Root (0 PII)",
              amount: 142.0,
              asset: "Households",
              confidence: 1.0,
              provenance: 1.0,
              status: "DELIVERED",
            },
          ],
          edges: [],
          summary: {
            totalDonatedEth: 50.0,
            totalTrackedEth: 50.0,
            provenanceRatio: 0.8333,
            activeHops: isSkimmingSimulated ? 10 : 9,
            discrepanciesCount: isSkimmingSimulated ? 1 : 0,
          },
        });
        setLoading(false);
      }
    };

    fetchGraph();
    return () => {
      isMounted = false;
    };
  }, [campaignId, isSkimmingSimulated]);

  const selectedNode = useMemo(() => {
    if (!graphData) return null;
    return graphData.nodes.find((n: FundNode) => n.id === selectedNodeId) || graphData.nodes[0];
  }, [graphData, selectedNodeId]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={`glass-elevated rounded-2xl p-5 sm:p-6 border border-slate-800/80 bg-slate-950/70 relative overflow-hidden ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Graph Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CryptoChain Explorer Pattern
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Proportional Haircut Accounting
            </span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <span>Canonical Fund Provenance Graph</span>
          </h3>
          <p className="text-xs text-slate-400">
            End-to-end mathematical graph linking on-chain donor deposits, DEX swaps, bridges, off-ramps, and vendor evidence.
          </p>
        </div>

        {/* Provenance Ratio Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
              Attributable Weight
            </span>
            <span className="text-base font-black font-mono text-emerald-400">
              83.33% (50/60 ETH)
            </span>
          </div>
        </div>
      </div>

      {/* ── Interactive Horizontal Pipeline Nodes ───────── */}
      <div className="relative z-10 mb-6 overflow-x-auto pb-3 custom-scrollbar">
        <div className="flex items-center gap-2 min-w-[880px]">
          {graphData?.nodes.map((node: FundNode, idx: number) => {
            const isSelected = node.id === selectedNodeId;
            const isFraud = node.status === "CRITICAL_FRAUD" || node.status === "FLAGGED_SKIMMING";
            const isImpact = node.type === "IMPACT";

            let borderStyle = "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700";
            if (isSelected) {
              borderStyle = "border-indigo-500 bg-indigo-950/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]";
            }
            if (isFraud) {
              borderStyle = isSelected
                ? "border-red-500 bg-red-950/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
                : "border-red-500/60 bg-red-950/30 text-red-300";
            }
            if (isImpact) {
              borderStyle = isSelected
                ? "border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                : "border-emerald-500/50 bg-emerald-950/20 text-emerald-300";
            }

            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all shrink-0 w-44 ${borderStyle}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>#{idx + 1} {node.type}</span>
                    <span className="font-bold text-[9px] px-1.5 py-0.2 rounded bg-slate-800">
                      {node.chain?.split(" ")[0] || "L1"}
                    </span>
                  </div>
                  <div className="text-xs font-bold truncate mb-0.5">{node.label}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {node.amount ? `${node.amount.toLocaleString()} ${node.asset || ""}` : node.source}
                  </div>
                </button>

                {idx < graphData.nodes.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Selected Node Detailed Inspection Card ──────── */}
      {selectedNode && (
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-mono relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                NODE TYPE: {selectedNode.type}
              </span>
              <span className="text-slate-200 font-bold">{selectedNode.label}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Timestamp: {selectedNode.timestamp}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Settlement Rail / Chain
              </span>
              <span className="text-white font-bold">{selectedNode.chain || "Cross-Chain EVM"}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Attributable Value
              </span>
              <span className="text-emerald-400 font-bold">
                {selectedNode.amount
                  ? `${selectedNode.amount.toLocaleString()} ${selectedNode.asset || ""}`
                  : "50.00 ETH"}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">
                (Weight: {(((selectedNode.provenance ?? 1.0)) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Source Entity / Address
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-indigo-300 truncate">{selectedNode.source}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedNode.source, selectedNode.id)}
                  className="p-1 hover:text-white text-slate-400"
                >
                  {copiedId === selectedNode.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {selectedNode.transactionHash && (
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400">Transaction Hash:</span>
              <a
                href={`https://sepolia.basescan.org/tx/${selectedNode.transactionHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 truncate"
              >
                <span>{selectedNode.transactionHash}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
