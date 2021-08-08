pragma solidity >=0.8.0;

contract Faucet {
  mapping(address => uint256) previousReceivers;
  uint256 delay = 60 minutes;
  uint256 amount;

  function receive(address payable receiver) public payable {
    require(allowedToReceive(receiver));
    receiver.transfer(amount);
    previousReceivers[receiver] = block.timestamp + delay;
  }

  function allowedToReceive(address receiver) public view returns (bool) {
      if(previousReceivers[receiver] == 0) {
          return true;
      } else if(block.timestamp >= previousReceivers[receiver]) {
          return true;
      }
      return false;
  }
}