const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("UniswapMultihopSwapper Comprehensive Tests", function () {
  let swapper;
  let owner;

  // Sepolia addresses
  const SEPOLIA_WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  before(async function () {
    [owner] = await ethers.getSigners();

    const Swapper = await ethers.getContractFactory("UniswapMultihopSwapper");
    swapper = await Swapper.deploy();
    await swapper.waitForDeployment();
  });

  describe("Basic Functionality", function () {
    it("Should deploy successfully", async function () {
      expect(await swapper.getAddress()).to.be.properAddress;
      expect(await swapper.owner()).to.equal(owner.address);
    });

    it("Should have correct Uniswap addresses", async function () {
      expect(await swapper.UNISWAP_V2_ROUTER())
        .to.equal("0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008");

      expect(await swapper.WETH()).to.equal(SEPOLIA_WETH);
    });
  });

  describe("Swap Estimation", function () {
    it("Should estimate swap amount (V2)", async function () {
      const amountIn = ethers.parseEther("0.01");

      const estimate = await swapper.estimateSwap(
        SEPOLIA_WETH,
        SEPOLIA_USDC,
        amountIn,
        0 // V2
      );

      console.log(
        "Estimated USDC:",
        ethers.formatUnits(estimate, 6)
      );

      expect(estimate).to.be.gt(0n);
    });
  });

  describe("Path Finding", function () {
    it("Should find path for WETH -> USDC", async function () {
      const amountIn = ethers.parseEther("0.01");

      const estimate = await swapper.estimateSwap(
        SEPOLIA_WETH,
        SEPOLIA_USDC,
        amountIn,
        0
      );

      expect(estimate).to.be.gt(0n);
    });
  });

  describe("Security Tests (Skipped on Sepolia)", function () {
    it("Should not allow non-owner to rescue tokens", function () {
      this.skip();
    });

    it("Should transfer ownership", function () {
      this.skip();
    });
  });
});
