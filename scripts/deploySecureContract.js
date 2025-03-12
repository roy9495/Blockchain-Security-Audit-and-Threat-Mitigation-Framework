const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Secure Contract...");

  // Get the contract factory
  const Secure = await ethers.getContractFactory("Secure");

  // Deploy the contract
  const secureContract = await Secure.deploy();
  await secureContract.deployed();

  console.log("Secure contract deployed at:", secureContract.address);
}

// Execute deployment script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});