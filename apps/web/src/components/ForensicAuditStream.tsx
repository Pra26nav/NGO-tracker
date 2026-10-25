"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Search,
  Sparkles,
  Lock,
  Code2,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Layers,
  ArrowRight
} from "lucide-react";

export interface TerminalLog {
  time: string;
  level: "INFO" | "CRYPTO" | "SUCCESS" | "WARN" | "ALERT" | "CRITICAL" | "EMIT";
  source: string;
  text: string;
}

export interface PlainEnglishLog {
  icon: string;
  category: string;
  title: string;
  explanation: string;
  badgeColor: "emerald" | "indigo" | "amber" | "red" | "blue" | "slate";
}

/**
 * Dynamically translates low-level cryptographic / forensic logs into
 * everyday plain-English explanations accessible to non-crypto native donors.
 */
export function translateLogToHuman(log: TerminalLog): PlainEnglishLog {
  const { source, text, level } = log;
  const upperText = text.toUpperCase();

  // 1. Example 1: [CV_PHASH]
  if (source === "CV_PHASH") {
    if (
      upperText.includes("EXACT VISUAL CLONE") ||
      upperText.includes("HAMMING DISTANCE = 2") ||
      level === "CRITICAL" ||
      level === "ALERT"
    ) {
      return {
        icon: "🚨",
        category: "Duplicate Image Blocked",
        title: "Visual Clone Detected",
        explanation: "Caught duplicate receipt! Computer vision confirmed this image is a visual clone of an existing receipt in another donor pool.",
        badgeColor: "red",
      };
    }
    if (
      upperText.includes("MIN HAMMING DISTANCE") ||
      upperText.includes("NO VISUAL CLONE") ||
      level === "SUCCESS"
    ) {
      return {
        icon: "🔒",
        category: "Cross-Donor Anti-Recycling",
        title: "Unique Receipt Verified",
        explanation: "🔒 Checked that this receipt hasn't been used anywhere else across other donor pools.",
        badgeColor: "emerald",
      };
    }
    return {
      icon: "🔍",
      category: "Perceptual Image Hash",
      title: "Scanning Image Geometry",
      explanation: "Scanning visual receipt layout using 64-bit DCT to ensure the image hasn't been cropped or recycled across donor pools.",
      badgeColor: "indigo",
    };
  }

  // 2. Example 2: [FORENSIC_ELA]
  if (source === "FORENSIC_ELA") {
    if (
      upperText.includes("SPLICING DETECTED") ||
      upperText.includes("TAMPERING") ||
      level === "CRITICAL" ||
      level === "ALERT"
    ) {
      return {
        icon: "📸",
        category: "Pixel Forensics Alert",
        title: "Photoshop Tampering Detected",
        explanation: "🚨 Photoshop editing detected! Error Level Analysis discovered altered numbers or spliced text on this receipt.",
        badgeColor: "red",
      };
    }
    if (
      upperText.includes("ELA ANOMALY SCORE") ||
      upperText.includes("UNIFORM COMPRESSION") ||
      upperText.includes("ZERO DIGITAL SPLICING") ||
      level === "SUCCESS"
    ) {
      return {
        icon: "📸",
        category: "Photo Authenticity",
        title: "Compression Integrity Confirmed",
        explanation: "📸 Verified via Error Level Analysis that the receipt photo wasn't digitally edited.",
        badgeColor: "emerald",
      };
    }
    return {
      icon: "🔬",
      category: "Pixel Forensics",
      title: "Analyzing Micro-Compression",
      explanation: "Running microscopic Error Level Analysis (ELA) at JPEG quality 85 to check for digital tampering.",
      badgeColor: "indigo",
    };
  }

  // 3. Example 3: [ZK_MERKLE]
  if (source === "ZK_MERKLE") {
    if (
      upperText.includes("CRYPTOGRAPHIC SIBLING PATH CONFIRMED") ||
      upperText.includes("142 HOUSEHOLDS") ||
      upperText.includes("0 BYTES PII") ||
      level === "SUCCESS"
    ) {
      return {
        icon: "🛡️",
        category: "Beneficiary Privacy Shield",
        title: "Private Delivery Validated",
        explanation: "🛡️ Verified 142 household delivery records without exposing any private beneficiary personal data.",
        badgeColor: "emerald",
      };
    }
    return {
      icon: "🔐",
      category: "Zero-Knowledge Proof",
      title: "Validating Beneficiary Root",
      explanation: "Cryptographically verifying rural village delivery proofs against the on-chain Merkle Root without exposing citizen identities.",
      badgeColor: "indigo",
    };
  }

  // 4. Example 4: [EVM_ESCROW]
  if (source === "EVM_ESCROW") {
    if (
      upperText.includes("SUBMITEXPENDITUREPROOF()") ||
      upperText.includes("PURPOSEBOUNDESCROW") ||
      level === "SUCCESS"
    ) {
      return {
        icon: "🟢",
        category: "Autonomous Escrow Release",
        title: "Vendor Payment Safe Release",
        explanation: "🟢 Automatically and safely released ₹3.1 Lakhs to the local hardware vendor.",
        badgeColor: "emerald",
      };
    }
    return {
      icon: "⚡",
      category: "Smart Contract Escrow",
      title: "Executing Smart Contract Rules",
      explanation: "Validating milestone requirements against PurposeBoundEscrow.sol before releasing funds to the vendor.",
      badgeColor: "indigo",
    };
  }

  // Nullifier & Registry
  if (source === "NULLIFIER" || source === "REGISTRY") {
    if (
      upperText.includes("NULLIFIER COLLISION") ||
      upperText.includes("PREVIOUSLY CLAIMED") ||
      level === "ALERT" ||
      level === "CRITICAL"
    ) {
      return {
        icon: "🚨",
        category: "Double-Spend Prevention",
        title: "Duplicate Invoice Blocked",
        explanation: "Fraud alert: This identical invoice was already claimed in 'Donor_Pool_A (Clean Water Fund)'. Double-spending rejected!",
        badgeColor: "red",
      };
    }
    if (
      upperText.includes("UNIQUE") ||
      upperText.includes("NO COLLISION") ||
      level === "SUCCESS"
    ) {
      return {
        icon: "✅",
        category: "Cross-Donor Registry",
        title: "Invoice Fingerprint Unique",
        explanation: "Confirmed this invoice has never been claimed in any other charity or donor pool globally.",
        badgeColor: "emerald",
      };
    }
    return {
      icon: "🔐",
      category: "Deterministic Nullifier",
      title: "Generating Digital Fingerprint",
      explanation: "Generating a tamper-proof digital fingerprint from vendor tax ID, invoice number, and billing date.",
      badgeColor: "indigo",
    };
  }

  // Ingest & OCR
  if (source === "INGEST" || source === "BATCH_INGEST") {
    if (upperText.includes("BATCH #42") || upperText.includes("10 VENDOR INVOICES")) {
      return {
        icon: "📥",
        category: "Batch Ingestion",
        title: "10 Vendor Invoices Ingested",
        explanation: "Ingesting a batch of 10 vendor receipts totaling $64,000 USD for automated verification.",
        badgeColor: "indigo",
      };
    }
    if (upperText.includes("REC-8841-CROPPED")) {
      return {
        icon: "📥",
        category: "Receipt Ingestion",
        title: "Incoming Receipt Submission",
        explanation: "NGO submitted invoice REC-8841 for Donor Campaign #2 funding release.",
        badgeColor: "amber",
      };
    }
    return {
      icon: "📥",
      category: "Milestone Claim",
      title: "New Expenditure Submitted",
      explanation: "Received milestone expenditure claim for Water Infrastructure verification.",
      badgeColor: "indigo",
    };
  }

  if (source === "OCR_PARSE") {
    return {
      icon: "📄",
      category: "Automated OCR Scan",
      title: "Invoice Facts Extracted",
      explanation: "AI extracted vendor name, tax ID, billing date, and ₹1,20,000 total amount for verification.",
      badgeColor: "indigo",
    };
  }

  // Contract events & Escrow freeze
  if (source === "CONTRACT_EVENT" || source === "SMART_CONTRACT") {
    if (
      upperText.includes("ESCROWAUTOFROZEN") ||
      upperText.includes("EMERGENCY FREEZE") ||
      level === "ALERT" ||
      level === "CRITICAL"
    ) {
      return {
        icon: "🔒",
        category: "Autonomous Circuit Breaker",
        title: "Smart Contract Escrow Frozen",
        explanation: "Emergency auto-freeze triggered on-chain: The donation locker halted disbursements to protect donor capital.",
        badgeColor: "red",
      };
    }
    return {
      icon: "🎉",
      category: "Milestone Milestone Verified",
      title: "Milestone Confirmed On-Chain",
      explanation: "ExpenditureVerified emitted on-chain. ₹3.1L disbursed safely to vendor; remaining donor funds stay safe.",
      badgeColor: "emerald",
    };
  }

  if (source === "MUTATION_DETECT") {
    return {
      icon: "⚠️",
      category: "Image Mutation Alert",
      title: "Border Crop Detected",
      explanation: "Warning: Image was cropped by 2 pixels to change raw SHA-256 hash, but semantic nullifiers catch the match.",
      badgeColor: "amber",
    };
  }

  if (source === "CIRCUIT_BREAKER" || source === "VAULT_LOCK") {
    return {
      icon: "🛡️",
      category: "Vault Protection",
      title: "Funds Safely Locked",
      explanation: "Smart contract vault locked without human intervention. 100% of remaining donor funds protected from extraction.",
      badgeColor: "red",
    };
  }

  if (source === "PARALLEL_AUDIT") {
    return {
      icon: "⚡",
      category: "Parallel Audit",
      title: "Spawning Verification Threads",
      explanation: "Running simultaneous image tampering analysis and category checks across all submitted receipts.",
      badgeColor: "indigo",
    };
  }

  if (source.startsWith("RECEIPT_")) {
    const num = source.replace("RECEIPT_", "#");
    if (upperText.includes("PASS") || level === "SUCCESS") {
      return {
        icon: "✅",
        category: `Invoice ${num}`,
        title: `Receipt ${num} Verified`,
        explanation: `Receipt ${num} passed: Authentic photograph matching the clean water infrastructure earmark.`,
        badgeColor: "emerald",
      };
    }
    if (upperText.includes("SPLICING") || upperText.includes("DOCTORED")) {
      return {
        icon: "❌",
        category: `Invoice ${num}`,
        title: `Receipt ${num} Forgery Detected`,
        explanation: `Receipt ${num} failed: Pixel forensics detected doctored numbers on the invoice total.`,
        badgeColor: "red",
      };
    }
    if (upperText.includes("VIOLATES") || upperText.includes("HOSPITALITY")) {
      return {
        icon: "❌",
        category: `Invoice ${num}`,
        title: `Receipt ${num} Purpose Violation`,
        explanation: `Receipt ${num} failed: Luxury banquet catering violates the clean water infrastructure earmark.`,
        badgeColor: "red",
      };
    }
  }

  if (source === "BATCH_ANALYSIS") {
    return {
      icon: "🚨",
      category: "Batch Audit Result",
      title: "30% Forgery Limit Exceeded",
      explanation: "Critical Alert: 3 out of 10 receipts are fraudulent, triggering an autonomous escrow lock on-chain.",
      badgeColor: "red",
    };
  }

  // Fallback
  return {
    icon: level === "SUCCESS" ? "✅" : level === "ALERT" || level === "CRITICAL" ? "🚨" : level === "WARN" ? "⚠️" : "ℹ️",
    category: source.replace(/_/g, " "),
    title: source.replace(/_/g, " "),
    explanation: text.replace(/0x[a-fA-F0-9]{12,}/g, "[Cryptographic Hash]"),
    badgeColor: level === "SUCCESS" ? "emerald" : level === "ALERT" || level === "CRITICAL" ? "red" : level === "WARN" ? "amber" : "slate",
  };
}

