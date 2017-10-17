pragma solidity 0.4.17;

contract Owned {
  address public owner;

  event LogOwnerSet(address oldOwner, address newOwner);

  function Owned(address _owner) public {
    owner = _owner;
  }

  function setOwner(address newOwner) public ownerOnly {
    require(newOwner != address(0));

    address oldOwner = owner;
    owner = newOwner;

    LogOwnerSet(oldOwner, newOwner);
  }

  modifier ownerOnly() {
    require(msg.sender == owner);
    _;
  }
}
