pragma solidity ^0.8.1;

contract BasicToken {

  string public constant name;
  string public constant symbol;
  uint8 public constant decimals = 18;
  uint256 totalSupply;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  constructor(string memory _name, string memory _symbol, uint256 _supply) public {
    name = _name;
    symbol = _symbol;
    totalSupply = _supply;
    balances[msg.sender] = _supply;
  }

  mapping(address => uint256) balances; // a mapping of all user's balances

  function transfer(address recipient, uint256 value) public {
    balances[msg.sender] -= value;
    balances[recipient] += value;
  }

  function balanceOf(address account) public returns (uint256) {
    return balances[account];
  }

}