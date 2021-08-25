# Task 7

## Dapp

Video: https://www.youtube.com/watch?v=AmrvqUv48OM

![](dapp.png)

## Dapp Github link
https://github.com/Domix14/Hackathon_Nervos/tree/main/MovieRanking

## Smart contract

Address: 0x99318250517941b45ef3584075F47b3b654b28bf

```
"abi": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_movieName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_rate",
          "type": "uint256"
        }
      ],
      "name": "rateMovie",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_movieName",
          "type": "string"
        }
      ],
      "name": "getMovieRating",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
```
