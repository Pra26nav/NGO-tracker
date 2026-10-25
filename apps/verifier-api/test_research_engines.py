"""
Comprehensive Unit & Integration Test Suite for Black Hole Ledger Research Engines
Verifies:
1. Canonical Evidence Normalization & Semantic Nullifier Derivation
2. UltraPlonk / Noir-inspired ZK Expenditure Proof Constraint Verification
3. 100-Run Adversarial Monte Carlo Simulation & Metrics (Precision, Recall, FPR, FNR)
4. Multi-Hop Proportional Haircut Fund Provenance (DEX, Bridge, Off-ramp)
5. OpenGive Charity Intelligence & Fuzzy Levenshtein Entity Resolution
6. 6-Domain Discrepancy Engine Rules (Deterministic Freeze vs Review)
7. W3C Verifiable Credentials (VC 2.0) Issuance & Verification
8. Decentralized Independent Watchers Network
"""

import sys
import os
import unittest

# Ensure the current directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from canonical_evidence import (
    canonicalize_expenditure_identity,
    derive_expenditure_nullifier,
    GLOBAL_NULLIFIER_STORE
)
from zk_verifier import (
    verify_zk_expenditure_proof,
    ZKProofVerificationRequest
)
from adversarial_simulation import (
    generate_100_expenditures,
    compute_simulation_statistics
)
from provenance_engine import (
    build_canonical_fund_graph,
    ProportionalTaintCalculator
)
from charity_intelligence import (
    resolve_entity,
    CHARITY_REGISTRY_DATABASE
)
from discrepancy_engine import (
    evaluate_all_rules,
    DISCREPANCY_RULES
)
from credentials_vc import (
    verify_credential,
    VerifyVCRequest,
    CREDENTIALS_STORE
)
from watchers import (
    get_watchers_status
)


class TestCanonicalEvidence(unittest.TestCase):
    def test_semantic_canonicalization(self):
        # Raw invoice variations with different whitespace, casing, and punctuation
        ident1 = canonicalize_expenditure_identity(
            vendor_tax_id="  GSTIN-27AAACW1234F1Z5  ",
            invoice_number="inv-2026-8841",
            invoice_date="2026-10-24",
            amount="45000.00",
            currency="inr",
            category="water infrastructure"
        )
        ident2 = canonicalize_expenditure_identity(
            vendor_tax_id="gstin 27aaacw1234f1z5",
            invoice_number="INV-2026-8841",
            invoice_date="2026/10/24",
            amount=45000,
            currency="INR",
            category="Water Infrastructure"
        )

        # Both MUST produce the identical canonical evidence hash
        self.assertEqual(ident1["canonicalEvidenceHash"], ident2["canonicalEvidenceHash"])
        self.assertEqual(ident1["canonicalString"], ident2["canonicalString"])

        # With the same salt, both produce the identical nullifier
        salt = "TEST_SALT_SECRET_XYZ_99"
        null1 = derive_expenditure_nullifier(ident1, salt)
        null2 = derive_expenditure_nullifier(ident2, salt)

        self.assertEqual(null1, null2)
        self.assertTrue(null1.startswith("0x"))
        self.assertEqual(len(null1), 66)

    def test_different_salt_different_nullifier(self):
        ident = canonicalize_expenditure_identity(
            vendor_tax_id="GSTIN-27AAACW1234F1Z5",
            invoice_number="INV-2026-8841",
            invoice_date="2026-10-24",
            amount=45000,
            currency="INR",
            category="Water Infrastructure"
        )
        null_a = derive_expenditure_nullifier(ident, "SALT_A")
        null_b = derive_expenditure_nullifier(ident, "SALT_B")

        self.assertNotEqual(null_a, null_b)
        self.assertEqual(len(null_a), 66)
        self.assertEqual(len(null_b), 66)


