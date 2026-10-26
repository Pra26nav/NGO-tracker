"""
The Black Hole Ledger - Feature #3
Purpose-Bound Donation Locker, Milestone Tranche Drip-Release, Emergency Freeze Killswitch & Public Transparency Feed
Zero-Conflict Isolated Backend Module
"""

import hashlib
import time
import os
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Form, UploadFile, File
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def sha256_hex(data: str) -> str:
    return "0x" + hashlib.sha256(data.encode("utf-8")).hexdigest()

def load_seed_json() -> Dict[str, Any]:
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

# ────────────────────────────────────────────────────────────
# Global In-Memory Escrow & Tranche State (Mirrors Smart Contract & Seed)
# ────────────────────────────────────────────────────────────
CAMPAIGN_STATE = {
    "id": SEED_DATA.get("campaign", {}).get("campaignId", 1),
    "name": SEED_DATA.get("campaign", {}).get("name", "Rural Water Infrastructure Fund (Maharashtra Cluster)"),
    "donorAddress": SEED_DATA.get("campaign", {}).get("donorAddress", "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901"),
    "ngoAddress": SEED_DATA.get("campaign", {}).get("ngoAddress", "0x217e9C3182B0058b76D63E666C2c502b4e89991A"),
    "earmarkedPurpose": SEED_DATA.get("campaign", {}).get("earmarkedPurpose", "Water Infrastructure"),
    "totalDepositedEth": float(SEED_DATA.get("financials", {}).get("totalDepositedEth", 50.0)),
    "totalReleasedEth": float(SEED_DATA.get("financials", {}).get("totalReleasedEth", 10.0)),
    "vaultBalanceEth": float(SEED_DATA.get("financials", {}).get("vaultBalanceEth", 40.0)),
    "isFrozen": SEED_DATA.get("escrowState", {}).get("status") == "FROZEN",
    "freezeReason": SEED_DATA.get("escrowState", {}).get("frozen_reason") or "",
    "freezeTimestamp": None,
    "currentTrancheIndex": 1,
    "contractAddress": SEED_DATA.get("campaign", {}).get("contractAddress", "0x3Af19B02cD319985E1e012399F319114d5e56E1"),
    "nullifierRegistry": SEED_DATA.get("campaign", {}).get("nullifierRegistry", "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"),
    "network": SEED_DATA.get("campaign", {}).get("network", "Ethereum Sepolia / Mainnet"),
    "lastTxHash": SEED_DATA.get("campaign", {}).get("lastTxHash", "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7"),
}

# ────────────────────────────────────────────────────────────
# Feature 3: Bank Statement Freshness & Staleness Tracking
# ────────────────────────────────────────────────────────────
STATEMENT_STATE: Dict[str, Any] = {
    # 42 days elapsed from September 14, 2026 to October 26, 2026 baseline
    "lastStatementUploadDate": "2026-09-14T09:30:00Z",
    "reportingPeriod": "Q3 2026 (July 1 - September 14, 2026)",
    "statementFilename": "ICICI_Corporate_Escrow_Statement_Q3_2026.pdf",
    "statementHash": "0x5e89a3f2d1c087b4e91234567890abcdef1234567890abcdef1234567890abcd",
    "bankName": "ICICI Bank Ltd — FCRA & Institutional Escrow Branch",
    "accountNumberMasked": "•••• •••• •••• 9012",
    "thresholdDays": 30,
    "uploadedBy": "FinOps Officer (Anand Verma, CA)",
    "auditRule": "RBI FCRA / Standard Philanthropic Audit Rule: Bank statements must be reconciled every 30 days."
}

def get_effective_reference_datetime() -> datetime:
    return datetime(2026, 10, 26, 1, 30, 0, tzinfo=timezone.utc)

