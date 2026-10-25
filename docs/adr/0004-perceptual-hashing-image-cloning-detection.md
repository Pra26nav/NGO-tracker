# ADR-0004: Dual-Tier Perceptual Hashing (pHash) & Hamming Distance for Visual Deduping

* **Status:** Accepted
* **Date:** 2026-10-25
* **Authors / Deciders:** Black Hole Ledger Core Engineering Team
* **Technical Domain:** Computer Vision & Image Forensics
* **Affected Components:**
  * [`apps/verifier-api/main.py`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/main.py#L7-L9)
  * [`apps/verifier-api/requirements.txt`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/verifier-api/requirements.txt#L4)
  * [`apps/web/src/app/red-team/page.tsx`](file:///c:/Users/prana/Downloads/black-hole-ledger-feature1-antigravity/apps/web/src/app/red-team/page.tsx#L26-L31)
* **Supersedes:** None
* **Superseded By:** None

---

## 1. Context & Problem Statement

While Deterministic Semantic Nullifiers ([ADR-0003](0003-deterministic-semantic-nullifier-registry.md)) detect identical financial records, an adversarial NGO may tamper with the printed invoice number (e.g. altering `INV-8841` to `INV-8841A`) to produce a distinct nullifier.

However, the underlying physical document—its layout, logo, stamps, fold lines, and background texture—remains visually identical to a previously claimed invoice. We require a perceptual fingerprinting algorithm that operates in the visual frequency domain rather than the cryptographic bit domain.

---

## 2. Decision Drivers

* **Invariance to Geometric Alterations:** Resilient to minor cropping, scaling, JPEG compression, and brightness variations.
* **Low Computational Overhead:** Must compute in under 25 milliseconds on standard CPU hardware without GPU acceleration.
* **Fast Metric Distance:** The difference between two receipts must be measurable via a fast bitwise Hamming distance computation.
* **Low False-Positive Rate:** Must distinguish between receipts from the same vendor using a standard template vs. an actual reused physical receipt.

---

## 3. Considered Alternatives

### Alternative A: Average Hash (aHash)
* **Description:** Scales image to $8 \times 8$, converts to grayscale, and compares pixel brightness to the mean.
* **Pros:** Extremely fast.
* **Cons:** Fragile to slight gamma adjustments or non-linear illumination changes.
* **Why rejected:** Too coarse for document forensics.

### Alternative B: Deep Learning Embeddings (CLIP / ResNet-50)
* **Description:** Passing images through a vision transformer/CNN to extract 512-dimensional vector embeddings, measured via cosine similarity.
* **Pros:** Highly expressive visual understanding.
* **Cons:** High memory footprint (~500MB model weights), requires PyTorch/CUDA dependencies, inference latency 150–400ms per image.
* **Why rejected:** Excessive operational complexity for a microservice that can be solved with classical frequency transforms.

### Alternative C: Discrete Cosine Transform (DCT) Perceptual Hash (pHash)
* **Description:** Computes 64-bit fingerprint from the low-frequency coefficients of a 2D Discrete Cosine Transform.
* **Pros:** Frequency-domain representation captures structural layout; computed in <10ms; comparison is a single bitwise XOR and popcount (`hamming_distance`).

---

## 4. Decision Outcome

**Chosen Option:** Alternative C (DCT-based `pHash` via Python `imagehash`).

### Implementation Specification

1. **Preprocessing:** Grayscale conversion $\to$ resize to $32 \times 32$.
2. **Transform:** 2D Discrete Cosine Transform (DCT).
3. **Frequency Selection:** Retain the top-left $8 \times 8$ low-frequency submatrix (representing structural gradients, omitting high-frequency noise).
4. **Quantization:** Compute median of the 64 coefficients; set bit to `1` if $> \text{median}$, else `0`.
5. **Distance Metric:**
   $$\text{HammingDistance}(H_1, H_2) = \text{popcount}(H_1 \oplus H_2)$$

### Classification Thresholds

* $\text{Distance} \le 5$: **Perceptual Clone Detected** (Autonomous Escrow Freeze triggered).
* $6 \le \text{Distance} \le 18$: Suspicious similarity (manual audit flagged).
* $\text{Distance} > 18$: Structurally distinct invoice.

---

## 5. Consequences

### Positive Consequences
* Catches receipt re-use even when text has been altered or image has been re-scanned.
* Executes in <8ms with zero GPU dependency.

### Negative Consequences & Mitigations
* Similar vendor templates (e.g. blank invoices from the same printer) may have lower Hamming distances (~12–16).
  * *Mitigation:* Strict threshold of $\le 5$ ensures only near-identical scans/crops trigger autonomous freezing.

---

## 6. Guidelines for Future Developers & AI Agents

If replacing or retuning `pHash`:
1. [ ] Do not raise the clone threshold above $6$ without rigorous benchmarking against a test dataset of same-vendor invoices to prevent false-positive freezes.
2. [ ] If substituting `imagehash` with OpenCV or a Rust native module, ensure the DCT coefficient ordering is bit-compatible with historical database hashes.
