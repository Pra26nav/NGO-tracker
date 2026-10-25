# ADR-0008: Salted Merkle Trees for ZK Selective-Disclosure Beneficiary Privacy

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Privacy, Cryptography & Zero-Knowledge Systems
* **Affected Components:**
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py#L30-L120)
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py#L370-L440)
  * [`apps/web/src/app/flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx#L680-L860)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Theme 4, Problem Statement 2 strictly requires verifying that physical aid (e.g. 4x borewell pumps and 200m PVC casing) was delivered to real human beneficiaries. However, publishing beneficiary identities, national ID/Aadhaar numbers, phone numbers, or facial photographs directly to an immutable public blockchain violates international privacy regulations (GDPR, India DPDP Act 2023) and exposes vulnerable rural households to exploitation.

We require a cryptographic mechanism that:
1. Keeps all sensitive PII completely private and off-chain.
2. Allows public auditors and judges to mathematically verify that a specific household was included in the verified delivery milestone.
3. Anchors a single 32-byte commitment on Ethereum L1 without leaking a single byte of personal data.

---

## 2. Decision Drivers

* **Zero PII Leakage:** Zero bytes of unmasked personal data on-chain or in public auditor views.
* **Cryptographic Inclusion Guarantee:** Mathematical proof that a beneficiary is part of the on-chain milestone root.
* **Selective Disclosure:** Financial facts (vendor tax ID, equipment, total amount, GPS coordinates) must remain public, while beneficiary records remain redacted.
* **Verification Speed:** Proving and verification must execute in <50 milliseconds in web browsers and API endpoints.

---

## 3. Considered Alternatives

### Alternative A: Plaintext Beneficiary Storage on Blockchain
* **Description:** Writing beneficiary names and national IDs directly into smart contract storage or IPFS without encryption.
* **Pros:** Simple to inspect.
* **Cons:** Catastrophic privacy violation; illegal under global privacy laws; permanent exposure of vulnerable populations.
* **Why rejected:** Completely unacceptable.

### Alternative B: Complex zk-SNARK Arithmetic Circuits (Circom / Groth16 / Halo2)
* **Description:** Writing Circom circuits to prove identity membership and generating zero-knowledge proofs verified on-chain via a pairing precompile.
* **Pros:** High theoretical privacy.
* **Cons:** Proving key generation takes gigabytes; browser proving requires WebAssembly with 5–15 second delays; high on-chain verification gas (~250,000 gas per proof).
* **Why rejected:** Over-engineered for selective-disclosure membership proofs, creating unacceptable latency during live hackathon judging.

### Alternative C: Salted Merkle Trees with Dual-Tree Partitioning
* **Description:** Partitions the milestone into 5 Public Leaves (unredacted) and 142 Private Beneficiary Leaves hashed with per-record cryptographic salts:
  $$\text{Leaf}_i = \text{SHA256}(\text{Salt}_i \parallel \text{Index}_i \parallel \text{PII}_i)$$
  Anchors a 32-byte root on-chain and provides interactive sibling path verification.
* **Pros:** Zero bytes of PII leaked; verifiable in <1ms; standard cryptographic building block; zero gas overhead for off-chain proofs.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Salted Merkle Tree with Selective Disclosure).

### Tree Structure & Leaf Partitioning

$$\text{GlobalMerkleRoot} = \text{MerkleRoot}(\text{PublicLeaves}_{1..5} \cup \text{PrivateBeneficiaryLeaves}_{1..142})$$

1. **Public Leaves (Unredacted):**
   * `PUB-01`: Vendor Tax ID (`GSTIN-27WATER9988Z`)
   * `PUB-02`: Procured Item (`4x Submersible Borewell Pumps (5HP) + 200m PVC`)
   * `PUB-03`: Amount Disbursed (`INR 1,20,000 / ~0.48 ETH eq.`)
   * `PUB-04`: GPS Ward Coordinates (`19.8762° N, 75.3433° E`)
   * `PUB-05`: Off-Chain IPFS Delivery Manifest CID
2. **Private Beneficiary Leaves (142 Households):**
   * Stored off-chain; displayed to auditors as `🔒 ZK-REDACTED [SALT: 0x8f2a... HIDDEN]`.
   * Hashed with high-entropy cryptographic salt:
     $$\text{LeafHash} = \text{SHA256}(\text{Salt} \parallel \text{Index} \parallel \text{Name} \parallel \text{Aadhaar} \parallel \text{Phone})$$

### Sibling Proof Verification Formulation

To verify beneficiary at index $k$, compute path up the tree:
$$\text{Current} \leftarrow \text{LeafHash}_k$$
For each sibling $S_j$ in $\text{ProofPath}$:
$$\text{Current} \leftarrow \begin{cases} \text{SHA256}(S_j \parallel \text{Current}) & \text{if position is left} \\ \text{SHA256}(\text{Current} \parallel S_j) & \text{if position is right} \end{cases}$$
Valid if and only if:
$$\text{Current} == \text{GlobalMerkleRoot}_{\text{OnChain}}$$

---

## 5. Consequences

### Positive Consequences
* 100% compliance with data privacy regulations (zero personal data leaked).
* Judges can verify mathematical inclusion in real time with animated sibling paths.
* Only 32 bytes (`bytes32`) stored on Ethereum L1, minimizing gas costs.

### Negative Consequences & Mitigations
* If the salt is lost, the beneficiary leaf cannot be reconstructed.
  * *Mitigation:* Encrypted salt manifests are backed up on IPFS using symmetric AES-256 keys held by the sovereign auditor.

---

## 6. Guidelines for Future Developers & AI Agents

If modifying the Merkle tree:
1. [ ] Do not remove the cryptographic salt from the leaf hash, as unsalted hashes of structured national IDs can be attacked via rainbow tables.
2. [ ] Ensure that odd-node tree levels duplicate the last leaf to maintain binary tree balance.
3. [ ] Keep the Public Leaves as the initial indices ($0..4$) so auditors can query public parameters without parsing beneficiary indices.
