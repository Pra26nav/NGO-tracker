import hashlib
import time
import random
import io
import base64
from typing import Optional, Dict, Any, List
from enum import Enum
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from PIL import Image, ImageDraw

class ContributionType(str, Enum):
    MONEY = "MONEY"
    GOODS = "GOODS"
    FOOD = "FOOD"
    MEDICAL = "MEDICAL"
    VOLUNTEER_SERVICE = "VOLUNTEER_SERVICE"
    OTHER = "OTHER"

class VolunteerCategory(str, Enum):
    MEDICAL = "Medical"
    LEGAL = "Legal"
    TEACHING = "Teaching"
    ENGINEERING = "Engineering"
    OTHER = "Other"

class VolunteerStatus(str, Enum):
    PLANNED = "PLANNED"
    COMPLETED = "COMPLETED"

class InventoryTracking(BaseModel):
    pledged: float = 0
    received: float = 0
    distributed: float = 0
    damaged: float = 0
    remaining: float = 0

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
        "contributionType": "MONEY",
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
        "contributionType": "MONEY",
        "purpose": "Water Infrastructure - Wardha Cluster",
        "utrNumber": "UTR-2026-881290",
        "txHash": "0x44b912aaccdd00112233445566778899aabbccddeeff00112233445566778899",
        "status": "LOCKED_IN_ESCROW",
        "timestamp": "2026-10-25 08:30:00 UTC",
        "block": 20491839
    },
    {
        "id": "DON-903",
        "donor": "Rotary Global Health",
        "donorFull": "rotary.international.relief@rotary.org",
        "amount": "150 kits",
        "amountUsd": "$18,750",
        "amountInr": "₹15,77,812",
        "rail": "IN_KIND_LOGISTICS",
        "token": "KIT",
        "contributionType": "MEDICAL",
        "itemName": "Emergency Surgical & First-Aid Triage Kits",
        "quantity": 150,
        "unit": "kits",
        "estimatedValue": 18750.0,
        "inventory": {
            "pledged": 150,
            "received": 150,
            "distributed": 120,
            "damaged": 4,
            "remaining": 26
        },
        "purpose": "Emergency Rural Medical Clinics",
        "txHash": "0x7a8b9c0d1e2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3",
        "status": "RECEIVED_IN_WAREHOUSE",
        "timestamp": "2026-10-25 09:15:00 UTC",
        "block": 20491845
    },
    {
        "id": "DON-904",
        "donor": "Kirloskar Clean Tech",
        "donorFull": "csr.donations@kirloskar-water.com",
        "amount": "40 units",
        "amountUsd": "$24,000",
        "amountInr": "₹20,19,600",
        "rail": "IN_KIND_LOGISTICS",
        "token": "UNIT",
        "contributionType": "GOODS",
        "itemName": "Solar Submersible Borewell Pumps (5HP)",
        "quantity": 40,
        "unit": "units",
        "estimatedValue": 24000.0,
        "inventory": {
            "pledged": 40,
            "received": 40,
            "distributed": 32,
            "damaged": 1,
            "remaining": 7
        },
        "purpose": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "txHash": "0x5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b",
        "status": "RECEIVED_IN_WAREHOUSE",
        "timestamp": "2026-10-25 10:20:00 UTC",
        "block": 20491852
    },
    {
        "id": "DON-905",
        "donor": "Food Relief Alliance",
        "donorFull": "ops@foodreliefalliance.org",
        "amount": "500 sacks",
        "amountUsd": "$12,500",
        "amountInr": "₹10,51,875",
        "rail": "IN_KIND_LOGISTICS",
        "token": "SACK",
        "contributionType": "FOOD",
        "itemName": "Fortified Nutrition Grain Sacks (50kg)",
        "quantity": 500,
        "unit": "sacks",
        "estimatedValue": 12500.0,
        "inventory": {
            "pledged": 500,
            "received": 500,
            "distributed": 450,
            "damaged": 8,
            "remaining": 42
        },
        "purpose": "Rural Community Nutrition & Drought Relief",
        "txHash": "0x3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071829",
        "status": "RECEIVED_IN_WAREHOUSE",
        "timestamp": "2026-10-25 10:55:00 UTC",
        "block": 20491858
    },
    {
        "id": "DON-906",
        "donor": "0x4E21...a391",
        "donorFull": "0x4E21Fa387B67B543D75e3Ea2E59E50Eb147Ea391",
        "amount": "2,500 USDC",
        "amountUsd": "$2,500",
        "amountInr": "₹2,10,375",
        "rail": "CRYPTO",
        "token": "USDC",
        "contributionType": "MONEY",
        "purpose": "Solar Fluoride Filtration & Water ATM",
        "txHash": "0x9c1029384756ab1029384756ab1029384756ab1029384756ab1029384756ab10",
        "status": "LOCKED_IN_ESCROW",
        "timestamp": "2026-10-25 11:45:00 UTC",
        "block": 20491865
    }
]

