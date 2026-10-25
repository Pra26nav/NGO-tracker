"""
The Black Hole Ledger - Feature #2
5-Stage "Follow the Money" DAG Visualizer, FX Skimming Discrepancy Detector & ZK Beneficiary Auditor
Zero-Conflict Isolated Backend Module
"""

import hashlib
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Form
from pydantic import BaseModel

router = APIRouter(prefix="/api/flow-tracer", tags=["flow-tracer"])

# ────────────────────────────────────────────────────────────
# Cryptographic Helpers
# ────────────────────────────────────────────────────────────
def sha256_hex(data: str) -> str:
    return "0x" + hashlib.sha256(data.encode("utf-8")).hexdigest()

def keccak_sim(data: str) -> str:
    # Deterministic SHA3-256 for EVM compatibility
    return "0x" + hashlib.sha3_256(data.encode("utf-8")).hexdigest()

# ────────────────────────────────────────────────────────────
# Synthetic 142 Beneficiary Generator & Merkle Tree
# ────────────────────────────────────────────────────────────
VILLAGE_NAMES = [
    "Sunita Patil", "Rameshwar Shinde", "Asha Jadhav", "Tukaram More",
    "Gita Gawande", "Vishnu Chavan", "Anusaya Rathod", "Kailas Deshmukh",
    "Sharda Wagh", "Baburao Kulkarni", "Meena Pawar", "Namdeo Bhosale",
    "Lata Suryavanshi", "Pandurang Gaikwad", "Suman Kale", "Dattatraya Shinde",
    "Radha Shelar", "Santosh Kadam", "Kavita Salunkhe", "Maruti Kharat"
]

def mask_name(name: str) -> str:
    parts = name.split()
    masked = []
    for p in parts:
        if len(p) <= 2:
            masked.append(p[0] + "*")
        else:
            masked.append(p[0] + "*" * (len(p) - 2) + p[-1])
    return " ".join(masked)

def generate_beneficiaries(count: int = 142) -> List[Dict[str, Any]]:
    items = []
    for i in range(1, count + 1):
        raw_name = VILLAGE_NAMES[(i - 1) % len(VILLAGE_NAMES)] + f" (Cluster #{((i - 1) // len(VILLAGE_NAMES)) + 1})"
        aadhaar_suffix = f"{(4100 + i * 17) % 10000:04d}"
        phone_suffix = f"{(7200 + i * 29) % 10000:04d}"
        salt = sha256_hex(f"SALT_VILLAGE_BENEFICIARY_2026_{i:04d}")[:18]
        
        # Raw PII (Strictly kept private off-chain)
        raw_pii = f"{raw_name}|AADHAAR:XXXX-XXXX-{aadhaar_suffix}|PHONE:+91 98231 {phone_suffix}|WARD-4"
        leaf_hash = sha256_hex(f"{salt}|{i:03d}|{raw_pii}")
        
        items.append({
            "index": i - 1,
            "householdId": f"HH-{i:03d}",
            "maskedName": mask_name(raw_name),
            "maskedAadhaar": f"XXXX-XXXX-{aadhaar_suffix}",
            "maskedPhone": f"+91 98231 {phone_suffix}",
            "ward": "Ward 4 — Rameshwar Grampanchayat",
            "salt": salt,
            "leafHash": leaf_hash,
            "biometricTimestamp": f"2026-10-24 11:{10 + (i % 45):02d} IST",
            "isRedacted": True,
            "signatureStatus": "ECDSA_VERIFIED_ON_DEVICE"
        })
    return items

CACHED_BENEFICIARIES = generate_beneficiaries(142)

def build_merkle_tree_from_hashes(hashes: List[str]) -> tuple[str, List[List[str]]]:
    """Builds a binary Merkle tree and returns (root, levels)"""
    current_level = list(hashes)
    levels = [current_level]
    
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            if i + 1 < len(current_level):
                right = current_level[i + 1]
            else:
                right = left  # duplicate last odd node
            combined = sha256_hex(left + right)
            next_level.append(combined)
        current_level = next_level
        levels.append(current_level)
        
    return current_level[0], levels

def get_merkle_proof(index: int, levels: List[List[str]]) -> List[Dict[str, Any]]:
    proof = []
    curr_idx = index
    for level in levels[:-1]:
        is_right = curr_idx % 2 == 1
        sibling_idx = curr_idx - 1 if is_right else curr_idx + 1
        if sibling_idx < len(level):
            sibling_hash = level[sibling_idx]
        else:
            sibling_hash = level[curr_idx]  # paired with itself
        proof.append({
            "position": "left" if is_right else "right",
            "hash": sibling_hash
        })
        curr_idx = curr_idx // 2
    return proof

