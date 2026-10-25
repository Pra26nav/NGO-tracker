# EXISTING ARCHITECTURE AUDIT & BASELINE SPECIFICATION
**Black Hole Ledger — Verifiable NGO Fund Flows**
*Audit Date: October 2026 | Baseline Assessment for Augmentation & Research Integration*

---

## 1. Executive Summary & Repository Topology

The **Black Hole Ledger** is an existing, functional monorepo designed for Theme 4, Problem Statement 2 (Cascade '26): *Cryptographic verification of NGO fund flows, purpose-bound escrow locking, off-chain receipt de-duplication, and autonomous circuit breaking*.

The repository is organized as a zero-conflict monorepo using **pnpm workspaces** and **Turborepo**:

```text
black-hole-ledger/
├── apps/
│   ├── verifier-api/         # Python FastAPI Forensic & Cryptographic API (port 8000)
│   │   ├── main.py           # Core FastAPI app, Semantic Nullifiers, DCT pHash & ELA Heatmap engine
│   │   ├── flow_tracer.py    # 5-Stage DAG Multi-Hop Pipeline, FX Skimming Detector & 142-Leaf Merkle Tree
│   │   ├── escrow_dashboard.py # Purpose-Bound Locker & Milestone Tranche Drip-Release Engine
│   │   ├── pitch_engine.py   # 1-Click Presentation Runner & Live Security Audit Terminal
│   │   ├── donate_engine.py  # Dual-Rail (Fiat UPI + Web3 Crypto) Donation Ingestion
│   │   ├── history_engine.py # Searchable Forensic Audit Ledger & Event Query Engine
│   │   ├── web3_verifier.py  # Web3.py RPC client for Base Sepolia & Sepolia transaction receipts
│   │   └── requirements.txt  # FastAPI, Uvicorn, Pillow, ImageHash, NumPy, Pydantic, Web3
│   │
│   └── web/                  # Next.js 14 App Router + Tailwind CSS Frontend (port 3000)
│       ├── src/app/
│       │   ├── page.tsx          # Master Landing & System Overview
│       │   ├── red-team/         # Feature #1: Red-Team Stress-Test & Escrow Auto-Freeze Command Center
│       │   ├── flow-tracer/      # Feature #2: 5-Stage "Follow the Money" DAG Visualizer & ZK Auditor
│       │   ├── dashboard/        # Feature #3: Milestone Tranche Drip Portal & Earmark Manager
│       │   ├── pitch/            # Feature #4: 1-Click Judge Presentation Runner & Live Terminal
│       │   ├── donate/           # Dual-Rail Donation Portal (Crypto + Fiat UPI QR generator)
│       │   └── reconciliation/   # Real-time On-Chain vs. Off-Chain PDF Receipt Reconciliation
│       ├── src/components/
│       │   ├── ConnectWalletButton.tsx      # Web3 / RainbowKit wallet connection
│       │   ├── DecentralizedQuorumPanel.tsx # Multi-validator consensus & emergency freeze widget
│       │   ├── ForensicAuditStream.tsx      # Live terminal log stream with human translation
│       │   ├── GlobalNavbar.tsx             # Unified navigation bar
│       │   ├── LiveSyncBanner.tsx           # Real-time FastAPI connectivity indicator
│       │   ├── TrustScoreGauge.tsx          # Real-time 0-100 cryptographic trust gauge
│       │   └── ZKProofInspector.tsx         # Interactive Merkle path & ZK proof verifier
│       └── src/context/
│           ├── ledger-context.tsx           # Unified global state & offline fallback provider
│           └── web3-provider.tsx            # Wagmi & Viem Web3 provider (Base Sepolia + Sepolia)
│
├── packages/
│   ├── contracts/            # Smart Contracts Workspace
│   │   ├── PurposeBoundEscrow.sol # Solidity 0.8.20 purpose-bound escrow & tranche release
│   │   ├── NullifierRegistry.sol  # Global cross-donor semantic nullifier registry
│   │   ├── hardhat.config.js      # Hardhat config for Base Sepolia, Polygon Amoy & Sepolia
│   │   ├── foundry.toml           # Foundry profile & RPC endpoints
│   │   └── scripts/deploy.js      # Automated deployment & ABI export script
│   │
│   └── shared/               # Shared Workspace Assets
│       ├── types.ts          # Core TypeScript interfaces (MerkleLeaf, ForensicScanResult, etc.)
│       └── campaign-seed.json # Baseline 50 ETH Water Infrastructure Fund dataset
│
└── docs/
    └── adr/                  # 13 Architecture Decision Records (ADR-0001 through ADR-0013)
```

---

## 2. Detailed Subsystem Audit

### 2.1 Smart Contracts (`packages/contracts`)
1. **`PurposeBoundEscrow.sol`**:
   - **Solidity Version:** `^0.8.20`.
   - **Core State:** Manages `Campaign` structs (`donor`, `ngo`, `earmarkedPurpose`, `totalDeposited`, `totalReleased`, `isFrozen`, `freezeReason`, `currentTrancheIndex`).
   - **Tranche Release Schedule:** 4 milestones (20% Mobilization, 30% Material & Drilling, 30% Solar Pump & Storage, 20% Commissioning & Audit).
   - **Anti-Double Spending:** Global nullifier registry (`mapping(bytes32 => uint256)` and `mapping(bytes32 => bool) isNullifierUsed`).
   - **Circuit Breaker:** `EscrowAutoFrozen` event emitted and state set to `isFrozen = true` if a duplicate nullifier is presented or fraud is flagged.
   - **Emergency Override:** `emergencyFreeze` callable by donor/oracle; `unfreezeEscrow` restricted to the original donor.
2. **`NullifierRegistry.sol`**:
   - Independent standalone global nullifier registry storing first-claim campaign ID, submitter address, and timestamp.
   - `computeNullifier` pure function implementing `keccak256(abi.encodePacked(taxId, invoiceNo, dateStr, amountWei))`.

### 2.2 Forensic & Verification Engine (`apps/verifier-api`)
1. **Semantic Nullifiers (`main.py`):**
   - Canonical string format: `VENDOR_TAX_ID|INVOICE_NO|DATE|AMOUNT.00`.
   - Generates SHA-256 / Keccak-256 hash. Ensures that identical financial claims share identical nullifiers regardless of scan format.
2. **Visual Clone Detection (Perceptual Hashing):**
   - 64-bit Discrete Cosine Transform (DCT) perceptual hashing via `imagehash.phash`.
   - Computes Hamming distance. Distance $\le 5$ identifies cropped, rescanned, or re-compressed image clones.
3. **Pixel Forgery Detection (Error Level Analysis):**
   - Resaves image at 85% JPEG quality, computes pixel difference (`ImageChops.difference`), normalizes extrema, and computes 99.2 percentile compression anomaly score.
   - Generates Base64 PNG heatmap showing doctored areas.
4. **Selective-Disclosure Merkle Tree (`flow_tracer.py`):**
   - 142 private beneficiary records (masked name, masked Aadhaar, masked phone, salt, leaf hash).
   - 5 public leaves (Vendor Tax ID, Hardware Items, Tranche 1 amount, GPS Ward, IPFS Manifest CID).
   - Generates binary Merkle proofs without leaking beneficiary PII on-chain.
5. **FX & Bridge Skimming Detector (`flow_tracer.py`):**
   - Simulates 5 DAG hops:
     - Hop 1: L1 Escrow deposit (50 ETH)
     - Hop 2: Uniswap v3 AMM Swap (ETH -> USDC)
     - Hop 3: L1-to-L2 Bridge (Across / Arbitrum) with Chainlink gas oracle comparison. Flags 14.8% slippage skimming diverted to an undeclared offshore shadow wallet (`0x9b31...6318`).
     - Hop 4: L2 Off-ramp to Fiat INR banking rail via licensed settlement partner.
     - Hop 5: Vendor milestone disbursement & ZK Merkle proof verification.
6. **Web3 RPC Client (`web3_verifier.py`):**
   - Live querying of Base Sepolia (`https://sepolia.base.org`) and Sepolia testnet nodes.
   - Verifies block depth, gas usage, contract events, and provides deterministic fallback.

### 2.3 Frontend Application (`apps/web`)
1. **Next.js 14 App Router:** Built with Tailwind CSS, Framer Motion, and Lucide React.
2. **Key Views:**
   - `/red-team`: Feature #1 Red-Team Stress-Test & Autonomous Escrow Auto-Freeze Command Center.
   - `/flow-tracer`: Feature #2 5-Stage "Follow the Money" DAG Visualizer, FX Skimming Detector & ZK Beneficiary Auditor.
   - `/dashboard`: Feature #3 Purpose-Bound Donation Locker & Milestone Tranche Drip-Release Portal.
   - `/pitch`: Feature #4 1-Click Judge Presentation Runner, Live Security Terminal & Q&A Cheatsheet.
   - `/donate`: Dual-rail fiat UPI QR code and crypto donation locker with Web3 wallet connection.
   - `/reconciliation`: On-chain vs. off-chain PDF receipt audit ledger.
3. **Resilient Dual-Mode Client Architecture:**
   - Connects live to FastAPI on `http://localhost:8000`.
   - Automatically falls back to high-fidelity client-side simulation when the API is offline (`demo-safe.ts`), preventing UI crashes.

---

## 3. Existing Codebase Classification Matrix

Per Section 3 of the master prompt, every major component has been audited and classified:

| Subsystem / File | Classification | Rationale & Status |
|---|---|---|
| `PurposeBoundEscrow.sol` | **KEEP & IMPROVE** | Keep core tranche release, immutable earmark, and auto-freeze logic. Improve by separating allocation tracking and modularizing verifier interfaces. |
| `NullifierRegistry.sol` | **KEEP & IMPROVE** | Keep deterministic nullifier storage and double-spend detection. Improve by standardizing domain separator (`BHL_EXPENDITURE_NULLIFIER_V1`) and secret salt support. |
| `main.py` (Forensic Engine) | **KEEP & IMPROVE** | Keep ELA compression analysis, pHash, and API endpoints. Improve by extracting modular services for provenance, evidence, and discrepancy evaluation. |
| `flow_tracer.py` (DAG Engine) | **KEEP & IMPROVE** | Keep 5-hop DAG structure and shadow wallet detection. Improve by generalizing into a full multi-chain graph with proportional/haircut accounting. |
| `escrow_dashboard.py` | **KEEP** | Completely functional tranche release and donor killswitch API. |
| `web3_verifier.py` | **KEEP & IMPROVE** | Keep Base Sepolia / Sepolia receipt checking. Improve with multi-chain worker indexing adapters. |
| `types.ts` (`packages/shared`) | **IMPROVE & EXTEND** | Keep existing interfaces; add `FundFlowEvent`, `FundNode`, `FundEdge`, `CanonicalExpenditureIdentity`, `VerifiableCredential`, and `DiscrepancyRule` definitions. |
| Evidence Storage | **IMPROVE & EXTEND** | Currently uses synthetic IPFS CID manifest. Extend with deterministic semantic field canonicalization, raw/canonical dual hashing, and selective disclosure. |
| Zero-Knowledge Verification | **IMPROVE & EXTEND** | Currently uses Salted Merkle Tree inclusion proofs. Extend with full ZK circuit verification interface (vendor, category, max amount, nullifier constraints). |
| Multi-Chain Ingestion | **ADD** | Add modular ChainAdapter, BridgeAdapter, DEXAdapter, and OffRampAdapter based on CryptoChain Explorer & Fystack patterns. |
| External Charity Intelligence | **ADD** | Add NGO registry aggregation, 990/Darpan intelligence, and entity resolution based on OpenGive patterns. |
| Watcher Network | **ADD** | Add decentralized independent watcher architecture (FundWatcher, ProofWatcher, NullifierWatcher, EscrowWatcher, DiscrepancyWatcher). |
| Adversarial Red-Team Suite | **IMPROVE & EXTEND** | Current suite tests 3 scenarios (Valid Milestone, Crop Double Spend, 30% Forgery). Extend with 100-expenditure Monte Carlo simulation measuring Precision, Recall, FPR, FNR. |

---

## 4. Key Strengths to Preserve
1. **Zero-Friction Monorepo:** Completely clean build and typecheck with zero errors.
2. **Visual Polish:** Glassmorphism UI, Framer Motion animations, interactive gauges, and live streaming audit terminals.
3. **Resilient Dual-Mode:** UI never crashes when backend services or nodes are offline.
4. **Concrete Problem Mapping:** Earmarked 50 ETH for Water Infrastructure directly solves Theme 4, Problem Statement 2.
