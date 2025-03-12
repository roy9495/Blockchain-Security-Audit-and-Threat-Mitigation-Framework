const Web3 = require("web3");
require("dotenv").config();

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE_URL));
const monitoredContract = "0xabcdef123456789"; // Replace with vulnerable contract address

console.log("🚀 Monitoring for reentrancy attacks...");

web3.eth.subscribe("pendingTransactions", async (txHash) => {
    try {
        const tx = await web3.eth.getTransaction(txHash);

        if (tx && tx.to.toLowerCase() === monitoredContract.toLowerCase()) {
            console.log("⚠️ Transaction to monitored contract detected:", tx);

            // Check if multiple withdrawals occur within the same block
            const block = await web3.eth.getBlock(tx.blockNumber, true);
            let withdrawalCount = block.transactions.filter(t => t.to === monitoredContract).length;

            if (withdrawalCount > 5) { // 🚨 Multiple withdrawals in same block
                console.log("🚨 Possible reentrancy attack detected!");
            }
        }

    } catch (error) {
        console.error("❌ Error fetching transaction:", error);
    }
});
