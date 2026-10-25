# Research Analysis: Levitate
**Reference:** `https://github.com/TioToninho/levitate`
**License:** MIT License

---

## 1. What the Project Does
Levitate is an open-source transparent philanthropic tracking platform featuring:
- Traceability of donations from individual donors to grassroots beneficiaries.
- IPFS content-addressed document storage for receipts, project photographs, and completion certificates.
- Hashing and pseudonymization of sensitive recipient data to comply with data privacy regulations.
- Public donor explorer with live impact metrics.

---

## 2. What We Learned
- **Content Addressing vs. Location Addressing:** Storing evidence URLs (`https://ngo-server.com/receipt.pdf`) invites silent tampering. If an NGO later replaces the PDF on their server, the URL remains valid while the evidence is doctored. Content addressing (`ipfs://bafybeig...`) ensures that any bit-flip in the file produces a different hash, making document tampering obvious.
- **The Public IPFS Privacy Trap:** Uploading raw beneficiary documents directly to public IPFS gateways permanently exposes their names, photographs, and phone numbers to the world.
- **Visual Impact Reporting:** Donors care deeply about the human outcome (e.g., number of rural households supplied with clean drinking water), which must be linked directly to the verified financial disbursements.

---

## 3. What Code & Architecture is Relevant
- IPFS manifest structures containing content identifiers (CIDs), upload timestamps, and file metadata.
- Public transparency dashboard layout connecting donations to verified real-world milestones.

---

## 4. What We Adopted
- **Content-Addressed Manifest Architecture:** Adopted for off-chain evidence manifests in `flow_tracer.py` and `reconciliation/page.tsx` (`ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`).
- **Selective Redaction:** Implemented client-side and backend redaction so that raw files are stripped of private beneficiary PII *before* content hashes are generated.

---

## 5. What We Rejected & Why
- **Unencrypted Public File Uploads:** Rejected storing raw receipts containing recipient identity on public IPFS gateways. In Black Hole Ledger, public leaves contain only vendor tax IDs, hardware descriptions, and GPS ward coordinates, while beneficiary identities are salted and hashed into the ZK Merkle root.

---

## 6. Security & Trust Concerns
- **Garbage In, Garbage Out:** An immutable IPFS hash proves that a file has not been altered since upload; it does not prove that the initial uploaded invoice was genuine. This is why Black Hole Ledger combines IPFS content addressing with computer vision ELA forgery detection and independent bank settlement verification.
