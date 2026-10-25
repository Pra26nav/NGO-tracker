# ADR-0001: Record Architecture Decisions (Governance & Protocol)

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Architecture & Engineering Governance
* **Affected Components:**
  * Entire codebase under [`docs/adr/`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

"The Black Hole Ledger" combines multiple complex engineering domains: Ethereum smart contracts, deterministic cryptographic commitments, computer vision forensics (Error Level Analysis & Perceptual Hashing), cross-chain bridges, decentralized price oracles (Chainlink), central bank forex reference rates, and Zero-Knowledge (ZK) selective-disclosure Merkle trees.

In fast-paced, multi-developer environments or AI-assisted pair-programming workflows, undocumented decisions create technical debt, accidental regressions, and architectural erosion. Future developers and AI coding agents need to know *why* a technology or algorithm was chosen, what trade-offs were accepted, what alternatives were rejected, and what components would break if a technology is replaced.

---

## 2. Decision Drivers

* **Traceability:** Maintain a permanent, auditable log of all major architectural, cryptographic, and infrastructure choices.
* **Agent & Developer Ergonomics:** Enable human developers and autonomous AI coding agents to inspect constraints before proposing refactors or technology replacements.
* **Historical Preservation:** Never delete or retroactively rewrite past decisions; preserve the chronological evolution of the system.
* **Standardization:** Enforce a strict numbering, naming, status, and superseding lifecycle.

---

## 3. Considered Alternatives

### Alternative A: Ad-Hoc Markdown Notes in Root
* **Description:** Storing scattered markdown notes or design docs in the repository root.
* **Pros:** Easy to write initially.
* **Cons:** No uniform schema, no status lifecycle, difficult for AI agents to query deterministically, frequently goes stale.
* **Why rejected:** Lacks governance, indexing, and lifecycle management.

### Alternative B: External Wiki (Confluence / Notion)
* **Description:** Maintaining design records in an external knowledge base.
* **Pros:** Rich WYSIWYG editing.
* **Cons:** Disconnected from Git version control; desynchronizes with the codebase; inaccessible to local automated verification tools and offline AI agents.
* **Why rejected:** Architectural decisions must reside in-repo alongside the code they govern.

### Alternative C: Version-Controlled MADR (Markdown Architecture Decision Records)
* **Description:** Storing structured Markdown ADRs inside `docs/adr/` tracked in Git.
* **Pros:** Version-controlled, machine-readable, diffable, accessible to both human developers and AI assistants, supports formal superseding.
* **Cons:** Requires discipline to write and maintain.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Version-Controlled MADR System).

### Rules & Governance Protocol

1. **Location:** All ADRs must reside in [`docs/adr/`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr/).
2. **Naming Convention:** `NNNN-short-descriptive-title.md`, where `NNNN` is a zero-padded, 4-digit sequential integer starting at `0001`.
3. **Status Lifecycle:**
   * `Proposed`: Under review, not yet implemented.
   * `Accepted`: Approved and active in codebase.
   * `Rejected`: Considered but not implemented (preserved for historical rationale).
   * `Deprecated`: No longer relevant or phased out without a direct replacement.
   * `Superseded by ADR-XXXX`: Replaced by a newer decision record; the original ADR must remain intact with its header updated.
4. **Immutability Principle:** Once an ADR is marked `Accepted`, its historical text must not be rewritten. If a decision changes, author a new ADR (e.g. `ADR-0015`) and set the previous ADR's status to `Superseded by ADR-0015`.
5. **Master Index:** [`docs/adr/README.md`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr/README.md) must be updated whenever an ADR is added, modified, or superseded.

---

## 5. Consequences

### Positive Consequences
* Provides explicit technical rationale and constraints for every subsystem.
* AI agents can parse existing ADRs before generating code, ensuring backward compatibility.
* Eliminates tribal knowledge and onboarding friction for judges and teammates.

### Negative Consequences & Mitigations
* Slight overhead in authoring records during rapid prototyping. Mitigated by providing [`template.md`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr/template.md) and automated scaffolding.

---

## 6. Guidelines for Future Developers & AI Agents

* Always read relevant ADRs in [`docs/adr/`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr/) before modifying core architectural abstractions (escrow logic, nullifier computation, ELA forensics, Merkle structures).
* If replacing a library (e.g., swapping `imagehash` for OpenCV, or changing the AMM router), search the ADR registry for the library name to understand its dependencies and constraints.
* When proposing an architectural change, duplicate [`template.md`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/docs/adr/template.md), assign the next sequential number, and update the Master Index.
