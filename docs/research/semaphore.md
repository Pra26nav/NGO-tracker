# Research Analysis: Semaphore Protocol
**Reference:** `https://docs.semaphore.pse.dev` | `https://github.com/semaphore-protocol/semaphore`
**License:** MIT License

---

## 1. What the Project Does
Semaphore is a zero-knowledge protocol designed by Privacy & Scaling Explorations (PSE) that allows users to:
- Prove their membership in a group (using Merkle tree inclusion proofs).
- Cast a signal (vote, endorsement, claim) anonymously.
- Guarantee that no member can signal more than once per external context (using cryptographic **Nullifiers**).

---

## 2. What We Learned
- **The Nullifier Mechanism:** A nullifier is a pseudorandom value deterministically derived from:
  $$\text{Nullifier} = \mathcal{H}(\text{IdentitySecret} \parallel \text{Scope / ExternalNullifier})$$
  Because the identity secret is private, an observer cannot tell *who* created the nullifier. But because the hashing function is deterministic, submitting the same claim twice in the same scope produces the exact same nullifier.
- **Permanent Double-Spending Protection:** A smart contract only needs to maintain a single bit per nullifier:
  $$\text{mapping}(\text{bytes32} \implies \text{bool}) \text{ public isNullifierSpent;}$$
  If `isNullifierSpent[nullifier]` is true, the claim is rejected as a duplicate.

---

## 3. What Code & Architecture is Relevant
- Nullifier derivation architecture.
- Group Merkle tree state management.
- Double-signaling prevention patterns in smart contracts.

---

## 4. What We Adopted
- **Semantic Expenditure Nullifiers:** Adapted Semaphore's identity nullifier into an **Expenditure Nullifier**:
  $$\text{Nullifier} = \mathcal{H}(\text{CanonicalInvoiceFacts} \parallel \text{SecretSalt} \parallel \text{"BHL_EXPENDITURE_NULLIFIER_V1"})$$
- **On-Chain Nullifier Registry (`NullifierRegistry.sol`):** Implemented a global cross-campaign registry that permanently blocks an invoice from ever being claimed in more than one donor pool.
- **Autonomous Freeze Circuit Breaker:** When `registerNullifier` encounters an existing record, it emits a `DoubleSpendAttempt` event and commands the calling escrow contract to immediately freeze remaining funds.

---

## 5. What We Rejected & Why
- **Anonymous Signer Grouping:** In Semaphore, users hide their identity among a crowd of group members. In Black Hole Ledger, the NGO and authorized vendors are known entities (`W3C DIDs`); we use the nullifier specifically to anonymize sensitive line-item vendor details while strictly enforcing expenditure uniqueness.

---

## 6. Security & Trust Concerns
- **Domain Separation:** If two different systems use the same nullifier formula without a domain separator, a nullifier used in System A could collide with or leak information in System B. We mitigate this by enforcing the immutable domain string `BHL_EXPENDITURE_NULLIFIER_V1`.
