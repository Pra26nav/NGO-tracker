# Research Analysis: Fystack Multichain Indexer
**Reference:** `https://github.com/fystack/multichain-indexer`
**License:** MIT License

---

## 1. What the Project Does
Fystack Multichain Indexer is a modular, high-throughput blockchain event ingestion framework designed to handle real-time and historical transactions across EVM chains. It utilizes:
- **Worker Segregation:** Distinct workers for real-time WebSocket listening, historical block catchup, manual on-demand indexing, and dispute rescanning.
- **Bloom Filter Matching:** Rapidly filters block receipts against monitored contract addresses and event topics before parsing full payloads.
- **Resilience Architecture:** Checkpointed block heights to resume indexing seamlessly after network interruptions.

---

## 2. What We Learned
- **Decoupled Worker Architecture:** A single monolithic loop trying to do both live WebSocket streaming and historical backfilling inevitably lags behind block production during network congestion.
- **Bloom Filter Efficiency:** By checking the block header's `logsBloom` against monitored contract addresses, an indexer skips 98% of irrelevant blocks without making individual RPC `eth_getTransactionReceipt` calls.
- **Dispute Rescanning:** When an auditor or donor disputes an escrow release, a dedicated `RescanWorker` must be able to replay transactions from block $N$ with forensic taint rules enabled.

---

## 3. What Code & Architecture is Relevant
- Worker state management: `RealTimeWorker`, `CatchupWorker`, `ManualWorker`, `RescanWorker`.
- Normalized blockchain transfer and event models.
- RPC rate-limiting, retries, and exponential backoff strategies.

---

## 4. What We Adopted
- **Modular Indexing Engine:** Built into `apps/verifier-api/watchers.py` and `web3_verifier.py`.
- **Worker Types:**
  - `RealTimeWorker`: Listens for new `DonationLocked`, `TrancheDripped`, and `EscrowAutoFrozen` events on Base Sepolia and Sepolia.
  - `CatchupWorker`: Syncs historical campaign states from contract creation to latest block.
  - `ManualWorker`: Verifies individual transaction hashes entered by donors or judges in the UI.
  - `RescanWorker`: Recomputes proportional taint graphs when an audit dispute is triggered.
- **RPC Fallback Pipeline:** Dual-provider failover between Base Sepolia (`https://sepolia.base.org`) and Ethereum Sepolia (`https://rpc.sepolia.org`) with simulated local fallback.

---

## 5. What We Rejected & Why
- **Redis Queue / Celery Cluster:** Rejected introducing Redis and RabbitMQ dependencies to preserve zero-friction setup on developer and judge machines. Implemented using Python's native `asyncio` and thread pools.
- **Database Table per Chain:** Rejected multi-database sharding; normalized all events into a unified `FundFlowEvent` model.

---

## 6. Security & Trust Concerns
- **Reorg Vulnerability:** Indexing unfinalized blocks on testnets can lead to processing transactions that are later orphaned. In Black Hole Ledger, high-value escrow releases require 12 block confirmations before triggering smart contract state transitions.