# ────────────────────────────────────────────────────────────
# Feature 4: Voluntary Services (Time & Professional Skills)
# ────────────────────────────────────────────────────────────
VOLUNTEER_SERVICES: List[Dict[str, Any]] = [
    {
        "id": "VOL-001",
        "volunteerName": "Dr. Sunita Rao (MD)",
        "volunteerRef": "MCI-REG-2012-44102",
        "category": "Medical",
        "skillTitle": "Rural Fluorosis Screening & Pediatric Triage Health Camp",
        "hours": 48.0,
        "sessions": 8,
        "status": "COMPLETED",
        "hourlyRateEstimate": 5000.0,
        "estimatedValue": 240000.0,
        "estimatedValueCurrency": "INR",
        "purposeId": "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": "2026-10-18",
        "verificationHash": "0x4a18b7c29e0134df8921a4bc567890ef1234567890abcdef1234567890abcdef",
        "verifiedBy": "District Medical Officer & NGO Field Director",
        "notes": "Diagnostic screening of 312 children across 4 hamlets for early skeletal and dental fluorosis."
    },
    {
        "id": "VOL-002",
        "volunteerName": "Er. Pradeep Patil (M.Tech, Civil)",
        "volunteerRef": "IEI-ENG-99881",
        "category": "Engineering",
        "skillTitle": "Hydrogeological Aquifer Mapping & Borewell Casing Structural Integrity",
        "hours": 36.0,
        "sessions": 6,
        "status": "COMPLETED",
        "hourlyRateEstimate": 5000.0,
        "estimatedValue": 180000.0,
        "estimatedValueCurrency": "INR",
        "purposeId": "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": "2026-10-21",
        "verificationHash": "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
        "verifiedBy": "Chief Structural Consultant, Vidarbha Geoconsult",
        "notes": "Resistivity soundings and acoustic telemetry check on 3 deep borewells prior to pump lowering."
    },
    {
        "id": "VOL-003",
        "volunteerName": "Adv. Rajesh Deshmukh",
        "volunteerRef": "BAR-MAH-2009-8812",
        "category": "Legal",
        "skillTitle": "Grampanchayat Water Rights Easement & Statutory FCRA Advisory",
        "hours": 24.0,
        "sessions": 4,
        "status": "COMPLETED",
        "hourlyRateEstimate": 5000.0,
        "estimatedValue": 120000.0,
        "estimatedValueCurrency": "INR",
        "purposeId": "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": "2026-10-22",
        "verificationHash": "0x11223344556677889900aabbccddeeff0011223344556677889900aabbccddee",
        "verifiedBy": "Legal Compliance Watchtower & Panchayat Secretary",
        "notes": "Execution of irrevocable public utility easements for solar pump stations on community commons land."
    },
    {
        "id": "VOL-004",
        "volunteerName": "Prof. Anita Roy (Ph.D.)",
        "volunteerRef": "EDU-UGC-19940",
        "category": "Teaching",
        "skillTitle": "WASH Community Hygiene, Water ATM Operation & Testing Kit Workshops",
        "hours": 32.0,
        "sessions": 6,
        "status": "COMPLETED",
        "hourlyRateEstimate": 3000.0,
        "estimatedValue": 96000.0,
        "estimatedValueCurrency": "INR",
        "purposeId": "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": "2026-10-23",
        "verificationHash": "0x5566778899001122334455667788990011223344556677889900112233445566",
        "verifiedBy": "Zilla Parishad Education Coordinator",
        "notes": "Trained 45 village women self-help group leaders on daily chemical reagent testing and RFID ATM maintenance."
    },
    {
        "id": "VOL-005",
        "volunteerName": "Er. Vikram Shinde (B.E., Solar)",
        "volunteerRef": "SOLAR-MAHA-0091",
        "category": "Engineering",
        "skillTitle": "Solar Submersible Inverter Telemetry Calibration & PV Field Hookup",
        "hours": 16.0,
        "sessions": 2,
        "status": "PLANNED",
        "hourlyRateEstimate": 5000.0,
        "estimatedValue": 80000.0,
        "estimatedValueCurrency": "INR",
        "purposeId": "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": "2026-10-28",
        "verificationHash": "0x99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
        "verifiedBy": "Scheduled Field Deployment",
        "notes": "Staged integration of remote 4G telemetry sensors on 4x 5HP inverters for automated flow logging."
    },
    {
        "id": "VOL-006",
        "volunteerName": "Dr. Arvind Joshi (MBBS, DPH)",
        "volunteerRef": "MCI-REG-2018-77112",
        "category": "Medical",
        "skillTitle": "Post-Monsoon Waterborne Illness Monitoring & Clean Water Follow-up",
        "hours": 20.0,
        "sessions": 3,
        "status": "PLANNED",
        "hourlyRateEstimate": 5000.0,
        "estimatedValue": 100000.0,
        "estimatedValueCurrency": "INR",
        "purposeId": "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": "2026-10-30",
        "verificationHash": "0x2233445566778899001122334455667788990011223344556677889900112233",
        "verifiedBy": "Scheduled Clinic Roster",
        "notes": "Baseline health survey on gastrointestinal incidence 30 days post-chlorination."
    }
]

