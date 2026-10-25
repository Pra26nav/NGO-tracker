"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLedger } from "@/context/ledger-context";
import { isDemoSafeMode } from "@/lib/demo-safe";
import {
  Scale,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  FileCode,
  Flame,
  Search,
  RefreshCw,
  Building2,
  FileSearch,
  Download,
  Eye,
  X,
  Maximize2,
} from "lucide-react";

interface ReconciliationItem {
  id: string;
  itemNumber: string;
  title: string;
  claimedAmountInr: number;
  claimedAmountFormatted: string;
  claimedVendor: string;
  claimedCategory: string;
  pdfSource: string;
  pdfPage: number;
  pdfSha256: string;
  claimedPaymentRef: string;
  claimedDate: string;
  
  // On-Chain Reality
  chainTitle: string;
  chainAmountInr: number;
  chainAmountFormatted: string;
  chainAmountEth: number;
  chainVendor: string;
  chainCategoryHash: string;
  chainEarmark: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  nullifier: string;
  chainStatus: "SETTLED" | "BLOCKED_ON_CHAIN" | "NOT_FOUND";
  settlementRail: string;
  
  // Discrepancy details
  hasDiscrepancy: boolean;
  discrepancyType: "INFLATION" | "CATEGORY_MISAPPROPRIATION" | "PHANTOM_INVOICE" | "NONE";
  deltaInr: number;
  diffHighlightText: string;
  auditExplanation: string;
  severity: "CRITICAL" | "HIGH" | "CLEAN";
}

