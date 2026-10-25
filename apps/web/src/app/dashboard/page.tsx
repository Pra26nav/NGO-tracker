"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import seedData from "@/data/campaign-seed.json";
import { useLedger } from "@/context/ledger-context";
import { DecentralizedQuorumPanel } from "@/components/DecentralizedQuorumPanel";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { ZKProofInspector } from "@/components/ZKProofInspector";
import { CharityIntelligenceDrawer } from "@/components/CharityIntelligenceDrawer";
import { isDemoSafeMode, generateReceiptThumbnailSvg } from "@/lib/demo-safe";

/* ────────────────────────────────────────────────────────────
   Types for Feature #3: Purpose Escrow & Tranche Drip Dashboard
──────────────────────────────────────────────────────────── */
interface TrancheItem {
  trancheId: number;
  name: string;
  percentage: number;
  amountEth: number;
  amountUsd: number;
  amountInr: number;
  status: "RELEASED" | "PENDING_VERIFICATION" | "LOCKED";
  description: string;
  verifiedNullifier?: string | null;
  verifiedMerkleRoot?: string | null;
  releasedAt?: string | null;
  txHash?: string | null;
  recipientVendor: string;
}

interface CampaignData {
  id: number;
  donorAddress: string;
  ngoAddress: string;
  earmarkedPurpose: string;
  totalDepositedEth: number;
  totalReleasedEth: number;
  isFrozen: boolean;
  freezeReason: string;
  freezeTimestamp?: string | null;
  currentTrancheIndex: number;
  contractAddress: string;
  network: string;
  lastTxHash: string;
}

interface ActivityEvent {
  id: string;
  type: "DONATION_LOCKED" | "TRANCHE_RELEASED" | "TRANCHE_DRIPPED" | "EMERGENCY_FREEZE" | "ESCROW_UNFROZEN" | "ORACLE_HEARTBEAT";
  title: string;
  subtitle: string;
  amount: string;
  timestamp: string;
  blockNumber: number;
  txHash: string;
  badge: string;
  color: "indigo" | "emerald" | "red" | "cyan" | "amber";
  details: string;
}

interface GalleryReceipt {
  id: string;
  title: string;
  invoiceNo: string;
  vendor: string;
  vendorTaxId: string;
  amountEth: number;
  amountInr: number;
  amountUsd: number;
  stage: string;
  category: string;
  elaScore: number;
  pHash: string;
  nullifier: string;
  merkleRoot: string;
  date: string;
  status: "VERIFIED_RELEASED" | "VERIFIED_LOCKED" | "STAGED";
  thumbnailUrl: string;
  description: string;
}

/* ────────────────────────────────────────────────────────────
   Preloaded Realistic Milestone Receipt Gallery (5-6 Entries)
──────────────────────────────────────────────────────────── */
const INITIAL_GALLERY_RECEIPTS: GalleryReceipt[] = [
  {
    id: "REC-401",
    title: "Tranche 1 Borewell Sourcing",
    invoiceNo: "INV-2026-0401",
    vendor: "Vidarbha Geological & Drilling Works",
    vendorTaxId: "GSTIN-27VWW001Z",
    amountEth: 10.0,
    amountInr: 2692800,
    amountUsd: 32000,
    stage: "Stage 1 (Deep Borewell Rig Drilling)",
    category: "Water Infrastructure",
    elaScore: 4.2,
    pHash: "9f8a44c1...31b2",
    nullifier: "0x88c1901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e1",
    merkleRoot: "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370",
    date: "2026-10-24",
    status: "VERIFIED_RELEASED",
    thumbnailUrl: generateReceiptThumbnailSvg("INV-2026-0401", "Vidarbha Geological Drilling", "10.0 ETH (₹26.9L)", "✓ DISBURSED"),
    description: "Milestone completion: 450-foot heavy aquifer borewell casing & site hydro-pressure certification.",
  },
  {
    id: "REC-402",
    title: "Phase 2 Solar Pump Installation",
    invoiceNo: "INV-2026-0402",
    vendor: "SunPower Rural Tech Pvt Ltd",
    vendorTaxId: "GSTIN-27SOLAR4411Z",
    amountEth: 15.0,
    amountInr: 4039200,
    amountUsd: 48000,
    stage: "Stage 2 (Solar Submersible Array)",
    category: "Water Infrastructure",
    elaScore: 3.8,
    pHash: "77d1a2f4...e90a",
    nullifier: "0x88c2902f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e44e2",
    merkleRoot: "0x9a01b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f",
    date: "2026-10-25",
    status: "VERIFIED_LOCKED",
    thumbnailUrl: generateReceiptThumbnailSvg("INV-2026-0402", "SunPower Rural Tech", "15.0 ETH (₹40.3L)", "⏳ READY TO DRIP"),
    description: "5HP solar brushless submersible pump array, dual-MPPT controller, and rural grid surge suppressor.",
  },
  {
    id: "REC-403",
    title: "Water Tank Logistics & Storage",
    invoiceNo: "INV-2026-0403",
    vendor: "Mahalaxmi Poly & HDPE Tanks",
    vendorTaxId: "GSTIN-27TANK8819Z",
    amountEth: 12.0,
    amountInr: 3231360,
    amountUsd: 38400,
    stage: "Stage 3 (5,000L Potable Storage)",
    category: "Water Infrastructure",
    elaScore: 4.9,
    pHash: "33f2a1b4...c5d6",
    nullifier: "0x88c3903f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e55e3",
    merkleRoot: "0xaa11b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f",
    date: "2026-10-25",
    status: "VERIFIED_LOCKED",
    thumbnailUrl: generateReceiptThumbnailSvg("INV-2026-0403", "Mahalaxmi Poly Tanks", "12.0 ETH (₹32.3L)", "🔒 LOCKED IN VAULT"),
    description: "4x 5,000L food-grade antimicrobial HDPE storage reservoirs staged and plumbed at village junction.",
  },
  {
    id: "REC-404",
    title: "Geological Hydro-Survey Mobilization",
    invoiceNo: "INV-2026-0399",
    vendor: "GeoGround Hydrological Consultants",
    vendorTaxId: "GSTIN-27GEO7721Z",
    amountEth: 3.0,
    amountInr: 807840,
    amountUsd: 9600,
    stage: "Aquifer Vein Mapping & Soil Test",
    category: "Water Infrastructure",
    elaScore: 3.1,
    pHash: "11e4a7c2...b3d4",
    nullifier: "0x88c4904f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e66e4",
    merkleRoot: "0xbb22c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f00",
    date: "2026-10-24",
    status: "VERIFIED_RELEASED",
    thumbnailUrl: generateReceiptThumbnailSvg("INV-2026-0399", "GeoGround Consultants", "3.0 ETH (₹8.07L)", "✓ DISBURSED"),
    description: "Comprehensive electrical resistivity tomography (ERT) survey verifying high-yield subterranean water strata.",
  },
  {
    id: "REC-405",
    title: "Piping Network & Water ATM Handover",
    invoiceNo: "INV-2026-0405",
    vendor: "Nagpur PVC & Sanitary Hardware",
    vendorTaxId: "GSTIN-27PVC3311Z",
    amountEth: 8.0,
    amountInr: 2154240,
    amountUsd: 25600,
    stage: "1.2km HDPE Distribution & Dispenser",
    category: "Water Infrastructure",
    elaScore: 4.5,
    pHash: "55d6e7f8...091a",
    nullifier: "0x88c5905f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e77e5",
    merkleRoot: "0xcc33d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f0011",
    date: "2026-10-25",
    status: "STAGED",
    thumbnailUrl: generateReceiptThumbnailSvg("INV-2026-0405", "Nagpur PVC Hardware", "8.0 ETH (₹21.5L)", "🔒 STAGED"),
    description: "Pressure-rated PN16 piping network connecting community storage to RFID Smart Water dispensing ATM.",
  },
  {
    id: "REC-406",
    title: "Community Panchayat Verification Audit",
    invoiceNo: "AUD-2026-0042",
    vendor: "Wardha District Panchayat Water Council",
    vendorTaxId: "GSTIN-27GOV9901Z",
    amountEth: 2.0,
    amountInr: 538560,
    amountUsd: 6400,
    stage: "Grampanchayat Household Handover",
    category: "Water Infrastructure",
    elaScore: 2.9,
    pHash: "88a9b0c1...d2e3",
    nullifier: "0x88c6906f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e88e6",
    merkleRoot: "0xdd44e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f002233",
    date: "2026-10-25",
    status: "VERIFIED_RELEASED",
    thumbnailUrl: generateReceiptThumbnailSvg("AUD-2026-0042", "Wardha Panchayat Council", "2.0 ETH (₹5.38L)", "✓ DISBURSED"),
    description: "Independent Grampanchayat resolution signed by 142 household representatives certifying potable water availability.",
  },
];