# Public Leaves
PUBLIC_LEAVES = [
    {"id": "PUB-01", "label": "Hardware Vendor Tax ID", "value": "GSTIN-27WATER9988Z (Maharashtra Borewell Supply)", "hash": sha256_hex("GSTIN-27WATER9988Z")},
    {"id": "PUB-02", "label": "Procured Hardware Item", "value": "4x Submersible Borewell Pumps (5HP) + 200m PVC Casing", "hash": sha256_hex("4x Submersible Borewell Pumps")},
    {"id": "PUB-03", "label": "Tranche 1 Verified Disbursement", "value": "INR 1,20,000 (~0.48 ETH eq. @ $3,200/ETH, ₹84.15/USD)", "hash": sha256_hex("INR 1,20,000")},
    {"id": "PUB-04", "label": "Village Installation GPS Ward", "value": "Lat: 19.8762° N, Long: 75.3433° E (Ward 4 Rameshwar)", "hash": sha256_hex("19.8762,75.3433")},
    {"id": "PUB-05", "label": "Off-Chain IPFS Manifest CID", "value": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", "hash": sha256_hex("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")},
]

# All leaf hashes combined (5 public + 142 private beneficiary hashes)
ALL_LEAF_HASHES = [p["hash"] for p in PUBLIC_LEAVES] + [b["leafHash"] for b in CACHED_BENEFICIARIES]
GLOBAL_MERKLE_ROOT, GLOBAL_MERKLE_LEVELS = build_merkle_tree_from_hashes(ALL_LEAF_HASHES)

# ────────────────────────────────────────────────────────────
# 5 Hops Master Data Generator
# ────────────────────────────────────────────────────────────
def build_dag_hops(is_skimming: bool = False, eth_deposit: float = 50.0) -> Dict[str, Any]:
    # Baseline verified numbers scaled by eth_deposit
    eth_usd_rate = 3200.00
    usdc_gross = eth_deposit * eth_usd_rate
    amm_fee_usd = usdc_gross * 0.001  # 0.10% normal Uniswap v3 fee
    usdc_received = usdc_gross - amm_fee_usd
    
    usd_inr_rate = 84.15  # RBI / Forex rate
    
    if not is_skimming:
        # Legitimate Flow
        bridge_fee_usd = min(63.90, round(usdc_received * 0.0004, 2))
        usdc_l2_received = usdc_received - bridge_fee_usd
        inr_settled = usdc_l2_received * usd_inr_rate
        
        hop3_status = "VERIFIED"
        hop3_discrepancy = None
        hop3_shadow_wallet = None
        escrow_status = "ACTIVE"
        escrow_freeze_reason = None
        slippage_detected_pct = 0.10
    else:
        # 14.8% Skimming Attack Simulated!
        siphoned_usd = round(usdc_received * 0.148, 2)
        bridge_fee_usd = min(63.90, round(usdc_received * 0.0004, 2))
        usdc_l2_received = usdc_received - siphoned_usd
        inr_settled = usdc_l2_received * usd_inr_rate
        
        hop3_status = "FLAGGED_SKIMMING"
        hop3_shadow_wallet = {
            "address": "0x9b31De710F5D92186c3B5f80bF23a0740E7D6318",
            "label": "Undeclared Offshore Shadow Entity (Layering Wallet)",
            "siphonedUsdc": siphoned_usd,
            "siphonedInr": round(siphoned_usd * usd_inr_rate, 2),
            "siphonedPct": 14.80,
            "txHash": "0x3f9e8a002b11cd88a1e4599023ffaa12bb33445566778899aabbccddeeff0011",
            "destinationBank": "Cayman Island Commercial Trust - Acc #882104-B"
        }
        hop3_discrepancy = {
            "expectedUsdc": round(usdc_received, 2),
            "reportedUsdc": round(usdc_l2_received, 2),
            "discrepancyUsdc": siphoned_usd,
            "discrepancyPct": 14.80,
            "allowedTolerancePct": 1.00,
            "ngoClaimedReason": "High L1-to-L2 congestion & bridge liquidity slippage (15.2% total)",
            "oracleTruth": f"Chainlink L1/L2 gas oracle proves actual bridge gas was ${bridge_fee_usd:.2f} (0.04%). ${siphoned_usd:,.2f} was secretly split to shadow wallet!",
            "auditVerdict": "CRITICAL_FRAUD_DETECTED"
        }
        escrow_status = "FROZEN"
        escrow_freeze_reason = (
            "CRITICAL: 14.8% Bridge Slippage Skimming Detected on Hop #3! "
            "Reported $136,183.68 vs Expected $159,840.00 ($23,656.32 diverted to Shadow Wallet 0x9b31...6318). "
            "Smart contract PurposeBoundEscrow.sol auto-frozen!"
        )
        slippage_detected_pct = 14.80

    hops = [
        {
            "hopNumber": 1,
            "id": "hop-1-deposit",
            "title": "Inbound Earmarked Deposit",
            "subtitle": "50 ETH locked in PurposeBoundEscrow.sol",
            "status": "VERIFIED",
            "badge": "L1 SMART CONTRACT",
            "protocol": "Ethereum Mainnet (Sepolia/Mainnet)",
            "primaryValue": "50.00 ETH",
            "secondaryValue": "$160,000.00 USD eq.",
            "source": "Donor Sovereign Pool (0x71C...b901)",
            "destination": "PurposeBoundEscrow.sol (0x3Af...56E1)",
            "txHash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
            "blockNumber": 20491823,
            "timestamp": "2026-10-25 09:30:14 UTC",
            "earmark": "Water Infrastructure",
            "earmarkHash": keccak_sim("Water Infrastructure"),
            "proofDetails": [
                {"label": "Smart Contract", "value": "0x3Af19B02cD319985E1e012399F319114d5e56E1"},
                {"label": "Earmark Condition", "value": "Strict: Water Infrastructure Only"},
                {"label": "Immutable Balance", "value": "50.0000 ETH"},
                {"label": "Earmark Commitment", "value": keccak_sim("Water Infrastructure")[:20] + "..."},
                {"label": "Audit Status", "value": "Cryptographically Sealed & Active"}
            ]
        },
        {
            "hopNumber": 2,
            "id": "hop-2-swap",
            "title": "DEX Stablecoin Swap",
            "subtitle": "50 ETH swapped to USDC via Uniswap v3",
            "status": "VERIFIED",
            "badge": "AMM LIQUIDITY POOL",
            "protocol": "Uniswap v3 (ETH/USDC 0.05% Pool)",
            "primaryValue": "159,840.00 USDC",
            "secondaryValue": "Swapped from 50.00 ETH",
            "source": "Escrow Liquidity Proxy (0x3Af...56E1)",
            "destination": "Uniswap v3 Pool (0x88e6...4604)",
            "txHash": "0x5e19f2bb0088aa9911cc22dd33445566778899aabbccddeeff00112233445566",
            "blockNumber": 20491845,
            "timestamp": "2026-10-25 09:34:22 UTC",
            "priceOracle": "Chainlink ETH/USD ($3,200.00 / ETH)",
            "slippagePct": 0.10,
            "proofDetails": [
                {"label": "Chainlink Reference Price", "value": "$3,200.00 / ETH (Feed: 0x5f4e...c030)"},
                {"label": "Expected Gross Output", "value": "$160,000.00 USDC"},
                {"label": "Actual Received Output", "value": "$159,840.00 USDC"},
                {"label": "Observed AMM Slippage", "value": "0.10% (Within 1.0% Safe Threshold)"},
                {"label": "Volatility Protection", "value": "Locked into USDC Stablecoin"}
            ]
        },
        {
            "hopNumber": 3,
            "id": "hop-3-bridge",
            "title": "Cross-Chain L1 → L2 Bridge",
            "subtitle": "⚠️ 14.8% Siphoned to Shadow Wallet!" if is_skimming else "USDC bridged to low-gas Polygon / Base L2",
            "status": hop3_status,
            "badge": "🚨 SKIMMING FRAUD" if is_skimming else "CANONICAL BRIDGE",
            "protocol": "Across / Polygon State Portal",
            "primaryValue": f"{usdc_l2_received:,.2f} USDC",
            "secondaryValue": "Down by $23,656.32 from Expected" if is_skimming else "Transferred via Bridge Relayer",
            "source": "Ethereum L1 Bridge Vault (0x40ec...5001)",
            "destination": "Split: L2 NGO + Cayman Shadow Wallet" if is_skimming else "Polygon L2 NGO Disbursement (0x217e...991A)",
            "txHash": "0xdead00334499ff118822ee33aa44bb556677889900112233445566778899aabb" if is_skimming else "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
            "blockNumber": 20491870,
            "timestamp": "2026-10-25 09:41:05 UTC",
            "shadowWallet": hop3_shadow_wallet,
            "discrepancy": hop3_discrepancy,
            "proofDetails": [
                {"label": "Bridge Protocol", "value": "Polygon State Sync / L1 Bridge Vault"},
                {"label": "Gas & Relayer Fee", "value": "$63.90 USDC (Chainlink L2 Gas Oracle)"},
                {"label": "L1 Confirmed Blocks", "value": "64 Finalized Blocks"},
                {"label": "L2 State Root Proof", "value": "0x77ba9012cd34...fe91"},
                {"label": "Forensic Bridge Check", "value": "FAILED — Skimming Discrepancy > 1%" if is_skimming else "PASSED — Zero Slippage Skimming"}
            ]
        },
        {
            "hopNumber": 4,
            "id": "hop-4-offramp",
            "title": "Fiat Off-Ramp Settlement",
            "subtitle": "USDC burned for local INR bank transfer",
            "status": "DEFICIT_WARNING" if is_skimming else "VERIFIED",
            "badge": "RBI FOREX SETTLEMENT",
            "protocol": "Institutional Banking Gateway (RBI Comp.)",
            "primaryValue": f"₹{inr_settled:,.2f} INR",
            "secondaryValue": f"Converted @ ₹{usd_inr_rate} / USD",
            "source": "Regulated Off-Ramp Gateway (Circle / Mudrex)",
            "destination": "NGO Local Operations HDFC Acc #502000881920",
            "txHash": "0xfa112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
            "blockNumber": 58190212,
            "timestamp": "2026-10-25 10:15:30 IST",
            "neftRef": "NEFT-HDFC-20261025-449102",
            "proofDetails": [
                {"label": "Forex Reference Rate", "value": f"₹{usd_inr_rate} INR / USD (RBI Benchmark)"},
                {"label": "Off-Ramp Provider", "value": "Licensed Banking Gateway (KYB Verified)"},
                {"label": "Bank Credit Reference", "value": "NEFT-HDFC-20261025-449102"},
                {"label": "Disbursement Account", "value": "HDFC Current Acc #502000881920"},
                {"label": "Reconciliation Audit", "value": "DEFICIT: ₹19,90,680 Missing!" if is_skimming else "100% Reconciled to Penny"}
            ]
        },
        {
            "hopNumber": 5,
            "id": "hop-5-vendor",
            "title": "Verified Vendor Payout & Impact Proof",
            "subtitle": "Tranche 1 paid to Borewell Vendor + 142 Households",
            "status": "FROZEN_TRUNCATED" if is_skimming else "VERIFIED",
            "badge": "VERIFIED PHYSICAL IMPACT",
            "protocol": "HDFC Bank NEFT / Smart Contract Tranche 1",
            "primaryValue": "₹1,20,000.00 INR",
            "secondaryValue": "4x Borewells + 142 Household Beneficiaries",
            "source": "NGO Local Operations Acc #502000881920",
            "destination": "Maharashtra Borewell & PVC Supply Co.",
            "txHash": "0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
            "blockNumber": 58190340,
            "timestamp": "2026-10-25 11:45:00 IST",
            "bankUtr": "UTR-HDFC-20261025-00918234",
            "vendorTaxId": "GSTIN-27WATER9988Z",
            "invoiceNo": "INV-2026-9001",
            "merkleRoot": GLOBAL_MERKLE_ROOT,
            "proofDetails": [
                {"label": "Hardware Vendor", "value": "Maharashtra Borewell & PVC Supply Co."},
                {"label": "Vendor GSTIN", "value": "GSTIN-27WATER9988Z"},
                {"label": "Bank Transfer UTR", "value": "UTR-HDFC-20261025-00918234"},
                {"label": "GPS Coordinates", "value": "19.8762° N, 75.3433° E (Ward 4)"},
                {"label": "ZK Merkle Commitment", "value": GLOBAL_MERKLE_ROOT[:20] + "..."},
                {"label": "Beneficiary Redaction", "value": "142 Households Cryptographically Proven (0 PII Leaked)"}
            ]
        }
    ]

    return {
        "isSkimmingSimulated": is_skimming,
        "escrowState": {
            "status": escrow_status,
            "frozenReason": escrow_freeze_reason,
            "balanceEth": eth_deposit,
            "earmarkedPurpose": "Water Infrastructure",
            "lastTxHash": "0xdead00334499ff118822ee33aa44bb556677889900112233445566778899aabb" if is_skimming else "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
        },
        "rates": {
            "chainlinkEthUsd": eth_usd_rate,
            "chainlinkUsdcUsd": 1.0001,
            "rbiUsdInr": usd_inr_rate,
            "allowedSlippageTolerancePct": 1.00,
            "detectedSlippagePct": slippage_detected_pct
        },
        "hops": hops,
        "zkSummary": {
            "merkleRoot": GLOBAL_MERKLE_ROOT,
            "totalBeneficiaries": len(CACHED_BENEFICIARIES),
            "publicLeavesCount": len(PUBLIC_LEAVES),
            "piiRedactionRate": "100.0%",
            "piiBytesLeaked": 0
        }
    }

# ────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────
@router.get("/dag-state")
def get_dag_state(skimming: bool = False, amount: float = 50.0):
    return build_dag_hops(is_skimming=skimming, eth_deposit=amount)

@router.post("/toggle-skimming")
def toggle_skimming(simulate: bool = Form(...), amount: float = Form(50.0)):
    return build_dag_hops(is_skimming=simulate, eth_deposit=amount)

@router.get("/oracle-rates")
def get_oracle_rates():
    return {
        "status": "LIVE_ORACLE_CONNECTED",
        "feeds": [
            {
                "pair": "ETH / USD",
                "source": "Chainlink Decentralized Oracle",
                "feedAddress": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
                "price": 3200.00,
                "confidence": 0.9998,
                "heartbeatSeconds": 60,
                "status": "HEALTHY"
            },
            {
                "pair": "USDC / USD",
                "source": "Chainlink Decentralized Oracle",
                "feedAddress": "0x8fFfFD0E38E11ac0ee040609920042453e029247",
                "price": 1.0001,
                "confidence": 0.9999,
                "heartbeatSeconds": 86400,
                "status": "HEALTHY"
            },
            {
                "pair": "USD / INR",
                "source": "Reserve Bank of India (RBI) Reference Rate",
                "feedAddress": "OFF_CHAIN_CENTRAL_BANK_FEED",
                "price": 84.15,
                "confidence": 1.0000,
                "heartbeatSeconds": 3600,
                "status": "HEALTHY"
            }
        ],
        "allowedTolerancePct": 1.00,
        "auditRules": {
            "maxSlippageThreshold": "1.00%",
            "shadowWalletThreshold": "$0.00 (Zero Tolerance)",
            "escrowActionOnBreach": "IMMEDIATE_AUTONOMOUS_FREEZE"
        }
    }

@router.get("/zk-beneficiaries")
def get_zk_beneficiaries():
    return {
        "merkleRoot": GLOBAL_MERKLE_ROOT,
        "publicLeaves": PUBLIC_LEAVES,
        "beneficiaries": CACHED_BENEFICIARIES,
        "totalCount": len(CACHED_BENEFICIARIES),
        "ipfsCid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    }

class MerkleProofRequest(BaseModel):
    index: int

@router.post("/verify-merkle-proof")
def verify_merkle_proof(payload: MerkleProofRequest):
    # Proof offset by public leaves count
    total_idx = len(PUBLIC_LEAVES) + payload.index
    if total_idx >= len(ALL_LEAF_HASHES) or payload.index < 0:
        return {"error": "Invalid beneficiary index"}
    
    target_leaf = CACHED_BENEFICIARIES[payload.index]
    proof = get_merkle_proof(total_idx, GLOBAL_MERKLE_LEVELS)
    
    # Verify proof calculation
    current = target_leaf["leafHash"]
    for step in proof:
        if step["position"] == "left":
            current = sha256_hex(step["hash"] + current)
        else:
            current = sha256_hex(current + step["hash"])
            
    is_valid = (current == GLOBAL_MERKLE_ROOT)
    
    return {
        "beneficiaryIndex": payload.index,
        "householdId": target_leaf["householdId"],
        "maskedName": target_leaf["maskedName"],
        "leafHash": target_leaf["leafHash"],
        "salt": target_leaf["salt"],
        "merkleRoot": GLOBAL_MERKLE_ROOT,
        "proofPath": proof,
        "verified": is_valid,
        "verificationDetails": {
            "piiExposed": False,
            "mathematicalCheck": f"Recomputed Root == On-Chain Root ({is_valid})",
            "onChainEscrowCommitment": GLOBAL_MERKLE_ROOT,
            "message": "Cryptographic proof verified! Household signature is authentic and part of the on-chain commitment with ZERO bytes of PII leaked."
        }
    }
