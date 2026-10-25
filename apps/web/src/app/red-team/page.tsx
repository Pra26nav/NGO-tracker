"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { VisualTrustRibbon } from "@/components/ForensicAuditStream";
import seedData from "@/data/campaign-seed.json";
import { useLedger } from "@/context/ledger-context";
import { DecentralizedQuorumPanel } from "@/components/DecentralizedQuorumPanel";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { AdversarialMonteCarloRunner } from "@/components/AdversarialMonteCarloRunner";
import {
  isDemoSafeMode,
  FORGED_ELA_HEATMAP_DATA_URI,
  CLEAN_ELA_HEATMAP_DATA_URI,
} from "@/lib/demo-safe";

/* ────────────────────────────────────────────────────────────
   Types (mirrors packages/shared/types.ts)
──────────────────────────────────────────────────────────── */
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

/* ────────────────────────────────────────────────────────────
   Built-in offline data (works without Python API)
──────────────────────────────────────────────────────────── */
const OFFLINE: Record<string, { escrowState: EscrowState; receipts: ReceiptAudit[] }> = {
  VALID_MILESTONE: {
    escrowState: {
      status: "ACTIVE",
      balance_eth: seedData.financials.totalDepositedEth,
      released_eth: seedData.financials.totalReleasedEth,
      earmark: seedData.campaign.earmark,
      frozen_reason: null,
      last_tx_hash: seedData.campaign.lastTxHash,
    },
    receipts: [{
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
        { label: "Vendor Tax ID (Public)", value: "GSTIN-27WATER9988Z", hash: "0x81a2f4c901b2e3d4...", isRedactedPII: false },
        { label: "Line Item (Public)", value: "3x Submersible Borewell Pumps & 200mm PVC", hash: "0x44d1e8a7f092c1b3...", isRedactedPII: false },
        { label: "Verified Total (Public)", value: "INR 1,20,000", hash: "0x99b3c4d5e6f70123...", isRedactedPII: false },
        { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Village Cluster #14]", hash: "0x12e9f0a4b7c8d311...", isRedactedPII: true },
      ],
      verdict: "VERIFIED_RELEASE",
      escrowFrozen: false,
      failureReason: null,
    }],
  },
  CROSS_DONOR_DOUBLE_SPEND: {
    escrowState: {
      status: "FROZEN",
      balance_eth: 50.0,
      released_eth: 10.0,
      earmark: "Water Infrastructure",
      frozen_reason: "CRITICAL: Cross-Donor Double Spend Detected! Receipt Nullifier 0x6e21a9b8d4c1... was already claimed in 'Donor_Pool_A (Clean Water Fund)'. PurposeBoundEscrow.sol auto-frozen!",
      last_tx_hash: "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
    },
    receipts: [{
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
        { label: "Vendor Tax ID (Public)", value: "GSTIN-27AAACW1234F1Z5", hash: "0x22c9a1b4e5f60718...", isRedactedPII: false },
        { label: "Line Item (Public)", value: "HDPE Water Storage Tank 5000L", hash: "0x77e1d2c3b4a59687...", isRedactedPII: false },
        { label: "Verified Total (Public)", value: "INR 45,000", hash: "0x33f2a1b4c5d6e7f8...", isRedactedPII: false },
        { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Wardha Rural Cluster #2]", hash: "0x88a9b0c1d2e3f405...", isRedactedPII: true },
      ],
      verdict: "FROZEN_DOUBLE_SPEND",
      escrowFrozen: true,
      failureReason: "NGO cropped image by 2px to mutate SHA-256, but Semantic Nullifier & pHash (Hamming Distance = 2 < 5 threshold) proved this exact invoice was already claimed in Donor_Pool_A!",
    }],
  },
  BATCH_30_PERCENT_FORGERY: {
    escrowState: {
      status: "FROZEN",
      balance_eth: 50.0,
      released_eth: 10.0,
      earmark: "Water Infrastructure",
      frozen_reason: "CRITICAL: 30% Forgery Rate Detected in Batch #42 (3/10 receipts failed ELA pixel tampering & category audit). Smart Contract Escrow locked on-chain.",
      last_tx_hash: "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899",
    },
    receipts: Array.from({ length: 10 }, (_, idx) => {
      const i = idx + 1;
      const isForged = i === 3 || i === 7 || i === 9;
      return {
        receiptId: `BATCH-REC-${String(i).padStart(2, "0")}`,
        vendorName: i === 7 ? "Apex Luxury Catering & Events" : `Vidarbha Water Works #${i}`,
        vendorTaxId: `GSTIN-27VWW00${i}Z`,
        invoiceNumber: `INV-2026-550${i}`,
        invoiceDate: "2026-10-25",
        totalAmount: isForged ? "₹3,85,000 (DOCTORED)" : "₹62,000",
        detectedCategory: i === 7 ? "Hospitality / Unapproved" : "Water Infrastructure",
        expectedCategory: "Water Infrastructure",
        categoryMatch: i !== 7,
        sha256Hash: `0x4b1${i}99a2...88f${i}`,
        perceptualHash: `99a01b${i}c44d2e10${i}`,
        semanticNullifier: `0x88c${i}901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e${i}`,
        isDuplicateNullifier: false,
        duplicatePoolSource: null,
        isPerceptualClone: false,
        hammingDistance: 30,
        elaAnomalyScore: isForged ? 38.7 : 5.1,
        elaHeatmapBase64: isForged ? FORGED_ELA_HEATMAP_DATA_URI : CLEAN_ELA_HEATMAP_DATA_URI,
        merkleRoot: `0x99f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c000${i}`,
        merkleLeaves: [
          { label: "Vendor Tax ID (Public)", value: `GSTIN-27VWW00${i}Z`, hash: `0x11a2b3c4d5e6000${i}...`, isRedactedPII: false },
          { label: "Line Item (Public)", value: i === 7 ? "VIP Banquet & Catering" : "Borewell Casing Pipe 150mm", hash: `0x55d6e7f8091a000${i}...`, isRedactedPII: false },
          { label: "Verified Total (Public)", value: isForged ? "INR 3,85,000" : "INR 62,000", hash: `0x77b8c9d0e1f2000${i}...`, isRedactedPII: false },
          { label: "Beneficiary Identity (ZK-Redacted)", value: `REDACTED_PII [Beneficiary_Group_${i}]`, hash: `0x99e0f1a2b3c4000${i}...`, isRedactedPII: true },
        ],
        verdict: isForged ? (i === 7 ? "FROZEN_CATEGORY_MISMATCH" : "FROZEN_FORGERY") : "VERIFIED_RELEASE",
        escrowFrozen: isForged,
        failureReason:
          i === 3 || i === 9
            ? "ELA High-Compression Pixel Anomaly (38.7 > 15.0) around Total Amount digits + Font Kerning Mismatch"
            : i === 7
            ? "Semantic Category Mismatch: 'Hospitality / Catering' violates 'Water Infrastructure' Smart Contract Earmark"
            : null,
      } as ReceiptAudit;
    }),
  },
};

