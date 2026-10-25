# Research Analysis: CryptoChain Explorer
**Reference:** `https://github.com/PSPMANI/cryptochain-explorer`
**License:** MIT / Apache 2.0

---

## 1. What the Project Does
CryptoChain Explorer is a multichain blockchain investigation and transaction indexing platform. It specializes in:
- Ingestion of transfers across Ethereum, Bitcoin, Solana, and EVM layer-2 rollups.
- Tracking token swaps through automated market makers (Uniswap, Curve, CoW Swap).
- Cross-chain bridge event matching (Across, Stargate, LayerZero, Wormhole).
- Money-flow visualization and transaction graph exploration.
- Proportional taint accounting for co-mingled cryptocurrency wallets.

---

## 2. What We Learned
- **The "Naive Tracing" Fallacy:** If an NGO wallet starts with 40 ETH of general funds, receives a 60 ETH water donation, and later spends 50 ETH, naive tracing treats either all 50 ETH or 0 ETH as donor funds. Real forensic auditing requires **Proportional / Haircut Taint Accounting**:
  $$\text{ProvenanceRatio} = \frac{\text{DonationAttributableBalance}}{\text{TotalWalletBalance}}$$
  $$\text{AttributableExpenditure} = \text{AmountSpent} \times \text{ProvenanceRatio}$$
- **Bridge Event Linking:** Bridges operate via asynchronous cross-chain message passing. Connecting an L1 deposit to an L2 release requires matching deposit nonces, recipient addresses, and sequence numbers, rather than assuming instantaneous balance transfer.
- **DEX Swap Provenance Preservation:** Swapping 50 ETH for 160,000 USDC on Uniswap v3 is not a break in fund provenance; it is a value-preserving asset transformation that must link input asset/amount to output asset/amount.

---

## 3. What Code & Architecture is Relevant
- Proportional taint propagation algorithms.
- Modular adapter pattern: `ChainAdapter`, `BridgeAdapter`, `DEXAdapter`, and `OffRampAdapter`.
- Node and Edge graph schema (`nodes`: WALLET, TOKEN, TRANSACTION, SWAP, BRIDGE; `edges`: FUNDED, TRANSFERRED, SWAPPED, BRIDGED).

---

## 4. What We Adopted
- **Proportional Taint Accounting Engine:** Built directly into `apps/verifier-api/provenance_engine.py` and `packages/shared/types.ts`.
- **DEX & Bridge Provenance Preservation:** Integrated into the 5-stage DAG pipeline (`flow_tracer.py`), tracking Uniswap v3 swaps and Across/Polygon bridge transfers.
- **Shadow Wallet Detection:** Extended CryptoChain's exchange-labeling logic to detect bridge slippage skimming where an NGO diverts a percentage of cross-chain funds to an undeclared offshore wallet (`0x9b31...6318`).

---

## 5. What We Rejected & Why
- **Heavy Graph Database Infrastructure (Neo4j / Gremlin):** Rejected requiring a separate Neo4j cluster for hackathon demonstration. Implemented an in-memory high-performance adjacency list graph engine with REST JSON serialization.
- **Support for 20+ Unused Chains:** Rejected adding chain adapters for non-EVM chains not used in our baseline demonstration (focused on Base Sepolia, Polygon Amoy, and Ethereum Sepolia).

---

## 6. Security & Trust Concerns
- **Taint Dilution Attacks:** Malicious actors may deliberately route funds through high-volume mixers or multiple hops to dilute the provenance ratio below forensic thresholds.
- **Oracle Manipulation:** If bridge gas fees are calculated using an untrusted local RPC, an attacker could spoof exorbitant bridge costs to hide theft. We address this by anchoring expected bridge costs against Chainlink L1/L2 gas oracles.
