// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @notice CASCADE '26 - Theme 4, PS 2: The Black Hole Ledger
 * @dev On-chain anchor for dual-tier expenditure evidence commitments:
 *      Raw Document Hash (SHA-256 of file bytes) + Canonical Evidence Hash (SHA-256 of normalized financial facts).
 *      Ensures evidentiary immutability without storing private beneficiary PII on-chain.
 */
contract EvidenceRegistry {
    struct EvidenceCommitment {
        uint256 campaignId;
        bytes32 rawDocumentHash;       // SHA-256 of raw file bytes
        bytes32 canonicalEvidenceHash; // SHA-256 of canonical semantic JSON
        bytes32 semanticNullifier;     // BHL_EXPENDITURE_NULLIFIER_V1
        address submittedBy;
        uint64  timestamp;
        bool    isValid;
    }

    // Mapping: canonicalEvidenceHash => EvidenceCommitment
    mapping(bytes32 => EvidenceCommitment) public commitments;
    // Mapping: rawDocumentHash => canonicalEvidenceHash
    mapping(bytes32 => bytes32) public rawToCanonical;

    event EvidenceAnchored(
        bytes32 indexed canonicalEvidenceHash,
        bytes32 indexed rawDocumentHash,
        bytes32 indexed semanticNullifier,
        uint256 campaignId,
        address submittedBy,
        uint64  timestamp
    );

    address public owner;
    mapping(address => bool) public authorizedCallers;

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedCallers[msg.sender], "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function authorizeCaller(address caller) external {
        require(msg.sender == owner, "Only owner");
        authorizedCallers[caller] = true;
    }

    /**
     * @notice Anchors dual-tier evidence hashes on-chain.
     */
    function anchorEvidence(
        uint256 campaignId,
        bytes32 rawDocumentHash,
        bytes32 canonicalEvidenceHash,
        bytes32 semanticNullifier
    ) external onlyAuthorized returns (bool) {
        require(!commitments[canonicalEvidenceHash].isValid, "Evidence already anchored");

        commitments[canonicalEvidenceHash] = EvidenceCommitment({
            campaignId: campaignId,
            rawDocumentHash: rawDocumentHash,
            canonicalEvidenceHash: canonicalEvidenceHash,
            semanticNullifier: semanticNullifier,
            submittedBy: msg.sender,
            timestamp: uint64(block.timestamp),
            isValid: true
        });

        rawToCanonical[rawDocumentHash] = canonicalEvidenceHash;

        emit EvidenceAnchored(
            canonicalEvidenceHash,
            rawDocumentHash,
            semanticNullifier,
            campaignId,
            msg.sender,
            uint64(block.timestamp)
        );

        return true;
    }

    function isEvidenceAnchored(bytes32 canonicalEvidenceHash) external view returns (bool) {
        return commitments[canonicalEvidenceHash].isValid;
    }

    function getCommitment(bytes32 canonicalEvidenceHash) external view returns (EvidenceCommitment memory) {
        return commitments[canonicalEvidenceHash];
    }
}
