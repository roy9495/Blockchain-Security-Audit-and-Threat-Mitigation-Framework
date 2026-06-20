const { ethers } = require("ethers");
require("dotenv").config();

// Ethers v6 JSON-RPC Provider
const provider = new ethers.JsonRpcProvider(process.env.ETH_NODE_URL);
const monitoredBridge = "0x123456789abcdef"; // Replace with actual bridge contract

console.log("🚀 Monitoring for cross-chain replay attacks...");

async function monitorCrossChainTransactions() {
    try {
        const latestBlock = await provider.getBlockNumber();
        // Ethers v6: getBlock(blockNumber, true) prefetches full transactions
        const block = await provider.getBlock(latestBlock, true);

        if (block && block.transactions) {
            for (let tx of block.transactions) {
                // Safeguard against string hashes vs transaction objects
                const toAddress = (tx && typeof tx === "object") ? tx.to : null;
                const txHash = (tx && typeof tx === "object") ? tx.hash : tx;

                if (toAddress && toAddress.toLowerCase() === monitoredBridge.toLowerCase()) {
                    console.log("🔍 Detected bridge transaction:", txHash);

                    // Check if transaction hash exists on another chain
                    const foundOnOtherChain = await checkOtherChain(txHash);
                    if (foundOnOtherChain) {
                        console.log("🚨 Replay attack detected! Transaction:", txHash);
                    }
                }
            }
        }
    } catch (error) {
        console.error("❌ Error in cross-chain monitor:", error.message);
    }
}

async function checkOtherChain(txHash) {
    // Simulating checking another chain (replace with actual RPC)
    return false; // Replace with actual logic
}

setInterval(monitorCrossChainTransactions, 10000);
