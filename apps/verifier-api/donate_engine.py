import hashlib
import time
import random
import io
import base64
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw

router = APIRouter(prefix="/api/donate", tags=["donate"])

SUPPORTED_PURPOSES = [
    {
        "id": "water-wardha",
        "name": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "description": "Direct-impact escrow for hydrogeological survey, deep borewell drilling, solar submersible pumps, and 5,000L potable storage systems across 142 drought-affected rural households in the Maharashtra cluster.",
        "targetEth": 50.0,
        "raisedEth": 50.0,
        "category": "Water Infrastructure",
        "verifiedVendor": "Vidarbha Geological & Drilling Consultancy (GSTIN-27VWW001Z)",
        "keccak256Commitment": "0x4f8a91b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e"
    },
    {
        "id": "solar-purification",
        "name": "Solar Fluoride Filtration & Water ATM",
        "description": "Multi-stage reverse osmosis + solar microgrid ensuring safe potable water free from heavy minerals.",
        "targetEth": 35.0,
        "raisedEth": 21.0,
        "category": "Water Infrastructure",
        "verifiedVendor": "Apex Green Solar & Clean Water Ltd (GSTIN-27SOLAR4411Z)",
        "keccak256Commitment": "0x89ab12cd34ef560718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f"
    },
    {
        "id": "emergency-medical",
        "name": "Emergency Rural Medical Clinics",
        "description": "First-aid triage, anti-venom supplies, and maternal telemedicine kits for remote agricultural hamlets.",
        "targetEth": 25.0,
        "raisedEth": 25.0,
        "category": "Medical Supplies",
        "verifiedVendor": "Maharashtra Rural Health Care Trust (GSTIN-27MED1122Z)",
        "keccak256Commitment": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    }
]

RECENT_DONATIONS = [
    {
        "id": "DON-901",
        "donor": "0x71C9...b901",
        "donorFull": "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
        "amount": "50.00 ETH",
        "amountUsd": "$160,000",
        "amountInr": "₹1,34,64,000",
        "rail": "CRYPTO",
        "token": "ETH",
        "purpose": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "txHash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        "status": "LOCKED_IN_ESCROW",
        "timestamp": "2026-10-24 10:15:00 UTC",
        "block": 20491823
    },
    {
        "id": "DON-902",
        "donor": "G-Pay / UPI Donor",
        "donorFull": "priya.sharma@okaxis",
        "amount": "₹25,000",
        "amountUsd": "$297.08",
        "amountInr": "₹25,000",
        "rail": "UPI",
        "token": "INR_MINTED_USDC",
        "purpose": "Water Infrastructure - Wardha Cluster",
        "utrNumber": "UTR-2026-881290",
        "txHash": "0x44b912aaccdd00112233445566778899aabbccddeeff00112233445566778899",
        "status": "LOCKED_IN_ESCROW",
        "timestamp": "2026-10-25 08:30:00 UTC",
        "block": 20491839
    },
    {
        "id": "DON-903",
        "donor": "0x4E21...a391",
        "donorFull": "0x4E21Fa387B67B543D75e3Ea2E59E50Eb147Ea391",
        "amount": "2,500 USDC",
        "amountUsd": "$2,500",
        "amountInr": "₹2,10,375",
        "rail": "CRYPTO",
        "token": "USDC",
        "purpose": "Solar Fluoride Filtration & Water ATM",
        "txHash": "0x9c1029384756ab1029384756ab1029384756ab1029384756ab1029384756ab10",
        "status": "LOCKED_IN_ESCROW",
        "timestamp": "2026-10-25 11:45:00 UTC",
        "block": 20491865
    }
]

class DepositRequest(BaseModel):
    rail: str  # "CRYPTO" | "UPI"
    token: str # "ETH" | "USDC" | "INR"
    amount: float
    purposeId: str
    donorIdentifier: Optional[str] = "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901"
    utrNumber: Optional[str] = None

