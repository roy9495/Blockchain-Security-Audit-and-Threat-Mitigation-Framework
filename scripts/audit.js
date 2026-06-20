const { ethers } = require("hardhat");

async function main() {
  console.log("Starting manual security audit simulation...");
  
  // Deploy Vulnerable Contract
  const contractFactory = await ethers.getContractFactory("Vulnerable");
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("Vulnerable Contract deployed to:", contractAddress);
  
  // Simulate checking reentrancy
  try {
    console.log("Checking reentrancy on contract withdraw function...");
    const tx = await contract.withdraw();
    await tx.wait();
  } catch (error) {
    console.log("Execution result (expected to revert if balance is 0 or guard is active):", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
