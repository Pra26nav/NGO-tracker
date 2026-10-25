# MIGRATION & REFACTORING PLAN
**Black Hole Ledger — Phased, Non-Destructive System Augmentation**
*Zero-Downtime Rollout Preserving Existing Working Functionality*

---

## 1. Guiding Migration Principles

1. **Do No Harm:** Never delete, break, or disable existing functional components (`/red-team`, `/flow-tracer`, `/dashboard`, `/pitch`, `PurposeBoundEscrow.sol`, `NullifierRegistry.sol`).
2. **Additive Evolution:** New research capabilities (OpenGive charity registry ingestion, CryptoChain Explorer proportional taint accounting, Aztec/Noir ZK expenditure circuits, Semaphore nullifiers, W3C Verifiable Credentials) are integrated as modular engines that enhance existing routes.
3. **Dual-Mode High Availability:** All new endpoints and client components must maintain the established dual-mode resilience (connecting to FastAPI when online, with instant graceful offline simulation fallback).
4. **Data Continuity:** The baseline 50 ETH Water Infrastructure Fund seed (`campaign-seed.json`) remains the canonical ground-truth baseline throughout the migration.

---

## 2. Phased Rollout Schedule

### Phase 1: Baseline Preservation & Documentation (Complete)
- Inspect existing codebase, monorepo topology, dependencies, ADRs, contracts, and frontend views.
- Resolve any pre-existing TypeScript compilation issues to ensure 100% clean typecheck.
- Author `docs/EXISTING_ARCHITECTURE.md`, `docs/TARGET_ARCHITECTURE.md`, `docs/INTEGRATION_MATRIX.md`, and `THIRD_PARTY_NOTICES.md`.
- Author in-depth research papers in `docs/research/` for all 13 reference projects and academic papers.

### Phase 2: Core Data Models & Shared Types (`packages/shared`)
- Extend `packages/shared/types.ts` without mutating existing interfaces:
  - Add `FundFlowEvent` canonical event model.
  - Add `FundNode` and `FundEdge` graph structures with proportional taint metrics.
  - Add `CanonicalExpenditureIdentity` and `ExpenditureNullifier` types.
  - Add `ZKExpenditureProof` and `ZKProofPublicInputs`.
  - Add W3C `VerifiableCredential` and `DIDDocument` types.
  - Add `CharityRegistryRecord` and `EntityResolutionResult`.
  - Add `DiscrepancyRuleResult` and `EscrowStateSnapshot`.

### Phase 3: Backend Engines Augmentation (`apps/verifier-api`)
- Keep `main.py`, `flow_tracer.py`, `escrow_dashboard.py`, `pitch_engine.py`, `donate_engine.py`, `history_engine.py`, `web3_verifier.py`.
- Add modular backend services and mount them clean under `/api/...`:
  1. `provenance_engine.py`: Proportional fund flow accounting ($ProvenanceRatio = Attributable / Total$), multichain graph reconstruction, swap/bridge/off-ramp tracking.
  2. `canonical_evidence.py`: Semantic normalization, dual-tier hashing (raw SHA-256 + canonical JSON), `BHL_EXPENDITURE_NULLIFIER_V1` derivation.
  3. `zk_verifier.py`: ZK expenditure verification engine proving vendor authorization, category compliance, max amount ceiling, and nullifier validity with 0 bytes PII leaked.
  4. `charity_intelligence.py`: OpenGive-style registry aggregator (IRS 990, UK Charity Commission, Indian Darpan/80G, IATI), fuzzy entity resolution with confidence scoring, and anomaly detection.
  5. `discrepancy_engine.py`: 6-domain discrepancy rule engine (Cryptographic, Financial, Category, Temporal, Provenance, Reporting) with deterministic freeze vs. review alerts.
  6. `watchers.py`: Multi-watcher architecture (`FundWatcher`, `ProofWatcher`, `NullifierWatcher`, `EscrowWatcher`, `DiscrepancyWatcher`, `BridgeWatcher`).
  7. `credentials_vc.py`: W3C VC 2.0 generation, signature validation, and revocation checks.
  8. `adversarial_simulation.py`: Monte Carlo 100-expenditure attack test runner (30 forged, 10 duplicated, 5 modified duplicates, 55 legitimate) measuring Precision, Recall, FPR, FNR, Duplicate Catch Rate.

### Phase 4: Smart Contract Enhancements (`packages/contracts`)
- Preserve `PurposeBoundEscrow.sol` and `NullifierRegistry.sol`.
- Add modular supporting contracts:
  - `EvidenceRegistry.sol`: On-chain anchor for dual-tier raw/canonical evidence commitments.
  - `AttestationRegistry.sol`: Registry for verified W3C credential hashes and authorized inspector DIDs.
  - `ZKVerifier.sol`: Pluggable verification contract verifying Groth16 / UltraPlonk expenditure proofs on-chain.

### Phase 5: Frontend Views & Visualization Augmentation (`apps/web`)
- Preserve all existing routes (`/red-team`, `/flow-tracer`, `/dashboard`, `/pitch`, `/donate`, `/reconciliation`).
- Add or enhance unified views:
  - Add an Interactive Fund Provenance & Evidence Graph visualizer on `/flow-tracer` and `/reconciliation`.
  - Add Charity Intelligence & Registry Inspector drawer on `/dashboard`.
  - Add 100-Run Adversarial Red-Team Monte Carlo runner on `/red-team` and `/pitch`.
  - Enhance `GlobalNavbar.tsx` and `ForensicAuditStream.tsx` to display real-time watcher consensus and proportional taint weights.

### Phase 6: Comprehensive Testing & Security Audit
- Unit tests for proportional accounting, canonicalization, nullifier collision, and ELA.
- Contract tests for escrow auto-freeze, double-spend blocking, and tranche disbursements.
- Adversarial simulation verification confirming detection rates for the 100-expenditure batch.
