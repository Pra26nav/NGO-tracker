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
