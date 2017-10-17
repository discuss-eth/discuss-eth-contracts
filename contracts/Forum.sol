pragma solidity 0.4.17;

import "./Registry.sol";
import "./Owned.sol";
import "./HashesNames.sol";
import "./ForumRegistry.sol";
import "./User.sol";
import "./Post.sol";

contract Forum is Owned {
  // name of the forum
  string public name;

  // mapping of banned users
  mapping(address => bool) public userBans;

  // minimum threshold of reputation to participate
  int public reputationThreshold;

  // threads are just posts not in reply to anything
  Post[] public threads;

  // the registry that created this forum
  address public registry;

  function Forum(
    address _registry, address _owner,
    string _name, int _reputationThreshold
  ) Owned(_owner) public {
    name = _name;
    reputationThreshold = _reputationThreshold;
    registry = _registry;
  }

  function createThread(string userName, string threadName, string content) public {
    // get the user
    User user = Registry(registry).getUser(userName);

    // require the sender is not banned
    require(!userBans[user]);

    // require that the msg sender is currently the owner of the user
    require(msg.sender == user.owner());

    threads.push(
      new Post(
        this, address(0),
        user, threadName, content
      )
    );

  }

}
