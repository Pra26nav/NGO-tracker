# TRUST MODEL & EPISTEMIC BOUNDARIES
**Black Hole Ledger — Verifiable NGO Fund Flows**

---

## 1. The Core Epistemic Principle

> **"Blockchain proves transactions occurred on a virtual machine.  
> Cryptographic commitments prove a pre-image existed.  
> ZK proofs prove that private data satisfies mathematical constraints.  
> NEITHER independently proves that steel water pipes were physically installed in a rural village."**

Systems that claim *"blockchain automatically stops real-world NGO corruption"* are committing a dangerous category error. A corrupt organization can readily write a fraudulent claim to an immutable blockchain.

The Black Hole Ledger rejects cryptographic security theater. Instead, it enforces a **rigorous multi-layered trust model** that explicitly distinguishes between mathematical proof, on-chain state, third-party attestations, and external corroboration.

---

## 2. Six-Tier Evidence Classification

Every piece of data, state transition, and expenditure verification displayed to donors, auditors, or smart contracts is labeled with its explicit epistemic tier:

```text
┌──────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
│ Epistemic Tier               │ Definition & Criteria                                                       │
├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 1. CRYPTOGRAPHICALLY_VERIFIED│ Established purely by mathematical constraint satisfaction:                 │
│                              │ - ZK expenditure circuit passes without error.                              │
│                              │ - Merkle inclusion path hashes to the on-chain root.                        │
│                              │ - Semantic nullifier matches the financial facts with zero hash collisions. │
├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 2. ON_CHAIN_VERIFIED         │ Confirmed by decentralized consensus on Ethereum Sepolia or Base Sepolia:   │
│                              │ - Transaction receipt verified with >= 12 block depth.                       │
│                              │ - Smart contract events emitted and state variable (isFrozen) recorded.    │
├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 3. ATTESTED                  │ Cryptographically signed by an identified, authorized external entity:      │
│                              │ - W3C Verifiable Credential signed by a vetted equipment supplier.         │
│                              │ - Off-ramp fiat conversion statement signed by a licensed banking partner.  │
│                              │ - Field delivery report signed by an accredited third-party engineer.       │
├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 4. EXTERNALLY_CORROBORATED   │ Independent datasets corroborate the claim:                                 │
│                              │ - Bank UTR / NEFT reference matches vendor deposit amount.                 │
│                              │ - NGO tax ID matches active legal standing on NITI Aayog Darpan / IRS 990. │
│                              │ - Bridge slippage matches historical Chainlink gas oracle feeds.            │
├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 5. INFERRED                  │ Derived via statistical analysis, computer vision, or AI anomaly scoring:   │
│                              │ - Error Level Analysis (ELA) pixel compression anomaly score (0 - 100).     │
│                              │ - 64-bit DCT perceptual hash Hamming distance calculation.                  │
│                              │ - OpenGive executive compensation ratio anomaly heuristics.                 │
├──────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 6. UNVERIFIED                │ Self-reported claim by the NGO awaiting independent evidence corroboration. │
└──────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Autonomous Freezing vs. Human Review Boundaries

To prevent false positives from halting legitimate humanitarian aid, the system strictly divides enforcement actions:

### Tier A: Machine-Enforced Deterministic Freeze (`FROZEN`)
Smart contracts and automated watchtowers autonomously freeze escrow disbursements **only** upon deterministic cryptographic violations:
1. **Duplicate Semantic Nullifier:** The same receipt financial identity was already claimed in another donor campaign.
2. **Invalid ZK Proof:** Prover failed mathematical arithmetic constraint checks.
3. **Invalid Merkle Root:** Off-chain document commitment does not match the on-chain anchor.
4. **Direct Bridge Divergence:** Transferred cross-chain funds sent to an undeclared shadow address.

### Tier B: Human Auditor Review (`REVIEW_FLAGGED`)
Statistical or external anomalies do not silently freeze funds without notice; they generate high-priority audit alerts on the investigator dashboard:
1. High ELA pixel anomaly score on a low-resolution phone photograph of a handwritten receipt.
2. Moderate bridge slippage during periods of extreme mainnet gas spikes.
3. Minor discrepancies in fuzzy vendor name matching.
4. Newly filed NGO with limited historical IRS 990 filing track records.
