pragma solidity 0.4.17;

contract HashesNames {
  function hashName(string name) public pure returns (bytes32) {
    return keccak256(name);
  }
}
