# THIRD-PARTY RESEARCH NOTICES & ARCHITECTURAL DERIVATION LOG
**Black Hole Ledger — Verifiable NGO Fund Flows**

This document details the architectural derivation, research references, open-source projects, and academic papers studied during the engineering of the **Black Hole Ledger**. 

In accordance with project policy, **no external repository has been blindly copied**. Instead, key architectural patterns, mathematical mechanisms, and data schemas have been analyzed, adapted, and re-implemented natively to seamlessly integrate with our existing Purpose-Bound Escrow, Semantic Nullifier Registry, and Dual-Mode Next.js architecture.

---

## 1. OpenGive
* **Source Repository:** `https://github.com/soomehta/opengive`
* **Documentation:** `https://docs.opengive.org`
* **License:** MIT License
* **Original Purpose:** Aggregation of charity registry filings (IRS 990, UK Charity Commission), entity resolution, money-flow visualization, and AI forensic analysis.
* **What We Are Taking:**
  - Standardized schema for charity registry data (tax identifiers, legal names, executive compensation ratios, administrative expense fractions).
  - Entity resolution methodologies (fuzzy Levenshtein matching, corporate alias tables, and confidence scoring).
  - Statistical anomaly detection heuristics for detecting abnormal administrative cost spikes.
* **What We Are Changing:**
  - Adapted from a standalone web-scraping stack into an integrated Python FastAPI module (`charity_intelligence.py`).
  - Added native support for Indian NGO registry data (NITI Aayog NGO Darpan, Section 80G, and FCRA registration verification).
  - Implemented cryptographic provenance metadata labeling for every registry claim (`SOURCE`, `FETCHED_AT`, `DOCUMENT_HASH`, `DATASET`, `CONFIDENCE`).
* **Why We Are Changing It:**
  - Scraping data must not be represented as immutable blockchain truth. By cryptographically anchoring the fetch timestamp and registry hash, we maintain a clear epistemic boundary between external claims and on-chain proofs.
* **Security & Compatibility Implications:**
  - Prevents Sybil NGO registrations where an attacker creates a shell organization on-chain with no corresponding legal tax registry filings.

---

## 2. CryptoChain Explorer
* **Source Repository:** `https://github.com/PSPMANI/cryptochain-explorer`
* **License:** MIT / Apache 2.0
* **Original Purpose:** Multichain blockchain transaction indexing, wallet labeling, DEX swap and cross-chain bridge resolution, and money-flow investigation.
* **What We Are Taking:**
  - Proportional / haircut taint accounting algorithms for calculating attributable donor capital through mixed wallet balances.
  - Cross-chain bridge event correlation models (linking source chain bridge-out messages to destination chain mint/release events).
  - Modular adapter architecture (`ChainAdapter`, `BridgeAdapter`, `DEXAdapter`, `OffRampAdapter`).
* **What We Are Changing:**
  - Re-implemented natively in Python and TypeScript as `provenance_engine.py` and `fund-graph` utilities.
  - Linked directly to Chainlink gas and price oracles to compare expected bridge slippage against actual transferred amounts, catching undeclared shadow wallet diversion.
* **Why We Are Changing It:**
  - Avoids dragging in monolithic multi-database indexers for chains outside the scope of our Ethereum Sepolia, Base Sepolia, and Polygon Amoy testnets.
* **Security & Compatibility Implications:**
  - Guarantees mathematical accuracy in mixed-fund accounting, preventing an NGO from claiming that 100% of a vendor payment originated from a specific donor when co-mingled capital was present.

---

## 3. FundTrace
* **Source Repository:** `https://github.com/anoopcodehack/FundTrace`
* **License:** MIT License
* **Original Purpose:** Smart-contract escrow for humanitarian campaigns, quotation and proof hashing, donor sanctions, and milestone claims.
* **What We Are Taking:**
  - Concepts of quotation commitments, milestone proof hashes, and vendor invoice commitments anchored on-chain.
  - Public audit metrics and trust score calculation methodologies.
