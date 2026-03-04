const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Read deployment address from a file (create this in deploy.js)
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia", "UniswapMultihopSwapper.json");
  
  let contractAddress;
  
  try {
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      contractAddress = deployment.address;
    } else {
      // Ask for address if file doesn't exist
      contractAddress = process.argv[2];
      if (!contractAddress) {
        console.error("Please provide contract address as argument or create deployment file");
        console.error("Usage: npx hardhat run scripts/verify.js --network sepolia <contract_address>");
        process.exit(1);
      }
    }
  } catch (error) {
    contractAddress = process.argv[2];
    if (!contractAddress) {
      console.error("Error reading deployment file:", error.message);
      console.error("Please provide contract address as argument");
      process.exit(1);
    }
  }
  
  console.log(`Verifying contract at ${contractAddress}...`);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract already verified!");
    } else {
      console.error("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });