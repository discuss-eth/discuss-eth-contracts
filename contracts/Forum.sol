pragma solidity 0.4.17;

import "./Registry.sol";
import "./Owned.sol";
import "./HashesNames.sol";
import "./ForumRegistry.sol";
import "./User.sol";
import "./Post.sol";

contract Forum is Owned {
  event LogNewThread(address indexed sender, address indexed user, bytes32 threadNameHash);
  event LogNewReply(address indexed post, address indexed sender, address indexed user, bytes32 threadNameHash);
  event LogSetReputationThreshold(address indexed actor, int oldReputationThreshold, int newReputationThreshold);

  // name of the forum
  string public name;

  // mapping of banned users
  mapping(address => bool) public userBans;

  // minimum threshold of reputation to participate
  int public reputationThreshold;

  // threads are just posts stored in this array
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

  function getUser(bytes32 userNameHash) internal constant returns (User) {
    // get the user
    User user = Registry(registry).users(userNameHash);

    // require the sender is not banned
    require(!userBans[user]);

    // require that the msg sender is currently the owner of the user
    require(msg.sender == user.owner());

    // require the user has enough reputation to participate in the forum
    require(reputationThreshold <= user.reputation());

    return user;
  }

  function setReputationThreshold(int _reputationThreshold) ownerOnly public {
    int oldReputationThreshold = reputationThreshold;
    reputationThreshold = _reputationThreshold;
    LogSetReputationThreshold(msg.sender, oldReputationThreshold, reputationThreshold);
  }

  function createThread(
    bytes32 userNameHash, string threadName, bytes32[] contentHashes, bytes32[] filenames
  ) public {
    // get the user
    User user = getUser(userNameHash);

    threads.push(
      new Post(
        this, address(0),
        user, threadName,
        contentHashes, filenames
      )
    );

    LogNewThread(msg.sender, user, keccak256(threadName));
  }

//  function replyTo(
//    address post,
//    bytes32 userNameHash, string _subject,
//    bytes32[] contentHashes, bytes32[] filenames
//  ) public
//    returns (Post) {
//    User user = getUser(userNameHash);
//
//    return new Post(
//      forum, this,
//      user, _subject,
//      contentHashes, filenames
//    );
//  }

}
