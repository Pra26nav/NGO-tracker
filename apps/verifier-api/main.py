import io
import base64
import hashlib
import os
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageChops, ImageEnhance, ImageDraw
import imagehash
import numpy as np

def load_seed_json():
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "packages", "shared", "campaign-seed.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web", "src", "data", "campaign-seed.json")),
        os.path.abspath("packages/shared/campaign-seed.json"),
        os.path.abspath("apps/web/src/data/campaign-seed.json"),
    ]
    for c in candidates:
        if os.path.exists(c):
            with open(c, "r", encoding="utf-8") as f:
                return json.load(f)
    return {}

SEED_DATA = load_seed_json()

app = FastAPI(title="Black Hole Ledger - Forensic & Nullifier Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Feature #2: Follow the Money DAG & ZK Beneficiary Auditor Router
try:
    from flow_tracer import router as flow_tracer_router
    app.include_router(flow_tracer_router)
except Exception as e:
    print(f"Warning: Failed to import flow_tracer router: {e}")

# Feature #3: Purpose-Bound Donation Locker & Milestone Tranche Drip-Release Router
try:
    from escrow_dashboard import router as escrow_dashboard_router
    app.include_router(escrow_dashboard_router)
except Exception as e:
    print(f"Warning: Failed to import escrow_dashboard router: {e}")

# Feature #4: 1-Click Judge Presentation & Live Security Terminal Engine
try:
    from pitch_engine import router as pitch_engine_router
    app.include_router(pitch_engine_router)
except Exception as e:
    print(f"Warning: Failed to import pitch_engine router: {e}")

# Payment Gateway: Crypto & Fiat UPI Router
try:
    from donate_engine import router as donate_engine_router
    app.include_router(donate_engine_router)
except Exception as e:
    print(f"Warning: Failed to import donate_engine router: {e}")

# Global Search & Audit History Ledger Router
try:
    from history_engine import router as history_engine_router
    app.include_router(history_engine_router)
except Exception as e:
    print(f"Warning: Failed to import history_engine router: {e}")

# Web3.py On-Chain Receipt Verification Engine
try:
    from web3_verifier import verify_on_chain_receipt, get_web3_status

    @app.get("/api/web3/status")
    def web3_status():
        return get_web3_status()

    @app.get("/api/web3/receipt/{tx_hash}")
    def get_tx_receipt(tx_hash: str):
        return verify_on_chain_receipt(tx_hash)
except Exception as e:
    print(f"Warning: Failed to load web3_verifier: {e}")

# ── Research Integrated Augmented Subsystems ────────────────
try:
    from provenance_engine import router as provenance_router
    app.include_router(provenance_router)
except Exception as e:
    print(f"Warning: Failed to import provenance router: {e}")

try:
    from canonical_evidence import router as evidence_router
    app.include_router(evidence_router)
except Exception as e:
    print(f"Warning: Failed to import evidence router: {e}")

try:
    from zk_verifier import router as zk_router
    app.include_router(zk_router)
except Exception as e:
    print(f"Warning: Failed to import zk router: {e}")

try:
    from charity_intelligence import router as intelligence_router
    app.include_router(intelligence_router)
except Exception as e:
    print(f"Warning: Failed to import intelligence router: {e}")

try:
    from discrepancy_engine import router as discrepancy_router
    app.include_router(discrepancy_router)
except Exception as e:
    print(f"Warning: Failed to import discrepancy router: {e}")

try:
    from credentials_vc import router as vc_router
    app.include_router(vc_router)
except Exception as e:
    print(f"Warning: Failed to import vc router: {e}")

try:
    from adversarial_simulation import router as simulation_router
    app.include_router(simulation_router)
except Exception as e:
    print(f"Warning: Failed to import simulation router: {e}")

try:
    from watchers import router as watchers_router
    app.include_router(watchers_router)
except Exception as e:
    print(f"Warning: Failed to import watchers router: {e}")

GLOBAL_NULLIFIER_REGISTRY = {}
GLOBAL_PHASH_REGISTRY = []
ESCROW_STATE = {
    "status": "ACTIVE",
    "balance_eth": 50.0,
    "released_eth": 10.0,
    "earmark": "Water Infrastructure",
    "frozen_reason": None,
    "last_tx_hash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7"
}

def sha256_hex(data: str) -> str:
    return "0x" + hashlib.sha256(data.encode("utf-8")).hexdigest()

def generate_semantic_nullifier(vendor_tax_id: str, invoice_no: str, date_str: str, amount: str) -> str:
    """
    Deterministic cryptographic commitment of the invoice's core financial facts.
    Prevents NGOs from cropping or re-scanning the same receipt for a different donor.
    """
    clean_amt = "".join(ch for ch in str(amount) if ch.isdigit() or ch == ".") or "0"
    canonical = f"{vendor_tax_id.strip().upper()}|{invoice_no.strip().upper()}|{date_str.strip()}|{float(clean_amt):.2f}"
    return sha256_hex(canonical)

def build_privacy_merkle_tree(vendor_tax_id: str, item_desc: str, amount: str, beneficiary_raw: str):
    """
    Builds a selective-disclosure Merkle Tree where Beneficiary PII is salted & hashed
    so public auditors can verify the invoice fields without seeing beneficiary names/phones.
    """
    leaves = [
        {"label": "Vendor Tax ID (Public)", "value": vendor_tax_id, "hash": sha256_hex(vendor_tax_id)[:22] + "...", "isRedactedPII": False},
        {"label": "Line Item (Public)", "value": item_desc, "hash": sha256_hex(item_desc)[:22] + "...", "isRedactedPII": False},
        {"label": "Verified Total (Public)", "value": amount, "hash": sha256_hex(amount)[:22] + "...", "isRedactedPII": False},
        {"label": "Beneficiary Identity (ZK-Redacted)", "value": "REDACTED_PII [Village Cluster #14]", "hash": sha256_hex("SALT_991_" + beneficiary_raw)[:22] + "...", "isRedactedPII": True},
    ]
    combined = "|".join(l["hash"] for l in leaves)
    root = sha256_hex(combined)
    return root, leaves

def generate_synthetic_ela_heatmap(is_forged: bool) -> str:
    """Generates a visual ELA heatmap image (Base64 PNG) highlighting tampered regions."""
    img = Image.new("RGB", (420, 220), color=(12, 16, 28))
    draw = ImageDraw.Draw(img)
    # Draw subtle receipt skeleton lines
    draw.rectangle([20, 20, 400, 200], outline=(45, 55, 72), width=1)
    draw.line([35, 55, 250, 55], fill=(60, 75, 100), width=4)
    draw.line([35, 85, 310, 85], fill=(45, 55, 80), width=3)
    draw.line([35, 115, 280, 115], fill=(45, 55, 80), width=3)
    draw.line([35, 155, 200, 155], fill=(60, 75, 100), width=4)

    if is_forged:
        # Highlight high-intensity red/yellow compression anomalies around Total Amount
        draw.rectangle([255, 140, 385, 178], fill=(190, 25, 45), outline=(255, 210, 60), width=2)
        draw.text((263, 152), "ELA ANOMALY: 38.7", fill=(255, 240, 180))
    else:
        draw.rectangle([255, 140, 385, 178], outline=(35, 160, 110), width=1)
        draw.text((265, 152), "UNIFORM COMPRESSION", fill=(80, 220, 150))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

def compute_real_ela_heatmap(img: Image.Image, quality: int = 85) -> tuple[float, str]:
    """Computes real Error Level Analysis (ELA) on an uploaded image."""
    original = img.convert("RGB")
    buffer = io.BytesIO()
    original.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    resaved = Image.open(buffer)

    ela_img = ImageChops.difference(original, resaved)
    extrema = ela_img.getextrema()
    max_diff = max([ex[1] for ex in extrema]) or 1
    scale = 255.0 / max_diff
    ela_img = ImageEnhance.Brightness(ela_img).enhance(scale)

    arr = np.array(ela_img)
    anomaly_score = float(np.percentile(arr, 99.2)) / 5.5

    out_buf = io.BytesIO()
    ela_img.resize((420, 240)).save(out_buf, format="PNG")
    b64_str = base64.b64encode(out_buf.getvalue()).decode("utf-8")
    return round(anomaly_score, 2), f"data:image/png;base64,{b64_str}"

def seed_baseline():
    GLOBAL_NULLIFIER_REGISTRY.clear()
    GLOBAL_PHASH_REGISTRY.clear()
    ESCROW_STATE["status"] = SEED_DATA.get("escrowState", {}).get("status", "ACTIVE")
    ESCROW_STATE["balance_eth"] = float(SEED_DATA.get("financials", {}).get("totalDepositedEth", 50.0))
    ESCROW_STATE["released_eth"] = float(SEED_DATA.get("financials", {}).get("totalReleasedEth", 10.0))
    ESCROW_STATE["earmark"] = SEED_DATA.get("campaign", {}).get("earmark", "Water Infrastructure")
    ESCROW_STATE["frozen_reason"] = None
    ESCROW_STATE["last_tx_hash"] = SEED_DATA.get("campaign", {}).get("lastTxHash", "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7")
    seed_nullifier = generate_semantic_nullifier("GSTIN-27AAACW1234F1Z5", "INV-2026-8841", "2026-10-24", "45000")
    GLOBAL_NULLIFIER_REGISTRY[seed_nullifier] = "Donor_Pool_A (Clean Water Fund)"

seed_baseline()

@app.get("/api/health")
def health():
    return {"status": "ok", "escrowState": ESCROW_STATE}

@app.post("/api/reset-demo")
def reset_demo():
    seed_baseline()
    return {"status": "Demo reset", "escrowState": ESCROW_STATE}

@app.post("/api/red-team/simulate-scenario")
def simulate_scenario(scenario: str = Form(...)):
    if scenario == "VALID_MILESTONE":
        seed_baseline()
        nullifier = generate_semantic_nullifier("GSTIN-27WATER9988Z", "INV-2026-9001", "2026-10-25", "120000")
        GLOBAL_NULLIFIER_REGISTRY[nullifier] = "Donor_Pool_B (50 ETH Water Infrastructure)"
        merkle_root, leaves = build_privacy_merkle_tree(
            "GSTIN-27WATER9988Z",
            "3x Submersible Borewell Pumps & 200mm PVC",
            "INR 1,20,000",
            "Rameshwar Grampanchayat Ward 4"
        )
        ESCROW_STATE["released_eth"] = 10.0
        return {
            "scenario": scenario,
            "escrowState": ESCROW_STATE,
            "receipts": [{
                "receiptId": "REC-901",
                "vendorName": "Maharashtra Borewell & PVC Supply Co.",
                "vendorTaxId": "GSTIN-27WATER9988Z",
                "invoiceNumber": "INV-2026-9001",
                "invoiceDate": "2026-10-25",
                "totalAmount": "₹1,20,000 (0.48 ETH eq.)",
                "detectedCategory": "Water Infrastructure (Submersible Pumps & PVC)",
                "expectedCategory": "Water Infrastructure",
                "categoryMatch": True,
                "sha256Hash": "0x9f8a44c1...31b2",
                "perceptualHash": "f8c39a11b4e27001",
                "semanticNullifier": nullifier,
                "isDuplicateNullifier": False,
                "duplicatePoolSource": None,
                "isPerceptualClone": False,
                "hammingDistance": 28,
                "elaAnomalyScore": 4.2,
                "elaHeatmapBase64": generate_synthetic_ela_heatmap(False),
                "merkleRoot": merkle_root,
                "merkleLeaves": leaves,
                "verdict": "VERIFIED_RELEASE",
                "escrowFrozen": False,
                "failureReason": None
            }]
        }

    elif scenario == "CROSS_DONOR_DOUBLE_SPEND":
        nullifier = generate_semantic_nullifier("GSTIN-27AAACW1234F1Z5", "INV-2026-8841", "2026-10-24", "45000")
        merkle_root, leaves = build_privacy_merkle_tree(
            "GSTIN-27AAACW1234F1Z5",
            "HDPE Water Storage Tank 5000L",
            "INR 45,000",
            "Wardha Rural Cluster #2"
        )
        ESCROW_STATE["status"] = "FROZEN"
        ESCROW_STATE["last_tx_hash"] = "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b"
        ESCROW_STATE["frozen_reason"] = (
            f"CRITICAL: Cross-Donor Double Spend Detected! Receipt Nullifier {nullifier[:16]}... "
            "was already claimed in 'Donor_Pool_A (Clean Water Fund)'. PurposeBoundEscrow.sol auto-frozen!"
        )
        return {
            "scenario": scenario,
            "escrowState": ESCROW_STATE,
            "receipts": [{
                "receiptId": "REC-8841-CROPPED",
                "vendorName": "Nagpur Hydro Pipes Pvt Ltd",
                "vendorTaxId": "GSTIN-27AAACW1234F1Z5",
                "invoiceNumber": "INV-2026-8841",
                "invoiceDate": "2026-10-24",
                "totalAmount": "₹45,000",
                "detectedCategory": "Water Infrastructure",
                "expectedCategory": "Water Infrastructure",
                "categoryMatch": True,
                "sha256Hash": "0x77d190aa...e90a (MUTATED VIA 2px CROP!)",
                "perceptualHash": "a4f09b22c1d88310",
                "semanticNullifier": nullifier,
                "isDuplicateNullifier": True,
                "duplicatePoolSource": "Donor_Pool_A (Clean Water Fund)",
                "isPerceptualClone": True,
                "hammingDistance": 2,
                "elaAnomalyScore": 6.8,
                "elaHeatmapBase64": generate_synthetic_ela_heatmap(False),
                "merkleRoot": merkle_root,
                "merkleLeaves": leaves,
                "verdict": "FROZEN_DOUBLE_SPEND",
                "escrowFrozen": True,
                "failureReason": "NGO cropped image by 2px to mutate SHA-256, but Semantic Nullifier & pHash (Hamming Distance = 2 < 5 threshold) proved this exact invoice was already claimed in Donor_Pool_A!"
            }]
        }

    elif scenario == "BATCH_30_PERCENT_FORGERY":
        ESCROW_STATE["status"] = "FROZEN"
        ESCROW_STATE["last_tx_hash"] = "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899"
        ESCROW_STATE["frozen_reason"] = (
            "CRITICAL: 30% Forgery Rate Detected in Batch #42 (3/10 receipts failed ELA pixel tampering & category audit). "
            "Smart Contract Escrow locked on-chain."
        )
        batch = []
        for i in range(1, 11):
            is_forged = i in (3, 7, 9)
            vendor = "Apex Luxury Catering & Events" if i == 7 else f"Vidarbha Water Works #{i}"
            tax_id = f"GSTIN-27VWW00{i}Z"
            amt = "₹3,85,000 (DOCTORED)" if is_forged else "₹62,000"
            item_desc = "VIP Banquet & Catering" if i == 7 else "Borewell Casing Pipe 150mm"
            merkle_root, leaves = build_privacy_merkle_tree(tax_id, item_desc, amt, f"Beneficiary_Group_{i}")
            batch.append({
                "receiptId": f"BATCH-REC-{i:02d}",
                "vendorName": vendor,
                "vendorTaxId": tax_id,
                "invoiceNumber": f"INV-2026-550{i}",
                "invoiceDate": "2026-10-25",
                "totalAmount": amt,
                "detectedCategory": "Hospitality / Unapproved" if i == 7 else "Water Infrastructure",
                "expectedCategory": "Water Infrastructure",
                "categoryMatch": i != 7,
                "sha256Hash": f"0x4b1{i}99a2...88f{i}",
                "perceptualHash": f"99a01b{i}c44d2e10{i}",
                "semanticNullifier": sha256_hex(f"{tax_id}|INV-2026-550{i}|2026-10-25|{amt}"),
                "isDuplicateNullifier": False,
                "duplicatePoolSource": None,
                "isPerceptualClone": False,
                "hammingDistance": 30,
                "elaAnomalyScore": 38.7 if is_forged else 5.1,
                "elaHeatmapBase64": generate_synthetic_ela_heatmap(is_forged),
                "merkleRoot": merkle_root,
                "merkleLeaves": leaves,
                "verdict": "FROZEN_FORGERY" if is_forged else "VERIFIED_RELEASE",
                "escrowFrozen": is_forged,
                "failureReason": (
                    "ELA High-Compression Pixel Anomaly (38.7 > 15.0) around Total Amount digits + Font Kerning Mismatch"
                    if i in (3, 9) else (
                        "Semantic Category Mismatch: 'Hospitality / Catering' violates 'Water Infrastructure' Smart Contract Earmark"
                        if i == 7 else None
                    )
                )
            })
        return {
            "scenario": scenario,
            "escrowState": ESCROW_STATE,
            "receipts": batch
        }

@app.post("/api/red-team/upload-custom")
async def upload_custom_receipt(
    file: UploadFile = File(...),
    vendor_name: str = Form("Custom Local Vendor"),
    vendor_tax_id: str = Form("GSTIN-27CUST9981Z"),
    invoice_no: str = Form("INV-2026-9999"),
    amount: str = Form("75000"),
    category: str = Form("Water Infrastructure")
):
    raw_bytes = await file.read()
    sha256_val = "0x" + hashlib.sha256(raw_bytes).hexdigest()[:20] + "..."
    img = Image.open(io.BytesIO(raw_bytes))
    phash_obj = imagehash.phash(img)
    phash_str = str(phash_obj)

    ela_score, ela_b64 = compute_real_ela_heatmap(img)
    nullifier = generate_semantic_nullifier(vendor_tax_id, invoice_no, "2026-10-25", amount)

    is_dup = nullifier in GLOBAL_NULLIFIER_REGISTRY
    dup_source = GLOBAL_NULLIFIER_REGISTRY.get(nullifier)

    min_dist = 64
    for old_phash, pool_name, _ in GLOBAL_PHASH_REGISTRY:
        dist = phash_obj - old_phash
        if dist < min_dist:
            min_dist = dist
            if dist <= 5:
                dup_source = pool_name

    is_clone = min_dist <= 5
    cat_match = "water" in category.lower()
    is_forged = ela_score > 15.0
    freeze = is_dup or is_clone or is_forged or (not cat_match)

    GLOBAL_NULLIFIER_REGISTRY[nullifier] = "Custom_Live_Upload_Pool"
    GLOBAL_PHASH_REGISTRY.append((phash_obj, "Custom_Live_Upload_Pool", invoice_no))

    reason = None
    verdict = "VERIFIED_RELEASE"
    if is_dup or is_clone:
        verdict = "FROZEN_DOUBLE_SPEND"
        reason = f"Duplicate Receipt Detected! Semantic Nullifier / pHash (dist={min_dist}) collided with {dup_source}."
    elif is_forged:
        verdict = "FROZEN_FORGERY"
        reason = f"Live ELA Pixel Tampering Score ({ela_score}) exceeded threshold (15.0)."
    elif not cat_match:
        verdict = "FROZEN_CATEGORY_MISMATCH"
        reason = f"Category '{category}' violates 'Water Infrastructure' smart contract earmark."

    if freeze:
        ESCROW_STATE["status"] = "FROZEN"
        ESCROW_STATE["frozen_reason"] = reason

    merkle_root, leaves = build_privacy_merkle_tree(vendor_tax_id, category, f"INR {amount}", "Live_Uploaded_Beneficiary")

    return {
        "scenario": "CUSTOM_UPLOAD",
        "escrowState": ESCROW_STATE,
        "receipts": [{
            "receiptId": "LIVE-UPLOAD-01",
            "vendorName": vendor_name,
            "vendorTaxId": vendor_tax_id,
            "invoiceNumber": invoice_no,
            "invoiceDate": "2026-10-25",
            "totalAmount": f"₹{amount}",
            "detectedCategory": category,
            "expectedCategory": "Water Infrastructure",
            "categoryMatch": cat_match,
            "sha256Hash": sha256_val,
            "perceptualHash": phash_str,
            "semanticNullifier": nullifier,
            "isDuplicateNullifier": is_dup,
            "duplicatePoolSource": dup_source,
            "isPerceptualClone": is_clone,
            "hammingDistance": int(min_dist),
            "elaAnomalyScore": ela_score,
            "elaHeatmapBase64": ela_b64,
            "merkleRoot": merkle_root,
            "merkleLeaves": leaves,
            "verdict": verdict,
            "escrowFrozen": freeze,
            "failureReason": reason
        }]
    }
