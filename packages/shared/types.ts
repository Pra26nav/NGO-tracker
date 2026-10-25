export interface MerkleLeaf {
  label: string;
  value: string;
  hash: string;
  isRedactedPII: boolean;
}

export interface ForensicScanResult {
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
  verdict:
    | "VERIFIED_RELEASE"
    | "FROZEN_DOUBLE_SPEND"
    | "FROZEN_FORGERY"
    | "FROZEN_CATEGORY_MISMATCH";
  escrowFrozen: boolean;
  failureReason?: string | null;
}

export interface EscrowState {
  status: "ACTIVE" | "FROZEN";
  balance_eth: number;
  released_eth: number;
  vault_balance_eth?: number;
  earmark: string;
  frozen_reason: string | null;
  last_tx_hash: string;
}

export interface MilestoneTranche {
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
  verifiedNullifier?: string | null;
  verifiedMerkleRoot?: string | null;
  releasedAt?: string | null;
  txHash?: string | null;
  recipientVendor: string;
}

export interface CampaignSeedData {
  campaign: {
    id: string;
    campaignId: number;
    name: string;
    shortName: string;
    description: string;
    category: string;
    earmark: string;
    earmarkedPurpose: string;
    keccak256Commitment: string;
    contractAddress: string;
    nullifierRegistry: string;
    donorAddress: string;
    ngoAddress: string;
    verifiedVendor: string;
    network: string;
    lastTxHash: string;
    targetHouseholds: number;
  };
  financials: {
    totalDonatedEth: number;
    totalDepositedEth: number;
    totalReleasedEth: number;
    vaultBalanceEth: number;
    remainingEth: number;
    totalDonatedInr: number;
    totalReleasedInr: number;
    vaultBalanceInr: number;
    totalDonatedUsd: number;
    totalReleasedUsd: number;
    vaultBalanceUsd: number;
    exchangeRates: {
      ethUsd: number;
      usdInr: number;
      ethInr: number;
    };
  };
  escrowState: EscrowState;
  tranches: MilestoneTranche[];
}

/* ────────────────────────────────────────────────────────────
   Augmented Target Architecture Types (Research Integrated)
──────────────────────────────────────────────────────────── */

export type FundFlowEventType =
  | "DONATION"
  | "ALLOCATION"
  | "TRANSFER"
  | "SWAP"
  | "BRIDGE"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "OFFRAMP"
  | "FIAT_PAYMENT"
  | "EXPENDITURE";

export interface FundFlowEvent {
  id: string;
  campaignId?: string | number;
  allocationId?: string;
  chain?: string;
  transactionHash?: string;
  blockNumber?: bigint | number;
  timestamp: string;
  from?: string;
  to?: string;
  asset: string;
  amount: string | number;
  amountUsd?: number;
  amountInr?: number;
  eventType: FundFlowEventType;
  parentEventIds: string[];
  provenanceWeight?: number; // 0.0 to 1.0 (Proportional haircut ratio)
  evidenceRefs: string[];
  confidence: number; // 0.0 to 1.0
  metadata?: Record<string, any>;
}

export type FundNodeType =
  | "DONATION"
  | "WALLET"
  | "TOKEN"
  | "TRANSACTION"
  | "SWAP"
  | "BRIDGE"
  | "CHAIN"
  | "EXCHANGE"
  | "OFF_RAMP"
  | "FIAT_ACCOUNT"
  | "VENDOR"
  | "EXPENDITURE"
  | "EVIDENCE"
  | "ALLOCATION"
  | "CAMPAIGN"
  | "MILESTONE"
  | "IMPACT"
  | "ATTESTATION";

export type FundEdgeType =
  | "FUNDED"
  | "TRANSFERRED"
  | "SWAPPED"
  | "BRIDGED"
  | "DEPOSITED"
  | "WITHDRAWN"
  | "CONVERTED"
  | "PAID"
  | "ALLOCATED"
  | "SUPPORTED_BY"
  | "ATTESTED_BY"
  | "CLAIMED_AS"
  | "DUPLICATES";