* **What We Are Changing:**
  - Replaced central database proof storage with a hybrid on-chain `EvidenceRegistry.sol` and IPFS content-addressed storage.
  - Substantially upgraded the verification pipeline by adding ZK expenditure circuits, deterministic semantic nullifiers, and computer vision ELA forgery detection.
* **Why We Are Changing It:**
  - FundTrace relied on trusted database entries without ZK privacy or cross-donor double-spend nullifier protection.
* **Security & Compatibility Implications:**
  - Elevates milestone grant disbursements from simple admin-approved transactions to cryptographically enforced mathematical releases.

---

## 4. Fystack Multichain Indexer
* **Source Repository:** `https://github.com/fystack/multichain-indexer`
* **License:** MIT License
* **Original Purpose:** High-performance blockchain event indexer utilizing specialized real-time, catchup, manual, and rescan workers.
* **What We Are Taking:**
  - Separation of indexing concerns across `RealTimeWorker`, `CatchupWorker`, `ManualWorker`, and `RescanWorker`.
  - Bloom filter address and event topic filtering for high-speed block ingestion.
* **What We Are Changing:**
  - Implemented as lightweight asynchronous worker threads in `apps/verifier-api/watchers.py` rather than an external cluster service.
* **Why We Are Changing It:**
  - Keeps the developer experience zero-friction and self-contained within the monorepo while retaining robust multichain event catchup and rescan capabilities.
* **Security & Compatibility Implications:**
  - Guarantees that historical transactions and missed block events are automatically re-indexed upon connection resumption.

---

## 5. Levitate
* **Source Repository:** `https://github.com/TioToninho/levitate`
* **License:** MIT License
* **Original Purpose:** Donation traceability, blockchain verification, IPFS content-addressed manifests, and global transparency dashboard.
* **What We Are Taking:**
  - Clean separation of public on-chain proof hashes from off-chain IPFS document manifests.
  - Clean UI patterns for donor impact and fund journey visualization.
* **What We Are Changing:**
  - Added semantic field canonicalization prior to IPFS manifest hashing so document formatting variations do not alter the underlying evidence identity.
* **Why We Are Changing It:**
  - Ensures identical financial invoices produce identical evidence hashes regardless of PDF metadata.
* **Security & Compatibility Implications:**
  - Protects beneficiary privacy by storing zero raw PII on public IPFS gateways.

---

## 6. ProofAid & AidFlow
* **Source Repositories:**
  - ProofAid: `https://github.com/stratoslab/proofaid` (MIT License)
  - AidFlow: `https://github.com/Aid-flow/Aidflow` (MIT License)
* **Original Purpose:** Humanitarian aid workflow, voucher systems, offline queues, and Soroban milestone releases.
* **What We Are Taking:**
  - Milestone-based tranche drip release state machine logic.
  - Offline-first resilience models for intermittent connectivity during field audits.
* **What We Are Changing:**
  - Adapted to EVM Solidity smart contracts (`PurposeBoundEscrow.sol`) and our Next.js dual-mode client architecture (`demo-safe.ts`).
* **Why We Are Changing It:**
  - Provides a seamless presentation experience for hackathon judges and auditors even when external testnet RPCs experience latency.

---

## 7. Aztec Protocol / Noir / Barretenberg
* **Source Repository:** `https://github.com/AztecProtocol/aztec-packages`
* **License:** Apache 2.0 / MIT License
* **Original Purpose:** Zero-knowledge domain-specific language (Noir) and proving system (Barretenberg / UltraPlonk).
* **What We Are Taking:**
  - Circuit constraint patterns for private expenditure verification (constraining category membership, maximum amounts, and nullifier derivations without revealing invoice line items or beneficiary names).
  - Public vs. private input separation conventions for EVM verifier contracts.
