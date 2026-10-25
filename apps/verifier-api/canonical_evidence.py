"""
The Black Hole Ledger - Canonical Evidence & Semantic Nullifier Engine
Implements deterministic document canonicalization, dual-tier hashing,
and BHL_EXPENDITURE_NULLIFIER_V1 domain-separated nullifiers.
"""

import hashlib
import json
import re
from typing import Dict, Any, Optional, Tuple
from fastapi import APIRouter, Form, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/evidence", tags=["evidence"])

DOMAIN_SEPARATOR = "BHL_EXPENDITURE_NULLIFIER_V1"

# Global Cross-Donor Nullifier Registry: nullifier_hash => record
GLOBAL_NULLIFIER_STORE: Dict[str, Dict[str, Any]] = {}

def sha256_hex(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return "0x" + hashlib.sha256(data).hexdigest()

def normalize_vendor_tax_id(tax_id: str) -> str:
    # Uppercase, strip whitespace, remove special punctuation
    return re.sub(r"[^A-Z0-9]", "", tax_id.strip().upper())

def normalize_invoice_number(inv_no: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", inv_no.strip().upper())

def normalize_date(date_str: str) -> str:
    # Normalize to YYYY-MM-DD
    cleaned = date_str.strip()
    match = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", cleaned)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return cleaned

def normalize_amount(amount: str | float | int) -> str:
    clean_amt = "".join(ch for ch in str(amount) if ch.isdigit() or ch == ".") or "0"
    return f"{float(clean_amt):.2f}"

def canonicalize_expenditure_identity(
    vendor_tax_id: str,
    invoice_number: str,
    invoice_date: str,
    amount: str | float,
    currency: str = "INR",
    category: str = "Water Infrastructure"
) -> Dict[str, Any]:
    """
    Extracts semantic financial facts and produces deterministic canonical identity.
    Even if an image is cropped, rescanned, or re-saved, the financial facts are identical.
    """
    clean_tax_id = normalize_vendor_tax_id(vendor_tax_id)
    clean_inv_no = normalize_invoice_number(invoice_number)
    clean_date = normalize_date(invoice_date)
    clean_amt = normalize_amount(amount)
    clean_curr = currency.strip().upper()
    clean_cat = category.strip().title()

    canonical_string = f"{clean_tax_id}|{clean_inv_no}|{clean_date}|{clean_amt}|{clean_curr}|{clean_cat}"
    canonical_json = json.dumps({
        "vendorTaxId": clean_tax_id,
        "invoiceNumber": clean_inv_no,
        "invoiceDate": clean_date,
        "amount": clean_amt,
        "currency": clean_curr,
        "category": clean_cat
    }, sort_keys=True)

    canonical_evidence_hash = sha256_hex(canonical_json)

    return {
        "vendorTaxId": clean_tax_id,
        "invoiceNumber": clean_inv_no,
        "invoiceDate": clean_date,
        "amount": clean_amt,
        "currency": clean_curr,
        "category": clean_cat,
        "canonicalString": canonical_string,
        "canonicalEvidenceHash": canonical_evidence_hash
    }

def derive_expenditure_nullifier(
    canonical_identity: Dict[str, Any],
    secret_salt: str = "DEFAULT_SALT_BHL_2026"
) -> str:
    """
    Computes: H( canonicalString || secret_salt || DOMAIN_SEPARATOR )
    Using SHA3/Keccak for EVM contract alignment.
    """
    payload = f"{canonical_identity['canonicalString']}|{secret_salt}|{DOMAIN_SEPARATOR}"
    return "0x" + hashlib.sha3_256(payload.encode("utf-8")).hexdigest()

# Seed baseline nullifier for Donor Pool A
seed_ident = canonicalize_expenditure_identity("GSTIN-27AAACW1234F1Z5", "INV-2026-8841", "2026-10-24", "45000", "INR", "Water Infrastructure")
seed_nullifier = derive_expenditure_nullifier(seed_ident, "SALT_DONOR_POOL_A_991")
GLOBAL_NULLIFIER_STORE[seed_nullifier] = {
    "nullifier": seed_nullifier,
    "domainSeparator": DOMAIN_SEPARATOR,
    "canonicalIdentityHash": seed_ident["canonicalEvidenceHash"],
    "campaignId": 101,
    "campaignName": "Donor Pool A (Clean Water Initiative)",
    "vendorTaxId": seed_ident["vendorTaxId"],
    "invoiceNumber": seed_ident["invoiceNumber"],
    "claimedAmount": seed_ident["amount"],
    "timestamp": 1729764000,
    "isRegistered": True
}

class CanonicalizeRequest(BaseModel):
    vendorTaxId: str
    invoiceNumber: str
    invoiceDate: str
    amount: str
    currency: Optional[str] = "INR"
    category: Optional[str] = "Water Infrastructure"
    rawBytesHex: Optional[str] = None
    secretSalt: Optional[str] = "DEFAULT_SALT_BHL_2026"

@router.post("/canonicalize")
def api_canonicalize(req: CanonicalizeRequest):
    ident = canonicalize_expenditure_identity(
        req.vendorTaxId,
        req.invoiceNumber,
        req.invoiceDate,
        req.amount,
        req.currency or "INR",
        req.category or "Water Infrastructure"
    )
    raw_hash = sha256_hex(req.rawBytesHex) if req.rawBytesHex else sha256_hex(ident["canonicalString"])
    nullifier = derive_expenditure_nullifier(ident, req.secretSalt or "DEFAULT_SALT_BHL_2026")
    is_duplicate = nullifier in GLOBAL_NULLIFIER_STORE

    return {
        "canonicalIdentity": ident,
        "rawDocumentHash": raw_hash,
        "canonicalEvidenceHash": ident["canonicalEvidenceHash"],
        "semanticNullifier": nullifier,
        "domainSeparator": DOMAIN_SEPARATOR,
        "isDuplicate": is_duplicate,
        "duplicateDetails": GLOBAL_NULLIFIER_STORE.get(nullifier) if is_duplicate else None
    }

@router.get("/nullifier/{nullifier_hash}")
def api_check_nullifier(nullifier_hash: str):
    clean_hash = nullifier_hash.strip().lower()
    is_used = clean_hash in GLOBAL_NULLIFIER_STORE
    return {
        "nullifier": clean_hash,
        "isUsed": is_used,
        "record": GLOBAL_NULLIFIER_STORE.get(clean_hash) if is_used else None
    }
