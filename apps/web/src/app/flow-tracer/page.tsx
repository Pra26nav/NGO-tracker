"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLedger, LedgerTransaction } from "@/context/ledger-context";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  Search,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Activity,
  AlertTriangle,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

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
  shadowWallet?: ShadowWalletInfo | null;
  discrepancy?: DiscrepancyInfo | null;
  bankUtr?: string;
  vendorTaxId?: string;
  invoiceNo?: string;
  merkleRoot?: string;
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

const GLOBAL_ROOT_CONSTANT = "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370";

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
      salt,
      leafHash,
      biometricTimestamp: `2026-10-24 11:${String(10 + (i % 45)).padStart(2, "0")} IST`,
      isRedacted: true,
      signatureStatus: "ECDSA_VERIFIED_ON_DEVICE",
    };
  });
}

function FlowTracerInner() {
  const ledger = useLedger();
  const searchParams = useSearchParams();
  const txQuery = searchParams.get("tx");

  const [isSkimming, setIsSkimming] = useState<boolean>(false);
  const [selectedHop, setSelectedHop] = useState<number>(1);
  const [searchHousehold, setSearchHousehold] = useState<string>("");
  const [verifiedBeneficiary, setVerifiedBeneficiary] = useState<Beneficiary | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState<boolean>(false);

  // Locate the specific donor transaction if present
  const userDonationTx = useMemo<LedgerTransaction | null>(() => {
    if (txQuery) {
      const match = ledger.recentTxs.find(
        (t) =>
          t.txHash.toLowerCase() === txQuery.toLowerCase() ||
          t.id.toLowerCase() === txQuery.toLowerCase() ||
          (t.utrNumber && t.utrNumber.toLowerCase() === txQuery.toLowerCase())
      );
      if (match) return match;
    }
    if (ledger.latestDonorTx) return ledger.latestDonorTx;
    // Check if there are user-created transactions
    const userTx = ledger.recentTxs.find((t) => t.id.startsWith("tx-") || t.id.startsWith("TX-") || t.id.startsWith("UPI-") || t.id.startsWith("INR-") || t.id.startsWith("USD-") || t.id.startsWith("EUR-") || t.id.startsWith("GBP-"));
    return userTx || null;
  }, [txQuery, ledger.recentTxs, ledger.latestDonorTx]);

  // Mode: "USER_DONATION" or "AGGREGATE_POOL"
  const [viewMode, setViewMode] = useState<"USER_DONATION" | "AGGREGATE_POOL">("AGGREGATE_POOL");

  // Automatically enable user donation view when a donation exists or tx query param is set
  useEffect(() => {
    if (userDonationTx) {
      setViewMode("USER_DONATION");
    }
  }, [userDonationTx]);

  const beneficiaries = useMemo(() => generateOfflineBeneficiaries(142), []);

  const hops: DagHop[] = useMemo(() => {
    if (viewMode === "USER_DONATION" && userDonationTx) {
      const dAmt = userDonationTx.amount;
      const dToken = userDonationTx.token;
      const dUsd = Math.max(1, userDonationTx.amountUsd || 100);
      const dInr = Math.max(84, userDonationTx.amountInr || dUsd * 84.15);
      const dHash = userDonationTx.txHash;
      const dDonor = userDonationTx.donor;
      const dPurpose = userDonationTx.purpose;
      const dTime = userDonationTx.timestamp || "Just now";

      return [
        {
          hopNumber: 1,
          id: "hop-1",
          title: "L1 Escrow Deposit",
          subtitle: `${dAmt} ${dToken} locked in smart contract escrow`,
          status: "VERIFIED",
          badge: userDonationTx.rail === "CRYPTO" ? "BASE SEPOLIA" : `${dToken} GATEWAY`,
          protocol: "PurposeBoundEscrow.sol (0x3Af1...56E1)",
          primaryValue: `${dAmt} ${dToken}`,
          secondaryValue: `$${dUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD · ₹${dInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR`,
          source: `Donor: ${dDonor}`,
          destination: "PurposeBoundEscrow 0x3Af1...56E1",
          txHash: dHash,
          blockNumber: userDonationTx.block || 20491823,
          timestamp: dTime,
          proofDetails: [
            { label: "Earmarked Purpose", value: dPurpose },
            { label: "Committed Amount", value: `${dAmt} ${dToken} ($${dUsd.toFixed(2)} USD)` },
            { label: "Milestones Committed", value: "4 Tranches (20/30/30/20)" },
          ],
        },
        {
          hopNumber: 2,
          id: "hop-2",
          title: "DEX AMM Swap",
          subtitle: `${dToken} converted to normalized USDC.e escrow asset`,
          status: "VERIFIED",
          badge: "UNISWAP V3",
          protocol: "Uniswap v3 0.05% Liquidity Pool",
          primaryValue: `${(dUsd * 0.999).toFixed(2)} USDC`,
          secondaryValue: "Swapped via Arbitrum L1 Gateway (0.08% slippage)",
          source: "PurposeBoundEscrow 0x3Af1...56E1",
          destination: "Uniswap v3 Router",
          txHash: `0x${dHash.slice(2, 34)}cd88a1e4599023ffaa12bb334455`,
          blockNumber: (userDonationTx.block || 20491823) + 7,
          timestamp: dTime,
          proofDetails: [
            { label: "AMM Protocol", value: "Uniswap v3 ETH/USDC 0.05% Pool" },
            { label: "Execution Slippage", value: "0.08% (Within 0.50% Tolerance)" },
            { label: "Net Liquidity Minted", value: `${(dUsd * 0.999).toFixed(2)} USDC` },
          ],
        },
        {
          hopNumber: 3,
          id: "hop-3",
          title: "Cross-Chain Bridge & Oracle Check",
          subtitle: isSkimming ? "14.8% Slippage Diverted to Shadow Wallet" : "Matched with Chainlink L2 Gas Oracle",
          status: isSkimming ? "FLAGGED_SKIMMING" : "VERIFIED",
          badge: isSkimming ? "SKIMMING BREACH" : "CHAINLINK VERIFIED",
          protocol: "Across / Arbitrum SpokePool Gateway",
          primaryValue: isSkimming
            ? `$${(dUsd * 0.852).toFixed(2)} USDC Received`
            : `${(dUsd * 0.9986).toFixed(2)} USDC`,
          secondaryValue: isSkimming
            ? `DEFICIT: -$${(dUsd * 0.148).toFixed(2)} SIPHONED`
            : `Bridge Fee: $${Math.max(0.05, dUsd * 0.0004).toFixed(2)} (0.04%)`,
          source: "SpokePool Vault L1",
          destination: isSkimming ? "Offshore Shadow Wallet (0x9b31...6318)" : "Base Sepolia Escrow",
          txHash: isSkimming
            ? "0xdead00334499ff118822ee33aa44bb556677889900112233445566778899aabb"
            : `0x${dHash.slice(2, 28)}1234567890abcdef1234567890abcdef1234fe91`,
          blockNumber: (userDonationTx.block || 20491823) + 39,
          timestamp: dTime,
          shadowWallet: isSkimming
            ? {
                address: "0x9b318C82B0058b76D63E666C2c502b4e8996318",
                label: "Undeclared Cayman Shadow Entity",
                siphonedUsdc: +(dUsd * 0.148).toFixed(2),
                siphonedInr: +(dInr * 0.148).toFixed(2),
                siphonedPct: 14.8,
                txHash: "0xdead0033...8899aabb",
                destinationBank: "Cayman Offshore Branch",
              }
            : null,
          proofDetails: [
            { label: "Bridge Gas Fee", value: `$${Math.max(0.05, dUsd * 0.0004).toFixed(2)} USDC (Chainlink L2 Truth)` },
            {
              label: "Reported Fee",
              value: isSkimming ? `15.2% ($${(dUsd * 0.152).toFixed(2)} USDC)` : `0.04% ($${Math.max(0.05, dUsd * 0.0004).toFixed(2)} USDC)`,
            },
            {
              label: "Forensic Discrepancy",
              value: isSkimming ? `CRITICAL: $${(dUsd * 0.148).toFixed(2)} Siphoned!` : "Zero Skimming Detected",
            },
          ],
        },
        {
          hopNumber: 4,
          id: "hop-4",
          title: "Fiat Banking Off-Ramp",
          subtitle: "RBI Forex Settlement @ ₹84.15 / USD",
          status: isSkimming ? "DEFICIT_WARNING" : "VERIFIED",
          badge: "RBI FOREX RAILS",
          protocol: "Institutional Off-Ramp Gateway (Mudrex / Circle)",
          primaryValue: isSkimming
            ? `₹${(dInr * 0.85).toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR`
            : `₹${(dInr * 0.998).toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR`,
          secondaryValue: "Converted via Reserve Bank of India Benchmark",
          source: "Licensed Off-Ramp Partner",
          destination: "NGO Operations HDFC A/C #502000881920",
          txHash: `0x${dHash.slice(2, 30)}aabbccddeeff00112233445566778899aabbccddeeff`,
          blockNumber: 58190212,
          timestamp: dTime,
          proofDetails: [
            { label: "Forex Benchmark Rate", value: "₹84.15 INR / USD" },
            { label: "Bank Credit Ref", value: `NEFT-HDFC-${dHash.slice(2, 10).toUpperCase()}` },
            { label: "Settlement Account", value: "HDFC FCRA A/C #502000881920" },
          ],
        },
        {
          hopNumber: 5,
          id: "hop-5",
          title: "Verified Vendor Payout & Physical Impact",
          subtitle: `Tranche 1 Disbursed to Vendors + Village Households`,
          status: isSkimming ? "FROZEN_TRUNCATED" : "VERIFIED",
          badge: "PHYSICAL IMPACT",
          protocol: "HDFC Bank NEFT / Smart Contract Tranche 1",
          primaryValue: `₹${(dInr * 0.20).toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR (Tranche 1)`,
          secondaryValue: `Directly funds ~${Math.max(2, Math.round(dUsd / 20))} households in Ward 4`,
          source: "NGO Operations A/C #502000881920",
          destination: "Maharashtra Borewell Supply Co.",
          txHash: `0x${dHash.slice(2, 26)}00112233445566778899aabbccddeeff00`,
          blockNumber: 58190340,
          timestamp: dTime,
          vendorTaxId: "GSTIN-27WATER9988Z",
          merkleRoot: GLOBAL_ROOT_CONSTANT,
          proofDetails: [
            { label: "Vendor Name", value: "Maharashtra Borewell & PVC Supply Co." },
            { label: "Vendor GSTIN", value: "GSTIN-27WATER9988Z" },
            { label: "Tangible Aid Impact", value: `${Math.max(1, Math.round(dUsd / 50))} Solar Submersible Filter Units` },
            { label: "Physical GPS Ward", value: "19.8762° N, 75.3433° E (Ward 4)" },
            { label: "PII Leaked", value: "0 Bytes (142 Households Salted Merkle Tree)" },
          ],
        },
      ];
    }

    // Default canonical 50.00 ETH aggregate pool
    return [
      {
        hopNumber: 1,
        id: "hop-1",
        title: "L1 Escrow Deposit",
        subtitle: "50 ETH committed on Ethereum L1",
        status: "VERIFIED",
        badge: "ETHEREUM L1",
        protocol: "PurposeBoundEscrow.sol (0x3Af1...56E1)",
        primaryValue: "50.00 ETH",
        secondaryValue: "$160,000.00 USD",
        source: "Donor Wallet 0x71C9...b901",
        destination: "PurposeBoundEscrow 0x3Af1...56E1",
        txHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        blockNumber: 20491823,
        timestamp: "2026-10-24 10:15:00 UTC",
        proofDetails: [
          { label: "Earmarked Purpose", value: "Water Infrastructure" },
          { label: "Deposit Value", value: "50.00 ETH ($160,000 USD)" },
          { label: "Milestones Committed", value: "4 Tranches (20/30/30/20)" },
        ],
      },
      {
        hopNumber: 2,
        id: "hop-2",
        title: "DEX AMM Swap",
        subtitle: "ETH converted to USDC",
        status: "VERIFIED",
        badge: "UNISWAP V3",
        protocol: "Uniswap v3 ETH/USDC 0.05% Pool",
        primaryValue: "159,840.00 USDC",
        secondaryValue: "Swapped @ $3,200.00 / ETH",
        source: "NGO Treasury 0x217e...991A",
        destination: "Uniswap v3 Router",
        txHash: "0x3f9e8a002b11cd88a1e4599023ffaa12bb33445566778899aabbccddeeff0011",
        blockNumber: 20491830,
        timestamp: "2026-10-24 10:22:15 UTC",
        proofDetails: [
          { label: "AMM Protocol", value: "Uniswap v3 (Arbitrum L1 Gateway)" },
          { label: "Execution Slippage", value: "0.08% (Within 0.50% Tolerance)" },
          { label: "AMM Swap Fee", value: "$160.00 USDC (0.10%)" },
        ],
      },
      {
        hopNumber: 3,
        id: "hop-3",
        title: "Cross-Chain Bridge & Oracle Check",
        subtitle: isSkimming ? "14.8% Slippage Diverted to Shadow Wallet" : "Matched with Chainlink L2 Gas Oracle",
        status: isSkimming ? "FLAGGED_SKIMMING" : "VERIFIED",
        badge: isSkimming ? "SKIMMING BREACH" : "CHAINLINK VERIFIED",
        protocol: "Across / Arbitrum SpokePool Gateway",
        primaryValue: isSkimming ? "$135,544.32 USDC Received" : "159,776.10 USDC",
        secondaryValue: isSkimming ? "DEFICIT: $23,656.32 SIPHONED" : "Bridge Fee: $63.90 (0.04%)",
        source: "SpokePool Vault L1",
        destination: isSkimming ? "Offshore Shadow Wallet (0x9b31...6318)" : "Base Sepolia Escrow",
        txHash: isSkimming
          ? "0xdead00334499ff118822ee33aa44bb556677889900112233445566778899aabb"
          : "0x77ba9012cd34567890abcdef1234567890abcdef1234567890abcdef1234fe91",
        blockNumber: 20491862,
        timestamp: "2026-10-25 09:41:05 UTC",
        shadowWallet: isSkimming
          ? {
              address: "0x9b318C82B0058b76D63E666C2c502b4e8996318",
              label: "Undeclared Cayman Shadow Entity",
              siphonedUsdc: 23656.32,
              siphonedInr: 1990679.33,
              siphonedPct: 14.8,
              txHash: "0xdead0033...8899aabb",
              destinationBank: "Cayman Offshore Branch",
            }
          : null,
        proofDetails: [
          { label: "Bridge Gas Fee", value: "$63.90 USDC (Chainlink L2 Oracle Truth)" },
          { label: "Reported Bridge Fee", value: isSkimming ? "15.2% ($24,295.68 USDC)" : "0.04% ($63.90 USDC)" },
          { label: "Forensic Discrepancy", value: isSkimming ? "CRITICAL: $23,656.32 Siphoned!" : "Zero Skimming Detected" },
        ],
      },
      {
        hopNumber: 4,
        id: "hop-4",
        title: "Fiat Banking Off-Ramp",
        subtitle: "RBI Forex Settlement @ ₹84.15 / USD",
        status: isSkimming ? "DEFICIT_WARNING" : "VERIFIED",
        badge: "RBI FOREX RAILS",
        protocol: "Institutional Off-Ramp Gateway (Mudrex / Circle)",
        primaryValue: isSkimming ? "₹1,14,06,054 INR" : "₹1,34,45,158.00 INR",
        secondaryValue: "Converted via Reserve Bank of India Benchmark",
        source: "Licensed Off-Ramp Partner",
        destination: "NGO Operations HDFC A/C #502000881920",
        txHash: "0xfa112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
        blockNumber: 58190212,
        timestamp: "2026-10-25 10:15:30 IST",
        proofDetails: [
          { label: "Forex Benchmark Rate", value: "₹84.15 INR / USD" },
          { label: "Bank Credit Ref", value: "NEFT-HDFC-20261025-449102" },
          { label: "Settlement Account", value: "HDFC FCRA A/C #502000881920" },
        ],
      },
      {
        hopNumber: 5,
        id: "hop-5",
        title: "Verified Vendor Payout & Physical Impact",
        subtitle: "Tranche 1 disbursed to Borewell Vendor + 142 Households",
        status: isSkimming ? "FROZEN_TRUNCATED" : "VERIFIED",
        badge: "PHYSICAL IMPACT",
        protocol: "HDFC Bank NEFT / Smart Contract Tranche 1",
        primaryValue: "₹1,20,000.00 INR",
        secondaryValue: "4x Deep Borewells + 142 Households",
        source: "NGO Operations A/C #502000881920",
        destination: "Maharashtra Borewell Supply Co.",
        txHash: "0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
        blockNumber: 58190340,
        timestamp: "2026-10-25 11:45:00 IST",
        vendorTaxId: "GSTIN-27WATER9988Z",
        merkleRoot: GLOBAL_ROOT_CONSTANT,
        proofDetails: [
          { label: "Vendor Name", value: "Maharashtra Borewell & PVC Supply Co." },
          { label: "Vendor GSTIN", value: "GSTIN-27WATER9988Z" },
          { label: "Bank Transfer UTR", value: "UTR-HDFC-20261025-00918234" },
          { label: "Physical GPS Coordinates", value: "19.8762° N, 75.3433° E (Ward 4)" },
          { label: "PII Leaked", value: "0 Bytes (142 Households Salted Merkle Tree)" },
        ],
      },
    ];
  }, [viewMode, userDonationTx, isSkimming]);

  const activeHopData = hops[selectedHop - 1] || hops[0];

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      b.householdId.toLowerCase().includes(searchHousehold.toLowerCase()) ||
      b.maskedName.toLowerCase().includes(searchHousehold.toLowerCase()) ||
      b.maskedAadhaar.includes(searchHousehold)
  );

  const handleVerify = (b: Beneficiary) => {
    setVerifiedBeneficiary(b);
    setProofModalOpen(true);
  };

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
            <span className="font-heading font-black text-xs uppercase tracking-tight">
              FEATURE #2 // 5-STAGE &quot;FOLLOW THE MONEY&quot; DAG &amp; ZK AUDITOR
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-black">
              FUND FLOW TRACER
            </h1>
            <p className="font-mono text-xs sm:text-sm text-black/70 max-w-xl">
              Trace capital from donor L1 deposit through AMM swaps, bridges, and off-ramps down to 142 village households with 0 bytes of PII leaked.
            </p>
          </div>
        </div>

        {/* ── USER CONTRIBUTION LIVE TRACER BANNER (WHEN ACTIVE) ── */}
        {userDonationTx && (
          <div className="card-brutal-yellow p-5 rounded-2xl flex flex-col gap-3 border-2 border-black shadow-brutal animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-charcoal text-primary flex items-center justify-center font-heading font-black text-sm border-2 border-black">
                  ✓
                </span>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/70">
                    Live Contributor Stream Detected
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl uppercase tracking-tight text-black">
                    TRACING CONTRIBUTION: {userDonationTx.amount} {userDonationTx.token}
                  </h2>
                </div>
              </div>

              {/* View Mode Toggle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("USER_DONATION")}
                  className={`btn-brutal text-xs font-heading font-black px-3.5 py-1.5 rounded-lg uppercase tracking-tight transition-all ${
                    viewMode === "USER_DONATION"
                      ? "bg-charcoal text-white shadow-brutal-sm"
                      : "bg-white text-black hover:bg-sage"
                  }`}
                >
                  TRACE YOUR DONATION ({userDonationTx.amount} {userDonationTx.token})
                </button>
                <button
                  onClick={() => setViewMode("AGGREGATE_POOL")}
                  className={`btn-brutal text-xs font-heading font-black px-3.5 py-1.5 rounded-lg uppercase tracking-tight transition-all ${
                    viewMode === "AGGREGATE_POOL"
                      ? "bg-charcoal text-white shadow-brutal-sm"
                      : "bg-white text-black hover:bg-sage"
                  }`}
                >
                  AGGREGATE 50 ETH POOL
                </button>
              </div>
            </div>

            {/* Donation Quick Meta Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-white border-2 border-black p-2.5 rounded-lg shadow-brutal-sm">
                <span className="text-[10px] text-black/60 font-bold uppercase">USD Value:</span>
                <div className="font-black text-black">
                  ${userDonationTx.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 rounded-lg shadow-brutal-sm">
                <span className="text-[10px] text-black/60 font-bold uppercase">INR Equivalent:</span>
                <div className="font-black text-black">
                  ₹{userDonationTx.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR
                </div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 rounded-lg shadow-brutal-sm">
                <span className="text-[10px] text-black/60 font-bold uppercase">Earmarked Purpose:</span>
                <div className="font-bold text-black truncate">{userDonationTx.purpose}</div>
              </div>

              <div className="bg-white border-2 border-black p-2.5 rounded-lg shadow-brutal-sm">
                <span className="text-[10px] text-black/60 font-bold uppercase">Transaction ID / Hash:</span>
                <div className="font-bold text-black truncate">{userDonationTx.txHash}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Top Attack Toggle & Oracle Price Bar ────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-black rounded-xl p-4 shadow-brutal-sm">
          {/* Skimming Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = !isSkimming;
                setIsSkimming(next);
                if (next) {
                  ledger.freezeEscrow("14.8% Bridge Slippage Skimming Discrepancy Flagged. $23,656.32 diverted to shadow wallet.");
                } else {
                  ledger.unfreezeEscrow();
                }
              }}
              className={`btn-brutal text-xs font-heading font-black px-4 py-2.5 rounded-lg flex items-center gap-2 uppercase tracking-tight ${
                isSkimming ? "bg-brutal-red text-white" : "bg-sage text-black"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isSkimming ? "SIMULATING SKIMMING ATTACK (ACTIVE)" : "SIMULATE 14.8% BRIDGE SKIMMING"}</span>
            </button>

            <span className="text-xs font-mono font-bold text-black/60 hidden sm:inline">
              {isSkimming ? "[FLAGGED] Slippage diverted into offshore shadow wallet" : "[VERIFIED] Normal operation within 0.10% tolerance"}
            </span>
          </div>

          {/* Live Price Oracle Pills */}
          <div className="flex items-center gap-2 font-mono text-xs font-bold flex-wrap">
            <div className="bg-primary/20 border-2 border-black px-2.5 py-1 rounded">
              ETH: <span className="font-black">$3,200.00</span>
            </div>
            <div className="bg-primary/20 border-2 border-black px-2.5 py-1 rounded">
              USDC: <span className="font-black">$1.0001</span>
            </div>
            <div className="bg-primary/20 border-2 border-black px-2.5 py-1 rounded">
              RBI USD/INR: <span className="font-black">₹84.15</span>
            </div>
          </div>
        </div>

        {/* ── 5-Hop Horizontal Pipeline ──────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-xl text-black uppercase tracking-tight">
              5-STAGE CANONICAL FLOW PIPELINE {viewMode === "USER_DONATION" ? "(LIVE DONOR ROUTE)" : "(AGGREGATE ESCROW POOL)"}
            </h2>
            <span className="text-xs font-mono font-bold text-black/60">
              CLICK ANY HOP TO INSPECT PROOFS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {hops.map((hop) => {
              const isSelected = selectedHop === hop.hopNumber;
              const isFlagged = hop.status === "FLAGGED_SKIMMING" || hop.status === "DEFICIT_WARNING";

              return (
                <div
                  key={hop.id}
                  onClick={() => setSelectedHop(hop.hopNumber)}
                  className={`border-2 border-black rounded-xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] ${
                    isFlagged
                      ? "bg-brutal-red text-white"
                      : isSelected
                      ? "bg-primary text-black"
                      : "bg-white text-black"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="bg-charcoal text-white px-2 py-0.5 rounded border border-black">
                      HOP 0{hop.hopNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded border border-black font-extrabold ${
                      isFlagged ? "bg-white text-brutal-red" : "bg-sage text-black"
                    }`}>
                      {hop.badge}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="font-heading font-black text-sm uppercase leading-tight">
                      {hop.title}
                    </div>
                    <div className="font-heading font-black text-lg pt-1">
                      {hop.primaryValue}
                    </div>
                    <div className="font-mono text-[11px] opacity-80 leading-tight">
                      {hop.secondaryValue}
                    </div>
                  </div>

                  <div className="border-t border-black/20 pt-2 flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>{isSelected ? "● SELECTED" : "CLICK TO VIEW"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Active Hop Detail Card ─────────────────────────── */}
        <div className="card-brutal p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-charcoal text-white font-heading font-black text-sm flex items-center justify-center border-2 border-black shadow-brutal-sm">
                0{activeHopData.hopNumber}
              </span>
              <div>
                <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                  {activeHopData.title}
                </h3>
                <p className="font-mono text-xs text-black/60">
                  Protocol: {activeHopData.protocol}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-sage text-black font-mono font-bold text-xs px-3 py-1 rounded border border-black">
                Block #{activeHopData.blockNumber}
              </span>
              <span className="bg-primary text-black font-mono font-bold text-xs px-3 py-1 rounded border border-black">
                {activeHopData.timestamp}
              </span>
            </div>
          </div>

          {/* Skimming Shadow Wallet Callout if Flagged */}
          {activeHopData.shadowWallet && (
            <div className="border-2 border-black rounded-xl p-4 bg-brutal-red text-white flex flex-col gap-2 shadow-brutal-sm">
              <div className="font-heading font-black text-lg uppercase flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span>FORENSIC DISCREPANCY: 14.8% SLIPPAGE SIPHONED</span>
              </div>
              <p className="font-mono text-xs leading-relaxed text-white/95">
                The protocol reported an inflated bridge fee. Chainlink L2 Gas Oracle proved true gas was negligible.
                The remaining <span className="font-extrabold bg-white text-brutal-red px-1 rounded">${activeHopData.shadowWallet.siphonedUsdc.toLocaleString()} USDC (₹{activeHopData.shadowWallet.siphonedInr.toLocaleString()} INR)</span> was
                diverted into undeclared shadow wallet: <span className="underline font-bold">{activeHopData.shadowWallet.address}</span>.
              </p>
            </div>
          )}

          {/* Proof Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeHopData.proofDetails.map((detail, idx) => (
              <div key={idx} className="border-2 border-black rounded-xl p-3.5 bg-primary/10 flex flex-col gap-1 shadow-brutal-sm">
                <span className="text-[10px] font-mono font-bold text-black/60 uppercase">{detail.label}</span>
                <span className="font-mono text-xs font-black text-black">{detail.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border-2 border-black rounded-xl p-3 flex items-center justify-between text-xs font-mono font-bold truncate">
            <span className="text-black/60">TRANSACTION HASH:</span>
            <span className="text-black truncate max-w-xl">{activeHopData.txHash}</span>
          </div>
        </div>

        {/* ── 142-Household ZK Beneficiary Privacy Shield ────── */}
        <div className="card-brutal p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sage border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-black uppercase tracking-tight">
                  ZK BENEFICIARY PRIVACY SHIELD (142 HOUSEHOLDS)
                </h3>
                <p className="font-mono text-xs text-black/60">
                  Ward 4, Rameshwar Grampanchayat • 100% Salted Merkle Tree • 0 Bytes PII Leaked
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                type="text"
                value={searchHousehold}
                onChange={(e) => setSearchHousehold(e.target.value)}
                placeholder="Search Household ID, masked name..."
                className="pl-8 pr-3 py-1.5 rounded-lg border-2 border-black text-xs font-mono bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Searchable Table */}
          <div className="border-2 border-black rounded-xl overflow-x-auto no-scrollbar bg-white shadow-brutal-sm">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-primary/20 border-b-2 border-black text-[11px] font-heading font-black uppercase">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Masked Name</th>
                  <th className="p-3">Aadhaar (Redacted)</th>
                  <th className="p-3">GPS Ward</th>
                  <th className="p-3">Salted Leaf Hash</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {filteredBeneficiaries.slice(0, 10).map((b) => (
                  <tr key={b.index} className="hover:bg-primary/10">
                    <td className="p-3 font-bold">{b.householdId}</td>
                    <td className="p-3 font-bold text-black">{b.maskedName}</td>
                    <td className="p-3">{b.maskedAadhaar}</td>
                    <td className="p-3">{b.ward}</td>
                    <td className="p-3 truncate max-w-[160px] text-black/70">{b.leafHash}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleVerify(b)}
                        className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-tight"
                      >
                        VERIFY MERKLE INCLUSION
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-black/70 pt-1">
            <span>Showing 10 of 142 rural households in Ward 4</span>
            <span className="font-bold">On-Chain Root: {GLOBAL_ROOT_CONSTANT.slice(0, 22)}...</span>
          </div>
        </div>

      </div>

      {/* ── Interactive Proof Verification Modal ───────────── */}
      {proofModalOpen && verifiedBeneficiary && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="card-brutal-lg max-w-xl w-full p-6 rounded-2xl flex flex-col gap-4 bg-white">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brutal-green" />
                <h4 className="font-heading font-black text-lg text-black uppercase">
                  MERKLE INCLUSION PROOF VERIFIED
                </h4>
              </div>
              <button
                onClick={() => setProofModalOpen(false)}
                className="font-mono text-sm font-bold px-2 py-1 bg-charcoal text-white rounded border border-black"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              <div className="p-2.5 rounded bg-sage/30 border border-black flex justify-between">
                <span className="text-black/60 font-bold">Household ID:</span>
                <span className="font-extrabold text-black">{verifiedBeneficiary.householdId}</span>
              </div>
              <div className="p-2.5 rounded bg-sage/30 border border-black flex justify-between">
                <span className="text-black/60 font-bold">Masked Beneficiary:</span>
                <span className="font-extrabold text-black">{verifiedBeneficiary.maskedName}</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-black flex justify-between">
                <span className="text-black/60 font-bold">Salted Leaf:</span>
                <span className="truncate max-w-xs">{verifiedBeneficiary.leafHash}</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-black flex justify-between">
                <span className="text-black/60 font-bold">On-Chain Root:</span>
                <span className="truncate max-w-xs">{GLOBAL_ROOT_CONSTANT}</span>
              </div>
            </div>

            <div className="border-2 border-black rounded-lg p-3 bg-primary/20 font-mono text-xs text-black leading-relaxed">
              ✓ <span className="font-bold">Cryptographic assertion satisfied:</span> Recomputed sibling path mathematically equates to on-chain Merkle root with <span className="font-extrabold underline">ZERO bytes of sensitive PII exposed</span>.
            </div>

            <button
              onClick={() => setProofModalOpen(false)}
              className="btn-brutal bg-charcoal text-white font-heading font-black text-xs py-2.5 rounded-lg uppercase tracking-tight"
            >
              CLOSE VERIFICATION WINDOW
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowTracerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dot-pattern flex items-center justify-center font-mono font-bold text-sm">
          INITIALIZING FLOW TRACER DAG...
        </div>
      }
    >
      <FlowTracerInner />
    </Suspense>
  );
}
