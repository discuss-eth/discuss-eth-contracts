pragma solidity 0.4.17;

import "./HashesNames.sol";

contract UserRegistry is HashesNames {
  event LogRegisterUser(address indexed owner, bytes32 indexed nameHash, bytes32 indexed avatarHash, string name);
  event LogUserTransfer(bytes32 indexed nameHash, address indexed oldOwner, address indexed newOwner);
  event LogUserAvatarUpdate(bytes32 indexed nameHash, bytes32 indexed oldAvatarHash, bytes32 indexed newAvatarHash);

  struct User {
    address owner;
    bytes32 avatarHash;
    int reputation;
    string name;
  }

  // mapping of user names to User contracts
  mapping(bytes32 => User) public users;

  function registerUser(string name, bytes32 avatarHash) public {
    bytes32 nameHash = hashName(name);
    require(users[nameHash].owner == address(0));

    users[nameHash] = User({
      owner: msg.sender,
      name: name,
      avatarHash: avatarHash,
      reputation: 0
    });

    LogRegisterUser(msg.sender, nameHash, avatarHash, name);
  }

  function getUser(bytes32 nameHash) constant public returns (address owner, bytes32 avatarHash, int reputation) {
    User storage user = users[nameHash];
    return (user.owner, user.avatarHash, user.reputation);
  }

  function transferUser(bytes32 nameHash, address newOwner) public {
    User storage user = users[nameHash];
    // is owner issuing command
    require(user.owner == msg.sender);

    // if the owner is different, do this
    if (user.owner != newOwner) {
      address oldOwner = user.owner;
      user.owner = newOwner;
      LogUserTransfer(nameHash, oldOwner, user.owner);
    }
  }

  function setUserAvatar(bytes32 nameHash, bytes32 newAvatarHash) public {
    User storage user = users[nameHash];
    // is owner issuing command
    require(user.owner == msg.sender);

    if (user.avatarHash != newAvatarHash) {
      bytes32 oldAvatarHash = user.avatarHash;
      user.avatarHash = newAvatarHash;
      LogUserAvatarUpdate(nameHash, oldAvatarHash, newAvatarHash);
    }
  }
}
