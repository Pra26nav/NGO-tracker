# ADR-0003: Deterministic Semantic Nullifier Registry for Cross-Donor Anti-Double Spending

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Cryptography & Fraud Prevention
* **Affected Components:**
  * [`packages/contracts/NullifierRegistry.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/NullifierRegistry.sol)
  * [`packages/contracts/PurposeBoundEscrow.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/PurposeBoundEscrow.sol#L21-L25)
  * [`apps/verifier-api/main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py#L35-L43)
  * [`packages/shared/types.ts`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/shared/types.ts)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

A common attack vector in humanitarian aid and NGO grant financing is **Cross-Donor Double Counting**. An NGO receives a single legitimate physical invoice (e.g. for ₹45,000 worth of HDPE water storage tanks) and submits it to Donor Pool A. To claim the exact same expense from Donor Pool B, the NGO crops the scanned image by 2 pixels or alters its EXIF metadata.

Because standard cryptographic hashing (`SHA-256(FileBytes)`) is sensitive to even a single bit flip (the avalanche effect), the cropped receipt yields a completely different SHA-256 hash, bypassing traditional hash-deduplication checks.

---

## 2. Decision Drivers

* **Robustness against Image Mutation:** Cropping, re-encoding, or metadata modifications must not evade detection.
* **On-Chain Verifiability:** The identifier must be a fixed 32-byte hash computable on EVM smart contracts.
* **Cross-Donor Global Scope:** A receipt claimed in Campaign #1 must be permanently blocked from ever being claimed in Campaign #2, across all donor pools.
* **Deterministic Canonicalization:** Unambiguous canonical string serialization.

---

## 3. Considered Alternatives

### Alternative A: Raw File SHA-256 Hashing Only
* **Description:** Storing `sha256(image_bytes)` on-chain.
* **Pros:** Extremely fast and native.
* **Cons:** Trivial to bypass: cropping 1 pixel, converting PNG to JPEG, or changing timestamp alters the hash completely.
* **Why rejected:** Completely ineffective against adversarial receipt recycling.

### Alternative B: Full OCR Text Matching on Blockchain
* **Description:** Running Optical Character Recognition and comparing raw text strings on-chain.
* **Pros:** Matches exact text.
* **Cons:** Prohibitively expensive gas costs on EVM; OCR engines produce non-deterministic outputs across different versions and lighting conditions.
* **Why rejected:** Computationally infeasible on-chain.

### Alternative C: Canonical Semantic Nullifier (`keccak256(TaxID | InvoiceNo | Date | Amount)`)
* **Description:** Extracts the immutable financial facts of the transaction, canonicalizes them, and produces a deterministic 32-byte hash stored in an on-chain global registry.
* **Pros:** Completely immune to image manipulation, cropping, or format re-encoding; gas-efficient (single `bytes32` storage slot per invoice).

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Deterministic Semantic Nullifiers).

### Mathematical Specification

$$\text{CanonicalString} = \text{TrimUpper}(\text{VendorTaxID}) \parallel \text{"|"} \parallel \text{TrimUpper}(\text{InvoiceNo}) \parallel \text{"|"} \parallel \text{DateISO} \parallel \text{"|"} \parallel \text{CleanAmountTwoDecimals}$$

$$\text{SemanticNullifier} = \text{keccak256}(\text{CanonicalString})$$

### Smart Contract Integration

```solidity
mapping(bytes32 => uint256) public globalNullifierRegistry;
mapping(bytes32 => bool) public isNullifierUsed;

function registerNullifier(bytes32 _nullifier, uint256 _campaignId) external {
    require(!isNullifierUsed[_nullifier], "NULLIFIER_ALREADY_USED");
    isNullifierUsed[_nullifier] = true;
    globalNullifierRegistry[_nullifier] = _campaignId;
}
```

---

## 5. Consequences

### Positive Consequences
* Completely neutralizes receipt recycling across multiple donor campaigns.
* Prevents the "crop-by-2-pixels" attack demonstrated in Scenario 2 of the Red-Team Engine.

### Negative Consequences & Mitigations
* **Typo Sensitivity:** If an attacker deliberately alters the invoice number (e.g. `INV-8841` to `INV-8842`), the semantic nullifier changes.
  * *Mitigation:* Paired with **Perceptual Image Hashing (pHash)** ([ADR-0004](0004-perceptual-hashing-image-cloning-detection.md)) and **Error Level Analysis** ([ADR-0005](0005-error-level-analysis-forgery-detection.md)) to catch visual clones and doctored digits.

---

## 6. Guidelines for Future Developers & AI Agents

If modifying the nullifier calculation:
1. [ ] Maintain strict canonicalization formatting: uppercase Tax ID, ISO 8601 date (`YYYY-MM-DD`), and two decimal places for amounts (e.g. `45000.00`).
2. [ ] Do **not** alter the separator character (`"|"`) without issuing a migration ADR, as it will invalidate historical on-chain nullifiers.
3. [ ] Any new field added to the nullifier tuple must be evaluated for availability across global invoice standards (GST, VAT, EIN).