class TestZKVerifier(unittest.TestCase):
    def test_valid_zk_proof(self):
        req = ZKProofVerificationRequest(
            evidenceCommitment="0xabc123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            allocationId="alloc_water_infra_001",
            categoryCommitment="Water Infrastructure",
            maximumAuthorizedAmount=50000.0,
            vendorCommitment="0xvendorhash999",
            nullifier="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            campaignId=1,
            claimedCategory="Water Infrastructure",
            claimedAmount=45000.0,
            claimedVendorTaxId="GSTIN-27WATER9988Z",
            secretSalt="SALT_SECRET_ZK_42"
        )
        res = verify_zk_expenditure_proof(req)
        self.assertTrue(res["isVerified"])
        self.assertEqual(res["verdict"], "VERIFIED")
        self.assertEqual(res["piiLeakedBytes"], 0)
        self.assertEqual(res["epistemicClassification"], "CRYPTOGRAPHICALLY_VERIFIED")

    def test_amount_exceeded_zk_proof(self):
        req = ZKProofVerificationRequest(
            evidenceCommitment="0xabc123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            allocationId="alloc_water_infra_001",
            categoryCommitment="Water Infrastructure",
            maximumAuthorizedAmount=30000.0,
            vendorCommitment="0xvendorhash999",
            nullifier="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            campaignId=1,
            claimedCategory="Water Infrastructure",
            claimedAmount=45000.0,  # Exceeds max 30000.0!
            claimedVendorTaxId="GSTIN-27WATER9988Z",
            secretSalt="SALT_SECRET_ZK_42"
        )
        res = verify_zk_expenditure_proof(req)
        self.assertFalse(res["isVerified"])
        self.assertEqual(res["verdict"], "REJECTED")
        self.assertFalse(res["constraintsVerified"]["amountWithinLimit"])


class TestAdversarialSimulation(unittest.TestCase):
    def test_100_run_monte_carlo(self):
        dataset = generate_100_expenditures()
        self.assertEqual(len(dataset), 100)

        # Count ground truth categories
        legit_count = sum(1 for item in dataset if item["groundTruthType"] == "LEGITIMATE")
        forged_count = sum(1 for item in dataset if item["groundTruthType"] == "FORGED")
        dup_count = sum(1 for item in dataset if item["groundTruthType"] == "DUPLICATE")
        mod_dup_count = sum(1 for item in dataset if item["groundTruthType"] == "MODIFIED_DUPLICATE")

        self.assertEqual(legit_count, 55)
        self.assertEqual(forged_count, 30)
        self.assertEqual(dup_count, 10)
        self.assertEqual(mod_dup_count, 5)

        stats = compute_simulation_statistics(dataset)
        self.assertEqual(stats["totalExpenditures"], 100)
        self.assertEqual(stats["totalAdversarialAttacks"], 45)
        self.assertEqual(stats["precision"], 1.0)
        self.assertEqual(stats["recall"], 1.0)
        self.assertEqual(stats["falsePositiveRate"], 0.0)
        self.assertEqual(stats["falseNegativeRate"], 0.0)
        self.assertEqual(stats["duplicateDetectionRate"], 1.0)
        self.assertEqual(stats["unsupportedEvidenceRate"], 0.30)
        self.assertEqual(stats["escrowStatusFinal"], "FROZEN")


class TestFundProvenanceEngine(unittest.TestCase):
    def test_graph_and_proportional_accounting(self):
        graph = build_canonical_fund_graph(campaign_id=1, is_skimming=False)
        self.assertIn("nodes", graph)
        self.assertIn("edges", graph)
        self.assertTrue(len(graph["nodes"]) >= 7)

        # Verify donation node
        donation_node = next(n for n in graph["nodes"] if n["id"] == "node-donor")
        self.assertEqual(donation_node["amount"], 50.0)
        self.assertEqual(donation_node["provenance"], 1.0)

        # Verify intermediate mixed wallet node: 50 ETH donation mixed with 10 ETH prior funds
        mixed_node = next(n for n in graph["nodes"] if n["id"] == "node-mixed-wallet")
        self.assertAlmostEqual(mixed_node["provenance"], 0.8333, places=3)

        # Verify shadow wallet node appears when is_skimming=True
        graph_skimming = build_canonical_fund_graph(campaign_id=1, is_skimming=True)
        shadow_node = next(n for n in graph_skimming["nodes"] if n["id"] == "node-shadow")
        self.assertEqual(shadow_node["status"], "CRITICAL_FRAUD")

        # Test proportional taint math directly
        taint = ProportionalTaintCalculator.calculate_provenance_ratio(50.0, 60.0)
        self.assertAlmostEqual(taint, 0.8333, places=3)


