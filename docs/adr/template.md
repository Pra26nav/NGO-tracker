# [ADR-XXXX] Title of Decision

* **Status:** Proposed | Accepted | Rejected | Deprecated | Superseded by [ADR-YYYY](XXXX-title.md)
* **Date:** YYYY-MM-DD
* **Authors / Deciders:** [Names / Roles]
* **Technical Domain:** [Smart Contracts | Cryptography | Computer Vision | DeFi & Oracles | Privacy & ZK | Architecture]
* **Affected Components:**
  * [`path/to/component.ext`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/path/to/component.ext)
* **Supersedes:** [ADR-ZZZZ](ZZZZ-title.md) (or None)
* **Superseded By:** [ADR-YYYY](YYYY-title.md) (or None)

---

## 1. Context & Problem Statement

Describe the context, the forces at play, and the problem that needs to be addressed. Explain the business, security, legal, or technical drivers that triggered this architectural decision.

---

## 2. Decision Drivers

* List primary requirements and non-negotiables (e.g., deterministic execution, zero PII leakage, gas limits).
* List secondary requirements (e.g., auditability, low latency, offline resiliency).

---

## 3. Considered Alternatives

### Alternative A: [Option Name]
* **Description:** How this option works.
* **Pros:** 
  * Advantage 1
  * Advantage 2
* **Cons:**
  * Drawback 1
  * Drawback 2
* **Why rejected:** Specific technical reason for rejection.

### Alternative B: [Option Name]
* **Description:** How this option works.
* **Pros:** 
  * Advantage 1
* **Cons:**
  * Drawback 1
* **Why rejected:** Specific technical reason for rejection.

---

## 4. Decision Outcome

**Chosen Option:** [Option Name]

### Rationale
Explain why this option was chosen over the alternatives. Reference the decision drivers.

### Technical Specification
* Mathematical formulations, schemas, or contract interfaces.
* Data flow and security invariants.

---

## 5. Consequences

### Positive Consequences (Benefits)
* Specific benefits realized.

### Negative Consequences (Trade-offs & Mitigations)
* Trade-offs accepted and how they are mitigated.

### Neutral Consequences
* Architectural shifts or operational changes that are neither strictly positive nor negative.

---

## 6. Dependencies & Impact Analysis

* **Upstream Dependencies:** What systems or libraries this decision relies upon.
* **Downstream Consumers:** What modules or services depend on this decision.
* **Related ADRs:**
  * [ADR-XXXX](XXXX-title.md): Relationship description.

---

## 7. Assumptions & Verification

* **Assumptions:** What assumptions were made when this decision was taken?
* **Verification / Evidence:** How was this decision validated (e.g. unit test, benchmark, live demo)?

---

## 8. Guidelines for Future Developers & AI Agents (Replacement / Refactoring Checklist)

If you are modifying, refactoring, or replacing this technology or decision in the future:
1. [ ] Check A: Ensure invariant X is maintained.
2. [ ] Check B: Run test suite Y to verify no regressions.
3. [ ] Check C: If superseding, update the status of this document to `Superseded by ADR-XXXX` and record the rationale.