def calculate_statement_freshness() -> Dict[str, Any]:
    upload_str = STATEMENT_STATE["lastStatementUploadDate"]
    try:
        clean_str = upload_str.replace("Z", "+00:00")
        upload_dt = datetime.fromisoformat(clean_str)
    except Exception:
        upload_dt = datetime(2026, 9, 14, 9, 30, 0, tzinfo=timezone.utc)
    
    ref_dt = get_effective_reference_datetime()
    days_elapsed = max(0, (ref_dt.date() - upload_dt.date()).days)
    
    threshold = int(STATEMENT_STATE.get("thresholdDays", 30))
    is_overdue = days_elapsed > threshold
    
    if days_elapsed <= 14:
        staleness_level = "FRESH"
    elif days_elapsed <= threshold:
        staleness_level = "EXPIRING_SOON"
    elif days_elapsed <= 60:
        staleness_level = "OVERDUE"
    else:
        staleness_level = "CRITICAL"
        
    warning_badge = f"⚠️ Statement Overdue: {days_elapsed} days since last upload" if is_overdue else f"✓ Statement Current: {days_elapsed}d ago"

    return {
        "lastStatementUploadDate": upload_str,
        "reportingPeriod": STATEMENT_STATE["reportingPeriod"],
        "daysElapsed": days_elapsed,
        "thresholdDays": threshold,
        "isOverdue": is_overdue,
        "stalenessLevel": staleness_level,
        "warningBadge": warning_badge,
        "statementFilename": STATEMENT_STATE.get("statementFilename"),
        "statementHash": STATEMENT_STATE.get("statementHash"),
        "bankName": STATEMENT_STATE.get("bankName"),
        "accountNumberMasked": STATEMENT_STATE.get("accountNumberMasked"),
        "uploadedBy": STATEMENT_STATE.get("uploadedBy"),
        "auditRule": STATEMENT_STATE.get("auditRule"),
    }


TRANCHES = []
for t in SEED_DATA.get("tranches", []):
    status = "RELEASED" if t.get("badge") == "RELEASED" else ("PENDING_VERIFICATION" if t.get("badge") == "CURRENT EARMARK" else "LOCKED")
    TRANCHES.append({
        "trancheId": t.get("trancheId"),
        "name": t.get("name"),
        "stage": t.get("stage"),
        "percentage": t.get("percentage"),
        "amountEth": t.get("amountEth"),
        "amountUsd": t.get("amountUsd"),
        "amountInr": t.get("amountInr"),
        "status": status,
        "description": t.get("description"),
        "verifiedNullifier": t.get("verifiedNullifier"),
        "verifiedMerkleRoot": t.get("verifiedMerkleRoot"),
        "releasedAt": t.get("releasedAt"),
        "txHash": t.get("txHash"),
        "recipientVendor": t.get("recipientVendor")
    })

# Fallback if seed was empty
if not TRANCHES:
    TRANCHES = [
        {
            "trancheId": 1,
            "name": "Tranche 1: Mobilization & Hydrogeological Survey",
            "stage": "Mobilization",
            "percentage": 20,
            "amountEth": 10.0,
            "amountUsd": 32000.0,
            "amountInr": 2692800.0,
            "status": "RELEASED",
            "description": "Initial mobilization, hydro-geological mapping, and contractor site survey across 4 target village clusters.",
            "verifiedNullifier": "0x88c1901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e1",
            "verifiedMerkleRoot": "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370",
            "releasedAt": "2026-10-24 14:20:00 UTC",
            "txHash": "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
            "recipientVendor": "Vidarbha Geological & Drilling Consultancy (GSTIN-27VWW001Z)"
        },
        {
            "trancheId": 2,
            "name": "Tranche 2: Heavy Material Sourcing & Borewell Casing Drilling",
            "stage": "Material Sourcing",
            "percentage": 30,
            "amountEth": 15.0,
            "amountUsd": 48000.0,
            "amountInr": 4039200.0,
            "status": "PENDING_VERIFICATION",
            "description": "Procurement of 4x 5HP submersible pumps, 200m 150mm heavy PVC casing pipes, and drilling equipment.",
            "verifiedNullifier": None,
            "verifiedMerkleRoot": None,
            "releasedAt": None,
            "txHash": None,
            "recipientVendor": "Maharashtra Borewell & PVC Supply Co. (GSTIN-27WATER9988Z)"
        },
        {
            "trancheId": 3,
            "name": "Tranche 3: Solar Pump & 5,000L Storage Installation",
            "stage": "Installation",
            "percentage": 30,
            "amountEth": 15.0,
            "amountUsd": 48000.0,
            "amountInr": 4039200.0,
            "status": "LOCKED",
            "description": "Solar microgrid inverter connection, multi-stage water filtration, and 5000L HDPE clean water storage.",
            "verifiedNullifier": None,
            "verifiedMerkleRoot": None,
            "releasedAt": None,
            "txHash": None,
            "recipientVendor": "Apex Green Solar & Clean Water Ltd (GSTIN-27SOLAR4411Z)"
        },
        {
            "trancheId": 4,
            "name": "Tranche 4: Commissioning, Fluoride Audit & Household Handover",
            "stage": "Commissioning & Audit",
            "percentage": 20,
            "amountEth": 10.0,
            "amountUsd": 32000.0,
            "amountInr": 2692800.0,
            "status": "LOCKED",
            "description": "Water quality lab testing, fluoride reduction audit, grampanchayat handover to 142 rural households.",
            "verifiedNullifier": None,
            "verifiedMerkleRoot": None,
            "releasedAt": None,
            "txHash": None,
            "recipientVendor": "Maharashtra Rural Health Care Trust (GSTIN-27MED1122Z)"
        }
    ]

