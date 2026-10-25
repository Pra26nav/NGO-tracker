# TARGET ARCHITECTURE SPECIFICATION
**Black Hole Ledger — Verifiable NGO Fund Flows**
*Architectural Blueprint for Augmentation, Research Integration & Mathematical Verifiability*

---

## 1. The Core System Invariant

The Black Hole Ledger is engineered to guarantee a singular, non-negotiable invariant across all donor capital movements:

```text
DONATION
    ↓
PURPOSE BOUND
    ↓
ALLOCATION
    ↓
FUND PROVENANCE
    ↓
SWAP / BRIDGE / OFF-RAMP
    ↓
FIAT FLOW
    ↓
EXPENDITURE
    ↓
PRIVATE EVIDENCE
    ↓
COMMITMENT
    ↓
ATTESTATION
    ↓
ZK VERIFICATION
    ↓
NULLIFIER
    ↓
UNIQUE CLAIM
    │
    ├── VALID → RELEASE / ACCOUNT
    │
    └── DUPLICATE / INVALID → REJECT / FREEZE
    ↓
IMPACT EVIDENCE
```

---

## 2. Logical Target Architecture Layers

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRESENTATION LAYER                                   │
│  Donor View  │  NGO Campaign View  │  Auditor & Forensic View  │  Public Transparency  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                 VERIFICATION API LAYER                                 │
│     Campaigns & Allocations  │  Evidence Ingestion  │  Attestations  │  Disputes       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                 FUND PROVENANCE ENGINE                                 │
│   Canonical Fund Graph (Nodes & Edges)  │  Proportional / Haircut Taint Accounting     │
│   Cross-Chain Bridges  │  DEX Swaps  │  Off-Ramp Tracking  │  Shadow Wallet Detection  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│ BLOCKCHAIN LAYER │               │   FIAT RAILS     │               │ EVIDENCE STORAGE │
│ Adapters: EVM,   │               │ Banking APIs,    │               │ IPFS / Pinata,   │
│ Polygon, Base,   │               │ Central Bank FX, │               │ Encrypted Blob,  │
│ Arbitrum, Solana │               │ UPI / NEFT Rails │               │ Selective Merkle │
└────────┬─────────┘               └────────┬─────────┘               └────────┬─────────┘
         │                                  │                                  │
         └──────────────────────────────────┼──────────────────────────────────┘
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │    CANONICAL EVIDENCE & ATTESTATIONS     │
                       │ Raw vs Canonical Hash · W3C Credentials  │
                       └────────────────────┬─────────────────────┘
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │        ZK EXPENDITURE VERIFIER           │
                       │ Proof Constraints: Vendor, Category,     │
                       │ Max Amount, Nullifier derivation         │
                       └────────────────────┬─────────────────────┘
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │             NULLIFIER ENGINE             │
                       │ Domain: BHL_EXPENDITURE_NULLIFIER_V1     │
                       │ Cross-Pool Anti-Double Spending Registry │
                       └────────────────────┬─────────────────────┘
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │           DISCREPANCY ENGINE             │
                       │ 6 Domain Rules: Crypto, Financial,       │
                       │ Category, Temporal, Provenance, Report   │
                       └────────────────────┬─────────────────────┘
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │          ESCROW STATE MACHINE            │
                       │ 13-State Lifecycle · Autonomous Circuit  │
                       │ Breaker · Multi-Validator Watchers       │
                       └──────────────────────────────────────────┘
