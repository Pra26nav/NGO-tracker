# ADR-0006: 5-Stage "Follow the Money" DAG Pipeline & Multi-Hop Settlement

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Cross-Chain Protocols & Settlement Architecture
* **Affected Components:**
  * [`apps/verifier-api/flow_tracer.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/flow_tracer.py#L125-L315)
  * [`apps/web/src/app/flow-tracer/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/flow-tracer/page.tsx#L125-L260)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

Donors contribute **50 ETH** on Ethereum L1, but physical vendors in rural areas (e.g. Maharashtra borewell drillers and pipe manufacturers) cannot accept volatile cryptocurrency or high-gas L1 transactions. The funds must traverse:
1. Volatility mitigation (ETH $\to$ Stablecoin)
2. Gas reduction (L1 $\to$ L2)
3. Currency off-ramping (USDC $\to$ INR)
4. Local banking disbursement (Bank UTR to physical impact)

Without a unified visual and cryptographic pipeline, this multi-hop process becomes the primary mechanism for fund leakage, unrecorded slippage, and lost accountability.

---

## 2. Decision Drivers

* **End-to-End Auditability:** Every stage of fund transformation must have an on-chain or banking reference proof.
* **Volatility Protection:** Crypto market fluctuations must not diminish the capital earmarked for physical infrastructure.
* **Gas Minimization:** Final disbursements to multiple micro-vendors and logistics partners must occur on a low-gas L2 or local banking rail.
* **Judicial Scrutiny:** Flowchart nodes must be independently clickable, revealing raw transaction hashes, block finality, and conversion rates.

---

## 3. Considered Alternatives

### Alternative A: Direct L1 Vendor Payment in ETH
* **Description:** Paying physical suppliers directly in ETH on Ethereum Mainnet.
* **Pros:** Simplest architecture.
* **Cons:** Vendors refuse ETH due to extreme price volatility; L1 gas fees ($15–$50 per transfer) waste donor money; requires rural suppliers to manage self-custody wallets.
* **Why rejected:** Unviable for practical field deployment.

### Alternative B: Complete Off-Chain Wire Transfer at Inception
* **Description:** Donor wires USD/INR directly to the NGO bank account.
* **Pros:** Traditional non-profit model.
* **Cons:** Creates the exact "black hole" problem where funds mingle with general overhead and become impossible to audit.
* **Why rejected:** Violates the entire premise of verifiable philanthropic fund flows.

### Alternative C: 5-Stage DAG Multi-Hop Architecture
* **Description:** A formal 5-stage pipeline connecting Ethereum L1 smart contract deposit $\to$ Uniswap v3 AMM swap $\to$ L2 canonical bridge $\to$ institutional fiat off-ramp $\to$ verified vendor UTR payout with anchored ZK proofs.
* **Pros:** Preserves donor lock on L1, eliminates volatility via USDC, minimizes fees on L2, and links on-chain burns directly to bank UTR settlement numbers.

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (5-Stage DAG Architecture).

### The 5 Hops Pipeline Definition

```
Hop 1 (L1 Deposit)      --> Hop 2 (DEX Swap)      --> Hop 3 (Bridge)       --> Hop 4 (Fiat Off-Ramp) --> Hop 5 (Impact Proof)
50.00 ETH ($160K)           159,840.00 USDC           159,776.10 USDC          ₹1,34,45,158.82 INR       ₹1,20,000 INR (Tranche 1)
PurposeBoundEscrow.sol      Uniswap v3 (0.05% Pool)   Across / Polygon State   RBI Forex (₹84.15/USD)    UTR-HDFC-20261025-00918234
```

1. **Hop 1 (Inbound Deposit):** Locks 50 ETH in `PurposeBoundEscrow.sol` on Ethereum Mainnet; sets immutable earmark commitment `keccak256("Water Infrastructure")`.
2. **Hop 2 (DEX Swap):** Swaps 50 ETH to USDC on Uniswap v3; slippage bounded by Chainlink ETH/USD oracle ($3,200.00).
3. **Hop 3 (Cross-Chain Bridge):** Moves USDC to low-gas L2 (Polygon/Base) via canonical state portal; requires 64 L1 block finality.
4. **Hop 4 (Fiat Off-Ramp):** Stablecoins burned on L2 and settled into INR via licensed banking gateway at official RBI forex reference rates.
5. **Hop 5 (Vendor Payout & Impact Proof):** Local bank NEFT transfer with confirmed UTR linked to hardware invoice `INV-2026-9001` and GPS delivery proof.

---

## 5. Consequences

### Positive Consequences
* Complete transparency from donor wallet to village well installation.
* Independent verification at each hop prevents single-point failure in auditability.

### Negative Consequences & Mitigations
* Bridging and off-ramping introduce third-party infrastructure (AMM pools, bridge relayers, off-ramp gateways).
  * *Mitigation:* Audited in real-time by the **FX & Bridge Skimming Detector** ([ADR-0007](0007-chainlink-forex-skimming-detector.md)).

---

## 6. Guidelines for Future Developers & AI Agents

If adding, modifying, or replacing hops:
1. [ ] Maintain the sequential DAG ordering: Hop $N$ outputs must mathematically equal or tightly bound Hop $N+1$ inputs within slippage tolerances.
2. [ ] If adding an L2 network (e.g. Arbitrum, Optimism), verify the bridge contract address and state root confirmation time.
3. [ ] Every hop UI card must implement the `proofDetails` array schema defined in `packages/shared/types.ts`.
