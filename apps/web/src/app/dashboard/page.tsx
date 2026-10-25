"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

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

/* ────────────────────────────────────────────────────────────
   Offline Fallback State (Ensures demo is 100% resilient)
──────────────────────────────────────────────────────────── */
const INITIAL_CAMPAIGN: CampaignData = {
  id: 1,
  donorAddress: "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
  ngoAddress: "0x217e9C3182B0058b76D63E666C2c502b4e89991A",
  earmarkedPurpose: "Water Infrastructure",
  totalDepositedEth: 50.0,
  totalReleasedEth: 10.0,
  isFrozen: false,
  freezeReason: "",
  freezeTimestamp: null,
  currentTrancheIndex: 1,
  contractAddress: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
  network: "Ethereum Sepolia / Mainnet",
  lastTxHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
};

const INITIAL_TRANCHES: TrancheItem[] = [
  {
    trancheId: 1,
    name: "Tranche 1: Mobilization & Geological Aquifer Survey",
    percentage: 20,
    amountEth: 10.0,
    amountUsd: 32000.0,
    amountInr: 2692800.0,
    status: "RELEASED",
    description: "Initial mobilization, hydro-geological mapping, and contractor site survey across 4 target village clusters.",
    verifiedNullifier: "0x88c1901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e1",
    verifiedMerkleRoot: "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370",
    releasedAt: "2026-10-24 14:20:00 UTC",
    txHash: "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
    recipientVendor: "Vidarbha Geological & Drilling Consultancy (GSTIN-27VWW001Z)",
  },
  {
    trancheId: 2,
    name: "Tranche 2: Heavy Hardware Procurement & Borewell Casing Drilling",
    percentage: 40,
    amountEth: 20.0,
    amountUsd: 64000.0,
    amountInr: 5385600.0,
    status: "PENDING_VERIFICATION",
    description: "Procurement of 4x 5HP submersible pumps, 200m 150mm heavy PVC casing pipes, and deep-well drilling rigs.",
    verifiedNullifier: null,
    verifiedMerkleRoot: null,
    releasedAt: null,
    txHash: null,
    recipientVendor: "Maharashtra Borewell & PVC Supply Co. (GSTIN-27WATER9988Z)",
  },
  {
    trancheId: 3,
    name: "Tranche 3: Water Filtration, Solar Integration & Beneficiary Handover",
    percentage: 40,
    amountEth: 20.0,
    amountUsd: 64000.0,
    amountInr: 5385600.0,
    status: "LOCKED",
    description: "Solar inverter connection, multi-stage water filtration, fluoride reduction audit, and handover to 142 Grampanchayat households.",
    verifiedNullifier: null,
    verifiedMerkleRoot: null,
    releasedAt: null,
    txHash: null,
    recipientVendor: "Apex Green Solar & Clean Water Ltd (GSTIN-27SOLAR4411Z)",
  },
];

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
    title: "Tranche 1 Drip Disbursed (20%)",
    subtitle: "Mobilization & Site Survey Released to Contractor",
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
  const [campaign, setCampaign] = useState<CampaignData>(INITIAL_CAMPAIGN);
  const [tranches, setTranches] = useState<TrancheItem[]>(INITIAL_TRANCHES);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);
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

  // Fetch Dashboard State from API
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/state");
      if (res.ok) {
        const data = await res.json();
        setApiOnline(true);
        if (data.campaign) setCampaign(data.campaign);
        if (data.tranches) setTranches(data.tranches);
        if (data.activityFeed) setActivityFeed(data.activityFeed);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  }, []);

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

    // Offline state handling
    const t1 = parseFloat((depositAmount * 0.20).toFixed(2));
    const t2 = parseFloat((depositAmount * 0.40).toFixed(2));
    const t3 = parseFloat((depositAmount - t1 - t2).toFixed(2));

    const updatedTranches: TrancheItem[] = [
      {
        ...tranches[0],
        amountEth: t1,
        amountUsd: t1 * 3200,
        amountInr: t1 * 3200 * 84.15,
        status: "PENDING_VERIFICATION",
        releasedAt: null,
      },
      {
        ...tranches[1],
        amountEth: t2,
        amountUsd: t2 * 3200,
        amountInr: t2 * 3200 * 84.15,
        status: "LOCKED",
        releasedAt: null,
      },
      {
        ...tranches[2],
        amountEth: t3,
        amountUsd: t3 * 3200,
        amountInr: t3 * 3200 * 84.15,
        status: "LOCKED",
        releasedAt: null,
      },
    ];

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

    const newAct: ActivityEvent = {
      id: `ACT-${activityFeed.length + 1001}`,
      type: "DONATION_LOCKED",
      title: `New Purpose-Bound Allocation: ${depositAmount.toFixed(2)} ETH`,
      subtitle: `Earmarked: ${depositPurpose}`,
      amount: `${depositAmount.toFixed(2)} ETH`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      blockNumber: 20491950 + activityFeed.length,
      txHash: "0x" + Math.random().toString(16).slice(2).padEnd(64, "0"),
      badge: "PURPOSE BOUND",
      color: "indigo",
      details: `Donor locked ${depositAmount} ETH in smart contract strictly bound to '${depositPurpose}'.`,
    };
    setActivityFeed((prev) => [newAct, ...prev]);
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

  // Filtered Activity Feed
  const filteredActivities = useMemo(() => {
    return activityFeed.filter((act) => {
      const matchesSearch =
        act.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        act.subtitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
        act.txHash.toLowerCase().includes(searchFilter.toLowerCase());

      if (typeFilter === "ALL") return matchesSearch;
      if (typeFilter === "DONATIONS") return matchesSearch && act.type === "DONATION_LOCKED";
      if (typeFilter === "TRANCHES") return matchesSearch && (act.type === "TRANCHE_RELEASED" || act.type === "TRANCHE_DRIPPED");
      if (typeFilter === "FREEZES") return matchesSearch && act.type === "EMERGENCY_FREEZE";
      return matchesSearch;
    });
  }, [activityFeed, searchFilter, typeFilter]);

  const lockedEth = campaign.totalDepositedEth - campaign.totalReleasedEth;
  const releasedPct = Math.round((campaign.totalReleasedEth / campaign.totalDepositedEth) * 100);

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
              href="/pitch"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center gap-1"
            >
              <span>🎯</span>
              <span>Feature #4</span>
            </Link>

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

            {/* Right: Actions (Lock New Donation / Emergency Freeze) */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
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
                {lockedEth.toFixed(2)} ETH ({100 - releasedPct}%)
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
            ║  B. MILESTONE TRANCHE & DRIP-RELEASE WORKFLOW    ║
            ╚══════════════════════════════════════════════════╝ */}
        <section className="glass rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>💧</span> Milestone Tranche Drip-Release Workflow
              </h3>
              <p className="text-xs text-slate-400">
                Funds are released in tranches (20% mobilization, 40% midway, 40% final completion) strictly upon verified expenditure proofs
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
                  ≈ ${(depositAmount * 3200).toLocaleString()} USD · Auto-split into 20% / 40% / 40% tranches
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
                  <option value="Water Infrastructure">Water Infrastructure (Borewells, Pumps, PVC)</option>
                  <option value="School Healthcare & Nutrition">School Healthcare &amp; Nutrition</option>
                  <option value="Rural Solar Electrification">Rural Solar Electrification</option>
                  <option value="Emergency Disaster Relief">Emergency Disaster Relief</option>
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
                <div className="text-slate-300 font-semibold">Planned Drip Schedule:</div>
                <div>• Tranche 1 (20%): {(depositAmount * 0.20).toFixed(2)} ETH (Mobilization)</div>
                <div>• Tranche 2 (40%): {(depositAmount * 0.40).toFixed(2)} ETH (Hardware Procurement)</div>
                <div>• Tranche 3 (40%): {(depositAmount * 0.40).toFixed(2)} ETH (Final Handover)</div>
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
    </div>
  );
}
