const { ethers } = require("hardhat");

async function main() {
  // Your deployed contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Connect to the contract
  const swapper = await ethers.getContractAt("UniswapMultihopSwapper", CONTRACT_ADDRESS);

  console.log("=== Uniswap Multihop Swapper Interaction ===");
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("Owner:", await swapper.owner());
  console.log("WETH:", await swapper.WETH());
  console.log("V2 Router:", await swapper.UNISWAP_V2_ROUTER());
  console.log("V3 Router:", await swapper.UNISWAP_V3_ROUTER());

  // Test tokens on Sepolia
  const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  // Example: Estimate swap
  const amountIn = ethers.parseEther("0.01"); // 0.01 ETH

  console.log("\n=== Swap Estimation ===");
  console.log("From: WETH");
  console.log("To: USDC");
  console.log("Amount In:", ethers.formatEther(amountIn), "ETH");

  try {
    const estimateV2 = await swapper.estimateSwap(WETH, USDC, amountIn, 0);
    console.log("V2 Estimated Output:", ethers.formatUnits(estimateV2, 6), "USDC");

    const estimateV3 = await swapper.estimateSwap(WETH, USDC, amountIn, 1);
    console.log("V3 Estimated Output:", ethers.formatUnits(estimateV3, 6), "USDC");
  } catch (error) {
    console.log("Estimation failed:", error.message);
  }

  // Check contract ETH balance
  const balance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
  console.log("\nContract ETH Balance:", ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });