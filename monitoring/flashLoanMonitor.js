const Web3 = require("web3");
require("dotenv").config();

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE_URL));
const lendingPoolAddress = "0x123456789abcdef"; // Replace with actual DeFi lending pool

console.log("🚀 Monitoring for flash loan attacks...");

web3.eth.subscribe("pendingTransactions", async (txHash) => {
    try {
        const tx = await web3.eth.getTransaction(txHash);

        if (tx && tx.to.toLowerCase() === lendingPoolAddress.toLowerCase()) {
            const valueInEth = web3.utils.fromWei(tx.value, "ether");

            if (parseFloat(valueInEth) > 1000) { // 🚨 Large flash loan detected
                console.log("⚠️ Possible flash loan attack detected! Transaction:", tx);
            }
        }

    } catch (error) {
        console.error("❌ Error fetching transaction:", error);
    }
});
