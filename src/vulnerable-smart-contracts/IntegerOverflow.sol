pragma solidity ^0.8.19;

contract IntegerOverflow {
    mapping(address => uint256) public balances;

    function increaseBalance(uint256 amount) public {
        balances[msg.sender] += amount;  // 🚨 Vulnerable: No overflow check
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Insufficient balance");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
