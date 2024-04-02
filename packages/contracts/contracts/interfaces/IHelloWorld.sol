// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface IHelloWorld {
  struct TokenDetail {
    string name;
    uint256 startingPrice;
  }

  function hello() external returns (string memory message);

  function addTokenDetails(
    uint256 tokenId,
    string memory tokenName,
    uint256 tokenPrice
  ) external;
}