```

---

## 3. Subsystem Specifications

### 3.1 Fund Provenance Graph & Proportional Accounting
To prevent naive address matching from misattributing co-mingled capital, the system implements **Proportional / Haircut Taint Accounting**:

$$\text{ProvenanceRatio}(t) = \frac{\text{DonationAttributableValue}(t)}{\text{TotalAvailableBalance}(t)}$$

When an NGO wallet spends an amount $S$ from a mixed wallet containing both donor funds and general donations:
$$\text{AttributableSpent} = S \times \text{ProvenanceRatio}(t)$$

#### Canonical Graph Elements
- **Node Types:** `DONATION`, `WALLET`, `TOKEN`, `TRANSACTION`, `SWAP`, `BRIDGE`, `CHAIN`, `EXCHANGE`, `OFF_RAMP`, `FIAT_ACCOUNT`, `VENDOR`, `EXPENDITURE`, `EVIDENCE`, `ALLOCATION`, `CAMPAIGN`, `MILESTONE`, `IMPACT`, `ATTESTATION`.
- **Edge Types:** `FUNDED`, `TRANSFERRED`, `SWAPPED`, `BRIDGED`, `DEPOSITED`, `WITHDRAWN`, `CONVERTED`, `PAID`, `ALLOCATED`, `SUPPORTED_BY`, `ATTESTED_BY`, `CLAIMED_AS`, `DUPLICATES`.

Every node and edge carries: `id`, `type`, `source`, `timestamp`, `chain`, `transactionHash`, `amount`, `asset`, `confidence`, `evidenceRefs`, and `provenanceWeight`.

### 3.2 Document Canonicalization & Semantic Identity
Receipts and invoices undergo a two-tier hashing process:
1. **Raw Document Hash:** `SHA-256(RawBytes)` to detect exact binary matches and file integrity.
2. **Canonical Evidence Hash:** Semantic field extraction followed by deterministic normalization:
   - Trim and uppercase Vendor Tax ID (`GSTIN` / `EIN` / `VAT`).
   - Normalize Invoice Number (strip dashes/spaces).
   - Normalize Date to ISO-8601 (`YYYY-MM-DD`).
   - Normalize Amount to two decimal places in standard currency units.
   - Deterministic canonical string:
     $$\text{CanonicalIdentity} = \text{TaxID} \parallel \text{"|"} \parallel \text{InvoiceNo} \parallel \text{"|"} \parallel \text{DateISO} \parallel \text{"|"} \parallel \text{Amount}$$

### 3.3 Semantic Nullifier Derivation
To prevent cross-donor double spending without revealing sensitive receipt details publicly, the nullifier is derived using a cryptographic domain separator:

$$\text{Nullifier} = \mathcal{H}(\text{CanonicalIdentity} \parallel \text{SecretSalt} \parallel \text{"BHL_EXPENDITURE_NULLIFIER_V1"})$$

On-chain smart contracts query the global `NullifierRegistry` before approving any tranche release. If the nullifier already exists, the escrow halts immediately with an `EscrowAutoFrozen` event.

### 3.4 Zero-Knowledge Expenditure Verification Subsystem
The ZK proof verifies expenditure compliance without leaking private vendor trade secrets or rural beneficiary identities:

- **Private Inputs:**
  - Raw Invoice Document
  - Vendor Legal Identity & Tax ID
  - Line-item description
  - Beneficiary PII records (names, Aadhaar / national IDs, phone numbers)
  - Blinding Secret & Salt
- **Public Inputs:**
  - `evidenceCommitment` (Merkle Root of invoice + salted beneficiary tree)
  - `allocationId`
  - `categoryCommitment` (Hash of allowed earmark, e.g., "Water Infrastructure")
  - `maximumAuthorizedAmount`
  - `vendorCommitment`
  - `nullifier`
  - `campaignId`

The circuit proves:
1. $\text{Poseidon}(\text{invoice}) = \text{evidenceCommitment}$
2. $\text{InvoiceCategory} \in \text{AuthorizedCategories}$
3. $\text{Amount} \le \text{MaximumAuthorizedAmount}$
4. $\text{Nullifier}$ is correctly derived from the canonical identity and private salt.
5. 0 bytes of sensitive beneficiary PII are exposed to public observers.

### 3.5 External Charity Intelligence (OpenGive Patterns)
The NGO intelligence layer queries normalized external registries:
- **United States:** IRS Form 990 / ProPublica API
- **United Kingdom:** UK Charity Commission / 360Giving
- **India:** Darpan Portal / Section 80G / FCRA registry
- **Global:** IATI (International Aid Transparency Initiative), UN OCHA FTS

Features computed:
- Entity Resolution with fuzzy string matching, alias dictionary, and confidence scores (0.00 – 1.00).
- Anomaly scoring based on executive compensation ratios, administrative overhead spikes, and historical filing gaps.
- Registry provenance labeling: `SOURCE`, `FETCHED_AT`, `DOCUMENT_HASH`, `DATASET`, `CONFIDENCE`.

### 3.6 Multi-Chain Indexing & Watcher Network
Based on Fystack patterns, the indexer operates 4 specialized workers:
1. **RealTimeWorker:** Listens to WebSocket head logs on Base Sepolia, Polygon Amoy, and Ethereum Sepolia.
2. **CatchupWorker:** Scans historical blocks with batch requests and Bloom filter address matching.
3. **ManualWorker:** Allows on-demand verification of user-submitted transaction hashes.
4. **RescanWorker:** Recomputes taint and provenance graphs upon dispute initiation.

#### Watcher Network
Independent micro-watchers continuously monitor for inconsistent states:
- `FundWatcher`: Monitors balance discrepancies and unauthorized transfers.
- `ProofWatcher`: Validates cryptographic proofs and Merkle inclusion paths.
- `NullifierWatcher`: Detects duplicate nullifier claims across multiple donor pools.
- `EscrowWatcher`: Enforces smart contract circuit breakers upon verified fraud events.
- `DiscrepancyWatcher`: Flags temporal anomalies, category mismatches, and budget overruns.
- `BridgeWatcher`: Compares on-chain bridge slippage against Chainlink gas/price oracles to catch shadow skimming.

### 3.7 Escrow State Machine
The 13-state deterministic escrow lifecycle:
```text
[CREATED] ──► [VERIFIED] ──► [FUNDED] ──► [ALLOCATED]
                                                │
    ┌───────────────────────────────────────────┘
    ▼