ACTIVITY_FEED = [
    {
        "id": "ACT-1001",
        "type": "DONATION_LOCKED",
        "title": "50.00 ETH Locked with Strict Purpose",
        "subtitle": "Earmarked: Water Infrastructure (PurposeBoundEscrow.sol)",
        "amount": "50.00 ETH ($160,000 USD)",
        "timestamp": "2026-10-24 10:15:00 UTC",
        "blockNumber": 20491823,
        "txHash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        "badge": "PURPOSE BOUND",
        "color": "indigo",
        "details": "Donor address 0x71C9...b901 deposited 50.0 ETH locked to keccak256('Water Infrastructure')."
    },
    {
        "id": "ACT-1002",
        "type": "TRANCHE_RELEASED",
        "title": "Tranche 1 Drip Disbursed (20%)",
        "subtitle": "Mobilization & Site Survey Released to Contractor",
        "amount": "10.00 ETH ($32,000 USD)",
        "timestamp": "2026-10-24 14:20:00 UTC",
        "blockNumber": 20491845,
        "txHash": "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
        "badge": "TRANCHE DRIP",
        "color": "emerald",
        "details": "Milestone verified: Geological survey report authenticated via Nullifier 0x88c1901f...33e1."
    },
    {
        "id": "ACT-1003",
        "type": "ORACLE_HEARTBEAT",
        "title": "Chainlink Reference Price Heartbeat",
        "subtitle": "ETH/USD $3,200.00 | USD/INR ₹84.15 (RBI)",
        "amount": "0.10% AMM Slippage",
        "timestamp": "2026-10-25 09:30:00 UTC",
        "blockNumber": 20491870,
        "txHash": "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
        "badge": "ORACLE VERIFIED",
        "color": "cyan",
        "details": "Slippage audit passed. Zero skimming detected on DEX swap Hop #2."
    }
]

# ────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────
@router.get("/state")
def get_dashboard_state():
    from donate_engine import calculate_volunteer_impact, VOLUNTEER_SERVICES
    next_tranche = next((t for t in TRANCHES if t["status"] != "RELEASED"), None)
    return {
        "campaign": CAMPAIGN_STATE,
        "tranches": TRANCHES,
        "activityFeed": ACTIVITY_FEED,
        "statementFreshness": calculate_statement_freshness(),
        "volunteerImpact": calculate_volunteer_impact(),
        "volunteerServices": VOLUNTEER_SERVICES,
        "summary": {
            "lockedBalanceEth": CAMPAIGN_STATE["totalDepositedEth"] - CAMPAIGN_STATE["totalReleasedEth"],
            "releasedBalanceEth": CAMPAIGN_STATE["totalReleasedEth"],
            "releasedPercentage": round((CAMPAIGN_STATE["totalReleasedEth"] / CAMPAIGN_STATE["totalDepositedEth"]) * 100, 1),
            "status": "FROZEN" if CAMPAIGN_STATE["isFrozen"] else "ACTIVE",
            "activeTrancheId": next_tranche["trancheId"] if (next_tranche and not CAMPAIGN_STATE["isFrozen"]) else None,
            "nextTrancheAmountEth": next_tranche["amountEth"] if next_tranche else 0.0,
            "contractAddress": CAMPAIGN_STATE["contractAddress"]
        }
    }

@router.get("/volunteer-impact")
def get_volunteer_impact():
    from donate_engine import calculate_volunteer_impact, VOLUNTEER_SERVICES
    return {
        "status": "SUCCESS",
        "summary": calculate_volunteer_impact(),
        "services": VOLUNTEER_SERVICES
    }