/* ────────────────────────────────────────────────────────────
   Offline Fallback State (Loaded directly from campaign-seed.json)
──────────────────────────────────────────────────────────── */
const INITIAL_CAMPAIGN: CampaignData = {
  id: seedData.campaign.campaignId,
  donorAddress: seedData.campaign.donorAddress,
  ngoAddress: seedData.campaign.ngoAddress,
  earmarkedPurpose: seedData.campaign.earmarkedPurpose,
  totalDepositedEth: seedData.financials.totalDepositedEth,
  totalReleasedEth: seedData.financials.totalReleasedEth,
  isFrozen: seedData.escrowState.status === "FROZEN",
  freezeReason: seedData.escrowState.frozen_reason || "",
  freezeTimestamp: null,
  currentTrancheIndex: 1,
  contractAddress: seedData.campaign.contractAddress,
  network: seedData.campaign.network,
  lastTxHash: seedData.campaign.lastTxHash,
};

const INITIAL_TRANCHES: TrancheItem[] = seedData.tranches.map((t) => ({
  trancheId: t.trancheId,
  name: t.name,
  percentage: t.percentage,
  amountEth: t.amountEth,
  amountUsd: t.amountUsd,
  amountInr: t.amountInr,
  status: (t.badge === "RELEASED" ? "RELEASED" : t.badge === "CURRENT EARMARK" ? "PENDING_VERIFICATION" : "LOCKED") as "RELEASED" | "PENDING_VERIFICATION" | "LOCKED",
  description: t.description,
  verifiedNullifier: t.verifiedNullifier,
  verifiedMerkleRoot: t.verifiedMerkleRoot,
  releasedAt: t.releasedAt,
  txHash: t.txHash,
  recipientVendor: t.recipientVendor,
}));

const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: "ACT-1001",
    type: "DONATION_LOCKED",
    title: "50.00 ETH Locked with Strict Purpose",
    subtitle: "Earmarked: Water Infrastructure (PurposeBoundEscrow.sol)",
    amount: "50.00 ETH ($160,000 USD)",
    timestamp: "2026-10-24 10:15:00 UTC",
    blockNumber: 20491823,
    txHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    badge: "PURPOSE BOUND",
    color: "indigo",
    details: "Donor address 0x71C9...b901 deposited 50.0 ETH locked to keccak256('Water Infrastructure').",
  },
  {
    id: "ACT-1002",
    type: "TRANCHE_RELEASED",
    title: "Tranche 1 Borewell Sourcing Disbursed (10.00 ETH)",
    subtitle: "Deep Borewell Drilling & Casing Released to Vidarbha Water Works",
    amount: "10.00 ETH ($32,000 USD)",
    timestamp: "2026-10-24 14:20:00 UTC",
    blockNumber: 20491845,
    txHash: "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
    badge: "TRANCHE DRIP",
    color: "emerald",
    details: "Milestone verified: Geological survey report authenticated via Nullifier 0x88c1901f...33e1.",
  },
  {
    id: "ACT-1003",
    type: "TRANCHE_RELEASED",
    title: "Phase 2 Solar Pump Installation Proof Verified",
    subtitle: "5HP Solar Submersible Inverter Handover — SunPower Rural Tech",
    amount: "15.00 ETH ($48,000 USD)",
    timestamp: "2026-10-25 09:15:00 UTC",
    blockNumber: 20491850,
    txHash: "0x6f20a3cc1199bb0022dd33445566778899aabbccddeeff0011223344556677",
    badge: "VERIFIED EARMARK",
    color: "emerald",
    details: "Perceptual hash collision check passed (Hamming distance 28). ELA score 3.8/50.0 uniform.",
  },
  {
    id: "ACT-1004",
    type: "TRANCHE_RELEASED",
    title: "Water Tank Logistics & 5,000L Storage Delivery",
    subtitle: "Mahalaxmi Poly & HDPE Tanks — Village Junction Staging",
    amount: "12.00 ETH ($38,400 USD)",
    timestamp: "2026-10-25 10:45:00 UTC",
    blockNumber: 20491858,
    txHash: "0x7a31b4dd2200cc1133ee445566778899aabbccddeeff001122334455667788",
    badge: "LOGISTICS PASS",
    color: "indigo",
    details: "GPS logistics waypoint corroborated by 2/3 validator quorum. 4x 5,000L tanks received.",
  },
  {
    id: "ACT-1005",
    type: "ORACLE_HEARTBEAT",
    title: "Chainlink Reference Price Heartbeat",
    subtitle: "ETH/USD $3,200.00 | USD/INR ₹84.15 (RBI)",
    amount: "0.10% AMM Slippage",
    timestamp: "2026-10-25 09:30:00 UTC",
    blockNumber: 20491870,
    txHash: "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    badge: "ORACLE VERIFIED",
    color: "cyan",
    details: "Slippage audit passed. Zero skimming detected on DEX swap Hop #2.",
  },
];

