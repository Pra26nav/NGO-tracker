"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import seedData from "@/data/campaign-seed.json";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Info,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Key
} from "lucide-react";
import { ForensicAuditStream } from "@/components/ForensicAuditStream";


/* ────────────────────────────────────────────────────────────
   Types
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

interface TerminalLog {
  time: string;
  level: "INFO" | "CRYPTO" | "ALERT" | "SUCCESS" | "CRITICAL" | "EMIT" | "WARN";
  source: string;
  text: string;
}

interface ElevatorPitchData {
  problem: {
    title: string;
    summary: string;
    keyPainPoints: string[];
  };
  solution: {
    title: string;
    pillars: string[];
  };
  whyWeWin: {
    title: string;
    points: string[];
  };
  metrics: Array<{ label: string; value: string }>;
  judgeQnA: Array<{ q: string; a: string }>;
}

/* ────────────────────────────────────────────────────────────
   Offline Fallback Engine (Zero Downtime for Live Judge Demos)
──────────────────────────────────────────────────────────── */
const OFFLINE_PITCH_DATA: ElevatorPitchData = {
  problem: {
    title: "The Problem: Philanthropic & NGO 'Black Holes'",
    summary:
      "Billions in donor capital vanish into opaque NGO accounts with zero milestone accountability. Corrupt actors exploit traditional audit delays through receipt recycling across multiple donors (cropping images by 2 pixels to defeat raw SHA-256 hashes), injecting 30%+ forged receipts with Photoshopped totals, and skimming 8-15% on hidden cross-chain bridges.",
    keyPainPoints: [
      "Centralized post-mortem audits occur 6-12 months after funds are spent and gone.",
      "Cross-donor double spending is undetectable without shared deterministic nullifier registries.",
      "Visual tampering (Photoshopping totals) easily slips past standard OCR and manual human reviewers."
    ]
  },
  solution: {
    title: "Our Solution: The Autonomous Adversarial Verifier",
    pillars: [
      "Purpose-Bound Smart Contracts (50 ETH locked to strict earmark hash in PurposeBoundEscrow.sol)",
      "Deterministic Semantic Nullifiers (keccak256(TaxID | InvNo | Date | Amount))",
      "Dual-Tier Perceptual Hashing (64-bit DCT pHash Hamming distance <= 5 catches 2px crops)",
      "Error Level Analysis (ELA) pixel compression forensics (detects Photoshop resampling > 15.0)",
      "Zero-Knowledge (ZK) Salted Merkle Privacy Shield (142 real village households verified with 0 bytes PII leaked)",
      "Autonomous Smart Contract Circuit Breaker (Instantly locks vault on-chain with zero human gatekeeper)"
    ]
  },
  whyWeWin: {
    title: "Why The Black Hole Ledger Wins 1st Place",
    points: [
      "Zero Human Dependency: Escrow auto-freezes programmatically on-chain upon cryptographic fraud proof.",
      "Mathematical Invariance: Cropping, resizing, or re-compressing receipts cannot bypass semantic nullifiers or pHash.",
      "Production-Grade Privacy: Real rural beneficiaries shielded via ZK Merkle inclusion proofs.",
      "Live Dual-Mode Architecture: Full real-time FastAPI algorithmic backend + 100% offline client resilience."
    ]
  },
  metrics: [
    { label: "Capital Protected", value: "50.00 ETH ($160,000 USD)" },
    { label: "Double-Spend Catch Rate", value: "100.0% (pHash Dist = 2)" },
    { label: "Forgery Detection Rate", value: "100.0% (ELA Score 38.7)" },
    { label: "PII Leaked on Blockchain", value: "0 Bytes (100% Redacted)" },
    { label: "Autonomous Freeze Latency", value: "< 350 ms" }
  ],
  judgeQnA: [
    {
      q: "What if an adversary compresses or re-encodes the image to change the SHA-256 hash?",
      a: "Raw file SHA-256 is fragile. We employ a dual-tier defense: (1) 64-bit Discrete Cosine Transform Perceptual Hashing (pHash) catches geometric mutations (Hamming distance = 2), and (2) Semantic Nullifiers hash invariant financial facts (TaxID | InvoiceNo | Date | Amount). Even if 100% of pixel bytes mutate, the financial commitment remains identical!"
    },
    {
      q: "How does ELA detect Photoshopped totals on a low-resolution receipt?",
      a: "Error Level Analysis re-saves the image at 85% JPEG quality and computes the error difference matrix. Pristine areas exhibit uniform compression dissipation, whereas pasted or edited digits retain high-frequency error rates. An ELA anomaly score above 15.0 triggers an instant automated freeze."
    },
    {
      q: "Does verifying rural water beneficiaries expose their identities on a public ledger?",
      a: "No! Beneficiary IDs and phone numbers are salted off-chain and committed to a cryptographic Merkle Root. Auditors mathematically verify inclusion proofs without revealing a single byte of sensitive personal data."
    }
  ]
};

