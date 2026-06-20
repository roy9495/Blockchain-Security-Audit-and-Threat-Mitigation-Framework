// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SecureInteger {
    using SafeMath for uint256;
    
    mapping(address => uint256) public balances;
    
    function increaseBalance(uint256 amount) public {
        balances[msg.sender] = balances[msg.sender].add(amount); // ✅ SafeMath prevents overflows
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Insufficient balance");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
