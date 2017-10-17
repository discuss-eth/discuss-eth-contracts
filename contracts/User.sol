pragma solidity 0.4.17;

import "./Owned.sol";

contract User is Owned {
  address public registry;
  string public name;
  bytes32 public avatarIpfsHash;

  int public reputation;

  function User(address _registry, address _owner, string _name) Owned(_owner) public {
    registry = _registry;
    name = _name;
  }

  function setAvatar(bytes32 _avatarIpfsHash) ownerOnly public {
    avatarIpfsHash = _avatarIpfsHash;
  }
}
