const { execSync } = require("child_process");
const fs = require("fs");

function captureLogs(txHash) {
    console.log(`📌 Capturing logs for suspicious transaction: ${txHash}`);

    try {
        const logs = execSync(`geth --exec 'debug.traceTransaction("${txHash}")' attach`).toString();
        fs.writeFileSync(`incident-response/logs/${txHash}.json`, logs);
        console.log("✅ Logs saved for analysis!");
    } catch (error) {
        console.error("❌ Failed to capture logs:", error.message);
    }
}
