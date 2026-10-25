# SECURITY AUDIT & DEFENSIVE SPECIFICATION
**Black Hole Ledger — Verifiable NGO Fund Flows**

---

## 1. Smart Contract Security (`packages/contracts`)

### 1.1 Reentrancy Protection
- All external calls transferring ETH (e.g. `(bool sent, ) = recipient.call{value: t.amount}("")`) follow the strict **Checks-Effects-Interactions (CEI)** pattern.
- State variables (`t.isReleased = true;`, `c.totalReleased += t.amount;`, `isNullifierUsed[_semanticNullifier] = true;`) are committed to blockchain storage **before** executing the low-level value transfer.
- Critical functions are secured against reentrancy loops.

### 1.2 Access Control & Emergency Privileges
- `createCampaign`: Publicly callable by any donor locking $> 0$ ETH. Earmark and tranche schedules become immutable upon creation.
- `releaseNextTranche`: Enforces that the campaign is not frozen and current tranche index is valid. Verifies nullifier uniqueness globally before release.
- `emergencyFreeze`: Permitted to the original donor, current caller, or automated watchtower oracle when fraud proofs are submitted.
- `unfreezeEscrow`: Strictly restricted via `require(msg.sender == c.donor)`—only the sovereign donor who deposited capital can authorize unfreezing after dispute resolution.

### 1.3 Front-Running & Replay Protection
- Nullifiers are globally isolated using `mapping(bytes32 => uint256) public globalNullifierRegistry`.
- An attacker front-running an honest NGO cannot claim a nullifier for a different campaign without knowing the underlying secret salt and valid Merkle inclusion proof.

---

## 2. Cryptographic Security & Privacy

### 2.1 Domain Separation
- All nullifiers are derived with an immutable domain separator:
  $$\text{Nullifier} = \mathcal{H}(\text{CanonicalFinancialFacts} \parallel \text{SecretSalt} \parallel \text{"BHL_EXPENDITURE_NULLIFIER_V1"})$$
- Prevents cross-protocol replay attacks or collision with identity-based nullifiers.

### 2.2 Beneficiary Privacy Guarantee (Zero PII on Blockchain)
- Raw beneficiary names, national Aadhaar suffixes, and phone numbers are salted off-chain:
  $$\text{Leaf} = \mathcal{H}(\text{Salt} \parallel \text{Index} \parallel \text{RawPII})$$
- Only the 32-byte Merkle root is committed to EVM contracts.
- Independent public auditors can verify that a specific rural household received clean water by verifying their isolated Merkle branch proof (`ZKProofInspector.tsx`) with zero bytes of personal data leaked to public block explorers.

---

## 3. Web & API Security (`apps/web` & `apps/verifier-api`)

### 3.1 Input Validation & File Upload Security
- Image uploads to the Error Level Analysis (ELA) engine are verified using Pillow:
  - Format verification restricts inputs to valid JPEG/PNG formats.
  - Image dimensions are capped to prevent decompressed memory bombs ("pixel bombs").
  - Content-Type and file extensions are sanitized to prevent path traversal or remote shell execution.

### 3.2 SSRF & External Request Safeguards
- Blockchain RPC queries are restricted to whitelisted endpoints (`BASE_SEPOLIA_RPC`, `SEPOLIA_RPC`).
- Registry fetches use strictly parameterized queries with timeouts and circuit-breaker backoffs to prevent SSRF vulnerabilities.

### 3.3 High-Availability Dual-Mode Resilience
- The web frontend utilizes `demo-safe.ts` to ensure that if the FastAPI backend (port 8000) or an external testnet RPC experiences transient timeouts, the UI falls back smoothly to verifiable client-side simulation with a prominent status banner, preventing presentation crashes.