/* ────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const ledger = useLedger();
  const [rawCampaign, setCampaign] = useState<CampaignData>(INITIAL_CAMPAIGN);
  const [tranches, setTranches] = useState<TrancheItem[]>(INITIAL_TRANCHES);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);

  // Synchronize campaign data with shared LedgerContext
  const campaign: CampaignData = useMemo(() => ({
    ...rawCampaign,
    totalDepositedEth: ledger.totalDonated,
    escrowBalanceEth: ledger.vaultBalance,
    totalReleasedEth: ledger.releasedAmount,
    isFrozen: ledger.escrowStatus === "FROZEN",
    freezeReason: ledger.frozenReason || rawCampaign.freezeReason,
  }), [rawCampaign, ledger.totalDonated, ledger.vaultBalance, ledger.releasedAmount, ledger.escrowStatus, ledger.frozenReason]);

  // Synchronize tranches whenever ledger.tranches scales or updates
  useEffect(() => {
    if (ledger.tranches && ledger.tranches.length > 0) {
      setTranches(
        ledger.tranches.map((t) => ({
          trancheId: t.trancheId,
          name: t.name,
          percentage: t.percentage,
          amountEth: t.amountEth,
          amountUsd: t.amountUsd,
          amountInr: t.amountInr,
          status: (t.status === "COMPLETED_VERIFIED"
            ? "RELEASED"
            : t.status === "PENDING_VERIFICATION"
            ? "PENDING_VERIFICATION"
            : "LOCKED") as "RELEASED" | "PENDING_VERIFICATION" | "LOCKED",
          description: t.description,
          verifiedNullifier: t.verifiedNullifier,
          verifiedMerkleRoot: seedData.tranches[0]?.verifiedMerkleRoot || null,
          releasedAt: t.releasedAt,
          txHash: t.releaseTxHash,
          recipientVendor: t.recipientVendor || seedData.campaign.verifiedVendor,
        }))
      );
    }
  }, [ledger.tranches]);

  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(50.0);
  const [depositPurpose, setDepositPurpose] = useState<string>("Water Infrastructure");
  const [customNgoAddress, setCustomNgoAddress] = useState<string>("0x217e9C3182B0058b76D63E666C2c502b4e89991A");
  const [isReleasingTranche, setIsReleasingTranche] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isConnectedWallet, setIsConnectedWallet] = useState<boolean>(true);
  const [connectedWalletAddress] = useState<string>("0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901");

  const [selectedGalleryReceipt, setSelectedGalleryReceipt] = useState<GalleryReceipt | null>(null);

  // Fetch Dashboard State from API
  const fetchState = useCallback(async () => {
    if (isDemoSafeMode()) {
      setApiOnline(false);
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/state", {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        setApiOnline(true);
        if (data.campaign && ledger.totalDonated === 50.0) setCampaign(data.campaign);
        if (data.tranches && ledger.totalDonated === 50.0) setTranches(data.tranches);
        if (data.activityFeed) setActivityFeed(data.activityFeed);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  }, [ledger.totalDonated]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Lock New Donation
  const handleLockDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    if (apiOnline) {
      try {
        const formData = new FormData();
        formData.append("amount_eth", depositAmount.toString());
        formData.append("purpose", depositPurpose);
        formData.append("ngo_address", customNgoAddress);

        const res = await fetch("http://127.0.0.1:8000/api/dashboard/lock-donation", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          await fetchState();
          setIsDepositModalOpen(false);
          return;
        }
      } catch {
        // fallback to offline
      }
    }

    // Offline state handling - split into 4 standard tranches (20/30/30/20)
    const t_splits = [0.20, 0.30, 0.30, 0.20];
    const ethUsd = seedData.financials.exchangeRates.ethUsd;
    const ethInr = seedData.financials.exchangeRates.ethInr;

    const updatedTranches: TrancheItem[] = tranches.map((t, idx) => {
      const pct = t_splits[idx] ?? 0.25;
      const amtEth = parseFloat((depositAmount * pct).toFixed(2));
      return {
        ...t,
        percentage: Math.round(pct * 100),
        amountEth: amtEth,
        amountUsd: parseFloat((amtEth * ethUsd).toFixed(2)),
        amountInr: parseFloat((amtEth * ethInr).toFixed(2)),
        status: (idx === 0 ? "PENDING_VERIFICATION" : "LOCKED") as "PENDING_VERIFICATION" | "LOCKED",
        releasedAt: null,
        verifiedNullifier: null,
        verifiedMerkleRoot: null,
        txHash: null,
      };
    });

    setCampaign((prev) => ({
      ...prev,
      totalDepositedEth: depositAmount,
      totalReleasedEth: 0.0,
      earmarkedPurpose: depositPurpose,
      isFrozen: false,
      freezeReason: "",
      currentTrancheIndex: 0,
    }));
    setTranches(updatedTranches);

    // Sync to global persistent ledger state
    ledger.addDonation({
      donorIdentifier: connectedWalletAddress,
      amount: depositAmount,
      rail: "CRYPTO",
      token: "ETH",
      purposeName: depositPurpose,
    });

    setIsDepositModalOpen(false);
  };

  // Release Next Tranche
  const handleReleaseNextTranche = async () => {
    if (campaign.isFrozen) return;
    setIsReleasingTranche(true);

    if (apiOnline) {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/dashboard/release-next-tranche", {
          method: "POST",
        });
        if (res.ok) {
          await fetchState();
          setIsReleasingTranche(false);
          return;
        }
      } catch {
        // fallback
      }
    }

    // Offline simulated tranche release
    setTimeout(() => {
      const pendingIdx = tranches.findIndex((t) => t.status === "PENDING_VERIFICATION");
      if (pendingIdx !== -1) {
        const target = tranches[pendingIdx];
        ledger.releaseTranche(target.trancheId, target.amountEth, target.recipientVendor);
        const updated = [...tranches];
        updated[pendingIdx] = {
          ...target,
          status: "RELEASED",
          releasedAt: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          txHash: "0x" + Math.random().toString(16).slice(2).padEnd(64, "a"),
          verifiedNullifier: "0x3c91f0a8b24d77e19023a8c4f11e5509b7d2c8a1e4f60912b3c4d5e6f7a8b9c0",
          verifiedMerkleRoot: "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370",
        };
        if (pendingIdx + 1 < updated.length) {
          updated[pendingIdx + 1] = {
            ...updated[pendingIdx + 1],
            status: "PENDING_VERIFICATION",
          };
        }

        setTranches(updated);
        setCampaign((prev) => ({
          ...prev,
          totalReleasedEth: prev.totalReleasedEth + target.amountEth,
          currentTrancheIndex: pendingIdx + 1,
        }));

        const newAct: ActivityEvent = {
          id: `ACT-${activityFeed.length + 1001}`,
          type: "TRANCHE_RELEASED",
          title: `${target.name} Released`,
          subtitle: `Verified Vendor Disbursement to ${target.recipientVendor.slice(0, 35)}…`,
          amount: `${target.amountEth.toFixed(2)} ETH`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          blockNumber: 20491960 + activityFeed.length,
          txHash: "0x" + Math.random().toString(16).slice(2).padEnd(64, "e"),
          badge: "TRANCHE DRIP",
          color: "emerald",
          details: `Smart contract released ${target.amountEth} ETH against verified nullifier & Merkle proof.`,
        };
        setActivityFeed((prev) => [newAct, ...prev]);
      }
      setIsReleasingTranche(false);
    }, 600);
  };

  // Emergency Freeze Escrow
  const handleEmergencyFreeze = async () => {
    setIsFreezing(true);
    const reason = "Manual emergency freeze invoked by donor: Suspicious field activity detected";

    if (apiOnline) {
      try {
        const formData = new FormData();
        formData.append("reason", reason);
        const res = await fetch("http://127.0.0.1:8000/api/dashboard/emergency-freeze", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          await fetchState();
          setIsFreezing(false);
          return;
        }
      } catch {
        // fallback
      }
    }

    // Global persistent state sync
    ledger.freezeEscrow(reason);

    // Offline freeze
    setTimeout(() => {
      setCampaign((prev) => ({
        ...prev,
        isFrozen: true,
        freezeReason: reason,
        freezeTimestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      }));

      const newAct: ActivityEvent = {
        id: `ACT-${activityFeed.length + 1001}`,
        type: "EMERGENCY_FREEZE",
        title: "🚨 EMERGENCY ESCROW FREEZE ACTIVATED",
        subtitle: `Triggered by Donor: ${reason}`,
        amount: "VAULT LOCKED",
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
        blockNumber: 20491980 + activityFeed.length,
        txHash: "0xdead" + Math.random().toString(16).slice(2).padEnd(60, "0"),
        badge: "EMERGENCY FREEZE",
        color: "red",
        details: "Contract PurposeBoundEscrow.sol frozen on-chain. All pending and future tranche withdrawals locked.",
      };
      setActivityFeed((prev) => [newAct, ...prev]);
      setIsFreezing(false);
    }, 400);
  };

  // Unfreeze Escrow
  const handleUnfreeze = async () => {
    ledger.unfreezeEscrow();

    if (apiOnline) {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/dashboard/unfreeze", {
          method: "POST",
        });
        if (res.ok) {
          await fetchState();
          return;
        }
      } catch {
        // fallback
      }
    }

    setCampaign((prev) => ({
      ...prev,
      isFrozen: false,
      freezeReason: "",
      freezeTimestamp: null,
    }));

    const newAct: ActivityEvent = {
      id: `ACT-${activityFeed.length + 1001}`,
      type: "ESCROW_UNFROZEN",
      title: "Escrow Unfrozen & Restored",
      subtitle: "Donor dispute resolution verified. Campaign active.",
      amount: "ACTIVE",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      blockNumber: 20491990 + activityFeed.length,
      txHash: "0x" + Math.random().toString(16).slice(2).padEnd(64, "b"),
      badge: "RESTORED",
      color: "emerald",
      details: "Original donor 0x71C9...b901 authorized escrow unfreeze. Drip release workflow resumed.",
    };
    setActivityFeed((prev) => [newAct, ...prev]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered Activity Feed with Live Synced Ledger Transactions
  const filteredActivities = useMemo(() => {
    const liveFromLedger: ActivityEvent[] = ledger.recentTxs.map((tx, idx) => ({
      id: `live-${tx.id}-${idx}`,
      type: (tx.status === "FROZEN"
        ? "EMERGENCY_FREEZE"
        : tx.status === "RELEASED"
        ? "TRANCHE_RELEASED"
        : "DONATION_LOCKED") as ActivityEvent["type"],
      title:
        tx.status === "FROZEN"
          ? "🚨 Autonomous Escrow Auto-Frozen"
          : tx.status === "RELEASED"
          ? "Milestone Tranche Released"
          : "Donation Deposited & Locked in Escrow",
      subtitle: `${tx.amount} earmarked for '${tx.purpose}'`,
      amount: tx.amount,
      timestamp: tx.timestamp,
      blockNumber: tx.block,
      txHash: tx.txHash,
      badge:
        tx.status === "FROZEN"
          ? "CIRCUIT BREAKER"
          : tx.status === "RELEASED"
          ? "VERIFIED RELEASE"
          : "LIVE SYNC DEPOSIT",
      color:
        tx.status === "FROZEN"
          ? "red"
          : tx.status === "RELEASED"
          ? "emerald"
          : "indigo",
      details: `Live synchronization with PurposeBoundEscrow.sol. Donor: ${tx.donorFull}. Amount: ${tx.amount} (${tx.rail})`,
    }));

    const combined = [...liveFromLedger, ...activityFeed];

    return combined.filter((act) => {
      const matchesSearch =
        act.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        act.subtitle?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        act.txHash.toLowerCase().includes(searchFilter.toLowerCase());

      if (typeFilter === "ALL") return matchesSearch;
      if (typeFilter === "DONATIONS") return matchesSearch && act.type === "DONATION_LOCKED";
      if (typeFilter === "TRANCHES") return matchesSearch && (act.type === "TRANCHE_RELEASED" || act.type === "TRANCHE_DRIPPED");
      if (typeFilter === "FREEZES") return matchesSearch && act.type === "EMERGENCY_FREEZE";
      return matchesSearch;
    });
  }, [ledger.recentTxs, activityFeed, searchFilter, typeFilter]);

  const lockedEth = ledger.vaultBalance;
  const releasedPct = campaign.totalDepositedEth > 0
    ? Math.round((campaign.totalReleasedEth / campaign.totalDepositedEth) * 100)
    : 0;

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
              <span className="text-lg">🏛️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CASCADE &apos;26 · THEME 4 · PS 2
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  FEATURE #3 · DONOR &amp; TRANCHE PORTAL
                </span>
                {ledger.statementFreshness.isOverdue && (
                  <span className="text-[10px] font-black text-amber-300 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse">
                    <span>⚠️</span>
                    <span>Statement Overdue ({ledger.statementFreshness.daysElapsed}d)</span>
                  </span>
                )}
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  2/3 QUORUM CONSENSUS VERIFIED
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                  THE BLACK HOLE LEDGER
                </span>
                <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                  // Purpose-Bound Escrow &amp; Tranche Drip Engine
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Switcher across all 3 Features + Wallet Connect */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <Link
              href="/red-team"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>⚡</span>
              <span>Feature #1</span>
            </Link>

            <Link
              href="/flow-tracer"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>🌐</span>
              <span>Feature #2</span>
            </Link>

            <span className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-sky-600/30 border border-sky-500/60 shadow-[0_0_12px_rgba(56,189,248,0.25)] flex items-center gap-1">
              <span>🏛️</span>
              <span>Feature #3</span>
            </span>

            <Link
              href="/reconciliation"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>⚖️</span>
              <span>Reconciliation</span>
            </Link>

            <Link
              href="/pitch"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>🎯</span>
              <span>Feature #4</span>
            </Link>

            {/* Universal Reset Demo State Button */}
            <button
              id="dashboard-header-reset-btn"
              onClick={() => {
                ledger.resetToBaseline();
                setCampaign(INITIAL_CAMPAIGN);
                setTranches(INITIAL_TRANCHES);
                setActivityFeed(INITIAL_ACTIVITY);
              }}
              title="Reset demo balances and state to baseline"
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-500/40 hover:border-indigo-400 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🔄 Reset Demo State</span>
            </button>

            {/* Wallet Button */}
            <button
              onClick={() => setIsConnectedWallet(!isConnectedWallet)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <span className={`w-2 h-2 rounded-full ${isConnectedWallet ? "bg-emerald-400" : "bg-slate-500"}`}></span>
              <span>{isConnectedWallet ? `${connectedWalletAddress.slice(0, 6)}…${connectedWalletAddress.slice(-4)}` : "Connect Wallet"}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ╔══════════════════════════════════════════════════╗
            ║  HERO PROBABILISTIC TRUST SCORE GAUGE (0–100)    ║
            ╚══════════════════════════════════════════════════╝ */}
        <TrustScoreGauge size="hero" />

        {/* ╔══════════════════════════════════════════════════╗
            ║  EMERGENCY FREEZE CRIMSON WARNING BANNER         ║
            ╚══════════════════════════════════════════════════╝ */}
        {campaign.isFrozen && (
          <div className="bg-red-950/80 border-2 border-red-500 rounded-2xl p-5 shadow-[0_0_35px_rgba(239,68,68,0.4)] animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-300 font-black text-sm uppercase tracking-wider">
                <span className="text-2xl animate-bounce">🚨</span>
                <span>EMERGENCY ESCROW FREEZE ACTIVATED — ALL TRANCHES LOCKED</span>
              </div>
              <p className="text-xs text-red-200">
                Reason: <strong>{campaign.freezeReason}</strong>
              </p>
              <div className="text-[11px] text-red-300 font-mono">
                Smart Contract <code className="bg-red-900/60 px-1 py-0.5 rounded">PurposeBoundEscrow.sol</code> has
                halted all outbound transfers. Capital extraction is mathematically blocked.
              </div>
            </div>

            <button
              onClick={handleUnfreeze}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 border border-emerald-400"
            >
              <span>🔓</span>
              <span>Authorize Donor Unfreeze</span>
            </button>
          </div>
        )}

        {/* ╔══════════════════════════════════════════════════╗
            ║  A. PURPOSE-BOUND DONATION & EARMARK LOCKER      ║
            ╚══════════════════════════════════════════════════╝ */}
        <section
          className={`glass rounded-2xl p-6 border transition-all duration-500 shadow-2xl relative overflow-hidden ${
            campaign.isFrozen
              ? "border-red-500/50 bg-red-950/20"
              : "border-indigo-500/20 bg-[#0d1424]/90"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            {/* Left: Purpose Earmark & Contract Attributes */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${
                    campaign.isFrozen
                      ? "bg-red-500/20 text-red-300 border border-red-500/50"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      campaign.isFrozen ? "bg-red-500 animate-ping" : "bg-emerald-400"
                    }`}
                  ></span>
                  {campaign.isFrozen ? "ESCROW STATUS: FROZEN" : "ESCROW STATUS: ACTIVE"}
                </span>

                {/* FEATURE 3: BANK STATEMENT FRESHNESS & STALENESS WARNING BADGE */}
                {ledger.statementFreshness.isOverdue ? (
                  <span
                    id="dashboard-statement-overdue-badge"
                    className="px-3 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse"
                    title={`Statement upload is ${ledger.statementFreshness.daysElapsed} days old (exceeds 30-day compliance threshold)`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span>⚠️ Statement Overdue: {ledger.statementFreshness.daysElapsed} days since last upload</span>
                  </span>
                ) : (
                  <span
                    id="dashboard-statement-current-badge"
                    className="px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    title={`Bank statement verified and current (${ledger.statementFreshness.daysElapsed} days ago)`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>✓ Statement Current: {ledger.statementFreshness.daysElapsed}d ago</span>
                  </span>
                )}

                <span className="text-xs font-mono text-slate-400">
                  Smart Contract:{" "}
                  <span className="text-indigo-300 font-semibold">{campaign.contractAddress.slice(0, 10)}…{campaign.contractAddress.slice(-6)}</span>
                  <button onClick={() => copyToClipboard(campaign.contractAddress)} className="ml-1 text-[10px] text-slate-500 hover:text-white">
                    {copiedText === campaign.contractAddress ? "✓" : "Copy"}
                  </button>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-3xl font-black text-white">
                  {campaign.totalDepositedEth.toFixed(2)} ETH
                </h2>
                <span className="text-sm text-slate-400">
                  (${(campaign.totalDepositedEth * 3200).toLocaleString("en-US")} USD eq.)
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-800/40">
                  Locked for: &ldquo;{campaign.earmarkedPurpose}&rdquo;
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Capital is locked on Ethereum L1 and can <strong>strictly</strong> be disbursed against verified milestones matching{" "}
                <code className="text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded font-mono">
                  keccak256(&quot;{campaign.earmarkedPurpose}&quot;)
                </code>.
              </p>
            </div>

            {/* Right: Actions (Lock New Donation / Emergency Freeze / Reset Demo) */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                id="escrow-reset-demo-btn"
                onClick={() => {
                  ledger.resetToBaseline();
                  setCampaign(INITIAL_CAMPAIGN);
                  setTranches(INITIAL_TRANCHES);
                  setActivityFeed(INITIAL_ACTIVITY);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400"
              >
                <span>🔄</span>
                <span>Reset Demo State</span>
              </button>

              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 border border-indigo-400"
              >
                <span>➕</span>
                <span>Lock New Purpose Donation</span>
              </button>

              <button
                onClick={handleEmergencyFreeze}
                disabled={campaign.isFrozen || isFreezing}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 border ${
                  campaign.isFrozen
                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-600/30"
                }`}
              >
                <span>🚨</span>
                <span>{isFreezing ? "Freezing Escrow…" : "Emergency Freeze Escrow"}</span>
              </button>
            </div>
          </div>

          {/* Capital Balance Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                Total Committed Capital
              </div>
              <div className="text-xl font-black text-white font-mono">
                {campaign.totalDepositedEth.toFixed(2)} ETH
              </div>
              <div className="text-[11px] text-slate-400">
                ≈ ₹{(campaign.totalDepositedEth * 3200 * 84.15).toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                Disbursed to Vendors (Tranches)
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                {campaign.totalReleasedEth.toFixed(2)} ETH ({releasedPct}%)
              </div>
              <div className="text-[11px] text-slate-400">
                {campaign.currentTrancheIndex} of {tranches.length} Tranches Verified
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                Remaining Vault Balance
              </div>
              <div className="text-xl font-black text-indigo-400 font-mono">
                {ledger.vaultBalance.toFixed(2)} ETH ({campaign.totalDepositedEth > 0 ? Math.round((ledger.vaultBalance / campaign.totalDepositedEth) * 100) : 100}%)
              </div>
              <div className="text-[11px] text-slate-400">
                Safe in PurposeBoundEscrow Vault
              </div>
            </div>
          </div>

          {/* Drip Release Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Milestone Tranche Drip Progress</span>
              <span className="text-emerald-400 font-mono">{releasedPct}% Disbursed</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  campaign.isFrozen
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                }`}
                style={{ width: `${Math.max(releasedPct, 5)}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════╗
            ║  FEATURE 3: BANK STATEMENT FRESHNESS & STALENESS ║
            ╚══════════════════════════════════════════════════╝ */}
        <section
          id="statement-freshness-card"
          className={`glass rounded-2xl p-6 border transition-all duration-300 shadow-xl space-y-5 ${
            ledger.statementFreshness.isOverdue
              ? "border-amber-500/40 bg-amber-950/15"
              : "border-slate-800 bg-[#0d1424]/80"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📑</span>
                <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  <span>Bank Statement Freshness &amp; Staleness Sentinel</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    Feature #3
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Automated continuous reconciliation monitoring: Bank statements must be verified every 30 days under standard philanthropic governance.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {ledger.statementFreshness.isOverdue ? (
                <div
                  id="statement-staleness-warning-pill"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>⚠️ Statement Overdue: {ledger.statementFreshness.daysElapsed} days since last upload</span>
                </div>
              ) : (
                <div
                  id="statement-current-pill"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>✓ Reconciled &amp; Current ({ledger.statementFreshness.daysElapsed}d ago)</span>
                </div>
              )}
            </div>
          </div>

          {/* Overdue Warning Callout */}
          {ledger.statementFreshness.isOverdue && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2 text-sm text-amber-300">
                <span>⚠️</span>
                <span>Audit Warning: Statement Staleness Exceeds 30-Day Window</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The last audited bank statement was uploaded on{" "}
                <strong className="text-amber-200 font-mono">
                  {new Date(ledger.statementFreshness.lastStatementUploadDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>{" "}
                (<strong className="text-amber-200 font-mono">{ledger.statementFreshness.daysElapsed} days ago</strong>), covering{" "}
                <strong className="text-amber-200 font-mono">{ledger.statementFreshness.reportingPeriod}</strong>. Because this exceeds the 30-day compliance threshold by {ledger.statementFreshness.daysElapsed - 30} days, an automated reporting discrepancy flag has been raised on the public audit stream.
              </p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Last Upload Date</div>
              <div className="font-bold text-slate-200 font-mono">
                {new Date(ledger.statementFreshness.lastStatementUploadDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{ledger.statementFreshness.daysElapsed} days elapsed</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Reporting Period</div>
              <div className="font-bold text-indigo-300 truncate" title={ledger.statementFreshness.reportingPeriod}>
                {ledger.statementFreshness.reportingPeriod}
              </div>
              <div className="text-[10px] text-slate-400">Quarterly Reconciliation</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Freshness Window</div>
              <div className="flex items-center justify-between font-mono font-bold">
                <span className={ledger.statementFreshness.isOverdue ? "text-amber-400" : "text-emerald-400"}>
                  {ledger.statementFreshness.daysElapsed} / {ledger.statementFreshness.thresholdDays} Days
                </span>
                <span className="text-[10px] text-slate-500">Max 30d</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ledger.statementFreshness.isOverdue ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (ledger.statementFreshness.daysElapsed / ledger.statementFreshness.thresholdDays) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Audited Banking Institution</div>
              <div className="font-bold text-slate-200 truncate" title={ledger.statementFreshness.bankName}>
                {ledger.statementFreshness.bankName || "ICICI Bank Ltd (FCRA Escrow)"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Acct: {ledger.statementFreshness.accountNumberMasked || "•••• 9012"}
              </div>
            </div>
          </div>

          {/* Interactive Demo Simulation Controls */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                <span>🎮</span> Interactive Judge Simulation Controls
              </span>
              <p className="text-[11px] text-slate-400">
                Toggle between fresh and overdue states to test dynamic badge reaction and audit recalculation:
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="simulate-upload-fresh-btn"
                onClick={() => ledger.refreshStatement(0, "October 2026 Statement")}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>📤</span>
                <span>Simulate Fresh Upload (0d)</span>
              </button>

              <button
                type="button"
                id="simulate-upload-overdue-btn"
                onClick={() => ledger.refreshStatement(42, "Q3 2026 (July 1 - September 14, 2026)")}
                className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>⚠️</span>
                <span>Simulate Overdue (42d)</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(ledger.statementFreshness.statementHash || "0x5e89a3f2d1c087b4e91234567890abcdef1234567890abcdef1234567890abcd")}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition flex items-center gap-1"
                title="Copy Statement SHA-256 Hash"
              >
                <span>📋</span>
                <span>{copiedText === (ledger.statementFreshness.statementHash || "0x5e89a3f2d1c087b4e91234567890abcdef1234567890abcdef1234567890abcd") ? "Copied Hash!" : "Copy PDF Hash"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════╗
            ║  DECENTRALIZED ESCROW FREEZE QUORUM & GUARANTEE  ║
            ╚══════════════════════════════════════════════════╝ */}
        <DecentralizedQuorumPanel
          escrowStatus={campaign.isFrozen ? "FROZEN" : "ACTIVE"}
        />

        {/* ╔══════════════════════════════════════════════════╗
            ║  EXTERNAL CHARITY INTELLIGENCE (OPENGIVE PATTERN)║
            ╚══════════════════════════════════════════════════╝ */}
        <CharityIntelligenceDrawer className="mt-6" />

        {/* ╔══════════════════════════════════════════════════╗
            ║  B. MILESTONE TRANCHE & DRIP-RELEASE WORKFLOW    ║
            ╚══════════════════════════════════════════════════╝ */}
        <section className="glass rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>💧</span> Milestone Tranche Drip-Release Workflow
              </h3>
              <p className="text-xs text-slate-400">
                Funds are released in 4 tranches (20% mobilization, 30% material & drilling, 30% solar pump & storage, 20% audit handover) strictly upon verified expenditure proofs
              </p>
            </div>

            <button
              onClick={handleReleaseNextTranche}
              disabled={campaign.isFrozen || isReleasingTranche || campaign.totalReleasedEth >= campaign.totalDepositedEth}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                campaign.isFrozen || campaign.totalReleasedEth >= campaign.totalDepositedEth
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 border border-emerald-400"
              }`}
            >
              {isReleasingTranche ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Proof &amp; Dripping Tranche…</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Verify Proof &amp; Drip Next Tranche</span>
                </>
              )}
            </button>
          </div>

          {/* Tranches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {tranches.map((t) => {
              const isReleased = t.status === "RELEASED";
              const isPending = t.status === "PENDING_VERIFICATION";

              return (
                <div
                  key={t.trancheId}
                  className={`rounded-xl p-5 border flex flex-col justify-between transition-all ${
                    isReleased
                      ? "bg-emerald-950/20 border-emerald-500/40 shadow-sm"
                      : isPending
                      ? "bg-indigo-950/30 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                      : "bg-slate-900/50 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        STAGE {t.trancheId} ({t.percentage}%)
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                          isReleased
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : isPending
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isReleased ? "✓ DISBURSED" : isPending ? "⏳ READY TO DRIP" : "🔒 LOCKED"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-2">{t.name}</h4>

                    <p className="text-xs text-slate-400 line-clamp-3">{t.description}</p>

                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Designated Hardware Vendor:</div>
                      <div className="truncate font-semibold text-slate-200 mt-0.5">{t.recipientVendor}</div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Tranche Allocation:</span>
                      <span className="text-base font-black text-white font-mono">{t.amountEth.toFixed(1)} ETH</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>USD Value:</span>
                      <span>${t.amountUsd.toLocaleString()}</span>
                    </div>

                    {isReleased && t.verifiedNullifier && (
                      <div className="pt-2 text-[10px] font-mono text-emerald-400 truncate">
                        ✓ Nullifier: {t.verifiedNullifier.slice(0, 16)}…
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════╗
            ║  PRELOADED MILESTONE RECEIPT GALLERY & AUDIT     ║
            ╚══════════════════════════════════════════════════╝ */}
        <section id="receipt-gallery-section" className="glass rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  VERIFIED CRYPTOGRAPHIC ARTIFACTS
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {INITIAL_GALLERY_RECEIPTS.length} Pre-Seeded Proofs
                </span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>📸</span> Verified Milestone Receipt Gallery
              </h3>
              <p className="text-xs text-slate-400">
                Preloaded on-chain receipts featuring live Error Level Analysis (ELA) uniformity, pHash geometry deduplication, and selective-disclosure Merkle seals
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-400">
                Gallery State: <strong className="text-emerald-400">6 VERIFIED ENTRIES (ACTIVE)</strong>
              </span>
            </div>
          </div>

          {/* Grid of 6 realistic gallery cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INITIAL_GALLERY_RECEIPTS.map((item) => (
              <div
                key={item.id}
                id={`receipt-card-${item.id}`}
                onClick={() => setSelectedGalleryReceipt(item)}
                className="bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-indigo-500/60 transition-all p-4 flex flex-col justify-between gap-3 group cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:scale-[1.01]"
              >
                {/* Thumbnail Preview Image with seal badge */}
                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950/80 aspect-[16/10] flex items-center justify-center">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-slate-700 text-[10px] font-mono text-slate-300">
                    {item.invoiceNo}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                    <span>✓ ELA {item.elaScore}/50</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {item.vendor}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Verified Amount:</span>
                    <span className="font-bold text-emerald-400">{item.amountEth.toFixed(1)} ETH (₹{(item.amountInr / 100000).toFixed(1)}L)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 truncate">
                    <span>Nullifier:</span>
                    <span>{item.nullifier.slice(0, 14)}…</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full mt-1 py-1.5 rounded-lg bg-slate-800/70 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/50 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🔍 Inspect Forensic Proof</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════╗
            ║  C. ZERO-KNOWLEDGE PRIVACY PROOF INSPECTOR       ║
            ╚══════════════════════════════════════════════════╝ */}
        <ZKProofInspector />

        {/* ╔══════════════════════════════════════════════════╗
            ║  D. PUBLIC TRANSPARENCY & AUDITOR FEED           ║
            ╚══════════════════════════════════════════════════╝ */}
        <section className="glass rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>📡</span> Public Transparency &amp; Real-Time Auditor Feed
              </h3>
              <p className="text-xs text-slate-400">
                Immutable event stream of all on-chain locks, verified receipt nullifiers, and tranche payouts
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0 text-xs">
              {["ALL", "DONATIONS", "TRANCHES", "FREEZES"].map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    typeFilter === f
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by title, vendor, or transaction hash (0x…)…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full"
            />
          </div>

          {/* Event Stream List */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                        act.color === "red"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : act.color === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : act.color === "cyan"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      }`}
                    >
                      {act.badge}
                    </span>
                    <span className="text-xs font-bold text-white">{act.title}</span>
                  </div>

                  <div className="text-xs text-slate-400">{act.subtitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{act.details}</div>
                </div>

                <div className="text-left sm:text-right shrink-0 space-y-1">
                  <div className="text-xs font-mono font-bold text-emerald-400">{act.amount}</div>
                  <div className="text-[10px] font-mono text-slate-500">{act.timestamp}</div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center sm:justify-end gap-1">
                    <span>Tx: {act.txHash.slice(0, 10)}…</span>
                    <button
                      onClick={() => copyToClipboard(act.txHash)}
                      className="text-slate-500 hover:text-white"
                    >
                      {copiedText === act.txHash ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ╔══════════════════════════════════════════════════╗
          ║  MODAL: LOCK PURPOSE-BOUND DONATION              ║
          ╚══════════════════════════════════════════════════╝ */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-elevated bg-[#0d1424] border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔒</span> Lock Purpose-Bound Donation on L1
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLockDonation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Donation Capital (ETH):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500">
                  ≈ ${(depositAmount * 3200).toLocaleString()} USD · Auto-split into 20% / 30% / 30% / 20% tranches (10 / 15 / 15 / 10 ETH basis)
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Strict Purpose Earmark:
                </label>
                <select
                  value={depositPurpose}
                  onChange={(e) => setDepositPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Water Infrastructure">Water Infrastructure (Borewells, Solar Pumps, Storage)</option>
                  <option value="Rural Water & Fluoride Sanitation">Rural Water &amp; Fluoride Sanitation</option>
                  <option value="Emergency Rural Medical Clinics">Emergency Rural Medical Clinics</option>
                </select>
                <span className="text-[11px] text-slate-500">
                  Committed as immutable <code className="text-indigo-300 font-mono">keccak256</code> on-chain.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Designated NGO Disbursement Address:
                </label>
                <input
                  type="text"
                  value={customNgoAddress}
                  onChange={(e) => setCustomNgoAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <div className="text-slate-300 font-semibold">Planned 4-Stage Drip Schedule:</div>
                <div>• Tranche 1 (20%): {(depositAmount * 0.20).toFixed(2)} ETH (Mobilization &amp; Survey)</div>
                <div>• Tranche 2 (30%): {(depositAmount * 0.30).toFixed(2)} ETH (Material Sourcing &amp; Borewell Drilling)</div>
                <div>• Tranche 3 (30%): {(depositAmount * 0.30).toFixed(2)} ETH (Solar Pump &amp; 5,000L Storage Installation)</div>
                <div>• Tranche 4 (20%): {(depositAmount * 0.20).toFixed(2)} ETH (Commissioning, Fluoride Audit &amp; Handover)</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg"
                >
                  Lock Earmarked Deposit →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ╔══════════════════════════════════════════════════╗
          ║  MODAL: FORENSIC RECEIPT PROOF INSPECTOR         ║
          ╚══════════════════════════════════════════════════╝ */}
      {selectedGalleryReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-elevated bg-[#0b1120] border border-indigo-500/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedGalleryReceipt.title}
                  </h3>
                  <div className="text-[11px] font-mono text-indigo-400">
                    {selectedGalleryReceipt.invoiceNo} · {selectedGalleryReceipt.vendor}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGalleryReceipt(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Receipt Preview Image */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={selectedGalleryReceipt.thumbnailUrl}
                alt={selectedGalleryReceipt.title}
                className="w-full h-auto"
              />
            </div>

            {/* Verification Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Vendor Tax Identifier:</div>
                <div className="font-bold text-white mt-0.5">{selectedGalleryReceipt.vendorTaxId}</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Settled Amount:</div>
                <div className="font-bold text-emerald-400 mt-0.5">{selectedGalleryReceipt.amountEth.toFixed(1)} ETH (₹{selectedGalleryReceipt.amountInr.toLocaleString("en-IN")})</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">ELA Compression Score:</div>
                <div className="font-bold text-emerald-400 mt-0.5">✓ {selectedGalleryReceipt.elaScore} / 50.0 (Uniform)</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">pHash Geometry:</div>
                <div className="font-bold text-indigo-300 mt-0.5">{selectedGalleryReceipt.pHash}</div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Semantic Nullifier (On-Chain Registry):</div>
              <div className="text-emerald-400 truncate text-[11px]">{selectedGalleryReceipt.nullifier}</div>
              <div className="text-[10px] text-slate-500 uppercase pt-1">Selective-Disclosure Merkle Root:</div>
              <div className="text-indigo-300 truncate text-[11px]">{selectedGalleryReceipt.merkleRoot}</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Cryptographically Authenticated on PurposeBoundEscrow.sol</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGalleryReceipt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
