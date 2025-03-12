const { ethers } = require("hardhat");

async function main() {
    const [attacker] = await ethers.getSigners();

    // Deploy vulnerable lending contract
    const FlashLoan = await ethers.getContractFactory("VulnerableLending");
    const flashLoan = await FlashLoan.deploy();
    await flashLoan.deployed();
    console.log("Flash loan contract deployed at:", flashLoan.address);

    // Exploit flash loan
    console.log("🚨 Executing flash loan exploit...");
    await flashLoan.flashLoanAttack();
}

main().catch((error) => {
    console.error("❌ Attack failed:", error);
    process.exit(1);
});
