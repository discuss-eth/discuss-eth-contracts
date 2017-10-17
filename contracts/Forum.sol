pragma solidity 0.4.17;

import "./Registry.sol";
import "./Owned.sol";
import "./HashesNames.sol";
import "./ForumRegistry.sol";
import "./User.sol";
import "./Post.sol";
import "./HashesNames.sol";

contract Forum is Owned, HashesNames {
  event LogNewThread(address indexed sender, address indexed user, bytes32 indexed threadNameHash, address newThreadAddress);
  event LogNewReply(address indexed inReplyTo, address indexed sender, address indexed user, bytes32 subjectHash, address replyAddress);
  event LogSetReputationThreshold(address indexed actor, int oldReputationThreshold, int newReputationThreshold);

  // name of the forum
  string public name;

  // mapping of banned users
  mapping(address => bool) public userBans;

  // minimum threshold of reputation to participate
  int public reputationThreshold;

  // threads are just posts stored in this array
  mapping(address => bool) public isPost;

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

  function post(
    bytes32 userNameHash, string threadName,
    bytes32[] contentHashes, bytes32[] filenames
  ) public
    returns (Post) {
    // get the user
    User user = getUser(userNameHash);

    Post newPost = new Post(
      this, address(0),
      user, threadName,
      contentHashes, filenames
    );

    isPost[newPost] = true;

    LogNewThread(msg.sender, user, hashName(threadName), newPost);

    return newPost;
  }

  function reply(
    Post postAddress,
    bytes32 userNameHash, string _subject,
    bytes32[] contentHashes, bytes32[] filenames
  ) public
    returns (Post) {
    require(isPost[postAddress]);

    User user = getUser(userNameHash);

    Post replyPost = new Post(
      this, postAddress,
      user, _subject,
      contentHashes, filenames
    );

    isPost[replyPost] = true;

    LogNewReply(postAddress, msg.sender, user, hashName(_subject), replyPost);
  }

}
