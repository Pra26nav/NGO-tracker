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
}

const STORAGE_KEY = "bhol_ledger_state_v3";

/* ────────────────────────────────────────────────────────────
   Initial Baseline Seed Transactions
──────────────────────────────────────────────────────────── */
const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
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
  {
    id: "DON-902",
    donor: "priya.sharma@okaxis",
    donorFull: "priya.sharma@okaxis",
    amount: "₹25,000",
    amountEth: 0.0928,
    amountUsd: 297.08,
    amountInr: 25000.0,
    rail: "UPI",
    token: "INR_MINTED_USDC",
    purpose: seedData.campaign.name,
    txHash: "0x44b912aaccdd00112233445566778899aabbccddeeff00112233445566778899",
    status: "LOCKED_IN_ESCROW",
    timestamp: "2026-10-25 08:30:00 UTC",
    block: 20491839,
    utrNumber: "UTR-2026-881290",
    taxReceiptId: "80G-2026-881290",
  },
  {
    id: "DON-903",
    donor: "0x4E21...a391",
    donorFull: "0x4E21Fa387B67B543D75e3Ea2E59E50Eb147Ea391",
    amount: "2,500 USDC",
    amountEth: 0.78125,
    amountUsd: 2500.0,
    amountInr: 210375.0,
    rail: "CRYPTO",
    token: "USDC",
    purpose: "Solar Fluoride Filtration & Water ATM",
    txHash: "0x9c1029384756ab1029384756ab1029384756ab1029384756ab1029384756ab10",
    status: "LOCKED_IN_ESCROW",
    timestamp: "2026-10-25 11:45:00 UTC",
    block: 20491865,
    taxReceiptId: "80G-2026-102938",
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Storage unavailable or full
    }
  }, [isLoadedFromStorage, totalDonated, vaultBalance, releasedAmount, escrowStatus, frozenReason, recentTxs, tranches]);

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
    },
    []
  );

  // 3. Freeze Escrow Action (Red-Team Circuit Breaker)
  const freezeEscrow = useCallback(
    (reason: string, offendingTxHash?: string) => {
      setEscrowStatus("FROZEN");
      setFrozenReason(reason);

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
  }, []);

  // 5. Reset to Baseline Seed State
  const resetToBaseline = useCallback(() => {
    setTotalDonated(seedData.financials.totalDepositedEth);
    setVaultBalance(seedData.financials.vaultBalanceEth);
    setReleasedAmount(seedData.financials.totalReleasedEth);
    setEscrowStatus(seedData.escrowState.status as "ACTIVE" | "FROZEN");
    setFrozenReason(null);
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