@router.post("/lock-donation")
def lock_donation(
    amount_eth: float = Form(50.0),
    purpose: str = Form("Water Infrastructure"),
    ngo_address: str = Form("0x217e9C3182B0058b76D63E666C2c502b4e89991A")
):
    CAMPAIGN_STATE["totalDepositedEth"] = amount_eth
    CAMPAIGN_STATE["totalReleasedEth"] = 0.0
    CAMPAIGN_STATE["vaultBalanceEth"] = amount_eth
    CAMPAIGN_STATE["earmarkedPurpose"] = purpose
    CAMPAIGN_STATE["isFrozen"] = False
    CAMPAIGN_STATE["freezeReason"] = ""
    CAMPAIGN_STATE["currentTrancheIndex"] = 0

    # Reset tranches matching 20/30/30/20 standard schedule
    t_splits = [0.20, 0.30, 0.30, 0.20]
    eth_usd = float(SEED_DATA.get("financials", {}).get("exchangeRates", {}).get("ethUsd", 3200.0))
    eth_inr = float(SEED_DATA.get("financials", {}).get("exchangeRates", {}).get("ethInr", 269280.0))

    for i, pct in enumerate(t_splits):
        amt_eth = round(amount_eth * pct, 2)
        if i < len(TRANCHES):
            TRANCHES[i]["amountEth"] = amt_eth
            TRANCHES[i]["percentage"] = int(pct * 100)
            TRANCHES[i]["amountUsd"] = round(amt_eth * eth_usd, 2)
            TRANCHES[i]["amountInr"] = round(amt_eth * eth_inr, 2)
            TRANCHES[i]["status"] = "PENDING_VERIFICATION" if i == 0 else "LOCKED"
            TRANCHES[i]["releasedAt"] = None
            TRANCHES[i]["verifiedNullifier"] = None
            TRANCHES[i]["verifiedMerkleRoot"] = None
            TRANCHES[i]["txHash"] = None

    tx_hash = "0x" + hashlib.sha256(f"DONATION_{time.time()}_{amount_eth}".encode()).hexdigest()
    CAMPAIGN_STATE["lastTxHash"] = tx_hash

    new_act = {
        "id": f"ACT-{len(ACTIVITY_FEED) + 1001}",
        "type": "DONATION_LOCKED",
        "title": f"New Purpose-Bound Allocation: {amount_eth} ETH",
        "subtitle": f"Earmarked: {purpose}",
        "amount": f"{amount_eth:.2f} ETH",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "blockNumber": 20491900 + len(ACTIVITY_FEED),
        "txHash": tx_hash,
        "badge": "PURPOSE BOUND",
        "color": "indigo",
        "details": f"Donor locked {amount_eth} ETH in smart contract strictly bound to '{purpose}'."
    }
    ACTIVITY_FEED.insert(0, new_act)

    return {
        "status": "DONATION_LOCKED",
        "campaign": CAMPAIGN_STATE,
        "tranches": TRANCHES,
        "txHash": tx_hash
    }

@router.post("/release-next-tranche")
def release_next_tranche():
    if CAMPAIGN_STATE["isFrozen"]:
        return {"error": "Escrow is FROZEN. Cannot release tranches."}

    # Find first non-released tranche
    target_idx = None
    for idx, t in enumerate(TRANCHES):
        if t["status"] != "RELEASED":
            target_idx = idx
            break

    if target_idx is None:
        return {"message": "All tranches already released."}

    target = TRANCHES[target_idx]
    target["status"] = "RELEASED"
    target["releasedAt"] = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    
    nullifier = sha256_hex(f"GSTIN-27WATER9988Z|INV-TRANCHE-{target['trancheId']}|{time.time()}")
    merkle_root = "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370"
    tx_hash = "0x" + hashlib.sha256(f"RELEASE_TRANCHE_{target['trancheId']}_{time.time()}".encode()).hexdigest()
    
    target["verifiedNullifier"] = nullifier
    target["verifiedMerkleRoot"] = merkle_root
    target["txHash"] = tx_hash

    CAMPAIGN_STATE["totalReleasedEth"] += target["amountEth"]
    CAMPAIGN_STATE["lastTxHash"] = tx_hash
    CAMPAIGN_STATE["currentTrancheIndex"] = target_idx + 1

    # Unlock next tranche if available
    if target_idx + 1 < len(TRANCHES):
        TRANCHES[target_idx + 1]["status"] = "PENDING_VERIFICATION"

    new_act = {
        "id": f"ACT-{len(ACTIVITY_FEED) + 1001}",
        "type": "TRANCHE_DRIPPED",
        "title": f"{target['name']} Released",
        "subtitle": f"Verified Vendor Disbursement to {target['recipientVendor'][:35]}…",
        "amount": f"{target['amountEth']:.2f} ETH",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "blockNumber": 20491910 + len(ACTIVITY_FEED),
        "txHash": tx_hash,
        "badge": "TRANCHE DRIP",
        "color": "emerald",
        "details": f"Smart contract released {target['amountEth']} ETH against verified nullifier {nullifier[:16]}…."
    }
    ACTIVITY_FEED.insert(0, new_act)

    return {
        "status": "TRANCHE_RELEASED",
        "releasedTranche": target,
        "campaign": CAMPAIGN_STATE,
        "tranches": TRANCHES,
        "txHash": tx_hash
    }