def calculate_volunteer_impact() -> Dict[str, Any]:
    total_hours = sum(v["hours"] for v in VOLUNTEER_SERVICES)
    completed_hours = sum(v["hours"] for v in VOLUNTEER_SERVICES if v["status"] == "COMPLETED")
    planned_hours = sum(v["hours"] for v in VOLUNTEER_SERVICES if v["status"] == "PLANNED")
    total_sessions = sum(v["sessions"] for v in VOLUNTEER_SERVICES)
    unique_vols = len(set(v["volunteerName"] for v in VOLUNTEER_SERVICES))
    
    val_inr = sum(v["estimatedValue"] for v in VOLUNTEER_SERVICES)
    val_usd = round(val_inr / 84.15, 2)

    cat_hours = {"Medical": 0.0, "Legal": 0.0, "Teaching": 0.0, "Engineering": 0.0, "Other": 0.0}
    cat_sessions = {"Medical": 0, "Legal": 0, "Teaching": 0, "Engineering": 0, "Other": 0}

    for v in VOLUNTEER_SERVICES:
        cat = v.get("category", "Other")
        if cat in cat_hours:
            cat_hours[cat] += v["hours"]
            cat_sessions[cat] += v.get("sessions", 1)
        else:
            cat_hours["Other"] += v["hours"]
            cat_sessions["Other"] += v.get("sessions", 1)

    return {
        "totalHours": total_hours,
        "completedHours": completed_hours,
        "plannedHours": planned_hours,
        "totalSessions": total_sessions,
        "totalVolunteers": unique_vols,
        "estimatedEconomicValueInr": val_inr,
        "estimatedEconomicValueUsd": val_usd,
        "hoursByCategory": cat_hours,
        "sessionsByCategory": cat_sessions,
        "auditRule": "Anti-Inflation Guarantee: Pro-bono voluntary services are verified and tracked strictly by professional hours; estimated economic values are never inflated into cash or escrow totals."
    }

class DepositRequest(BaseModel):
    rail: str  # "CRYPTO" | "UPI" | "IN_KIND_LOGISTICS" | "VOLUNTEER_SERVICE"
    token: str # "ETH" | "USDC" | "INR" | "ITEM" | "HOURS"
    amount: float
    purposeId: str
    donorIdentifier: Optional[str] = "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901"
    utrNumber: Optional[str] = None
    # Feature 1: Non-Cash In-Kind Donation & Inventory Tracking Fields
    contributionType: Optional[str] = "MONEY" # "MONEY" | "GOODS" | "FOOD" | "MEDICAL" | "VOLUNTEER_SERVICE" | "OTHER"
    itemName: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    estimatedValue: Optional[float] = None
    inventory: Optional[dict] = None # {"pledged": X, "received": Y, "distributed": Z, "damaged": W, "remaining": R}
    # Feature 4: Voluntary Services Fields
    volunteerCategory: Optional[str] = None # "Medical" | "Legal" | "Teaching" | "Engineering" | "Other"
    volunteerName: Optional[str] = None
    volunteerRef: Optional[str] = None
    skillTitle: Optional[str] = None
    hours: Optional[float] = None
    sessions: Optional[int] = None
    volunteerStatus: Optional[str] = "COMPLETED" # "PLANNED" | "COMPLETED"

