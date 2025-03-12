# Smart Contract Security Audit Report

## **Contract Audited**: `Vulnerable.sol`

### **Findings**
- **Reentrancy vulnerability** (High severity)
- **Integer overflow** (Medium severity)
- **Hardcoded gas limits** (Low severity)

### **Recommendations**
- Implement **reentrancy guards** (e.g., `ReentrancyGuard.sol`).
- Use **SafeMath** or Solidity 0.8+ to prevent overflows.
- Optimize gas usage dynamically.
