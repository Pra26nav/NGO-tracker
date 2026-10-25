// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NullifierRegistry
 * @notice CASCADE '26 - Theme 4, PS 2: The Black Hole Ledger
 * @dev Global cross-donor Semantic Nullifier registry. Any campaign escrow queries
 *      this contract before accepting an expenditure proof. A single receipt can only
 *      be claimed in ONE donor pool across the ENTIRE ecosystem.
 *
 *      Nullifier = keccak256(VendorTaxID | InvoiceNo | Date | Amount)
 *      This is deterministic — even if an NGO crops/rescans the image, the financial
 *      facts are identical, so the nullifier matches and the double-spend is caught.
 */
contract NullifierRegistry {

    // Emitted when a nullifier is registered for the first time
    event NullifierRegistered(
        bytes32 indexed semanticNullifier,
        uint256 indexed campaignId,
        address indexed registeredBy,
        uint64  timestamp
    );

    // Emitted on double-spend attempt
    event DoubleSpendAttempt(
        bytes32 indexed semanticNullifier,
        uint256 originalCampaignId,
        uint256 attackingCampaignId,
        address indexed attacker
    );

    struct NullifierRecord {
        uint256 campaignId;   // Campaign that first claimed this receipt
        address registeredBy; // NGO address that submitted the proof
        uint64  timestamp;    // Block timestamp of first claim
        bool    used;         // Whether this nullifier has been spent
    }

    // Global ledger: nullifier => first-claim record
    mapping(bytes32 => NullifierRecord) public nullifiers;

    // Authorized escrow contracts that may register nullifiers
    mapping(address => bool) public authorizedEscrows;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedEscrows[msg.sender] || msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Authorizes a PurposeBoundEscrow contract to register nullifiers
     */
    function authorizeEscrow(address escrowAddr) external onlyOwner {
        authorizedEscrows[escrowAddr] = true;
    }

    /**
     * @notice Attempts to register a nullifier. Returns false (and emits DoubleSpendAttempt)
     *         if already used — the calling escrow MUST freeze on false return.
     * @param  semanticNullifier  keccak256(VendorTaxID|InvoiceNo|Date|Amount)
     * @param  campaignId         Campaign attempting to claim this receipt
     * @return success            True if newly registered; False = double-spend detected
     */
    function registerNullifier(
        bytes32 semanticNullifier,
        uint256 campaignId
    ) external onlyAuthorized returns (bool success) {
        NullifierRecord storage rec = nullifiers[semanticNullifier];

        if (rec.used) {
            emit DoubleSpendAttempt(
                semanticNullifier,
                rec.campaignId,
                campaignId,
                msg.sender
            );
            return false;
        }

        rec.campaignId    = campaignId;
        rec.registeredBy  = msg.sender;
        rec.timestamp     = uint64(block.timestamp);
        rec.used          = true;

        emit NullifierRegistered(semanticNullifier, campaignId, msg.sender, uint64(block.timestamp));
        return true;
    }

    /**
     * @notice Read-only check — does not register; purely for off-chain querying.
     */
    function isNullifierUsed(bytes32 semanticNullifier) external view returns (bool, uint256) {
        NullifierRecord storage rec = nullifiers[semanticNullifier];
        return (rec.used, rec.campaignId);
    }

    /**
     * @notice Helper: compute the semantic nullifier off-chain and pass it here for verification.
     *         Solidity version: keccak256(abi.encodePacked(taxId, invoiceNo, dateStr, amountWei))
     */
    function computeNullifier(
        string calldata vendorTaxId,
        string calldata invoiceNo,
        string calldata dateStr,
        uint256 amountWei
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(vendorTaxId, invoiceNo, dateStr, amountWei));
    }
}
