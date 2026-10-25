// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AttestationRegistry
 * @notice CASCADE '26 - Theme 4, PS 2: The Black Hole Ledger
 * @dev On-chain registry for W3C Verifiable Credential hashes and authorized inspector DIDs.
 *      Enables independent third-party verification of real-world supplier, bank, and delivery events.
 */
contract AttestationRegistry {
    enum CredentialType {
        NGO_VERIFIED,
        VENDOR,
        OFF_RAMP,
        PAYMENT_ATTESTATION,
        DELIVERY,
        IMPACT
    }

    struct AttestationRecord {
        bytes32 credentialHash; // SHA-256 / Keccak of canonical W3C VC
        CredentialType credType;
        bytes32 issuerDidHash;  // Hash of issuer DID (e.g. did:bhl:bank:HDFC)
        bytes32 subjectDidHash; // Hash of subject DID (e.g. did:bhl:vendor:GSTIN...)
        uint64  issuanceTimestamp;
        bool    isRevoked;
    }

    // Mapping: credentialHash => AttestationRecord
    mapping(bytes32 => AttestationRecord) public attestations;
    // Mapping: issuerDidHash => isAuthorized
    mapping(bytes32 => bool) public authorizedIssuers;

    event AttestationRegistered(
        bytes32 indexed credentialHash,
        CredentialType credType,
        bytes32 indexed issuerDidHash,
        bytes32 indexed subjectDidHash,
        uint64  issuanceTimestamp
    );

    event AttestationRevoked(
        bytes32 indexed credentialHash,
        bytes32 indexed issuerDidHash,
        string reason
    );

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function authorizeIssuer(bytes32 issuerDidHash) external onlyOwner {
        authorizedIssuers[issuerDidHash] = true;
    }

    function registerAttestation(
        bytes32 credentialHash,
        CredentialType credType,
        bytes32 issuerDidHash,
        bytes32 subjectDidHash,
        uint64 issuanceTimestamp
    ) external returns (bool) {
        require(authorizedIssuers[issuerDidHash] || msg.sender == owner, "Unauthorized issuer DID");
        require(attestations[credentialHash].issuanceTimestamp == 0, "Attestation already registered");

        attestations[credentialHash] = AttestationRecord({
            credentialHash: credentialHash,
            credType: credType,
            issuerDidHash: issuerDidHash,
            subjectDidHash: subjectDidHash,
            issuanceTimestamp: issuanceTimestamp,
            isRevoked: false
        });

        emit AttestationRegistered(
            credentialHash,
            credType,
            issuerDidHash,
            subjectDidHash,
            issuanceTimestamp
        );

        return true;
    }

    function revokeAttestation(bytes32 credentialHash, string calldata reason) external {
        AttestationRecord storage rec = attestations[credentialHash];
        require(rec.issuanceTimestamp > 0, "Attestation not found");
        require(msg.sender == owner, "Only owner can revoke");

        rec.isRevoked = true;
        emit AttestationRevoked(credentialHash, rec.issuerDidHash, reason);
    }

    function isAttestationValid(bytes32 credentialHash) external view returns (bool) {
        AttestationRecord storage rec = attestations[credentialHash];
        return rec.issuanceTimestamp > 0 && !rec.isRevoked;
    }
}
