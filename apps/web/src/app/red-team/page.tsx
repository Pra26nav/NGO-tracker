"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLedger } from "@/context/ledger-context";
import { DecentralizedQuorumPanel } from "@/components/DecentralizedQuorumPanel";
import { AdversarialMonteCarloRunner } from "@/components/AdversarialMonteCarloRunner";
import {
  CLEAN_ELA_HEATMAP_DATA_URI,
  FORGED_ELA_HEATMAP_DATA_URI,
} from "@/lib/demo-safe";
import { ForensicDocumentAuditor } from "@/components/ForensicDocumentAuditor";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Play,
  RotateCcw,
  Upload,
  Copy,
  Check,
  Eye,
  Activity,
  Layers,
  ArrowRight,
  FileSearch,
  Sliders,
  ZoomIn,
  ZoomOut,
  FileText,
  Crosshair,
  ScanLine,
} from "lucide-react";

interface MerkleLeaf {
  label: string;
  value: string;
  hash: string;
  isRedactedPII: boolean;
}

interface ReceiptAudit {
  receiptId: string;
  vendorName: string;
  vendorTaxId: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: string;
  detectedCategory: string;
  expectedCategory: string;
  categoryMatch: boolean;
  sha256Hash: string;
  perceptualHash: string;
  semanticNullifier: string;
  isDuplicateNullifier: boolean;
  duplicatePoolSource?: string | null;
  isPerceptualClone: boolean;
  hammingDistance: number;
  elaAnomalyScore: number;
  elaHeatmapBase64?: string | null;
  merkleRoot: string;
  merkleLeaves: MerkleLeaf[];
  verdict: string;
  escrowFrozen: boolean;
  failureReason?: string | null;
}

interface EscrowState {
  status: "ACTIVE" | "FROZEN";
  balance_eth: number;
  released_eth: number;
  earmark: string;
  frozen_reason: string | null;
  last_tx_hash: string;
}

