const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying UniswapMultihopSwapper...");
  
  const UniswapMultihopSwapper = await ethers.getContractFactory("UniswapMultihopSwapper");
  const swapper = await UniswapMultihopSwapper.deploy();
  
  await swapper.waitForDeployment();
  
  const contractAddress = await swapper.getAddress();
  
  console.log("UniswapMultihopSwapper deployed to:", contractAddress);
  console.log("Owner:", await swapper.owner());
  
  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const networkDir = path.join(deploymentsDir, (await ethers.provider.getNetwork()).chainId.toString());
  
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
  if (!fs.existsSync(networkDir)) fs.mkdirSync(networkDir);
  
  const deploymentInfo = {
    address: contractAddress,
    abi: JSON.parse(swapper.interface.formatJson()),
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name
  };
  
  fs.writeFileSync(
    path.join(networkDir, "UniswapMultihopSwapper.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });