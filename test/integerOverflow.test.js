const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integer Overflow Security Audit", function () {
  let attacker;
  let overflowContract;
  let secureContract;

  beforeEach(async function () {
    [attacker] = await ethers.getSigners();

    // Deploy Vulnerable Contract
    const OverflowFactory = await ethers.getContractFactory("IntegerOverflow");
    overflowContract = await OverflowFactory.deploy();
    await overflowContract.waitForDeployment();

    // Deploy Secure Contract
    const SecureFactory = await ethers.getContractFactory("SecureInteger");
    secureContract = await SecureFactory.deploy();
    await secureContract.waitForDeployment();
  });

  it("should wrap around to 0 on overflow in vulnerable contract", async function () {
    const maxUint256 = ethers.MaxUint256;

    // Set balance to max
    await overflowContract.increaseBalance(maxUint256);
    expect(await overflowContract.balances(attacker.address)).to.equal(maxUint256);

    // Overflow by adding 1
    await overflowContract.increaseBalance(1);
    
    // Balance should wrap around to 0 due to unchecked block
    expect(await overflowContract.balances(attacker.address)).to.equal(0n);
  });

  it("should revert on overflow in secure contract (SafeMath)", async function () {
    const maxUint256 = ethers.MaxUint256;

    // Set balance to max
    await secureContract.increaseBalance(maxUint256);
    expect(await secureContract.balances(attacker.address)).to.equal(maxUint256);

    // Adding 1 should revert due to SafeMath check
    await expect(secureContract.increaseBalance(1)).to.be.reverted;
  });
});