const RECONCILIATION_ITEMS: ReconciliationItem[] = [
  {
    id: "REC-402",
    itemNumber: "#402",
    title: "Expense Item #402: Borewell Deepening & Handpump Assembly",
    claimedAmountInr: 150000,
    claimedAmountFormatted: "₹1,50,000 INR",
    claimedVendor: "Vidarbha Water Works & Drilling Pvt Ltd",
    claimedCategory: "Water Infrastructure",
    pdfSource: "Vidarbha_Water_Project_Annual_Report_2026.pdf",
    pdfPage: 14,
    pdfSha256: "0x7a89e0231b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901199a",
    claimedPaymentRef: "NEFT Wire Transfer - Ref #UTR991823",
    claimedDate: "2026-10-24",

    chainTitle: "Smart Contract Settlement: Tranche 2 Payout",
    chainAmountInr: 120000,
    chainAmountFormatted: "₹1,20,000 INR",
    chainAmountEth: 0.445,
    chainVendor: "Vidarbha Water Works (GSTIN-27VWW002Z)",
    chainCategoryHash: "0x4f8a91b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
    chainEarmark: "Water Infrastructure Only",
    contractAddress: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    txHash: "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
    blockNumber: 20491845,
    nullifier: "0x88c2901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e2",
    chainStatus: "SETTLED",
    settlementRail: "Polygon USDC DEX Off-Ramp ➔ Vendor Current A/C",

    hasDiscrepancy: true,
    discrepancyType: "INFLATION",
    deltaInr: 30000,
    diffHighlightText: "Reported ₹1,50,000 vs. Chain Recorded ₹1,20,000 (🚨 +₹30,000 Unexplained Delta / Over-reporting Flagged)",
    auditExplanation: "The NGO's public PDF claims ₹1,50,000 was disbursed for borewell deepening. However, the cryptographic settlement on Polygon DEX and banking webhook strictly records ₹1,20,000 disbursed to Vidarbha Water Works. The +₹30,000 difference is an unbacked, padded margin.",
    severity: "CRITICAL",
  },
  {
    id: "REC-403",
    itemNumber: "#403",
    title: "Expense Item #403: VIP Stakeholder Banquet Catering",
    claimedAmountInr: 385000,
    claimedAmountFormatted: "₹3,85,000 INR",
    claimedVendor: "Apex Luxury Catering & Hospitality Events",
    claimedCategory: "Water Infrastructure (Disguised in PDF text)",
    pdfSource: "Vidarbha_Water_Project_Annual_Report_2026.pdf",
    pdfPage: 19,
    pdfSha256: "0x7a89e0231b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901199a",
    claimedPaymentRef: "Corporate Debit Card - POS #8831",
    claimedDate: "2026-10-25",

    chainTitle: "On-Chain Smart Contract Rejection",
    chainAmountInr: 0,
    chainAmountFormatted: "₹0.00 INR (Blocked by EVM)",
    chainAmountEth: 0.0,
    chainVendor: "Apex Luxury Catering (Flagged Off-Category)",
    chainCategoryHash: "0x11223344... (Category Hash Mismatch)",
    chainEarmark: "Water Infrastructure Only",
    contractAddress: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    txHash: "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899",
    blockNumber: 20491862,
    nullifier: "0x88c7901f...33e7 (Earmark Violation Nullifier)",
    chainStatus: "BLOCKED_ON_CHAIN",
    settlementRail: "EVM Smart Contract Assertion Halted Outbound Transfer",

    hasDiscrepancy: true,
    discrepancyType: "CATEGORY_MISAPPROPRIATION",
    deltaInr: 385000,
    diffHighlightText: "Published report mentions 'VIP Stakeholder Banquet Catering' under Earmark 'Water Infrastructure' (🚨 Off-Category Misappropriation Detected & Blocked)",
    auditExplanation: "PurposeBoundEscrow.sol enforces that keccak256(category) must equal keccak256('Water Infrastructure'). The NGO published ₹3,85,000 of luxury hotel catering as a project expense in their donor PDF, but the smart contract mathematically blocked payout on-chain.",
    severity: "CRITICAL",
  },
  {
    id: "REC-401",
    itemNumber: "#401",
    title: "Expense Item #401: Geological Water Table Survey & Hydro-Log",
    claimedAmountInr: 62000,
    claimedAmountFormatted: "₹62,000 INR",
    claimedVendor: "Vidarbha Hydrogeology Consultants (GSTIN-27VWW001Z)",
    claimedCategory: "Water Infrastructure",
    pdfSource: "Vidarbha_Water_Project_Annual_Report_2026.pdf",
    pdfPage: 8,
    pdfSha256: "0x7a89e0231b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901199a",
    claimedPaymentRef: "RTGS - Ref #RTGS2026102401",
    claimedDate: "2026-10-24",

    chainTitle: "Smart Contract Settlement: Tranche 1 Mobilization",
    chainAmountInr: 62000,
    chainAmountFormatted: "₹62,000 INR",
    chainAmountEth: 0.23,
    chainVendor: "Vidarbha Geological Consultancy (GSTIN-27VWW001Z)",
    chainCategoryHash: "0x4f8a91b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
    chainEarmark: "Water Infrastructure Only",
    contractAddress: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    txHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    blockNumber: 20491823,
    nullifier: "0x88c1901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e1",
    chainStatus: "SETTLED",
    settlementRail: "Polygon Bridge ➔ Direct Bank Settlement",

    hasDiscrepancy: false,
    discrepancyType: "NONE",
    deltaInr: 0,
    diffHighlightText: "Reported ₹62,000 == Chain Recorded ₹62,000 (✓ Exact 1:1 Reconciled Match) · Category Hash Verified",
    auditExplanation: "Perfect 1:1 match between published PDF report and on-chain verified nullifier record. Zero variance detected.",
    severity: "CLEAN",
  },
  {
    id: "REC-404",
    itemNumber: "#404",
    title: "Expense Item #404: Submersible Motor Spare Units (x4)",
    claimedAmountInr: 88000,
    claimedAmountFormatted: "₹88,000 INR",
    claimedVendor: "Global Agrotech Supplies Ltd",
    claimedCategory: "Water Infrastructure",
    pdfSource: "Vidarbha_Water_Project_Annual_Report_2026.pdf",
    pdfPage: 23,
    pdfSha256: "0x7a89e0231b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901199a",
    claimedPaymentRef: "Cheque #991029 (Claimed Cleared)",
    claimedDate: "2026-10-25",

    chainTitle: "Nullifier Registry Lookup: Zero Settlement Record",
    chainAmountInr: 0,
    chainAmountFormatted: "₹0.00 INR (Phantom Claim)",
    chainAmountEth: 0.0,
    chainVendor: "Vendor Never Settled On-Chain",
    chainCategoryHash: "0x0000000000000000000000000000000000000000",
    chainEarmark: "Water Infrastructure Only",
    contractAddress: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    blockNumber: 0,
    nullifier: "0x00000000... (Unregistered in NullifierRegistry.sol)",
    chainStatus: "NOT_FOUND",
    settlementRail: "No cryptographic settlement exists on Ethereum or Polygon DAG",

    hasDiscrepancy: true,
    discrepancyType: "PHANTOM_INVOICE",
    deltaInr: 88000,
    diffHighlightText: "Reported ₹88,000 vs. Chain Recorded ₹0 (🚨 Phantom Claim: Zero Settled Tx on Polygon/Ethereum)",
    auditExplanation: "The NGO published a ₹88,000 line item in their annual glossy donor report with a fabricated cheque reference. The Nullifier Registry has zero cryptographic proof of payment or DEX conversion for this expenditure.",
    severity: "CRITICAL",
  },
];

