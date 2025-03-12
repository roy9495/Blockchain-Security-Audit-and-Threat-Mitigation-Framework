contract SecureLending {
    function flashLoan(uint256 amount) external {
        uint256 balanceBefore = address(this).balance;
        require(balanceBefore >= amount, "Insufficient liquidity");

        payable(msg.sender).transfer(amount);
        
        // ✅ Require repayment before processing further logic
        require(address(this).balance >= balanceBefore, "Loan not repaid");
    }
}