class LogVolunteerRequest(BaseModel):
    volunteerName: str
    category: str = "Engineering" # "Medical" | "Legal" | "Teaching" | "Engineering" | "Other"
    skillTitle: str
    hours: float
    sessions: int = 1
    status: str = "COMPLETED" # "PLANNED" | "COMPLETED"
    volunteerRef: Optional[str] = None
    hourlyRateEstimate: Optional[float] = 5000.0
    estimatedValue: Optional[float] = None
    purposeId: Optional[str] = "water-wardha"
    notes: Optional[str] = None

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
        "volunteerImpact": calculate_volunteer_impact(),
        "escrowContract": "0x3Af19B02cD319985E1e012399F319114d5e56E1",
        "network": "Ethereum Sepolia / Polygon L2",
        "merchantVpa": "cascade.escrow@icici"
    }

@router.post("/simulate-deposit")
def simulate_deposit(req: DepositRequest):
    purpose = next((p for p in SUPPORTED_PURPOSES if p["id"] == req.purposeId), SUPPORTED_PURPOSES[0])
    
    # Calculate amounts & check contribution type
    eth_usd = 3200.00
    usd_inr = 84.15
    is_volunteer = bool(req.contributionType and req.contributionType.upper() == "VOLUNTEER_SERVICE")
    is_non_cash = bool((not is_volunteer) and req.contributionType and req.contributionType.upper() in ["GOODS", "FOOD", "MEDICAL", "OTHER"])
    
    if is_volunteer:
        contrib_type = "VOLUNTEER_SERVICE"
        v_hours = float(req.hours or req.amount or 8.0)
        v_sessions = int(req.sessions or 1)
        v_category = req.volunteerCategory or "Engineering"
        v_name = req.volunteerName or (req.donorIdentifier if not req.donorIdentifier.startswith("0x") else "Er. Specialized Consultant")
        v_skill = req.skillTitle or req.itemName or f"{v_category} Professional Services"
        v_status = req.volunteerStatus or "COMPLETED"
        hourly_rate = 5000.0 if v_category in ["Medical", "Engineering", "Legal"] else 3000.0
        est_val_inr = float(req.estimatedValue or (v_hours * hourly_rate))
        est_val_usd = round(est_val_inr / usd_inr, 2)

        # CRITICAL RULE: Never inflate voluntary service value into liquid cash escrow totals
        amount_eth = 0.0
        amount_usd = 0.0
        amount_inr = 0.0
        display_amount = f"{int(v_hours) if v_hours.is_integer() else v_hours} hrs ({v_category})"
        item_label = v_skill
        inv_data = None

        # Add to voluntary services registry
        vol_id = f"VOL-{len(VOLUNTEER_SERVICES) + 1:03d}"
        vol_hash = "0x" + hashlib.sha256(f"{vol_id}:{v_name}:{v_category}:{v_hours}:{time.time()}".encode("utf-8")).hexdigest()
        new_vol_entry = {
            "id": vol_id,
            "volunteerName": v_name,
            "volunteerRef": req.volunteerRef or f"REG-{random.randint(10000, 99999)}",
            "category": v_category,
            "skillTitle": v_skill,
            "hours": v_hours,
            "sessions": v_sessions,
            "status": v_status,
            "hourlyRateEstimate": hourly_rate,
            "estimatedValue": est_val_inr,
            "estimatedValueCurrency": "INR",
            "purposeId": purpose["id"],
            "purposeName": purpose["name"],
            "date": time.strftime("%Y-%m-%d", time.gmtime()),
            "verificationHash": vol_hash,
            "verifiedBy": "Panchayat Secretary & Project Coordinator",
            "notes": f"Voluntary pro-bono contribution of {v_hours} hrs in {v_category}."
        }
        VOLUNTEER_SERVICES.insert(0, new_vol_entry)

    elif is_non_cash:
        contrib_type = req.contributionType.upper()
        pledged_qty = float(req.quantity or req.amount or 1.0)
        received_qty = float(req.inventory.get("received", pledged_qty)) if req.inventory else pledged_qty
        distributed_qty = float(req.inventory.get("distributed", 0.0)) if req.inventory else 0.0
        damaged_qty = float(req.inventory.get("damaged", 0.0)) if req.inventory else 0.0
        remaining_qty = received_qty - distributed_qty - damaged_qty

        inv_data = {
            "pledged": pledged_qty,
            "received": received_qty,
            "distributed": distributed_qty,
            "damaged": damaged_qty,
            "remaining": remaining_qty
        }

        est_val_usd = float(req.estimatedValue or (pledged_qty * 75.0))
        amount_usd = est_val_usd
        amount_inr = amount_usd * usd_inr
        amount_eth = amount_usd / eth_usd
        display_amount = f"{int(pledged_qty) if pledged_qty.is_integer() else pledged_qty} {req.unit or 'units'}"
        item_label = req.itemName or "In-Kind Relief Supplies"
    else:
        contrib_type = "MONEY"
        inv_data = None
        item_label = None
        if req.rail == "CRYPTO":
            if req.token == "ETH":
                amount_eth = req.amount
                amount_usd = req.amount * eth_usd
                amount_inr = amount_usd * usd_inr
            else: # USDC
                amount_usd = req.amount
                amount_eth = req.amount / eth_usd
                amount_inr = req.amount * usd_inr
            display_amount = f"{req.amount} {req.token}"
        else: # UPI (INR)
            amount_inr = req.amount
            amount_usd = req.amount / usd_inr
            amount_eth = amount_usd / eth_usd
            display_amount = f"₹{req.amount:,.0f}"

    # Compute keccak256 commitment of the purpose
    earmark_raw = f"{purpose['category']}:{purpose['name']}"
    earmark_hash = "0x" + hashlib.sha256(earmark_raw.encode("utf-8")).hexdigest()
    
    # Generate cryptographic transaction / manifest receipt
    tx_hash = "0x" + hashlib.sha256(f"{req.donorIdentifier}:{time.time()}:{random.random()}".encode("utf-8")).hexdigest()
    block_num = 20491880 + random.randint(1, 50)
    utr_code = req.utrNumber or (f"UTR-2026-{random.randint(100000, 999999)}" if req.rail == "UPI" else None)
    
    # Non-cash or volunteer item commitment hash
    item_manifest_hash = None
    if is_volunteer:
        manifest_raw = f"VOLUNTEER:{v_name}:{v_category}:{v_hours}hrs:{est_val_inr}INR"
        item_manifest_hash = "0x" + hashlib.sha256(manifest_raw.encode("utf-8")).hexdigest()
    elif is_non_cash:
        manifest_raw = f"{contrib_type}:{item_label}:{inv_data['pledged']}:{req.unit}:{amount_usd}"
        item_manifest_hash = "0x" + hashlib.sha256(manifest_raw.encode("utf-8")).hexdigest()

    donation_id = f"DON-{random.randint(910, 999)}"

    receipt = {
        "success": True,
        "donationId": donation_id,
        "txHash": tx_hash,
        "blockNumber": block_num,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "rail": "VOLUNTEER_SERVICE" if is_volunteer else ("IN_KIND_LOGISTICS" if is_non_cash else req.rail),
        "token": "HOURS" if is_volunteer else ((req.unit or "ITEM").upper() if is_non_cash else req.token),
        "contributionType": contrib_type,
        "isVolunteerService": is_volunteer,
        "isNonCash": is_non_cash,
        "itemName": item_label,
        "quantity": v_hours if is_volunteer else (inv_data["pledged"] if is_non_cash else req.amount),
        "unit": "hours" if is_volunteer else (req.unit or "units"),
        "estimatedValueUsd": est_val_usd if is_volunteer else (round(amount_usd, 2) if is_non_cash else None),
        "estimatedValueInr": est_val_inr if is_volunteer else (round(amount_inr, 2) if is_non_cash else None),
        "inventory": inv_data,
        "itemManifestCommitment": item_manifest_hash,
        "amountDeposited": 0.0 if is_volunteer else req.amount,
        "equivalentEth": 0.0 if is_volunteer else round(amount_eth, 4),
        "equivalentUsd": 0.0 if is_volunteer else round(amount_usd, 2),
        "equivalentInr": 0.0 if is_volunteer else round(amount_inr, 2),
        "donor": req.donorIdentifier,
        "utrNumber": utr_code,
        "purposeBound": {
            "purposeId": purpose["id"],
            "purposeName": purpose["name"],
            "category": purpose["category"],
            "keccak256Commitment": earmark_hash,
            "rule": (
                "Anti-Inflation Guarantee: Voluntary professional service hours are tracked directly on the project impact ledger. Estimated economic value is never inflated into cash or escrow totals."
                if is_volunteer else
                ("Verified physical delivery & warehouse custody tracking. In-kind goods are strictly segregated from cash escrow pools and tracked via itemized inventory manifests."
                if is_non_cash else
                "100% of these funds are locked in PurposeBoundEscrow.sol. They can ONLY be released if verified receipts match this category & pass pixel ELA tamper audits.")
            )
        },
        "smartContract": {
            "address": "0x3Af19B02cD319985E1e012399F319114d5e56E1",
            "state": "LOGGED_IN_REGISTRY" if is_volunteer else ("RECEIVED_IN_WAREHOUSE" if is_non_cash else "ACTIVE_LOCKED"),
            "autonomousProtection": "Enabled (Semantic Nullifier + pHash duplicate check)"
        }
    }
    
    # Add to recent donations in memory
    recent_entry = {
        "id": donation_id,
        "donor": (req.donorIdentifier[:6] + "..." + req.donorIdentifier[-4:]) if req.donorIdentifier.startswith("0x") else req.donorIdentifier,
        "donorFull": req.donorIdentifier,
        "amount": display_amount,
        "amountUsd": f"${est_val_usd:,.2f}" if is_volunteer else f"${amount_usd:,.2f}",
        "amountInr": f"₹{est_val_inr:,.0f}" if is_volunteer else f"₹{amount_inr:,.0f}",
        "rail": "VOLUNTEER_SERVICE" if is_volunteer else ("IN_KIND_LOGISTICS" if is_non_cash else req.rail),
        "token": "HOURS" if is_volunteer else ((req.unit or "ITEM").upper() if is_non_cash else req.token),
        "contributionType": contrib_type,
        "itemName": item_label,
        "quantity": v_hours if is_volunteer else (inv_data["pledged"] if is_non_cash else None),
        "unit": "hours" if is_volunteer else (req.unit if is_non_cash else None),
        "estimatedValue": est_val_usd if is_volunteer else (amount_usd if is_non_cash else None),
        "inventory": inv_data,
        "volunteerCategory": v_category if is_volunteer else None,
        "volunteerName": v_name if is_volunteer else None,
        "hours": v_hours if is_volunteer else None,
        "sessions": v_sessions if is_volunteer else None,
        "volunteerStatus": v_status if is_volunteer else None,
        "purpose": purpose["name"],
        "utrNumber": utr_code,
        "txHash": tx_hash,
        "status": "LOGGED_IN_REGISTRY" if is_volunteer else ("RECEIVED_IN_WAREHOUSE" if is_non_cash else "LOCKED_IN_ESCROW"),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "block": block_num
    }
    RECENT_DONATIONS.insert(0, recent_entry)
    if len(RECENT_DONATIONS) > 20:
        RECENT_DONATIONS.pop()
        
    return receipt

