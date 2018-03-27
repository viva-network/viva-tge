pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract FrozenUntil is Ownable {

  uint256 public until;

  function FrozenUntil(uint256 _until) public {
    until = _until;
  }

  modifier whenNotFrozen() {
    require(!isFrozen(now));
    _;
  }

  function isFrozen(uint256 at) public view returns (bool) {
    return at < until;
  }

  function freezeUntil(uint256 _until) onlyOwner public {
    until = _until;
  }

  function getFrozenUntil() public view returns (uint256) {
    return until;
  }

  function test() public view whenNotFrozen {}

}
