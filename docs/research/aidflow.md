# Research Analysis: AidFlow
**Reference:** `https://github.com/Aid-flow/Aidflow`
**License:** MIT License

---

## 1. What the Project Does
AidFlow is a humanitarian aid tracking and distribution platform built on the Stellar network using Soroban smart contracts. It implements:
- Beneficiary identity registration and verification.
- Purpose-bound capital allocation across humanitarian campaigns.
- Milestone-based fund release schedules.
- Immutable audit trails tracking transactions from donor deposit to final field dispersal.

---

## 2. What We Learned
- **Strict Separation of Allocation vs. Disbursement:** AidFlow clearly separates the allocation phase (earmarking funds for specific budget line items) from the actual release phase (disbursing funds upon verified proof). This prevents premature capital transfers.
- **Audit Event Logging:** Emitting comprehensive, indexed events for every state transition allows external watchtowers and block explorers to construct an unbroken timeline of capital flow.

---

## 3. What Code & Architecture is Relevant
- Milestone state progression models.
- Purpose earmark string serialization and hash commitment verification.
- Event emission design for external indexers.

---

## 4. What We Adopted
- **Comprehensive Audit Events:** Reflected in our `PurposeBoundEscrow.sol` contract (`DonationLocked`, `TrancheDripped`, `ExpenditureVerified`, `EscrowAutoFrozen`, `EscrowEmergencyFrozen`, `EscrowUnfrozen`).
- **Milestone Tranche Workflow:** Tranche release rules requiring explicit verification of semantic nullifiers and Merkle roots before release.

---

## 5. What We Rejected & Why
- **Stellar / Soroban Architecture:** Our target deployment networks are EVM-compatible layer-1 and layer-2 networks (Ethereum Sepolia, Base Sepolia, Polygon Amoy), where smart contract developer tooling, liquidity bridges, and Wagmi/Viem frontend libraries are established.

---

## 6. Security & Trust Concerns
- **Milestone Manipulation:** In AidFlow, milestone verification was largely manual. In Black Hole Ledger, milestone verification is algorithmic and multi-faceted, requiring zero nullifier collisions, low ELA pixel tampering scores, and valid ZK inclusion proofs.
