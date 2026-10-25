# ADR-0009: Off-Chain IPFS Content-Addressed Manifest Storage

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Decentralized Storage & Data Availability
* **Affected Components:**
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py#L80-L90)
  * [`apps/web/src/app/flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx#L70-L80)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Each verified milestone generates large unstructured artifacts:
* High-resolution camera scans of vendor invoices (`INV-2026-9001`).
* Geotagged physical installation photographs (borewell casing pipes, pump telemetry).
* AES-256 encrypted beneficiary delivery manifests containing 142 household biometric timestamps.

Storing multiple megabytes of raw image and document data directly in Ethereum smart contract storage or transaction calldata is economically impossible (costing hundreds of dollars per receipt in gas). Conversely, storing files on a traditional centralized server invites tampering and link rot.

---

## 2. Decision Drivers

* **Immutability:** Once an evidence package is generated, it must be impossible for an NGO to silently swap out photos or receipts.
* **Content Addressing:** Files must be uniquely identified by their cryptographic hash rather than a mutable URL path.
* **Cost Efficiency:** Off-chain storage must cost fractions of a cent while anchoring a fixed 32-byte or string identifier on-chain.
* **Decentralized Availability:** Must support distributed peer-to-peer retrieval via public gateways.

---

## 3. Considered Alternatives

### Alternative A: Centralized Cloud Object Storage (Amazon S3 / Google Cloud Storage)
* **Description:** Storing receipts in an S3 bucket (`s3://ngo-receipts/inv-9001.jpg`).
* **Pros:** Fast uploads, cheap.
* **Cons:** The bucket administrator can overwrite files without changing the URL; S3 accounts can be closed, leading to broken 404 links; lacks cryptographic proof of immutability.
* **Why rejected:** Vulnerable to silent evidence tampering.

### Alternative B: On-Chain Raw Calldata / EIP-4844 Blobs
* **Description:** Uploading image bytes into transaction calldata or temporary rollup data blobs.
* **Pros:** Native on-chain availability.
* **Cons:** Calldata is permanently expensive; blobs are purged after 18 days (EIP-4844), losing historical audit trails.
* **Why rejected:** Infeasible for permanent 5-year philanthropic audit compliance.

### Alternative C: InterPlanetary File System (IPFS) via Pinata Pinning
* **Description:** Files are stored in IPFS and pinned across distributed nodes via Pinata. Each manifest is addressed by its unique Content Identifier (CIDv1: `bafybei...`).
* **Pros:** Content addressing guarantees that modifying a single pixel alters the CID; permanent data availability; verifiable across public gateways.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (IPFS Content Addressing).

### Specification

* **Manifest CID Format:** Base32 CIDv1 (`bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`).
* **On-Chain Anchor:** Pinned as Public Leaf #5 (`PUB-05`) in the milestone Merkle tree and emitted in smart contract milestone events.
* **Gateway Fallbacks:** Supported through `https://gateway.pinata.cloud/ipfs/{cid}` and `https://ipfs.io/ipfs/{cid}`.
* **Encryption Layer:** Manifests containing sensitive beneficiary metadata are symmetrically encrypted (AES-256-GCM) prior to IPFS publication, ensuring that even if IPFS content is globally readable, PII remains sealed.

---

## 5. Consequences

### Positive Consequences
* Complete proof that off-chain files have not been modified since on-chain submission.
* Eliminates heavy storage costs on Ethereum L1.

### Negative Consequences & Mitigations
* IPFS files that are unpinned can be garbage-collected by the network.
  * *Mitigation:* Pinning is redundantly handled via Pinata and mirrored across local client nodes.

---

## 6. Guidelines for Future Developers & AI Agents

If changing storage providers (e.g. migrating to Arweave or Filecoin):
1. [ ] Ensure the storage model remains strictly content-addressed (hash-based).
2. [ ] Never upload unencrypted PII manifests to public IPFS gateways; verify AES-256-GCM encryption before pinning.
