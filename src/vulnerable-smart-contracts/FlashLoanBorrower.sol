// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILendingPool {
    function flashLoan(uint256 amount) external;
}

contract FlashLoanBorrower {
    address public pool;
    bool public repay;

    constructor(address _pool) {
        pool = _pool;
    }

    function setRepay(bool _repay) external {
        repay = _repay;
    }

    function executeFlashLoan(uint256 amount) external {
        ILendingPool(pool).flashLoan(amount);
    }

    // Callback invoked by the lending pool
    function executeCallback() external payable {
        if (repay) {
            // Repay the loan by sending the ether back
            (bool success, ) = msg.sender.call{value: msg.value}("");
            require(success, "Repayment failed");
        }
    }

    receive() external payable {}
}