export interface FundNode {
  id: string;
  type: FundNodeType;
  label: string;
  source: string;
  timestamp: string;
  chain?: string;
  transactionHash?: string;
  amount?: number;
  asset?: string;
  confidence: number;
  evidence?: string[];
  provenance?: number;
  status?: string;
  details?: Record<string, any>;
}

export interface FundEdge {
  id: string;
  source: string;
  target: string;
  type: FundEdgeType;
  amount?: number;
  asset?: string;
  timestamp: string;
  chain?: string;
  transactionHash?: string;
  provenanceWeight: number; // Proportional attribution fraction (0.0 to 1.0)
  confidence: number;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface FundGraphData {
  nodes: FundNode[];
  edges: FundEdge[];
  summary: {
    totalDonatedEth: number;
    totalTrackedEth: number;
    provenanceRatio: number;
    activeHops: number;
    discrepanciesCount: number;
  };
}

export interface CanonicalExpenditureIdentity {
  vendorTaxId: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO-8601 (YYYY-MM-DD)
  amount: string;
  currency: string;
  category: string;
  project?: string;
  location?: string;
  canonicalString: string;
  rawDocumentHash: string; // SHA-256 of original file bytes
  canonicalEvidenceHash: string; // Hash of normalized semantic JSON
}

export interface ExpenditureNullifier {
  nullifier: string; // 32-byte hex string
  domainSeparator: "BHL_EXPENDITURE_NULLIFIER_V1";
  canonicalIdentityHash: string;
  campaignId: number;
  allocationId?: string;
  timestamp: number;
  isRegistered: boolean;
  registeredTxHash?: string;
}

export interface ZKProofPublicInputs {
  evidenceCommitment: string;
  allocationId: string;
  categoryCommitment: string;
  maximumAuthorizedAmount: string;
  vendorCommitment: string;
  nullifier: string;
  campaignId: number;
}

export interface ZKExpenditureProof {
  proofId: string;
  publicInputs: ZKProofPublicInputs;
  proofBytes: string;
  verdict: "VERIFIED" | "REJECTED";
  constraintsVerified: {
    evidenceCommitmentValid: boolean;
    categoryAuthorized: boolean;
    amountWithinLimit: boolean;
    vendorAuthorized: boolean;
    nullifierValid: boolean;
    piiShieldZeroLeakage: boolean;
  };
  proverTimeMs: number;
  verifierTimeMs: number;
}

export interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string; // DID: did:bhl:...
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string; // DID
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
    signatureValue?: string;
  };
}

export interface CharityRegistryRecord {
  taxId: string;
  legalName: string;
  country: string;
  jurisdiction: string;
  registrySource: "IRS_990" | "UK_CHARITY_COMMISSION" | "INDIA_DARPAN_80G" | "IATI";
  registrationNumber: string;
  status: "ACTIVE" | "REVOKED" | "SUSPENDED" | "UNDER_REVIEW";
  fetchedAt: string;
  documentHash: string;
  confidenceScore: number;
  totalRevenueUsd: number;
  programExpenseRatio: number;
  adminExpenseRatio: number;
  executiveCompensationUsd: number;
  riskIndicators: string[];
  aliases: string[];
}

export interface EntityResolutionResult {
  queryTerm: string;
  matchedEntityId: string;
  matchedLegalName: string;
  confidence: number; // 0.00 to 1.00
  matchMethod: "EXACT_TAX_ID" | "EXACT_NAME" | "FUZZY_LEVENSHTEIN" | "ALIAS_DICTIONARY";
  registrySource: string;
  isVerified: boolean;
}

export interface DiscrepancyRuleResult {
  ruleId: string;
  domain: "CRYPTOGRAPHIC" | "FINANCIAL" | "CATEGORY" | "TEMPORAL" | "PROVENANCE" | "REPORTING";
  severity: "CRITICAL_FREEZE" | "WARNING_REVIEW" | "INFO";
  title: string;
  description: string;
  offendingEntity?: string;
  offendingNullifier?: string;
  expectedValue?: string | number;
  observedValue?: string | number;
  actionTaken: "AUTONOMOUS_FREEZE" | "AUDIT_FLAG" | "PASS";
  timestamp: string;
}

