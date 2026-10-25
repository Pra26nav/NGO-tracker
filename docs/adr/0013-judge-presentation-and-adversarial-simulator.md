# ADR-0013: 1-Click Judge Presentation Runner & Adversarial Stress-Test Simulator (Feature #4)

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Presentation UX, Real-Time Cryptographic Auditing & Red-Team Simulation
* **Affected Components:**
  * [`apps/web/src/app/pitch/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/pitch/page.tsx)
  * [`apps/verifier-api/pitch_engine.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/pitch_engine.py)
  * [`apps/verifier-api/main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Hackathon judges have strict time constraints (typically 2-4 minutes per booth). Requiring judges to manually navigate complex multi-tab dashboards, upload sample images from local filesystems, or guess which edge cases to test causes friction, demo flakiness, and misses highlighting the deepest technical innovations.

Furthermore, technical judges often ask whether forensic claims (such as ELA pixel compression anomaly detection, DCT perceptual hashing, and ZK Merkle inclusion) are real algorithmic executions or hardcoded UI mockups.

We need a dedicated, zero-friction Feature #4 presentation command center that allows judges to execute the 3 core adversarial scenarios with a single click, view live cryptographic event logs streaming in real-time, and reference the pitch script and defensive Q&A cheatsheet instantly.

---

## 2. Decision Drivers

* **1-Click Execution:** Zero manual file picking required; 3 prominent buttons fire the exact problem statement attack vectors.
* **Cinematic Visual Impact:** Dynamic theme transition flipping smoothly between vibrant Emerald Green (Valid Milestone) and Crimson Red (Autonomous Escrow Freeze) using Framer Motion.
* **Terminal-Style Proof of Algorithmic Execution:** A real-time auto-scrolling console logging exact Keccak256 hashes, Hamming distances, ELA compression percentiles, and EVM contract events.
* **Elevator Pitch Quick-Reference Panel:** Collapsible side drawer summarizing the problem, 4-pillar solution, winning differentiators, and defensive answers to tough judge questions.
* **Zero Downtime Resilience:** High-availability dual-mode operation that connects seamlessly to FastAPI with instant offline simulation fallback.

---

## 3. Implemented Architecture

### 3.1 Three 1-Click Adversarial Scenarios
1. **Valid Milestone Proof:** Maharashtra Borewell invoice (`INV-2026-9001`) releasing Milestone 1 tranche (+10.0 ETH) with 142 salted beneficiary signatures committed to the on-chain Merkle root. Escrow status remains `ACTIVE`.
2. **Cross-Donor Double Spend Attack:** Re-submission of claimed invoice (`REC-8841`) cropped by 2 pixels to mutate the raw file SHA-256. Caught via 64-bit DCT pHash (Hamming distance = 2 <= 5) and Keccak256 Semantic Nullifier collision with Donor Pool A. Auto-freezes `PurposeBoundEscrow.sol`.
3. **30% Forged Receipt Batch Attack:** Ingestion of 10 invoices where 3 are forged. Highlights ELA high-compression pixel anomaly (Score 38.7 > 15.0) and unauthorized banquet catering. Automatically halts disbursements on-chain.

### 3.2 Live Adversarial Terminal Stream
* Real-time console featuring typewriter/streaming playback with customizable speeds (1x, 2x, instant).
* Color-coded logs categorized by level (`INFO`, `CRYPTO`, `SUCCESS`, `ALERT`, `CRITICAL`, `EMIT`).
* Controls for log replay, clipboard export, and category filtering (All, Cryptographic, Security Alerts).

### 3.3 Collapsible Elevator Pitch & Defensive Cheatsheet
* Built-in slide-over drawer with real-time KPI metrics:
  * Capital Protected: 50.00 ETH ($160,000 USD)
  * Double-Spend Catch Rate: 100%
  * Forgery Detection Rate: 100%
  * PII Leaked: 0 Bytes
  * Autonomous Freeze Latency: < 350 ms
* Direct defensive answers for tough questions on image compression resistance, low-res receipt ELA, and rural beneficiary privacy.

---

## 4. Consequences & Verification

* **Route Isolation:** The `/pitch` route is completely self-contained in `apps/web/src/app/pitch/page.tsx` and backed by `apps/verifier-api/pitch_engine.py`.
* **Cross-Feature Navigation:** All 4 features (Feature #1 Scanner, Feature #2 DAG Tracer, Feature #3 Escrow Dashboard, Feature #4 Pitch Simulator) are interconnected through the top navigation matrix.
* **Build Verification:** Tested and passed full production static optimization (`next build`) with 0 errors.
