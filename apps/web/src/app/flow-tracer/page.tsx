"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────
   Types for Feature #2: Follow the Money DAG & ZK Auditor
──────────────────────────────────────────────────────────── */
interface ProofDetail {
  label: string;
  value: string;
}

interface ShadowWalletInfo {
  address: string;
  label: string;
  siphonedUsdc: number;
  siphonedInr: number;
  siphonedPct: number;
  txHash: string;
  destinationBank: string;
}

interface DiscrepancyInfo {
  expectedUsdc: number;
  reportedUsdc: number;
  discrepancyUsdc: number;
  discrepancyPct: number;
  allowedTolerancePct: number;
  ngoClaimedReason: string;
  oracleTruth: string;
  auditVerdict: string;
}

interface DagHop {
  hopNumber: number;
  id: string;
  title: string;
  subtitle: string;
  status: "VERIFIED" | "FLAGGED_SKIMMING" | "DEFICIT_WARNING" | "FROZEN_TRUNCATED";
  badge: string;
  protocol: string;
  primaryValue: string;
  secondaryValue: string;
  source: string;
  destination: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  earmark?: string;
  priceOracle?: string;
  slippagePct?: number;
  shadowWallet?: ShadowWalletInfo | null;
  discrepancy?: DiscrepancyInfo | null;
  bankUtr?: string;
  vendorTaxId?: string;
  invoiceNo?: string;
  merkleRoot?: string;
  neftRef?: string;
  proofDetails: ProofDetail[];
}

interface Beneficiary {
  index: number;
  householdId: string;
  maskedName: string;
  maskedAadhaar: string;
  maskedPhone: string;
  ward: string;
  salt: string;
  leafHash: string;
  biometricTimestamp: string;
  isRedacted: boolean;
  signatureStatus: string;
}

interface PublicLeaf {
  id: string;
  label: string;
  value: string;
  hash: string;
}

interface MerkleProofStep {
  position: "left" | "right";
  hash: string;
}

interface MerkleVerificationResult {
  beneficiaryIndex: number;
  householdId: string;
  maskedName: string;
  leafHash: string;
  salt: string;
  merkleRoot: string;
  proofPath: MerkleProofStep[];
  verified: boolean;
  verificationDetails: {
    piiExposed: boolean;
    mathematicalCheck: string;
    onChainEscrowCommitment: string;
    message: string;
  };
}

/* ────────────────────────────────────────────────────────────
   Offline Fallback Generator (Guarantees demo never breaks)
──────────────────────────────────────────────────────────── */
const GLOBAL_ROOT_CONSTANT = "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370";

