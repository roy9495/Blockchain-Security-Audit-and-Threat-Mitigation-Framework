const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross-Chain Bridge Security Audit", function () {
  let owner;
  let attacker;
  let insecureBridge;
  let secureBridge;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();

    // Deploy Insecure Bridge
    const InsecureFactory = await ethers.getContractFactory("InsecureBridge");
    insecureBridge = await InsecureFactory.deploy();
    await insecureBridge.waitForDeployment();

    // Deploy Secure Bridge
    const SecureFactory = await ethers.getContractFactory("SecureBridge");
    secureBridge = await SecureFactory.connect(owner).deploy();
    await secureBridge.waitForDeployment();
  });

  describe("Insecure Bridge", function () {
    it("should allow any user (attacker) to process messages", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("Message1"));
      
      // Attacker calls processMessage directly
      await expect(insecureBridge.connect(attacker).processMessage(messageId))
        .to.not.be.reverted;

      expect(await insecureBridge.processedMessages(messageId)).to.be.true;
    });
  });

  describe("Secure Bridge", function () {
    it("should prevent unauthorized users (attacker) from processing messages", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("Message1"));

      // Attacker trying to process message should revert
      await expect(secureBridge.connect(attacker).processMessage(messageId))
        .to.be.revertedWith("Not authorized");

      expect(await secureBridge.processedMessages(messageId)).to.be.false;
    });

    it("should allow owner to process messages", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("Message1"));

      // Owner calls processMessage
      await expect(secureBridge.connect(owner).processMessage(messageId))
        .to.not.be.reverted;

      expect(await secureBridge.processedMessages(messageId)).to.be.true;
    });
  });
});
