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
  rail: "CRYPTO" | "UPI" | "IN_KIND_LOGISTICS" | "VOLUNTEER_SERVICE";
  token: string;
  purpose: string;
  txHash: string;
  status: "LOCKED_IN_ESCROW" | "RELEASED" | "FROZEN" | "RECEIVED_IN_WAREHOUSE" | "LOGGED_IN_REGISTRY";
  timestamp: string;
  block: number;
  utrNumber?: string | null;
  donorTaxId?: string | null;
  taxReceiptId?: string | null;
  // Feature 1: Non-Cash In-Kind & Inventory Tracking
  contributionType?: "MONEY" | "GOODS" | "FOOD" | "MEDICAL" | "VOLUNTEER_SERVICE" | "OTHER";
  itemName?: string | null;
  quantity?: number | null;
  unit?: string | null;
  estimatedValue?: number | null;
  inventory?: {
    pledged: number;
    received: number;
    distributed: number;
    damaged: number;
    remaining: number;
  } | null;
  // Feature 4: Voluntary Services (Time & Professional Skills)
  volunteerCategory?: "Medical" | "Legal" | "Teaching" | "Engineering" | "Other" | null;
  volunteerName?: string | null;
  volunteerRef?: string | null;
  hours?: number | null;
  sessions?: number | null;
  volunteerStatus?: "PLANNED" | "COMPLETED" | null;
}

export type VolunteerCategory = "Medical" | "Legal" | "Teaching" | "Engineering" | "Other";
export type VolunteerServiceStatus = "PLANNED" | "COMPLETED";

