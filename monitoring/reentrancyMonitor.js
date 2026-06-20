const Web3 = require("web3");
require("dotenv").config();

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETH_NODE_URL));
const monitoredContract = "0xabcdef123456789"; // Replace with vulnerable contract address

console.log("🚀 Monitoring for reentrancy attacks...");

const subscription = web3.eth.subscribe("newBlockHeaders", async (error, blockHeader) => {
    if (error) {
        console.error("❌ Subscription error:", error);
        return;
    }

    try {
        const block = await web3.eth.getBlock(blockHeader.number, true);

        if (block && block.transactions) {
            const contractCalls = block.transactions.filter(
                (tx) => tx.to && tx.to.toLowerCase() === monitoredContract.toLowerCase()
            );

            if (contractCalls.length > 5) { // 🚨 Multiple interactions in the same block
                console.log(`🚨 Possible reentrancy attack detected in block ${blockHeader.number}! Calls count: ${contractCalls.length}`);
            }
        }
    } catch (err) {
        console.error("❌ Error processing block:", err);
    }
});
