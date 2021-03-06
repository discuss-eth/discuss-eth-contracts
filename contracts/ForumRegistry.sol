pragma solidity 0.4.17;

import "./Forum.sol";
import "./HashesNames.sol";

contract ForumRegistry is HashesNames {
  event LogRegisterForum(address indexed administrator, address indexed newForumAddress, bytes32 hashedName, string name);

  // mapping of forum name hashes to Forum contracts
  mapping(bytes32 => Forum) public forums;

  // a mapping to record which addresses are forums
  mapping(address => bool) public isForum;

  modifier forumOnly {
    require(isForum[msg.sender]);
    _;
  }

  function registerForum(string name, int reputationThreshold) public {
    bytes32 nameHash = hashName(name);
    require(forums[nameHash] == address(0));

    forums[nameHash] = new Forum(this, msg.sender, name, reputationThreshold);
    isForum[forums[nameHash]] = true;
    LogRegisterForum(msg.sender, forums[nameHash], nameHash, name);
  }
}
