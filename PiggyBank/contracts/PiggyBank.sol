pragma solidity ^0.8.1;

contract PiggyBank {
  mapping(address => uint256) balances;
  mapping(address => uint256) timelocks;

  function createBank(uint _lockTime) public {
    timelocks[msg.sender] =  block.timestamp + 10 minutes;
  }

  function deposit() public payable {
    require(timelocks[msg.sender] > block.timestamp);
    balances[msg.sender] += msg.value;
  }

  function widthraw() public payable {
    require(timelocks[msg.sender] < block.timestamp);
    require(balances[msg.sender] > 0);
    payable(msg.sender).transfer(balances[msg.sender]);
    balances[msg.sender] = 0;
  }

  function getUnlockedBalance(address _address) public view returns (uint256) {
    if(timelocks[_address] < block.timestamp) {
      return balances[_address];
    } else {
      return 0;
    }
  }

  function getRemainingTimelock(address _address) public view returns (uint256) {
    if(timelocks[_address] > block.timestamp) {
      return timelocks[_address] - block.timestamp;
     } else {
       return 0;
     }
  }

}