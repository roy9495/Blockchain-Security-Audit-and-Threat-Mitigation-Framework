// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VulnerableLending {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function flashLoan(uint256 amount) external {
        uint256 balanceBefore = address(this).balance;
        require(balanceBefore >= amount, "Insufficient liquidity");

        // Hand over ether to the borrower and execute callback
        (bool success, ) = msg.sender.call{value: amount}(
            abi.encodeWithSignature("executeCallback()")
        );
        require(success, "Callback failed");

        // 🚨 Vulnerable: No validation if the loan was repaid!
    }

    // Allow contract to receive Ether
    receive() external payable {}
}
