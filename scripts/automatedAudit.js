const { execSync } = require("child_process");

console.log("🚀 Running automated security audit...");

try {
    console.log("🔍 Running Slither...");
    execSync("slither src/smart-contracts/Secure.sol", { stdio: "inherit" });

    console.log("🔍 Running MythX analysis...");
    execSync("mythx analyze src/smart-contracts/Secure.sol", { stdio: "inherit" });

    console.log("✅ Security audit completed successfully!");
} catch (error) {
    console.error("❌ Audit failed:", error.message);
    process.exit(1);
}
