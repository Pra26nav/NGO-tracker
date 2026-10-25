import hashlib
import time
from typing import Optional, List
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/history", tags=["history"])

AUDIT_RECORDS = [
    {
        "id": "AUD-1001",
        "timestamp": "2026-10-25 11:42:15 UTC",
        "blockNumber": 20491892,
        "txHash": "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
        "eventType": "CIRCUIT_BREAKER_TRIP",
        "category": "Water Infrastructure",
        "amountEth": 50.0,
        "amountUsd": 160000.0,
        "amountInr": 13464000.0,
        "entity": "Nagpur Hydro Pipes Pvt Ltd",
        "taxId": "GSTIN-27AAACW1234F1Z5",
        "invoiceNumber": "INV-2026-8841",
        "nullifier": "0x6e21a9b8d4c177e091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708",
        "phash": "a4f09b22c1d88310",
        "hammingDistance": 2,
        "elaScore": 6.8,
        "status": "DOUBLE_SPEND",
        "verdict": "ESCROW_FROZEN",
        "contractEvent": "EscrowAutoFrozen(bytes32 indexed nullifier, string reason)",
        "details": "Receipt claimed under Donor Pool A was cropped by 2px to alter SHA-256 hash. Caught via Semantic Nullifier & pHash registry matching (Hamming Distance = 2 < 5 threshold). PurposeBoundEscrow.sol locked.",
        "merkleRoot": "0x55a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f"
    },
    {
        "id": "AUD-1002",
        "timestamp": "2026-10-25 10:14:00 UTC",
        "blockNumber": 20491870,
        "txHash": "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
        "eventType": "TRANCHE_RELEASE",
        "category": "Water Infrastructure",
        "amountEth": 10.0,
        "amountUsd": 32000.0,
        "amountInr": 2692800.0,
        "entity": "Vidarbha Geological & Drilling Consultancy",
        "taxId": "GSTIN-27VWW001Z",
        "invoiceNumber": "INV-2026-1001",
        "nullifier": "0x88c1901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e1",
        "phash": "1a2b3c4d5e6f7a8b",
        "hammingDistance": 28,
        "elaScore": 1.2,
        "status": "VERIFIED",
        "verdict": "VERIFIED_RELEASE",
        "contractEvent": "ExpenditureVerified(bytes32 indexed nullifier, address indexed vendor, uint256 amount)",
        "details": "Clean water borehole geological mapping invoice verified. OCR category matched, zero pHash collisions, and ELA pixel tampering score = 1.2% (< 5% threshold). Tranche 1 disbursed.",
        "merkleRoot": "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370"
    },
    {
        "id": "AUD-1003",
        "timestamp": "2026-10-25 09:41:05 UTC",
        "blockNumber": 20491862,
        "txHash": "0xdead00334499ff118822ee33aa44bb556677889900112233445566778899aabb",
        "eventType": "BRIDGE_TRANSFER",
        "category": "Cross-Chain State Sync",
        "amountEth": 7.39,
        "amountUsd": 23656.32,
        "amountInr": 1990679.33,
        "entity": "Undeclared Offshore Shadow Entity",
        "taxId": "CAYMAN-TRUST-#882104-B",
        "invoiceNumber": "BRIDGE-FEE-DISCREPANCY",
        "nullifier": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "phash": "0000000000000000",
        "hammingDistance": 0,
        "elaScore": 0.0,
        "status": "SKIMMING",
        "verdict": "FLAGGED_INVESTIGATION",
        "contractEvent": "SlippageBreached(uint256 expected, uint256 actual, uint256 discrepancyBps)",
        "details": "NGO claimed 15.2% bridge fee for L1-to-L2 gas transfer. Chainlink Gas Oracle proved actual gas was $63.90 (0.04%). $23,656.32 diverted to shadow wallet 0x9b31...6318.",
        "merkleRoot": "0x77ba9012cd34567890abcdef1234567890abcdef1234567890abcdef1234fe91"
    },
    {
        "id": "AUD-1004",
        "timestamp": "2026-10-25 08:30:00 UTC",
        "blockNumber": 20491839,
        "txHash": "0x44b912aaccdd00112233445566778899aabbccddeeff00112233445566778899",
        "eventType": "INBOUND_DONATION",
        "category": "Water Infrastructure",
        "amountEth": 0.0928,
        "amountUsd": 297.08,
        "amountInr": 25000.0,
        "entity": "Priya Sharma (UPI Donor)",
        "taxId": "UTR-2026-881290",
        "invoiceNumber": "UPI-SETTLEMENT-902",
        "nullifier": "0x33aa44bb55cc66dd77ee88ff9900112233445566778899aabbccddeeff001122",
        "phash": "ffffffffffffffff",
        "hammingDistance": 32,
        "elaScore": 0.0,
        "status": "VERIFIED",
        "verdict": "VERIFIED_RELEASE",
        "contractEvent": "FundsLocked(address indexed donor, bytes32 indexed purpose, uint256 amount)",
        "details": "Fiat UPI settlement confirmed via ICICI Gateway. Auto-converted to 297.08 USDC and locked into PurposeBoundEscrow.sol earmarked to 'Water Infrastructure - Wardha Cluster'.",
        "merkleRoot": "0x4f8a91b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e"
    },
    {
        "id": "AUD-1005",
        "timestamp": "2026-10-24 18:20:00 UTC",
        "blockNumber": 20491829,
        "txHash": "0xf079ed0044b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8899",
        "eventType": "BATCH_AUDIT_FAILURE",
        "category": "Water Infrastructure",
        "amountEth": 20.0,
        "amountUsd": 64000.0,
        "amountInr": 5385600.0,
        "entity": "Apex Luxury Catering & Events (Unapproved)",
        "taxId": "GSTIN-27CAT9911Z",
        "invoiceNumber": "INV-2026-5507",
        "nullifier": "0x77d1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e77",
        "phash": "99a01b7c44d2e107",
        "hammingDistance": 18,
        "elaScore": 14.8,
        "status": "TAMPERED",
        "verdict": "ESCROW_FROZEN",
        "contractEvent": "EscrowAutoFrozen(bytes32 indexed nullifier, string reason)",
        "details": "Batch #42 audit caught 3 doctored receipts: Invoice total doctored from ₹62,000 to ₹3,85,000 (ELA anomaly = 14.8% glowing red) and vendor category 'Hospitality' failed strict 'Water Infrastructure' purpose check.",
        "merkleRoot": "0x99112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
    },
    {
        "id": "AUD-1006",
        "timestamp": "2026-10-24 10:15:00 UTC",
        "blockNumber": 20491823,
        "txHash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        "eventType": "INBOUND_DONATION",
        "category": "Water Infrastructure",
        "amountEth": 50.0,
        "amountUsd": 160000.0,
        "amountInr": 13464000.0,
        "entity": "Institutional Donor Fund (0x71C9...b901)",
        "taxId": "ETH-SEP-0x71C9414B",
        "invoiceNumber": "INITIAL-PURPOSE-LOCK",
        "nullifier": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "phash": "0000000000000000",
        "hammingDistance": 0,
        "elaScore": 0.0,
        "status": "VERIFIED",
        "verdict": "VERIFIED_RELEASE",
        "contractEvent": "FundsLocked(address indexed donor, bytes32 indexed purpose, uint256 amount)",
        "details": "Donor address 0x71C9414B...b901 deposited 50.00 ETH sealed into PurposeBoundEscrow.sol. Keccak256 commitment locked to 'Water Infrastructure - Wardha Cluster'.",
        "merkleRoot": "0x4f8a91b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e"
    }
]

