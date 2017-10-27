pragma solidity 0.4.17;

import "./ForumRegistry.sol";
import "./UserRegistry.sol";

contract Registry is UserRegistry, ForumRegistry {
  function incrementReputation(bytes32 nameHash, int by) public forumOnly {
    users[nameHash].reputation += by;
  }
}