export default function ReconciliationPage() {
  const ledger = useLedger();
  const [selectedId, setSelectedId] = useState<string>("REC-402");
  const [filterType, setFilterType] = useState<"ALL" | "DISCREPANCIES" | "MATCHES">("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"ANNOTATED" | "RAW_PDF">("ANNOTATED");

  const selectedItem = useMemo(() => {
    return RECONCILIATION_ITEMS.find((item) => item.id === selectedId) || RECONCILIATION_ITEMS[0];
  }, [selectedId]);

  const filteredItems = useMemo(() => {
    if (filterType === "DISCREPANCIES") {
      return RECONCILIATION_ITEMS.filter((item) => item.hasDiscrepancy);
    }
    if (filterType === "MATCHES") {
      return RECONCILIATION_ITEMS.filter((item) => !item.hasDiscrepancy);
    }
    return RECONCILIATION_ITEMS;
  }, [filterType]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const isFrozen = ledger.escrowStatus === "FROZEN";

  const handleToggleFreeze = () => {
    if (isFrozen) {
      ledger.unfreezeEscrow();
    } else {
      ledger.freezeEscrow(
        "Autonomous Escrow Freeze: Reconciliation panel variance exceeded 0% tolerance (+₹30,000 inflation in #402, off-category banquet catering in #403)"
      );
    }
  };

  // Aggregated totals
  const totalReportedInr = RECONCILIATION_ITEMS.reduce((sum, item) => sum + item.claimedAmountInr, 0);
  const totalChainInr = RECONCILIATION_ITEMS.reduce((sum, item) => sum + item.chainAmountInr, 0);
  const totalVarianceInr = totalReportedInr - totalChainInr;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 grid-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ╔══════════════════════════════════════════════════╗
            ║  PAGE HEADER & PROBLEM STATEMENT BADGES          ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="glass-elevated rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CASCADE &apos;26 · THEME 4 · PS 2
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  INCONSISTENCY DETECTOR
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  0.00% VARIANCE TOLERANCE
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  2/3 QUORUM CONSENSUS VERIFIED
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                  Report vs. On-Chain Reconciliation
                </span>
                <span className="text-xs font-mono font-medium text-slate-400 hidden sm:inline px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  // Immutable Truth vs Self-Published PDF
                </span>
              </h1>

              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Traditional donors only see glossy, post-hoc PDF annual reports submitted 9–12 months after funds are spent. 
                <strong> The Black Hole Ledger </strong> runs real-time algorithmic reconciliation between the NGO&apos;s public report claims 
                and the immutable cryptographic settlement records verified by <code>PurposeBoundEscrow.sol</code>.
              </p>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto shrink-0">
              <Link
                href="/red-team"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-slate-500 transition-all flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Red-Team Scanner</span>
              </Link>
              <Link
                href="/flow-tracer"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-slate-500 transition-all flex items-center gap-1.5"
              >
                <span>🌐</span>
                <span>Flow-Tracer</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-slate-500 transition-all flex items-center gap-1.5"
              >
                <span>🏛️</span>
                <span>Dashboard</span>
              </Link>

              {/* Universal Reset Demo State Button */}
              <button
                id="reconciliation-header-reset-btn"
                onClick={() => {
                  ledger.resetToBaseline();
                  ledger.unfreezeEscrow();
                }}
                title="Reset demo balances and state to baseline"
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-500/40 hover:border-indigo-400 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>🔄 Reset Demo State</span>
              </button>
            </div>
          </div>

          {/* Aggregate Reconciliation Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">NGO Published Claims</div>
              <div className="text-xl font-black text-amber-300 mt-1">₹{totalReportedInr.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">4 Audited PDF Line Items</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">On-Chain Settled Truth</div>
              <div className="text-xl font-black text-emerald-400 mt-1">₹{totalChainInr.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Verified on Polygon &amp; Ethereum</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Unexplained Variance Delta</div>
              <div className="text-xl font-black text-red-400 mt-1">
                +₹{totalVarianceInr.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-red-400/80 mt-0.5">🚨 +73.4% Over-Reported / Blocked</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Escrow Autonomous State</div>
                <div className={`text-base font-black mt-1 flex items-center gap-1.5 ${isFrozen ? "text-red-400" : "text-emerald-400"}`}>
                  <span className={`w-2 h-2 rounded-full ${isFrozen ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
                  {isFrozen ? "ESCROW FROZEN" : "ESCROW ACTIVE"}
                </div>
              </div>
              <div className="text-[10px] text-slate-500">Autonomous Circuit Breaker</div>
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║  AUTONOMOUS AUTO-FREEZE TRIGGER CALLOUT          ║
            ╚══════════════════════════════════════════════════╝ */}
        <div
          id="autonomous-freeze-indicator"
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isFrozen
              ? "bg-red-950/70 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isFrozen
                  ? "bg-red-500/20 border-red-500/50 text-red-400 text-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 text-lg"
              }`}
            >
              {isFrozen ? "🚨" : "🛡️"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-300">
                  Autonomous Auto-Freeze Trigger
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700">
                  Threshold: Variance &gt; 0.00%
                </span>
                {isFrozen && (
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                    CIRCUIT BREAKER ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {isFrozen ? (
                  <>
                    Show that the smart contract <code className="bg-black/50 px-1 py-0.5 rounded text-white font-mono text-[11px]">PurposeBoundEscrow.sol</code>{" "}
                    automatically executed <code className="bg-red-900/60 text-red-200 px-1 py-0.5 rounded font-mono font-bold text-[11px]">.freeze()</code>{" "}
                    the moment the report-vs-chain variance exceeded 0% tolerance (+₹30,000 inflation &amp; off-category catering), 
                    <strong> requiring zero centralized human auditors.</strong>
                  </>
                ) : (
                  <>
                    When report-vs-chain variance exceeds tolerance thresholds (e.g., +₹30,000 inflation in Item #402 or banquet catering in Item #403), 
                    the escrow contract autonomously triggers <code className="bg-black/50 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px]">.freeze()</code> on-chain.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              id="reconciliation-freeze-reset-btn"
              onClick={() => {
                ledger.resetToBaseline();
                ledger.unfreezeEscrow();
              }}
              title="Reset demo balances and state to baseline"
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 transition-all shadow flex items-center justify-center gap-1.5"
            >
              <span>🔄 Reset Demo State</span>
            </button>
            <button
              id="toggle-freeze-btn"
              onClick={handleToggleFreeze}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 border ${
                isFrozen
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-600/30"
                  : "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-600/30"
              }`}
            >
              {isFrozen ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reset &amp; Authorize Unfreeze</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Simulate Autonomous Auto-Freeze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║  ITEM SELECTOR TABS & FILTER BAR                 ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 font-semibold">Filter:</span>
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "ALL"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              All Items ({RECONCILIATION_ITEMS.length})
            </button>
            <button
              onClick={() => setFilterType("DISCREPANCIES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                filterType === "DISCREPANCIES"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "bg-slate-900 text-red-400 hover:text-red-300 border border-slate-800"
              }`}
            >
              <span>🚨</span>
              <span>Discrepancies ({RECONCILIATION_ITEMS.filter((i) => i.hasDiscrepancy).length})</span>
            </button>
            <button
              onClick={() => setFilterType("MATCHES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                filterType === "MATCHES"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-slate-800"
              }`}
            >
              <span>✓</span>
              <span>Exact Matches ({RECONCILIATION_ITEMS.filter((i) => !i.hasDiscrepancy).length})</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Click any line item below to view side-by-side reconciliation
          </div>
        </div>

        {/* Item Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                id={`reconciliation-chip-${item.id}`}
                onClick={() => setSelectedId(item.id)}
                className={`p-3.5 rounded-xl text-left transition-all border relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? item.hasDiscrepancy
                      ? "bg-slate-900/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500"
                      : "bg-slate-900/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.itemNumber}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                        item.hasDiscrepancy
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {item.hasDiscrepancy ? "🚨 INCONSISTENCY" : "✓ RECONCILED"}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-white line-clamp-2 leading-snug">
                    {item.title}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">PDF: {item.claimedAmountFormatted}</span>
                  <span
                    className={
                      item.hasDiscrepancy ? "text-red-400 font-bold" : "text-emerald-400 font-bold"
                    }
                  >
                    Chain: {item.chainAmountFormatted}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║  SPLIT-PANEL UI: NGO CLAIM VS ON-CHAIN TRUTH     ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ────────────────────────────────────────────────────
              LEFT PANEL: NGO CLAIM / PUBLISHED PDF
          ──────────────────────────────────────────────────── */}
          <div
            id="panel-ngo-claim"
            className="glass-elevated rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-b from-amber-950/15 via-slate-950/90 to-slate-950/95 relative overflow-hidden shadow-2xl"
          >
            {/* Stamp Badge */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    Self-Published Document Claim
                  </div>
                  <h3 className="text-base font-black text-white">
                    NGO Published Report (PDF Claim)
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold">
                PAGE {selectedItem.pdfPage} OF REPORT
              </span>
            </div>

            {/* Document Details Form Body */}
            <div className="mt-5 space-y-4">
              {/* Document Identity with Clickable Action / Preview & Download */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Source Publication (PDF Report)
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                    Unverified Self-Audit
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">📄</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate text-xs sm:text-sm">
                        {selectedItem.pdfSource}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Page {selectedItem.pdfPage} of 24 · 4.6 KB PDF
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Preview & Direct Download */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      id="preview-pdf-btn"
                      onClick={() => setIsPdfModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                      title="Open inline PDF preview modal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <a
                      id="download-pdf-btn"
                      href={`/api/reports/download?file=${encodeURIComponent(selectedItem.pdfSource)}`}
                      download={selectedItem.pdfSource}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/45 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                      title="Direct download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="truncate">SHA-256: {selectedItem.pdfSha256.slice(0, 26)}…</span>
                  <button
                    onClick={() => copyToClipboard(selectedItem.pdfSha256)}
                    className="ml-1 text-slate-400 hover:text-white shrink-0"
                  >
                    {copiedHash === selectedItem.pdfSha256 ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Claimed Line Item */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Published Line Item Description
                  </div>
                  <div className="font-bold text-sm text-slate-100">
                    {selectedItem.title}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Claimed Amount</div>
                    <div
                      className={`text-lg font-black mt-0.5 ${
                        selectedItem.hasDiscrepancy ? "text-amber-300" : "text-emerald-400"
                      }`}
                    >
                      {selectedItem.claimedAmountFormatted}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Reported Date</div>
                    <div className="text-sm font-semibold text-slate-300 mt-0.5">
                      {selectedItem.claimedDate}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Claimed Vendor:</span>
                    <span className="font-semibold text-slate-200 text-right">{selectedItem.claimedVendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Claimed Category:</span>
                    <span className={`font-semibold text-right ${selectedItem.discrepancyType === "CATEGORY_MISAPPROPRIATION" ? "text-red-400 font-bold" : "text-indigo-300"}`}>
                      {selectedItem.claimedCategory}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-500">Payment Reference:</span>
                    <span className="text-slate-400">{selectedItem.claimedPaymentRef}</span>
                  </div>
                </div>
              </div>

              {/* Verification Stamp / Warning */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200/90">
                <span className="text-base shrink-0">⚠️</span>
                <div>
                  <strong>Self-Reported NGO Claim:</strong> This information represents what the NGO published 
                  to external donors and social media. It lacks on-chain cryptographic nullifier settlement guarantees.
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────
              RIGHT PANEL: ON-CHAIN SMART CONTRACT TRUTH
          ──────────────────────────────────────────────────── */}
          <div
            id="panel-on-chain-truth"
            className="glass-elevated rounded-2xl p-6 border border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 via-slate-950/90 to-slate-950/95 relative overflow-hidden shadow-2xl"
          >
            {/* Stamp Badge */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                    Cryptographic Ledger Truth
                  </div>
                  <h3 className="text-base font-black text-white">
                    On-Chain Smart Contract Truth
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-bold">
                ETHEREUM L1 &amp; POLYGON DAG
              </span>
            </div>

            {/* Smart Contract Truth Body */}
            <div className="mt-5 space-y-4">
              {/* Smart Contract Identity */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  Smart Contract Settlement Contract
                </div>
                <div className="font-bold text-indigo-300 font-mono flex items-center justify-between">
                  <span>PurposeBoundEscrow.sol</span>
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                    EVM Verified
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                  Address: {selectedItem.contractAddress}
                  <button
                    onClick={() => copyToClipboard(selectedItem.contractAddress)}
                    className="ml-1 text-slate-500 hover:text-white"
                  >
                    {copiedHash === selectedItem.contractAddress ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Recorded Settlement Line */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                    On-Chain Settlement Verification
                  </div>
                  <div className="font-bold text-sm text-slate-100">
                    {selectedItem.chainTitle}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Chain Recorded Amount</div>
                    <div
                      className={`text-lg font-black mt-0.5 ${
                        selectedItem.chainStatus === "SETTLED"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {selectedItem.chainAmountFormatted}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Block Height / Tx</div>
                    <div className="text-sm font-semibold text-indigo-300 mt-0.5">
                      {selectedItem.blockNumber > 0 ? `Block #${selectedItem.blockNumber}` : "Zero Tx Found"}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Vendor:</span>
                    <span className="font-semibold text-slate-200 text-right">{selectedItem.chainVendor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Category Hash:</span>
                    <span className="font-mono text-[10px] text-indigo-300 truncate max-w-[240px]">
                      {selectedItem.chainCategoryHash.slice(0, 18)}… ({selectedItem.chainEarmark})
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-slate-500">Verified Nullifier:</span>
                    <span className="text-slate-400 truncate max-w-[240px]">
                      {selectedItem.nullifier.slice(0, 22)}…
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] pt-1">
                    <span className="text-slate-500">Multi-Hop Path:</span>
                    <span className="text-emerald-400 font-semibold">{selectedItem.settlementRail}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Guarantee Stamp */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-200">
                <span className="text-base shrink-0">🔒</span>
                <div>
                  <strong>Immutable Consensus Truth:</strong> Verified via <code>NullifierRegistry.sol</code>{" "}
                  and Ethereum L1/Polygon state transitions. Cannot be altered, deleted, or backdated by NGO leadership.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║  AUTOMATED RED DIFF HIGHLIGHTS (INCONSISTENCY)   ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Automated Inconsistency Detector (Diff Analysis)
            </span>
          </div>

          {selectedItem.hasDiscrepancy ? (
            <div
              id="automated-red-diff-box"
              className="p-5 sm:p-6 rounded-2xl border-2 border-red-500/80 bg-gradient-to-r from-red-950/60 via-slate-950/90 to-red-950/40 shadow-[0_0_40px_rgba(239,68,68,0.25)] animate-fade-in-up space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl animate-bounce">🚨</span>
                  <div>
                    <div className="text-[10px] font-mono font-black uppercase tracking-widest text-red-400">
                      CRYPTOGRAPHIC DISCREPANCY DETECTED
                    </div>
                    <div className="text-sm sm:text-base font-black text-white">
                      {selectedItem.discrepancyType === "INFLATION" && "Inflation Over-Reporting Variance"}
                      {selectedItem.discrepancyType === "CATEGORY_MISAPPROPRIATION" && "Off-Category Misappropriation Violation"}
                      {selectedItem.discrepancyType === "PHANTOM_INVOICE" && "Phantom Invoice — Zero On-Chain Record"}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] self-start sm:self-auto">
                  SEVERITY: CRITICAL
                </span>
              </div>

              {/* Exact Red Diff Quote Callout (As specified in prompt) */}
              <div className="p-4 rounded-xl bg-black/60 border border-red-500/50 shadow-inner">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Automated Red Diff Computation:
                </div>
                <div className="text-base sm:text-lg font-black text-red-300 font-mono tracking-tight leading-snug">
                  {selectedItem.diffHighlightText}
                </div>
              </div>

              {/* Microscopic Comparison Table */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">1. NGO Published Claim</div>
                  <div className="text-base font-black text-amber-300 mt-1">
                    {selectedItem.claimedAmountFormatted}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedItem.claimedVendor}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">2. On-Chain Cryptographic Truth</div>
                  <div className="text-base font-black text-emerald-400 mt-1">
                    {selectedItem.chainAmountFormatted}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedItem.chainVendor}</div>
                </div>

                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40">
                  <div className="text-[10px] text-red-300 uppercase font-bold">3. Unexplained Delta</div>
                  <div className="text-base font-black text-red-400 mt-1">
                    {selectedItem.deltaInr > 0 ? `+₹${selectedItem.deltaInr.toLocaleString("en-IN")}` : "0"}
                  </div>
                  <div className="text-[10px] text-red-300/80 mt-0.5">
                    {selectedItem.discrepancyType === "INFLATION" ? "+25.0% Over-Reporting Variance" : "100% Unbacked Extraction"}
                  </div>
                </div>
              </div>

              {/* Explanatory Context */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                <strong>Forensic Audit Conclusion: </strong>
                {selectedItem.auditExplanation}
              </p>
            </div>
          ) : (
            <div
              id="automated-clean-diff-box"
              className="p-5 rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-slate-950/90 to-emerald-950/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-emerald-300 text-sm">
                    Reconciliation Verified: Exact 1:1 Match (Zero Variance)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  VERIFIED PASS
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/40 font-mono text-sm text-emerald-300 font-bold">
                {selectedItem.diffHighlightText}
              </div>

              <p className="text-xs text-slate-300">
                {selectedItem.auditExplanation}
              </p>
            </div>
          )}
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║  BATCH RECONCILIATION SUMMARY MATRIX TABLE       ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="glass-elevated rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>📋</span>
                <span>Complete Batch Audit Reconciliation Ledger</span>
              </h3>
              <p className="text-xs text-slate-400">
                Side-by-side reconciliation of all 4 milestone line items in the Vidarbha Water Cluster campaign.
              </p>
            </div>

            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              Contract: 0x3Af19B02...6E1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Item #</th>
                  <th className="py-3 px-3">Expense Item Title</th>
                  <th className="py-3 px-3 text-right">NGO Claimed (PDF)</th>
                  <th className="py-3 px-3 text-right">Settled (Chain)</th>
                  <th className="py-3 px-3 text-right">Delta / Variance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {RECONCILIATION_ITEMS.map((item) => {
                  const isCurSelected = item.id === selectedId;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isCurSelected
                          ? "bg-indigo-950/40 text-white font-semibold"
                          : "hover:bg-slate-900/50 text-slate-300"
                      }`}
                    >
                      <td className="py-3.5 px-3 font-bold text-indigo-400">{item.itemNumber}</td>
                      <td className="py-3.5 px-3 max-w-xs truncate font-sans font-medium text-slate-200">
                        {item.title.replace(`Expense Item ${item.itemNumber}: `, "")}
                      </td>
                      <td className="py-3.5 px-3 text-right text-amber-300 font-bold">
                        {item.claimedAmountFormatted}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-400 font-bold">
                        {item.chainAmountFormatted}
                      </td>
                      <td
                        className={`py-3.5 px-3 text-right font-black ${
                          item.hasDiscrepancy ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {item.deltaInr > 0 ? `+₹${item.deltaInr.toLocaleString("en-IN")}` : "₹0 (0%)"}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.hasDiscrepancy
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {item.hasDiscrepancy ? "🚨 FLAGGED" : "✓ RECONCILED"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(item.id);
                          }}
                          className="px-2.5 py-1 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                          {isCurSelected ? "Inspecting" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║  TRUST ARCHITECTURE FOOTER CALLOUT               ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>💡</span>
            <span>Why Algorithmic Side-by-Side Reconciliation Matters:</span>
          </div>
          <p className="leading-relaxed font-sans">
            In standard philanthropy, NGOs submit self-audited expense spreadsheets and glossy PDFs to donors.
            Without an immutable execution engine like <strong>PurposeBoundEscrow.sol</strong> and <strong>NullifierRegistry.sol</strong>,
            phantom expenditures and off-category catering slip by unnoticed. The Black Hole Ledger mathematically reconciles
            every claim against EVM state, halting disbursements autonomously before capital can leak.
          </p>
        </div>

      </div>

      {/* ╔══════════════════════════════════════════════════╗
          ║  INLINE PDF REPORT PREVIEW MODAL                 ║
          ╚══════════════════════════════════════════════════╝ */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      PDF Document Viewer
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Page {selectedItem.pdfPage} of 24
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                    {selectedItem.pdfSource}
                  </h3>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  id="modal-download-pdf-btn"
                  href={`/api/reports/download?file=${encodeURIComponent(selectedItem.pdfSource)}`}
                  download={selectedItem.pdfSource}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>

                <a
                  href={`/${selectedItem.pdfSource}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
                  title="Open raw PDF in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  id="close-pdf-modal-btn"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  id="tab-annotated-btn"
                  onClick={() => setModalTab("ANNOTATED")}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
                    modalTab === "ANNOTATED"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                  }`}
                >
                  Annotated Page View (Page {selectedItem.pdfPage})
                </button>
                <button
                  id="tab-raw-pdf-btn"
                  onClick={() => setModalTab("RAW_PDF")}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
                    modalTab === "RAW_PDF"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                  }`}
                >
                  Embedded Native PDF Viewer
                </button>
              </div>

              <div className="hidden md:block text-[11px] text-slate-500">
                Self-Reported NGO Claim vs. On-Chain Cryptographic Settled Truth
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-950">
              {modalTab === "ANNOTATED" ? (
                <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-xl p-8 shadow-2xl font-serif space-y-6 border border-slate-300">
                  {/* Glossy Header of PDF */}
                  <div className="border-b-2 border-indigo-900 pb-4 flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-700 font-bold">
                        Vidarbha Rural Development Society · Annual Report 2025-26
                      </div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                        Rural Water Infrastructure Initiative
                      </h2>
                      <div className="text-xs text-slate-600 font-sans mt-0.5">
                        Maharashtra Drought Cluster · Wardha District Intervention
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-500">
                      <div>Page {selectedItem.pdfPage} of 24</div>
                      <div className="font-bold text-amber-700 uppercase">Self-Audit Submission</div>
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                    Expenditure Schedule &amp; Milestone Reconciliation Details
                  </div>

                  {/* The Highlighted Line Item */}
                  <div className={`p-4 rounded-lg border font-sans ${
                    selectedItem.hasDiscrepancy
                      ? "bg-red-50 border-red-300 text-red-950"
                      : "bg-emerald-50 border-emerald-300 text-emerald-950"
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-300">
                        {selectedItem.itemNumber}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        selectedItem.hasDiscrepancy ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                      }`}>
                        {selectedItem.hasDiscrepancy ? "🚨 Inconsistency Flagged" : "✓ Reconciled"}
                      </span>
                    </div>

                    <div className="text-base font-bold">
                      {selectedItem.title}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs pt-2 border-t border-slate-200/70">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Claimed Amount in PDF:</div>
                        <div className="text-base font-black text-red-700 mt-0.5">
                          {selectedItem.claimedAmountFormatted}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Settled on Smart Contract:</div>
                        <div className="text-base font-black text-emerald-700 mt-0.5">
                          {selectedItem.chainAmountFormatted}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs font-mono text-slate-600 space-y-1 pt-2 border-t border-slate-200/70">
                      <div><strong>Claimed Vendor:</strong> {selectedItem.claimedVendor}</div>
                      <div><strong>Reported Category:</strong> {selectedItem.claimedCategory}</div>
                      <div><strong>Voucher Ref:</strong> {selectedItem.claimedPaymentRef}</div>
                    </div>
                  </div>

                  {/* Auditor Stamp & Signature */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-sans text-slate-600">
                    <div>
                      <div className="font-bold text-slate-800">Vidarbha Rural Development Society</div>
                      <div className="text-[11px] text-slate-500">Internal Self-Audit Committee Certification</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif italic font-bold text-indigo-900 text-sm">Dr. A. K. Deshmukh</div>
                      <div className="text-[10px] text-slate-500">Managing Trustee / Project Lead</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col">
                  <iframe
                    src={`/${selectedItem.pdfSource}#page=${selectedItem.pdfPage}`}
                    className="w-full h-full border-0"
                    title="PDF Document Preview"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <div className="truncate">
                SHA-256: <span className="text-slate-300 font-bold">{selectedItem.pdfSha256.slice(0, 32)}…</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <a
                  href={`/api/reports/download?file=${encodeURIComponent(selectedItem.pdfSource)}`}
                  download={selectedItem.pdfSource}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original PDF</span>
                </a>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
