const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_NODE_URL);
const monitoredBridge = "0x123456789abcdef"; // Replace with actual bridge contract

console.log("🚀 Monitoring for cross-chain replay attacks...");

async function monitorCrossChainTransactions() {
    const latestBlock = await provider.getBlockNumber();
    const block = await provider.getBlockWithTransactions(latestBlock);

    for (let tx of block.transactions) {
        if (tx.to === monitoredBridge) {
            console.log("🔍 Detected bridge transaction:", tx.hash);

            // Check if transaction hash exists on another chain
            const foundOnOtherChain = await checkOtherChain(tx.hash);
            if (foundOnOtherChain) {
                console.log("🚨 Replay attack detected! Transaction:", tx.hash);
            }
        }
    }
}

async function checkOtherChain(txHash) {
    // Simulating checking another chain (replace with actual RPC)
    return false; // Replace with actual logic
}

setInterval(monitorCrossChainTransactions, 10000);
