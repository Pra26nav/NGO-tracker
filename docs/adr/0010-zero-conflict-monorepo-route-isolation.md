# ADR-0010: Zero-Conflict Monorepo Architecture with Route Isolation

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Monorepo Architecture & Team Workflow
* **Affected Components:**
  * [`turbo.json`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/turbo.json)
  * [`apps/web/src/app/red-team/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/red-team/page.tsx)
  * [`apps/web/src/app/flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx)
  * [`apps/verifier-api/main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py)
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py)
  * [`packages/shared/types.ts`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/packages/shared/types.ts)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

In competitive hackathons (such as CASCADE '26) and multi-agent development workflows, teammates or parallel AI coding agents develop different deliverables simultaneously:
* **Feature #1:** Adversarial Red-Team Stress-Test & Autonomous Escrow Auto-Freeze Engine.
* **Feature #2:** 5-Stage "Follow the Money" DAG Visualizer, FX Skimming Detector & ZK Beneficiary Auditor.

When multiple developers edit the same files (`page.tsx`, `api.py`, or central routing files), Git merge conflicts arise, blocking continuous integration and risking demo failure. We need an architecture where teammates can build in complete isolation without ever encountering Git merge conflicts, while sharing common cryptographic models and cohesive navigation.

---

## 2. Decision Drivers

* **Zero Merge Conflicts:** Teammates working on Feature #1 and Feature #2 must touch strictly separate files.
* **Single Unified Deployment:** Judges must experience a single polished web application that demonstrates both features seamlessly.
* **Shared Contract & Type Authority:** Smart contracts and TypeScript types must have a single source of truth (`packages/contracts`, `packages/shared`).
* **Fast Independent Iteration:** Changes to Feature #2 must never break Feature #1, and vice-versa.

---

## 3. Considered Alternatives

### Alternative A: Monolithic Single-Page Architecture
* **Description:** Both features stuffed into a single `apps/web/src/app/page.tsx` with dynamic boolean state toggles.
* **Pros:** Everything in one file.
* **Cons:** High risk of Git merge conflicts; bloated state management; difficult to debug.
* **Why rejected:** Violates parallel development ergonomics.

### Alternative B: Multiple Completely Separate Git Repositories
* **Description:** Splitting Feature #1 and Feature #2 into separate repositories.
* **Pros:** Zero Git conflicts.
* **Cons:** Duplicated smart contract code; duplicated styles; requires judges to open two different browser ports and setup two separate backend environments.
* **Why rejected:** Fractured judge experience and maintenance overhead.

### Alternative C: Turborepo Monorepo with Strict Vertical Route Isolation
* **Description:** A single unified repository using pnpm/turborepo workspaces. Code is partitioned into isolated feature directories:
  * Web Routes: `/red-team` (Feature #1) and `/flow-tracer` (Feature #2).
  * API Services: `main.py` (Feature #1 core) and `flow_tracer.py` (Feature #2 `APIRouter`).
  * Shared Packages: `packages/contracts/` and `packages/shared/`.
* **Pros:** 100% conflict-free Git workflows; shared type definitions; unified judge navigation with top-level feature switchers.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Turborepo Monorepo with Vertical Route Isolation).

### Repository Architecture Schema

```
black-hole-ledger/
├── apps/
│   ├── web/
│   │   └── src/app/
│   │       ├── red-team/page.tsx       <-- Feature #1 (Red-Team Engine)
│   │       ├── flow-tracer/page.tsx    <-- Feature #2 (5-Hop DAG & ZK Auditor)
│   │       ├── layout.tsx              <-- Shared Inter/JetBrains fonts & metadata
│   │       └── page.tsx                <-- Root redirect to /red-team
│   └── verifier-api/
│       ├── main.py                     <-- Feature #1 Forensic & Nullifier API
│       └── flow_tracer.py              <-- Feature #2 DAG & ZK APIRouter
└── packages/
    ├── contracts/                      <-- PurposeBoundEscrow.sol & NullifierRegistry.sol
    └── shared/                         <-- Canonical TypeScript interfaces (types.ts)
```

### Route & Router Mounting Rules

1. **Frontend Isolation:** Feature #1 code is restricted to `src/app/red-team/`. Feature #2 code is restricted to `src/app/flow-tracer/`.
2. **Backend APIRouter Isolation:** Feature #2 endpoints are defined inside `flow_tracer.py` using `APIRouter(prefix="/api/flow-tracer")` and mounted in `main.py` inside a fault-tolerant `try/except` block.
3. **Cross-Feature Navigation:** Both pages share a consistent top-level navigation pill switcher linking `/red-team` $\longleftrightarrow$ `/flow-tracer`.

---

## 5. Consequences

### Positive Consequences
* Multiple engineers or autonomous AI agents can modify Feature #1 and Feature #2 in parallel without git conflicts.
* Shared types in `packages/shared` prevent contract drift.
* A single `npm run dev` and `uvicorn main:app` starts the entire system.

### Negative Consequences & Mitigations
* Slight duplication of visual components (e.g. status badges).
  * *Mitigation:* Deliberate and beneficial during hackathons to avoid coupling component changes across features.

---

## 6. Guidelines for Future Developers & AI Agents

If adding Feature #3 or extending existing routes:
1. [ ] Create a new isolated directory under `apps/web/src/app/{feature-name}/page.tsx`.
2. [ ] Create a dedicated APIRouter in `apps/verifier-api/{feature_name}.py` and mount it cleanly in `main.py`.
3. [ ] Update the navigation switcher across all feature headers to include the new route.
