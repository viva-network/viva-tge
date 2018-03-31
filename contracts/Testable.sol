pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Testable is Ownable {

  bool internal testing;
  uint256 public _now;

  function Testable(bool _testing) public {
    testing = _testing;
    _now = now;
  }

  modifier whenTesting() {
    require(testing);
    _;
  }

  function getNow() public view returns (uint256) {
    if(testing) {
      return _now;
    } else {
      return now;
    }
  }

  function setNow(uint256 __now) public onlyOwner whenTesting {
    _now = __now;
  }

}