const OFFLINE: Record<string, { escrowState: EscrowState; receipts: ReceiptAudit[] }> = {
  VALID_MILESTONE: {
    escrowState: {
      status: "ACTIVE",
      balance_eth: 50.0,
      released_eth: 10.0,
      earmark: "Water Infrastructure",
      frozen_reason: null,
      last_tx_hash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    },
    receipts: [
      {
        receiptId: "REC-901",
        vendorName: "Maharashtra Borewell & PVC Supply Co.",
        vendorTaxId: "GSTIN-27WATER9988Z",
        invoiceNumber: "INV-2026-9001",
        invoiceDate: "2026-10-25",
        totalAmount: "₹1,20,000 (0.48 ETH eq.)",
        detectedCategory: "Water Infrastructure (Submersible Pumps & PVC)",
        expectedCategory: "Water Infrastructure",
        categoryMatch: true,
        sha256Hash: "0x9f8a44c1...31b2",
        perceptualHash: "f8c39a11b4e27001",
        semanticNullifier: "0x3c91f0a8b24d77e19023a8c4f11e5509b7d2c8a1e4f60912b3c4d5e6f7a8b9c0",
        isDuplicateNullifier: false,
        duplicatePoolSource: null,
        isPerceptualClone: false,
        hammingDistance: 28,
        elaAnomalyScore: 4.2,
        elaHeatmapBase64: CLEAN_ELA_HEATMAP_DATA_URI,
        merkleRoot: "0x7f9c22a1b8e4d01928374655aabbccddeeff00112233445566778899aabbccdd",
        merkleLeaves: [
          { label: "Vendor Tax ID (Public)", value: "GSTIN-27WATER9988Z", hash: "0x81a2f4c9...", isRedactedPII: false },
          { label: "Line Item (Public)", value: "3x Submersible Borewell Pumps", hash: "0x44d1e8a7...", isRedactedPII: false },
          { label: "Verified Total (Public)", value: "INR 1,20,000", hash: "0x99b3c4d5...", isRedactedPII: false },
          { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Village Cluster #14]", hash: "0x12e9f0a4...", isRedactedPII: true },
        ],
        verdict: "VERIFIED_RELEASE",
        escrowFrozen: false,
        failureReason: null,
      },
    ],
  },
  CROSS_DONOR_DOUBLE_SPEND: {
    escrowState: {
      status: "FROZEN",
      balance_eth: 50.0,
      released_eth: 10.0,
      earmark: "Water Infrastructure",
      frozen_reason:
        "CRITICAL: Cross-Donor Double Spend Detected! Receipt Nullifier 0x6e21... was already claimed in 'Donor_Pool_A'. PurposeBoundEscrow.sol auto-frozen!",
      last_tx_hash: "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
    },
    receipts: [
      {
        receiptId: "REC-8841-CROPPED",
        vendorName: "Nagpur Hydro Pipes Pvt Ltd",
        vendorTaxId: "GSTIN-27AAACW1234F1Z5",
        invoiceNumber: "INV-2026-8841",
        invoiceDate: "2026-10-24",
        totalAmount: "₹45,000",
        detectedCategory: "Water Infrastructure",
        expectedCategory: "Water Infrastructure",
        categoryMatch: true,
        sha256Hash: "0x77d190aa...e90a (MUTATED VIA 2px CROP!)",
        perceptualHash: "a4f09b22c1d88310",
        semanticNullifier: "0x6e21a9b8d4c177e091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708",
        isDuplicateNullifier: true,
        duplicatePoolSource: "Donor_Pool_A (Clean Water Fund)",
        isPerceptualClone: true,
        hammingDistance: 2,
        elaAnomalyScore: 38.7,
        elaHeatmapBase64: FORGED_ELA_HEATMAP_DATA_URI,
        merkleRoot: "0x55a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f",
        merkleLeaves: [
          { label: "Vendor Tax ID (Public)", value: "GSTIN-27AAACW1234F1Z5", hash: "0x22c9a1b4...", isRedactedPII: false },
          { label: "Line Item (Public)", value: "HDPE Water Storage Tank 5000L", hash: "0x77e1d2c3...", isRedactedPII: false },
          { label: "Verified Total (Public)", value: "INR 45,000", hash: "0x33f2a1b4...", isRedactedPII: false },
          { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Wardha Rural Cluster #2]", hash: "0x88a9b0c1...", isRedactedPII: true },
        ],
        verdict: "FROZEN_DOUBLE_SPEND",
        escrowFrozen: true,
        failureReason:
          "NGO cropped image by 2px to mutate SHA-256, but Semantic Nullifier & pHash (Hamming Dist = 2 < 5 threshold) proved this exact invoice was already claimed in Donor_Pool_A!",
      },
    ],
  },
  BATCH_30_PERCENT_FORGERY: {
    escrowState: {
      status: "FROZEN",
      balance_eth: 50.0,
      released_eth: 10.0,
      earmark: "Water Infrastructure",
      frozen_reason:
        "CRITICAL: 30% Forgery Rate Detected in Batch #42 (3/10 receipts failed ELA pixel tampering & category audit). Smart Contract Escrow locked on-chain.",
      last_tx_hash: "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899",
    },
    receipts: [
      {
        receiptId: "BATCH-REC-03",
        vendorName: "Vidarbha Water Works #3",
        vendorTaxId: "GSTIN-27VWW003Z",
        invoiceNumber: "INV-2026-5503",
        invoiceDate: "2026-10-25",
        totalAmount: "₹3,85,000 (DOCTORED)",
        detectedCategory: "Water Infrastructure",
        expectedCategory: "Water Infrastructure",
        categoryMatch: true,
        sha256Hash: "0x4b1399a2...88f3",
        perceptualHash: "99a01b3c44d2e103",
        semanticNullifier: "0x7a8b9c0d1e2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
        isDuplicateNullifier: false,
        duplicatePoolSource: null,
        isPerceptualClone: false,
        hammingDistance: 30,
        elaAnomalyScore: 38.7,
        elaHeatmapBase64: FORGED_ELA_HEATMAP_DATA_URI,
        merkleRoot: "0x99112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
        merkleLeaves: [
          { label: "Vendor Tax ID (Public)", value: "GSTIN-27VWW003Z", hash: "0x99a1b2c3...", isRedactedPII: false },
          { label: "Line Item (Public)", value: "Borewell Casing Pipe", hash: "0x88b2c3d4...", isRedactedPII: false },
          { label: "Verified Total (Public)", value: "₹3,85,000 (DOCTORED)", hash: "0x77c3d4e5...", isRedactedPII: false },
          { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Beneficiary Group 3]", hash: "0x66d4e5f6...", isRedactedPII: true },
        ],
        verdict: "FROZEN_FORGERY",
        escrowFrozen: true,
        failureReason: "ELA High-Compression Pixel Anomaly (38.7 > 15.0) detected around total amount digits.",
      },
    ],
  },
};

export default function RedTeamPage() {
  const ledger = useLedger();
  const [activeScenario, setActiveScenario] = useState<string>("CROSS_DONOR_DOUBLE_SPEND");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentAudit, setCurrentAudit] = useState<{
    escrowState: EscrowState;
    receipts: ReceiptAudit[];
  }>(OFFLINE.CROSS_DONOR_DOUBLE_SPEND);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScenario = async (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("scenario", scenarioKey);
      const res = await fetch("http://127.0.0.1:8000/api/red-team/simulate-scenario", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentAudit(data);
        if (data.escrowState.status === "FROZEN") {
          ledger.freezeEscrow(data.escrowState.frozen_reason || "Adversarial attack detected");
        } else {
          ledger.unfreezeEscrow();
        }
      } else {
        const fallback = OFFLINE[scenarioKey] || OFFLINE.VALID_MILESTONE;
        setCurrentAudit(fallback);
        if (fallback.escrowState.status === "FROZEN") {
          ledger.freezeEscrow(fallback.escrowState.frozen_reason || "Adversarial attack detected");
        } else {
          ledger.unfreezeEscrow();
        }
      }
    } catch {
      const fallback = OFFLINE[scenarioKey] || OFFLINE.VALID_MILESTONE;
      setCurrentAudit(fallback);
      if (fallback.escrowState.status === "FROZEN") {
        ledger.freezeEscrow(fallback.escrowState.frozen_reason || "Adversarial attack detected");
      } else {
        ledger.unfreezeEscrow();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("vendor_name", "Live Uploaded Vendor");
      form.append("vendor_tax_id", "GSTIN-27LIVE9900Z");
      form.append("invoice_no", "INV-2026-LIVE");
      form.append("amount", "85000");
      form.append("category", "Water Infrastructure");

      const res = await fetch("http://127.0.0.1:8000/api/red-team/upload-custom", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentAudit(data);
        setActiveScenario("CUSTOM_UPLOAD");
      }
    } catch {
      alert("Live upload requires Python Verifier API on port 8000. Displaying simulated offline preview.");
    } finally {
      setLoading(false);
    }
  };

  const receipt = currentAudit.receipts[0];
  const isFrozen = currentAudit.escrowState.status === "FROZEN";

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-8">
        
        {/* Top Header Badge & Title */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-brutal-red border border-black animate-pulse" />
            <span className="font-heading font-black text-xs uppercase tracking-tight">
              FEATURE #1 // ADVERSARIAL STRESS-TEST &amp; ESCROW AUTO-FREEZE LAB
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-black">
              RED-TEAM STRESS LAB
            </h1>
            <p className="font-mono text-xs sm:text-sm text-black/70 max-w-xl">
              Inject adversarial fraud vectors. Verify instant opcode-level smart contract freezing without human auditor delays.
            </p>
          </div>
        </div>

        {/* ── Scenario Selection Tactile Buttons Row ──────────── */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => loadScenario("VALID_MILESTONE")}
            className={`btn-brutal text-xs font-heading font-black px-4 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "VALID_MILESTONE"
                ? "bg-charcoal text-white"
                : "bg-white text-black hover:bg-sage"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-brutal-green" />
            <span>1. CLEAN PROOF (PASS)</span>
          </button>

          <button
            onClick={() => loadScenario("CROSS_DONOR_DOUBLE_SPEND")}
            className={`btn-brutal text-xs font-heading font-black px-4 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "CROSS_DONOR_DOUBLE_SPEND"
                ? "bg-charcoal text-white"
                : "bg-white text-black hover:bg-sage"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>2. 2px CROP DOUBLE-SPEND (FREEZE)</span>
          </button>

          <button
            onClick={() => loadScenario("BATCH_30_PERCENT_FORGERY")}
            className={`btn-brutal text-xs font-heading font-black px-4 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "BATCH_30_PERCENT_FORGERY"
                ? "bg-charcoal text-white"
                : "bg-white text-black hover:bg-sage"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-brutal-red" />
            <span>3. 30% FORGED BATCH (FREEZE)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`btn-brutal text-xs font-heading font-black px-4 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "CUSTOM_UPLOAD"
                ? "bg-charcoal text-white"
                : "bg-primary text-black hover:bg-yellow-300"
            }`}
          >
            <Upload className="w-4 h-4 text-black" />
            <span>4. UPLOAD LIVE INVOICE (REAL ELA)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* ── Main Stage Grid (Forensic Window + Escrow Shield) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Forensic Evidence Suite (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {receipt && (
              <ForensicDocumentAuditor
                receipt={receipt}
                activeScenario={activeScenario}
              />
            )}

            {/* Comparative Hash Collision Matrix */}
            <div className="card-brutal p-5 bg-white flex flex-col gap-3">
              <h3 className="font-heading font-black text-sm text-black uppercase tracking-tight">
                CRYPTOGRAPHIC INVARIANT COMPARISON
              </h3>

              <div className="border-2 border-black rounded-xl overflow-hidden shadow-brutal-sm">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <tbody className="divide-y-2 divide-black">
                    <tr className="bg-white">
                      <td className="p-3 font-bold text-black/70 w-1/3">Raw File SHA-256</td>
                      <td className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-black">{receipt?.sha256Hash}</span>
                          {activeScenario === "CROSS_DONOR_DOUBLE_SPEND" && (
                            <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded border border-black shrink-0">
                              MUTATED 2px CROP
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="bg-sage/20">
                      <td className="p-3 font-bold text-black/70">64-bit DCT pHash</td>
                      <td className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-black">{receipt?.perceptualHash}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border border-black shrink-0 ${
                              (receipt?.hammingDistance || 0) <= 5
                                ? "bg-brutal-red text-white"
                                : "bg-sage text-black"
                            }`}
                          >
                            DISTANCE = {receipt?.hammingDistance}{" "}
                            {receipt?.hammingDistance && receipt.hammingDistance <= 5
                              ? "(VISUAL CLONE!)"
                              : "(NO CLONE)"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr className="bg-white">
                      <td className="p-3 font-bold text-black/70">Semantic Nullifier</td>
                      <td className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-black truncate max-w-xs">
                            {receipt?.semanticNullifier}
                          </span>
                          {receipt?.isDuplicateNullifier && (
                            <span className="bg-brutal-red text-white text-[10px] font-bold px-2 py-0.5 rounded border border-black shrink-0 uppercase">
                              COLLISION WITH POOL A
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Escrow Reaction & ZK Shield (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Escrow State Banner Box */}
            <div className={`border-2 border-black rounded-2xl p-6 shadow-brutal-lg flex flex-col gap-4 ${
              isFrozen ? "bg-brutal-red text-white" : "bg-white text-black"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded border border-black bg-white text-black uppercase">
                  ON-CHAIN ESCROW REACTION
                </span>
                <span className={`w-3 h-3 rounded-full border border-black ${isFrozen ? "bg-white animate-ping" : "bg-brutal-green"}`} />
              </div>

              <div className="flex flex-col">
                <div className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-tighter">
                  {isFrozen ? "ESCROW FROZEN" : "ESCROW ACTIVE"}
                </div>
                <div className="text-xs font-mono font-bold opacity-80 pt-1">
                  Vault Protected: {currentAudit.escrowState.balance_eth} ETH ($160,000 USD)
                </div>
              </div>

              {receipt?.failureReason && (
                <div className="border-2 border-black rounded-xl p-3 bg-white text-black font-mono text-xs leading-relaxed">
                  <div className="font-heading font-black text-sm uppercase text-brutal-red pb-1">
                    AUTONOMOUS CIRCUIT BREAKER TRIPPED:
                  </div>
                  {receipt.failureReason}
                </div>
              )}

              <div className="pt-2 border-t border-black/20 flex items-center justify-between font-mono text-xs">
                <span>Contract Earmark:</span>
                <span className="font-bold">{currentAudit.escrowState.earmark}</span>
              </div>
            </div>

            {/* Salted Merkle Tree Card (142 Household Shield) */}
            <div className="card-brutal p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-black" />
                  <h3 className="font-heading font-black text-lg text-black uppercase">
                    SALTED MERKLE PRIVACY SHIELD
                  </h3>
                </div>
                <span className="bg-sage text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-black">
                  0 BYTES LEAKED
                </span>
              </div>

              <p className="font-body text-xs text-black/80">
                Beneficiary IDs, bank UTRs, and phone numbers are salted off-chain. Only the 32-byte Merkle root is committed on-chain.
              </p>

              <div className="flex flex-col gap-2 font-mono text-xs">
                {receipt?.merkleLeaves?.map((leaf, idx) => (
                  <div
                    key={idx}
                    className={`border-2 border-black rounded-lg p-2.5 flex items-center justify-between gap-2 ${
                      leaf.isRedactedPII ? "bg-sage/40 font-bold" : "bg-white"
                    }`}
                  >
                    <div>
                      <div className="text-[10px] text-black/60 uppercase">{leaf.label}</div>
                      <div className="text-xs text-black truncate max-w-[200px]">{leaf.value}</div>
                    </div>
                    <span className="text-[10px] bg-primary px-1.5 py-0.5 rounded border border-black font-bold">
                      {leaf.hash}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-primary/20 border-2 border-black rounded-lg p-3 font-mono text-[11px] truncate">
                <span className="text-black/60 font-bold">ON-CHAIN MERKLE ROOT: </span>
                <span className="font-extrabold text-black">{receipt?.merkleRoot}</span>
              </div>
            </div>

          </div>

        </div>

        {/* ── Bottom Section: Monte Carlo Runner & Quorum Panel ── */}
        <AdversarialMonteCarloRunner />
        <DecentralizedQuorumPanel escrowStatus={currentAudit.escrowState.status} activeScenario={activeScenario} />

      </div>
    </div>
  );
}
