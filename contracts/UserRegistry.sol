pragma solidity 0.4.17;

import "./User.sol";
import "./HashesNames.sol";

contract UserRegistry is HashesNames {
  event LogRegisterUser(address indexed owner, address newUserAddress, string name);

  // mapping of user names to User contracts
  mapping(bytes32 => User) public users;

  function registerUser(string name) public {
    bytes32 nameHash = hashName(name);
    require(users[nameHash] == address(0));

    users[nameHash] = new User(this, msg.sender, name);
    LogRegisterUser(msg.sender, users[nameHash], name);
  }

  function getUser(string name) public constant returns (User user) {
    bytes32 nameHash = hashName(name);

    // user must exist
    require(users[nameHash] != address(0));

    return users[nameHash];
  }
}
