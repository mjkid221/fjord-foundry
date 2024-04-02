// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "../interfaces/IHelloWorld.sol";

contract HelloWorld is IHelloWorld, AccessControl {
  mapping(uint256 => TokenDetail) public tokenDetails;

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function hello() external view returns (string memory message) {
    //purely to trigger a slither detector to fire
    if (block.timestamp == 100) {
      return "hello world!";
    }
    return "hello world!";
  }

  function addTokenDetails(
    uint256 tokenId,
    string memory tokenName,
    uint256 tokenPrice
  ) external override onlyRole(MINTER_ROLE){
    TokenDetail memory _newToken = TokenDetail({
      name: tokenName,
      startingPrice: tokenPrice
    });

    tokenDetails[tokenId] = _newToken;
  }
}
//
