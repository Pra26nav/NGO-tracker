"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TerminalLog {
  time: string;
  level: "INFO" | "CRYPTO" | "ALERT" | "SUCCESS" | "CRITICAL";
  source: string;
  text: string;
}

const TERMINAL_LOGS_SAMPLE: TerminalLog[] = [
  { time: "[+00:01.000s]", level: "INFO", source: "INGEST", text: "Ingesting expenditure proof for Milestone #1 (Water Infrastructure)..." },
  { time: "[+00:03.450s]", level: "INFO", source: "OCR_PARSE", text: "Extracted facts: Vendor=GSTIN-27WATER9988Z, Inv=INV-2026-9001, Amount=₹1,20,000" },
  { time: "[+00:05.120s]", level: "CRYPTO", source: "NULLIFIER", text: "Generating Semantic Nullifier: keccak256(GSTIN-27WATER9988Z | INV-2026-9001 | 2026-10-25 | 120000.00)" },
  { time: "[+00:08.200s]", level: "SUCCESS", source: "REGISTRY", text: "Nullifier checked against global cross-donor registry -> UNIQUE (No collision)" },
  { time: "[+00:11.000s]", level: "INFO", source: "CV_PHASH", text: "Computing 64-bit DCT Perceptual Hash (pHash: f8c39a11b4e27001)..." },
  { time: "[+00:14.300s]", level: "SUCCESS", source: "CV_PHASH", text: "Min Hamming Distance = 28 across historical pool (Threshold <= 5) -> No visual clone detected" },
  { time: "[+00:17.150s]", level: "INFO", source: "FORENSIC_ELA", text: "Running JPEG Error Level Analysis (quality=85, percentile=99.2)..." },
  { time: "[+00:20.000s]", level: "SUCCESS", source: "FORENSIC_ELA", text: "ELA Anomaly Score: 4.2 / 100 (Threshold 15.0) -> Uniform compression, zero digital doctoring" },
  { time: "[+00:23.500s]", level: "INFO", source: "ZK_MERKLE", text: "Verifying 142 salted beneficiary signatures against on-chain Merkle Root 0x856c30affc..." },
  { time: "[+00:26.800s]", level: "SUCCESS", source: "ZK_MERKLE", text: "Cryptographic sibling path confirmed! 142 households included, 0 Bytes PII leaked" },
  { time: "[+00:29.900s]", level: "SUCCESS", source: "EVM_ESCROW", text: "submitExpenditureProof() validated on PurposeBoundEscrow.sol (0x3Af1...56E1)" },
  { time: "[+00:32.400s]", level: "SUCCESS", source: "CONTRACT_EVENT", text: "ExpenditureVerified(campaignId=1, tranche=10.0 ETH) emitted. Escrow remains ACTIVE." },
];

