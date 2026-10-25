# Research Analysis: W3C Decentralized Identifiers (DID Core 1.0)
**Reference:** `https://www.w3.org/TR/did-core/`
**Specification:** W3C Recommendation

---

## 1. What the Specification Does
W3C DID Core defines a globally unique, cryptographically verifiable identifier that does not depend on a centralized identity provider or certificate authority. A DID resolves to a **DID Document** containing:
- Cryptographic public keys for authentication and assertion.
- Service endpoints.
- Proof of control and delegation.

Example DID format:
```text
did:bhl:ngo:0x217e9C3182B0058b76D63E666C2c502b4e89991A
did:bhl:vendor:GSTIN27WATER9988Z
did:bhl:auditor:0x88fA91...b201
```

---

## 2. What We Learned
- **Decoupling Identity from Single Points of Failure:** If an NGO or vendor is identified only by an internal SQL database primary key (`id: 104`), cross-organization auditing is impossible. Standardized DIDs allow donors, auditors, banks, and tax authorities to reference the same entity unambiguously.
- **Verification Methods:** A DID document maps an entity to their authorized signing keys, allowing automated verification of digital signatures on invoices, off-ramp receipts, and delivery reports.

---

## 3. What Code & Architecture is Relevant
- DID syntax and parsing logic.
- DID document schemas containing `id`, `verificationMethod`, `authentication`, and `assertionMethod`.

---

## 4. What We Adopted
- **Standardized DID Method (`did:bhl`):** Implemented in `packages/shared/types.ts` and `apps/verifier-api/credentials_vc.py`.
- **Entity Roles Represented via DIDs:**
  - NGOs: `did:bhl:ngo:<address>`
  - Vendors: `did:bhl:vendor:<taxId>`
  - Off-Ramp Providers: `did:bhl:offramp:<bankingEntity>`
  - Independent Field Auditors: `did:bhl:auditor:<address>`

---

## 5. What We Rejected & Why
- **Heavy DID Resolution Overheads:** Rejected running a full universal DID registrar node (such as DIF Universal Resolver). Used lightweight deterministic resolution mapped to Ethereum addresses and verified tax registries.

---

## 6. Security & Trust Concerns
- **Key Compromise:** If an NGO's private signing key is stolen, the attacker can sign fake attestations. In Black Hole Ledger, DIDs are bound to smart contract permissions and multi-party quorum consensus (`DecentralizedQuorumPanel.tsx`), ensuring no single key can bypass autonomous escrow freezes.
