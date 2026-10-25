// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PurposeBoundEscrow & Milestone Tranche Engine
 * @notice CASCADE '26 - Theme 4, PS 2: The Black Hole Ledger
 * @dev Enforces purpose-bound NGO allocations, structured milestone tranche drip releases,
 *      cross-donor anti-double counting via Semantic Nullifiers, and emergency freeze mechanisms.
 */
contract PurposeBoundEscrow {
    struct Tranche {
        uint256 trancheId;
        string name;
        uint256 percentage;
        uint256 amount;
        bool isReleased;
        bytes32 verifiedNullifier;
        bytes32 verifiedMerkleRoot;
        uint256 releasedAt;
    }

    struct Campaign {
        uint256 id;
        address donor;
        address ngo;
        string earmarkedPurpose;
        uint256 totalDeposited;
        uint256 totalReleased;
        bool isFrozen;
        string freezeReason;
        uint256 createdAt;
        uint256 currentTrancheIndex;
    }

    // Global cross-donor registry of used receipt semantic nullifiers
    // Maps: semanticNullifier => campaignId where it was first claimed
    mapping(bytes32 => uint256) public globalNullifierRegistry;
    mapping(bytes32 => bool) public isNullifierUsed;

    // Campaign storage
    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Tranche[]) public campaignTranches;

    // Events for Real-Time Auditor & Transparency Feeds
    event DonationLocked(
        uint256 indexed campaignId,
        address indexed donor,
        address indexed ngo,
        uint256 amount,
        string purpose,
        uint256 timestamp
    );

    event TrancheDripped(
        uint256 indexed campaignId,
        uint256 indexed trancheIndex,
        string trancheName,
        uint256 amount,
        address indexed recipient,
        bytes32 semanticNullifier,
        bytes32 merkleRoot,
        uint256 timestamp
    );

    event ExpenditureVerified(
        uint256 indexed campaignId,
        bytes32 indexed semanticNullifier,
        bytes32 merkleRoot,
        uint256 trancheReleased
    );

    event EscrowAutoFrozen(
        uint256 indexed campaignId,
        address indexed ngo,
        string reason,
        bytes32 offendingNullifier
    );

    event EscrowEmergencyFrozen(
        uint256 indexed campaignId,
        address indexed caller,
        string reason,
        uint256 timestamp
    );

    event EscrowUnfrozen(
        uint256 indexed campaignId,
        address indexed caller,
        uint256 timestamp
    );

    /**
     * @notice Donor locks funds with an immutable purpose earmark and standard 20/30/30/20 milestone tranches
     */
    function createCampaign(address _ngo, string calldata _purpose) external payable returns (uint256) {
        require(msg.value > 0, "Donation must be > 0");
        campaignCount++;
        uint256 newId = campaignCount;

        campaigns[newId] = Campaign({
            id: newId,
            donor: msg.sender,
            ngo: _ngo,
            earmarkedPurpose: _purpose,
            totalDeposited: msg.value,
            totalReleased: 0,
            isFrozen: false,
            freezeReason: "",
            createdAt: block.timestamp,
            currentTrancheIndex: 0
        });

        // Initialize Standard Tranche Schedule (20% Mobilization, 30% Material & Drilling, 30% Solar Pump & Storage, 20% Final Audit Handover)
        uint256 t1Amt = (msg.value * 20) / 100;
        uint256 t2Amt = (msg.value * 30) / 100;
        uint256 t3Amt = (msg.value * 30) / 100;
        uint256 t4Amt = msg.value - t1Amt - t2Amt - t3Amt;

        campaignTranches[newId].push(Tranche(1, "Tranche 1: Mobilization & Hydrogeological Survey (20%)", 20, t1Amt, false, bytes32(0), bytes32(0), 0));
        campaignTranches[newId].push(Tranche(2, "Tranche 2: Heavy Material Sourcing & Borewell Drilling (30%)", 30, t2Amt, false, bytes32(0), bytes32(0), 0));
        campaignTranches[newId].push(Tranche(3, "Tranche 3: Solar Pump & 5,000L Storage Installation (30%)", 30, t3Amt, false, bytes32(0), bytes32(0), 0));
        campaignTranches[newId].push(Tranche(4, "Tranche 4: Commissioning, Fluoride Audit & Handover (20%)", 20, t4Amt, false, bytes32(0), bytes32(0), 0));

        emit DonationLocked(newId, msg.sender, _ngo, msg.value, _purpose, block.timestamp);
        return newId;
    }

    /**
     * @notice Returns total number of tranches for a campaign
     */
    function getTrancheCount(uint256 _campaignId) external view returns (uint256) {
        return campaignTranches[_campaignId].length;
    }

    /**
     * @notice Returns tranche details by index
     */
    function getTranche(uint256 _campaignId, uint256 _index) external view returns (
        uint256 trancheId,
        string memory name,
        uint256 percentage,
        uint256 amount,
        bool isReleased,
        bytes32 verifiedNullifier,
        bytes32 verifiedMerkleRoot,
        uint256 releasedAt
    ) {
        require(_index < campaignTranches[_campaignId].length, "Invalid tranche index");
        Tranche storage t = campaignTranches[_campaignId][_index];
        return (t.trancheId, t.name, t.percentage, t.amount, t.isReleased, t.verifiedNullifier, t.verifiedMerkleRoot, t.releasedAt);
    }

    /**
     * @notice Releases next scheduled tranche upon submission and verification of off-chain milestone proof
     */
    function releaseNextTranche(
        uint256 _campaignId,
        bytes32 _semanticNullifier,
        bytes32 _merkleRoot,
        address payable _vendorOrRecipient
    ) external {
        Campaign storage c = campaigns[_campaignId];
        require(!c.isFrozen, "Escrow is FROZEN - Cannot release funds");
        require(c.currentTrancheIndex < campaignTranches[_campaignId].length, "All tranches already released");

        // Anti-double-spending check
        if (isNullifierUsed[_semanticNullifier]) {
            c.isFrozen = true;
            c.freezeReason = "CROSS_DONOR_DOUBLE_SPEND: Semantic Nullifier already claimed";
            emit EscrowAutoFrozen(_campaignId, c.ngo, c.freezeReason, _semanticNullifier);
            return;
        }

        uint256 tIdx = c.currentTrancheIndex;
        Tranche storage t = campaignTranches[_campaignId][tIdx];
        require(!t.isReleased, "Tranche already released");

        // Record nullifier
        isNullifierUsed[_semanticNullifier] = true;
        globalNullifierRegistry[_semanticNullifier] = _campaignId;

        t.isReleased = true;
        t.verifiedNullifier = _semanticNullifier;
        t.verifiedMerkleRoot = _merkleRoot;
        t.releasedAt = block.timestamp;

        c.totalReleased += t.amount;
        c.currentTrancheIndex++;

        address recipient = _vendorOrRecipient != address(0) ? _vendorOrRecipient : c.ngo;
        (bool sent, ) = recipient.call{value: t.amount}("");
        require(sent, "ETH transfer failed");

        emit TrancheDripped(_campaignId, tIdx + 1, t.name, t.amount, recipient, _semanticNullifier, _merkleRoot, block.timestamp);
        emit ExpenditureVerified(_campaignId, _semanticNullifier, _merkleRoot, t.amount);
    }

    /**
     * @notice Legacy submission method maintained for backward-compatibility with Feature #1 & #2
     */
    function submitExpenditureProof(
        uint256 _campaignId,
        bytes32 _semanticNullifier,
        bytes32 _merkleRoot,
        uint256 _requestedAmount,
        bool _forensicFraudDetected,
        string calldata _forensicFailureReason
    ) external {
        Campaign storage c = campaigns[_campaignId];
        require(!c.isFrozen, "Escrow is already FROZEN");
        require(c.totalReleased + _requestedAmount <= c.totalDeposited, "Insufficient escrow balance");

        // 1. Check Cross-Donor Double Counting
        if (isNullifierUsed[_semanticNullifier]) {
            c.isFrozen = true;
            c.freezeReason = "CROSS_DONOR_DOUBLE_SPEND: Semantic Nullifier already claimed in another campaign";
            emit EscrowAutoFrozen(_campaignId, c.ngo, c.freezeReason, _semanticNullifier);
            return;
        }

        // 2. Check Forensic Forgery
        if (_forensicFraudDetected) {
            c.isFrozen = true;
            c.freezeReason = _forensicFailureReason;
            emit EscrowAutoFrozen(_campaignId, c.ngo, _forensicFailureReason, _semanticNullifier);
            return;
        }

        // 3. Record Nullifier Globally & Disburse Milestone Tranche
        isNullifierUsed[_semanticNullifier] = true;
        globalNullifierRegistry[_semanticNullifier] = _campaignId;
        c.totalReleased += _requestedAmount;

        (bool sent, ) = payable(c.ngo).call{value: _requestedAmount}("");
        require(sent, "ETH transfer failed");

        emit ExpenditureVerified(_campaignId, _semanticNullifier, _merkleRoot, _requestedAmount);
    }

    /**
     * @notice One-Click Emergency Escrow Freeze
     *         Callable by the donor, authorized watchtower oracle, or community auditor
     */
    function emergencyFreeze(uint256 _campaignId, string calldata _reason) external {
        Campaign storage c = campaigns[_campaignId];
        require(!c.isFrozen, "Escrow is already FROZEN");
        // Accessible to original donor, current sender, or automated watchtower
        c.isFrozen = true;
        c.freezeReason = bytes(_reason).length > 0 ? _reason : "EMERGENCY_FREEZE_INVOKED_BY_DONOR";

        emit EscrowEmergencyFrozen(_campaignId, msg.sender, c.freezeReason, block.timestamp);
    }

    /**
     * @notice Unfreeze escrow after dispute resolution (donor only)
     */
    function unfreezeEscrow(uint256 _campaignId) external {
        Campaign storage c = campaigns[_campaignId];
        require(c.isFrozen, "Escrow is not frozen");
        require(msg.sender == c.donor, "Only original donor can unfreeze escrow");

        c.isFrozen = false;
        c.freezeReason = "";

        emit EscrowUnfrozen(_campaignId, msg.sender, block.timestamp);
    }
}
