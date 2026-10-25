# Research Analysis: FundTrace
**Reference:** `https://github.com/anoopcodehack/FundTrace`
**License:** MIT License

---

## 1. What the Project Does
FundTrace is a decentralized humanitarian aid tracking system providing:
- Smart-contract escrow for donor-funded campaigns.
- Quotation hashing and supplier proposal commitments.
- Invoice and receipt proof hashing stored in Supabase with on-chain Keccak-256 anchoring.
- Donor sanction and release voting mechanisms.
- Public audit reliability metrics and campaign trust scoring.

---

## 2. What We Learned
- **Quotation vs. Expenditure Binding:** Anchoring the vendor's initial quotation hash *before* funds are disbursed prevents an NGO from later substituting an inflated invoice from an unauthorized party.
- **Milestone Tranche Structures:** Direct single-lump-sum transfers to NGOs invariably lead to loss of accountability. Staged releases (e.g. 20/30/30/20) tied to verifiable evidence submissions represent the gold standard in grant governance.
- **Vulnerability of Simple Hash Matching:** FundTrace stored raw `sha256(receipt_file)` on-chain. This made it trivially vulnerable to receipt re-scanning or cropping by 2 pixels to produce a new hash.

---

## 3. What Code & Architecture is Relevant
- Smart contract escrow models linking campaigns to allocated amounts and verified releases.
- Milestone proof submission interfaces.
- Trust score calculations aggregating completed milestones, dispute counts, and verified expenditure ratios.

---

## 4. What We Adopted
- **Milestone Escrow Workflow:** Reflected in our `PurposeBoundEscrow.sol` contract with 4 standard milestones (Survey, Drilling, Solar Installation, Final Handover).
- **On-Chain Evidence Anchoring:** Formalized into `EvidenceRegistry.sol` for immutable timestamped proof commitments.
- **Trust Score Engine:** Integrated into `TrustScoreGauge.tsx` and `ledger-context.tsx`, dynamically calculating a 0–100 reliability score based on verified milestones, ELA scores, and quorum votes.

---

## 5. What We Substantially Upgraded
The Black Hole Ledger solves FundTrace's critical weaknesses by introducing:
1. **Cross-Donor Semantic Nullifiers:** `keccak256(VendorTaxID | InvoiceNo | Date | Amount)` stops receipt re-use across multiple donor pools permanently.
2. **Dual-Tier Perceptual Hashing (pHash):** 64-bit DCT pHash catches visual receipt clones even when cropped or re-encoded.
3. **Computer Vision ELA Forgery Forensics:** Catches doctored totals and altered line items.
4. **Zero-Knowledge Beneficiary Shield:** Protects rural beneficiary PII using salted Merkle trees instead of leaking names on public databases.
5. **Autonomous Circuit Breaker:** Escrow auto-freezes upon verified cryptographic duplicate detection without waiting for slow human committee voting.

---

## 6. Security & Trust Concerns
- FundTrace assumed that if an admin approved an invoice hash, the physical expenditure was legitimate. In reality, collusive admins can approve fake invoices. We mitigate this through multi-watcher verification and independent bank settlement corroboration.
