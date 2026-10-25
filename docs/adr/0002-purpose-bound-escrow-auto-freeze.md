# ADR-0002: Purpose-Bound Escrow & Autonomous On-Chain Circuit Breaker

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Smart Contracts & Blockchain Security
* **Affected Components:**
  * [`packages/contracts/PurposeBoundEscrow.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/PurposeBoundEscrow.sol)
  * [`apps/verifier-api/main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py#L20-L31)
  * [`apps/web/src/app/red-team/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/red-team/page.tsx#L41-L49)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Theme 4, Problem Statement 2 (The Black Hole Ledger) mandates that philanthropic funds must not disappear into untraceable NGO general accounts. Donors locking **50 ETH** require programmatic guarantees that:
1. Funds can **only** be released for the specified purpose (e.g., `"Water Infrastructure"`).
2. If off-chain forensic analysis detects invoice tampering, double-spending, or category mismatch, the smart contract must **autonomously freeze** remaining escrowed funds without waiting for slow human governance or committee votes.

---

## 2. Decision Drivers

* **Immutability of Earmark:** Programmatic enforcement that prevents capital reallocation.
* **Instant Circuit Breaking:** Sub-second autonomous freeze execution upon receipt of a valid cryptographic fraud proof.
* **Gas Efficiency:** Escrow tracking must remain lightweight on EVM networks.
* **Fail-Safe Default:** When fraud is flagged, remaining balances must remain locked in the contract until sovereign dispute resolution.

---

## 3. Considered Alternatives

### Alternative A: Multi-Sig Governance Committee (e.g. Gnosis Safe / Snapshot DAO)
* **Description:** A council of human auditors votes on each milestone release.
* **Pros:** Flexible human judgment.
* **Cons:** Highly vulnerable to bribery, collusion, and severe latency (hours or days to freeze funds, allowing adversarial NGOs to drain accounts before voting concludes).
* **Why rejected:** Violates the requirement for autonomous, algorithmic trust and sub-second fraud reaction.

### Alternative B: Standard Time-Locked Escrow (Vesting Vaults)
* **Description:** Linear or cliff-based token vesting released automatically on dates.
* **Pros:** Simple, battle-tested.
* **Cons:** Completely blind to whether off-chain water pumps were actually delivered or whether submitted receipts were forged.
* **Why rejected:** Lacks milestone verifiability and fraud circuit breaking.

### Alternative C: PurposeBoundEscrow with Cryptographic Fraud Oracle Proofs
* **Description:** Smart contract stores immutable campaign earmarks, tracks releases incrementally, and exposes an on-chain circuit breaker `isFrozen` triggered either by a verified forensic fraud proof or semantic nullifier collision.
* **Pros:** 100% deterministic, zero human committee delay, verifiable via emitted events (`EscrowAutoFrozen`).

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (`PurposeBoundEscrow.sol`).

### Implementation Specification

```solidity
struct Campaign {
    address donor;
    address ngo;
    string earmarkedPurpose;
    uint256 totalDeposited;
    uint256 totalReleased;
    bool isFrozen;
    string freezeReason;
}
```

* **Purpose Binding:** Registered in `createCampaign(address _ngo, string calldata _purpose) payable`.
* **Autonomous Freeze Invariants:**
  1. If `isNullifierUsed[_semanticNullifier] == true`: `isFrozen = true`, emits `EscrowAutoFrozen`.
  2. If `_forensicFraudDetected == true`: `isFrozen = true`, emits `EscrowAutoFrozen`.
* **State Mirroring:** Both the Next.js frontend and FastAPI backend maintain synchronized state mirrors of the contract's `isFrozen` status.

---

## 5. Consequences

### Positive Consequences
* Prevents adversarial capital extraction the instant a forged receipt or duplicate claim is detected.
* Provides full transparency to donors through event-driven indexing (`DonationLocked`, `ExpenditureVerified`, `EscrowAutoFrozen`).

### Negative Consequences & Mitigations
* **Risk of False-Positive Freezes:** If an off-chain verifier erroneously flags a valid receipt, the campaign freezes.
  * *Mitigation:* The contract records `freezeReason` and `offendingNullifier` on-chain, allowing targeted dispute resolution by the original donor.

---

## 6. Dependencies & Impact Analysis

* **Downstream Consumers:**
  * [ADR-0003](0003-deterministic-semantic-nullifier-registry.md): Supplies the unique nullifier check.
  * [ADR-0005](0005-error-level-analysis-forgery-detection.md): Supplies forensic fraud proof flags.
  * [ADR-0007](0007-chainlink-forex-skimming-detector.md): Supplies FX skimming discrepancy triggers.

---

## 7. Guidelines for Future Developers & AI Agents

If modifying or upgrading this contract:
1. [ ] Do **not** remove the `require(!c.isFrozen)` check from any fund release function.
2. [ ] Maintain compatibility with the event signatures (`EscrowAutoFrozen`, `ExpenditureVerified`).
3. [ ] If migrating to an Upgradeable Proxy (ERC-1967), ensure `isFrozen` remains stored in non-colliding storage slots.
