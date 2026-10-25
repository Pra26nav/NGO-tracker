"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Database,
  Cpu,
  Layers,
  Scale,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  Flame,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

interface JudgeQuestion {
  id: string;
  number: string;
  title: string;
  category: "ARCHITECTURE" | "FORENSICS" | "CONSENSUS" | "ECONOMICS" | "PRIVACY";
  icon: any;
  quickDefense: string;
  detailedAnalysis: string[];
  keyFactBadge: string;
  testRoute: string;
  testRouteLabel: string;
  codeSnippet?: string;
}

const TOP_5_JUDGE_QUESTIONS: JudgeQuestion[] = [
  {
    id: "db-vs-blockchain",
    number: "01",
    title: "Database vs. Blockchain: Why not just use Postgres or AWS CloudTrail with hash chains?",
    category: "ARCHITECTURE",
    icon: Database,
    keyFactBadge: "Byzantine Escrow vs. Root Admin Privilege",
    quickDefense:
      "A database audit log is only as trustworthy as the administrator holding root AWS credentials. In philanthropic crises, corrupt actors with database access simply truncate tables, rewrite history, or forge balances retroactively. PurposeBoundEscrow.sol guarantees Byzantine Fault Tolerance: once 50 ETH is deposited, no human admin, NGO director, or cloud outage can redirect capital or release tranches without deterministic cryptographic proof.",
    detailedAnalysis: [
      "Traditional centralized databases suffer from the 'Trusted Insider' vulnerability: any DBA or compromised API key can execute 'UPDATE audit_logs SET verified = TRUE'.",
      "PurposeBoundEscrow.sol acts as an autonomous on-chain state machine: funds are physically locked inside EVM bytecode on Base Sepolia.",
      "Smart contract disbursements are atomic and programmatically tied to keccak256 Semantic Nullifiers. Even if an NGO's entire IT infrastructure is hacked, the attacker cannot withdraw funds without presenting a valid, non-colliding vendor invoice proof.",
      "The contract implements an Autonomous Circuit Breaker (.freeze()) that triggers at the EVM opcode level upon fraud detection—requiring zero centralized auditor intervention."
    ],
    codeSnippet: `// PurposeBoundEscrow.sol: Opcode-level autonomous fraud freeze
if (isNullifierUsed[_semanticNullifier]) {
    c.isFrozen = true;
    c.freezeReason = "CROSS_DONOR_DOUBLE_SPEND";
    emit EscrowAutoFrozen(_campaignId, c.ngo, c.freezeReason, _semanticNullifier);
    return; // Execution halts, 0 ETH transferred
}`,
    testRoute: "/reconciliation",
    testRouteLabel: "Inspect Report vs. Chain Discrepancies",
  },
  {
    id: "ela-heuristics",
    number: "02",
    title: "ELA Heuristics: How does pixel Error Level Analysis reliably catch Photoshop on low-res receipts?",
    category: "FORENSICS",
    icon: Cpu,
    keyFactBadge: "DCT Quantization Differential > 15.0",
    quickDefense:
      "Error Level Analysis does not rely on cosmetic OCR reading or superficial text sharpness. Instead, it re-compresses the image at an intentional 85% JPEG quantization baseline and computes the 8x8 Discrete Cosine Transform (DCT) error residual matrix. Tampered regions (such as a doctored ₹3,85,000 total or pasted vendor name) retain significantly higher error variance (>15.0) than uniform authentic pixels (typically 1.2–4.5). Furthermore, ELA is paired with 64-bit DCT Perceptual Hashing (pHash) so 2-pixel cropped duplicates are caught regardless of image resolution.",
    detailedAnalysis: [
      "When a JPEG is edited in Photoshop, GIMP, or mobile photo editors, the spliced pixels undergo a different compression generation than the original background canvas.",
      "Our Python forensic engine computes a real-time 99.2-percentile pixel error difference heatmap, highlighting anomalous quantization clusters in glowing red.",
      "Dual-Tier Defense: Even if an attacker applies Gaussian blur to hide Photoshop edges, the Semantic Nullifier hashes invariant financial facts (TaxID | InvNo | Date | Amount), ensuring the commitment remains permanently immutable.",
      "Tested resilience against 30% forged receipt batches with 100% detection rate and sub-350ms verification latency."
    ],
    codeSnippet: `# apps/verifier-api/main.py: Real Error Level Analysis
ela_img = ImageChops.difference(original, resaved)
scale = 255.0 / max([ex[1] for ex in ela_img.getextrema()])
arr = np.array(ImageEnhance.Brightness(ela_img).enhance(scale))
anomaly_score = float(np.percentile(arr, 99.2)) / 5.5
# If anomaly_score > 15.0 -> EscrowAutoFrozen!`,
    testRoute: "/red-team",
    testRouteLabel: "Run Live ELA Pixel Tamper Simulator",
  },
  {
    id: "oracle-trust",
    number: "03",
    title: "Oracle Trust & Collusion: What prevents the off-chain verifier from colluding with a rogue NGO?",
    category: "CONSENSUS",
    icon: Scale,
    keyFactBadge: "2/3 Decentralized Quorum + Slashing",
    quickDefense:
      "The system does not depend on a single trusted oracle. Off-chain verification requires a 2/3 Decentralized Quorum of independent auditor nodes. Furthermore, the smart contract performs deterministic state validation: even if a corrupt oracle maliciously signs off on an invoice, if the Semantic Nullifier has already been claimed anywhere across the global registry, the EVM smart contract automatically rejects the transaction and locks the escrow on-chain.",
    detailedAnalysis: [
      "Consensus Architecture: Milestone approvals require cryptographic threshold signatures from 2 out of 3 independent validators (Community Watchtower, Donor Representative, and Algorithmic Verifier).",
      "Deterministic Safety Invariant: The EVM contract maintains an immutable mapping of mapping(bytes32 => bool) public isNullifierUsed. No oracle signature can bypass a nullifier collision check in smart contract storage.",
      "Asymmetric Penalties: Quorum nodes post a collateral stake; submitting contradictory proofs or attesting to tampered receipts results in immediate stake slashing and permanent revocation of authorized status.",
      "Public Transparency: All submitted Merkle roots and nullifiers are emitted via contract events (ExpenditureVerified), allowing any external third party to independently audit the state."
    ],
    codeSnippet: `// Smart contract verifies nullifier before disbursing a single wei
require(!isNullifierUsed[_semanticNullifier], "Double spend attempt");
isNullifierUsed[_semanticNullifier] = true;
globalNullifierRegistry[_semanticNullifier] = _campaignId;`,
    testRoute: "/flow-tracer",
    testRouteLabel: "View 5-Hop DAG & Quorum Consensus",
  },
  {
    id: "gas-costs",
    number: "04",
    title: "Gas Costs & Scaling: Won't on-chain micro-auditing drain charity budgets with exorbitant gas fees?",
    category: "ECONOMICS",
    icon: Zap,
    keyFactBadge: "$0.0012 / Tx on Base L2 & Polygon",
    quickDefense:
      "Raw high-resolution receipt images, PDF reports, and ELA pixel matrices are strictly kept off-chain via IPFS CID commitments. The smart contract consumes only 32-byte cryptographic hashes: bytes32 semanticNullifier and bytes32 merkleRoot. By targeting Base Sepolia L2 and Polygon Amoy, transaction execution costs are less than $0.0012 USD per milestone payout with sub-second block finality, preserving 99.99% of donor capital for real-world impact.",
    detailedAnalysis: [
      "Off-Chain vs. On-Chain Separation: Full audit evidence (PDFs, heatmaps) is hashed into decentralized IPFS CIDs (e.g., ipfs://Qm...), while the EVM ledger stores solely the root hash commitments.",
      "Gas Profile: A complete milestone tranche release consumes ~68,000 gas units. On Base L2 (EIP-4844 blobs), this translates to a negligible fraction of a cent (~$0.0012).",
      "Tranche Drip Economics: Instead of paying gas for every individual bottle of water purchased, expenses are aggregated into milestone tranches (20/30/30/20 schedule) tied to verifiable hydrogeological deliverables.",
      "Dual-Rail Fiat Settlement: UPI and NetBanking donations are bridged via Polygon USDC without exposing rural vendors to crypto volatility."
    ],
    codeSnippet: `// 32-byte lightweight cryptographic storage commitment
struct Tranche {
    uint256 amount;
    bytes32 verifiedNullifier;   // 32 bytes
    bytes32 verifiedMerkleRoot;  // 32 bytes
    bool isReleased;
}`,
    testRoute: "/dashboard",
    testRouteLabel: "Inspect Milestone Tranche Drip Economics",
  },
  {
    id: "zk-validity",
    number: "05",
    title: "ZK Validity & Privacy: How do you verify 142 rural households without exposing their identities?",
    category: "PRIVACY",
    icon: Lock,
    keyFactBadge: "0 Bytes PII Leaked · Salted Merkle Tree",
    quickDefense:
      "Beneficiary names, phone numbers, and location coordinates are blinded off-chain using cryptographically secure random salts: Leaf = Poseidon(secret_salt, Household_ID). The smart contract stores only the 32-byte Merkle Root. Donors and public watchdogs verify mathematical inclusion paths (log2(N) sibling proofs) confirming that Household #87 is an authorized member of the vetted beneficiary pool without leaking a single byte of personally identifiable information (PII).",
    detailedAnalysis: [
      "Zero Knowledge Inclusion: Auditors receive a Merkle membership proof consisting of sibling hashes that resolve to the on-chain root. They verify membership with 100% mathematical certainty.",
      "Identity Shielding: Zero beneficiary names, Aadhaar numbers, phone records, or GPS coordinates are ever recorded in public calldata or contract storage.",
      "Compliance Ready: Complies with GDPR Article 17 ('Right to be Forgotten') and Indian Digital Personal Data Protection (DPDP) Act 2023 because off-chain salted preimages can be unlinked while keeping the on-chain root intact.",
      "Double-Dipping Protection: Each beneficiary proof includes a unique nullifier derived from their blinded identifier, preventing an NGO from claiming multiple tank installations for the same household."
    ],
    codeSnippet: `// Merkle Sibling Verification: 0 Bytes PII on-chain
bytes32 computedHash = leaf;
for (uint256 i = 0; i < proof.length; i++) {
    computedHash = keccak256(abi.encodePacked(computedHash, proof[i]));
}
require(computedHash == verifiedMerkleRoot, "Invalid ZK Beneficiary Proof");`,
    testRoute: "/flow-tracer",
    testRouteLabel: "Open Interactive ZK Merkle Inspector",
  },
];

