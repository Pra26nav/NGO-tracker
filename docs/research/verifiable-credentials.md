# Research Analysis: W3C Verifiable Credentials Data Model 2.0
**Reference:** `https://www.w3.org/TR/vc-data-model/`
**Specification:** W3C Recommendation

---

## 1. What the Specification Does
W3C Verifiable Credentials (VC) provide a standard data model for expressing cryptographically signed digital assertions. A Verifiable Credential consists of:
- **Issuer:** The DID of the entity making the claim (e.g., government agency, bank, auditor).
- **Holder / Subject:** The entity the claim is about (e.g., the NGO or vendor).
- **Claims:** Key-value properties representing facts (e.g., tax-exempt status, goods received, payment settled).
- **Proof:** Cryptographic digital signature (Ed25519, ECDSA, or JSON Web Proof) ensuring tamper evidence.

---

## 2. What We Learned
- **Closing the Epistemic Gap:** A blockchain can only verify transactions that occur on its own virtual machine. It has zero native awareness of physical delivery trucks or fiat bank wire transfers. W3C Verifiable Credentials bridge this gap by enabling authorized real-world entities (banks, inspectors, vendors) to issue signed digital proofs of real-world events.
- **Selective Disclosure:** A vendor can issue a credential proving that an invoice of ₹1,20,000 was paid in full without publicly broadcasting their customer list or internal cost margins.

---

## 3. What Code & Architecture is Relevant
- W3C VC JSON-LD schema structure:
  ```json
  {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "type": ["VerifiableCredential", "PaymentAttestationCredential"],
    "issuer": "did:bhl:offramp:HDFCBANK-IN",
    "issuanceDate": "2026-10-25T11:42:00Z",
    "credentialSubject": {
      "id": "did:bhl:vendor:GSTIN27WATER9988Z",
      "amountInr": 120000.00,
      "utrNumber": "HDFCR52026102500912",
      "purpose": "Water Infrastructure - Submersible Pumps"
    },
    "proof": {
      "type": "Ed25519Signature2020",
      "created": "2026-10-25T11:42:10Z",
      "verificationMethod": "did:bhl:offramp:HDFCBANK-IN#key-1",
      "jws": "eyJhbGciOiJFZERTQ..."
    }
  }
  ```

---

## 4. What We Adopted
- **Standardized Credential Types (`credentials_vc.py`):**
  1. `NGOVerifiedCredential`: Government tax-exemption & registration status.
  2. `VendorCredential`: Registered supplier status and authorized product categories.
  3. `OffRampCredential`: Fiat settlement and forex conversion confirmation.
  4. `PaymentAttestationCredential`: Direct banking payment confirmation with UTR reference.
  5. `DeliveryCredential`: Independent third-party field delivery confirmation with GPS ward stamp.
  6. `ImpactCredential`: Community outcome attestation (potable water delivered to 142 households).
- **On-Chain Credential Anchoring:** Stored as cryptographic hashes in `AttestationRegistry.sol`.

---

## 5. What We Rejected & Why
- **Complex JSON-LD Linked Data Signatures:** Rejected heavyweight schema URI resolvers that fail when internet connectivity drops; implemented using canonical RFC 8785 JSON serialization with standard SHA-256 + ECDSA / Ed25519 signatures.

---

## 6. Security & Trust Concerns
- **Collusion Between NGO and Vendor:** An NGO might collude with a crooked vendor to sign a fake `PaymentAttestationCredential`. Black Hole Ledger combats this through **Multi-Source Corroboration**: the receipt must match the banking UTR settlement, pass computer vision ELA pixel analysis, produce a unique semantic nullifier, and survive independent watcher scrutiny.