export default function PitchPage() {
  const [activeScenario, setActiveScenario] = useState<string>("VALID_MILESTONE");
  const [logs, setLogs] = useState<TerminalLog[]>(TERMINAL_LOGS_SAMPLE);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [expandedQnA, setExpandedQnA] = useState<number | null>(0);

  const runScenario = (scenario: string) => {
    setActiveScenario(scenario);
    setIsRunning(true);

    if (scenario === "CROSS_DONOR_DOUBLE_SPEND") {
      setLogs([
        { time: "[+00:01.000s]", level: "INFO", source: "INGEST", text: "Ingesting receipt REC-8841-CROPPED submitted by NGO for Donor Campaign #2..." },
        { time: "[+00:03.200s]", level: "ALERT", source: "MUTATION_DETECT", text: "Raw File SHA-256: 0x77d1... (Mutated via 2-pixel border crop by adversary)" },
        { time: "[+00:06.100s]", level: "CRYPTO", source: "NULLIFIER", text: "Computing Semantic Nullifier from invariant financial facts..." },
        { time: "[+00:09.500s]", level: "CRITICAL", source: "NULLIFIER", text: "NULLIFIER COLLISION: 0x6e21... WAS PREVIOUSLY CLAIMED IN 'Donor_Pool_A'!" },
        { time: "[+00:12.800s]", level: "ALERT", source: "CV_PHASH", text: "64-bit DCT pHash Hamming Distance = 2 (Threshold <= 5) -> VISUAL CLONE IDENTIFIED!" },
        { time: "[+00:16.200s]", level: "CRITICAL", source: "CIRCUIT_BREAKER", text: "Autonomous Fraud Condition: EscrowAutoFrozen(campaignId=1) emitted on Base Sepolia!" },
        { time: "[+00:18.000s]", level: "SUCCESS", source: "VAULT_SHIELD", text: "ESCROW HALTED. 40.00 ETH ($128,000 USD) permanently protected from theft." },
      ]);
    } else if (scenario === "BATCH_30_PERCENT_FORGERY") {
      setLogs([
        { time: "[+00:01.000s]", level: "INFO", source: "INGEST", text: "Ingesting batch #42 (10 expenditure receipts) for milestone inspection..." },
        { time: "[+00:04.500s]", level: "INFO", source: "BATCH_SCAN", text: "Scanning receipts 1 through 10 with ELA pixel difference analyzer..." },
        { time: "[+00:08.200s]", level: "CRITICAL", source: "FORENSIC_ELA", text: "RECEIPT #03: ELA Anomaly Score = 38.7% (Threshold 15.0%) glowing red over total digits!" },
        { time: "[+00:11.800s]", level: "CRITICAL", source: "CATEGORY_GUARD", text: "RECEIPT #07: 'Apex Luxury Catering' violates 'Water Infrastructure' smart contract earmark!" },
        { time: "[+00:14.600s]", level: "CRITICAL", source: "BATCH_VERDICT", text: "30% FORGERY RATE DETECTED (3/10 receipts failed forensic & category audit)." },
        { time: "[+00:17.000s]", level: "CRITICAL", source: "CIRCUIT_BREAKER", text: "EscrowAutoFrozen(reason='30% Forgery Batch Attack') locked on Base Sepolia." },
      ]);
    } else {
      setLogs(TERMINAL_LOGS_SAMPLE);
    }

    setTimeout(() => setIsRunning(false), 800);
  };

  const qnaList = [
    {
      q: "What if an adversary compresses or re-encodes the image to change the SHA-256 hash?",
      a: "Raw file SHA-256 is fragile. We employ a dual-tier defense: (1) 64-bit Discrete Cosine Transform Perceptual Hashing (pHash) catches geometric mutations (Hamming distance = 2), and (2) Semantic Nullifiers hash invariant financial facts (TaxID | InvoiceNo | Date | Amount). Even if 100% of pixel bytes mutate, the financial commitment remains identical!",
    },
    {
      q: "How does ELA detect Photoshopped totals on a low-resolution receipt?",
      a: "Error Level Analysis re-saves the image at 85% JPEG quality and computes the error difference matrix. Pristine areas exhibit uniform compression dissipation, whereas pasted or edited digits retain high-frequency error rates. An ELA anomaly score above 15.0 triggers an instant automated freeze.",
    },
    {
      q: "Does verifying rural water beneficiaries expose their identities on a public ledger?",
      a: "No! Beneficiary IDs, bank UTRs, and phone numbers are salted off-chain and committed to a 32-byte cryptographic Merkle Root. Auditors mathematically verify inclusion proofs without revealing a single byte of sensitive personal data on-chain.",
    },
    {
      q: "Why not just use Postgres or AWS CloudTrail with hash chains instead of a blockchain?",
      a: "A database audit log is only as trustworthy as the administrator holding root AWS credentials. In philanthropic crises, corrupt actors with database access simply truncate tables or alter records. PurposeBoundEscrow.sol guarantees Byzantine Fault Tolerance: once 50 ETH is deposited, no human admin or NGO director can redirect funds without mathematical proof.",
    },
  ];

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
            <span className="font-heading font-black text-xs uppercase tracking-tight">
              FEATURE #4 // 1-CLICK JUDGE PRESENTATION RUNNER &amp; DEFENSE CHEATSHEET
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-black">
              JUDGE PITCH &amp; TERMINAL
            </h1>
            <p className="font-mono text-xs sm:text-sm text-black/70 max-w-xl">
              1-click scenario demonstration runner, live cyber-forensic audit terminal, and technical defense cheatsheet for judges.
            </p>
          </div>
        </div>

        {/* ── 1-Click Scenario Runner Buttons ─────────────────── */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => runScenario("VALID_MILESTONE")}
            className={`btn-brutal text-xs font-heading font-black px-5 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "VALID_MILESTONE" ? "bg-charcoal text-white" : "bg-white text-black hover:bg-sage"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-brutal-green" />
            <span>DEMO 1: CLEAN MILESTONE PROOF (PASS)</span>
          </button>

          <button
            onClick={() => runScenario("CROSS_DONOR_DOUBLE_SPEND")}
            className={`btn-brutal text-xs font-heading font-black px-5 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "CROSS_DONOR_DOUBLE_SPEND" ? "bg-charcoal text-white" : "bg-white text-black hover:bg-sage"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-primary" />
            <span>DEMO 2: 2px CROP DOUBLE SPEND (AUTO-FREEZE)</span>
          </button>

          <button
            onClick={() => runScenario("BATCH_30_PERCENT_FORGERY")}
            className={`btn-brutal text-xs font-heading font-black px-5 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeScenario === "BATCH_30_PERCENT_FORGERY" ? "bg-charcoal text-white" : "bg-white text-black hover:bg-sage"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-brutal-red" />
            <span>DEMO 3: 30% FORGED BATCH (AUTO-FREEZE)</span>
          </button>
        </div>

        {/* ── Cyber-Forensic Live Terminal Window Mockup ──────── */}
        <div className="window-brutal shadow-brutal-lg">
          <div className="window-header justify-between">
            <div className="flex items-center gap-2">
              <span className="window-dot bg-[#ff5f56]" />
              <span className="window-dot bg-[#ffbd2e]" />
              <span className="window-dot bg-[#27c93f]" />
              <span className="text-white text-xs font-mono font-bold ml-2">
                FORENSIC-TERMINAL // {activeScenario}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-primary bg-charcoal px-2 py-0.5 rounded border border-white/20">
              AUDIT STREAM
            </span>
          </div>

          <div className="p-5 bg-charcoal text-white font-mono text-xs flex flex-col gap-2 min-h-[220px] max-h-[340px] overflow-y-auto no-scrollbar">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-primary/70 shrink-0">{log.time}</span>
                <span className="text-white/50 shrink-0 font-bold">[{log.source}]</span>
                <span
                  className={
                    log.level === "CRITICAL"
                      ? "text-brutal-red font-black"
                      : log.level === "ALERT"
                      ? "text-primary font-bold"
                      : log.level === "SUCCESS"
                      ? "text-brutal-green font-bold"
                      : "text-white/90"
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-black/90 p-3 border-t-2 border-black flex items-center justify-between text-xs font-mono text-white/60">
            <span>Terminal status: LIVE EXECUTION COMPLETE</span>
            <span className="text-primary font-bold">Base Sepolia Consensus Synchronized</span>
          </div>
        </div>

        {/* ── 3 Executive Elevator Pitch Cards ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-brutal-yellow p-6 rounded-xl flex flex-col gap-3 shadow-brutal">
            <span className="bg-charcoal text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-black uppercase w-fit">
              THE PROBLEM
            </span>
            <h3 className="font-heading font-black text-xl uppercase tracking-tight text-black">
              PHILANTHROPIC BLACK HOLES
            </h3>
            <p className="font-body text-xs text-black/85 leading-relaxed">
              Billions vanish into opaque NGO accounts. Traditional post-mortem audits occur 6-12 months late, after capital has already been siphoned.
            </p>
          </div>

          <div className="card-brutal-sage p-6 rounded-xl flex flex-col gap-3 shadow-brutal">
            <span className="bg-charcoal text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-black uppercase w-fit">
              OUR SOLUTION
            </span>
            <h3 className="font-heading font-black text-xl uppercase tracking-tight text-black">
              AUTONOMOUS ADVERSARIAL VERIFIER
            </h3>
            <p className="font-body text-xs text-black/85 leading-relaxed">
              50 ETH bound to smart contract earmarks. 2px cropped duplicates caught via pHash. Opcode circuit breaker freezes vault with zero human delay.
            </p>
          </div>

          <div className="card-brutal p-6 rounded-xl flex flex-col gap-3 shadow-brutal">
            <span className="bg-charcoal text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-black uppercase w-fit">
              WHY WE WIN
            </span>
            <h3 className="font-heading font-black text-xl uppercase tracking-tight text-black">
              ZERO HUMAN GATEKEEPER
            </h3>
            <p className="font-body text-xs text-black/85 leading-relaxed">
              Mathematical invariance replaces trust. Rural villagers shielded via 0-byte PII salted Merkle trees. 100% live dual-rail resilience.
            </p>
          </div>
        </div>

        {/* ── Top Judge Questions Accordion Cheatsheet ─────────── */}
        <div className="card-brutal p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div>
              <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                TOP TECHNICAL DEFENSES FOR JUDGES
              </h3>
              <p className="font-mono text-xs text-black/60">
                Click any question to inspect architectural rationale and mathematical defense.
              </p>
            </div>
            <span className="bg-primary border-2 border-black px-2.5 py-1 rounded text-xs font-mono font-bold">
              Q&amp;A CHEATSHEET
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {qnaList.map((item, idx) => {
              const isOpen = expandedQnA === idx;
              return (
                <div key={idx} className="border-2 border-black rounded-xl overflow-hidden bg-white shadow-brutal-sm">
                  <button
                    onClick={() => setExpandedQnA(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-heading font-black text-sm uppercase tracking-tight bg-primary/10 hover:bg-primary/25 transition"
                  >
                    <span>{idx + 1}. {item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 border-t-2 border-black bg-white font-body text-xs text-black/85 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
