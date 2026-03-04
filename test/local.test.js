const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniswapMultihopSwapper Local Tests", function () {
  let swapper;
  let owner;

  beforeEach(async function () {
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
      expect(await swapper.UNISWAP_V2_ROUTER()).to.equal("0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008");
      expect(await swapper.UNISWAP_V3_ROUTER()).to.equal("0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E");
      expect(await swapper.WETH()).to.equal("0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14");
      expect(await swapper.USDC()).to.equal("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
    });
  });

  describe("Security Tests", function () {
    it("Should not allow non-owner to rescue tokens", async function () {
      const [_, nonOwner] = await ethers.getSigners();
      
      await expect(
        swapper.connect(nonOwner).rescueTokens(ethers.ZeroAddress, 1)
      ).to.be.revertedWith("Not owner");
    });

    it("Should transfer ownership", async function () {
      const [_, newOwner] = await ethers.getSigners();
      
      await swapper.transferOwnership(newOwner.address);
      expect(await swapper.owner()).to.equal(newOwner.address);
    });

    it("Should not allow zero address as new owner", async function () {
      await expect(
        swapper.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Edge Cases", function () {
    it("Should reject swap with zero amount", async function () {
      await expect(
        swapper.swap(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          0,
          0, // V2
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should reject swap with expired deadline", async function () {
      await expect(
        swapper.swap(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          0, // V2
          Math.floor(Date.now() / 1000) - 1 // Expired
        )
      ).to.be.revertedWith("Deadline passed");
    });
  });
});