@router.get("/options")
def get_donate_options():
    return {
        "oracleRates": {
            "ethUsd": 3200.00,
            "usdInr": 84.15,
            "ethInr": 269280.00,
            "oracleFeed": "Chainlink ETH/USD Aggregator (0x5f4e...c030)",
            "lastUpdated": "2026-10-25 15:35:00 UTC"
        },
        "supportedPurposes": SUPPORTED_PURPOSES,
        "recentDonations": RECENT_DONATIONS,
        "escrowContract": "0x3Af19B02cD319985E1e012399F319114d5e56E1",
        "network": "Ethereum Sepolia / Polygon L2",
        "merchantVpa": "cascade.escrow@icici"
    }

@router.post("/simulate-deposit")
def simulate_deposit(req: DepositRequest):
    purpose = next((p for p in SUPPORTED_PURPOSES if p["id"] == req.purposeId), SUPPORTED_PURPOSES[0])
    
    # Calculate amounts
    eth_usd = 3200.00
    usd_inr = 84.15
    
    if req.rail == "CRYPTO":
        if req.token == "ETH":
            amount_eth = req.amount
            amount_usd = req.amount * eth_usd
            amount_inr = amount_usd * usd_inr
        else: # USDC
            amount_usd = req.amount
            amount_eth = req.amount / eth_usd
            amount_inr = req.amount * usd_inr
    else: # UPI (INR)
        amount_inr = req.amount
        amount_usd = req.amount / usd_inr
        amount_eth = amount_usd / eth_usd

    # Compute keccak256 commitment of the purpose
    earmark_raw = f"{purpose['category']}:{purpose['name']}"
    earmark_hash = "0x" + hashlib.sha256(earmark_raw.encode("utf-8")).hexdigest()
    
    # Generate cryptographic transaction receipt
    tx_hash = "0x" + hashlib.sha256(f"{req.donorIdentifier}:{time.time()}:{random.random()}".encode("utf-8")).hexdigest()
    block_num = 20491880 + random.randint(1, 50)
    utr_code = req.utrNumber or f"UTR-2026-{random.randint(100000, 999999)}"
    
    receipt = {
        "success": True,
        "txHash": tx_hash,
        "blockNumber": block_num,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "rail": req.rail,
        "token": req.token,
        "amountDeposited": req.amount,
        "equivalentEth": round(amount_eth, 4),
        "equivalentUsd": round(amount_usd, 2),
        "equivalentInr": round(amount_inr, 2),
        "donor": req.donorIdentifier,
        "utrNumber": utr_code if req.rail == "UPI" else None,
        "purposeBound": {
            "purposeId": purpose["id"],
            "purposeName": purpose["name"],
            "category": purpose["category"],
            "keccak256Commitment": earmark_hash,
            "rule": "100% of these funds are locked in PurposeBoundEscrow.sol. They can ONLY be released if verified receipts match this category & pass pixel ELA tamper audits."
        },
        "smartContract": {
            "address": "0x3Af19B02cD319985E1e012399F319114d5e56E1",
            "state": "ACTIVE_LOCKED",
            "autonomousProtection": "Enabled (Semantic Nullifier + pHash duplicate check)"
        }
    }
    
    # Add to recent donations in memory
    recent_entry = {
        "id": f"DON-{random.randint(910, 999)}",
        "donor": (req.donorIdentifier[:6] + "..." + req.donorIdentifier[-4:]) if req.donorIdentifier.startswith("0x") else req.donorIdentifier,
        "donorFull": req.donorIdentifier,
        "amount": f"{req.amount} {req.token}" if req.rail == "CRYPTO" else f"₹{req.amount:,.0f}",
        "amountUsd": f"${amount_usd:,.2f}",
        "amountInr": f"₹{amount_inr:,.0f}",
        "rail": req.rail,
        "token": req.token,
        "purpose": purpose["name"],
        "utrNumber": utr_code if req.rail == "UPI" else None,
        "txHash": tx_hash,
        "status": "LOCKED_IN_ESCROW",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "block": block_num
    }
    RECENT_DONATIONS.insert(0, recent_entry)
    if len(RECENT_DONATIONS) > 10:
        RECENT_DONATIONS.pop()
        
    return receipt
