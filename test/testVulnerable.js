const { expect } = require("chai");

describe("Vulnerable Contract", function () {
  it("Should fail due to reentrancy", async function () {
    const Vulnerable = await ethers.getContractFactory("Vulnerable");
    const contract = await Vulnerable.deploy();
    await contract.deployed();

    await contract.deposit({ value: ethers.utils.parseEther("1") });

    await expect(contract.withdraw()).to.be.revertedWith("Transfer failed");
  });
});
