pragma solidity ^0.8.1;

contract PiggyBank {
  mapping(address => uint256) balances;
  mapping(address => uint256) timelocks;

  function createBank(address _ownerAddress, uint _lockTime) public {
    timelocks[_ownerAddress] = block.timestamp + 10 minutes;
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

  function getUnlockedBalance(address _ownerAddress) public view returns (uint256) {
    if(timelocks[_ownerAddress] < block.timestamp) {
      return balances[_ownerAddress];
    } else {
      return 0;
    }
  }

  function getRemainingTimelock(address _ownerAddress) public view returns (uint256) {
    if(timelocks[_ownerAddress] > block.timestamp) {
      return timelocks[_ownerAddress] - block.timestamp;
     } else {
       return 0;
     }
  }

}