const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Running Automated Security Audit...");

const hasCommand = (cmd) => {
    try {
        execSync(cmd, { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
};

try {
    const slitherInstalled = hasCommand("slither --help");
    if (slitherInstalled) {
        console.log("🔍 Running Slither Static Analysis...");
        execSync("slither .", { stdio: "inherit" });
    } else {
        console.warn("⚠️ Slither is not installed. Skipping. (Install with: pip install slither-analyzer)");
    }

    const mythxInstalled = hasCommand("mythx --help");
    if (mythxInstalled) {
        console.log("🔍 Running MythX analysis...");
        execSync("mythx analyze src/secure-smart-contracts/SecureTemplate.sol", { stdio: "inherit" });
    } else {
        console.warn("⚠️ MythX CLI is not installed. Skipping. (Install with: pip install mythril)");
    }

    console.log("🔍 Running Hardhat Test Suite...");
    execSync("npx hardhat test", { stdio: "inherit" });

    console.log("✅ Security audit pipeline completed!");
} catch (error) {
    console.error("❌ Audit failed:", error.message);
    process.exit(1);
}
