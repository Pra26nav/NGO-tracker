# ADR-0011: Dual-Mode Architecture (Live FastAPI Sync with Offline Fallback)

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** High-Availability, Fault-Tolerance & Demo Resiliency
* **Affected Components:**
  * [`apps/web/src/app/red-team/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/red-team/page.tsx#L50-L190)
  * [`apps/web/src/app/flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx#L70-L160)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Hackathon live judging sessions frequently take place under adversarial network environments: conference Wi-Fi latency, localhost port conflicts, missing Python virtual environment dependencies on an evaluator's laptop, or accidental server termination.

If a web application strictly requires a live Python microservice to render its interface, any network glitch or delayed backend startup results in fatal `ECONNREFUSED` crashes or blank white screens. Conversely, if an app only uses mock data, it fails to demonstrate true live pixel-level image processing or real backend API integration.

We require an architecture that gives judges the best of both worlds: full real-time synchronization with the live FastAPI backend when available, paired with an instantaneous, 100% self-contained offline cryptographic fallback if the backend is offline.

---

## 2. Decision Drivers

* **Zero-Downtime Guarantee:** The web UI must **never** crash or display an error state, regardless of whether the Python backend is running.
* **Transparent Operational Status:** The user interface must visibly display whether it is running in `● API LIVE (8000)` mode or `● OFFLINE ENGINE` mode.
* **Complete Cryptographic Realism in Fallback:** The offline mode must not be static dummy text; it must contain real pre-computed ELA heatmaps, valid Merkle sibling paths, real perceptual hashes, and complete scenario state machines.
* **Auto-Discovery & Reconnection:** The frontend must automatically detect when the FastAPI server comes online without requiring a browser reload.

---

## 3. Considered Alternatives

### Alternative A: Strict Client-Server Coupling (Online Only)
* **Description:** Frontend fetches all state via standard `fetch("http://localhost:8000/...")`; fails if unreachable.
* **Pros:** Simpler frontend code.
* **Cons:** Fragile; a Python crash instantly breaks the entire demo.
* **Why rejected:** Unacceptable operational risk during live hackathon judging.

### Alternative B: Pure Client-Side Mocking (Static Demo)
* **Description:** All logic hardcoded in React state; no Python backend.
* **Pros:** Always works.
* **Cons:** Cannot perform real-time Error Level Analysis on user-uploaded custom receipt images; cannot demonstrate multi-tier microservice architecture.
* **Why rejected:** Fails technical depth requirements.

### Alternative C: Dual-Mode Architecture with Active Health Heartbeat
* **Description:** Frontend initializes with rich offline cryptographic state fixtures. On mount, it pings `http://127.0.0.1:8000/api/health`. If healthy, it seamlessly delegates execution to the Python backend; if unreachable, it falls back to internal simulation models and displays an `OFFLINE MODE` badge.
* **Pros:** 100% immune to backend downtime; demonstrates full live full-stack capability when running; clear UI status.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Dual-Mode Architecture).

### State Machine Lifecycle

```
[UI Mounts] 
    │
    ├──> 1. Render immediately with high-fidelity pre-computed state (0ms latency)
    │
    └──> 2. Ping http://127.0.0.1:8000/api/health (with timeout)
            │
            ├── [200 OK] ──> Set apiOnline = true  --> Display "● API LIVE (8000)"
            │                                      --> Sync live contract state & ELA
            │
            └── [FAIL]   ──> Set apiOnline = false --> Display "● OFFLINE ENGINE"
                                                   --> Fallback to local cryptographic state
```

### Implementation Safeguards

1. **Self-Contained Merkle Proofs:** The client contains complete offline sibling path generators and pre-computed hashes matching the on-chain Merkle root (`0x856c30affcf0560c...`).
2. **Pre-Rendered ELA Heatmaps:** Base64-encoded visual compression heatmaps are embedded into the client offline cache, ensuring Scenario 3 (30% batch forgery) renders tamper heatmaps even if Pillow is uninstalled.
3. **No Uncaught Promise Rejections:** All network calls are wrapped in `try/catch` blocks with instant fallback triggers.

---

## 5. Consequences

### Positive Consequences
* Absolute confidence during live demos: the presentation will never fail due to a backend connection timeout.
* Judges can inspect the code and see that real live uploading works via the Python API, while casual evaluators can run just the frontend without Python installed.

### Negative Consequences & Mitigations
* Offline data fixtures must be kept in sync with Python generator algorithms.
  * *Mitigation:* Types and constants are anchored in `packages/shared/types.ts` and verified by automated end-to-end browser subagents.

---

## 6. Guidelines for Future Developers & AI Agents

If adding new API endpoints or scenario data:
1. [ ] Always provide a corresponding offline fallback object in `OFFLINE` dictionaries within `page.tsx`.
2. [ ] Wrap every `fetch()` call in a graceful fallback handler that sets offline state rather than re-throwing errors.
3. [ ] Verify that the `apiOnline` badge transitions correctly between `● API LIVE` and `● OFFLINE MODE`.