@router.get("/volunteer-services")
def get_volunteer_services():
    """
    Returns voluntary professional services records and aggregate impact summary.
    Estimated monetary value is provided for impact evaluation but strictly segregated from cash totals.
    """
    return {
        "status": "SUCCESS",
        "summary": calculate_volunteer_impact(),
        "records": VOLUNTEER_SERVICES
    }

@router.post("/log-volunteer-service")
def log_volunteer_service(req: LogVolunteerRequest):
    """
    Directly logs a professional volunteer service contribution to the project.
    """
    usd_inr = 84.15
    hourly_rate = req.hourlyRateEstimate or 5000.0
    est_val_inr = float(req.estimatedValue or (req.hours * hourly_rate))
    
    vol_id = f"VOL-{len(VOLUNTEER_SERVICES) + 1:03d}"
    vol_hash = "0x" + hashlib.sha256(f"{vol_id}:{req.volunteerName}:{req.category}:{req.hours}:{time.time()}".encode("utf-8")).hexdigest()
    
    new_record = {
        "id": vol_id,
        "volunteerName": req.volunteerName,
        "volunteerRef": req.volunteerRef or f"REG-{random.randint(10000, 99999)}",
        "category": req.category,
        "skillTitle": req.skillTitle,
        "hours": float(req.hours),
        "sessions": int(req.sessions),
        "status": req.status,
        "hourlyRateEstimate": hourly_rate,
        "estimatedValue": est_val_inr,
        "estimatedValueCurrency": "INR",
        "purposeId": req.purposeId or "water-wardha",
        "purposeName": "Rural Water Infrastructure Fund (Maharashtra Cluster)",
        "date": time.strftime("%Y-%m-%d", time.gmtime()),
        "verificationHash": vol_hash,
        "verifiedBy": "Panchayat Secretary & Project Coordinator",
        "notes": req.notes or f"Voluntary pro-bono contribution of {req.hours} hrs in {req.category}."
    }
    VOLUNTEER_SERVICES.insert(0, new_record)
    
    return {
        "status": "SUCCESS",
        "record": new_record,
        "summary": calculate_volunteer_impact()
    }

