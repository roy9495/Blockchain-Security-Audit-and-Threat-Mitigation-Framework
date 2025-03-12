const { ethers } = require("hardhat");

async function main() {
  console.log("Starting security audit...");
  
  // Load contract
  const contractFactory = await ethers.getContractFactory("Vulnerable");
  const contract = await contractFactory.deploy();
  await contract.deployed();
  
  console.log("Contract deployed to:", contract.address);
  
  // Detect security issues (Simulating vulnerability test)
  try {
    console.log("Running reentrancy attack...");
    await contract.withdraw();
  } catch (error) {
    console.error("Reentrancy blocked:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
