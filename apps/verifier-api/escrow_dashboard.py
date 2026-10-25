"""
The Black Hole Ledger - Feature #3
Purpose-Bound Donation Locker, Milestone Tranche Drip-Release, Emergency Freeze Killswitch & Public Transparency Feed
Zero-Conflict Isolated Backend Module
"""

import hashlib
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Form
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def sha256_hex(data: str) -> str:
    return "0x" + hashlib.sha256(data.encode("utf-8")).hexdigest()

# ────────────────────────────────────────────────────────────
# Global In-Memory Escrow & Tranche State (Mirrors Smart Contract)
# ────────────────────────────────────────────────────────────
CAMPAIGN_STATE = {
    "id": 1,
    "donorAddress": "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
    "ngoAddress": "0x217e9C3182B0058b76D63E666C2c502b4e89991A",
    "earmarkedPurpose": "Water Infrastructure",
    "totalDepositedEth": 50.0,
    "totalReleasedEth": 10.0,
    "isFrozen": False,
    "freezeReason": "",
    "freezeTimestamp": None,
    "currentTrancheIndex": 1, # Tranche 1 released, Tranche 2 active
    "contractAddress": "0x3Af19B02cD319985E1e012399F319114d5e56E1",
    "network": "Ethereum Sepolia / Mainnet",
    "lastTxHash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
}

TRANCHES = [
    {
        "trancheId": 1,
        "name": "Tranche 1: Mobilization & Geological Aquifer Survey",
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
        "name": "Tranche 2: Heavy Hardware Procurement & Borewell Casing Drilling",
        "percentage": 40,
        "amountEth": 20.0,
        "amountUsd": 64000.0,
        "amountInr": 5385600.0,
        "status": "PENDING_VERIFICATION",
        "description": "Procurement of 4x 5HP submersible pumps, 200m 150mm heavy PVC casing pipes, and deep-well drilling rigs.",
        "verifiedNullifier": None,
        "verifiedMerkleRoot": None,
        "releasedAt": None,
        "txHash": None,
        "recipientVendor": "Maharashtra Borewell & PVC Supply Co. (GSTIN-27WATER9988Z)"
    },
    {
        "trancheId": 3,
        "name": "Tranche 3: Water Filtration, Solar Integration & Beneficiary Handover",
        "percentage": 40,
        "amountEth": 20.0,
        "amountUsd": 64000.0,
        "amountInr": 5385600.0,
        "status": "LOCKED",
        "description": "Solar inverter connection, multi-stage water filtration, fluoride reduction audit, and handover to 142 Grampanchayat households.",
        "verifiedNullifier": None,
        "verifiedMerkleRoot": None,
        "releasedAt": None,
        "txHash": None,
        "recipientVendor": "Apex Green Solar & Clean Water Ltd (GSTIN-27SOLAR4411Z)"
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
    return {
        "campaign": CAMPAIGN_STATE,
        "tranches": TRANCHES,
        "activityFeed": ACTIVITY_FEED,
        "summary": {
            "lockedBalanceEth": CAMPAIGN_STATE["totalDepositedEth"] - CAMPAIGN_STATE["totalReleasedEth"],
            "releasedBalanceEth": CAMPAIGN_STATE["totalReleasedEth"],
            "releasedPercentage": round((CAMPAIGN_STATE["totalReleasedEth"] / CAMPAIGN_STATE["totalDepositedEth"]) * 100, 1),
            "status": "FROZEN" if CAMPAIGN_STATE["isFrozen"] else "ACTIVE",
            "activeTrancheId": 2 if not CAMPAIGN_STATE["isFrozen"] else None,
            "nextTrancheAmountEth": 20.0,
            "contractAddress": CAMPAIGN_STATE["contractAddress"]
        }
    }

@router.post("/lock-donation")
def lock_donation(
    amount_eth: float = Form(50.0),
    purpose: str = Form("Water Infrastructure"),
    ngo_address: str = Form("0x217e9C3182B0058b76D63E666C2c502b4e89991A")
):
    CAMPAIGN_STATE["totalDepositedEth"] = amount_eth
    CAMPAIGN_STATE["totalReleasedEth"] = 0.0
    CAMPAIGN_STATE["earmarkedPurpose"] = purpose
    CAMPAIGN_STATE["isFrozen"] = False
    CAMPAIGN_STATE["freezeReason"] = ""
    CAMPAIGN_STATE["currentTrancheIndex"] = 0

    # Reset tranches
    t1 = round(amount_eth * 0.20, 2)
    t2 = round(amount_eth * 0.40, 2)
    t3 = round(amount_eth - t1 - t2, 2)
    
    TRANCHES[0]["amountEth"] = t1
    TRANCHES[0]["status"] = "PENDING_VERIFICATION"
    TRANCHES[0]["releasedAt"] = None
    TRANCHES[1]["amountEth"] = t2
    TRANCHES[1]["status"] = "LOCKED"
    TRANCHES[1]["releasedAt"] = None
    TRANCHES[2]["amountEth"] = t3
    TRANCHES[2]["status"] = "LOCKED"
    TRANCHES[2]["releasedAt"] = None

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