export interface AdversarialSimulationItem {
  id: string;
  receiptNumber: string;
  vendorName: string;
  taxId: string;
  amount: number;
  category: string;
  groundTruthType: "LEGITIMATE" | "FORGED" | "DUPLICATE" | "MODIFIED_DUPLICATE";
  detectedVerdict: "VERIFIED" | "FORGERY_DETECTED" | "DUPLICATE_NULLIFIER" | "CATEGORY_MISMATCH";
  elaScore: number;
  phashHammingDistance: number;
  bankSettlementMatched: boolean;
  nullifierCollision: boolean;
  escrowAction: "RELEASE" | "FREEZE" | "FLAG_REVIEW";
}

export interface AdversarialSimulationReport {
  totalExpenditures: number;
  legitimateCount: number;
  forgedCount: number;
  duplicateCount: number;
  modifiedDuplicateCount: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  duplicateDetectionRate: number;
  unsupportedEvidenceRate: number;
  averageProcessingTimeMs: number;
  escrowStatusFinal: "ACTIVE" | "FROZEN";
  items: AdversarialSimulationItem[];
}

/* ────────────────────────────────────────────────────────────
   Feature 1: Non-Cash Donations & Real-Time Inventory Tracking
──────────────────────────────────────────────────────────── */
export type ContributionType = "MONEY" | "GOODS" | "FOOD" | "MEDICAL" | "VOLUNTEER_SERVICE" | "OTHER";

export interface InventoryTracking {
  pledged: number;
  received: number;
  distributed: number;
  damaged: number;
  remaining: number;
}

export interface NonCashDonationDetails {
  itemName: string;
  quantity: number;
  unit: string;
  estimatedValue: number;
  estimatedValueCurrency: string;
  inventory: InventoryTracking;
  deliveryHub?: string;
  condition?: "NEW" | "SEALED_STERILE" | "CERTIFIED_FOOD_GRADE" | "REFURBISHED";
}

/* ────────────────────────────────────────────────────────────
   Feature 4: Voluntary Services (Time & Professional Skills)
──────────────────────────────────────────────────────────── */
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
  estimatedEconomicValueInr: number;
  estimatedEconomicValueUsd: number;
  hoursByCategory: Record<VolunteerCategory, number>;
  sessionsByCategory: Record<VolunteerCategory, number>;
  auditRule: string;
}

export interface DonationRecord {
  id: string;
  donor: string;
  donorFull?: string;
  amount: string;
  amountUsd?: number | string;
  amountInr?: number | string;
  rail: "CRYPTO" | "FIAT" | "UPI" | "IN_KIND_LOGISTICS" | "VOLUNTEER_SERVICE";
  token?: string;
  purpose: string;
  txHash: string;
  status: "LOCKED_IN_ESCROW" | "RELEASED" | "FROZEN" | "RECEIVED_IN_WAREHOUSE" | "LOGGED_IN_REGISTRY";
  timestamp: string;
  block?: number;
  utrNumber?: string | null;
  contributionType: ContributionType;
  itemName?: string | null;
  quantity?: number | null;
  unit?: string | null;
  estimatedValue?: number | null;
  inventory?: InventoryTracking | null;
  // Feature 4: Volunteer Service fields
  volunteerCategory?: VolunteerCategory | null;
  volunteerName?: string | null;
  volunteerRef?: string | null;
  hours?: number | null;
  sessions?: number | null;
  volunteerStatus?: VolunteerServiceStatus | null;
}

/* ────────────────────────────────────────────────────────────
   Feature 3: Bank Statement Freshness & Staleness Warnings
──────────────────────────────────────────────────────────── */
export type StatementStalenessLevel = "FRESH" | "EXPIRING_SOON" | "OVERDUE" | "CRITICAL";

export interface BankStatementFreshness {
  lastStatementUploadDate: string;
  reportingPeriod: string;
  daysElapsed: number;
  thresholdDays: number;
  isOverdue: boolean;
  stalenessLevel: StatementStalenessLevel;
  warningBadge: string;
  statementFilename?: string;
  statementHash?: string;
  bankName?: string;
  accountNumberMasked?: string;
  uploadedBy?: string;
  auditRule?: string;
}

