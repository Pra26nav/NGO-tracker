"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  Eye,
  HeartHandshake,
  ArrowRight,
  Coins,
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
  
  // On-Chain Reality
  chainTitle: string;
  chainAmountInr: number;
  chainAmountFormatted: string;
  chainVendor: string;
  txHash: string;
  nullifier: string;
  chainStatus: "SETTLED" | "BLOCKED_ON_CHAIN" | "NOT_FOUND";
  
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
    chainTitle: "Smart Contract Settlement: Tranche 2 Payout",
    chainAmountInr: 120000,
    chainAmountFormatted: "₹1,20,000 INR",
    chainVendor: "Vidarbha Water Works (GSTIN-27VWW002Z)",
    txHash: "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
    nullifier: "0x88c2901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e2",
    chainStatus: "SETTLED",
    hasDiscrepancy: true,
    discrepancyType: "INFLATION",
    deltaInr: 30000,
    diffHighlightText: "Reported ₹1,50,000 vs. Chain Recorded ₹1,20,000 ([OVER-REPORTING FLAGGED] +₹30,000 Unexplained Delta)",
    auditExplanation:
      "The NGO's public PDF claims ₹1,50,000 was disbursed for borewell deepening. However, the cryptographic settlement on Base Sepolia and banking webhook strictly records ₹1,20,000. The +₹30,000 difference is an unbacked, padded margin.",
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
    chainTitle: "On-Chain Smart Contract Rejection",
    chainAmountInr: 0,
    chainAmountFormatted: "₹0.00 INR (Blocked by EVM)",
    chainVendor: "Apex Luxury Catering (Flagged Off-Category)",
    txHash: "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899",
    nullifier: "0x88c7901f...33e7 (Earmark Violation Nullifier)",
    chainStatus: "BLOCKED_ON_CHAIN",
    hasDiscrepancy: true,
    discrepancyType: "CATEGORY_MISAPPROPRIATION",
    deltaInr: 385000,
    diffHighlightText: "Published report mentions 'VIP Stakeholder Banquet Catering' under Earmark 'Water Infrastructure' ([OFF-CATEGORY MISAPPROPRIATION DETECTED & BLOCKED])",
    auditExplanation:
      "PurposeBoundEscrow.sol enforces that keccak256(category) must equal keccak256('Water Infrastructure'). The NGO published ₹3,85,000 of luxury hotel catering in their donor PDF, but the smart contract mathematically blocked payout on-chain.",
    severity: "CRITICAL",
  },
  {
    id: "REC-404",
    itemNumber: "#404",
    title: "Expense Item #404: Administrative Travel & Luxury Fuel Stipend",
    claimedAmountInr: 85000,
    claimedAmountFormatted: "₹85,000 INR",
    claimedVendor: "Nagpur Elite Chauffeur Fleet Services",
    claimedCategory: "Project Field Operations",
    pdfSource: "Vidarbha_Water_Project_Annual_Report_2026.pdf",
    pdfPage: 23,
    chainTitle: "Zero Matching Blockchain Settlement",
    chainAmountInr: 0,
    chainAmountFormatted: "NOT FOUND IN LEDGER",
    chainVendor: "Unregistered Entity",
    txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    nullifier: "NONE",
    chainStatus: "NOT_FOUND",
    hasDiscrepancy: true,
    discrepancyType: "PHANTOM_INVOICE",
    deltaInr: 85000,
    diffHighlightText: "Reported expense has ZERO matching transactions in PurposeBoundEscrow or partner banking webhooks ([PHANTOM INVOICE DETECTED])",
    auditExplanation:
      "The NGO published an ₹85,000 travel expense in its annual PDF. Zero on-chain proof exists, and no matching UTR was recorded. This is a fabricated phantom expense.",
    severity: "CRITICAL",
  },
];

