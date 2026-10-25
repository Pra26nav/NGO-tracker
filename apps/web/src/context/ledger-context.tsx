"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import seedData from "@/data/campaign-seed.json";

/* ────────────────────────────────────────────────────────────
   Data Types
──────────────────────────────────────────────────────────── */
export interface LedgerTransaction {
  id: string;
  donor: string;
  donorFull: string;
  amount: string;
  amountEth: number;
  amountUsd: number;
  amountInr: number;
  rail: "CRYPTO" | "UPI";
  token: string;
  purpose: string;
  txHash: string;
  status: "LOCKED_IN_ESCROW" | "RELEASED" | "FROZEN";
  timestamp: string;
  block: number;
  utrNumber?: string | null;
  donorTaxId?: string | null;
  taxReceiptId?: string | null;
}

export interface TrancheState {
  trancheId: number;
  index: number;
  name: string;
  stage: string;
  amountEth: number;
  percentage: number;
  amountInr: number;
  amountUsd: number;
  status: "COMPLETED_VERIFIED" | "PENDING_VERIFICATION" | "LOCKED" | "RELEASED";
  badge: string;
  description: string;
  recipientVendor?: string;
  verifiedNullifier?: string | null;
  releaseTxHash?: string | null;
  releasedAt?: string | null;
}

export interface LedgerContextValue {
  totalDonated: number;
  vaultBalance: number;
  releasedAmount: number;
  escrowStatus: "ACTIVE" | "FROZEN";
  frozenReason: string | null;
  recentTxs: LedgerTransaction[];
  tranches: TrancheState[];
  campaign: typeof seedData.campaign;
  exchangeRates: { ethUsd: number; usdInr: number; ethInr: number };
  liveSyncConnected: boolean;
  addDonation: (params: {
    donorIdentifier?: string;
    donorName?: string;
    amount: number;
    rail: "CRYPTO" | "UPI";
    token: string;
    purposeName?: string;
    utrNumber?: string | null;
    donorEmail?: string;
    donorTaxId?: string;
  }) => LedgerTransaction;
  releaseTranche: (
    trancheId: number,
    amountEth?: number,
    vendorName?: string
  ) => void;
  freezeEscrow: (reason: string, offendingTxHash?: string) => void;
  unfreezeEscrow: () => void;
  resetToBaseline: () => void;
  trustScore: number;
  setTrustScore: (score: number) => void;
}

const STORAGE_KEY = "bhol_ledger_state_v4";

