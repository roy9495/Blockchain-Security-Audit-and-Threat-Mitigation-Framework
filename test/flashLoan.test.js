const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Flash Loan Security Audit", function () {
  let liquidityProvider;
  let attacker;
  let vulnerablePool;
  let securePool;
  let borrower;

  beforeEach(async function () {
    [liquidityProvider, attacker] = await ethers.getSigners();

    // Deploy Vulnerable Pool
    const VulnerableFactory = await ethers.getContractFactory("VulnerableLending");
    vulnerablePool = await VulnerableFactory.deploy();
    await vulnerablePool.waitForDeployment();

    // Deploy Secure Pool
    const SecureFactory = await ethers.getContractFactory("SecureLending");
    securePool = await SecureFactory.deploy();
    await securePool.waitForDeployment();

    // Add liquidity to pools
    await vulnerablePool.connect(liquidityProvider).deposit({ value: ethers.parseEther("10") });
    await securePool.connect(liquidityProvider).deposit({ value: ethers.parseEther("10") });
  });

  describe("Vulnerable Flash Loan Pool", function () {
    beforeEach(async function () {
      const BorrowerFactory = await ethers.getContractFactory("FlashLoanBorrower");
      borrower = await BorrowerFactory.connect(attacker).deploy(await vulnerablePool.getAddress());
      await borrower.waitForDeployment();
    });

    it("should allow a borrower to drain funds without repaying", async function () {
      const initialPoolBalance = await ethers.provider.getBalance(await vulnerablePool.getAddress());
      expect(initialPoolBalance).to.equal(ethers.parseEther("10"));

      // Configure borrower not to repay
      await borrower.connect(attacker).setRepay(false);

      // Perform flash loan
      const tx = await borrower.connect(attacker).executeFlashLoan(ethers.parseEther("10"));
      await tx.wait();

      // Pool should be drained (balance = 0)
      const finalPoolBalance = await ethers.provider.getBalance(await vulnerablePool.getAddress());
      expect(finalPoolBalance).to.equal(0n);

      // Borrower contract should have the stolen 10 ETH
      const borrowerBalance = await ethers.provider.getBalance(await borrower.getAddress());
      expect(borrowerBalance).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Secure Flash Loan Pool", function () {
    beforeEach(async function () {
      const BorrowerFactory = await ethers.getContractFactory("FlashLoanBorrower");
      borrower = await BorrowerFactory.connect(attacker).deploy(await securePool.getAddress());
      await borrower.waitForDeployment();
    });

    it("should revert the transaction if borrower does not repay", async function () {
      const initialPoolBalance = await ethers.provider.getBalance(await securePool.getAddress());
      expect(initialPoolBalance).to.equal(ethers.parseEther("10"));

      // Configure borrower not to repay
      await borrower.connect(attacker).setRepay(false);

      // Flash loan execution should revert
      await expect(borrower.connect(attacker).executeFlashLoan(ethers.parseEther("10"))).to.be.revertedWith("Loan not repaid");

      // Pool balance should remain intact
      const finalPoolBalance = await ethers.provider.getBalance(await securePool.getAddress());
      expect(finalPoolBalance).to.equal(ethers.parseEther("10"));
    });

    it("should succeed if borrower repays the loan", async function () {
      const initialPoolBalance = await ethers.provider.getBalance(await securePool.getAddress());
      expect(initialPoolBalance).to.equal(ethers.parseEther("10"));

      // Configure borrower to repay
      await borrower.connect(attacker).setRepay(true);

      // Flash loan execution should succeed
      const tx = await borrower.connect(attacker).executeFlashLoan(ethers.parseEther("5"));
      await tx.wait();

      // Pool balance should remain intact (5 borrowed, 5 repaid)
      const finalPoolBalance = await ethers.provider.getBalance(await securePool.getAddress());
      expect(finalPoolBalance).to.equal(ethers.parseEther("10"));
    });
  });
});
