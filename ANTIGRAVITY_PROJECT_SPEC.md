# THE BLACK HOLE LEDGER: VERIFIABLE NGO FUND FLOWS (CASCADE '26 - Theme 4, PS 2)
## Antigravity Agent Build & Execution Specification

### 1. Mission Overview
You are building **Feature #1 (The Judge-Winning WOW Feature)**: **The Adversarial Red-Team Stress-Test & Autonomous Escrow Auto-Freeze Engine** inside a zero-conflict monorepo (`black-hole-ledger`).

This system directly solves all core requirements of **Theme 4, Problem 2 (The Black Hole Ledger)**:
1. **Purpose-Bound Allocation:** 50 ETH locked in `PurposeBoundEscrow.sol` earmarked for `"Water Infrastructure"`.
2. **Verifiable Off-Chain Expenditure & Anti-Double Counting:** Links outgoing on-chain transactions to off-chain receipts using deterministic **Semantic Nullifiers** (`keccak256(VendorTaxID | InvoiceNo | Date | Amount)`) and **Perceptual Image Hashing (`pHash` Hamming Distance)** so an NGO cannot crop a receipt by 2 pixels to reuse it across multiple donor pools.
3. **30% Forged Receipt Detection:** Runs **Error Level Analysis (ELA)** pixel-compression anomaly detection + Semantic Category verification to catch doctored totals and off-category spending.
4. **Zero-PII Beneficiary Shield:** Redacts sensitive beneficiary details off-chain and commits only a **Selective-Disclosure Merkle Root** on-chain.
5. **Autonomous Escrow Freeze:** Automatically halts and locks the smart contract escrow (`FROZEN`) without relying on a centralized auditor when fraud or double-counting is proven.

---

### 2. Zero-Conflict Monorepo Architecture
- `apps/web` — Next.js 14 App Router + Tailwind CSS frontend
  - `http://localhost:3000/red-team` — Feature #1: Red-Team Stress-Test & Escrow Auto-Freeze
  - `http://localhost:3000/flow-tracer` — Feature #2: 5-Stage "Follow the Money" DAG Visualizer & ZK Auditor
  - `http://localhost:3000/dashboard` — Feature #3: Purpose-Bound Donation Locker & Milestone Tranche Drip Portal
  - `http://localhost:3000/pitch` — Feature #4: 1-Click Judge Presentation Runner, Live Terminal & Stress-Test Simulator
- `apps/verifier-api` — Python FastAPI Forensic, Cryptographic & Flow-Tracer Engine (`http://localhost:8000`)
  - `main.py` — Forensic Nullifier & ELA API
  - `flow_tracer.py` — 5-Hop DAG, FX Skimming Detector & ZK Merkle Inclusion API
  - `escrow_dashboard.py` — Milestone Tranche Drip & Emergency Freeze API
  - `pitch_engine.py` — 1-Click Scenario Runner, Live Forensic Terminal & Pitch Q&A API
- `packages/contracts` — Solidity Smart Contracts (`PurposeBoundEscrow.sol` & `NullifierRegistry.sol`)
- `packages/shared` — Locked TypeScript interfaces (`types.ts`) shared across workspaces
- `docs/adr` — Version-controlled Architecture Decision Records (`ADR-0001` through `ADR-0012`)



---

### 3. Step-by-Step Instructions for Antigravity Agent
When asked to initialize and run this project, execute the following steps:

#### Step A: Start the Python Forensic Verifier API (`apps/verifier-api`)
```bash
cd apps/verifier-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Step B: Start the Next.js Red-Team Command Center (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```

#### Step C: Verify the 4 Interactive Demo Flows at `http://localhost:3000/red-team`
1. **Scenario 1 (Valid Milestone Proof):** Confirms clean invoice (`INV-2026-9001`), low ELA score, unique Nullifier, and keeps Escrow `ACTIVE`.
2. **Scenario 2 (Cross-Donor Double Spend Attack):** Simulates an NGO cropping an already-claimed receipt (`INV-2026-8841` from Donor Pool A) by 2 pixels to mutate its `SHA-256` hash. The engine catches it via `pHash` (Hamming distance = 2) and Semantic Nullifier collision, immediately flipping the Escrow to `FROZEN`.
3. **Scenario 3 (30% Forged Receipt Batch Attack):** Simulates a batch upload of 10 receipts where 3 (30%) are forged (high ELA pixel tampering score > 35 and hospitality category violation). Automatically freezes Escrow.
4. **Live Custom Receipt Upload (Real ELA Heatmap):** Allows judges to upload any receipt image from their computer and view the real-time Error Level Analysis (ELA) pixel tampering heatmap and generated Merkle proof.
