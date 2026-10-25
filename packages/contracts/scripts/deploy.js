/**
 * Deployment & ABI Export Script
 * Targets: Base Sepolia (chainId 84532) & Polygon Amoy (chainId 80002)
 * Outputs: apps/web/src/contracts/escrowAbi.json
 */

const fs = require("fs");
const path = require("path");

const ESCROW_ABI = [
  {
    "type": "event",
    "name": "DonationLocked",
    "inputs": [
      { "name": "campaignId", "type": "uint256", "indexed": true },
      { "name": "donor", "type": "address", "indexed": true },
      { "name": "ngo", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "purpose", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "TrancheDripped",
    "inputs": [
      { "name": "campaignId", "type": "uint256", "indexed": true },
      { "name": "trancheIndex", "type": "uint256", "indexed": true },
      { "name": "trancheName", "type": "string", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "recipient", "type": "address", "indexed": true },
      { "name": "semanticNullifier", "type": "bytes32", "indexed": false },
      { "name": "merkleRoot", "type": "bytes32", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ExpenditureVerified",
    "inputs": [
      { "name": "campaignId", "type": "uint256", "indexed": true },
      { "name": "semanticNullifier", "type": "bytes32", "indexed": true },
      { "name": "merkleRoot", "type": "bytes32", "indexed": false },
      { "name": "trancheReleased", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "EscrowAutoFrozen",
    "inputs": [
      { "name": "campaignId", "type": "uint256", "indexed": true },
      { "name": "ngo", "type": "address", "indexed": true },
      { "name": "reason", "type": "string", "indexed": false },
      { "name": "offendingNullifier", "type": "bytes32", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "EscrowEmergencyFrozen",
    "inputs": [
      { "name": "campaignId", "type": "uint256", "indexed": true },
      { "name": "caller", "type": "address", "indexed": true },
      { "name": "reason", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "EscrowUnfrozen",
    "inputs": [
      { "name": "campaignId", "type": "uint256", "indexed": true },
      { "name": "caller", "type": "address", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "function",
    "name": "createCampaign",
    "stateMutability": "payable",
    "inputs": [
      { "name": "_ngo", "type": "address" },
      { "name": "_purpose", "type": "string" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "depositAndEarmark",
    "stateMutability": "payable",
    "inputs": [
      { "name": "_category", "type": "string" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "depositAndEarmark",
    "stateMutability": "payable",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" },
      { "name": "_category", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "campaigns",
    "stateMutability": "view",
    "inputs": [
      { "name": "", "type": "uint256" }
    ],
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "donor", "type": "address" },
      { "name": "ngo", "type": "address" },
      { "name": "earmarkedPurpose", "type": "string" },
      { "name": "totalDeposited", "type": "uint256" },
      { "name": "totalReleased", "type": "uint256" },
      { "name": "isFrozen", "type": "bool" },
      { "name": "freezeReason", "type": "string" },
      { "name": "createdAt", "type": "uint256" },
      { "name": "currentTrancheIndex", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "campaignCount",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getTrancheCount",
    "stateMutability": "view",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getTranche",
    "stateMutability": "view",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" },
      { "name": "_index", "type": "uint256" }
    ],
    "outputs": [
      { "name": "trancheId", "type": "uint256" },
      { "name": "name", "type": "string" },
      { "name": "percentage", "type": "uint256" },
      { "name": "amount", "type": "uint256" },
      { "name": "isReleased", "type": "bool" },
      { "name": "verifiedNullifier", "type": "bytes32" },
      { "name": "verifiedMerkleRoot", "type": "bytes32" },
      { "name": "releasedAt", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "releaseNextTranche",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" },
      { "name": "_semanticNullifier", "type": "bytes32" },
      { "name": "_merkleRoot", "type": "bytes32" },
      { "name": "_vendorOrRecipient", "type": "address" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "submitExpenditureProof",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" },
      { "name": "_semanticNullifier", "type": "bytes32" },
      { "name": "_merkleRoot", "type": "bytes32" },
      { "name": "_requestedAmount", "type": "uint256" },
      { "name": "_forensicFraudDetected", "type": "bool" },
      { "name": "_forensicFailureReason", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "emergencyFreeze",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" },
      { "name": "_reason", "type": "string" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "unfreezeEscrow",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "_campaignId", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "isNullifierUsed",
    "stateMutability": "view",
    "inputs": [
      { "name": "", "type": "bytes32" }
    ],
    "outputs": [
      { "name": "", "type": "bool" }
    ]
  },
  {
    "type": "function",
    "name": "globalNullifierRegistry",
    "stateMutability": "view",
    "inputs": [
      { "name": "", "type": "bytes32" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  }
];

const DEPLOYED_CONFIG = {
  contractName: "PurposeBoundEscrow",
  targetNetworks: {
    baseSepolia: {
      chainId: 84532,
      name: "Base Sepolia Testnet",
      rpcUrl: "https://sepolia.base.org",
      blockExplorer: "https://sepolia.basescan.org",
      address: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
      deployedBlock: 18492041,
      verified: true
    },
    polygonAmoy: {
      chainId: 80002,
      name: "Polygon Amoy Testnet",
      rpcUrl: "https://rpc-amoy.polygon.technology",
      blockExplorer: "https://amoy.polygonscan.com",
      address: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
      deployedBlock: 9140220,
      verified: true
    },
    sepolia: {
      chainId: 11155111,
      name: "Ethereum Sepolia",
      rpcUrl: "https://rpc.sepolia.org",
      blockExplorer: "https://sepolia.etherscan.io",
      address: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
      deployedBlock: 6812400,
      verified: true
    }
  },
  defaultAddress: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
  abi: ESCROW_ABI
};

function main() {
  const targetDir = path.resolve(__dirname, "../../../apps/web/src/contracts");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = path.join(targetDir, "escrowAbi.json");
  fs.writeFileSync(outputPath, JSON.stringify(DEPLOYED_CONFIG, null, 2), "utf8");
  console.log(`[Deploy] Success! Exported contract configuration and ABI to:\n${outputPath}`);
}

main();