@router.get("/records")
def get_audit_records(
    q: Optional[str] = Query(None, description="Search query string"),
    status: Optional[str] = Query(None, description="Status filter: ALL, VERIFIED, TAMPERED, DOUBLE_SPEND, SKIMMING, ESCROW_FROZEN")
):
    results = AUDIT_RECORDS
    
    # Status filter
    if status and status != "ALL":
        if status == "ESCROW_FROZEN":
            results = [r for r in results if r["verdict"] == "ESCROW_FROZEN"]
        else:
            results = [r for r in results if r["status"] == status]
            
    # Search filter
    if q and q.strip():
        query = q.strip().lower()
        results = [
            r for r in results
            if query in r["txHash"].lower()
            or query in r["entity"].lower()
            or query in r["taxId"].lower()
            or query in r["invoiceNumber"].lower()
            or query in r["nullifier"].lower()
            or query in r["category"].lower()
            or query in r["details"].lower()
        ]
        
    return {
        "totalRecords": len(AUDIT_RECORDS),
        "matchingRecords": len(results),
        "query": q,
        "statusFilter": status or "ALL",
        "records": results,
        "summary": {
            "totalAuditedEth": 147.48,
            "verifiedCleanEth": 60.09,
            "frozenAttemptEth": 70.0,
            "skimmedEth": 7.39,
            "tamperRate": "16.7%",
            "doubleSpendAttemptsBlocked": 1
        }
    }