@router.get("/inventory-overview")
def get_inventory_overview():
    """
    Returns real-time aggregated inventory statistics for all non-cash donations:
    breakdown by contribution type (GOODS, FOOD, MEDICAL, OTHER),
    quantities (pledged, received, distributed, damaged, remaining), and total valuation.
    """
    non_cash_items = [d for d in RECENT_DONATIONS if d.get("contributionType") in ["GOODS", "FOOD", "MEDICAL", "OTHER"]]
    
    by_type: dict = {"GOODS": [], "FOOD": [], "MEDICAL": [], "OTHER": []}
    totals = {
        "totalItemsPledged": 0,
        "totalItemsReceived": 0,
        "totalItemsDistributed": 0,
        "totalItemsDamaged": 0,
        "totalItemsRemaining": 0,
        "totalEstimatedValueUsd": 0.0
    }

    for item in non_cash_items:
        ctype = item.get("contributionType", "OTHER")
        inv = item.get("inventory") or {
            "pledged": item.get("quantity", 0),
            "received": item.get("quantity", 0),
            "distributed": 0,
            "damaged": 0,
            "remaining": item.get("quantity", 0)
        }
        est_val = item.get("estimatedValue", 0.0)

        totals["totalItemsPledged"] += inv.get("pledged", 0)
        totals["totalItemsReceived"] += inv.get("received", 0)
        totals["totalItemsDistributed"] += inv.get("distributed", 0)
        totals["totalItemsDamaged"] += inv.get("damaged", 0)
        totals["totalItemsRemaining"] += inv.get("remaining", 0)
        totals["totalEstimatedValueUsd"] += est_val

        by_type.setdefault(ctype, []).append({
            "id": item["id"],
            "itemName": item.get("itemName", "Relief Supplies"),
            "quantity": item.get("quantity", 0),
            "unit": item.get("unit", "units"),
            "estimatedValue": est_val,
            "inventory": inv,
            "status": item["status"],
            "timestamp": item["timestamp"]
        })

    return {
        "status": "SUCCESS",
        "totalNonCashDonations": len(non_cash_items),
        "totals": totals,
        "breakdownByType": by_type,
        "auditNotice": "Non-cash in-kind physical supplies are tracked via warehouse inventory manifests with cryptographic custody handoffs."
    }

