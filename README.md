# Uniswap Multi-Hop Swap System

A decentralized smart contract system that enables multi-hop token swaps across Uniswap V2 and Uniswap V3. The project automatically determines optimal swap paths between tokens, allowing efficient trading through multiple liquidity pools.

Built using Solidity and Hardhat, the system ensures accurate swaps through comprehensive testing and is deployed on the Sepolia testnet.

## 🚀 Features

- Multi-hop token swaps across multiple liquidity pools
- Support for **Uniswap V2 and Uniswap V3**
- Automatic swap path determination
- Secure and optimized smart contract logic
- Fully tested using Hardhat test environment
- Deployed and verified on **Sepolia Testnet**

## 🛠️ Tech Stack

- **Solidity** – Smart contract development
- **Hardhat** – Development and testing framework
- **Uniswap V2 & V3** – Decentralized exchange protocols
- **Ethers.js** – Blockchain interaction
- **Ethereum / Sepolia Testnet** – Deployment network
  
## 📦 Project Structure


uniswap-multi-hop-swap/
│
├── contracts/ # Solidity smart contracts
├── scripts/ # Deployment scripts
├── test/ # Hardhat test cases
├── hardhat.config.js # Hardhat configuration
└── README.md


## ⚙️ Installation

Clone the repository:


git clone https://github.com/YOUR-USERNAME/uniswap-multi-hop-swap.git

cd uniswap-multi-hop-swap


Install dependencies:


npm install


Compile contracts:


npx hardhat compile


Run tests:


npx hardhat test


Deploy to Sepolia:


npx hardhat run scripts/deploy.js --network sepolia


## 🔁 How Multi-Hop Swaps Work

Instead of swapping tokens directly, the system routes trades through multiple liquidity pools to achieve better price efficiency.

Example:

Token A → Token B → Token C


The smart contract automatically determines the best swap path for efficient trading.

## 🔒 Security

Smart contracts were tested with multiple scenarios to ensure:
- Accurate swap execution
- Proper token approvals
- Safe handling of liquidity pools

## 📜 License

This project is licensed under the MIT License.