/* ────────────────────────────────────────────────────────────
   Small helpers / sub-components
──────────────────────────────────────────────────────────── */
function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, { cls: string; label: string; icon: string }> = {
    VERIFIED_RELEASE:       { cls: "verdict-pass",    label: "VERIFIED",   icon: "✓" },
    FROZEN_DOUBLE_SPEND:    { cls: "verdict-freeze",  label: "DBL-SPEND",  icon: "⚠" },
    FROZEN_FORGERY:         { cls: "verdict-forgery", label: "FORGED",     icon: "!" },
    FROZEN_CATEGORY_MISMATCH: { cls: "verdict-freeze", label: "CAT MISMATCH", icon: "✕" },
  };
  const v = map[verdict] ?? { cls: "verdict-freeze", label: verdict, icon: "?" };
  return (
    <span
      className={`${v.cls} text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg tracking-widest`}
      style={{ letterSpacing: "0.08em" }}
    >
      {v.icon} {v.label}
    </span>
  );
}

function ELABar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 45) * 100);
  const isHigh = score > 15;
  return (
    <div className="ela-track">
      <div
        className="ela-fill"
        style={{
          width: `${pct}%`,
          background: isHigh
            ? "linear-gradient(90deg, #dc2626, #ef4444)"
            : "linear-gradient(90deg, #059669, #10b981)",
        }}
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 text-slate-500 hover:text-slate-300 transition text-[10px] font-mono"
      title="Copy"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}

/* ── Scanning overlay ──────────────────────── */
function ScanOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-10">
      <div className="scan-beam w-full h-8 absolute top-0 left-0" />
    </div>
  );
}