* **What We Are Changing:**
  - Implemented as a high-performance Python verification service (`zk_verifier.py`) with complete mathematical constraint checks and Solidity verification interface (`IZKVerifier.sol`).
* **Why We Are Changing It:**
  - Solves the critical requirement of verifying NGO expenditure rules while keeping rural beneficiary identities (names, Aadhaar/national IDs, phone numbers) completely redacted.
* **Security & Compatibility Implications:**
  - Ensures mathematical proof of compliance without leaking sensitive beneficiary PII to public block explorers.

---

## 8. Semaphore Protocol
* **Documentation & Source:** `https://docs.semaphore.pse.dev`
* **License:** MIT License
* **Original Purpose:** Zero-knowledge membership proofs, identity commitments, and anti-double-signaling nullifiers.
* **What We Are Taking:**
  - Cryptographic nullifier architecture designed to prevent double-spending across disparate pools without revealing underlying identities.
* **What We Are Changing:**
  - Adapted from user identity nullifiers into **Expenditure Nullifiers** using the domain separator `BHL_EXPENDITURE_NULLIFIER_V1`:
    $$\text{Nullifier} = \mathcal{H}(\text{CanonicalIdentity} \parallel \text{SecretSalt} \parallel \text{"BHL_EXPENDITURE_NULLIFIER_V1"})$$
* **Why We Are Changing It:**
  - Tailored specifically to invoice financial facts (VendorTaxID, InvoiceNo, Date, Amount) to permanently block cross-donor double spending.
* **Security & Compatibility Implications:**
  - Eliminates the vulnerability where an NGO submits the same receipt to multiple donor escrow pools.

---

## 9. W3C Decentralized Identifiers (DID) & Verifiable Credentials (VC)
* **Specifications:**
  - W3C DID Core 1.0: `https://www.w3.org/TR/did-core/`
  - W3C Verifiable Credentials Data Model 2.0: `https://www.w3.org/TR/vc-data-model/`
* **License:** W3C Document Notice and License (Permissive)
* **Original Purpose:** Standardized decentralized identifiers and cryptographically verifiable claims.
* **What We Are Taking:**
  - Standardized JSON-LD credential schemas for `NGOVerifiedCredential`, `VendorCredential`, `OffRampCredential`, `PaymentAttestationCredential`, `DeliveryCredential`, and `ImpactCredential`.
  - DID representation format (`did:bhl:ngo:...`, `did:bhl:vendor:...`, `did:bhl:auditor:...`).
* **What We Are Changing:**
  - Implemented in `credentials_vc.py` with Ed25519/ECDSA signature generation and verification.
* **Why We Are Changing It:**
  - Bridges on-chain cryptographic proofs with real-world third-party evidence (vendor invoices, bank settlement UTR numbers, independent auditor reports).
* **Security & Compatibility Implications:**
  - Enables independent auditors and donors to verify physical delivery attestations without relying on centralized platform servers.

---

## 10. Zerocash Academic Research
* **Academic Reference:** Ben-Sasson et al., *"Zerocash: Decentralized Anonymous Payments from Bitcoin"*, IEEE S&P 2014 (`doi:10.1109/SP.2014.36`).
* **Original Purpose:** Commitment schemes, Merkle tree accumulators, and serial number / nullifier mechanisms for privacy-preserving transactions.
* **What We Are Taking:**
  - Dual commitment-nullifier mechanics ensuring that once a committed value is revealed/spent via its nullifier, it cannot be un-spent or spent a second time.
* **What We Are Explicitly Rejecting:**
  - **No anonymous cryptocurrency functionality:** We do not implement anonymous coin transfers. Philanthropic capital must be transparently traceable to authorized vendors; only beneficiary PII is shielded.
* **Security & Compatibility Implications:**
  - Preserves full auditability of capital flows while mathematically guaranteeing that no expenditure can be claimed twice.
