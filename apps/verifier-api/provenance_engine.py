"""
The Black Hole Ledger - Fund Provenance & Proportional Taint Accounting Engine
Researched from CryptoChain Explorer & Multichain Graph Systems
"""

import hashlib
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/provenance", tags=["provenance"])

def sha256_hex(data: str) -> str:
    return "0x" + hashlib.sha256(data.encode("utf-8")).hexdigest()

class ProportionalTaintCalculator:
    """
    Implements proportional / haircut taint accounting across mixed-fund wallets.
    Prevents naive address-matching from misattributing co-mingled capital.
    """
    @staticmethod
    def calculate_provenance_ratio(donation_attributable: float, total_balance: float) -> float:
        if total_balance <= 0:
            return 0.0
        return min(1.0, max(0.0, round(donation_attributable / total_balance, 4)))

    @staticmethod
    def calculate_spent_attribution(spend_amount: float, provenance_ratio: float) -> float:
        return round(spend_amount * provenance_ratio, 4)

def build_canonical_fund_graph(campaign_id: int = 1, is_skimming: bool = False) -> Dict[str, Any]:
    """
    Reconstructs the multi-hop canonical fund graph connecting:
    DONATION -> PURPOSE BINDING -> ALLOCATION -> SWAP -> BRIDGE -> OFF-RAMP -> FIAT -> VENDOR -> EXPENDITURE -> IMPACT
    """
    deposit_eth = 50.00
    eth_usd_rate = 3200.00
    gross_usdc = deposit_eth * eth_usd_rate # $160,000.00
    amm_fee_usd = 160.00 # 0.10% Uniswap v3 fee
    net_usdc = gross_usdc - amm_fee_usd # $159,840.00
    usd_inr_rate = 84.15 # RBI Forex Reference

    # Wallet initial state (proportional taint demonstration)
    unrelated_ngo_funds_eth = 10.00
    total_wallet_pool_eth = deposit_eth + unrelated_ngo_funds_eth # 60 ETH total
    provenance_ratio = ProportionalTaintCalculator.calculate_provenance_ratio(deposit_eth, total_wallet_pool_eth) # 50/60 = 0.8333

    nodes = [
        {
            "id": "node-donor",
            "type": "DONATION",
            "label": "Donor Deposit (50 ETH)",
            "source": "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
            "timestamp": "2026-10-24 10:15:00 UTC",
            "chain": "Ethereum L1",
            "transactionHash": "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
            "amount": deposit_eth,
            "asset": "ETH",
            "confidence": 1.0,
            "provenance": 1.0,
            "status": "CONFIRMED"
        },
        {
            "id": "node-escrow",
            "type": "CAMPAIGN",
            "label": "PurposeBoundEscrow (Water Infrastructure)",
            "source": "0x3Af19B02cD319985E1e012399F319114d5e56E1",
            "timestamp": "2026-10-24 10:15:20 UTC",
            "chain": "Ethereum L1",
            "amount": deposit_eth,
            "asset": "ETH",
            "confidence": 1.0,
            "provenance": 1.0,
            "status": "ACTIVE" if not is_skimming else "FROZEN"
        },
        {
            "id": "node-mixed-wallet",
            "type": "WALLET",
            "label": "NGO Treasury Vault (Co-Mingled)",
            "source": "0x217e9C3182B0058b76D63E666C2c502b4e89991A",
            "timestamp": "2026-10-24 10:45:00 UTC",
            "chain": "Ethereum L1",
            "amount": total_wallet_pool_eth,
            "asset": "ETH",
            "confidence": 0.98,
            "provenance": provenance_ratio,
            "status": "MIXED_POOL",
            "details": {
                "donationEarmarkedEth": deposit_eth,
                "preExistingUnrelatedEth": unrelated_ngo_funds_eth,
                "provenanceRatio": provenance_ratio,
                "accountingMethod": "Proportional Haircut"
            }
        },
        {
            "id": "node-dex-swap",
            "type": "SWAP",
            "label": "Uniswap v3 AMM Swap (ETH -> USDC)",
            "source": "Uniswap v3 ETH/USDC 0.05% Pool",
            "timestamp": "2026-10-24 11:20:00 UTC",
            "chain": "Ethereum L1",
            "transactionHash": "0x4a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
            "amount": net_usdc,
            "asset": "USDC",
            "confidence": 1.0,
            "provenance": provenance_ratio,
            "status": "SWAPPED",
            "details": {
                "inAsset": "ETH",
                "inAmount": deposit_eth,
                "outAsset": "USDC",
                "outAmount": net_usdc,
                "effectiveRate": eth_usd_rate,
                "slippagePct": 0.10
            }
        },
        {
            "id": "node-bridge",
            "type": "BRIDGE",
            "label": "Cross-Chain Bridge (Across / Polygon Portal)",
            "source": "L1 SpokePool -> L2 Receiver",
            "timestamp": "2026-10-24 12:05:00 UTC",
            "chain": "Ethereum L1 -> Polygon / Base L2",
            "transactionHash": "0x7c9a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8",
            "amount": net_usdc if not is_skimming else round(net_usdc * 0.852, 2),
            "asset": "USDC.e",
            "confidence": 0.99 if not is_skimming else 0.40,
            "provenance": provenance_ratio if not is_skimming else round(provenance_ratio * 0.852, 4),
            "status": "BRIDGED" if not is_skimming else "FLAGGED_SKIMMING"
        }
    ]

    edges = [
        {
            "id": "edge-1",
            "source": "node-donor",
            "target": "node-escrow",
            "type": "FUNDED",
            "amount": deposit_eth,
            "asset": "ETH",
            "timestamp": "2026-10-24 10:15:00 UTC",
            "provenanceWeight": 1.0,
            "confidence": 1.0
        },
        {
            "id": "edge-2",
            "source": "node-escrow",
            "target": "node-mixed-wallet",
            "type": "ALLOCATED",
            "amount": deposit_eth,
            "asset": "ETH",
            "timestamp": "2026-10-24 10:45:00 UTC",
            "provenanceWeight": provenance_ratio,
            "confidence": 0.98
        },
        {
            "id": "edge-3",
            "source": "node-mixed-wallet",
            "target": "node-dex-swap",
            "type": "SWAPPED",
            "amount": deposit_eth,
            "asset": "ETH",
            "timestamp": "2026-10-24 11:20:00 UTC",
            "provenanceWeight": provenance_ratio,
            "confidence": 1.0
        },
        {
            "id": "edge-4",
            "source": "node-dex-swap",
            "target": "node-bridge",
            "type": "BRIDGED",
            "amount": net_usdc,
            "asset": "USDC",
            "timestamp": "2026-10-24 12:05:00 UTC",
            "provenanceWeight": provenance_ratio,
            "confidence": 1.0
        }
    ]

    if is_skimming:
        siphoned_usd = round(net_usdc * 0.148, 2)
        nodes.append({
            "id": "node-shadow",
            "type": "WALLET",
            "label": "Shadow Offshore Entity (Diverted)",
            "source": "0x9b31De710F5D92186c3B5f80bF23a0740E7D6318",
            "timestamp": "2026-10-24 12:05:30 UTC",
            "chain": "Ethereum L1",
            "amount": siphoned_usd,
            "asset": "USDC",
            "confidence": 0.05,
            "provenance": round(provenance_ratio * 0.148, 4),
            "status": "CRITICAL_FRAUD",
            "details": {
                "siphonedUsdc": siphoned_usd,
                "siphonedInr": round(siphoned_usd * usd_inr_rate, 2),
                "shadowWallet": "0x9b31De710F5D92186c3B5f80bF23a0740E7D6318",
                "destinationBank": "Cayman Island Commercial Trust - Acc #882104-B"
            }
        })
        edges.append({
            "id": "edge-shadow-divert",
            "source": "node-dex-swap",
            "target": "node-shadow",
            "type": "WITHDRAWN",
            "amount": siphoned_usd,
            "asset": "USDC",
            "timestamp": "2026-10-24 12:05:30 UTC",
            "provenanceWeight": 0.148,
            "confidence": 0.05,
            "isFlagged": True,
            "flagReason": "14.8% Bridge Slippage Skimming Diverted to Undeclared Shadow Wallet"
        })

    # Add Fiat Off-Ramp and Vendor settlement nodes
    l2_usdc = net_usdc if not is_skimming else round(net_usdc - (net_usdc * 0.148), 2)
    inr_settled = round(l2_usdc * usd_inr_rate, 2)

    nodes.extend([
        {
            "id": "node-offramp",
            "type": "OFF_RAMP",
            "label": "Licensed Banking Partner (HDFC / Cashfree)",
            "source": "OffRamp KYC Rail #IND-8821",
            "timestamp": "2026-10-24 13:40:00 UTC",
            "chain": "Fiat Settlement Rail",
            "amount": inr_settled,
            "asset": "INR",
            "confidence": 0.99,
            "provenance": provenance_ratio,
            "status": "SETTLED"
        },
        {
            "id": "node-vendor",
            "type": "VENDOR",
            "label": "Maharashtra Borewell & PVC Supply Co.",
            "source": "GSTIN-27WATER9988Z",
            "timestamp": "2026-10-25 09:30:00 UTC",
            "chain": "Direct Vendor NEFT",
            "amount": 120000.0,
            "asset": "INR",
            "confidence": 1.0,
            "provenance": provenance_ratio,
            "status": "VERIFIED_SUPPLIER"
        },
        {
            "id": "node-expenditure",
            "type": "EXPENDITURE",
            "label": "Tranche 1: Borewell Drilling & PVC Casing (INV-2026-9001)",
            "source": "Invoice INV-2026-9001",
            "timestamp": "2026-10-25 10:15:00 UTC",
            "chain": "Off-Chain Invoice + On-Chain Nullifier",
            "amount": 120000.0,
            "asset": "INR",
            "confidence": 1.0,
            "provenance": provenance_ratio,
            "status": "VERIFIED_MILESTONE"
        },
        {
            "id": "node-impact",
            "type": "IMPACT",
            "label": "Potable Water Delivered to 142 Households",
            "source": "Ward 4 Rameshwar Grampanchayat",
            "timestamp": "2026-10-25 11:30:00 UTC",
            "chain": "Salted Merkle Tree (0 PII Leaked)",
            "amount": 142.0,
            "asset": "Households",
            "confidence": 1.0,
            "provenance": 1.0,
            "status": "ACTIVE_DELIVERY"
        }
    ])

    edges.extend([
        {
            "id": "edge-5",
            "source": "node-bridge",
            "target": "node-offramp",
            "type": "CONVERTED",
            "amount": inr_settled,
            "asset": "INR",
            "timestamp": "2026-10-24 13:40:00 UTC",
            "provenanceWeight": provenance_ratio,
            "confidence": 0.99
        },
        {
            "id": "edge-6",
            "source": "node-offramp",
            "target": "node-vendor",
            "type": "PAID",
            "amount": 120000.0,
            "asset": "INR",
            "timestamp": "2026-10-25 09:30:00 UTC",
            "provenanceWeight": provenance_ratio,
            "confidence": 1.0
        },
        {
            "id": "edge-7",
            "source": "node-vendor",
            "target": "node-expenditure",
            "type": "SUPPORTED_BY",
            "amount": 120000.0,
            "asset": "INR",
            "timestamp": "2026-10-25 10:15:00 UTC",
            "provenanceWeight": provenance_ratio,
            "confidence": 1.0
        },
        {
            "id": "edge-8",
            "source": "node-expenditure",
            "target": "node-impact",
            "type": "ATTESTED_BY",
            "amount": 142.0,
            "asset": "Households",
            "timestamp": "2026-10-25 11:30:00 UTC",
            "provenanceWeight": 1.0,
            "confidence": 1.0
        }
    ])

    return {
        "campaignId": campaign_id,
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "totalDonatedEth": deposit_eth,
            "totalTrackedEth": deposit_eth,
            "provenanceRatio": provenance_ratio,
            "accountingMethod": "Proportional / Haircut Taint Accounting",
            "activeHops": len(nodes),
            "discrepanciesCount": 1 if is_skimming else 0,
            "isSkimmingSimulated": is_skimming
        }
    }

@router.get("/graph/{campaign_id}")
def get_provenance_graph(campaign_id: int, is_skimming: bool = Query(False)):
    return build_canonical_fund_graph(campaign_id=campaign_id, is_skimming=is_skimming)

@router.get("/trace/{tx_hash}")
def trace_transaction_provenance(tx_hash: str):
    clean_hash = tx_hash.strip().lower()
    return {
        "txHash": clean_hash,
        "verified": True,
        "provenanceRatio": 0.8333,
        "donorOrigin": "0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901",
        "earmarkedPurpose": "Water Infrastructure",
        "hopsCount": 7,
        "currentAsset": "INR Direct Vendor Settlement",
        "settledAmountFormatted": "INR 1,20,000 (~0.48 ETH eq.)",
        "recipientVendor": "Maharashtra Borewell & PVC Supply Co. (GSTIN-27WATER9988Z)",
        "nullifierRegistered": True,
        "nullifier": "0x9f8a11b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
        "beneficiariesShielded": 142,
        "piiExposedBytes": 0
    }
