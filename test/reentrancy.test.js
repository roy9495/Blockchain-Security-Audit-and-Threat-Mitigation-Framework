const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy Security Audit", function () {
  let deployer;
  let user1;
  let attackerUser;

  beforeEach(async function () {
    [deployer, user1, attackerUser] = await ethers.getSigners();
  });

  describe("Vulnerable Reentrancy Contract", function () {
    let vulnerable;
    let attackerContract;

    beforeEach(async function () {
      // Deploy vulnerable contract
      const VulnerableFactory = await ethers.getContractFactory("Vulnerable");
      vulnerable = await VulnerableFactory.deploy();
      await vulnerable.waitForDeployment();

      // Defer user deposits to fund the victim contract
      await vulnerable.connect(user1).deposit({ value: ethers.parseEther("10") });

      // Deploy attacker contract
      const AttackerFactory = await ethers.getContractFactory("ReentrancyAttacker");
      attackerContract = await AttackerFactory.connect(attackerUser).deploy(await vulnerable.getAddress());
      await attackerContract.waitForDeployment();
    });

    it("should allow an attacker to drain the contract via reentrancy", async function () {
      const initialVictimBalance = await ethers.provider.getBalance(await vulnerable.getAddress());
      expect(initialVictimBalance).to.equal(ethers.parseEther("10"));

      // Attacker initiates attack with 1 ETH
      const attackTx = await attackerContract.connect(attackerUser).deposit({ value: ethers.parseEther("1") });
      await attackTx.wait();

      // Launch the attack
      const triggerTx = await attackerContract.connect(attackerUser).attack();
      await triggerTx.wait();

      // The victim contract should be drained (balance = 0)
      const finalVictimBalance = await ethers.provider.getBalance(await vulnerable.getAddress());
      expect(finalVictimBalance).to.equal(0n);

      // Attacker contract should have 11 ETH (10 drained + 1 initial)
      const finalAttackerContractBalance = await ethers.provider.getBalance(await attackerContract.getAddress());
      expect(finalAttackerContractBalance).to.equal(ethers.parseEther("11"));
    });
  });

  describe("Secure Reentrancy Contract", function () {
    let secure;
    let attackerContract;

    beforeEach(async function () {
      // Deploy secure contract
      const SecureFactory = await ethers.getContractFactory("SecureReentrancy");
      secure = await SecureFactory.deploy();
      await secure.waitForDeployment();

      // Defer user deposits to fund the contract
      await secure.connect(user1).deposit({ value: ethers.parseEther("10") });

      // Deploy attacker contract pointing to secure contract
      const AttackerFactory = await ethers.getContractFactory("ReentrancyAttacker");
      attackerContract = await AttackerFactory.connect(attackerUser).deploy(await secure.getAddress());
      await attackerContract.waitForDeployment();
    });

    it("should block the attack and prevent draining via ReentrancyGuard", async function () {
      const initialVictimBalance = await ethers.provider.getBalance(await secure.getAddress());
      expect(initialVictimBalance).to.equal(ethers.parseEther("10"));

      // Attacker deposits 1 ETH
      const depositTx = await attackerContract.connect(attackerUser).deposit({ value: ethers.parseEther("1") });
      await depositTx.wait();

      // Attack should revert
      await expect(attackerContract.connect(attackerUser).attack()).to.be.reverted;
      
      // Balance should remain intact
      const finalVictimBalance = await ethers.provider.getBalance(await secure.getAddress());
      expect(finalVictimBalance).to.be.closeTo(ethers.parseEther("11"), ethers.parseEther("0.01")); // 10 original + 1 deposited
    });
  });
});
