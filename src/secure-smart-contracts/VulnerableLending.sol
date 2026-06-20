// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureLending is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function flashLoan(uint256 amount) external nonReentrant {
        uint256 balanceBefore = address(this).balance;
        require(balanceBefore >= amount, "Insufficient liquidity");

        // Hand over ether to the borrower and execute callback
        (bool success, ) = msg.sender.call{value: amount}(
            abi.encodeWithSignature("executeCallback()")
        );
        require(success, "Callback failed");
        
        // ✅ Require repayment before processing further logic
        require(address(this).balance >= balanceBefore, "Loan not repaid");
    }

    // Allow contract to receive Ether repayments
    receive() external payable {}
}
