pragma solidity >=0.8.0;

contract Faucet {
  map(address => uint256) previousReceivers;
  uint256 delay = 60 minutes;
  uint256 amount;

  function receive(address receiver) public payable {
    require(allowedToReceive(receiver));
    receiver.transfer(amount);
    previousReceiver[receiver] = block.timestamp + delay;
  }

  function allowedToReceive(address receiver) public view returns (bool) {
      if(previousReceiver[receiver] == 0) {
          return true;
      } else if(block.timestamp >= previousReceiver[receiver]) {
          return true;
      }
      return false;
  }
}