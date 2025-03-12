import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SecureInteger {
    using SafeMath for uint256;
    
    function increaseBalance(uint256 amount) public {
        balances[msg.sender] = balances[msg.sender].add(amount); // ✅ SafeMath prevents overflows
    }
}
