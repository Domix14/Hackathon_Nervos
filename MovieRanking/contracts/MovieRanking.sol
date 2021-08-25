pragma solidity ^0.8.1;

contract MovieRanking {

  struct Rating {
    uint8 rate;
    string movieName;
    address raterAddress;
  }

  uint256 ratingCount;

  mapping(uint256 => Rating) ratings;

  function rateMovie(string memory _movieName, uint256 _rate) public {
    require(_rate <= 100);
    ratings[ratingCount] = Rating(uint8(_rate), _movieName, msg.sender);
    ratingCount++;
  }

  function getMovieRating(string memory _movieName) external view returns (uint256) {
    uint256 ratesSum = 0;
    uint256 ratesCount = 0;
    for(uint256 i = 0;i < ratingCount;i++)
    {
      if(keccak256(abi.encodePacked(ratings[i].movieName)) == keccak256(abi.encodePacked(_movieName))) {
        ratesSum += ratings[i].rate;
        ratesCount++;
      }
    }
    return ratesSum / ratesCount;
  }

}