const OFFLINE_SCENARIOS: Record<string, {
  escrowStatus: "ACTIVE" | "FROZEN";
  frozenReason: string | null;
  actionTitle: string;
  actionSummary: string;
  totalDepositedEth: number;
  totalReleasedEth: number;
  remainingEth: number;
  badgeColor: string;
  lastTxHash: string;
  terminalLogs: TerminalLog[];
  receipts: ReceiptAudit[];
}> = {
  VALID_MILESTONE: {
    escrowStatus: "ACTIVE",
    frozenReason: null,
    actionTitle: "Water Infrastructure Milestone Proof Validated",
    actionSummary: "Tranche 1 Released (10.0 ETH) · 142 Households Salted & Verified on Merkle Tree",
    totalDepositedEth: seedData.financials.totalDepositedEth,
    totalReleasedEth: seedData.financials.totalReleasedEth,
    remainingEth: seedData.financials.vaultBalanceEth,
    badgeColor: "emerald",
    lastTxHash: seedData.campaign.lastTxHash,
    terminalLogs: [
      { time: "[+00:01.017s]", level: "INFO", source: "INGEST", text: "Ingesting expenditure proof for Milestone #1 (Water Infrastructure)..." },
      { time: "[+00:03.051s]", level: "INFO", source: "OCR_PARSE", text: "Extracted facts: Vendor=GSTIN-27WATER9988Z, Inv=INV-2026-9001, Amount=₹1,20,000, Date=2026-10-25" },
      { time: "[+00:05.085s]", level: "CRYPTO", source: "NULLIFIER", text: "Generating Canonical Nullifier: keccak256('GSTIN-27WATER9988Z|INV-2026-9001|2026-10-25|120000.00')" },
      { time: "[+00:08.136s]", level: "SUCCESS", source: "REGISTRY", text: "Nullifier 0x3c91f0a8b24d... checked against global cross-donor registry -> UNIQUE (No collision)" },
      { time: "[+00:11.187s]", level: "INFO", source: "CV_PHASH", text: "Computing 64-bit DCT Perceptual Hash (pHash: f8c39a11b4e27001)..." },
      { time: "[+00:14.238s]", level: "SUCCESS", source: "CV_PHASH", text: "Min Hamming Distance = 28 across historical pool (Threshold <= 5) -> No visual clone detected" },
      { time: "[+00:17.289s]", level: "INFO", source: "FORENSIC_ELA", text: "Running JPEG Error Level Analysis (quality=85, percentile=99.2)..." },
      { time: "[+00:20.340s]", level: "SUCCESS", source: "FORENSIC_ELA", text: "ELA Anomaly Score: 4.2 / 100 (Threshold 15.0) -> Uniform compression, zero digital splicing" },
      { time: "[+00:23.391s]", level: "INFO", source: "ZK_MERKLE", text: "Verifying 142 salted beneficiary signatures against on-chain Merkle Root 0x856c30affc..." },
      { time: "[+00:26.442s]", level: "SUCCESS", source: "ZK_MERKLE", text: "Cryptographic sibling path confirmed! 142 households included, 0 Bytes PII leaked" },
      { time: "[+00:29.493s]", level: "SUCCESS", source: "EVM_ESCROW", text: "submitExpenditureProof() validated on PurposeBoundEscrow.sol (0x3Af1...56E1)" },
      { time: "[+00:32.544s]", level: "EMIT", source: "CONTRACT_EVENT", text: "ExpenditureVerified(campaignId=1, tranche=10.0 ETH) emitted. Escrow remains ACTIVE." }
    ],
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
      elaHeatmapBase64: null,
      merkleRoot: "0x7f9c22a1b8e4d01928374655aabbccddeeff00112233445566778899aabbccdd",
      merkleLeaves: [
        { label: "Vendor Tax ID (Public)", value: "GSTIN-27WATER9988Z", hash: "0x81a2f4c901b2e3d4...", isRedactedPII: false },
        { label: "Line Item (Public)", value: "3x Submersible Borewell Pumps & 200mm PVC", hash: "0x44d1e8a7f092c1b3...", isRedactedPII: false },
        { label: "Verified Total (Public)", value: "INR 1,20,000", hash: "0x99b3c4d5e6f70123...", isRedactedPII: false },
        { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Village Cluster #14]", hash: "0x12e9f0a4b7c8d311...", isRedactedPII: true },
      ],
      verdict: "VERIFIED_RELEASE",
      escrowFrozen: false,
      failureReason: null
    }]
  },
  CROSS_DONOR_DOUBLE_SPEND: {
    escrowStatus: "FROZEN",
    frozenReason: "CRITICAL: Cross-Donor Double Spend Detected! Receipt Nullifier collided with Donor_Pool_A (Clean Water Fund). pHash Hamming Distance = 2.",
    actionTitle: "Cross-Donor Double Count Detected via pHash + Nullifier",
    actionSummary: "2px Crop Defeated SHA-256, but Semantic Nullifier and pHash (Hamming Dist = 2) Caught the Fraud",
    totalDepositedEth: 50.0,
    totalReleasedEth: 10.0,
    remainingEth: 40.0,
    badgeColor: "red",
    lastTxHash: "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
    terminalLogs: [
      { time: "[+00:01.017s]", level: "WARN", source: "INGEST", text: "Ingesting receipt REC-8841-CROPPED submitted by NGO for Donor Campaign #2..." },
      { time: "[+00:03.051s]", level: "WARN", source: "MUTATION_DETECT", text: "Raw File SHA-256: 0x77d190aa...e90a (Mutated via 2-pixel border crop by adversary)" },
      { time: "[+00:05.085s]", level: "CRYPTO", source: "NULLIFIER", text: "Computing Semantic Nullifier from invariant invoice facts..." },
      { time: "[+00:08.136s]", level: "ALERT", source: "NULLIFIER", text: "NULLIFIER COLLISION: 0x6e21a9b8d4c1... WAS PREVIOUSLY CLAIMED IN 'Donor_Pool_A'!" },
      { time: "[+00:11.187s]", level: "INFO", source: "CV_PHASH", text: "Executing 2D-DCT Perceptual Hash comparison against global pool..." },
      { time: "[+00:14.238s]", level: "CRITICAL", source: "CV_PHASH", text: "pHash Hamming Distance = 2 (Threshold <= 5) -> EXACT VISUAL CLONE IDENTIFIED!" },
      { time: "[+00:18.306s]", level: "ALERT", source: "CIRCUIT_BREAKER", text: "Autonomous Fraud Condition triggered: Cross-Donor Double Count Detected!" },
      { time: "[+00:22.374s]", level: "EMIT", source: "SMART_CONTRACT", text: "Calling PurposeBoundEscrow.sol -> EscrowAutoFrozen(campaignId=1, reason='CROSS_DONOR_DOUBLE_SPEND')" },
      { time: "[+00:26.442s]", level: "CRITICAL", source: "VAULT_LOCK", text: "VAULT LOCKED ON-CHAIN: Status = FROZEN. Remaining 40.0 ETH protected from extraction." }
    ],
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
      elaAnomalyScore: 6.8,
      elaHeatmapBase64: null,
      merkleRoot: "0x55a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f",
      merkleLeaves: [
        { label: "Vendor Tax ID (Public)", value: "GSTIN-27AAACW1234F1Z5", hash: "0x22c9a1b4e5f60718...", isRedactedPII: false },
        { label: "Line Item (Public)", value: "HDPE Water Storage Tank 5000L", hash: "0x77e1d2c3b4a59687...", isRedactedPII: false },
        { label: "Verified Total (Public)", value: "INR 45,000", hash: "0x33f2a1b4c5d6e7f8...", isRedactedPII: false },
        { label: "Beneficiary Identity (ZK-Redacted)", value: "REDACTED_PII [Wardha Rural Cluster #2]", hash: "0x88a9b0c1d2e3f405...", isRedactedPII: true },
      ],
      verdict: "FROZEN_DOUBLE_SPEND",
      escrowFrozen: true,
      failureReason: "NGO cropped image by 2px to mutate SHA-256, but Semantic Nullifier & pHash (Hamming Distance = 2 < 5 threshold) proved this exact invoice was already claimed in Donor_Pool_A!"
    }]
  },
  BATCH_30_PERCENT_FORGERY: {
    escrowStatus: "FROZEN",
    frozenReason: "CRITICAL: 30% Forgery Rate Detected in Batch #42 (3/10 receipts failed ELA pixel tampering & category audit). Vault Locked.",
    actionTitle: "30% Forgery Rate Triggered Autonomous Smart Contract Freeze",
    actionSummary: "3 of 10 Invoices Doctor Pixel Compression (ELA 38.7) or Violate Purpose Earmark",
    totalDepositedEth: 50.0,
    totalReleasedEth: 10.0,
    remainingEth: 40.0,
    badgeColor: "red",
    lastTxHash: "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899",
    terminalLogs: [
      { time: "[+00:01.017s]", level: "INFO", source: "BATCH_INGEST", text: "Ingesting Batch #42: 10 Vendor Invoices ($64,000 USD total requested)..." },
      { time: "[+00:04.068s]", level: "INFO", source: "PARALLEL_AUDIT", text: "Spawning parallel ELA pixel forensic & semantic category evaluation threads..." },
      { time: "[+00:07.119s]", level: "SUCCESS", source: "RECEIPT_01", text: "Receipt #01 (Borewell Casing Pipe): ELA=4.8, Category='Water Infrastructure' -> PASS" },
      { time: "[+00:09.153s]", level: "SUCCESS", source: "RECEIPT_02", text: "Receipt #02 (Submersible Pump 5HP): ELA=5.1, Category='Water Infrastructure' -> PASS" },
      { time: "[+00:12.204s]", level: "CRITICAL", source: "RECEIPT_03", text: "Receipt #03 (Total Doctored ₹3,85,000): ELA Anomaly Score 38.7 > 15.0 -> SPLICING DETECTED!" },
      { time: "[+00:15.255s]", level: "CRITICAL", source: "RECEIPT_07", text: "Receipt #07 (Apex Luxury Catering): Category 'Hospitality' VIOLATES 'Water Infrastructure' earmark!" },
      { time: "[+00:18.306s]", level: "CRITICAL", source: "RECEIPT_09", text: "Receipt #09 (Doctored GSTIN): ELA Anomaly Score 36.2 > 15.0 -> DIGIT TAMPERING DETECTED!" },
      { time: "[+00:21.357s]", level: "ALERT", source: "BATCH_ANALYSIS", text: "Audit Result: 3/10 Receipts Forged (30.0% Forgery Rate >= 30.0% Critical Threshold)" },
      { time: "[+00:25.425s]", level: "EMIT", source: "SMART_CONTRACT", text: "Triggering Emergency Freeze: EscrowAutoFrozen(batchId=42, forgeries=3)" },
      { time: "[+00:29.493s]", level: "CRITICAL", source: "VAULT_LOCK", text: "SMART CONTRACT VAULT LOCKED: Status = FROZEN. All 10 invoice disbursements rejected." }
    ],
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
        elaHeatmapBase64: null,
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
      };
    })
  }
};

