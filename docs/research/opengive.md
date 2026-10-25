# Research Analysis: OpenGive
**Reference:** `https://github.com/soomehta/opengive` | Documentation: `https://docs.opengive.org`
**License:** MIT License

---

## 1. What the Project Does
OpenGive is an open-source platform designed to aggregate and normalize public charity registries and financial disclosure datasets. It ingests:
- IRS Form 990 (United States public charities) via the ProPublica Nonprofit Explorer API.
- UK Charity Commission register and 360Giving grant records.
- International Aid Transparency Initiative (IATI) humanitarian registries.
- Australian Charities and Not-for-profits Commission (ACNC) and Canadian CRA T3010 datasets.

OpenGive performs entity resolution across disparate corporate naming conventions, computes charity reliability and anomaly scores, and visualizes institutional money flows.

---

## 2. What We Learned
- **Entity Identity Ambiguity:** Nonprofits frequently operate under slight variations of their legal name (e.g., "Maharashtra Clean Water Trust", "Mah. Clean Water NGO", "MCWT"). Exact string matching fails; deterministic entity resolution with fuzzy Levenshtein distance and confidence scoring is mandatory.
- **Financial Anomaly Heuristics:** A nonprofit whose executive compensation exceeds 35% of total annual expenses or whose administrative overhead spikes by >40% year-over-year exhibits statistical correlation with fraudulent misreporting.
- **Data Provenance:** External registry data must not be conflated with blockchain ground truth. Registry snapshots must be tagged with retrieval timestamps, dataset sources, and content hashes.

---

## 3. What Code & Architecture is Relevant
- Normalized charity database schemas:
  - `tax_id`, `legal_name`, `country`, `registration_status`, `total_revenue`, `program_expenses`, `admin_expenses`, `executive_comp`.
- Levenshtein-based fuzzy entity resolution algorithm with alias dictionary lookup.
- Risk scoring metrics combining filing currency, tax-exemption standing, and expense ratios.

---

## 4. What We Adopted
- **Normalized Registry Schema:** Incorporated into `packages/shared/types.ts` (`CharityRegistryRecord`) and `apps/verifier-api/charity_intelligence.py`.
- **Entity Resolution Engine:** Implemented fuzzy entity matching with confidence scoring (0.00 – 1.00) for cross-referencing NGO names and vendor tax IDs against official registries.
- **Statistical Anomaly Scorer:** Flags high administrative overhead or missing historical tax filings as risk indicators in the Black Hole Ledger trust gauge.
- **Indian Registry Integration:** Extended OpenGive's international concepts to support Indian NGO Darpan (NITI Aayog Unique ID), Section 80G tax exemption, and FCRA (Foreign Contribution Regulation Act) registration checks.

---

## 5. What We Rejected & Why
- **Direct Database Scraping Pipelines:** Rejected heavy periodic scrapers inside the core monorepo; implemented as a lightweight on-demand verification service with deterministic test vectors.
- **Unverified Third-Party Scoring:** Rejected treating OpenGive AI scoring as an autonomous smart contract freeze trigger. In Black Hole Ledger, external registry anomalies trigger **Auditor Review Flags**, while only cryptographic breaches (duplicate nullifiers, invalid ZK proofs) trigger **Autonomous Escrow Freezes**.

---

## 6. Security & Trust Concerns
- **Stale Registry Records:** Government tax databases may lag behind real-world corporate suspensions by months.
- **Epistemic Limitation:** Having a valid IRS 990 or Darpan registration does not guarantee that a specific borewell was physically constructed. External intelligence serves as a prerequisite identity filter, not physical expenditure proof.