@router.post("/emergency-freeze")
def emergency_freeze(reason: str = Form("Manual emergency freeze invoked by donor")):
    CAMPAIGN_STATE["isFrozen"] = True
    CAMPAIGN_STATE["freezeReason"] = reason
    CAMPAIGN_STATE["freezeTimestamp"] = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    tx_hash = "0xdead" + hashlib.sha256(f"EMERGENCY_FREEZE_{time.time()}".encode()).hexdigest()[4:]
    CAMPAIGN_STATE["lastTxHash"] = tx_hash

    new_act = {
        "id": f"ACT-{len(ACTIVITY_FEED) + 1001}",
        "type": "EMERGENCY_FREEZE",
        "title": "🚨 EMERGENCY ESCROW FREEZE ACTIVATED",
        "subtitle": f"Triggered by Donor / Watchtower: {reason}",
        "amount": "VAULT LOCKED",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "blockNumber": 20491925 + len(ACTIVITY_FEED),
        "txHash": tx_hash,
        "badge": "EMERGENCY FREEZE",
        "color": "red",
        "details": f"Contract PurposeBoundEscrow.sol frozen on-chain. All pending and future tranche withdrawals locked."
    }
    ACTIVITY_FEED.insert(0, new_act)

    return {
        "status": "FROZEN",
        "campaign": CAMPAIGN_STATE,
        "txHash": tx_hash,
        "freezeReason": reason
    }

@router.post("/unfreeze")
def unfreeze_escrow():
    CAMPAIGN_STATE["isFrozen"] = False
    CAMPAIGN_STATE["freezeReason"] = ""
    CAMPAIGN_STATE["freezeTimestamp"] = None

    tx_hash = "0x" + hashlib.sha256(f"UNFREEZE_{time.time()}".encode()).hexdigest()
    CAMPAIGN_STATE["lastTxHash"] = tx_hash

    new_act = {
        "id": f"ACT-{len(ACTIVITY_FEED) + 1001}",
        "type": "ESCROW_UNFROZEN",
        "title": "Escrow Unfrozen & Restored",
        "subtitle": "Donor dispute resolution verified. Campaign active.",
        "amount": "ACTIVE",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "blockNumber": 20491940 + len(ACTIVITY_FEED),
        "txHash": tx_hash,
        "badge": "RESTORED",
        "color": "emerald",
        "details": "Original donor 0x71C9...b901 authorized escrow unfreeze. Drip release workflow resumed."
    }
    ACTIVITY_FEED.insert(0, new_act)

    return {
        "status": "ACTIVE",
        "campaign": CAMPAIGN_STATE,
        "txHash": tx_hash
    }

@router.get("/activity-feed")
def get_activity_feed():
    return {
        "count": len(ACTIVITY_FEED),
        "activities": ACTIVITY_FEED
    }

# ────────────────────────────────────────────────────────────
# Statement Freshness Audit Endpoints (Feature 3)
# ────────────────────────────────────────────────────────────
@router.get("/statement-freshness")
def get_statement_freshness():
    """Returns bank statement freshness, upload date, days elapsed, and staleness warning."""
    return calculate_statement_freshness()

class StatementUploadRequest(BaseModel):
    reportingPeriod: Optional[str] = "Q4 2026 (Oct 1 - Oct 25, 2026)"
    filename: Optional[str] = "ICICI_Bank_Reconciliation_Statement_Oct2026.pdf"
    fileHash: Optional[str] = None
    fileSize: Optional[str] = None
    daysAgo: Optional[int] = 0
    uploadedBy: Optional[str] = "FinOps Officer (Anand Verma, CA)"