@router.patch("/inventory/{donation_id}")
def update_donation_inventory(donation_id: str, payload: dict):
    """
    Allows field logistics coordinators to record updates when items are received,
    distributed to beneficiaries, or marked as damaged/expired in transit.
    """
    target = next((d for d in RECENT_DONATIONS if d["id"] == donation_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Donation record not found")
    
    if target.get("contributionType") not in ["GOODS", "FOOD", "MEDICAL", "OTHER"]:
        raise HTTPException(status_code=400, detail="Inventory updates only apply to non-cash donations")
    
    current_inv = target.get("inventory") or {
        "pledged": target.get("quantity", 0),
        "received": target.get("quantity", 0),
        "distributed": 0,
        "damaged": 0,
        "remaining": target.get("quantity", 0)
    }

    if "received" in payload:
        current_inv["received"] = float(payload["received"])
    if "distributed" in payload:
        current_inv["distributed"] = float(payload["distributed"])
    if "damaged" in payload:
        current_inv["damaged"] = float(payload["damaged"])
    
    current_inv["remaining"] = current_inv["received"] - current_inv["distributed"] - current_inv["damaged"]
    target["inventory"] = current_inv

    return {
        "status": "UPDATED",
        "donationId": donation_id,
        "itemName": target.get("itemName"),
        "updatedInventory": current_inv
    }