/* ────────────────────────────────────────────────────────────
   Initial Baseline Seed Transactions (Pre-populated 5-6 Realistic Entries)
──────────────────────────────────────────────────────────── */
const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: "TX-401",
    donor: "PurposeBoundEscrow.sol",
    donorFull: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    amount: "10.00 ETH",
    amountEth: 10.0,
    amountUsd: 32000.0,
    amountInr: 2692800.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: "Tranche 1 Borewell Sourcing (Vidarbha Geological & Drilling)",
    txHash: "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
    status: "RELEASED",
    timestamp: "2026-10-24 14:20:00 UTC",
    block: 20491845,
    taxReceiptId: "80G-2026-401001",
  },
  {
    id: "TX-402",
    donor: "PurposeBoundEscrow.sol",
    donorFull: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    amount: "15.00 ETH",
    amountEth: 15.0,
    amountUsd: 48000.0,
    amountInr: 4039200.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: "Phase 2 Solar Pump Installation (SunPower Rural Tech Ltd)",
    txHash: "0x6f20a3cc1199bb0022dd33445566778899aabbccddeeff0011223344556677",
    status: "LOCKED_IN_ESCROW",
    timestamp: "2026-10-25 09:15:00 UTC",
    block: 20491850,
    taxReceiptId: "80G-2026-402002",
  },
  {
    id: "TX-403",
    donor: "PurposeBoundEscrow.sol",
    donorFull: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    amount: "12.00 ETH",
    amountEth: 12.0,
    amountUsd: 38400.0,
    amountInr: 3231360.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: "Water Tank Logistics & Storage (Mahalaxmi Poly & HDPE Tanks)",
    txHash: "0x7a31b4dd2200cc1133ee445566778899aabbccddeeff001122334455667788",
    status: "LOCKED_IN_ESCROW",
    timestamp: "2026-10-25 10:45:00 UTC",
    block: 20491858,
    taxReceiptId: "80G-2026-403003",
  },
  {
    id: "TX-404",
    donor: "PurposeBoundEscrow.sol",
    donorFull: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    amount: "3.00 ETH",
    amountEth: 3.0,
    amountUsd: 9600.0,
    amountInr: 807840.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: "Geological Hydro-Survey Mobilization (GeoGround Consultants)",
    txHash: "0x8b42c5ee3311dd2244ff5566778899aabbccddeeff00112233445566778899",
    status: "RELEASED",
    timestamp: "2026-10-24 11:30:00 UTC",
    block: 20491830,
    taxReceiptId: "80G-2026-404004",
  },
  {
    id: "TX-405",
    donor: "PurposeBoundEscrow.sol",
    donorFull: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    amount: "8.00 ETH",
    amountEth: 8.0,
    amountUsd: 25600.0,
    amountInr: 2154240.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: "Piping Network & Water ATM Handover (Nagpur PVC Hardware)",
    txHash: "0x9c53d6ff4422ee33550066778899aabbccddeeff00112233445566778899aa",
    status: "LOCKED_IN_ESCROW",
    timestamp: "2026-10-25 12:20:00 UTC",
    block: 20491872,
    taxReceiptId: "80G-2026-405005",
  },
  {
    id: "TX-406",
    donor: "PurposeBoundEscrow.sol",
    donorFull: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    amount: "2.00 ETH",
    amountEth: 2.0,
    amountUsd: 6400.0,
    amountInr: 538560.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: "Community Panchayat Verification Audit (Wardha Water Council)",
    txHash: "0xad64e7005533ff446611778899aabbccddeeff00112233445566778899aabb",
    status: "RELEASED",
    timestamp: "2026-10-25 13:00:00 UTC",
    block: 20491880,
    taxReceiptId: "80G-2026-406006",
  },
  {
    id: "DON-901",
    donor: "0x71C9...b901",
    donorFull: "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
    amount: "50.00 ETH",
    amountEth: 50.0,
    amountUsd: 160000.0,
    amountInr: 13464000.0,
    rail: "CRYPTO",
    token: "ETH",
    purpose: seedData.campaign.name,
    txHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
    status: "LOCKED_IN_ESCROW",
    timestamp: "2026-10-24 10:15:00 UTC",
    block: 20491823,
    taxReceiptId: "80G-2026-990142",
  },
];

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  // Core financial state directly initialized from seedData
  const [totalDonated, setTotalDonated] = useState<number>(
    seedData.financials.totalDepositedEth
  );
  const [vaultBalance, setVaultBalance] = useState<number>(
    seedData.financials.vaultBalanceEth
  );
  const [releasedAmount, setReleasedAmount] = useState<number>(
    seedData.financials.totalReleasedEth
  );
  const [escrowStatus, setEscrowStatus] = useState<"ACTIVE" | "FROZEN">(
    seedData.escrowState.status as "ACTIVE" | "FROZEN"
  );
  const [frozenReason, setFrozenReason] = useState<string | null>(
    seedData.escrowState.frozen_reason
  );
  const [recentTxs, setRecentTxs] =
    useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS);
  const [tranches, setTranches] = useState<TrancheState[]>(
    seedData.tranches as TrancheState[]
  );
  const [trustScore, setTrustScore] = useState<number>(
    seedData.escrowState.status === "FROZEN" ? 32 : 98
  );

  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.totalDonated === "number") setTotalDonated(parsed.totalDonated);
        if (typeof parsed.vaultBalance === "number") setVaultBalance(parsed.vaultBalance);
        if (typeof parsed.releasedAmount === "number") setReleasedAmount(parsed.releasedAmount);
        if (parsed.escrowStatus === "ACTIVE" || parsed.escrowStatus === "FROZEN") {
          setEscrowStatus(parsed.escrowStatus);
        }
        if (parsed.frozenReason !== undefined) setFrozenReason(parsed.frozenReason);
        if (Array.isArray(parsed.recentTxs) && parsed.recentTxs.length > 0) {
          setRecentTxs(parsed.recentTxs);
        }
        if (Array.isArray(parsed.tranches) && parsed.tranches.length > 0) {
          setTranches(parsed.tranches);
        }
        if (typeof parsed.trustScore === "number") {
          setTrustScore(parsed.trustScore);
        } else if (parsed.escrowStatus === "FROZEN") {
          setTrustScore(32);
        }
      }
    } catch {
      // Ignore parse errors, fallback to seed
    } finally {
      setIsLoadedFromStorage(true);
    }

    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (typeof parsed.totalDonated === "number") setTotalDonated(parsed.totalDonated);
          if (typeof parsed.vaultBalance === "number") setVaultBalance(parsed.vaultBalance);
          if (typeof parsed.releasedAmount === "number") setReleasedAmount(parsed.releasedAmount);
          if (parsed.escrowStatus) setEscrowStatus(parsed.escrowStatus);
          if (parsed.frozenReason !== undefined) setFrozenReason(parsed.frozenReason);
          if (Array.isArray(parsed.recentTxs)) setRecentTxs(parsed.recentTxs);
          if (Array.isArray(parsed.tranches)) setTranches(parsed.tranches);
          if (typeof parsed.trustScore === "number") setTrustScore(parsed.trustScore);
          else if (parsed.escrowStatus === "FROZEN") setTrustScore(32);
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save state to localStorage whenever it changes (only after mounting and initial loading)
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    try {
      const stateToSave = {
        totalDonated,
        vaultBalance,
        releasedAmount,
        escrowStatus,
        frozenReason,
        recentTxs,
        tranches,
        trustScore,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Storage unavailable or full
    }
  }, [isLoadedFromStorage, totalDonated, vaultBalance, releasedAmount, escrowStatus, frozenReason, recentTxs, tranches, trustScore]);

  // 1. Add Donation Action (Wiring Donate ➔ Escrow ➔ DAG ➔ Feed)
  const addDonation = useCallback(
    (params: {
      donorIdentifier?: string;
      donorName?: string;
      amount: number;
      rail: "CRYPTO" | "UPI";
      token: string;
      purposeName?: string;
      utrNumber?: string | null;
      donorEmail?: string;
      donorTaxId?: string;
    }): LedgerTransaction => {
      const ethRate = seedData.financials.exchangeRates.ethUsd; // $3,200
      const inrRate = seedData.financials.exchangeRates.usdInr; // ₹84.15

      let amountEth = 0;
      let amountUsd = 0;
      let amountInr = 0;
      let displayAmount = "";

      if (params.rail === "CRYPTO") {
        if (params.token === "ETH") {
          amountEth = params.amount;
          amountUsd = params.amount * ethRate;
          amountInr = amountUsd * inrRate;
          displayAmount = `${params.amount.toFixed(2)} ETH`;
        } else {
          // USDC
          amountUsd = params.amount;
          amountEth = params.amount / ethRate;
          amountInr = amountUsd * inrRate;
          displayAmount = `${params.amount.toLocaleString()} USDC`;
        }
      } else {
        // UPI (INR)
        amountInr = params.amount;
        amountUsd = params.amount / inrRate;
        amountEth = amountUsd / ethRate;
        displayAmount = `₹${params.amount.toLocaleString()}`;
      }

      // Generate realistic deterministic hash
      const randomHex = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      const newTxHash = `0x${randomHex}`;
      const newId = `DON-${Date.now().toString().slice(-4)}`;
      const donorLabel =
        params.donorIdentifier ||
        params.donorName ||
        "0x71C9...b901";

      const newTx: LedgerTransaction = {
        id: newId,
        donor: donorLabel.includes("@")
          ? donorLabel
          : `${donorLabel.slice(0, 6)}...${donorLabel.slice(-4)}`,
        donorFull: donorLabel,
        amount: displayAmount,
        amountEth: Number(amountEth.toFixed(4)),
        amountUsd: Number(amountUsd.toFixed(2)),
        amountInr: Number(amountInr.toFixed(2)),
        rail: params.rail,
        token: params.token,
        purpose: params.purposeName || seedData.campaign.name,
        txHash: newTxHash,
        status: "LOCKED_IN_ESCROW",
        timestamp: "Just now (Synced)",
        block: 20491892 + Math.floor(Math.random() * 5),
        utrNumber: params.utrNumber || null,
        donorTaxId: params.donorTaxId || null,
        taxReceiptId: `80G-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      // State updates: Total Donated = User Input Amount rather than the initial mock seed
      const finalEth = Number(amountEth.toFixed(4));
      setTotalDonated(finalEth);
      setVaultBalance(finalEth);
      setReleasedAmount(0.0);
      setRecentTxs((prev) => [newTx, ...prev]);

      // Dynamically scale the 4 tranches (20% / 30% / 30% / 20%) to match the user donation amount
      const t_splits = [0.20, 0.30, 0.30, 0.20];
      const scaledTranches: TrancheState[] = seedData.tranches.map((t, idx) => {
        const pct = t_splits[idx] ?? 0.25;
        const tEth = Number((finalEth * pct).toFixed(4));
        const tUsd = Number((tEth * ethRate).toFixed(2));
        const tInr = Number((tUsd * inrRate).toFixed(2));
        return {
          ...t,
          percentage: Math.round(pct * 100),
          amountEth: tEth,
          amountUsd: tUsd,
          amountInr: tInr,
          status: (idx === 0 ? "PENDING_VERIFICATION" : "LOCKED") as TrancheState["status"],
          badge: idx === 0 ? "CURRENT EARMARK" : "LOCKED",
          releasedAt: null,
          verifiedNullifier: null,
          releaseTxHash: null,
        };
      });
      setTranches(scaledTranches);

      return newTx;
    },
    []
  );

  // 2. Release Tranche Action
  const releaseTranche = useCallback(
    (trancheId: number, amountEth?: number, vendorName?: string) => {
      setTranches((prev) =>
        prev.map((t) => {
          if (t.trancheId === trancheId) {
            const releaseAmount = amountEth || t.amountEth;
            setReleasedAmount((r) => Number((r + releaseAmount).toFixed(4)));
            setVaultBalance((b) => Math.max(0, Number((b - releaseAmount).toFixed(4))));

            const releaseTx: LedgerTransaction = {
              id: `DISB-${t.trancheId}`,
              donor: "PurposeBoundEscrow.sol",
              donorFull: seedData.campaign.contractAddress,
              amount: `${releaseAmount.toFixed(2)} ETH`,
              amountEth: releaseAmount,
              amountUsd: releaseAmount * 3200,
              amountInr: releaseAmount * 269280,
              rail: "CRYPTO",
              token: "ETH",
              purpose: `${t.name} (Disbursed to ${vendorName || t.recipientVendor || "Verified Vendor"})`,
              txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
              status: "RELEASED",
              timestamp: "Just now (Released)",
              block: 20491910,
            };

            setRecentTxs((txs) => [releaseTx, ...txs]);

            return {
              ...t,
              status: "COMPLETED_VERIFIED",
              badge: "RELEASED",
              releasedAt: new Date().toUTCString(),
            };
          }
          return t;
        })
      );
      setTrustScore(99);
    },
    []
  );

  // 3. Freeze Escrow Action (Red-Team Circuit Breaker)
  const freezeEscrow = useCallback(
    (reason: string, offendingTxHash?: string) => {
      setEscrowStatus("FROZEN");
      setFrozenReason(reason);
      setTrustScore(32);

      const freezeTx: LedgerTransaction = {
        id: `FREEZE-${Date.now().toString().slice(-4)}`,
        donor: "CircuitBreaker.sol",
        donorFull: seedData.campaign.contractAddress,
        amount: "0.00 ETH (LOCKED)",
        amountEth: 0,
        amountUsd: 0,
        amountInr: 0,
        rail: "CRYPTO",
        token: "ETH",
        purpose: `🚨 EMERGENCY AUTO-FREEZE: ${reason}`,
        txHash:
          offendingTxHash ||
          "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
        status: "FROZEN",
        timestamp: "Just now (Circuit Breaker)",
        block: 20491892,
      };

      setRecentTxs((prev) => [freezeTx, ...prev]);
    },
    []
  );

  // 4. Unfreeze Escrow Action
  const unfreezeEscrow = useCallback(() => {
    setEscrowStatus("ACTIVE");
    setFrozenReason(null);
    setTrustScore(98);
  }, []);

  // 5. Reset to Baseline Seed State
  const resetToBaseline = useCallback(() => {
    setTotalDonated(seedData.financials.totalDepositedEth);
    setVaultBalance(seedData.financials.vaultBalanceEth);
    setReleasedAmount(seedData.financials.totalReleasedEth);
    setEscrowStatus(seedData.escrowState.status as "ACTIVE" | "FROZEN");
    setFrozenReason(null);
    setTrustScore(98);
    setRecentTxs(INITIAL_TRANSACTIONS);
    setTranches(seedData.tranches as TrancheState[]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const value: LedgerContextValue = {
    totalDonated,
    vaultBalance,
    releasedAmount,
    escrowStatus,
    frozenReason,
    recentTxs,
    tranches,
    campaign: seedData.campaign,
    exchangeRates: seedData.financials.exchangeRates,
    liveSyncConnected: true,
    addDonation,
    releaseTranche,
    freezeEscrow,
    unfreezeEscrow,
    resetToBaseline,
    trustScore,
    setTrustScore,
  };

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextValue {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error("useLedger must be used within a LedgerProvider");
  }
  return context;
}