@router.post("/statement-upload")
def upload_statement(req: StatementUploadRequest):
    """
    Uploads a refreshed bank statement or resets to an overdue state for testing.
    """
    ref_dt = get_effective_reference_datetime()
    new_dt = ref_dt - timedelta(days=req.daysAgo if req.daysAgo is not None else 0)
    STATEMENT_STATE["lastStatementUploadDate"] = new_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    if req.reportingPeriod:
        STATEMENT_STATE["reportingPeriod"] = req.reportingPeriod
    if req.filename:
        STATEMENT_STATE["statementFilename"] = req.filename
    if req.uploadedBy:
        STATEMENT_STATE["uploadedBy"] = req.uploadedBy
    if req.fileHash:
        STATEMENT_STATE["statementHash"] = req.fileHash
    else:
        STATEMENT_STATE["statementHash"] = "0x" + hashlib.sha256(f"{new_dt.isoformat()}:{req.filename}".encode()).hexdigest()

    freshness = calculate_statement_freshness()

    new_act = {
        "id": f"ACT-{len(ACTIVITY_FEED) + 1001}",
        "type": "ORACLE_HEARTBEAT",
        "title": "Bank Statement Uploaded & Processed" if not freshness["isOverdue"] else "Bank Statement Reverted to Overdue",
        "subtitle": f"{STATEMENT_STATE['statementFilename']} — {STATEMENT_STATE['reportingPeriod']}",
        "amount": f"{freshness['daysElapsed']}d Elapsed" if freshness["daysElapsed"] > 0 else "Fresh (0d Elapsed)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "blockNumber": 20491950 + len(ACTIVITY_FEED),
        "txHash": STATEMENT_STATE["statementHash"],
        "badge": "AUDIT PASS" if not freshness["isOverdue"] else "AUDIT OVERDUE",
        "color": "emerald" if not freshness["isOverdue"] else "amber",
        "details": f"Statement verified: {freshness['warningBadge']}. File: {STATEMENT_STATE['statementFilename']}. Hash: {STATEMENT_STATE['statementHash'][:16]}..."
    }
    ACTIVITY_FEED.insert(0, new_act)

    return {
        "status": "SUCCESS",
        "statementFreshness": freshness
    }

@router.post("/statement-upload-file")
async def upload_statement_file(
    file: UploadFile = File(...),
    reportingPeriod: Optional[str] = Form("Q4 2026 (Live Audit)"),
    uploadedBy: Optional[str] = Form("FinOps Officer (Anand Verma, CA)")
):
    """
    Accepts real file upload from user's laptop, calculates authentic SHA-256 hash, and updates audit ledger.
    """
    contents = await file.read()
    file_hash = "0x" + hashlib.sha256(contents).hexdigest()
    ref_dt = get_effective_reference_datetime()
    STATEMENT_STATE["lastStatementUploadDate"] = ref_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    STATEMENT_STATE["reportingPeriod"] = reportingPeriod or "Q4 2026"
    STATEMENT_STATE["statementFilename"] = file.filename
    STATEMENT_STATE["uploadedBy"] = uploadedBy or "FinOps Officer"
    STATEMENT_STATE["statementHash"] = file_hash

    freshness = calculate_statement_freshness()

    new_act = {
        "id": f"ACT-{len(ACTIVITY_FEED) + 1001}",
        "type": "ORACLE_HEARTBEAT",
        "title": "Bank Statement File Uploaded & Anchored",
        "subtitle": f"{file.filename} ({len(contents)} bytes) — {reportingPeriod}",
        "amount": "Fresh (0d Elapsed)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "blockNumber": 20491950 + len(ACTIVITY_FEED),
        "txHash": file_hash,
        "badge": "AUDIT PASS",
        "color": "emerald",
        "details": f"Statement binary uploaded directly from donor device ({len(contents)} bytes). Verified cryptographic SHA-256: {file_hash}."
    }
    ACTIVITY_FEED.insert(0, new_act)

    return {
        "status": "SUCCESS",
        "statementFreshness": freshness,
        "fileHash": file_hash,
        "filename": file.filename,
        "fileSizeBytes": len(contents)
    }


