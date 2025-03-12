pragma solidity ^0.8.19;

contract VulnerableLending {
    uint256 public poolBalance = 10000 ether;

    function flashLoanAttack() public {
        uint256 loanAmount = poolBalance;
        poolBalance -= loanAmount;
        msg.sender.call{value: loanAmount}("");
        poolBalance += loanAmount; // 🚨 No validation if loan was repaid!
    }
}