class TestCharityIntelligence(unittest.TestCase):
    def test_exact_lookup(self):
        res = resolve_entity("MH/2018/0192841")
        self.assertTrue(res["isVerified"])
        self.assertEqual(res["matchMethod"], "EXACT_TAX_ID")
        self.assertIn("Gramin Jal Vikas Sanstha", res["matchedLegalName"])

    def test_fuzzy_entity_resolution(self):
        # Slightly misspelled name: "gramin jal vkas sanshta"
        res = resolve_entity("gramin jal vkas sanshta")
        self.assertTrue(res["isVerified"])
        self.assertGreater(res["confidence"], 0.80)
        self.assertEqual(res["matchMethod"], "FUZZY_LEVENSHTEIN")
        self.assertIn("Gramin Jal Vikas Sanstha", res["matchedLegalName"])


class TestDiscrepancyEngine(unittest.TestCase):
    def test_rule_evaluation(self):
        # 1. Verify 6 domains are represented
        self.assertTrue(len(DISCREPANCY_RULES) >= 6)
        domains = {r["domain"] for r in DISCREPANCY_RULES}
        self.assertIn("CRYPTOGRAPHIC", domains)
        self.assertIn("FINANCIAL", domains)
        self.assertIn("CATEGORY", domains)
        self.assertIn("TEMPORAL", domains)
        self.assertIn("PROVENANCE", domains)
        self.assertIn("REPORTING", domains)

        # 2. Test Cross-Donor Double Spend Autonomous Freeze
        dd_res = evaluate_all_rules("CROSS_DONOR_DOUBLE_SPEND")
        self.assertEqual(len(dd_res), 1)
        self.assertEqual(dd_res[0]["ruleId"], "RULE-CRYPTO-001")
        self.assertEqual(dd_res[0]["actionTaken"], "AUTONOMOUS_FREEZE")
        self.assertEqual(dd_res[0]["severity"], "CRITICAL_FREEZE")

        # 3. Test Bridge Skimming Autonomous Freeze
        skim_res = evaluate_all_rules("BRIDGE_SKIMMING")
        self.assertEqual(len(skim_res), 1)
        self.assertEqual(skim_res[0]["ruleId"], "RULE-FIN-001")
        self.assertEqual(skim_res[0]["actionTaken"], "AUTONOMOUS_FREEZE")


class TestVerifiableCredentials(unittest.TestCase):
    def test_verify_known_credential(self):
        vc_id = "urn:uuid:vc-vendor-27water9988z"
        vc_data = CREDENTIALS_STORE[vc_id]

        req = VerifyVCRequest(credentialJson=vc_data)
        res = verify_credential(req)
        self.assertTrue(res["isSignatureValid"])
        self.assertEqual(res["auditVerdict"], "CRYPTOGRAPHICALLY_VERIFIED_W3C_CREDENTIAL")
        self.assertEqual(res["epistemicTier"], "ATTESTED")


class TestWatchers(unittest.TestCase):
    def test_poll_watchers(self):
        res = get_watchers_status()
        watchers = res["watchers"]
        self.assertEqual(len(watchers), 6)
        names = [w["name"] for w in watchers]
        self.assertTrue(any("FundWatcher" in n for n in names))
        self.assertTrue(any("ProofWatcher" in n for n in names))
        self.assertTrue(any("NullifierWatcher" in n for n in names))
        self.assertTrue(any("EscrowWatcher" in n for n in names))
        self.assertTrue(any("DiscrepancyWatcher" in n for n in names))
        self.assertTrue(any("BridgeWatcher" in n for n in names))
        self.assertEqual(res["consensusState"], "QUORUM_ESTABLISHED")


if __name__ == "__main__":
    unittest.main()
