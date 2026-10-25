# ADR-0007: Chainlink Oracles & Central Bank FX Skimming Discrepancy Detector

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** DeFi, Oracles & Financial Auditing
* **Affected Components:**
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py#L135-L185)
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py#L325-L370)
  * [`apps/web/src/app/flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx#L535-L620)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Adversarial organizations frequently siphon capital during fiat off-ramping or cross-chain bridging by claiming fabricated "currency conversion fees", "slippage", or "network congestion costs" (e.g., claiming 15.2% was lost during transit). In reality, the true market fee was under 0.10%, and the remaining 15.1% was secretly routed to an offshore shadow wallet.

Without reference truth feeds, donors and public auditors have no way to verify whether reported exchange rates and bridge costs reflect true market conditions.

---

## 2. Decision Drivers

* **Tamper-Proof Price Feeds:** Reference rates must be sourced from decentralized, Byzantine fault-tolerant oracles.
* **Deterministic Slippage Bounds:** A hard mathematical tolerance (e.g. 1.00%) beyond which a transaction is classified as fraudulent.
* **Shadow Wallet Traceability:** The audit engine must identify and display the specific unauthorized split address and tx hash.
* **Autonomous Escrow Enforcement:** Breaching slippage limits must trigger an immediate freeze on the underlying smart contract.

---

## 3. Considered Alternatives

### Alternative A: Relying on NGO-Reported Conversion Slips
* **Description:** NGO uploads scanned bank receipts stating whatever conversion rate they negotiated.
* **Pros:** Standard non-profit accounting practice.
* **Cons:** Trivial to fabricate; corrupt bank branch managers or offshore brokers can print doctored receipts with inflated spreads.
* **Why rejected:** Core source of NGO corruption.

### Alternative B: Centralized CEX API (Binance / Coinbase)
* **Description:** Querying spot rates from a single centralized cryptocurrency exchange.
* **Pros:** Simple REST API.
* **Cons:** Single point of failure; rate limits; exchange-specific orderbook variations; centralized downtime.
* **Why rejected:** Insufficient decentralization and regulatory authority.

### Alternative C: Dual-Tier Oracle Architecture (Chainlink + Central Bank Reference Rates)
* **Description:** Uses Chainlink Decentralized Oracles on-chain for crypto swaps (ETH/USD, USDC/USD) and official Reserve Bank of India (RBI / FBIL) benchmark rates for fiat off-ramping (USD/INR).
* **Pros:** High-fidelity, Byzantine fault-tolerant, legally recognized benchmark in statutory financial audits.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (Dual-Tier Chainlink + Central Bank Feeds).

### Reference Feeds & Parameters

| Feed Pair | Oracle Source | Contract / Identifier | Normal Rate | Heartbeat |
|---|---|---|---|---|
| **ETH / USD** | Chainlink Aggregator v3 | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | $3,200.00 / ETH | 60 sec |
| **USDC / USD** | Chainlink Aggregator v3 | `0x8fFfFD0E38E11ac0ee040609920042453e029247` | $1.0001 / USDC | 86,400 sec |
| **USD / INR** | RBI / FBIL Statutory Benchmark | `OFF_CHAIN_CENTRAL_BANK_FEED` | ₹84.1500 / USD | 3,600 sec |

### Slippage & Skimming Detection Rule

$$\text{ExpectedUSDC} = \text{DepositETH} \times \text{Chainlink}_{\text{ETH/USD}} \times (1 - \text{AMM\_Fee}_{\text{max}})$$

$$\text{DiscrepancyPct} = \frac{\text{ExpectedUSDC} - \text{ReportedUSDC}}{\text{ExpectedUSDC}} \times 100$$

$$\text{DiscrepancyPct} > 1.00\% \implies \textbf{FLAGGED\_SKIMMING} \longrightarrow \textbf{AUTONOMOUS\_FREEZE}$$

### Simulation Demo (14.8% Skimming Attack)

When toggled by judges:
* **Reported by NGO:** $136,183.68 USDC (Claimed 15.2% Bridge Gas)
* **Oracle Ground Truth:** Actual gas = $63.90 USDC (0.04%); Expected = $159,840.00 USDC
* **Skimmed Amount:** **$23,656.32 USDC (~₹19,90,680 INR)** diverted to Shadow Wallet `0x9b31De710F5D92186c3B5f80bF23a0740E7D6318` (*Cayman Island Commercial Trust*).
* **Reaction:** Contract locks remaining 37.5 ETH immediately.

---

## 5. Consequences

### Positive Consequences
* Prevents hidden skimming disguised as "slippage".
* Provides undeniable mathematical evidence during judge demonstrations.

### Negative Consequences & Mitigations
* Real flash crashes or extreme market volatility could exceed 1.00% slippage on illiquid pools.
  * *Mitigation:* The Uniswap v3 pool utilized (`ETH/USDC 0.05%`) is the deepest liquidity pool in DeFi, with typical slippage under 0.05% for 50 ETH.

---

## 6. Guidelines for Future Developers & AI Agents

If adjusting oracle feeds:
1. [ ] Do not loosen the `allowedTolerancePct` beyond 2.00% without documented justification.
2. [ ] If adding multi-currency fiat off-ramps (e.g. EUR, KES, NGN), integrate the respective national central bank reference feed into `flow_tracer.py`.