export default function ReconciliationPage() {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const filteredItems = RECONCILIATION_ITEMS.filter((item) => {
    if (filter !== "ALL" && item.discrepancyType !== filter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.claimedVendor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
            <span className="font-heading font-black text-xs uppercase tracking-tight">
              FINANCIAL AUDIT // REPORTED PDF VS. ON-CHAIN LEDGER REALITY
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-black">
              PDF RECONCILIATION
            </h1>
            <p className="font-mono text-xs sm:text-sm text-black/70 max-w-xl">
              Side-by-side forensic diff: detect padded invoice inflation, category earmark misappropriation, and phantom expenses in published NGO PDF reports.
            </p>
          </div>
        </div>

        {/* ── Summary & Filter Bar ────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-black rounded-xl p-4 shadow-brutal-sm">
          <div className="flex items-center gap-2 flex-wrap">
            {["ALL", "INFLATION", "CATEGORY_MISAPPROPRIATION", "PHANTOM_INVOICE"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn-brutal text-xs font-heading font-black px-3.5 py-2 rounded-lg uppercase tracking-tight ${
                  filter === f ? "bg-charcoal text-white" : "bg-white text-black hover:bg-sage"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor, item..."
              className="pl-8 pr-3 py-1.5 rounded-lg border-2 border-black text-xs font-mono bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* ── Side-by-Side Reconciliation Cards ───────────────── */}
        <div className="flex flex-col gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card-brutal p-6 rounded-2xl flex flex-col gap-5 border-2 border-black shadow-brutal-lg transition-all"
            >
              {/* Card Header (Clicking opens Donor Page) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                <Link
                  href={`/donate?item=${item.id}&title=${encodeURIComponent(item.title)}`}
                  className="flex items-center gap-3 group"
                >
                  <span className="w-8 h-8 rounded bg-[#171e19] text-white font-heading font-black text-xs flex items-center justify-center border-2 border-black shrink-0">
                    {item.itemNumber}
                  </span>
                  <h3 className="font-heading font-black text-xl text-black uppercase group-hover:underline">
                    {item.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="bg-[#ff5964] text-white text-xs font-mono font-black px-3 py-1 rounded border border-black uppercase shadow-brutal-sm">
                    {item.discrepancyType.replace("_", " ")}
                  </span>
                  <Link
                    href={`/donate?item=${item.id}&title=${encodeURIComponent(item.title)}`}
                    className="btn-brutal bg-primary hover:bg-yellow-400 text-black font-heading font-black text-xs px-3.5 py-1.5 rounded-lg uppercase tracking-tight flex items-center gap-1.5"
                  >
                    <span>DONATE TO TENDER</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Side-by-Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Self-Reported NGO PDF Report */}
                <div className="border-2 border-black rounded-xl p-4 bg-primary/10 flex flex-col gap-3 shadow-brutal-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-black/20 text-xs font-mono font-bold">
                    <span className="flex items-center gap-1.5 text-black">
                      <FileText className="w-4 h-4 text-black" />
                      <span>SELF-REPORTED NGO ANNUAL PDF</span>
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-black text-[10px]">Page {item.pdfPage}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-black/60">Claimed Amount:</span>
                      <strong className="text-black font-extrabold text-sm">{item.claimedAmountFormatted}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Claimed Vendor:</span>
                      <strong className="text-black truncate max-w-xs">{item.claimedVendor}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Stated Category:</span>
                      <span className="font-bold text-black">{item.claimedCategory}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: On-Chain Smart Contract Ledger Reality */}
                <div className="border-2 border-black rounded-xl p-4 bg-sage/30 flex flex-col gap-3 shadow-brutal-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-black/20 text-xs font-mono font-bold">
                    <span className="flex items-center gap-1.5 text-black">
                      <Scale className="w-4 h-4 text-black" />
                      <span>ON-CHAIN SMART CONTRACT REALITY</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded border border-black text-[10px] font-black uppercase ${
                      item.chainStatus === "SETTLED" ? "bg-sage text-black" : "bg-[#ff5964] text-white"
                    }`}>
                      {item.chainStatus}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-black/60">Actual Settled Amount:</span>
                      <strong className="text-black font-extrabold text-sm">{item.chainAmountFormatted}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Verified Vendor:</span>
                      <strong className="text-black truncate max-w-xs">{item.chainVendor}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Tx Hash:</span>
                      <span className="font-bold truncate max-w-[180px]">{item.txHash}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Forensic Discrepancy Highlight Banner */}
              <div className="border-2 border-black rounded-xl p-4 bg-primary/25 flex flex-col gap-1.5 font-mono text-xs">
                <div className="font-heading font-black text-sm text-black uppercase flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brutal-red shrink-0" />
                  <span>{item.diffHighlightText}</span>
                </div>
                <p className="text-black/85 leading-relaxed pt-1">
                  {item.auditExplanation}
                </p>
              </div>

              {/* Tender Action Footer Linking to Donate Page */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/20">
                <div className="text-xs font-mono text-black/70">
                  Procurement Reference: <strong className="text-black">{item.id}</strong> · Purpose Earmark: <strong className="text-black">{item.claimedCategory}</strong>
                </div>
                <Link
                  href={`/donate?item=${item.id}&title=${encodeURIComponent(item.title)}`}
                  className="btn-brutal bg-[#171e19] hover:bg-black text-white font-heading font-black text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 uppercase tracking-tight shadow-brutal-sm"
                >
                  <Coins className="w-4 h-4 text-primary" />
                  <span>DONATE TO THIS TENDER (OPEN DONOR PAGE)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
