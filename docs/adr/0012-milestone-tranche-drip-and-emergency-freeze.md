# ADR-0012: Milestone Tranche Drip-Release Workflow & Emergency Donor Killswitch

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Smart Contracts, Donor Governance & Fund Streaming
* **Affected Components:**
  * [`packages/contracts/PurposeBoundEscrow.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/PurposeBoundEscrow.sol)
  * [`apps/verifier-api/escrow_dashboard.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/escrow_dashboard.py)
  * [`apps/web/src/app/dashboard/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/dashboard/page.tsx)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Historically, donors and aid agencies grant **100% of capital upfront** to non-governmental organizations. Once funds leave the donor's custody, there is zero financial leverage to ensure that the NGO actually completes later project phases or delivers quality hardware. If corruption, ghost vendors, or receipt forgeries occur, the donor's entire capital allocation is already lost in the "black hole".

We require a disbursement mechanism that:
1. Partitions a **50 ETH** allocation into structured milestones (e.g. 20% mobilization, 40% midway construction, 40% final testing & handover).
2. Drips capital to the vendor only when off-chain cryptographic proofs (semantic nullifiers and Merkle inclusion roots) are verified.
3. Provides an immediate, one-click emergency killswitch (`emergencyFreeze()`) accessible to donors and automated watchtower sentinels that halts all subsequent tranche releases the instant an anomaly is detected.
4. Exposes an immutable, real-time public transparency activity feed.

---

## 2. Decision Drivers

* **Phased Capital Exposure:** The NGO only holds the minimum working capital necessary for the current phase.
* **Cryptographically Conditioned Drips:** Tranche $N+1$ cannot be unlocked without a validated semantic nullifier and Merkle root from Tranche $N$.
* **Sub-Second Emergency Intervention:** Donors and automated watchdog bots must be able to halt the contract on-chain without human committee consensus.
* **Public Visibility:** Every lock, tranche drip, and freeze event must be emitted on-chain and streamed to a real-time citizen auditor feed.

---

## 3. Considered Alternatives

### Alternative A: 100% Upfront Capital Grant (Status Quo)
* **Description:** Transferring the entire 50 ETH into the NGO's multi-sig or bank account on day one.
* **Pros:** Low operational friction.
* **Cons:** Total loss of donor recourse; creates the core "black hole" problem.
* **Why rejected:** Fundamentally incompatible with verifiable fund flow requirements.

### Alternative B: Continuous Linear Streaming (e.g. Sablier / Superfluid)
* **Description:** Capital streams continuously every second ($X$ wei per second) over a 6-month period.
* **Pros:** Smooth capital distribution.
* **Cons:** Money streams continuously even if the NGO halts construction or walks away from the job site; streaming has no concept of discrete physical deliverables (e.g., 4x borewell pumps).
* **Why rejected:** Humanitarian capital requires milestone delivery proofs, not arbitrary time progression.

### Alternative C: Milestone Tranche Drip Engine with Emergency Donor Killswitch
* **Description:** Smart contract partitions balance into 20% / 30% / 30% / 20% tranches (10 / 15 / 15 / 10 ETH basis). Each tranche requires an on-chain `releaseNextTranche()` call referencing a verified expenditure nullifier and Merkle root. Donors possess an `emergencyFreeze()` killswitch with a dedicated unfreeze dispute mechanism.
* **Pros:** Optimal alignment of financial incentives; protects 80% of capital at inception; zero-latency emergency freeze; transparent audit stream.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Milestone Tranche Drip Engine).

### Smart Contract Tranche Schema

```solidity
struct Tranche {
    uint256 trancheId;
    string name;
    uint256 percentage;
    uint256 amount;
    bool isReleased;
    bytes32 verifiedNullifier;
    bytes32 verifiedMerkleRoot;
    uint256 releasedAt;
}
```

### Milestone Schedule

| Tranche | Phase Name | Percentage | Amount (50 ETH Basis) | Verification Prerequisite |
|---|---|---|---|---|
| **Tranche 1** | Mobilization & Hydrogeological Survey | 20% | 10.0 ETH ($32,000) | Contractor agreement & hydro-geological survey |
| **Tranche 2** | Heavy Material Sourcing & Borewell Drilling | 30% | 15.0 ETH ($48,000) | Vendor invoice (`INV-2026-9001`), GSTIN check, ELA < 15.0 |
| **Tranche 3** | Solar Pump & 5,000L Storage Installation | 30% | 15.0 ETH ($48,000) | Verified solar microgrid, filtration & storage install |
| **Tranche 4** | Commissioning, Fluoride Audit & Handover | 20% | 10.0 ETH ($32,000) | 142 ZK-salted beneficiary signatures & fluoride reduction purity test |

### Emergency Freeze & Unfreeze Protocol

1. **Invocation:** Donor or watchtower calls `emergencyFreeze(campaignId, reason)`.
2. **On-Chain Reaction:** Contract sets `isFrozen = true`, emits `EscrowEmergencyFrozen`, and permanently blocks `releaseNextTranche()`.
3. **Dispute Resolution:** Original donor address (`c.donor`) can call `unfreezeEscrow(campaignId)` after independent verification.

---

## 5. Consequences

### Positive Consequences
* At any point prior to final completion, at least 40% to 80% of donor capital remains strictly protected from extraction.
* The public transparency feed empowers ordinary citizens and journalists to track aid delivery in real time.

### Negative Consequences & Mitigations
* If an NGO completes work but the donor maliciously freezes the contract, vendor payments could be delayed.
  * *Mitigation:* In future iterations, an arbitration appeal period can be added via Kleros or decentralized dispute oracles.

---

## 6. Guidelines for Future Developers & AI Agents

If adjusting tranche parameters:
1. [ ] Ensure that $\sum_{i} \text{percentage}_i \equiv 100\%$.
2. [ ] The `releaseNextTranche()` method must always check `require(!c.isFrozen)` before executing state updates or transfers.
3. [ ] Every tranche release must emit both `TrancheDripped` and `ExpenditureVerified` events to preserve indexer synchronization.
