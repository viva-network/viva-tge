pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract FrozenUntil is Ownable {

  uint256 public frozenUntil;

  function FrozenUntil(uint256 _frozenUntil) public {
    frozenUntil = _frozenUntil;
  }

  modifier whenNotFrozen() {
    require(!isFrozen(now));
    _;
  }

  modifier whenFrozen() {
    require(isFrozen(now));
    _;
  }

  function isFrozen(uint256 at) public view returns (bool) {
    return at < frozenUntil;
  }

  function freezeUntil(uint256 _frozenUntil) onlyOwner public {
    frozenUntil = _frozenUntil;
  }

  function testNotFrozen() public view whenNotFrozen {}
  function testFrozen() public view whenFrozen {}

}
