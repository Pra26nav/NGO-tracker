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
  earmark: string;
  frozen_reason: string | null;
  last_tx_hash: string;
}