const FALLBACK_PUBLIC_LEAVES: PublicLeaf[] = [
  { id: "PUB-01", label: "Hardware Vendor Tax ID", value: "GSTIN-27WATER9988Z (Maharashtra Borewell Supply)", hash: "0x81a2f4c901b2e3d4891102938475661029384756610293847566102938475661" },
  { id: "PUB-02", label: "Procured Hardware Item", value: "4x Submersible Borewell Pumps (5HP) + 200m PVC Casing", hash: "0x44d1e8a7f092c1b399221100223344556677889900112233445566778899aabb" },
  { id: "PUB-03", label: "Tranche 1 Verified Disbursement", value: "INR 1,20,000 (~0.48 ETH eq. @ $3,200/ETH, ₹84.15/USD)", hash: "0x99b3c4d5e6f70123aabbccddeeff00112233445566778899aabbccddeeff0011" },
  { id: "PUB-04", label: "Village Installation GPS Ward", value: "Lat: 19.8762° N, Long: 75.3433° E (Ward 4 Rameshwar)", hash: "0x12e9f0a4b7c8d311889900112233445566778899aabbccddeeff001122334455" },
  { id: "PUB-05", label: "Off-Chain IPFS Manifest CID", value: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", hash: "0x7f9c22a1b8e4d01928374655aabbccddeeff00112233445566778899aabbccdd" },
];

const VILLAGE_NAMES_OFFLINE = [
  "Sunita Patil", "Rameshwar Shinde", "Asha Jadhav", "Tukaram More",
  "Gita Gawande", "Vishnu Chavan", "Anusaya Rathod", "Kailas Deshmukh",
  "Sharda Wagh", "Baburao Kulkarni", "Meena Pawar", "Namdeo Bhosale",
  "Lata Suryavanshi", "Pandurang Gaikwad", "Suman Kale", "Dattatraya Shinde",
  "Radha Shelar", "Santosh Kadam", "Kavita Salunkhe", "Maruti Kharat"
];

function generateOfflineBeneficiaries(count = 142): Beneficiary[] {
  return Array.from({ length: count }, (_, i) => {
    const rawName = VILLAGE_NAMES_OFFLINE[i % VILLAGE_NAMES_OFFLINE.length] + ` (Cluster #${Math.floor(i / VILLAGE_NAMES_OFFLINE.length) + 1})`;
    const parts = rawName.split(" ");
    const masked = parts.map(p => p.length <= 2 ? p[0] + "*" : p[0] + "*".repeat(p.length - 2) + p[p.length - 1]).join(" ");
    const aadhaarSuffix = String((4100 + (i + 1) * 17) % 10000).padStart(4, "0");
    const phoneSuffix = String((7200 + (i + 1) * 29) % 10000).padStart(4, "0");
    const salt = `0x${((i + 1) * 0x9e3779b9).toString(16).padEnd(16, "a").slice(0, 16)}`;
    const leafHash = `0x${((i + 1) * 0x85ebca6b).toString(16).padEnd(64, "b").slice(0, 64)}`;
    return {
      index: i,
      householdId: `HH-${String(i + 1).padStart(3, "0")}`,
      maskedName: masked,
      maskedAadhaar: `XXXX-XXXX-${aadhaarSuffix}`,
      maskedPhone: `+91 98231 ${phoneSuffix}`,
      ward: "Ward 4 — Rameshwar Grampanchayat",
      salt: salt,
      leafHash: leafHash,
      biometricTimestamp: `2026-10-24 11:${String(10 + (i % 45)).padStart(2, "0")} IST`,
      isRedacted: true,
      signatureStatus: "ECDSA_VERIFIED_ON_DEVICE"
    };
  });
}

const STATIC_BENEFICIARIES = generateOfflineBeneficiaries(142);

function getOfflineHops(isSkimming: boolean): DagHop[] {
  const ethDeposit = 50.0;
  const usdcGross = 160000.0;
  const usdcReceived = 159840.0;
  const usdInrRate = 84.15;

  const usdcL2 = isSkimming ? 136183.68 : 159776.10;
  const inrSettled = isSkimming ? 11459856.67 : 13445158.82;

  return [
    {
      hopNumber: 1,
      id: "hop-1-deposit",
      title: "Inbound Earmarked Deposit",
      subtitle: "50 ETH locked in PurposeBoundEscrow.sol",
      status: "VERIFIED",
      badge: "L1 SMART CONTRACT",
      protocol: "Ethereum Mainnet (Sepolia/Mainnet)",
      primaryValue: "50.00 ETH",
      secondaryValue: "$160,000.00 USD eq.",
      source: "Donor Sovereign Pool (0x71C...b901)",
      destination: "PurposeBoundEscrow.sol (0x3Af...56E1)",
      txHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
      blockNumber: 20491823,
      timestamp: "2026-10-25 09:30:14 UTC",
      earmark: "Water Infrastructure",
      proofDetails: [
        { label: "Smart Contract", value: "0x3Af19B02cD319985E1e012399F319114d5e56E1" },
        { label: "Earmark Condition", value: "Strict: Water Infrastructure Only" },
        { label: "Immutable Balance", value: "50.0000 ETH" },
        { label: "Earmark Commitment", value: "0x4f8a91b2c3d4e5f6... (keccak256)" },
        { label: "Audit Status", value: "Cryptographically Sealed & Active" },
      ],
    },
    {
      hopNumber: 2,
      id: "hop-2-swap",
      title: "DEX Stablecoin Swap",
      subtitle: "50 ETH swapped to USDC via Uniswap v3",
      status: "VERIFIED",
      badge: "AMM LIQUIDITY POOL",
      protocol: "Uniswap v3 (ETH/USDC 0.05% Pool)",
      primaryValue: "159,840.00 USDC",
      secondaryValue: "Swapped from 50.00 ETH",
      source: "Escrow Liquidity Proxy (0x3Af...56E1)",
      destination: "Uniswap v3 Pool (0x88e6...4604)",
      txHash: "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
      blockNumber: 20491845,
      timestamp: "2026-10-25 09:34:22 UTC",
      priceOracle: "Chainlink ETH/USD ($3,200.00 / ETH)",
      slippagePct: 0.1,
      proofDetails: [
        { label: "Chainlink Reference Price", value: "$3,200.00 / ETH (Feed: 0x5f4e...c030)" },
        { label: "Expected Gross Output", value: "$160,000.00 USDC" },
        { label: "Actual Received Output", value: "$159,840.00 USDC" },
        { label: "Observed AMM Slippage", value: "0.10% (Within 1.0% Safe Threshold)" },
        { label: "Volatility Protection", value: "Locked into USDC Stablecoin" },
      ],
    },
    {
      hopNumber: 3,
      id: "hop-3-bridge",
      title: "Cross-Chain L1 → L2 Bridge",
      subtitle: isSkimming ? "⚠️ 14.8% Siphoned to Shadow Wallet!" : "USDC bridged to low-gas Polygon / Base L2",
      status: isSkimming ? "FLAGGED_SKIMMING" : "VERIFIED",
      badge: isSkimming ? "🚨 SKIMMING FRAUD" : "CANONICAL BRIDGE",
      protocol: "Across / Polygon State Portal",
      primaryValue: `${usdcL2.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC`,
      secondaryValue: isSkimming ? "Down by $23,656.32 from Expected" : "Transferred via Bridge Relayer",
      source: "Ethereum L1 Bridge Vault (0x40ec...5001)",
      destination: isSkimming ? "Split: L2 NGO + Cayman Shadow Wallet" : "Polygon L2 NGO Disbursement (0x217e...991A)",
      txHash: isSkimming ? "0xdead00334499ff118822ee33aa44bb556677889900112233445566778899aabb" : "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
      blockNumber: 20491870,
      timestamp: "2026-10-25 09:41:05 UTC",
      shadowWallet: isSkimming ? {
        address: "0x9b31De710F5D92186c3B5f80bF23a0740E7D6318",
        label: "Undeclared Offshore Shadow Entity (Layering Wallet)",
        siphonedUsdc: 23656.32,
        siphonedInr: 1990679.33,
        siphonedPct: 14.80,
        txHash: "0x3f9e8a002b11cd88a1e4599023ffaa12bb33445566778899aabbccddeeff0011",
        destinationBank: "Cayman Island Commercial Trust - Acc #882104-B"
      } : null,
      discrepancy: isSkimming ? {
        expectedUsdc: 159840.00,
        reportedUsdc: 136183.68,
        discrepancyUsdc: 23656.32,
        discrepancyPct: 14.80,
        allowedTolerancePct: 1.00,
        ngoClaimedReason: "High L1-to-L2 congestion & bridge liquidity slippage (15.2% total)",
        oracleTruth: "Chainlink L1/L2 gas oracle proves actual bridge gas was $63.90 (0.04%). $23,656.32 was secretly split to shadow wallet!",
        auditVerdict: "CRITICAL_FRAUD_DETECTED"
      } : null,
      proofDetails: [
        { label: "Bridge Protocol", value: "Polygon State Sync / L1 Bridge Vault" },
        { label: "Gas & Relayer Fee", value: "$63.90 USDC (Chainlink L2 Gas Oracle)" },
        { label: "L1 Confirmed Blocks", value: "64 Finalized Blocks" },
        { label: "L2 State Root Proof", value: "0x77ba9012cd34...fe91" },
        { label: "Forensic Bridge Check", value: isSkimming ? "FAILED — Skimming Discrepancy > 1%" : "PASSED — Zero Slippage Skimming" },
      ],
    },
    {
      hopNumber: 4,
      id: "hop-4-offramp",
      title: "Fiat Off-Ramp Settlement",
      subtitle: "USDC burned for local INR bank transfer",
      status: isSkimming ? "DEFICIT_WARNING" : "VERIFIED",
      badge: "RBI FOREX SETTLEMENT",
      protocol: "Institutional Banking Gateway (RBI Comp.)",
      primaryValue: `₹${inrSettled.toLocaleString("en-IN", { minimumFractionDigits: 2 })} INR`,
      secondaryValue: `Converted @ ₹${usdInrRate} / USD`,
      source: "Regulated Off-Ramp Gateway (Circle / Mudrex)",
      destination: "NGO Local Operations HDFC Acc #502000881920",
      txHash: "0xfa112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
      blockNumber: 58190212,
      timestamp: "2026-10-25 10:15:30 IST",
      neftRef: "NEFT-HDFC-20261025-449102",
      proofDetails: [
        { label: "Forex Reference Rate", value: `₹${usdInrRate} INR / USD (RBI Benchmark)` },
        { label: "Off-Ramp Provider", value: "Licensed Banking Gateway (KYB Verified)" },
        { label: "Bank Credit Reference", value: "NEFT-HDFC-20261025-449102" },
        { label: "Disbursement Account", value: "HDFC Current Acc #502000881920" },
        { label: "Reconciliation Audit", value: isSkimming ? "DEFICIT: ₹19,90,680 Missing!" : "100% Reconciled to Penny" },
      ],
    },
    {
      hopNumber: 5,
      id: "hop-5-vendor",
      title: "Verified Vendor Payout & Impact Proof",
      subtitle: "Tranche 1 paid to Borewell Vendor + 142 Households",
      status: isSkimming ? "FROZEN_TRUNCATED" : "VERIFIED",
      badge: "VERIFIED PHYSICAL IMPACT",
      protocol: "HDFC Bank NEFT / Smart Contract Tranche 1",
      primaryValue: "₹1,20,000.00 INR",
      secondaryValue: "4x Borewells + 142 Household Beneficiaries",
      source: "NGO Local Operations Acc #502000881920",
      destination: "Maharashtra Borewell & PVC Supply Co.",
      txHash: "0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
      blockNumber: 58190340,
      timestamp: "2026-10-25 11:45:00 IST",
      bankUtr: "UTR-HDFC-20261025-00918234",
      vendorTaxId: "GSTIN-27WATER9988Z",
      invoiceNo: "INV-2026-9001",
      merkleRoot: GLOBAL_ROOT_CONSTANT,
      proofDetails: [
        { label: "Hardware Vendor", value: "Maharashtra Borewell & PVC Supply Co." },
        { label: "Vendor GSTIN", value: "GSTIN-27WATER9988Z" },
        { label: "Bank Transfer UTR", value: "UTR-HDFC-20261025-00918234" },
        { label: "GPS Coordinates", value: "19.8762° N, 75.3433° E (Ward 4)" },
        { label: "ZK Merkle Commitment", value: GLOBAL_ROOT_CONSTANT.slice(0, 22) + "..." },
        { label: "Beneficiary Redaction", value: "142 Households Cryptographically Proven (0 PII Leaked)" },
      ],
    },
  ];
}

/* ────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────── */
export default function FlowTracerPage() {
  const [isSkimmingSimulated, setIsSkimmingSimulated] = useState(false);
  const [selectedHopNumber, setSelectedHopNumber] = useState<number>(3); // Default to Hop 3 to inspect bridge/skimming
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [hops, setHops] = useState<DagHop[]>(() => getOfflineHops(false));
  const [publicLeaves, setPublicLeaves] = useState<PublicLeaf[]>(FALLBACK_PUBLIC_LEAVES);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(STATIC_BENEFICIARIES);
  const [selectedBeneficiaryIndex, setSelectedBeneficiaryIndex] = useState<number>(0);
  const [searchBeneficiary, setSearchBeneficiary] = useState<string>("");
  const [isVerifyingZk, setIsVerifyingZk] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<MerkleVerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"flow" | "zk" | "oracles">("flow");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Poll backend health and fetch initial state
  useEffect(() => {
    let isMounted = true;
    async function checkApi() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/flow-tracer/dag-state");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setApiOnline(true);
            setHops(data.hops);
          }
        } else {
          if (isMounted) setApiOnline(false);
        }
      } catch {
        if (isMounted) setApiOnline(false);
      }
    }
    checkApi();
    return () => { isMounted = false; };
  }, []);

  // Fetch ZK Beneficiaries from API or use static
  useEffect(() => {
    let isMounted = true;
    async function fetchZk() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/flow-tracer/zk-beneficiaries");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.publicLeaves) setPublicLeaves(data.publicLeaves);
            if (data.beneficiaries) setBeneficiaries(data.beneficiaries);
          }
        }
      } catch {
        // keep static
      }
    }
    fetchZk();
    return () => { isMounted = false; };
  }, []);

  // Toggle Skimming Simulation
  const handleToggleSkimming = useCallback(async (sim: boolean) => {
    setIsSkimmingSimulated(sim);
    setSelectedHopNumber(3); // Auto-focus on Hop 3

    if (apiOnline) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/flow-tracer/dag-state?skimming=${sim}`);
        if (res.ok) {
          const data = await res.json();
          setHops(data.hops);
          return;
        }
      } catch {
        // fallback
      }
    }
    setHops(getOfflineHops(sim));
  }, [apiOnline]);

  // Handle Verify ZK Merkle Proof for Selected Beneficiary
  const handleVerifyZkProof = useCallback(async (index: number) => {
    setIsVerifyingZk(true);
    setVerificationResult(null);

    // Call API if online
    if (apiOnline) {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/flow-tracer/verify-merkle-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index }),
        });
        if (res.ok) {
          const data = await res.json();
          setTimeout(() => {
            setVerificationResult(data);
            setIsVerifyingZk(false);
          }, 400);
          return;
        }
      } catch {
        // fallback to offline calculation
      }
    }

    // Offline simulation of cryptographic proof
    setTimeout(() => {
      const b = beneficiaries[index] || beneficiaries[0];
      const proofSteps: MerkleProofStep[] = [
        { position: "right", hash: "0x9f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c" },
        { position: "left", hash: "0x8182736455aabbccddeeff00112233445566778899aabbccddeeff0011223344" },
        { position: "right", hash: "0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00" },
        { position: "left", hash: "0x33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122" },
        { position: "right", hash: "0x5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344" },
        { position: "left", hash: "0x778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566" },
        { position: "right", hash: "0x99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788" },
        { position: "left", hash: "0xbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa" }
      ];

      setVerificationResult({
        beneficiaryIndex: index,
        householdId: b.householdId,
        maskedName: b.maskedName,
        leafHash: b.leafHash,
        salt: b.salt,
        merkleRoot: GLOBAL_ROOT_CONSTANT,
        proofPath: proofSteps,
        verified: true,
        verificationDetails: {
          piiExposed: false,
          mathematicalCheck: "Recomputed Root == On-Chain Root (True)",
          onChainEscrowCommitment: GLOBAL_ROOT_CONSTANT,
          message: "Cryptographic proof verified! Household signature is authentic and part of the on-chain commitment with ZERO bytes of PII leaked."
        }
      });
      setIsVerifyingZk(false);
    }, 450);
  }, [apiOnline, beneficiaries]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const selectedHop = useMemo(() => {
    return hops.find((h) => h.hopNumber === selectedHopNumber) || hops[0];
  }, [hops, selectedHopNumber]);

  const filteredBeneficiaries = useMemo(() => {
    if (!searchBeneficiary.trim()) return beneficiaries;
    const q = searchBeneficiary.toLowerCase();
    return beneficiaries.filter(
      (b) =>
        b.householdId.toLowerCase().includes(q) ||
        b.maskedName.toLowerCase().includes(q) ||
        b.maskedAadhaar.toLowerCase().includes(q)
    );
  }, [beneficiaries, searchBeneficiary]);

  return (
    <div className="min-h-screen bg-[#020617] text-[#f1f5f9] grid-bg">
      {/* ╔══════════════════════════════════════════════════╗
          ║  TOP COMMAND & MULTI-FEATURE NAVIGATION BAR       ║
          ╚══════════════════════════════════════════════════╝ */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Branding */}
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg bg-slate-900/90 border border-indigo-500/30"
            >
              <span className="text-lg">🌐</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CASCADE &apos;26 · THEME 4 · PS 2
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FEATURE #2 · FLOW-TRACER & ZK
                </span>
                {apiOnline === true && (
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    API LIVE (8000)
                  </span>
                )}
                {apiOnline === false && (
                  <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    OFFLINE ENGINE
                  </span>
                )}
              </div>
              <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                  THE BLACK HOLE LEDGER
                </span>
                <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                  // 5-Stage &ldquo;Follow the Money&rdquo; DAG &amp; ZK Auditor
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Switcher between Feature 1 and Feature 2 */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              href="/red-team"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Feature #1: Red-Team &amp; Auto-Freeze</span>
            </Link>

            <span className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-indigo-600/30 border border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.25)] flex items-center gap-1">
              <span>🌐</span> Feature #2
            </span>

            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>🏛️</span> Feature #3
            </Link>

            <Link
              href="/pitch"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>🎯</span> Feature #4
            </Link>
          </div>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ╔══════════════════════════════════════════════════╗
            ║  ESCROW BANNER & FORENSIC SKIMMING TOGGLE        ║
            ╚══════════════════════════════════════════════════╝ */}
        <section className="glass rounded-2xl p-5 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Escrow Status & Purpose */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-2 ${
                    isSkimmingSimulated
                      ? "bg-red-950/80 text-red-300 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-glow-red"
                      : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSkimmingSimulated ? "bg-red-400 animate-ping" : "bg-emerald-400"
                    }`}
                  ></span>
                  <span>{isSkimmingSimulated ? "🔒 ESCROW FROZEN · AUDIT BREACH" : "🟢 ESCROW ACTIVE · 50.00 ETH LOCKED"}</span>
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Contract: <span className="text-indigo-300">PurposeBoundEscrow.sol</span> (0x3Af1...56E1)
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <div className="text-2xl font-black text-white">50.00 ETH Locked</div>
                <div className="text-sm text-slate-400">
                  Strict Smart Contract Earmark:{" "}
                  <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    &ldquo;Water Infrastructure&rdquo;
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Reference: ₹1,34,50,536 INR ($160,000 USD)
                </div>
              </div>

              {isSkimmingSimulated && (
                <div className="text-xs text-red-300 bg-red-950/50 p-2.5 rounded-lg border border-red-500/30 flex items-start gap-2 mt-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold">CRITICAL FRAUD ALERT (Hop #3):</span> 14.8% Bridge Slippage
                    Skimming detected! $23,656.32 (~₹19,90,680) was diverted to undeclared Cayman shadow wallet{" "}
                    <code className="text-red-200 bg-red-900/60 px-1 py-0.5 rounded">0x9b31...6318</code>. The
                    remaining escrow has been <strong>auto-frozen on-chain</strong> to prevent further leakage.
                  </div>
                </div>
              )}
            </div>

            {/* Judge Interactive Skimming Toggle */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="text-left sm:text-right">
                <div className="text-xs font-bold text-slate-200">
                  Judges Interactive Demo
                </div>
                <div className="text-[11px] text-slate-400">
                  {isSkimmingSimulated
                    ? "Simulating 14.8% FX Skimming Attack"
                    : "Normal Valid 5-Hop Disbursement"}
                </div>
              </div>

              <button
                onClick={() => handleToggleSkimming(!isSkimmingSimulated)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg ${
                  isSkimmingSimulated
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 border border-red-400"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border border-indigo-400"
                }`}
              >
                <span>{isSkimmingSimulated ? "🔄 Reset to Normal Flow" : "🚨 Simulate 14.8% FX Skimming"}</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab("flow")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "flow"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>1️⃣</span> 5-Hop &ldquo;Follow the Money&rdquo; DAG
            </button>
            <button
              onClick={() => setActiveTab("zk")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "zk"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>2️⃣</span> ZK Beneficiary Privacy Shield (142 Households)
            </button>
            <button
              onClick={() => setActiveTab("oracles")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "oracles"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>3️⃣</span> Live Chainlink &amp; RBI Oracle Feeds
            </button>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════╗
            ║  TAB 1: 5-STAGE DAG VISUALIZER & INSPECTOR       ║
            ╚══════════════════════════════════════════════════╝ */}
        {activeTab === "flow" && (
          <div className="space-y-6">
            {/* The 5 Hops Interactive DAG Pipeline */}
            <section className="glass rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🔁</span> Multi-Hop Fund Flow Pipeline (5 Hops)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Click on any hop to inspect live transaction proofs, oracle rates, and cryptographic commitments
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400 hidden sm:block">
                  Click a node to view cryptographic proof ↓
                </div>
              </div>

              {/* DAG Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
                {hops.map((hop, idx) => {
                  const isSelected = selectedHopNumber === hop.hopNumber;
                  const isFraud = hop.status === "FLAGGED_SKIMMING";
                  const isDeficit = hop.status === "DEFICIT_WARNING" || hop.status === "FROZEN_TRUNCATED";

                  return (
                    <div
                      key={hop.id}
                      onClick={() => setSelectedHopNumber(hop.hopNumber)}
                      className={`cursor-pointer rounded-xl p-4 transition-all relative border flex flex-col justify-between ${
                        isSelected
                          ? isFraud
                            ? "bg-red-950/60 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)] scale-[1.02]"
                            : "bg-indigo-950/60 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] scale-[1.02]"
                          : isFraud
                          ? "bg-red-950/30 border-red-700/60 hover:border-red-500"
                          : isDeficit
                          ? "bg-amber-950/30 border-amber-700/60 hover:border-amber-500"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                      }`}
                    >
                      {/* Top Header inside card */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              isFraud
                                ? "bg-red-500 text-white"
                                : isSelected
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {hop.hopNumber}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                              isFraud
                                ? "bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse"
                                : isDeficit
                                ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {hop.badge}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-white mb-1 line-clamp-1">
                          {hop.title}
                        </h3>

                        <div className="text-[10px] text-slate-400 mb-3 line-clamp-2">
                          {hop.subtitle}
                        </div>
                      </div>

                      {/* Values & Status */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div
                          className={`text-sm font-black tabular-nums ${
                            isFraud
                              ? "text-red-400"
                              : isDeficit
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {hop.primaryValue}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {hop.secondaryValue}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Tx: {hop.txHash.slice(0, 8)}…</span>
                          <span className="text-indigo-400 hover:underline">Inspect →</span>
                        </div>
                      </div>

                      {/* Hop connector arrow for large screens */}
                      {idx < 4 && (
                        <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600 font-black text-sm pointer-events-none">
                          ▶
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Skimming Discrepancy & Shadow Wallet Card (When Hop 3 is Flagged or Skimming is active) */}
            {isSkimmingSimulated && (
              <section className="bg-red-950/40 border border-red-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase tracking-wider mb-3">
                  <span className="text-xl">🚨</span> FX &amp; Bridge Skimming Discrepancy Detector: Anomaly Flagged
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Reported vs Reality Matrix */}
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-red-500/30 space-y-3">
                    <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      Reported vs. Chainlink Oracle Truth
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expected Output (Chainlink):</span>
                        <span className="font-mono text-emerald-400 font-bold">$159,840.00 USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reported Output by NGO:</span>
                        <span className="font-mono text-red-400 font-bold">$136,183.68 USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Unexplained Discrepancy:</span>
                        <span className="font-mono text-red-300 font-black">-$23,656.32 (-14.80%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allowed Slippage Tolerance:</span>
                        <span className="font-mono text-slate-300">1.00% max</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Local Currency Deficit:</span>
                        <span className="font-mono text-amber-400 font-bold">₹19,90,680.00 INR Missing</span>
                      </div>
                    </div>
                  </div>

                  {/* NGO Claim vs Forensic Reality */}
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-red-500/30 space-y-3">
                    <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      Adversarial Claim vs. Oracle Proof
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-[11px] text-slate-500 uppercase font-semibold">NGO Official Claim:</div>
                        <div className="text-red-200 mt-0.5 bg-red-950/40 p-2 rounded border border-red-800/40">
                          &ldquo;High L1-to-L2 congestion &amp; bridge liquidity slippage resulted in 15.2% transaction
                          losses.&rdquo;
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-500 uppercase font-semibold">Chainlink Gas Oracle Proof:</div>
                        <div className="text-emerald-300 mt-0.5 bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
                          Actual L1/L2 Bridge Gas was only <strong>$63.90 USDC (0.04%)</strong>. 14.76% was secretly
                          skimmed into shadow wallet.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shadow Wallet Disclosure */}
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-red-500/30 space-y-3">
                    <div className="text-xs font-bold text-red-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                      <span>🕵️ Hidden Shadow Wallet Revealed</span>
                      <span className="text-[10px] bg-red-600/30 text-red-200 px-2 py-0.5 rounded">UNLISTED</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500">Destination Address:</div>
                        <div className="font-mono text-red-300 font-bold break-all bg-black/40 p-1.5 rounded mt-0.5">
                          0x9b31De710F5D92186c3B5f80bF23a0740E7D6318
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="text-[10px] text-slate-500">Siphoned USDC:</div>
                          <div className="font-mono text-red-400 font-bold">$23,656.32</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">Offshore Entity:</div>
                          <div className="text-slate-300 font-semibold truncate">Cayman Commercial Trust</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-[10px] text-emerald-400 font-semibold">
                          ✓ Smart Contract Action: PurposeBoundEscrow.sol Auto-Freeze executed on-chain.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Selected Hop Detailed Transaction Proof Inspector */}
            <section className="glass rounded-2xl p-5 border border-indigo-500/20 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      selectedHop.status === "FLAGGED_SKIMMING"
                        ? "bg-red-500 text-white"
                        : "bg-indigo-500 text-white"
                    }`}
                  >
                    #{selectedHop.hopNumber}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedHop.title}
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        ({selectedHop.protocol})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">{selectedHop.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    Block: #{selectedHop.blockNumber.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-slate-500">·</span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedHop.timestamp}
                  </span>
                </div>
              </div>

              {/* Transaction Routing Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                    Source Routing Origin
                  </div>
                  <div className="font-mono text-xs text-slate-200 break-all font-semibold">
                    {selectedHop.source}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                    Destination / Smart Contract
                  </div>
                  <div className="font-mono text-xs text-indigo-300 break-all font-semibold">
                    {selectedHop.destination}
                  </div>
                </div>
              </div>

              {/* Transaction Hash Strip */}
              <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-500">TX HASH:</span>
                  <span className="text-slate-200 font-bold truncate max-w-xs sm:max-w-md md:max-w-xl">
                    {selectedHop.txHash}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(selectedHop.txHash)}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                  >
                    {copiedText === selectedHop.txHash ? "✓ Copied" : "Copy Hash"}
                  </button>
                  <a
                    href={`https://etherscan.io/tx/${selectedHop.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-[11px] bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 rounded border border-indigo-700/50 transition-colors"
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>

              {/* Cryptographic Proof Details Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Live Cryptographic Proofs &amp; State Attributes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedHop.proofDetails.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80"
                    >
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        {item.label}
                      </div>
                      <div className="text-xs font-mono text-slate-200 font-medium mt-0.5 break-all">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ╔══════════════════════════════════════════════════╗
            ║  TAB 2: ZK SELECTIVE-DISCLOSURE BENEFICIARY      ║
            ╚══════════════════════════════════════════════════╝ */}
        {activeTab === "zk" && (
          <div className="space-y-6">
            {/* Header & Metrics */}
            <section className="glass rounded-2xl p-5 border border-indigo-500/20 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      PRIVACY-PRESERVING IMPACT PROOF
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      100% PII REDACTED
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white">
                    Zero-Knowledge (ZK) Selective-Disclosure Beneficiary Auditor
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                    Solves the core requirement: Proves aid reached real verified people without exposing sensitive
                    PII (names, Aadhaar/ID numbers, phone numbers, or facial biometrics) on the public blockchain.
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
                  <div className="text-center px-2">
                    <div className="text-xl font-black text-emerald-400">142</div>
                    <div className="text-[10px] text-slate-400 uppercase">Beneficiaries</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div className="text-center px-2">
                    <div className="text-xl font-black text-indigo-400">0 B</div>
                    <div className="text-[10px] text-slate-400 uppercase">PII Leaked</div>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div className="text-center px-2">
                    <div className="text-xl font-black text-amber-400">32 B</div>
                    <div className="text-[10px] text-slate-400 uppercase">On-Chain Root</div>
                  </div>
                </div>
              </div>

              {/* On-Chain Anchors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs font-mono">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500">ON-CHAIN MERKLE ROOT:</span>
                  <span className="text-emerald-400 font-bold truncate max-w-xs">
                    {GLOBAL_ROOT_CONSTANT}
                  </span>
                  <button
                    onClick={() => copyToClipboard(GLOBAL_ROOT_CONSTANT)}
                    className="text-[10px] text-slate-400 hover:text-white ml-2"
                  >
                    Copy
                  </button>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500">OFF-CHAIN IPFS MANIFEST:</span>
                  <span className="text-indigo-400 font-bold truncate max-w-xs">
                    ipfs://bafybeigdyrzt5sfp7udm7hu76uh...
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")
                    }
                    className="text-[10px] text-slate-400 hover:text-white ml-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </section>

            {/* Split View: 5 Public Leaves vs 142 Private Beneficiary Leaves */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 Public Leaves) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="glass rounded-2xl p-5 border border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <span>📢</span> 5 Public Verified Leaves (Unredacted)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Openly visible to public auditors &amp; tax authorities for financial compliance
                  </p>

                  <div className="space-y-2.5">
                    {publicLeaves.map((leaf) => (
                      <div
                        key={leaf.id}
                        className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-indigo-400 font-bold">{leaf.id}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            PUBLIC
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white">{leaf.label}</div>
                        <div className="text-xs text-slate-300 font-mono mt-0.5 bg-slate-950/60 p-1.5 rounded">
                          {leaf.value}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                          Hash: {leaf.hash.slice(0, 24)}…
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (142 Private Beneficiaries & Proof Engine) */}
              <div className="lg:col-span-7 space-y-4">
                {/* ZK Proof Verification Card */}
                <div className="glass rounded-2xl p-5 border border-indigo-500/30 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>🔒</span> Interactive Cryptographic Proof Engine
                      </h3>
                      <p className="text-xs text-slate-400">
                        Pick any beneficiary to verify membership in the on-chain Merkle root without exposing PII
                      </p>
                    </div>

                    <button
                      onClick={() => handleVerifyZkProof(selectedBeneficiaryIndex)}
                      disabled={isVerifyingZk}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                    >
                      {isVerifyingZk ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Computing Sibling Path…</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Verify Cryptographic Inclusion</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Verification Result Display */}
                  {verificationResult && (
                    <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 mb-4 animate-in fade-in space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                          <span>✓</span> MATHEMATICALLY VERIFIED IN ON-CHAIN ESCROW
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                          0 BYTES PII EXPOSED
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        {verificationResult.verificationDetails.message}
                      </div>

                      {/* Step-by-Step Folding Calculation */}
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                        <div className="text-slate-400 flex justify-between">
                          <span>Household Leaf Hash:</span>
                          <span className="text-indigo-300 truncate max-w-xs">
                            {verificationResult.leafHash.slice(0, 20)}…
                          </span>
                        </div>
                        <div className="text-slate-400 flex justify-between">
                          <span>Merkle Sibling Steps:</span>
                          <span className="text-slate-200">
                            {verificationResult.proofPath.length} Levels Folded
                          </span>
                        </div>
                        <div className="text-emerald-400 font-bold flex justify-between pt-1 border-t border-slate-800">
                          <span>Calculated Root == On-Chain Root:</span>
                          <span>{verificationResult.verified ? "CONFIRMED (100%)" : "FAILED"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search and Table of 142 Beneficiaries */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <input
                        type="text"
                        placeholder="Search by HH-ID (e.g. HH-014) or Ward…"
                        value={searchBeneficiary}
                        onChange={(e) => setSearchBeneficiary(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                      />
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">
                        Showing {filteredBeneficiaries.length} of {beneficiaries.length}
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
                      {filteredBeneficiaries.slice(0, 20).map((b) => {
                        const isSelected = selectedBeneficiaryIndex === b.index;
                        return (
                          <div
                            key={b.householdId}
                            onClick={() => {
                              setSelectedBeneficiaryIndex(b.index);
                              setVerificationResult(null);
                            }}
                            className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-indigo-950/60 text-white"
                                : "hover:bg-slate-900/60 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-indigo-400">
                                {b.householdId}
                              </span>
                              <div>
                                <div className="font-semibold text-slate-200">
                                  🔒 {b.maskedName}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Aadhaar: {b.maskedAadhaar} · Phone: {b.maskedPhone}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                                🔒 ZK-REDACTED
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                {b.biometricTimestamp}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 text-center">
                      Displaying sample slice. All 142 household signatures are permanently anchored in Merkle Root.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ╔══════════════════════════════════════════════════╗
            ║  TAB 3: LIVE CHAINLINK & FOREX ORACLE FEEDS      ║
            ╚══════════════════════════════════════════════════╝ */}
        {activeTab === "oracles" && (
          <div className="space-y-6">
            <section className="glass rounded-2xl p-5 border border-indigo-500/20 shadow-xl">
              <div className="mb-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>📡</span> Live Decentralized Price Feeds &amp; RBI Forex Benchmarks
                </h2>
                <p className="text-xs text-slate-400">
                  Every hop is audited in real-time against oracle feeds to detect unapproved skimming &gt; 1.00%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ETH/USD Feed */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">ETH / USD</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      CHAINLINK
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">$3,200.00</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Feed: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
                  </div>
                  <div className="text-[10px] text-emerald-400">✓ Heartbeat: 60s · Confidence: 99.98%</div>
                </div>

                {/* USDC/USD Feed */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">USDC / USD</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      CHAINLINK
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">$1.0001</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Feed: 0x8fFfFD0E38E11ac0ee040609920042453e029247
                  </div>
                  <div className="text-[10px] text-emerald-400">✓ Stablecoin Peg: 100% Intact</div>
                </div>

                {/* USD/INR Feed */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">USD / INR</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                      RBI BENCHMARK
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">₹84.1500</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Central Bank Reference Rate (FBIL)
                  </div>
                  <div className="text-[10px] text-indigo-400">✓ Statutory NGO Conversion Rate</div>
                </div>
              </div>

              {/* Slippage & Skimming Audit Rules */}
              <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Automated Slippage &amp; Shadow Wallet Enforcement Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Max Allowed AMM Slippage:</span>
                    <div className="text-slate-200 font-bold font-mono">1.00% Tolerance</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Max Allowed Bridge Gas:</span>
                    <div className="text-slate-200 font-bold font-mono">0.10% ($160 max)</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Shadow Wallet Route:</span>
                    <div className="text-red-400 font-bold font-mono">0.00% (Instant Auto-Freeze)</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
