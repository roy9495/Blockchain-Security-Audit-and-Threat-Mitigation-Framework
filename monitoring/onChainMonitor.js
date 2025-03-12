const Web3 = require("web3");
require("dotenv").config();

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE_URL));

console.log("🚀 Monitoring Ethereum transactions for suspicious activity...");

// Monitor all pending transactions
web3.eth.subscribe("pendingTransactions", async (txHash) => {
    try {
        const tx = await web3.eth.getTransaction(txHash);

        if (tx && tx.value > web3.utils.toWei("100", "ether")) { // 🚨 Large transactions alert
            console.log("⚠️ High-value transaction detected:", tx);
        }

        if (tx && tx.to === "0xabcdef123456789") { // 🚨 Watchlisted contract
            console.log("⚠️ Transaction to risky contract detected:", tx);
        }

    } catch (error) {
        console.error("❌ Error fetching transaction:", error);
    }
});
