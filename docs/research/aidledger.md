# Research Analysis: AidLedger
**Reference:** `https://github.com/latrael/aidledger`
**License:** MIT License

---

## 1. What the Project Does
AidLedger is a blockchain-based aid distribution and NGO management system built on the Solana blockchain using the Anchor framework. It provides:
- On-chain NGO registration and accreditation state.
- Donor contribution tracking into program-specific vaults.
- Impact milestone recording and direct disbursement logic.
- Rust program organization for account validation and authority constraints.

---

## 2. What We Learned
- **Explicit Account Constraints:** Anchor's strict account validation model (`#[account(has_one = authority, constraint = vault.balance >= amount)]`) illustrates the importance of defensive assertion checks at every stage of fund release.
- **On-Chain Impact Anchoring:** Associating specific impact metrics (e.g. "142 households supplied with water") directly with the release transaction creates an immutable auditable trail connecting donor dollars to verified human outcomes.

---

## 3. What Code & Architecture is Relevant
- State structure modeling for NGO accreditation (`ngo_address`, `registration_number`, `is_active`, `authorized_categories`).
- Purpose-bound account segregation ensuring money locked for Category A cannot be disbursed to Category B.

---

## 4. What We Adopted
- **Defensive State Constraints:** Embedded within `PurposeBoundEscrow.sol`, ensuring that tranche disbursements strictly verify that the escrow is not frozen, the tranche has not already been released, and the requested amount does not exceed the remaining balance.
- **Accreditation Checks:** Mirrored in `charity_intelligence.py` and `W3C Verifiable Credentials` for NGO validation.

---

## 5. What We Rejected & Why
- **Solana / Anchor Stack:** Rejected rewriting our existing EVM contracts into Solana Rust programs. Our existing architecture is optimized for Ethereum, Base Sepolia, and Polygon EVM chains with Hardhat/Foundry tooling.
- **Lump-Sum Disbursals:** AidLedger allowed single-step grant approvals; Black Hole Ledger strictly mandates incremental milestone tranche drip releases.

---

## 6. Security & Trust Concerns
- **Centralized Admin Keys:** In AidLedger, the platform owner could override program states. In Black Hole Ledger, the escrow circuit breaker is autonomous—once a duplicate nullifier is detected, freezing happens deterministically on-chain without admin intervention.
