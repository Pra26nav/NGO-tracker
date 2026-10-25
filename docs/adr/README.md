# The Black Hole Ledger — Architecture Decision Records (ADR)

Welcome to the **Architecture Decision Record (ADR)** repository for **The Black Hole Ledger (CASCADE '26 — Theme 4, Problem Statement 2)**.

This directory maintains the immutable, version-controlled history of all significant architectural, cryptographic, security, financial, computer vision, and infrastructure decisions made across the project. It serves as the single source of truth for human engineers and autonomous AI agents refactoring, maintaining, or extending the codebase.

---

## 1. Master ADR Registry

| ADR ID | Title | Status | Date | Technical Domain | Primary Components Affected | Superseded By |
|---|---|---|---|---|---|---|
| [**ADR-0001**](0001-record-architecture-decisions.md) | Record Architecture Decisions (Governance & Protocol) | `Accepted` | 2026-10-25 | Governance | [`docs/adr/`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr) | — |
| [**ADR-0002**](0002-purpose-bound-escrow-auto-freeze.md) | Purpose-Bound Escrow & Autonomous Circuit Breaker | `Accepted` | 2026-10-25 | Smart Contracts | [`PurposeBoundEscrow.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/PurposeBoundEscrow.sol) | — |
| [**ADR-0003**](0003-deterministic-semantic-nullifier-registry.md) | Deterministic Semantic Nullifier Registry for Anti-Double Spending | `Accepted` | 2026-10-25 | Cryptography | [`NullifierRegistry.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/NullifierRegistry.sol), [`main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py) | — |
| [**ADR-0004**](0004-perceptual-hashing-image-cloning-detection.md) | Dual-Tier Perceptual Hashing (pHash) for Visual Deduping | `Accepted` | 2026-10-25 | Computer Vision | [`main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py), [`requirements.txt`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/requirements.txt) | — |
| [**ADR-0005**](0005-error-level-analysis-forgery-detection.md) | Error Level Analysis (ELA) & Compression Anomaly Forensics | `Accepted` | 2026-10-25 | Digital Forensics | [`main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py), [`red-team/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/red-team/page.tsx) | — |
| [**ADR-0006**](0006-five-stage-dag-multi-hop-settlement.md) | 5-Stage "Follow the Money" DAG Pipeline & Multi-Hop Settlement | `Accepted` | 2026-10-25 | DeFi & Protocols | [`flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py), [`flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx) | — |
| [**ADR-0007**](0007-chainlink-forex-skimming-detector.md) | Chainlink Oracles & Central Bank FX Skimming Discrepancy Detector | `Accepted` | 2026-10-25 | Oracles & Auditing | [`flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py), [`flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx) | — |
| [**ADR-0008**](0008-salted-merkle-trees-zk-beneficiary-privacy.md) | Salted Merkle Trees for ZK Selective-Disclosure Beneficiary Privacy | `Accepted` | 2026-10-25 | Privacy & ZK | [`flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py), [`flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx) | — |
| [**ADR-0009**](0009-offchain-ipfs-manifest-storage.md) | Off-Chain IPFS Content-Addressed Manifest Storage via Pinata | `Accepted` | 2026-10-25 | Storage & DA | [`flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py), IPFS Gateways | — |
| [**ADR-0010**](0010-zero-conflict-monorepo-route-isolation.md) | Zero-Conflict Monorepo Architecture with Route Isolation | `Accepted` | 2026-10-25 | Architecture | [`turbo.json`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/turbo.json), [`apps/`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps), [`packages/`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages) | — |
| [**ADR-0011**](0011-dual-mode-resilient-client-fallback.md) | Dual-Mode Architecture (Live FastAPI Sync with Offline Fallback) | `Accepted` | 2026-10-25 | Fault Tolerance | [`red-team/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/red-team/page.tsx), [`flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx) | — |
| [**ADR-0012**](0012-milestone-tranche-drip-and-emergency-freeze.md) | Milestone Tranche Drip-Release Workflow & Emergency Donor Killswitch | `Accepted` | 2026-10-25 | Smart Contracts & Governance | [`PurposeBoundEscrow.sol`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/contracts/PurposeBoundEscrow.sol), [`dashboard/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/dashboard/page.tsx) | — |

---

## 2. Architecture Decision Dependency Graph

The following Mermaid diagram illustrates how architectural decisions depend upon and reinforce one another:

```mermaid
graph TD
    subgraph Governance & Monorepo
        ADR01["ADR-0001: ADR Governance"] --> ADR10["ADR-0010: Zero-Conflict Monorepo"]
        ADR10 --> ADR11["ADR-0011: Dual-Mode Client Fallback"]
    end

    subgraph Feature #1: Red-Team & Forensic Auto-Freeze
        ADR02["ADR-0002: Purpose-Bound Escrow"] --> ADR03["ADR-0003: Semantic Nullifiers"]
        ADR03 --> ADR04["ADR-0004: DCT Perceptual Hashing"]
        ADR04 --> ADR05["ADR-0005: ELA Forgery Forensics"]
        ADR05 -->|Trigger Fraud Proof| ADR02
    end

    subgraph Feature #2: 5-Hop DAG, Skimming & ZK Privacy
        ADR02 --> ADR06["ADR-0006: 5-Stage DAG Pipeline"]
        ADR06 --> ADR07["ADR-0007: Chainlink & FX Skimming Detector"]
        ADR07 -->|Breach Triggers Freeze| ADR02
        ADR06 --> ADR08["ADR-0008: Salted Merkle ZK Shield"]
        ADR08 --> ADR09["ADR-0009: Off-Chain IPFS Storage"]
    end

    subgraph Feature #3: Tranche Drips, Donor Killswitch & Auditor Feed
        ADR02 --> ADR12["ADR-0012: Milestone Tranche Drips & Killswitch"]
        ADR12 -->|Emergency Override| ADR02
    end

        ADR02 --> ADR06["ADR-0006: 5-Stage DAG Pipeline"]
        ADR06 --> ADR07["ADR-0007: Chainlink & FX Skimming Detector"]
        ADR07 -->|Breach Triggers Freeze| ADR02
        ADR06 --> ADR08["ADR-0008: Salted Merkle ZK Shield"]
        ADR08 --> ADR09["ADR-0009: Off-Chain IPFS Storage"]
    end

    style ADR01 fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style ADR02 fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fff
    style ADR03 fill:#0c4a6e,stroke:#0284c7,stroke-width:2px,color:#fff
    style ADR05 fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fff
    style ADR06 fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#fff
    style ADR07 fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff
    style ADR08 fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff
    style ADR11 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
```

---

## 3. Technology Replacement Guidelines for Developers & AI Agents

If you are tasked with upgrading, swapping, or deprecating any core technology, consult this impact matrix before writing code:

| Technology Component | Current Choice | Affected ADR | Key Invariants to Preserve | Replacement Options |
|---|---|---|---|---|
| **Smart Contract Escrow** | Solidity 0.8.20 (`PurposeBoundEscrow.sol`) | [ADR-0002](0002-purpose-bound-escrow-auto-freeze.md) | `isFrozen` circuit breaker, immutable string earmark, event signatures | ERC-1967 Upgradeable Proxy, Vyper |
| **Receipt Deduping** | Canonical `keccak256` Nullifier | [ADR-0003](0003-deterministic-semantic-nullifier-registry.md) | Strict canonical string format: `TaxID \| InvNo \| Date \| Amount.00` | EIP-712 Structured Typed Hashes |
| **Visual Clone Detection** | 64-bit DCT `pHash` | [ADR-0004](0004-perceptual-hashing-image-cloning-detection.md) | Hamming distance threshold $\le 5$ = clone; <10ms CPU latency | OpenCV `img_hash`, Rust `image_hasher` |
| **Pixel Forgery Detection** | Error Level Analysis (Pillow + NumPy) | [ADR-0005](0005-error-level-analysis-forgery-detection.md) | Anomaly score threshold $> 15.0$ = freeze; Base64 heatmap output | Noiseprint, TruFor (GPU needed) |
| **Cross-Chain Bridge** | Across / Polygon State Portal | [ADR-0006](0006-five-stage-dag-multi-hop-settlement.md) | 64 L1 block finality proof, state root verification | LayerZero, Chainlink CCIP |
| **Price & Slippage Oracle** | Chainlink Aggregator v3 + RBI | [ADR-0007](0007-chainlink-forex-skimming-detector.md) | $1.00\%$ max slippage; zero-tolerance shadow wallet diversion | Pyth Network, Uniswap v3 TWAP |
| **Beneficiary Privacy** | Salted Binary Merkle Tree | [ADR-0008](0008-salted-merkle-trees-zk-beneficiary-privacy.md) | 0 bytes PII on-chain; 5 public leaves at indices $0..4$; per-leaf salt | Circom Groth16 zk-SNARKs |
| **Off-Chain Storage** | IPFS (Pinata CIDv1) | [ADR-0009](0009-offchain-ipfs-manifest-storage.md) | Content addressing (cryptographic immutability), AES-256 for PII | Arweave, Filecoin |
| **Monorepo Build** | Turborepo + pnpm workspaces | [ADR-0010](0010-zero-conflict-monorepo-route-isolation.md) | Vertical route isolation: `/red-team` and `/flow-tracer` strictly separate | Nx, Bazel |
| **Client Fault Tolerance** | Dual-Mode Live Sync + Fallback | [ADR-0011](0011-dual-mode-resilient-client-fallback.md) | UI must NEVER crash when port 8000 is down; clear status badge | ServiceWorker offline cache |

---

## 4. How to Author or Supersede an ADR

### Step 1: Duplicate the Template
Copy [`docs/adr/template.md`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr/template.md) to `docs/adr/NNNN-your-decision-title.md`. Use the next available 4-digit sequential integer.

### Step 2: Fill Out Mandatory Sections
* Document the **Context**, **Decision Drivers**, **Considered Alternatives** (at least 2 options with pros/cons), **Chosen Rationale**, **Technical Formulation**, and **Consequences**.
* Include clickable file paths using the `file:///` URI scheme.

### Step 3: If Superseding a Prior ADR
1. In the **new ADR**, specify: `Supersedes: [ADR-XXXX](XXXX-title.md)`.
2. In the **old ADR**, update the metadata header:
   * Change `Status: Accepted` to `Status: Superseded by [ADR-YYYY](YYYY-title.md)`.
   * Add `Superseded By: [ADR-YYYY](YYYY-title.md)`.
   * **Do not alter the historical body text of the old ADR.**
3. Update the **Master ADR Registry Table** in this `README.md`.