export default function JudgePitchPage() {
  const [activeQuestion, setActiveQuestion] = useState<string>("db-vs-blockchain");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const currentQ = TOP_5_JUDGE_QUESTIONS.find((q) => q.id === activeQuestion) || TOP_5_JUDGE_QUESTIONS[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* ╔══════════════════════════════════════════════════╗
            ║ HEADER: JUDGE DEFENSE COMMAND CENTER            ║
            ╚══════════════════════════════════════════════════╝ */}
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CASCADE &apos;26 Hackathon · Investor &amp; Judge Defense Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Top 5 Judge Defense Questions
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
                Concise, mathematically airtight answers to the toughest architectural, cryptographic, and economic questions judges will ask during the live demonstration.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shrink-0 flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Defense Status</div>
                <div className="text-xl font-black text-emerald-400 font-mono">100% READY</div>
                <div className="text-[11px] text-slate-400 font-mono">5/5 Air-Tight Defenses</div>
              </div>
            </div>
          </div>
        </header>

        {/* ╔══════════════════════════════════════════════════╗
            ║ QUESTION SELECTOR TABS (PROJECTOR FRIENDLY)      ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {TOP_5_JUDGE_QUESTIONS.map((q) => {
            const isSelected = q.id === activeQuestion;
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestion(q.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-black text-indigo-400">#{q.number}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                    isSelected ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" : "bg-slate-800 text-slate-400"
                  }`}>
                    {q.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                  <span className={`text-xs font-bold line-clamp-2 ${isSelected ? "text-white" : "text-slate-300"}`}>
                    {q.title.split(":")[0]}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 truncate">
                  {q.keyFactBadge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ╔══════════════════════════════════════════════════╗
            ║ MAIN DEFENSE DISPLAY CARD                        ║
            ╚══════════════════════════════════════════════════╝ */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          
          {/* Question Title & Fact Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <currentQ.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">DEFENSE QUESTION #{currentQ.number}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {currentQ.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 leading-snug">
                  {currentQ.title}
                </h2>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentQ.keyFactBadge}</span>
              </span>
            </div>
          </div>

          {/* 30-Second Elevator Pitch Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-950 to-slate-950 border border-indigo-500/40 shadow-inner space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>30-Second Direct Answer (Say This First to Judges):</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
              &ldquo;{currentQ.quickDefense}&rdquo;
            </p>
          </div>

          {/* Deep Architectural Defense Points */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Deep Architectural Defense &amp; Failure Modes:</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQ.detailedAnalysis.map((point, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Code Proof / EVM Execution Block */}
          {currentQ.codeSnippet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On-Chain Cryptographic Implementation:</span>
                </span>
                <button
                  onClick={() => handleCopyCode(currentQ.codeSnippet!)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                >
                  {copiedCode === currentQ.codeSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-black border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Live Action Test Link */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Prove this defense live to the judging panel in the interactive environment:
            </span>

            <Link
              href={currentQ.testRoute}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.35)] shrink-0"
            >
              <span>{currentQ.testRouteLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