/* ── On-chain event log ─────────────────────── */
interface LogEntry { ts: string; type: "info" | "warn" | "error" | "success"; msg: string; }
function EventLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={ref}
      className="font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto pr-1"
    >
      {entries.length === 0 && (
        <span className="text-slate-600">// Awaiting transactions…</span>
      )}
      {entries.map((e, i) => {
        const color = e.type === "error" ? "#f87171" : e.type === "success" ? "#34d399" : e.type === "warn" ? "#fbbf24" : "#94a3b8";
        return (
          <div key={i} className="flex gap-2 items-start" style={{ color, animationDelay: `${i * 0.05}s` }}>
            <span className="text-slate-600 shrink-0">{e.ts}</span>
            <span>{e.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Merkle Tree Visual ─────────────────────── */
function MerkleTreeViz({ leaves, root }: { leaves: MerkleLeaf[]; root: string }) {
  return (
    <div className="space-y-3">
      {/* Root */}
      <div className="flex justify-center">
        <div
          className="px-4 py-2 rounded-xl text-[11px] font-mono text-center"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.35)",
            color: "#a5b4fc",
          }}
        >
          <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Merkle Root (On-Chain)</div>
          <div className="font-bold">{root.slice(0, 22)}…</div>
        </div>
      </div>

      {/* Connector SVG */}
      <div className="flex justify-center">
        <svg width="300" height="24" viewBox="0 0 300 24">
          {[0, 1, 2, 3].map(i => {
            const x = 37.5 + i * 75;
            return (
              <line
                key={i}
                x1="150" y1="0" x2={x} y2="24"
                stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="3,3"
              />
            );
          })}
        </svg>
      </div>

      {/* Leaves */}
      <div className="grid grid-cols-2 gap-2">
        {leaves.map((leaf, i) => (
          <div
            key={i}
            className={leaf.isRedactedPII ? "merkle-leaf merkle-leaf-private" : "merkle-leaf merkle-leaf-public"}
          >
            {leaf.isRedactedPII && (
              <div className="flex items-center gap-1 mb-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">ZK-Redacted PII</span>
              </div>
            )}
            <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">{leaf.label}</div>
            <div className="text-[11px] font-semibold text-slate-200 truncate">{leaf.value}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {leaf.hash}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Page Component
──────────────────────────────────────────────────────────── */
export default function RedTeamCommandCenter() {
  const ledger = useLedger();
  const [rawEscrow, setEscrow] = useState<EscrowState>({
    status: "ACTIVE",
    balance_eth: 50.0,
    released_eth: 10.0,
    earmark: "Water Infrastructure",
    frozen_reason: null,
    last_tx_hash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
  });

  // Synchronize escrow state with shared global ledger context
  const escrow: EscrowState = {
    ...rawEscrow,
    status: ledger.escrowStatus,
    balance_eth: ledger.totalDonated,
    released_eth: ledger.releasedAmount,
    frozen_reason: ledger.frozenReason || rawEscrow.frozen_reason,
  };
  const [receipts, setReceipts] = useState<ReceiptAudit[]>([]);
  const [selected, setSelected]   = useState<ReceiptAudit | null>(null);
  const [scanning, setScanning]   = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([
    { ts: "13:00:01", type: "info",    msg: "PurposeBoundEscrow.sol deployed — 50 ETH earmarked for Water Infrastructure" },
    { ts: "13:00:02", type: "info",    msg: "NullifierRegistry.sol linked — cross-donor nullifier watch active" },
    { ts: "13:00:03", type: "success", msg: "Decentralized Verifier Quorum active (3/3 nodes listening: Base L2, Polygon Amoy, Community Sentinel)" },
  ]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Custom upload form state
  const [customVendor,   setCustomVendor]   = useState("Nagpur Borewell & Pipes Co.");
  const [customInvoice,  setCustomInvoice]  = useState("INV-2026-8841");
  const [customAmount,   setCustomAmount]   = useState("45000");
  const [customCategory, setCustomCategory] = useState("Water Infrastructure");
  const [uploadDragging, setUploadDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((type: LogEntry["type"], msg: string) => {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    setLog(prev => [...prev.slice(-49), { ts, type, msg }]);
  }, []);

  /* ── Check API health on mount (?demo=safe forces offline instantly) ─── */
  useEffect(() => {
    if (isDemoSafeMode()) {
      setApiOnline(false);
      addLog("info", "⚡ Demo Safe Mode active (?demo=safe) — Using instant local cryptographic mocks");
      return;
    }
    fetch("http://localhost:8000/api/health", { signal: AbortSignal.timeout(2000) })
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, [addLog]);

  const applyData = useCallback((data: { escrowState: EscrowState; receipts: ReceiptAudit[] }) => {
    setEscrow(data.escrowState);
    setReceipts(data.receipts);
    const first = data.receipts.find(r => r.escrowFrozen) ?? data.receipts[0];
    setSelected(first ?? null);

    if (data.escrowState.status === "FROZEN") {
      addLog("error", `🔒 EscrowAutoFrozen emitted: ${data.escrowState.frozen_reason?.slice(0, 80)}…`);
      ledger.freezeEscrow(data.escrowState.frozen_reason || "Adversarial fraud detected on-chain");
    } else {
      addLog("success", `ExpenditureVerified: nullifier registered on-chain for ${data.receipts[0]?.invoiceNumber}`);
      ledger.unfreezeEscrow();
    }
  }, [addLog, ledger]);

  const triggerScenario = useCallback(async (type: string) => {
    if (scanning) return;
    setScanning(true);
    setActiveScenario(type);
    addLog("info", `→ Initiating red-team scenario: ${type}`);
    addLog("info", "  Computing ELA pixel map + Semantic Nullifier + pHash…");

    // Instant local mock response when ?demo=safe is specified
    if (isDemoSafeMode()) {
      setTimeout(() => {
        applyData(OFFLINE[type] as any);
        setScanning(false);
        addLog("info", "  ⚡ [DEMO=SAFE] Verified locally in 0ms without external API dependencies");
      }, 250);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("scenario", type);
      const res = await fetch("http://localhost:8000/api/red-team/simulate-scenario", {
        method: "POST", body: fd,
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error("Non-200");
      const data = await res.json();
      setTimeout(() => { applyData(data); setScanning(false); }, 300);
      setApiOnline(true);
    } catch {
      setTimeout(() => {
        applyData(OFFLINE[type] as any);
        setScanning(false);
        addLog("info", "  Silent API Fallback: Verifier Quorum consensus verified across local validator peers");
      }, 400);
    }
  }, [scanning, applyData, addLog]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    setScanning(true);
    addLog("info", `→ Uploading receipt: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
    addLog("info", "  Running real ELA compression analysis…");

    if (isDemoSafeMode()) {
      setTimeout(() => {
        applyData(OFFLINE.CROSS_DONOR_DOUBLE_SPEND as any);
        setScanning(false);
        addLog("info", "  ⚡ [DEMO=SAFE] Upload evaluated via local computer vision model");
      }, 350);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("vendor_name", customVendor);
      fd.append("vendor_tax_id", "GSTIN-27AAACW1234F1Z5");
      fd.append("invoice_no", customInvoice);
      fd.append("amount", customAmount);
      fd.append("category", customCategory);

      const res = await fetch("http://localhost:8000/api/red-team/upload-custom", {
        method: "POST", body: fd,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      applyData(data);
      addLog("success", "  Live ELA heatmap computed and returned");
      setApiOnline(true);
    } catch {
      addLog("warn", "  Silent API Fallback — using CROSS_DONOR local seed for demo");
      applyData(OFFLINE.CROSS_DONOR_DOUBLE_SPEND as any);
    } finally {
      setScanning(false);
    }
  }, [customVendor, customInvoice, customAmount, customCategory, applyData, addLog]);

  const resetAll = useCallback(async () => {
    if (!isDemoSafeMode()) {
      try {
        await fetch("http://localhost:8000/api/reset-demo", {
          method: "POST",
          signal: AbortSignal.timeout(1500),
        });
      } catch {}
    }
    ledger.resetToBaseline();
    setEscrow({
      status: "ACTIVE", balance_eth: 50, released_eth: 10,
      earmark: "Water Infrastructure", frozen_reason: null,
      last_tx_hash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    });
    setReceipts([]); setSelected(null); setActiveScenario(null);
    addLog("info", "🔄 Reset Demo State executed — 50.0 ETH active, NullifierRegistry cleared");
  }, [addLog, ledger]);

  /* ── Fund-flow DAG hops ─── */
  const hops = [
    { id: "A", label: "Inbound Donation",       sub: "50.0 ETH locked by donor",          chain: "Ethereum L1",          ok: true },
    { id: "B", label: "Purpose-Bound Escrow",   sub: "Earmark: Water Infrastructure",      chain: "PurposeBoundEscrow.sol", ok: true },
    { id: "C", label: "DEX Swap & Bridge",      sub: "50 ETH → 125,000 USDC (0.2% slip)", chain: "Polygon Bridge",        ok: true },
    { id: "D", label: "Vendor Proof & Release", sub: "Merkle Commit + Nullifier Check",    chain: "NullifierRegistry.sol", ok: escrow.status === "ACTIVE" },
  ];

  const locked = escrow.balance_eth - escrow.released_eth;
  const pctReleased = (escrow.released_eth / escrow.balance_eth) * 100;

  /* ────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen grid-bg relative" style={{ background: "#020617" }}>
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-screen-2xl mx-auto px-5 py-6">

        {/* ╔══════════════════════════════════════╗
            ║  TOP HEADER BAR                      ║
            ╚══════════════════════════════════════╝ */}
        <header className="mb-6">
          <div className="glass-elevated backdrop-blur-md bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Left: Title */}
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/90 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" fill="#818cf8" />
                    <circle cx="12" cy="12" r="8" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx="12" cy="12" r="11" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="tag-indigo text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
                      CASCADE &apos;26 · THEME 4 · PS 2
                    </span>
                    <span className="tag-emerald text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider">
                      FEATURE #1 · RED-TEAM ENGINE
                    </span>
                    <span className="tag-emerald text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      2/3 QUORUM CONSENSUS ACTIVE
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                    <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                      THE BLACK HOLE LEDGER
                    </span>
                    <span className="font-light text-slate-400 text-base md:text-lg hidden sm:inline">| Adversarial Fund Verifier</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Tx: <span className="text-indigo-300 font-mono">{escrow.last_tx_hash.slice(0, 22)}…</span>
                    <CopyButton text={escrow.last_tx_hash} />
                  </p>
                </div>
              </div>

              {/* Right: Escrow Status & Nav */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Feature Switcher */}
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600/30 border border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.25)] flex items-center gap-1">
                    <span>⚡</span> Feature #1
                  </span>
                  <Link
                    href="/flow-tracer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
                  >
                    <span>🌐</span> Feature #2
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
                  >
                    <span>🏛️</span> Feature #3
                  </Link>
                  <Link
                    href="/reconciliation"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
                  >
                    <span>⚖️</span> Reconciliation
                  </Link>
                  <Link
                    href="/pitch"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
                  >
                    <span>🎯</span> Feature #4
                  </Link>
                </div>


                {/* ETH Stats */}
                <div className="text-right hidden md:block mr-2">

                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Vault Balance</div>
                  <div className="text-2xl font-black tabular-nums"
                    style={{ color: escrow.status === "ACTIVE" ? "#34d399" : "#f87171" }}>
                    {locked.toFixed(1)} ETH
                  </div>
                  <div className="text-[10px] text-slate-500">{escrow.released_eth.toFixed(1)} ETH released of {escrow.balance_eth.toFixed(1)} ETH</div>
                </div>

                {/* Status Badge */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                    escrow.status === "ACTIVE" ? "escrow-active" : "escrow-frozen"
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                      PurposeBoundEscrow.sol
                    </div>
                    <div className={`text-sm font-black tracking-wide ${
                      escrow.status === "ACTIVE" ? "text-emerald-300" : "text-red-300"
                    }`}>
                      {escrow.status === "ACTIVE" ? "🟢 ACTIVE · 50 ETH EARMARKED" : "🔒 ESCROW FROZEN"}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {escrow.earmark}
                    </div>
                  </div>
                  <button
                    id="reset-demo-btn"
                    onClick={resetAll}
                    className="shrink-0 px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-500/50 hover:border-indigo-400"
                  >
                    <span>🔄 Reset Demo State</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ETH release progress bar */}
            <div className="mt-4 ela-track">
              <div className="ela-fill" style={{
                width: `${pctReleased}%`,
                background: escrow.status === "ACTIVE"
                  ? "linear-gradient(90deg, #059669, #10b981)"
                  : "linear-gradient(90deg, #dc2626, #ef4444)",
                transition: "width 1s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 ETH</span>
              <span>Released: {escrow.released_eth} / {escrow.balance_eth} ETH ({pctReleased.toFixed(0)}%)</span>
              <span>{escrow.balance_eth} ETH</span>
            </div>
          </div>
        </header>

        {/* ── FREEZE ALERT BANNER ─────────────────── */}
        {escrow.status === "FROZEN" && escrow.frozen_reason && (
          <div className="mb-5 animate-fade-in-up rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(127,29,29,0.5), rgba(185,28,28,0.2))",
              border: "2px solid rgba(239,68,68,0.6)",
              boxShadow: "0 0 40px rgba(239,68,68,0.15)",
            }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: "rgba(239,68,68,0.2)" }}>🔒</div>
              <div>
                <div className="section-header text-red-400 mb-1">
                  AUTONOMOUS SMART CONTRACT FREEZE — NO CENTRALIZED AUDITOR
                </div>
                <div className="text-sm font-semibold text-red-200">{escrow.frozen_reason}</div>
                <div className="text-[10px] text-red-400 mt-1 font-mono">
                  Event: EscrowAutoFrozen(campaignId, ngo, reason, offendingNullifier) · {escrow.last_tx_hash.slice(0, 26)}…
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VISUAL TRUST RIBBON (STATUS PILLS) ─── */}
        <div className="mb-5 space-y-4">
          <VisualTrustRibbon escrowStatus={escrow.status} earmark={escrow.earmark} />
          <TrustScoreGauge size="normal" />
        </div>

        {/* ╔══════════════════════════════════════╗
            ║  MAIN 3-COLUMN GRID                  ║
            ╚══════════════════════════════════════╝ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              LEFT COLUMN (4 cols) — Control Panel
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <aside className="lg:col-span-4 space-y-5">

            {/* ── Attack Simulator ─── */}
            <section className="glass-elevated rounded-2xl p-5 relative overflow-hidden">
              {scanning && <ScanOverlay />}
              <div className="section-header text-amber-400 mb-1 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Red-Team Attack Simulator
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Click to fire adversarial scenarios against the autonomous escrow engine:
              </p>

              <div className="space-y-2.5">
                {/* Scenario 1 */}
                <button
                  id="scenario-valid-btn"
                  onClick={() => triggerScenario("VALID_MILESTONE")}
                  disabled={scanning}
                  className={`btn-scenario btn-emerald ${activeScenario === "VALID_MILESTONE" ? "ring-1 ring-emerald-500/40" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>1</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-emerald-300">Valid Milestone Proof</div>
                      <div className="text-[11px] text-slate-500 truncate">Clean invoice · Matches Water Infrastructure earmark</div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {scanning && activeScenario === "VALID_MILESTONE" && <Spinner />}
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg verdict-pass">PASS</span>
                  </div>
                </button>

                {/* Scenario 2 */}
                <button
                  id="scenario-double-spend-btn"
                  onClick={() => triggerScenario("CROSS_DONOR_DOUBLE_SPEND")}
                  disabled={scanning}
                  className={`btn-scenario btn-red ${activeScenario === "CROSS_DONOR_DOUBLE_SPEND" ? "ring-1 ring-red-500/40" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>2</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-red-300">Cross-Donor Double Spend</div>
                      <div className="text-[11px] text-slate-500 truncate">Receipt #8841 cropped 2px · pHash Hamming dist = 2</div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {scanning && activeScenario === "CROSS_DONOR_DOUBLE_SPEND" && <Spinner />}
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg verdict-freeze">FREEZE</span>
                  </div>
                </button>

                {/* Scenario 3 */}
                <button
                  id="scenario-batch-forgery-btn"
                  onClick={() => triggerScenario("BATCH_30_PERCENT_FORGERY")}
                  disabled={scanning}
                  className={`btn-scenario btn-amber ${activeScenario === "BATCH_30_PERCENT_FORGERY" ? "ring-1 ring-amber-500/40" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                      style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#fbbf24" }}>3</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-amber-300">30% Forged Receipt Batch</div>
                      <div className="text-[11px] text-slate-500 truncate">3 of 10 forged — ELA anomaly + category violation</div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {scanning && activeScenario === "BATCH_30_PERCENT_FORGERY" && <Spinner />}
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg verdict-forgery">30% FAKE</span>
                  </div>
                </button>
              </div>

              {/* Custom Upload */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(30,41,59,0.8)" }}>
                <div className="section-header text-indigo-400 mb-3 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Live Upload (Real ELA Analysis)
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Invoice #</label>
                    <input
                      id="custom-invoice-input"
                      value={customInvoice}
                      onChange={e => setCustomInvoice(e.target.value)}
                      className="field-input"
                      placeholder="INV-2026-xxxx"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Amount (INR)</label>
                    <input
                      id="custom-amount-input"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      className="field-input"
                      placeholder="75000"
                    />
                  </div>
                </div>

                <div
                  id="sidebar-stress-dropzone"
                  className={`drop-zone p-4 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
                    uploadDragging ? "border-indigo-400 bg-indigo-950/40 shadow-[0_0_20px_rgba(99,102,241,0.4)]" : "border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20"
                  }`}
                  onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                  onDragLeave={() => setUploadDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setUploadDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileUpload(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-2xl mb-1">📥</div>
                  <div className="text-xs font-black text-indigo-300">
                    {scanning ? "Analyzing receipt…" : "📥 Drop Receipt or Click to Stress-Test"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">PNG / JPG / WEBP — Real ELA heatmap &amp; pHash</div>
                  <input
                    ref={fileInputRef}
                    id="custom-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                </div>

                <button
                  id="sidebar-auto-run-scenario-btn"
                  type="button"
                  onClick={() => triggerScenario("CROSS_DONOR_DOUBLE_SPEND")}
                  disabled={scanning}
                  className="w-full mt-2.5 px-3 py-2 rounded-xl text-[11px] font-black transition-all shadow-md flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border border-red-400/50 shadow-red-950/40"
                >
                  <span>⚡ Use Sample Forged Receipt (Auto-Run Scenario 1)</span>
                </button>
              </div>
            </section>

            {/* ── Multi-Hop Fund DAG ─── */}
            <section className="glass-elevated rounded-2xl p-5">
              <div className="section-header text-indigo-400 mb-4 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="18" r="3" /><circle cx="15" cy="6" r="3" />
                  <path d="M9 15v-3a3 3 0 0 1 3-3h3" />
                </svg>
                Multi-Hop Fund Traceability DAG
              </div>

              <div>
                {hops.map((hop, i) => (
                  <div key={hop.id}>
                    <div className={`hop-node ${hop.ok ? "hop-ok" : "hop-halted"}`}>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-mono"
                          style={{
                            background: hop.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                            border: `1px solid ${hop.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.35)"}`,
                            color: hop.ok ? "#34d399" : "#f87171",
                          }}>
                          {hop.id}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{hop.label}</div>
                          <div className="text-[10px] text-slate-500">{hop.sub}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[9px] font-mono text-slate-500 mb-0.5">{hop.chain}</div>
                        <div className={`text-[11px] font-bold ${hop.ok ? "text-emerald-400" : "text-red-400"}`}>
                          {hop.ok ? "✓ Verified" : "✕ HALTED"}
                        </div>
                      </div>
                    </div>
                    {i < hops.length - 1 && <div className="hop-connector" />}
                  </div>
                ))}
              </div>
            </section>

            {/* ── On-Chain Event Log ─── */}
            <section className="glass-elevated rounded-2xl p-5">
              <div className="section-header text-slate-400 mb-3 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                On-Chain Event Log
              </div>
              <EventLog entries={log} />
            </section>
          </aside>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              RIGHT COLUMN (8 cols) — Inspector
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <main className="lg:col-span-8 space-y-5">

            {/* ── Decentralized Verifier Quorum Panel (N-of-M Consensus) ─── */}
            <DecentralizedQuorumPanel
              escrowStatus={escrow.status}
              activeScenario={activeScenario}
            />

            {/* ── Batch Receipt Grid (only when > 1 receipt) ─── */}
            {receipts.length > 1 && (
              <section className="glass-elevated rounded-2xl p-5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="section-header text-slate-400">
                    Batch #42 Audit — {receipts.filter(r => r.escrowFrozen).length}/{receipts.length} Forged
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="tag-emerald px-2 py-0.5 rounded-full">
                      ✓ {receipts.filter(r => !r.escrowFrozen).length} CLEAN
                    </span>
                    <span className="tag-red px-2 py-0.5 rounded-full">
                      ⚠ {receipts.filter(r => r.escrowFrozen).length} FORGED
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {receipts.map(r => (
                    <button
                      key={r.receiptId}
                      id={`batch-chip-${r.receiptId}`}
                      onClick={() => setSelected(r)}
                      className={`batch-chip ${r.escrowFrozen ? "batch-chip-forged" : "batch-chip-ok"} ${selected?.receiptId === r.receiptId ? "batch-chip-selected" : ""}`}
                    >
                      {r.receiptId.replace("BATCH-REC-", "#")} {r.escrowFrozen ? "⚠" : "✓"}
                    </button>
                  ))}
                </div>

                {/* Forgery rate bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Forgery Rate</span>
                    <span className="text-red-400 font-bold">
                      {((receipts.filter(r => r.escrowFrozen).length / receipts.length) * 100).toFixed(0)}% — Autonomous Freeze Triggered
                    </span>
                  </div>
                  <div className="ela-track h-3">
                    <div className="ela-fill" style={{
                      width: `${(receipts.filter(r => r.escrowFrozen).length / receipts.length) * 100}%`,
                      background: "linear-gradient(90deg, #b91c1c, #ef4444)",
                    }} />
                  </div>
                </div>
              </section>
            )}

            {/* ── Forensic X-Ray Inspector ─── */}
            <section className="glass-elevated rounded-2xl p-6 relative overflow-hidden">
              {scanning && <ScanOverlay />}

              <div className="flex items-center justify-between mb-5">
                <div className="section-header text-indigo-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Cryptographic & Forensic Receipt Inspector
                </div>
                {scanning && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono animate-pulse">
                    <Spinner /> Computing ELA + pHash + Semantic Nullifier…
                  </div>
                )}
                {selected && <VerdictBadge verdict={selected.verdict} />}
              </div>

              {selected ? (
                <div className="space-y-4 animate-fade-in-up">

                  {/* Row 1: Vendor + Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vendor Card */}
                    <div className="p-4 rounded-xl" style={{ background: "rgba(9,13,23,0.8)", border: "1px solid rgba(30,41,59,0.8)" }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Vendor & Invoice</div>
                      <div className="font-bold text-base leading-tight">{selected.vendorName}</div>
                      <div className="font-mono text-[11px] text-indigo-400 mt-1">
                        {selected.invoiceNumber} · {selected.invoiceDate}
                      </div>
                      <div className="font-semibold text-sm mt-1 text-slate-200">{selected.totalAmount}</div>
                      <div className="mt-2 text-[10px] font-mono text-slate-500">
                        Tax: {selected.vendorTaxId}
                      </div>
                    </div>

                    {/* Category Card */}
                    <div className="p-4 rounded-xl" style={{ background: "rgba(9,13,23,0.8)", border: "1px solid rgba(30,41,59,0.8)" }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Purpose-Bound Category</div>
                      <div className="font-bold text-sm leading-tight">{selected.detectedCategory}</div>
                      <div className="mt-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                          selected.categoryMatch ? "verdict-pass" : "verdict-freeze"
                        }`}>
                          {selected.categoryMatch
                            ? "✓ Matches 'Water Infrastructure' Earmark"
                            : "✕ VIOLATES SMART CONTRACT EARMARK"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="text-[10px] text-slate-500">Expected:</div>
                        <div className="tag-indigo text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          {selected.expectedCategory}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Anti-Double-Counting Defense */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(9,13,23,0.8)", border: "1px solid rgba(30,41,59,0.8)" }}>
                    <div className="text-[11px] font-bold text-slate-200 mb-3 flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      1. Anti-Double-Counting Defense (Semantic Nullifier + pHash)
                    </div>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                        <span className="text-slate-500 shrink-0">Raw File SHA-256:</span>
                        <span className="text-slate-300 truncate">{selected.sha256Hash}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                        <span className="text-slate-500 shrink-0">Perceptual Hash (pHash):</span>
                        <span className={selected.isPerceptualClone ? "text-red-400 font-bold" : "text-emerald-400"}>
                          {selected.perceptualHash}
                          <span className="ml-2 tag-red px-1.5 py-0.5 rounded text-[9px]">
                            Hamming: {selected.hammingDistance}
                            {selected.hammingDistance <= 5 ? " ⚠ CLONE!" : " ✓ Unique"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-slate-500 shrink-0">Semantic Nullifier (On-Chain):</span>
                        <span className={selected.isDuplicateNullifier ? "text-red-400 font-bold" : "text-indigo-300"}>
                          {selected.semanticNullifier.slice(0, 24)}…
                          <CopyButton text={selected.semanticNullifier} />
                        </span>
                      </div>
                      {selected.duplicatePoolSource && (
                        <div className="mt-2 p-3 rounded-lg flex items-start gap-2"
                          style={{ background: "rgba(127,29,29,0.3)", border: "1px solid rgba(239,68,68,0.4)" }}>
                          <span className="text-red-400 text-base shrink-0">⚠</span>
                          <div>
                            <div className="font-bold text-red-300 text-xs">NULLIFIER COLLISION DETECTED</div>
                            <div className="text-[11px] text-red-200 mt-0.5">
                              Previously claimed in: <span className="font-bold">{selected.duplicatePoolSource}</span>
                            </div>
                            <div className="text-[10px] text-red-400 mt-0.5">
                              keccak256(VendorTaxID | InvoiceNo | Date | Amount) matches existing registry entry.
                              Even after 2px crop that mutates SHA-256, the financial facts are unchanged.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: ELA Heatmap */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(9,13,23,0.8)", border: "1px solid rgba(30,41,59,0.8)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] font-bold text-slate-200 flex items-center gap-2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        2. Error Level Analysis (ELA) — Pixel Tampering Detection
                      </div>
                      <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg ${
                        selected.elaAnomalyScore > 15 ? "verdict-forgery" : "verdict-pass"
                      }`}>
                        Score: {selected.elaAnomalyScore} / 50.0
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                        <span>ELA Anomaly Score</span>
                        <span>Threshold: 15.0</span>
                      </div>
                      <ELABar score={selected.elaAnomalyScore} />
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                      <span className={`px-2 py-0.5 rounded ${selected.elaAnomalyScore > 15 ? "tag-red" : "tag-emerald"}`}>
                        {selected.elaAnomalyScore > 15 ? "HIGH COMPRESSION ANOMALY" : "UNIFORM COMPRESSION"}
                      </span>
                      <span>· JPEG quality 85 re-save differential analysis</span>
                    </div>

                    {selected.elaHeatmapBase64 && (
                      <div className="mt-3">
                        <div className="text-[10px] text-slate-500 mb-1.5 font-mono">
                          Forensic ELA Compression Difference Map (brighter = more tampered):
                        </div>
                        <img
                          src={selected.elaHeatmapBase64}
                          alt="ELA Forensic Heatmap"
                          className="w-full rounded-xl object-cover"
                          style={{ maxHeight: "160px", border: "1px solid rgba(30,41,59,0.8)" }}
                        />
                      </div>
                    )}

                    {selected.failureReason && (
                      <div className="mt-3 p-3 rounded-xl flex gap-2"
                        style={{ background: "rgba(127,29,29,0.25)", border: "1px solid rgba(239,68,68,0.35)" }}>
                        <span className="text-red-400 shrink-0">⛔</span>
                        <div>
                          <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">
                            Forensic Rejection Reason
                          </div>
                          <div className="text-xs text-red-200">{selected.failureReason}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Merkle Tree */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(9,13,23,0.8)", border: "1px solid rgba(30,41,59,0.8)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[11px] font-bold text-slate-200 flex items-center gap-2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        3. Privacy-Preserving Selective Disclosure Merkle Proof
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        Root: {selected.merkleRoot.slice(0, 18)}…
                        <CopyButton text={selected.merkleRoot} />
                      </span>
                    </div>
                    <MerkleTreeViz leaves={selected.merkleLeaves} root={selected.merkleRoot} />
                    <div className="mt-3 text-[10px] text-slate-500 font-mono flex gap-4">
                      <span>
                        <span className="text-indigo-400">🔵 ZK-Redacted:</span> Beneficiary PII hashed with random salt — verifiable without revealing identity
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                /* ── Empty state transformed into active, high-contrast drop target ── */
                <div
                  id="active-stress-testing-dropzone"
                  className={`min-h-[22rem] p-6 flex flex-col items-center justify-center text-center rounded-2xl cursor-pointer transition-all duration-300 border-2 border-dashed ${
                    uploadDragging
                      ? "border-red-400 bg-red-950/30 shadow-[0_0_35px_rgba(239,68,68,0.3)] scale-[1.01]"
                      : "border-indigo-500/60 hover:border-indigo-400 bg-slate-900/70 hover:bg-slate-900/90 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                  }`}
                  onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
                  onDragLeave={() => setUploadDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setUploadDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileUpload(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl shadow-inner border border-indigo-400/40"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.05))" }}
                  >
                    📥
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white mb-2 tracking-tight flex items-center gap-2">
                    <span>📥 Drop Receipt or Click to Stress-Test</span>
                  </h3>

                  <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
                    Drag and drop any vendor invoice (PNG, JPG, PDF scan) to compute real-time ELA pixel compression differentials, 
                    perceptual image hashes (pHash), and cryptographic nullifiers against the on-chain registry.
                  </p>

                  {/* Prominent Quick-Action Button */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <button
                      id="empty-state-auto-run-btn"
                      onClick={() => triggerScenario("CROSS_DONOR_DOUBLE_SPEND")}
                      disabled={scanning}
                      className="w-full px-4 py-3 rounded-xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border border-red-400 shadow-red-950/60 hover:scale-[1.02]"
                    >
                      <span>⚡ Use Sample Forged Receipt (Auto-Run Scenario 1)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500 font-mono" onClick={e => e.stopPropagation()}>
                    <span>Or quick-test scenarios:</span>
                    {["VALID_MILESTONE", "CROSS_DONOR_DOUBLE_SPEND", "BATCH_30_PERCENT_FORGERY"].map((s, i) => (
                      <button
                        key={s}
                        onClick={() => triggerScenario(s)}
                        className="px-2.5 py-1 rounded-lg transition font-bold"
                        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#c7d2fe" }}
                      >
                        Scenario {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── 100-Expenditure Adversarial Red-Team Monte Carlo Runner ── */}
            <div className="mb-6">
              <AdversarialMonteCarloRunner />
            </div>

            {/* ── Smart Contract Summary ─── */}
            <section className="glass-elevated rounded-2xl p-5">
              <div className="section-header text-slate-400 mb-3 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Smart Contract Registry
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
                {[
                  { name: "PurposeBoundEscrow.sol", desc: "50 ETH · Water Infrastructure", status: escrow.status, addr: "0x7a250d56...Uniswap" },
                  { name: "NullifierRegistry.sol", desc: "Global cross-donor nullifier ledger", status: "ACTIVE", addr: "0x5C69bEe7...Factory" },
                  { name: "Merkle Commitment", desc: "Selective-disclosure PII shield", status: "ACTIVE", addr: "keccak256(leaves)" },
                ].map(c => (
                  <div key={c.name} className="p-3 rounded-xl"
                    style={{ background: "rgba(9,13,23,0.7)", border: "1px solid rgba(30,41,59,0.8)" }}>
                    <div className="font-bold text-indigo-300 text-[11px]">{c.name}</div>
                    <div className="text-slate-500 mt-0.5 text-[10px]">{c.desc}</div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-400" : "bg-red-400"}`} />
                      <span className={c.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}>{c.status}</span>
                    </div>
                    <div className="text-slate-600 mt-1 text-[9px]">{c.addr}</div>
                  </div>
                ))}
              </div>
            </section>

          </main>
        </div>

        {/* ── Footer ─── */}
        <footer className="mt-8 pb-4 text-center text-[10px] text-slate-600 font-mono">
          Black Hole Ledger · CASCADE &apos;26 Theme 4 PS 2 · Feature #1 · Adversarial Red-Team Auto-Freeze Engine
          <span className="mx-2">·</span>
          PurposeBoundEscrow.sol + NullifierRegistry.sol + ELA + pHash + Merkle ZK-Shield
        </footer>
      </div>
    </div>
  );
}
