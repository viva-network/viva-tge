pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVAToken.sol';
import './Administrated.sol';
import './Testable.sol';

// Not a generalized vesting contract - just our compensation protocol
contract VIVAVestingVault is Administrated, Testable {

  using SafeMath for uint256;

  event Released(address beneficiary, uint256 amount);

  VIVAToken public token;

  uint256 public d1;
  uint256 public d2;

  mapping(address => uint256) internal totalDue;
  mapping(address => uint256) internal released;

  function VIVAVestingVault(
    VIVAToken _token,
    uint256 _d1,
    uint256 _d2,
    bool _testing
  ) public
    Testable(_testing) {
    token = _token;
    d1 = _d1;
    d2 = _d2;
  }

  function register(address beneficiary, uint256 due) public onlyAdmin {
    require(beneficiary != address(0));
    require(due >= released[beneficiary]);
    totalDue[beneficiary] = due;
  }

  function release(address beneficiary, uint256 tokens) public {
    require(beneficiary != address(0));
    require(tokens > 0);
    uint256 releasable = releasableAmount(beneficiary);
    require(releasable > 0);
    uint256 toRelease = releasable;
    require(releasable >= tokens);
    if(tokens < releasable) {
      toRelease = tokens;
    }
    require(token.balanceOf(this) >= toRelease);
    assert(released[beneficiary].add(toRelease) <= totalDue[beneficiary]);
    assert(token.transfer(beneficiary, toRelease));
    released[beneficiary] = released[beneficiary].add(toRelease);
    Released(beneficiary, toRelease);
  }

  function releasableAmount(address beneficiary) public view returns (uint256) {
    uint256 vestedAmount;
    if (getNow() < d1) {
      vestedAmount = 0;
    } else if (getNow() < d2) {
      vestedAmount = totalDue[beneficiary].div(2);
    } else {
      if(isAdmin(msg.sender)) {
        vestedAmount = totalDue[beneficiary];
      } else {
        vestedAmount = totalDue[beneficiary].div(2);
      }
    }
    return vestedAmount.sub(released[beneficiary]);
  }

  function setSchedule(uint256 _d1, uint256 _d2) public onlyAdmin {
    d1 = _d1;
    d2 = _d2;
  }

}
