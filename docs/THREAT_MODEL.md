# ADVERSARIAL THREAT MODEL
**Black Hole Ledger — Verifiable NGO Fund Flows**

---

## 1. Adversary Definition & Goals

The primary adversary in the Black Hole Ledger ecosystem is an **Adversarial Non-Governmental Organization (NGO)** or collusive insider group seeking to:
1. **Double-Spend / Double-Count Receipts:** Claim a single real-world expenditure across multiple distinct donor pools.
2. **Fabricate Forged Invoices:** Submit computer-generated or digitally altered receipts (e.g. 30% forged invoices with doctored totals or altered line items) without corresponding real-world goods delivery.
3. **Divert Philanthropic Capital (Bridge & FX Skimming):** Skim funds during cross-chain bridging or fiat off-ramping into undeclared offshore shadow wallets while claiming high network slippage.
4. **Misallocate Purpose-Bound Funds:** Spend donor capital earmarked for `"Water Infrastructure"` on unauthorized luxuries, administrative perks, or unapproved projects.
5. **Sybil Attacks & Shell Entities:** Register shell vendors or fake third-party auditors to sign fraudulent delivery attestations.

---

## 2. Attack Vectors & Defensive Countermeasures

```text
┌─────────────────────────────────┬───────────────────────────────────┬──────────────────────────────────────────────┐
│ Attack Vector                   │ Adversary Tactic                  │ Black Hole Ledger Defensive Mechanism        │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────────┤
│ 1. Cross-Donor Double Spend     │ Crops receipt image by 2 pixels   │ Deterministic Semantic Nullifier             │
│    (Hash Mutation Attack)       │ or alters EXIF metadata to defeat │ keccak256(TaxID | InvNo | Date | Amount)     │
│                                 │ naive SHA-256 deduplication.      │ + 64-bit DCT pHash (Hamming Distance <= 5).  │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────────┤
│ 2. 30% Forged Receipt Batch     │ Doctors PDF totals using image    │ Error Level Analysis (ELA) pixel compression │
│    (Compression Anomaly Attack) │ editing software; resaves file    │ anomaly detection (Score > 15.0) + cross-    │
│                                 │ with altered numbers.             │ verification with bank settlement UTR rails. │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────────┤
│ 3. Bridge Slippage Skimming     │ Claims 15.2% cross-chain bridge   │ Dual-oracle verification comparing reported  │
│    (Shadow Wallet Diversion)    │ slippage; secretly diverts 14.8%  │ bridge fees to Chainlink L1/L2 gas feeds;    │
│                                 │ to offshore shadow wallet.        │ autonomous circuit breaker trips.            │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────────┤
│ 4. Category Earmark Violation   │ Submits banquet catering receipts │ Zero-Knowledge Category Compliance Circuit:   │
│    (Misallocation Attack)       │ for a "Water Infrastructure" pool.│ assert(category_id == expected_category).    │
│                                 │                                   │ Smart contract rejects proof & freezes fund. │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────────┤
│ 5. Beneficiary Identity Theft   │ Harvests vulnerable rural villager│ Salted Merkle Tree ZK Beneficiary Shield:    │
│    (PII Surveillance Attack)    │ names, Aadhaar IDs, and phones.   │ 0 bytes of beneficiary PII committed on-     │
│                                 │                                   │ chain; only 32-byte salted root is stored.   │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────────────────────────┤
│ 6. Sybil Vendor Attestation     │ Sets up fake shell vendor to      │ External Charity Intelligence (OpenGive):    │
│    (Ghost Supplier Attack)      │ issue fraudulent delivery VCs.    │ Queries IRS 990, Darpan, and tax registries; │
│                                 │                                   │ flags newly formed or unverified tax IDs.    │
└─────────────────────────────────┴───────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 3. The 30% Forged + Double-Counted Simulation Matrix

To empirically validate our defenses against adversarial attacks, the system includes a **100-Expenditure Monte Carlo Simulation Test Suite**:

- **Total Invoices Evaluated:** 100
- **Composition:**
  - **55 Legitimate Invoices:** Authentic suppliers, verified GSTIN/EIN, bank UTR settlement confirmed, low ELA score ($< 5.0$), unique nullifiers.
  - **30 Forged Invoices (30% Attack):** Tampered amounts, high ELA compression anomaly score ($> 30.0$), unauthorized banquet catering or electronics categories, zero matching bank settlements.
  - **10 Exact / Cropped Duplicate Invoices:** Cropped by 2–5 pixels from previously claimed receipts in Donor Pool A. Caught via DCT pHash ($Hamming \le 5$) and Keccak-256 semantic nullifier collisions.
  - **5 Modified Duplicates:** Same vendor and invoice number with slightly modified date or whitespace. Caught via semantic field canonicalization.

### Required Forensic Metrics:
$$\text{Precision} = \frac{TP}{TP + FP} \ge 98.0\%$$
$$\text{Recall} = \frac{TP}{TP + FN} \ge 97.0\%$$
$$\text{False Positive Rate (FPR)} \le 2.0\%$$
$$\text{Duplicate Detection Rate} = 100.0\%$$
$$\text{Autonomous Freeze Latency} < 350\text{ ms}$$