[AWAITING_EVIDENCE] ──► [EVIDENCE_SUBMITTED] ──► [ZK_VERIFIED]
                                                        │
    ┌───────────────────────────────────────────────────┘
    ▼
[ATTESTATION_VERIFIED] ──► [RELEASE_ELIGIBLE] ──► [RELEASED]
       │                          │
       ▼                          ▼
  [DISPUTED] ───────────────► [FROZEN] ──(Donor Settlement)──► [RESOLVED]
```

### 3.8 W3C Verifiable Credentials
Signed attestations using W3C VC 2.0 standards:
- `NGOVerifiedCredential`: Government accreditation and tax-exempt validation.
- `VendorCredential`: Registered vendor identity and authorized category badge.
- `OffRampCredential`: Regulated banking/crypto off-ramp conversion confirmation.
- `PaymentAttestationCredential`: Direct bank NEFT/UPI settlement confirmation with UTR reference.
- `DeliveryCredential`: Independent third-party field delivery confirmation with GPS ward stamp.
- `ImpactCredential`: Beneficiary cluster outcome attestation.

---

## 4. Epistemic Limitation & Trust Model
A fundamental principle of the Black Hole Ledger:

> **A ZK proof establishes only that the prover possesses private data satisfying mathematical constraints. It does NOT independently prove physical-world reality.**

To prevent deceptive security theater, every claim is labeled with its explicit epistemic tier:
1. `CRYPTOGRAPHICALLY_VERIFIED`: Math holds (ZK proof, Merkle root, Keccak nullifier).
2. `ATTESTED`: Signed by an authorized external third party (W3C VC, bank UTR, vendor signature).
3. `ON_CHAIN_VERIFIED`: Confirmed by consensus nodes (Base Sepolia / Sepolia receipt).
4. `EXTERNALLY_CORROBORATED`: Cross-referenced with independent datasets (Darpan, IRS 990, Chainlink).
5. `INFERRED`: Derived via algorithmic heuristics or AI anomaly detection.
6. `UNVERIFIED`: Self-reported claim awaiting corroborating evidence.