export interface VolunteerServiceRecord {
  id: string;
  volunteerName: string;
  volunteerRef?: string;
  category: VolunteerCategory;
  skillTitle: string;
  hours: number;
  sessions: number;
  status: VolunteerServiceStatus;
  estimatedValue: number;
  estimatedValueCurrency: string;
  hourlyRateEstimate?: number;
  estimatedHourlyRateInr?: number;
  estimatedTotalValueInr?: number;
  estimatedTotalValueUsd?: number;
  purposeId: string;
  purposeName: string;
  date: string;
  verificationHash?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface VolunteerImpactSummary {
  totalHours: number;
  completedHours: number;
  plannedHours: number;
  totalSessions: number;
  totalVolunteers: number;
  uniqueVolunteers?: number;
  estimatedEconomicValueInr: number;
  estimatedEconomicValueUsd: number;
  estimatedValueInr?: number;
  estimatedValueUsd?: number;
  hoursByCategory: Record<VolunteerCategory, number>;
  sessionsByCategory: Record<VolunteerCategory, number>;
  byCategory?: Record<VolunteerCategory, { hours: number; sessions: number; estimatedValueInr: number; estimatedValueUsd: number }>;
  auditRule: string;
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
    rail: "CRYPTO" | "UPI" | "IN_KIND_LOGISTICS" | "VOLUNTEER_SERVICE";
    token: string;
    purposeName?: string;
    utrNumber?: string | null;
    donorEmail?: string;
    donorTaxId?: string;
    contributionType?: "MONEY" | "GOODS" | "FOOD" | "MEDICAL" | "VOLUNTEER_SERVICE" | "OTHER";
    itemName?: string;
    quantity?: number;
    unit?: string;
    estimatedValue?: number;
    inventory?: {
      pledged: number;
      received: number;
      distributed: number;
      damaged: number;
      remaining: number;
    };
    volunteerCategory?: VolunteerCategory;
    volunteerName?: string;
    volunteerRef?: string;
    skillTitle?: string;
    hours?: number;
    sessions?: number;
    volunteerStatus?: VolunteerServiceStatus;
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
  statementFreshness: BankStatementFreshness;
  refreshStatement: (daysAgo?: number, reportingPeriod?: string) => Promise<void>;
  volunteerServices: VolunteerServiceRecord[];
  volunteerImpact: VolunteerImpactSummary;
  logVolunteerService: (record: {
    volunteerName: string;
    category: VolunteerCategory;
    skillTitle: string;
    hours: number;
    sessions?: number;
    status?: VolunteerServiceStatus;
    volunteerRef?: string;
    hourlyRateEstimate?: number;
    estimatedHourlyRateInr?: number;
    estimatedValue?: number;
    estimatedTotalValueInr?: number;
    estimatedTotalValueUsd?: number;
    purposeId?: string;
    purposeName?: string;
    notes?: string;
  }) => Promise<VolunteerServiceRecord>;
  latestDonorTx: LedgerTransaction | null;
  setLatestDonorTx: (tx: LedgerTransaction | null) => void;
}

export interface BankStatementFreshness {
  lastStatementUploadDate: string;
  reportingPeriod: string;
  daysElapsed: number;
  thresholdDays: number;
  isOverdue: boolean;
  stalenessLevel: "FRESH" | "EXPIRING_SOON" | "OVERDUE" | "CRITICAL";
  warningBadge: string;
  statementFilename?: string;
  statementHash?: string;
  bankName?: string;
  accountNumberMasked?: string;
  uploadedBy?: string;
  auditRule?: string;
}

export const DEFAULT_STATEMENT_FRESHNESS: BankStatementFreshness = {
  lastStatementUploadDate: "2026-09-14T09:30:00Z",
  reportingPeriod: "Q3 2026 (July 1 - September 14, 2026)",
  daysElapsed: 42,
  thresholdDays: 30,
  isOverdue: true,
  stalenessLevel: "OVERDUE",
  warningBadge: "⚠️ Statement Overdue: 42 days since last upload",
  statementFilename: "ICICI_Corporate_Escrow_Statement_Q3_2026.pdf",
  statementHash: "0x5e89a3f2d1c087b4e91234567890abcdef1234567890abcdef1234567890abcd",
  bankName: "ICICI Bank Ltd — FCRA & Institutional Escrow Branch",
  accountNumberMasked: "•••• •••• •••• 9012",
  uploadedBy: "FinOps Officer (Anand Verma, CA)",
  auditRule: "RBI FCRA / Standard Philanthropic Audit Rule: Bank statements must be reconciled every 30 days.",
};

export const DEFAULT_VOLUNTEER_SERVICES: VolunteerServiceRecord[] = [
  {
    id: "VOL-001",
    volunteerName: "Dr. Sunita Rao (MD)",
    volunteerRef: "MCI-REG-2012-44102",
    category: "Medical",
    skillTitle: "Rural Fluorosis Screening & Pediatric Triage Health Camp",
    hours: 48,
    sessions: 8,
    status: "COMPLETED",
    hourlyRateEstimate: 5000,
    estimatedValue: 240000,
    estimatedValueCurrency: "INR",
    purposeId: "water-wardha",
    purposeName: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    date: "2026-10-18",
    verificationHash: "0x4a18b7c29e0134df8921a4bc567890ef1234567890abcdef1234567890abcdef",
    verifiedBy: "District Medical Officer & NGO Field Director",
    notes: "Diagnostic screening of 312 children across 4 hamlets for early skeletal and dental fluorosis.",
  },
  {
    id: "VOL-002",
    volunteerName: "Er. Pradeep Patil (M.Tech, Civil)",
    volunteerRef: "IEI-ENG-99881",
    category: "Engineering",
    skillTitle: "Hydrogeological Aquifer Mapping & Borewell Casing Structural Integrity",
    hours: 36,
    sessions: 6,
    status: "COMPLETED",
    hourlyRateEstimate: 5000,
    estimatedValue: 180000,
    estimatedValueCurrency: "INR",
    purposeId: "water-wardha",
    purposeName: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    date: "2026-10-21",
    verificationHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
    verifiedBy: "Chief Structural Consultant, Vidarbha Geoconsult",
    notes: "Resistivity soundings and acoustic telemetry check on 3 deep borewells prior to pump lowering.",
  },
  {
    id: "VOL-003",
    volunteerName: "Adv. Rajesh Deshmukh",
    volunteerRef: "BAR-MAH-2009-8812",
    category: "Legal",
    skillTitle: "Grampanchayat Water Rights Easement & Statutory FCRA Advisory",
    hours: 24,
    sessions: 4,
    status: "COMPLETED",
    hourlyRateEstimate: 5000,
    estimatedValue: 120000,
    estimatedValueCurrency: "INR",
    purposeId: "water-wardha",
    purposeName: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    date: "2026-10-22",
    verificationHash: "0x11223344556677889900aabbccddeeff0011223344556677889900aabbccddee",
    verifiedBy: "Legal Compliance Watchtower & Panchayat Secretary",
    notes: "Execution of irrevocable public utility easements for solar pump stations on community commons land.",
  },
  {
    id: "VOL-004",
    volunteerName: "Prof. Anita Roy (Ph.D.)",
    volunteerRef: "EDU-UGC-19940",
    category: "Teaching",
    skillTitle: "WASH Community Hygiene, Water ATM Operation & Testing Kit Workshops",
    hours: 32,
    sessions: 6,
    status: "COMPLETED",
    hourlyRateEstimate: 3000,
    estimatedValue: 96000,
    estimatedValueCurrency: "INR",
    purposeId: "water-wardha",
    purposeName: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    date: "2026-10-23",
    verificationHash: "0x5566778899001122334455667788990011223344556677889900112233445566",
    verifiedBy: "Zilla Parishad Education Coordinator",
    notes: "Trained 45 village women self-help group leaders on daily chemical reagent testing and RFID ATM maintenance.",
  },
  {
    id: "VOL-005",
    volunteerName: "Er. Vikram Shinde (B.E., Solar)",
    volunteerRef: "SOLAR-MAHA-0091",
    category: "Engineering",
    skillTitle: "Solar Submersible Inverter Telemetry Calibration & PV Field Hookup",
    hours: 16,
    sessions: 2,
    status: "PLANNED",
    hourlyRateEstimate: 5000,
    estimatedValue: 80000,
    estimatedValueCurrency: "INR",
    purposeId: "water-wardha",
    purposeName: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    date: "2026-10-28",
    verificationHash: "0x99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
    verifiedBy: "Scheduled Field Deployment",
    notes: "Staged integration of remote 4G telemetry sensors on 4x 5HP inverters for automated flow logging.",
  },
  {
    id: "VOL-006",
    volunteerName: "Dr. Arvind Joshi (MBBS, DPH)",
    volunteerRef: "MCI-REG-2018-77112",
    category: "Medical",
    skillTitle: "Post-Monsoon Waterborne Illness Monitoring & Clean Water Follow-up",
    hours: 20,
    sessions: 3,
    status: "PLANNED",
    hourlyRateEstimate: 5000,
    estimatedValue: 100000,
    estimatedValueCurrency: "INR",
    purposeId: "water-wardha",
    purposeName: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    date: "2026-10-30",
    verificationHash: "0x2233445566778899001122334455667788990011223344556677889900112233",
    verifiedBy: "Scheduled Clinic Roster",
    notes: "Baseline health survey on gastrointestinal incidence 30 days post-chlorination.",
  },
];

export const DEFAULT_VOLUNTEER_IMPACT: VolunteerImpactSummary = {
  totalHours: 176,
  completedHours: 140,
  plannedHours: 36,
  totalSessions: 29,
  totalVolunteers: 6,
  uniqueVolunteers: 6,
  estimatedEconomicValueInr: 816000,
  estimatedEconomicValueUsd: 9696.97,
  estimatedValueInr: 816000,
  estimatedValueUsd: 9697,
  hoursByCategory: {
    Medical: 68,
    Legal: 24,
    Teaching: 32,
    Engineering: 52,
    Other: 0,
  },
  sessionsByCategory: {
    Medical: 11,
    Legal: 4,
    Teaching: 6,
    Engineering: 8,
    Other: 0,
  },
  byCategory: {
    Medical: { hours: 68, sessions: 11, estimatedValueInr: 340000, estimatedValueUsd: 4040 },
    Engineering: { hours: 52, sessions: 8, estimatedValueInr: 260000, estimatedValueUsd: 3090 },
    Teaching: { hours: 32, sessions: 6, estimatedValueInr: 96000, estimatedValueUsd: 1141 },
    Legal: { hours: 24, sessions: 4, estimatedValueInr: 120000, estimatedValueUsd: 1426 },
    Other: { hours: 0, sessions: 0, estimatedValueInr: 0, estimatedValueUsd: 0 },
  },
  auditRule: "Anti-Inflation Guarantee: Pro-bono voluntary services are verified and tracked strictly by professional hours; estimated economic values are never inflated into cash or escrow totals.",
};

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
    id: "DON-904",
    donor: "Rotary Global Health",
    donorFull: "rotary.international.relief@rotary.org",
    amount: "150 kits",
    amountEth: 5.86,
    amountUsd: 18750.0,
    amountInr: 1577812.0,
    rail: "IN_KIND_LOGISTICS",
    token: "KIT",
    purpose: "Emergency Rural Medical Clinics",
    txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
    status: "RECEIVED_IN_WAREHOUSE",
    timestamp: "2026-10-25 09:15:00 UTC",
    block: 20491845,
    taxReceiptId: "80G-2026-904001",
    contributionType: "MEDICAL",
    itemName: "Emergency Surgical & First-Aid Triage Kits",
    quantity: 150,
    unit: "kits",
    estimatedValue: 18750.0,
    inventory: {
      pledged: 150,
      received: 150,
      distributed: 120,
      damaged: 4,
      remaining: 26,
    },
  },
  {
    id: "DON-905",
    donor: "Kirloskar Clean Tech",
    donorFull: "csr.donations@kirloskar-water.com",
    amount: "40 units",
    amountEth: 7.5,
    amountUsd: 24000.0,
    amountInr: 2019600.0,
    rail: "IN_KIND_LOGISTICS",
    token: "UNIT",
    purpose: "Rural Water Infrastructure Fund (Maharashtra Cluster)",
    txHash: "0x5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b",
    status: "RECEIVED_IN_WAREHOUSE",
    timestamp: "2026-10-25 10:20:00 UTC",
    block: 20491852,
    taxReceiptId: "80G-2026-905002",
    contributionType: "GOODS",
    itemName: "Solar Submersible Borewell Pumps (5HP)",
    quantity: 40,
    unit: "units",
    estimatedValue: 24000.0,
    inventory: {
      pledged: 40,
      received: 40,
      distributed: 32,
      damaged: 1,
      remaining: 7,
    },
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
  const [latestDonorTx, setLatestDonorTx] = useState<LedgerTransaction | null>(null);
  const [tranches, setTranches] = useState<TrancheState[]>(
    seedData.tranches as TrancheState[]
  );
  const [trustScore, setTrustScore] = useState<number>(
    seedData.escrowState.status === "FROZEN" ? 32 : 98
  );
  const [statementFreshness, setStatementFreshness] = useState<BankStatementFreshness>(DEFAULT_STATEMENT_FRESHNESS);
  const [volunteerServices, setVolunteerServices] = useState<VolunteerServiceRecord[]>(DEFAULT_VOLUNTEER_SERVICES);
  const [volunteerImpact, setVolunteerImpact] = useState<VolunteerImpactSummary>(DEFAULT_VOLUNTEER_IMPACT);

  // Recompute volunteer impact whenever volunteer services change
  useEffect(() => {
    const totalHours = volunteerServices.reduce((sum, v) => sum + v.hours, 0);
    const completedHours = volunteerServices.filter((v) => v.status === "COMPLETED").reduce((sum, v) => sum + v.hours, 0);
    const plannedHours = volunteerServices.filter((v) => v.status === "PLANNED").reduce((sum, v) => sum + v.hours, 0);
    const totalSessions = volunteerServices.reduce((sum, v) => sum + v.sessions, 0);
    const totalVolunteers = new Set(volunteerServices.map((v) => v.volunteerName)).size;
    const valInr = volunteerServices.reduce((sum, v) => sum + v.estimatedValue, 0);
    const valUsd = Number((valInr / 84.15).toFixed(2));

    const hoursByCategory: Record<VolunteerCategory, number> = {
      Medical: 0,
      Legal: 0,
      Teaching: 0,
      Engineering: 0,
      Other: 0,
    };
    const sessionsByCategory: Record<VolunteerCategory, number> = {
      Medical: 0,
      Legal: 0,
      Teaching: 0,
      Engineering: 0,
      Other: 0,
    };

    volunteerServices.forEach((v) => {
      const cat: VolunteerCategory = v.category in hoursByCategory ? v.category : "Other";
      hoursByCategory[cat] = (hoursByCategory[cat] || 0) + v.hours;
      sessionsByCategory[cat] = (sessionsByCategory[cat] || 0) + v.sessions;
    });

    setVolunteerImpact({
      totalHours,
      completedHours,
      plannedHours,
      totalSessions,
      totalVolunteers,
      uniqueVolunteers: totalVolunteers,
      estimatedEconomicValueInr: valInr,
      estimatedEconomicValueUsd: valUsd,
      estimatedValueInr: valInr,
      estimatedValueUsd: Math.round(valUsd),
      hoursByCategory,
      sessionsByCategory,
      byCategory: {
        Medical: {
          hours: hoursByCategory.Medical || 0,
          sessions: sessionsByCategory.Medical || 0,
          estimatedValueInr: (hoursByCategory.Medical || 0) * 5000,
          estimatedValueUsd: Math.round(((hoursByCategory.Medical || 0) * 5000) / 84.15),
        },
        Engineering: {
          hours: hoursByCategory.Engineering || 0,
          sessions: sessionsByCategory.Engineering || 0,
          estimatedValueInr: (hoursByCategory.Engineering || 0) * 5000,
          estimatedValueUsd: Math.round(((hoursByCategory.Engineering || 0) * 5000) / 84.15),
        },
        Teaching: {
          hours: hoursByCategory.Teaching || 0,
          sessions: sessionsByCategory.Teaching || 0,
          estimatedValueInr: (hoursByCategory.Teaching || 0) * 3000,
          estimatedValueUsd: Math.round(((hoursByCategory.Teaching || 0) * 3000) / 84.15),
        },
        Legal: {
          hours: hoursByCategory.Legal || 0,
          sessions: sessionsByCategory.Legal || 0,
          estimatedValueInr: (hoursByCategory.Legal || 0) * 5000,
          estimatedValueUsd: Math.round(((hoursByCategory.Legal || 0) * 5000) / 84.15),
        },
        Other: {
          hours: hoursByCategory.Other || 0,
          sessions: sessionsByCategory.Other || 0,
          estimatedValueInr: (hoursByCategory.Other || 0) * 2500,
          estimatedValueUsd: Math.round(((hoursByCategory.Other || 0) * 2500) / 84.15),
        },
      },
      auditRule: "Anti-Inflation Guarantee: Pro-bono voluntary services are verified and tracked strictly by professional hours; estimated economic values are never inflated into cash or escrow totals.",
    });
  }, [volunteerServices]);

  const refreshStatement = useCallback(async (daysAgo: number = 0, reportingPeriod?: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/statement-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysAgo, reportingPeriod }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.statementFreshness) {
          setStatementFreshness(data.statementFreshness);
          return;
        }
      }
    } catch {
      // Local fallback
    }

    const anchorDate = new Date("2026-10-26T01:30:00Z");
    const newDate = new Date(anchorDate.getTime() - (daysAgo * 86400000));
    const isOverdue = daysAgo > 30;
    const stalenessLevel = daysAgo <= 14 ? "FRESH" : daysAgo <= 30 ? "EXPIRING_SOON" : daysAgo <= 60 ? "OVERDUE" : "CRITICAL";
    setStatementFreshness({
      ...DEFAULT_STATEMENT_FRESHNESS,
      lastStatementUploadDate: newDate.toISOString(),
      reportingPeriod: reportingPeriod || (daysAgo === 0 ? "October 2026 Statement" : DEFAULT_STATEMENT_FRESHNESS.reportingPeriod),
      daysElapsed: daysAgo,
      isOverdue,
      stalenessLevel,
      warningBadge: isOverdue ? `⚠️ Statement Overdue: ${daysAgo} days since last upload` : `✓ Statement Current: ${daysAgo}d ago`,
    });
  }, []);

  const logVolunteerService = useCallback(async (record: {
    volunteerName: string;
    category: VolunteerCategory;
    skillTitle: string;
    hours: number;
    sessions?: number;
    status?: VolunteerServiceStatus;
    volunteerRef?: string;
    hourlyRateEstimate?: number;
    estimatedHourlyRateInr?: number;
    estimatedValue?: number;
    estimatedTotalValueInr?: number;
    estimatedTotalValueUsd?: number;
    purposeId?: string;
    purposeName?: string;
    notes?: string;
  }): Promise<VolunteerServiceRecord> => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/donate/log-volunteer-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          setVolunteerServices((prev) => [data.record, ...prev]);
          if (data.summary) {
            setVolunteerImpact(data.summary);
          }
          return data.record;
        }
      }
    } catch {
      // Local fallback
    }

    const volId = `VOL-${Date.now().toString().slice(-3)}`;
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const hourlyRate = record.hourlyRateEstimate || record.estimatedHourlyRateInr || (record.category === "Teaching" ? 3000 : 5000);
    const estVal = record.estimatedValue || record.estimatedTotalValueInr || (record.hours * hourlyRate);

    const newRec: VolunteerServiceRecord = {
      id: volId,
      volunteerName: record.volunteerName,
      volunteerRef: record.volunteerRef || `REG-${Math.floor(10000 + Math.random() * 90000)}`,
      category: record.category,
      skillTitle: record.skillTitle,
      hours: record.hours,
      sessions: record.sessions || 1,
      status: record.status || "COMPLETED",
      hourlyRateEstimate: hourlyRate,
      estimatedHourlyRateInr: hourlyRate,
      estimatedValue: estVal,
      estimatedTotalValueInr: estVal,
      estimatedTotalValueUsd: record.estimatedTotalValueUsd || Math.round(estVal / 84.15),
      estimatedValueCurrency: "INR",
      purposeId: record.purposeId || "water-wardha",
      purposeName: seedData.campaign.name,
      date: new Date().toISOString().slice(0, 10),
      verificationHash: `0x${randomHex}`,
      verifiedBy: "Panchayat Secretary & Project Coordinator",
      notes: record.notes,
    };

    setVolunteerServices((prev) => [newRec, ...prev]);
    return newRec;
  }, []);

  // Fetch initial volunteer services from backend if online
  useEffect(() => {
    async function fetchVolunteers() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/donate/volunteer-services");
        if (res.ok) {
          const data = await res.json();
          if (data.records && data.records.length > 0) {
            setVolunteerServices(data.records);
          }
          if (data.summary) {
            setVolunteerImpact(data.summary);
          }
        }
      } catch {
        // use default state
      }
    }
    fetchVolunteers();
  }, []);

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

      const savedLatest = localStorage.getItem("LATEST_DONOR_TX");
      if (savedLatest) {
        setLatestDonorTx(JSON.parse(savedLatest));
      }
    } catch {
      // Ignore parse errors, fallback to seed
    } finally {
      setIsLoadedFromStorage(true);
    }

    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "LATEST_DONOR_TX" && e.newValue) {
        try {
          setLatestDonorTx(JSON.parse(e.newValue));
        } catch {}
      }
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
      rail: "CRYPTO" | "UPI" | "IN_KIND_LOGISTICS" | "VOLUNTEER_SERVICE";
      token: string;
      purposeName?: string;
      utrNumber?: string | null;
      donorEmail?: string;
      donorTaxId?: string;
      contributionType?: "MONEY" | "GOODS" | "FOOD" | "MEDICAL" | "VOLUNTEER_SERVICE" | "OTHER";
      itemName?: string;
      quantity?: number;
      unit?: string;
      estimatedValue?: number;
      inventory?: {
        pledged: number;
        received: number;
        distributed: number;
        damaged: number;
        remaining: number;
      };
      volunteerCategory?: VolunteerCategory;
      volunteerName?: string;
      volunteerRef?: string;
      skillTitle?: string;
      hours?: number;
      sessions?: number;
      volunteerStatus?: VolunteerServiceStatus;
    }): LedgerTransaction => {
      const ethRate = seedData.financials.exchangeRates.ethUsd; // $3,200
      const inrRate = seedData.financials.exchangeRates.usdInr; // ₹84.15

      const isVolunteer = params.contributionType === "VOLUNTEER_SERVICE";
      const isNonCash = (!isVolunteer) && params.contributionType && ["GOODS", "FOOD", "MEDICAL", "OTHER"].includes(params.contributionType);

      let amountEth = 0;
      let amountUsd = 0;
      let amountInr = 0;
      let displayAmount = "";

      if (isVolunteer) {
        // ZERO CASH INFLATION: Pro-bono hours do not add to liquid cash escrow
        amountEth = 0;
        amountUsd = 0;
        amountInr = 0;
        const vHours = params.hours || params.amount || 8;
        const vCat = params.volunteerCategory || "Engineering";
        displayAmount = `${vHours} hrs (${vCat})`;

        const hourlyRate = (vCat === "Teaching" ? 3000 : 5000);
        const estValInr = params.estimatedValue || (vHours * hourlyRate);

        const newVolRecord: VolunteerServiceRecord = {
          id: `VOL-${Date.now().toString().slice(-3)}`,
          volunteerName: params.volunteerName || params.donorName || "Er. Specialized Consultant",
          volunteerRef: params.volunteerRef || `REG-${Math.floor(10000 + Math.random() * 90000)}`,
          category: vCat,
          skillTitle: params.skillTitle || params.itemName || `${vCat} Pro-Bono Services`,
          hours: vHours,
          sessions: params.sessions || 1,
          status: params.volunteerStatus || "COMPLETED",
          hourlyRateEstimate: hourlyRate,
          estimatedValue: estValInr,
          estimatedValueCurrency: "INR",
          purposeId: "water-wardha",
          purposeName: params.purposeName || seedData.campaign.name,
          date: new Date().toISOString().slice(0, 10),
          verificationHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          verifiedBy: "Panchayat Secretary & Project Coordinator",
          notes: `Voluntary pro-bono contribution of ${vHours} hrs in ${vCat}.`,
        };
        setVolunteerServices((prev) => [newVolRecord, ...prev]);
      } else if (isNonCash) {
        const qty = params.quantity || params.amount || 1;
        const unitLabel = params.unit || "units";
        displayAmount = `${qty} ${unitLabel}`;
        amountUsd = params.estimatedValue || (qty * 75);
        amountInr = amountUsd * inrRate;
        amountEth = amountUsd / ethRate;
      } else if (params.rail === "CRYPTO") {
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
        // Fiat rails (INR, USD, EUR, GBP)
        const tok = (params.token || "INR").toUpperCase();
        if (tok === "USD") {
          amountUsd = params.amount;
          amountInr = amountUsd * inrRate;
          amountEth = amountUsd / ethRate;
          displayAmount = `$${params.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`;
        } else if (tok === "EUR") {
          amountUsd = params.amount * 1.08;
          amountInr = amountUsd * inrRate;
          amountEth = amountUsd / ethRate;
          displayAmount = `€${params.amount.toLocaleString("en-EU", { minimumFractionDigits: 2 })} EUR`;
        } else if (tok === "GBP") {
          amountUsd = params.amount * 1.28;
          amountInr = amountUsd * inrRate;
          amountEth = amountUsd / ethRate;
          displayAmount = `£${params.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })} GBP`;
        } else {
          // Default INR
          amountInr = params.amount;
          amountUsd = params.amount / inrRate;
          amountEth = amountUsd / ethRate;
          displayAmount = `₹${params.amount.toLocaleString("en-IN")} INR`;
        }
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

      const finalInventory = params.inventory || (isNonCash ? {
        pledged: params.quantity || params.amount,
        received: params.quantity || params.amount,
        distributed: 0,
        damaged: 0,
        remaining: params.quantity || params.amount,
      } : null);

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
        rail: isVolunteer ? "VOLUNTEER_SERVICE" : (isNonCash ? "IN_KIND_LOGISTICS" : params.rail),
        token: isVolunteer ? "HOURS" : (isNonCash ? (params.unit || "ITEM").toUpperCase() : params.token),
        purpose: params.purposeName || seedData.campaign.name,
        txHash: newTxHash,
        status: isVolunteer ? "LOGGED_IN_REGISTRY" : (isNonCash ? "RECEIVED_IN_WAREHOUSE" : "LOCKED_IN_ESCROW"),
        timestamp: "Just now (Synced)",
        block: 20491892 + Math.floor(Math.random() * 5),
        utrNumber: params.utrNumber || null,
        donorTaxId: params.donorTaxId || null,
        taxReceiptId: `80G-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        contributionType: params.contributionType || "MONEY",
        itemName: params.itemName || null,
        quantity: params.quantity || (isNonCash ? params.amount : (isVolunteer ? (params.hours || params.amount) : null)),
        unit: isVolunteer ? "hours" : (params.unit || null),
        estimatedValue: params.estimatedValue || (isNonCash ? amountUsd : null),
        inventory: finalInventory,
        volunteerCategory: params.volunteerCategory || null,
        volunteerName: params.volunteerName || null,
        volunteerRef: params.volunteerRef || null,
        hours: params.hours || null,
        sessions: params.sessions || null,
        volunteerStatus: params.volunteerStatus || null,
      };

      // State updates:
      // If Cash donation, scale liquid vault and milestone tranches
      // If Non-Cash in-kind donation or Volunteer Service, record in live transaction feed without diluting liquid cash escrow
      if (!isNonCash && !isVolunteer) {
        const finalEth = Number(amountEth.toFixed(4));
        setTotalDonated((prev) => Number((prev + finalEth).toFixed(4)));
        setVaultBalance((prev) => Number((prev + finalEth).toFixed(4)));
        setReleasedAmount(0.0);

        const t_splits = [0.20, 0.30, 0.30, 0.20];
        setTranches((prev) => {
          const totalPool = (totalDonated || 50.0) + finalEth;
          return prev.map((t, idx) => {
            const pct = t_splits[idx] ?? 0.25;
            const tEth = Number((totalPool * pct).toFixed(4));
            const tUsd = Number((tEth * ethRate).toFixed(2));
            const tInr = Number((tUsd * inrRate).toFixed(2));
            return {
              ...t,
              percentage: Math.round(pct * 100),
              amountEth: tEth,
              amountUsd: tUsd,
              amountInr: tInr,
            };
          });
        });
      }

      setLatestDonorTx(newTx);
      try {
        localStorage.setItem("LATEST_DONOR_TX", JSON.stringify(newTx));
      } catch {}

      setRecentTxs((prev) => [newTx, ...prev]);
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
        purpose: `[EMERGENCY AUTO-FREEZE]: ${reason}`,
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
    setStatementFreshness(DEFAULT_STATEMENT_FRESHNESS);
    setVolunteerServices(DEFAULT_VOLUNTEER_SERVICES);
    setVolunteerImpact(DEFAULT_VOLUNTEER_IMPACT);

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
    statementFreshness,
    refreshStatement,
    volunteerServices,
    volunteerImpact,
    logVolunteerService,
    latestDonorTx,
    setLatestDonorTx,
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
