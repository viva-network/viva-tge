pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract VIVACrowdsaleRound is Ownable {

  using SafeMath for uint256;

  struct Bonus {
    uint256 tier;
    uint256 rate;
  }

  bool public initialized;
  bool public refundable;
  uint256 public capAtWei;
  uint256 public capAtDuration;

  Bonus[] bonuses;

  function VIVACrowdsaleRound(
    bool _refundable,
    uint256 _capAtWei,
    uint256 _capAtDuration
  ) public {
    refundable = _refundable;
    capAtWei = _capAtWei;
    capAtDuration = _capAtDuration;
    initialized = true;
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
