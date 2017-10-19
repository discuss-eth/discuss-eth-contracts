pragma solidity 0.4.17;

import "./Registry.sol";
import "./Owned.sol";

contract Forum is Owned {
  uint nextPostId = 1;

  struct Post {
    // the id of the new post
    uint id;

    // the key of the thread
    bytes32 threadKey;

    // the post being replied to
    uint inReplyTo;

    // the subject of the post
    string subject;

    // the hash of the body of the post
    bytes32 bodyHash;

    // the hash of the user name that made the post
    bytes32 userNameHash;

    // additional content hashes and filenames
    bytes32[] contentHashes;
    bytes32[] contentFilenames;
  }

  event LogPost(bytes32 indexed userNameHash, bytes32 indexed threadKey, uint inReplyTo, address sender, uint newPostId);
  event LogSetReputationThreshold(address indexed actor, int oldReputationThreshold, int newReputationThreshold);

  // name of the forum
  string public name;

  // mapping of banned users
  mapping(bytes32 => bool) public userBans;

  // minimum threshold of reputation to participate in this forum
  int public reputationThreshold;

  // the registry that created this forum
  address public registry;

  // the posts in this forum
  mapping(uint => Post) posts;

  function Forum(
    address _registry, address _owner,
    string _name, int _reputationThreshold
  ) Owned(_owner) public {
    name = _name;
    reputationThreshold = _reputationThreshold;
    registry = _registry;
  }

  function setReputationThreshold(int _reputationThreshold) ownerOnly public {
    int oldReputationThreshold = reputationThreshold;

    reputationThreshold = _reputationThreshold;

    LogSetReputationThreshold(msg.sender, oldReputationThreshold, reputationThreshold);
  }

  function post(
    uint inReplyTo, bytes32 userNameHash,
    string subject, bytes32 bodyHash,
    bytes32[] contentHashes, bytes32[] contentFilenames
  ) public
    returns (uint) {
    // user requirements
    var (owner,, reputation) = Registry(registry).getUser(userNameHash);
    // require the user has enough reputation to participate in the forum
    require(reputationThreshold <= reputation);

    // msg sender is the owner
    require(msg.sender == owner);

    // user is not banned
    require(!userBans[userNameHash]);

    // not in reply to anything, or the id it's in reply to exists
    require(inReplyTo == 0 || posts[inReplyTo].id != 0);

    // require that there is a filename for every hash (and vice versa)
    require(contentHashes.length == contentFilenames.length);

    // generate the post ID
    uint newPostId = nextPostId++;

    // get the thread key
    bytes32 threadKey = inReplyTo == 0 ? keccak256(subject) : posts[inReplyTo].threadKey;

    posts[newPostId] = Post({
      id: newPostId,
      threadKey: threadKey,
      inReplyTo: inReplyTo,
      subject: subject,
      bodyHash: bodyHash,
      userNameHash: userNameHash,
      contentHashes: contentHashes,
      contentFilenames: contentFilenames
    });

    LogPost(userNameHash, threadKey, inReplyTo, msg.sender, newPostId);

    return newPostId;
  }

}
