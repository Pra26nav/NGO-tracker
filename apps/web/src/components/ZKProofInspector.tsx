"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  EyeOff,
  Eye,
  FileCode,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Binary,
  Cpu,
} from "lucide-react";

interface ZKProofInspectorProps {
  className?: string;
  defaultHousehold?: string;
}

export function ZKProofInspector({
  className = "",
  defaultHousehold = "Household #87",
}: ZKProofInspectorProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true); // Default verified for presentation
  const [activeStep, setActiveStep] = useState<number>(4); // 0 to 4
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedHousehold, setSelectedHousehold] = useState<string>("87");

  const publicRoot = "0x9f2ac41e889021b3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071829c41e";
  const leafHash = "0x8f4c91a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b991a2";
  const nullifierHash = "0x8f4c...91a2";

  const merklePathSteps = [
    {
      level: 0,
      title: "Leaf Level (Base Input)",
      label: `Leaf (Hash(Beneficiary_${selectedHousehold}))`,
      hash: leafHash,
      siblingHash: "0x33b8a1097722cc1100445566778899aabbccddeeff001122334455667788a109",
      siblingPosition: "Right (Sibling #1)",
      siblingLabel: `Hash(Beneficiary_${Number(selectedHousehold) + 1})`,
      detail: `Poseidon(secret_salt, HH_${selectedHousehold}) · 0 bytes PII`,
      isVerified: activeStep >= 1,
    },
    {
      level: 1,
      title: "Level 1: Household Pair Hash",
      label: "Node_L1 = Poseidon(Leaf, Sibling_1)",
      hash: "0x77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901e2f3",
      siblingHash: "0x11e4a9028833bb776655443322110099aabbccddeeff0011223344556677a902",
      siblingPosition: "Left (Sibling #2)",
      siblingLabel: "Subtree_Cluster_B (HH_85..86)",
      detail: "Subtree branch aggregation for Wardha Cluster B",
      isVerified: activeStep >= 2,
    },
    {
      level: 2,
      title: "Level 2: Cluster Subtree Hash",
      label: "Node_L2 = Poseidon(Sibling_2, Node_L1)",
      hash: "0xaa45b912c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5cb912",
      siblingHash: "0x5509c1829944aa887766554433221100aabbccddeeff0011223344556677c182",
      siblingPosition: "Right (Sibling #3)",
      siblingLabel: "District_Wardha_West_Branch",
      detail: "Inter-village aggregation layer",
      isVerified: activeStep >= 3,
    },
    {
      level: 3,
      title: "Public On-Chain Merkle Root",
      label: "On-Chain Root = Poseidon(Node_L2, Sibling_3)",
      hash: publicRoot,
      siblingHash: null,
      siblingPosition: null,
      siblingLabel: null,
      detail: "Anchored on Ethereum L1 PurposeBoundEscrow.sol & NullifierRegistry.sol",
      isVerified: activeStep >= 4,
    },
  ];

  const handleRunVerification = () => {
    setIsVerifying(true);
    setIsVerified(false);
    setActiveStep(0);

    // Step-by-step traversal animation
    setTimeout(() => setActiveStep(1), 300);
    setTimeout(() => setActiveStep(2), 650);
    setTimeout(() => setActiveStep(3), 1000);
    setTimeout(() => {
      setActiveStep(4);
      setIsVerified(true);
      setIsVerifying(false);
    }, 1350);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div
      id="zk-proof-inspector"
      className={`glass-elevated rounded-2xl p-5 sm:p-6 border border-indigo-500/30 bg-gradient-to-b from-indigo-950/25 via-slate-950/90 to-slate-950/95 shadow-2xl relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ZK-SNARK Selective Disclosure
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                0 Bytes PII Leaked
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Zero-Knowledge Privacy Proof Inspector
            </h2>
          </div>
        </div>

        {/* Household selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="text-slate-400 text-[11px]">Target:</span>
          <select
            value={selectedHousehold}
            onChange={(e) => {
              setSelectedHousehold(e.target.value);
              setIsVerified(false);
              setActiveStep(0);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            <option value="87">Household #87 (Default Wardha)</option>
            <option value="42">Household #42 (Cluster B)</option>
            <option value="14">Household #14 (Cluster A)</option>
            <option value="105">Household #105 (Cluster D)</option>
          </select>
        </div>
      </div>

      {/* ── Interactive Verification Trigger Button ── */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Interactive Cryptographic Membership Verification</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans max-w-xl">
            Click to generate and verify a zero-knowledge membership proof showing that Household #{selectedHousehold} 
            is a valid recipient in the drought-relief set, without leaking identity, phone, or Aadhaar numbers.
          </p>
        </div>

        <button
          id="verify-household-btn"
          onClick={handleRunVerification}
          disabled={isVerifying}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 border border-indigo-400 shrink-0 disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Traversing Merkle Path…</span>
            </>
          ) : (
            <>
              <span>🔒</span>
              <span>Verify Household #{selectedHousehold} is in Beneficiary Set (Zero-Knowledge Proof)</span>
            </>
          )}
        </button>
      </div>

      {/* ── Verification Success Badge (Bold Requirement) ── */}
      {isVerified && (
        <div
          id="zk-proof-success-badge"
          className="mt-4 p-4 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 via-slate-950/90 to-emerald-950/40 shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-emerald-300 font-mono tracking-tight">
                ✓ Proof Valid: Included in Merkle Root | 0 bytes PII revealed
              </div>
              <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                ZK-SNARK Circuit verified membership against on-chain root{" "}
                <code className="text-emerald-300 font-mono text-[10px] bg-black/40 px-1 py-0.5 rounded">
                  0x9f2a...c41e
                </code>.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              VERIFIED AT BLOCK #20491845
            </span>
          </div>
        </div>
      )}

      {/* ── Merkle Tree Traversal Visualization ──── */}
      <div className="mt-5 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <Binary className="w-4 h-4 text-indigo-400" />
            <span>Interactive Merkle Path Traversal: Leaf (HH #{selectedHousehold}) ➔ Public Root</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Hash Function: Poseidon (BN254)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {merklePathSteps.map((step, idx) => {
            const isStepActive = activeStep >= idx + 1;
            return (
              <div
                key={step.level}
                className={`p-3.5 rounded-xl border transition-all duration-500 flex flex-col justify-between ${
                  isStepActive
                    ? idx === 3
                      ? "bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "bg-indigo-950/40 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    : "bg-slate-900/50 border-slate-800 text-slate-500"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Step {idx + 1} / 4
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isStepActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isStepActive ? "✓ CALCULATED" : "PENDING"}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-200 leading-snug">
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {step.label}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 font-mono text-[10px] space-y-1">
                  <div className="text-slate-400 truncate">
                    Hash: <span className={isStepActive ? (idx === 3 ? "text-emerald-400 font-bold" : "text-indigo-300") : "text-slate-600"}>
                      {step.hash.slice(0, 16)}…
                    </span>
                  </div>

                  {step.siblingHash && (
                    <div className="text-slate-500 truncate">
                      Sibling: <span className="text-slate-400">{step.siblingLabel}</span>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 font-sans leading-tight pt-1">
                    {step.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════════╗
          ║  SPLIT-PANEL PRIVACY CONTRAST VIEW               ║
          ╚══════════════════════════════════════════════════╝ */}
      <div className="mt-6 space-y-3 relative z-10">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>Split-Panel Privacy Contrast View: Absolute Transparency vs. Total Privacy</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ────────────────────────────────────────────────────
              LEFT: WHAT THE PUBLIC / DONORS SEE
          ──────────────────────────────────────────────────── */}
          <div
            id="panel-public-view"
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase text-indigo-300">
                  Left (What the Public / Donors See)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Public Ledger View
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Only cryptographic commitments, Merkle proofs, and anonymized nullifier hashes. 
              <strong> Zero names, phone numbers, Aadhaar numbers, or physical street addresses.</strong>
            </p>

            {/* Public Ledger Mock Terminal */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-[11px] space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-slate-400">
                <span>// Public Transaction Payload:</span>
                <span className="text-emerald-400 font-bold">ETH Sepolia / Polygon</span>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">nullifier_hash:</span>
                  <span className="text-indigo-300 font-bold">{nullifierHash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">merkle_root:</span>
                  <span className="text-emerald-400 truncate max-w-[220px]">
                    0x9f2a...c41e
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">pii_leakage:</span>
                  <span className="text-emerald-400 font-bold">0 bytes (REDACTED)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">beneficiary_names:</span>
                  <span className="text-slate-500">[HIDDEN BY CIRCOM CIRCUIT]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">aadhaar_national_id:</span>
                  <span className="text-slate-500">XXXX-XXXX-REDACTED</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed">
              🛡️ <strong>Safety Guarantee:</strong> Vulnerable rural households cannot be targeted by predatory lenders, corrupt middlemen, or political intimidation because identity never touches the mempool.
            </div>
          </div>

          {/* ────────────────────────────────────────────────────
              RIGHT: WHAT THE AUDITOR / ZK VERIFIER CONFIRMS
          ──────────────────────────────────────────────────── */}
          <div
            id="panel-auditor-view"
            className="p-5 rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-slate-900/80 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase text-emerald-300">
                  Right (What the Auditor / ZK Verifier Confirms)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                EVM Circuit Verified
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Mathematical guarantee that funds reached eligible households without leaking vulnerable beneficiary identities.
            </p>

            {/* Auditor Verification Proof Terminal */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-[11px] space-y-2 text-slate-300">
              <div className="flex items-center justify-between text-slate-400">
                <span>// ZK Verifier Contract Execution:</span>
                <span className="text-emerald-400 font-bold">Pairing.verify() == true</span>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">circuit_proof:</span>
                  <span className="text-emerald-400 font-bold">Groth16 / BN254 Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">membership_guarantee:</span>
                  <span className="text-white font-bold">HH #{selectedHousehold} ∈ Eligible Beneficiary Set</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">double_spend_check:</span>
                  <span className="text-emerald-400 font-bold">Nullifier Unclaimed (PASSED)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">cluster_eligibility:</span>
                  <span className="text-emerald-300">Ward 4 Drought Cluster (Verified)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">disbursement_release:</span>
                  <span className="text-emerald-400 font-bold">Tranche Authorized for Release</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
              ⚖️ <strong>Mathematical Certainty:</strong> The smart contract independently validates that aid reached 100% genuine beneficiaries without relying on human trust or disclosing private data.
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer Link to Flow Tracer ─── */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <span>Poseidon Merkle Root:</span>
          <span className="text-slate-300 font-bold truncate max-w-xs">{publicRoot.slice(0, 24)}…</span>
          <button
            onClick={() => copyToClipboard(publicRoot)}
            className="text-[10px] text-slate-500 hover:text-white"
          >
            {copiedHash === publicRoot ? "✓" : "Copy"}
          </button>
        </div>

        <Link
          href="/flow-tracer"
          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
        >
          <span>View 5-Hop DAG &amp; Full Beneficiary Set (142 Households)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default ZKProofInspector;
