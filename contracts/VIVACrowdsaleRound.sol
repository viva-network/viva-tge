pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Testable.sol';

contract VIVACrowdsaleRound is Ownable, Testable {

  using SafeMath for uint256;

  struct Bonus {
    uint256 tier;
    uint256 rate;
  }

  bool public refundable;
  uint256 public capAtWei;
  uint256 public capAtDuration;

  Bonus[] bonuses;

  function VIVACrowdsaleRound(
    bool _refundable,
    uint256 _capAtWei,
    uint256 _capAtDuration,
    bool _testing
  ) Testable(_testing) public {
    refundable = _refundable;
    capAtWei = _capAtWei;
    capAtDuration = _capAtDuration;
  }

  function addBonus(uint256 tier, uint256 rate) public onlyOwner {
    Bonus memory bonus;
    bonus.tier = tier;
    bonus.rate = rate;
    bonuses.push(bonus);
  }

  function setCapAtDuration(uint256 _capAtDuration) onlyOwner public returns (uint256) {
    capAtDuration = _capAtDuration;
  }

  function setCapAtWei(uint256 _capAtWei) onlyOwner whenTesting public {
    capAtWei = _capAtWei;
  }

  function getBonusRate(uint256 baseRate, uint256 weiAmount) public view returns (uint256) {
    uint256 r = baseRate;
    for(uint i = 0; i < bonuses.length; i++) {
      if(weiAmount >= bonuses[i].tier) {
        r = bonuses[i].rate;
      } else {
        break;
      }
    }
    return r;
  }

}
