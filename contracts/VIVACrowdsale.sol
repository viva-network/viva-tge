pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './Testable.sol';
import './VIVACrowdsaleData.sol';
import './VIVAVestingVault.sol';
import './VIVAVault.sol';
import './CrowdsaleUtils.sol';
import './VaultUtils.sol';

contract VIVACrowdsale is Administrated, Testable {

  using SafeMath for uint256;

  // Events (more bubble up from VIVACrowdsaleData)
  event Cancelled();
  event Debug(uint256 value);

  // ms time constants
  uint256 public constant SECOND = 1000;
  uint256 public constant MINUTE = SECOND * 60;
  uint256 public constant HOUR = MINUTE * 60;
  uint256 public constant DAY = HOUR * 24;
  uint256 public constant WEEK = DAY * 7;

  // Crowdsale data store separated from logic
  VIVACrowdsaleData public data;

  // ===== Main TGE Parameters (Constant) =================================================
  uint256 public constant baseRate                 = 28000224001792;
  uint256 public constant minContributionWeiAmount = 1000000000000000;
  uint256 public constant tokensPrivateInvesting   = 50000000;
  uint256 public constant tokensMarketing          = 500000000;
  uint256 public constant tokensTeam               = 300000000;
  uint256 public constant tokensAdvisor            = 150000000;
  uint256 public constant tokensBounty             = 50000000;
  uint256 public constant tokensReserved           = 400000000;
  uint256 public constant tokensForSale            = 3000000000;
  // ======================================================================================

  function VIVACrowdsale(
    VIVACrowdsaleData _data,
    bool _testing
  ) Testable(_testing) public {
      require(_data != address(0));
      data = _data;
  }

  function privateContribution(address beneficiary, uint256 tokens) public onlyAdmin {
    require(beneficiary != address(0));
    require(tokens > 0);
    require(!data.isFinalized());
    require(tokens.add(data.privateContributionTokens()) <= tokensPrivateInvesting.add(tokensMarketing));
    assert(data.registerPrivateContribution(beneficiary, tokens));
    assert(data.mintTokens(beneficiary, tokens));
  }

  function getTokenAmount(VIVACrowdsaleRound round, uint256 weiAmount) public view returns(uint256) {
    require(address(round) != address(0));
    if(weiAmount == 0) return 0;
    return weiAmount.div(round.getBonusRate(baseRate, weiAmount));
  }

  function () external payable {
    buyTokens();
  }

  function buyTokens() public payable {
    require(!data.isFinalized());
    VIVACrowdsaleRound round = getCurrentRound(getNow(), data.weiRaisedForSale());
    require(address(round) != address(0));
    uint256 tokens = getTokenAmount(round, msg.value);
    require(CrowdsaleUtils.validPurchase(data, round, msg.sender, msg.value, tokens, minContributionWeiAmount, tokensForSale));
    assert(data.registerPurchase.value(msg.value)(round, msg.sender, tokens));
    assert(data.mintTokens(msg.sender, tokens));
  }

  function getCurrentRound(uint256 valuationDate, uint256 weiRaisedForSale) public view returns (VIVACrowdsaleRound) {
    return CrowdsaleUtils.getCurrentRound(data, valuationDate, weiRaisedForSale);
  }

  function cancel() onlyAdmin public {
    require(!data.isFinalized());
    data.finalize(msg.sender, true);
    Cancelled();
  }

  function finalize() onlyAdmin public {
    require(!data.isFinalized());
    data.setBountyVault(VaultUtils.createVault(data, msg.sender, tokensBounty));
    data.setReserveVault(VaultUtils.createVault(data, msg.sender, tokensReserved));
    data.setTeamVault(VaultUtils.createVestingVault(data, msg.sender, tokensTeam, getNow() + (365 * DAY), getNow() + (365 * DAY), testing));
    data.setAdvisorVault(VaultUtils.createVestingVault(data, msg.sender, tokensAdvisor, getNow() + (30 * DAY), getNow() + (90 * DAY), testing));
    data.finalize(msg.sender, false);
    // Unsold tokens are burnt (i.e. never minted)
  }

}