export interface VisualTrustRibbonProps {
  escrowStatus?: "ACTIVE" | "FROZEN";
  earmark?: string;
  className?: string;
}

export const VisualTrustRibbon: React.FC<VisualTrustRibbonProps> = ({
  escrowStatus = "ACTIVE",
  earmark = "Water Infrastructure",
  className = "",
}) => {
  const isFrozen = escrowStatus === "FROZEN";

  return (
    <div className={`bg-slate-900/95 rounded-2xl p-4 border border-slate-800 shadow-xl relative overflow-hidden backdrop-blur-md ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ribbon Header Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFrozen ? "bg-red-400" : "bg-emerald-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isFrozen ? "bg-red-500" : "bg-emerald-500"}`} />
          </span>
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            DONOR VISUAL TRUST RIBBON · REAL-TIME ASSURANCE
          </span>
        </div>

        <div className="text-[10px] text-slate-400 font-mono hidden sm:flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            Earmark: <strong className="text-indigo-300">{earmark}</strong>
          </span>
        </div>
      </div>

      {/* 3 Prominent Color-Coded Status Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pill 1: 🟢 Locked & Safe */}
        <div
          className={`rounded-xl p-3.5 transition-all border shadow-md flex items-start gap-3 relative ${
            isFrozen
              ? "bg-gradient-to-br from-red-950/40 to-slate-900/90 border-red-500/40"
              : "bg-gradient-to-br from-emerald-950/30 to-slate-900/90 border-emerald-500/30 hover:border-emerald-500/50"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isFrozen
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            <Lock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-black tracking-wide flex items-center gap-1.5 text-slate-100">
                <span className={`w-2 h-2 rounded-full ${isFrozen ? "bg-red-500 animate-pulse" : "bg-emerald-400"}`} />
                {isFrozen ? "Locked & Safe (Halted)" : "Locked & Safe"}
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  isFrozen
                    ? "bg-red-950/80 text-red-300 border-red-700/50"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-700/50"
                }`}
              >
                {isFrozen ? "FROZEN" : "ON-CHAIN"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Funds are securely protected in the smart contract vault.
            </p>
            <div className="mt-1.5 text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="text-slate-500">Protection:</span>
              <span className={isFrozen ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
                {isFrozen ? "Auto-Circuit Breaker Active" : "100% Non-Custodial Vault"}
              </span>
            </div>
          </div>
        </div>

        {/* Pill 2: 🔍 Smart Check Passed */}
        <div
          className={`rounded-xl p-3.5 transition-all border shadow-md flex items-start gap-3 relative ${
            isFrozen
              ? "bg-gradient-to-br from-amber-950/30 to-slate-900/90 border-amber-500/40"
              : "bg-gradient-to-br from-indigo-950/30 to-slate-900/90 border-indigo-500/30 hover:border-indigo-500/50"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isFrozen
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
            }`}
          >
            <Search className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-black tracking-wide flex items-center gap-1.5 text-slate-100">
                <span className={`w-2 h-2 rounded-full ${isFrozen ? "bg-amber-400" : "bg-indigo-400"}`} />
                {isFrozen ? "Smart Check Alerted" : "Smart Check Passed"}
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  isFrozen
                    ? "bg-amber-950/80 text-amber-300 border-amber-700/50"
                    : "bg-indigo-950/80 text-indigo-300 border-indigo-700/50"
                }`}
              >
                {isFrozen ? "ALERT" : "VERIFIED"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              AI and cryptographic verification confirmed the vendor invoice is authentic.
            </p>
            <div className="mt-1.5 text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="text-slate-500">Method:</span>
              <span className="text-indigo-300 font-semibold">Dual-Tier ELA + pHash Nullifier</span>
            </div>
          </div>
        </div>

        {/* Pill 3: ✨ Impact Delivered */}
        <div className="rounded-xl p-3.5 transition-all border shadow-md flex items-start gap-3 relative bg-gradient-to-br from-purple-950/30 to-slate-900/90 border-purple-500/30 hover:border-purple-500/50">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-black tracking-wide flex items-center gap-1.5 text-slate-100">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Impact Delivered
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-purple-950/80 text-purple-300 border-purple-700/50">
                ZK-SHIELD
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Field delivery confirmed via Zero-Knowledge proof.
            </p>
            <div className="mt-1.5 text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="text-slate-500">Privacy:</span>
              <span className="text-purple-300 font-semibold">142 Families · 0 PII Exposed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ForensicAuditStreamProps {
  displayedLogs: TerminalLog[];
  isStreaming: boolean;
  streamSpeed: "normal" | "fast" | "instant";
  setStreamSpeed: (speed: "normal" | "fast" | "instant") => void;
  restartStream: () => void;
  copyAllLogs: () => void;
  copiedLog: boolean;
  logFilter: "ALL" | "CRYPTO" | "ALERTS";
  setLogFilter: (filter: "ALL" | "CRYPTO" | "ALERTS") => void;
  filteredLogs: TerminalLog[];
  escrowStatus?: "ACTIVE" | "FROZEN";
  escrowReason?: string | null;
  earmark?: string;
  showTrustRibbon?: boolean;
}

export const ForensicAuditStream: React.FC<ForensicAuditStreamProps> = ({
  displayedLogs,
  isStreaming,
  streamSpeed,
  setStreamSpeed,
  restartStream,
  copyAllLogs,
  copiedLog,
  logFilter,
  setLogFilter,
  filteredLogs,
  escrowStatus = "ACTIVE",
  escrowReason,
  earmark = "Water Infrastructure",
  showTrustRibbon = true,
}) => {
  // Mode toggle: "developer" vs. "human"
  const [viewMode, setViewMode] = useState<"developer" | "human">("human");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when logs change
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedLogs, viewMode]);

  return (
    <div className="space-y-4">
      {/* ╔════════════════════════════════════════════════════════════╗
          ║  FEATURE #2: THE VISUAL TRUST RIBBON (STATUS PILLS)        ║
          ╚════════════════════════════════════════════════════════════╝ */}
      {showTrustRibbon && (
        <VisualTrustRibbon escrowStatus={escrowStatus} earmark={earmark} />
      )}


      {/* ╔════════════════════════════════════════════════════════════╗
          ║  MAIN AUDIT STREAM BOX (WITH PLAIN-ENGLISH TOGGLE)         ║
          ╚════════════════════════════════════════════════════════════╝ */}
      <div className="bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Terminal Title Bar with Mode Toggle */}
        <div className="bg-slate-950/95 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-slate-300 ml-1.5 flex items-center gap-1.5 font-bold">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              FORENSIC SECURITY AUDIT STREAM — EVM / ELA / NULLIFIER KERNEL
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* FEATURE #1: THE "PLAIN-ENGLISH" TRANSLATION TOGGLE */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
              <button
                id="audit-mode-human-btn"
                type="button"
                onClick={() => setViewMode("human")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "human"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)] font-bold scale-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="View donor-friendly plain-English translations"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Human Mode</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/70 text-emerald-200 border border-emerald-400/30">
                  Easy
                </span>
              </button>

              <button
                id="audit-mode-developer-btn"
                type="button"
                onClick={() => setViewMode("developer")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "developer"
                    ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)] font-bold scale-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="View low-level cryptographic hashes, function calls, and Hamming distances"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Developer Mode</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950/70 text-indigo-200 border border-indigo-400/30 font-mono">
                  Raw
                </span>
              </button>
            </div>

            {/* Speed toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setStreamSpeed("normal")}
                className={`px-2 py-0.5 rounded transition ${
                  streamSpeed === "normal"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setStreamSpeed("fast")}
                className={`px-2 py-0.5 rounded transition ${
                  streamSpeed === "fast"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2x
              </button>
              <button
                onClick={() => setStreamSpeed("instant")}
                className={`px-2 py-0.5 rounded transition ${
                  streamSpeed === "instant"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Instant
              </button>
            </div>

            {/* Replay */}
            <button
              onClick={restartStream}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Replay stream"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Copy */}
            <button
              onClick={copyAllLogs}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition flex items-center gap-1 text-[11px]"
              title="Copy all logs"
            >
              {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Sub-header & Filter Tabs */}
        <div className="bg-slate-950/70 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Filter:</span>
            {(["ALL", "CRYPTO", "ALERTS"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setLogFilter(tab)}
                className={`px-2.5 py-0.5 rounded font-semibold transition ${
                  logFilter === tab
                    ? "bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                    : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {isStreaming ? (
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                STREAMING ALGORITHMIC CHECKS...
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                AUDIT COMPLETE ({displayedLogs.length} EVENTS)
              </span>
            )}
          </div>
        </div>

        {/* Audit Log Stream Body */}
        <div className="p-4 h-96 overflow-y-auto terminal-scroll relative bg-slate-950">
          {viewMode === "developer" && (
            <div className="crt-scanlines absolute inset-0 z-0 opacity-40 pointer-events-none" />
          )}

          {viewMode === "developer" ? (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                DEVELOPER MODE (RAW TERMINAL FORMAT)
                Preserves exact hashes, submitExpenditureProof(), Hamming distances
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="text-xs space-y-1.5 font-mono">
              {filteredLogs.map((log, idx) => {
                let badgeClass = "text-slate-400 bg-slate-900 border-slate-800";
                let textClass = "text-slate-300";

                if (log.level === "CRYPTO") {
                  badgeClass = "text-indigo-300 bg-indigo-950/60 border-indigo-700/50 font-bold";
                  textClass = "text-indigo-200 font-medium";
                } else if (log.level === "SUCCESS") {
                  badgeClass = "text-emerald-400 bg-emerald-950/60 border-emerald-700/50 font-bold";
                  textClass = "text-emerald-300 font-medium";
                } else if (log.level === "WARN") {
                  badgeClass = "text-amber-400 bg-amber-950/60 border-amber-700/50 font-bold";
                  textClass = "text-amber-200";
                } else if (log.level === "ALERT" || log.level === "CRITICAL") {
                  badgeClass = "text-red-400 bg-red-950/80 border-red-500 font-black animate-pulse";
                  textClass = "text-red-300 font-bold";
                } else if (log.level === "EMIT") {
                  badgeClass = "text-blue-400 bg-blue-950/60 border-blue-700/50 font-bold";
                  textClass = "text-blue-200";
                }

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="terminal-line py-1 px-2 rounded flex items-start gap-2 relative z-10 font-mono hover:bg-slate-900/60"
                  >
                    <span className="text-slate-500 shrink-0 text-[11px]">{log.time}</span>
                    <span className={`shrink-0 text-[10px] px-1.5 py-0.2 rounded border ${badgeClass}`}>
                      [{log.source}]
                    </span>
                    <span className={`break-words ${textClass}`}>{log.text}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                HUMAN MODE (PLAIN-ENGLISH TRANSLATIONS)
                Jargon-free sentences for everyday donors & judges
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="space-y-2.5 font-sans">
              <div className="mb-2 px-2 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Plain-English Mode Active: Technical blockchain events translated into donor guarantees
                </span>
                <span className="text-[10px] font-mono text-emerald-400/80">0 Jargon</span>
              </div>

              {filteredLogs.map((log, idx) => {
                const human = translateLogToHuman(log);

                let cardBorder = "border-slate-800 bg-slate-900/70 hover:border-slate-700";
                let badgeStyle = "bg-slate-800 text-slate-300 border-slate-700";
                let textHighlight = "text-slate-200";

                if (human.badgeColor === "emerald") {
                  cardBorder = "border-emerald-500/25 bg-emerald-950/15 hover:border-emerald-500/40";
                  badgeStyle = "bg-emerald-950/70 text-emerald-300 border-emerald-600/40";
                  textHighlight = "text-emerald-100 font-semibold";
                } else if (human.badgeColor === "indigo") {
                  cardBorder = "border-indigo-500/25 bg-indigo-950/15 hover:border-indigo-500/40";
                  badgeStyle = "bg-indigo-950/70 text-indigo-300 border-indigo-600/40";
                  textHighlight = "text-slate-100";
                } else if (human.badgeColor === "amber") {
                  cardBorder = "border-amber-500/30 bg-amber-950/15 hover:border-amber-500/50";
                  badgeStyle = "bg-amber-950/70 text-amber-300 border-amber-600/40";
                  textHighlight = "text-amber-100 font-semibold";
                } else if (human.badgeColor === "red") {
                  cardBorder = "border-red-500/40 bg-red-950/25 hover:border-red-500/60";
                  badgeStyle = "bg-red-950/80 text-red-300 border-red-500/50 animate-pulse";
                  textHighlight = "text-red-100 font-bold";
                }

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`p-3 rounded-xl border transition-all shadow-sm ${cardBorder}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl shrink-0 select-none pt-0.5">
                        {human.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                              {human.category}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {log.time.replace(/\[\+|\]/g, "")}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                            [{log.source}]
                          </span>
                        </div>

                        {/* Plain English Translation Sentence */}
                        <p className={`text-xs sm:text-[13px] leading-relaxed ${textHighlight}`}>
                          {human.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer Info */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span>
              Nullifier Registry: <span className="text-indigo-300 font-semibold">0x5C69...aA6f</span>
            </span>
            <span>
              PurposeBoundEscrow: <span className="text-indigo-300 font-semibold">0x3Af1...6E1</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Mode:{" "}
              <span className={`font-bold ${viewMode === "human" ? "text-emerald-400" : "text-indigo-400"}`}>
                {viewMode === "human" ? "Human Mode (Plain English)" : "Developer Mode (Raw Hex)"}
              </span>
            </span>
            <span>
              Latency: <span className="text-emerald-400 font-bold">~320ms</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicAuditStream;