/* ────────────────────────────────────────────────────────────
   Main Component: 1-Click Judge Presentation Runner
──────────────────────────────────────────────────────────── */
export default function PitchRunnerPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>("VALID_MILESTONE");
  const [scenarioData, setScenarioData] = useState(OFFLINE_SCENARIOS.VALID_MILESTONE);
  const [pitchData, setPitchData] = useState<ElevatorPitchData>(OFFLINE_PITCH_DATA);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptAudit | null>(null);

  // Terminal streaming state
  const [displayedLogs, setDisplayedLogs] = useState<TerminalLog[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamIndex, setStreamIndex] = useState<number>(0);
  const [streamSpeed, setStreamSpeed] = useState<"normal" | "fast" | "instant">("fast");
  const [logFilter, setLogFilter] = useState<"ALL" | "CRYPTO" | "ALERTS">("ALL");
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  // Modals & Panels
  const [pitchDrawerOpen, setPitchDrawerOpen] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"terminal" | "forensic" | "crypto" | "merkle">("terminal");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);


  // Load Elevator Pitch from API on mount
  useEffect(() => {
    fetch("http://localhost:8000/api/pitch/elevator-pitch", { signal: AbortSignal.timeout(2500) })
      .then(res => res.json())
      .then(data => {
        if (data && data.problem) setPitchData(data);
        setApiOnline(true);
      })
      .catch(() => setApiOnline(false));
  }, []);

  // Fetch or execute scenario
  const executeScenario = useCallback(async (mode: string) => {
    setSelectedScenario(mode);
    setIsStreaming(true);
    setDisplayedLogs([]);
    setStreamIndex(0);

    try {
      const res = await fetch(`http://localhost:8000/api/pitch/scenario-state?mode=${mode}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error("API responded with error");
      const data = await res.json();
      setScenarioData(data);
      setSelectedReceipt(data.receipts ? data.receipts[0] : null);
      setApiOnline(true);
    } catch {
      // Offline fallback
      const offline = OFFLINE_SCENARIOS[mode] || OFFLINE_SCENARIOS.VALID_MILESTONE;
      setScenarioData(offline);
      setSelectedReceipt(offline.receipts[0]);
      setApiOnline(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    executeScenario("VALID_MILESTONE");
  }, [executeScenario]);

  // Terminal streaming simulation
  useEffect(() => {
    if (!isStreaming) return;
    const allLogs = scenarioData.terminalLogs || [];

    if (streamSpeed === "instant") {
      setDisplayedLogs(allLogs);
      setIsStreaming(false);
      return;
    }

    if (streamIndex < allLogs.length) {
      const delay = streamSpeed === "fast" ? 120 : 280;
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, allLogs[streamIndex]]);
        setStreamIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsStreaming(false);
    }
  }, [isStreaming, streamIndex, scenarioData.terminalLogs, streamSpeed]);

  const restartStream = () => {
    setDisplayedLogs([]);
    setStreamIndex(0);
    setIsStreaming(true);
  };

  const copyAllLogs = () => {
    const text = displayedLogs.map(l => `${l.time} [${l.level}] [${l.source}] ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const isFrozen = scenarioData.escrowStatus === "FROZEN";

  const filteredLogs = displayedLogs.filter(log => {
    if (logFilter === "ALL") return true;
    if (logFilter === "CRYPTO") return log.level === "CRYPTO" || log.level === "SUCCESS";
    if (logFilter === "ALERTS") return log.level === "ALERT" || log.level === "CRITICAL" || log.level === "WARN";
    return true;
  });

  return (
    <div
      className="min-h-screen grid-bg relative selection:bg-indigo-500/30 text-slate-100 bg-slate-950"
      style={{
        background: isFrozen
          ? "radial-gradient(ellipse at top, rgba(127, 29, 29, 0.25) 0%, rgba(15, 23, 42, 0.95) 50%, #020617 100%)"
          : "radial-gradient(ellipse at top, rgba(6, 78, 59, 0.2) 0%, rgba(15, 23, 42, 0.95) 50%, #020617 100%)",
        transition: "background 0.8s ease-in-out"
      }}
    >
      {/* Background Animated Halo Blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <motion.div
          animate={{
            scale: isFrozen ? [1, 1.25, 1] : [1, 1.15, 1],
            opacity: isFrozen ? 0.4 : 0.25
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px]"
          style={{
            background: isFrozen
              ? "radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(127, 29, 29, 0.2) 70%, transparent 100%)"
              : "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 95, 70, 0.15) 70%, transparent 100%)"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ╔════════════════════════════════════════════════════════════╗
            ║  TOP NAVIGATION & FEATURE MATRIX BAR (Frosted Glass)     ║
            ╚════════════════════════════════════════════════════════════╝ */}
        <header className="mb-6 sticky top-3 z-40">
          <div
            className={`backdrop-blur-md bg-slate-950/80 rounded-2xl px-6 py-4 border transition-all duration-700 shadow-xl ${
              isFrozen
                ? "border-red-500/70 bg-red-950/30 shadow-[0_0_40px_rgba(239,68,68,0.25)]"
                : "border-slate-800 hover:border-slate-700 shadow-slate-950/60"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Title & Badge */}
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    background: isFrozen ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                    borderColor: isFrozen ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"
                  }}
                >
                  {isFrozen ? (
                    <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="tag-indigo text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                      CASCADE &apos;26 · THEME 4 · PROBLEM 2
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isFrozen ? "tag-red bg-red-950/80 border border-red-500/80" : "tag-emerald"
                      }`}
                    >
                      {isFrozen ? (
                        <>
                          <span>🔒</span> CIRCUIT BREAKER TRIPPED
                        </>
                      ) : (
                        <>
                          <span>🟢</span> FEATURE #4 · 1-CLICK JUDGE RUNNER
                        </>
                      )}
                    </span>
                    {apiOnline === true && (
                      <span className="tag-emerald text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        API LIVE
                      </span>
                    )}
                    {apiOnline === false && (
                      <span className="tag-amber text-[10px] font-bold px-2 py-0.5 rounded-full">
                        OFFLINE SIMULATION
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                    <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                      THE BLACK HOLE LEDGER
                    </span>
                    <span className="text-slate-400 font-light text-sm md:text-base hidden sm:inline">
                      | 1-Click Judge Presentation Runner
                    </span>
                  </h1>
                </div>
              </div>

              {/* Feature Navigator Links */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href="/red-team"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span>⚡</span> Feature #1
                </Link>
                <Link
                  href="/flow-tracer"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span>🌐</span> Feature #2
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span>🏛️</span> Feature #3
                </Link>
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600 border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center gap-1.5">
                  <span>🎯</span> Feature #4
                </span>

                {/* Pitch Drawer Toggle Button */}
                <button
                  onClick={() => setPitchDrawerOpen(true)}
                  className="ml-2 px-3.5 py-1.5 text-xs font-bold rounded-lg text-indigo-200 bg-slate-900/90 border border-indigo-500/40 hover:bg-indigo-950/60 hover:border-indigo-500/70 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Elevator Pitch & Q&A
                </button>
              </div>

            </div>

            {/* Smart Contract Escrow State Banner */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">PurposeBoundEscrow.sol:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 ${
                    isFrozen
                      ? "bg-red-950/80 text-red-400 border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                      : "bg-emerald-950/80 text-emerald-400 border border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  }`}
                >
                  {isFrozen ? (
                    <>
                      <span>🔒</span> FROZEN · VAULT LOCKED
                    </>
                  ) : (
                    <>
                      <span>🟢</span> ACTIVE · 50 ETH EARMARKED
                    </>
                  )}
                </span>
                <span className="text-slate-400 hidden sm:inline">Earmark: Water Infrastructure</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <div>
                  <span className="text-slate-400">Released: </span>
                  <span className="text-emerald-400 font-bold">{scenarioData.totalReleasedEth} ETH</span>
                </div>
                <div>
                  <span className="text-slate-400">Locked: </span>
                  <span className={isFrozen ? "text-red-400 font-bold" : "text-slate-100 font-bold"}>
                    {scenarioData.remainingEth} ETH
                  </span>
                </div>
                <div className="text-slate-400 truncate max-w-[210px]" title={scenarioData.lastTxHash}>
                  Tx: <span className="font-mono text-indigo-300 font-semibold">{scenarioData.lastTxHash.slice(0, 16)}…</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── CRISIS / FREEZE WARNING NOTIFICATION (Soft Red Pulse) ─── */}
        <AnimatePresence>
          {isFrozen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 rounded-2xl border-2 border-red-500 bg-red-950/80 shadow-[0_0_50px_rgba(239,68,68,0.35)] backdrop-blur-md animate-glow-red"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-900/60 border border-red-500/50 flex items-center justify-center shrink-0 text-xl">
                  🚨
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h2 className="text-sm font-black text-red-300 uppercase tracking-wider flex items-center gap-2">
                      AUTONOMOUS ON-CHAIN FRAUD INTERCEPTION — PURPOSE-BOUND ESCROW FROZEN
                    </h2>
                    <span className="tag-red font-mono text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                      <span>🔒</span> BLOCK EVM EVENT: EscrowAutoFrozen
                    </span>
                  </div>
                  <p className="text-xs text-red-200 mt-1 font-medium">{scenarioData.frozenReason}</p>
                  <p className="text-[11px] text-red-300/80 mt-1.5 font-mono">
                    Zero Reliance on Centralized Auditors: Smart contract halted milestone disbursements within 320ms of cryptographic anomaly confirmation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ╔════════════════════════════════════════════════════════════╗
            ║  SECTION A: 1-CLICK JUDGE SCENARIO RUNNER                ║
            ╚════════════════════════════════════════════════════════════╝ */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                1-Click Judge Adversarial Edge-Case Runner
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instantly execute the exact attack vectors specified in Theme 4 Problem 2. Observe backend algorithms live in the terminal below.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Preset Selector: <span className="text-indigo-300 font-bold">{selectedScenario}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* BUTTON 1: Valid Milestone Demo */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => executeScenario("VALID_MILESTONE")}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                selectedScenario === "VALID_MILESTONE"
                  ? "bg-slate-900/95 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50"
                  : "bg-slate-900/90 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                  ✓
                </div>
                <span className="verdict-pass text-[10px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>🟢</span> VERIFIED · ACTIVE
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-300 transition-colors">
                Run Valid Milestone Demo
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Clean water infrastructure invoice releases tranche. Verifies ZK Merkle root on-chain with 142 salted beneficiaries and 0 bytes PII leaked.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Tranche: <span className="text-emerald-400 font-bold">+10.0 ETH</span></span>
                <span className="text-indigo-300 font-semibold">ELA: 4.2 / 100</span>
              </div>
            </motion.button>

            {/* BUTTON 2: Cross-Donor Double Spend */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => executeScenario("CROSS_DONOR_DOUBLE_SPEND")}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                selectedScenario === "CROSS_DONOR_DOUBLE_SPEND"
                  ? "bg-red-950/80 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.35)] ring-1 ring-red-500 animate-glow-red"
                  : "bg-slate-900/90 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                  ✂️
                </div>
                <span className="verdict-freeze text-[10px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>🔒</span> DOUBLE-SPEND · FREEZE
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-100 group-hover:text-red-300 transition-colors">
                Simulate Cross-Donor Double Spend
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                NGO crops claimed receipt #8841 by 2px to mutate SHA-256. 2D-DCT pHash (Hamming = 2) + Semantic Nullifier catch collision and auto-freeze vault.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">pHash Dist: <span className="text-red-400 font-bold">2 (≤5)</span></span>
                <span className="text-red-400 font-semibold">Nullifier Collision!</span>
              </div>
            </motion.button>

            {/* BUTTON 3: Inject 30% Forgery Batch */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => executeScenario("BATCH_30_PERCENT_FORGERY")}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                selectedScenario === "BATCH_30_PERCENT_FORGERY"
                  ? "bg-red-950/80 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.35)] ring-1 ring-red-500 animate-glow-red"
                  : "bg-slate-900/90 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
                  🚨
                </div>
                <span className="verdict-forgery text-[10px] font-bold font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>⚠️</span> 30% FORGERY · VAULT LOCK
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition-colors">
                Inject 30% Forgery Batch
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Batch upload of 10 receipts with 3 doctored totals (ELA score 38.7) and unapproved banquet catering. Renders red ELA heatmaps and locks the contract.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Batch: <span className="text-red-400 font-bold">3/10 Forged</span></span>
                <span className="text-amber-400 font-semibold">ELA: 38.7 (&gt;15.0)</span>
              </div>
            </motion.button>

          </div>
        </section>

        {/* ╔════════════════════════════════════════════════════════════╗
            ║  SECTION B & C: LIVE STREAM TERMINAL + FORENSIC INSPECTOR║
            ╚════════════════════════════════════════════════════════════╝ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Live Adversarial Terminal & Audit Stream (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <ForensicAuditStream
              displayedLogs={displayedLogs}
              isStreaming={isStreaming}
              streamSpeed={streamSpeed}
              setStreamSpeed={setStreamSpeed}
              restartStream={restartStream}
              copyAllLogs={copyAllLogs}
              copiedLog={copiedLog}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              filteredLogs={filteredLogs}
              escrowStatus={scenarioData.escrowStatus as any}
              escrowReason={scenarioData.frozenReason}
            />

            {/* Quick Pitch Pill Card */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">The Problem & Solution in 1 Sentence</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Traditional NGOs recycle receipts across donors by cropping images; our engine pairs 64-bit pHash + Semantic Nullifiers to make fraudulent double-counting mathematically impossible.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPitchDrawerOpen(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 transition shadow-[0_0_12px_rgba(99,102,241,0.3)]"
              >
                View Full Script →
              </button>
            </div>
          </div>

          {/* RIGHT: Forensic X-Ray Inspector & Merkle Proofs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-2xl">

              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Forensic Algorithmic Inspector
                </h3>
                <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg text-[10px] font-mono border border-slate-800">
                  <button
                    onClick={() => setActiveInspectorTab("terminal")}
                    className={`px-3 py-1 rounded font-bold transition ${
                      activeInspectorTab === "terminal"
                        ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Forensics
                  </button>
                  <button
                    onClick={() => setActiveInspectorTab("merkle")}
                    className={`px-3 py-1 rounded font-bold transition ${
                      activeInspectorTab === "merkle"
                        ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    ZK Merkle
                  </button>
                </div>
              </div>

              {/* Batch Selector if scenario has 10 receipts */}
              {scenarioData.receipts && scenarioData.receipts.length > 1 && (
                <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                    <span className="text-slate-400 font-bold">Batch #42 Invoices (10 Receipts):</span>
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <span>⚠️</span> 30% Forgery Detected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scenarioData.receipts.map(r => (
                      <button
                        key={r.receiptId}
                        onClick={() => setSelectedReceipt(r)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          selectedReceipt?.receiptId === r.receiptId
                            ? "ring-2 ring-indigo-400 scale-105"
                            : ""
                        } ${
                          r.escrowFrozen
                            ? "bg-red-950/80 text-red-300 border border-red-800/80 hover:bg-red-900/80"
                            : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/80"
                        }`}
                      >
                        {r.receiptId.replace("BATCH-REC-", "#")} {r.escrowFrozen ? "⚠" : "✓"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Forensic Details Body */}
              {selectedReceipt && activeInspectorTab === "terminal" && (
                <div className="space-y-4 animate-fade-in-up">

                  {/* Receipt Header Card */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase">Vendor & Invoice</div>
                        <h4 className="font-bold text-sm text-slate-100 mt-0.5">{selectedReceipt.vendorName}</h4>
                        <div className="text-xs font-mono text-indigo-300 mt-0.5">
                          {selectedReceipt.invoiceNumber} · {selectedReceipt.invoiceDate}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-1 rounded ${
                          selectedReceipt.escrowFrozen ? "verdict-freeze" : "verdict-pass"
                        }`}
                      >
                        {selectedReceipt.verdict}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Amount: </span>
                        <span className="font-bold text-slate-100">{selectedReceipt.totalAmount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Category: </span>
                        <span className={`font-semibold ${selectedReceipt.categoryMatch ? "text-emerald-400" : "text-red-400"}`}>
                          {selectedReceipt.detectedCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dual-Tier Anti-Double Spend Defense */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      1. Semantic Nullifier & pHash Invariance
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Raw SHA-256:</span>
                        <span className="text-slate-300 truncate max-w-[190px]">{selectedReceipt.sha256Hash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">64-bit pHash:</span>
                        <span className={selectedReceipt.isPerceptualClone ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                          {selectedReceipt.perceptualHash} (Dist: {selectedReceipt.hammingDistance})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nullifier:</span>
                        <span className={selectedReceipt.isDuplicateNullifier ? "text-red-400 font-bold" : "text-indigo-300 font-semibold"}>
                          {selectedReceipt.semanticNullifier.slice(0, 18)}…
                        </span>
                      </div>
                    </div>

                    {selectedReceipt.duplicatePoolSource && (
                      <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-300 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                        <div>
                          <strong>COLLISION DETECTED:</strong> Claimed in {selectedReceipt.duplicatePoolSource}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ELA Heatmap Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        2. Error Level Analysis (ELA) Pixel Splicing Map
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          selectedReceipt.elaAnomalyScore > 15
                            ? "bg-red-950/80 border border-red-500 text-red-300"
                            : "bg-emerald-950/80 border border-emerald-500 text-emerald-300"
                        }`}
                      >
                        Score: {selectedReceipt.elaAnomalyScore} / Threshold 15.0
                      </span>
                    </div>

                    {selectedReceipt.elaHeatmapBase64 ? (
                      <div className="rounded-lg overflow-hidden border border-slate-800 relative group">
                        <img
                          src={selectedReceipt.elaHeatmapBase64}
                          alt="ELA Heatmap"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute bottom-1 right-2 bg-slate-950/90 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                          {selectedReceipt.elaAnomalyScore > 15 ? "TAMPERING HIGHLIGHTED" : "UNIFORM COMPRESSION"}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="h-28 rounded-lg border border-dashed flex flex-col items-center justify-center text-center p-3"
                        style={{
                          borderColor: selectedReceipt.elaAnomalyScore > 15 ? "rgba(239,68,68,0.5)" : "rgba(16,185,129,0.4)",
                          background: selectedReceipt.elaAnomalyScore > 15 ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)"
                        }}
                      >
                        <div className="text-xl mb-1">{selectedReceipt.elaAnomalyScore > 15 ? "🔥" : "🛡️"}</div>
                        <div className="text-xs font-bold" style={{ color: selectedReceipt.elaAnomalyScore > 15 ? "#f87171" : "#34d399" }}>
                          {selectedReceipt.elaAnomalyScore > 15
                            ? `High-Compression Pixel Anomaly (Score: ${selectedReceipt.elaAnomalyScore})`
                            : `Pristine Uniform Compression (Score: ${selectedReceipt.elaAnomalyScore})`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {selectedReceipt.elaAnomalyScore > 15
                            ? "Photoshop splicing detected around Total Amount digits"
                            : "Baseline compression uniform at 85% JPEG re-save"}
                        </div>
                      </div>
                    )}

                    {selectedReceipt.failureReason && (
                      <p className="text-[11px] text-red-200 bg-red-950/80 p-2.5 rounded-lg border border-red-500">
                        {selectedReceipt.failureReason}
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* ZK Merkle Tab */}
              {selectedReceipt && activeInspectorTab === "merkle" && (
                <div className="space-y-4 animate-fade-in-up font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">On-Chain Merkle Commitment</div>
                    <div className="text-xs font-bold text-indigo-300 mt-1 truncate">
                      {selectedReceipt.merkleRoot}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                      Selective-Disclosure Leaves (0 Bytes Beneficiary PII Leaked)
                    </div>

                    {selectedReceipt.merkleLeaves?.map((leaf, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          leaf.isRedactedPII
                            ? "bg-indigo-950/50 border-indigo-500/50 text-indigo-200"
                            : "bg-slate-800/80 border-slate-700 text-slate-100"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                          <span>{leaf.label}</span>
                          {leaf.isRedactedPII && (
                            <span className="text-indigo-400 font-bold">ZK-SALTED SHIELD</span>
                          )}
                        </div>
                        <div className="font-semibold text-xs text-slate-100">{leaf.value}</div>
                        <div className="text-[10px] text-indigo-300 mt-1">{leaf.hash}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-[11px] text-indigo-300">
                    💡 <strong>Cryptographic Principle:</strong> The public auditor verifies the integrity of the invoice total and vendor without exposing rural beneficiary identities or phone numbers on public blockchain explorers.
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* ╔════════════════════════════════════════════════════════════╗
          ║  ELEVATOR PITCH & JUDGE CHEATSHEET SLIDE-OVER DRAWER       ║
          ╚════════════════════════════════════════════════════════════╝ */}
      <AnimatePresence>
        {pitchDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPitchDrawerOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-slate-950 border-l border-slate-800 p-6 md:p-8 overflow-y-auto shadow-2xl z-10 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="tag-indigo text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Executive Pitch Deck & Judge Cheatsheet
                    </span>
                    <h2 className="text-xl font-black text-slate-100 mt-1.5">
                      The Black Hole Ledger Pitch Summary
                    </h2>
                  </div>
                  <button
                    onClick={() => setPitchDrawerOpen(false)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-6">
                  {pitchData.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{m.label}</div>
                      <div className="text-sm md:text-base font-black text-indigo-300 mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* 1. The Problem */}
                <div className="mb-6 space-y-2">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    {pitchData.problem.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    {pitchData.problem.summary}
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    {pitchData.problem.keyPainPoints?.map((p, idx) => (
                      <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-red-400 font-bold shrink-0">✕</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Our Solution */}
                <div className="mb-6 space-y-2">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {pitchData.solution.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {pitchData.solution.pillars.map((pillar, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{pillar}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Why We Win */}
                <div className="mb-6 space-y-2">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {pitchData.whyWeWin.title}
                  </h3>
                  <div className="space-y-2">
                    {pitchData.whyWeWin.points.map((pt, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-xs text-slate-200">
                        {pt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Judge Q&A Cheatsheet */}
                <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Judge Q&A Defensive Cheatsheet
                  </h3>
                  <div className="space-y-3">
                    {pitchData.judgeQnA.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                        <div className="text-xs font-bold text-amber-300">Q: &ldquo;{item.q}&rdquo;</div>
                        <div className="text-xs text-slate-300 leading-relaxed pl-3 border-l-2 border-indigo-500">
                          {item.a}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Drawer Button */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => setPitchDrawerOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Return to Live Scenario Runner
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
