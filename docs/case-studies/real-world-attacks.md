# **Case Study: The DAO Hack (2016)**

### **Overview**
The DAO was an Ethereum-based decentralized autonomous organization that suffered a **reentrancy attack**, resulting in **$60M stolen**.

### **Vulnerability Exploited**
- **Reentrancy Attack**: The attacker repeatedly called the `withdraw` function before the contract updated the balance.

### **Code Example (Vulnerable Smart Contract)**
```solidity
contract VulnerableDAO {
    mapping(address => uint256) public balances;

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Insufficient funds");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // Vulnerable reentrancy
    }
}
```
### **Code Example (Vulnerable Smart Contract)**
```
async function exploit() {
    const attacker = await ethers.getSigner();
    const vulnerableDAO = await ethers.getContractAt("VulnerableDAO", "0x123456789abcdef");

    // Execute reentrancy attack
    await vulnerableDAO.withdraw();
}
```
### **How It Was Fixed**
```

    Reentrancy Guards: Use OpenZeppelin's ReentrancyGuard.
    Check-Effects-Interactions Pattern:

    balances[msg.sender] = 0;  // Update state before external call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");

    Use Pull Payments: Instead of call, let users manually withdraw their funds.

```
---

# **5️⃣ Secure Cross-Chain Interoperability Automation**  

## **📂 `src/interoperability/secureBridge.sol`** (Secure Cross-Chain Messaging)
```solidity
// Secure Cross-Chain Messaging Contract using LayerZero
pragma solidity ^0.8.19;
```
contract SecureBridge {
    mapping(bytes32 => bool) public processedMessages;

    function receiveMessage(bytes32 messageId, string memory message) public {
        require(!processedMessages[messageId], "Message already processed");
        processedMessages[messageId] = true;

        // Handle cross-chain message securely
    }
}
```