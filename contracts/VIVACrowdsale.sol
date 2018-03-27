pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVAVestingVault.sol';
import './VIVACrowdsaleData.sol';
import './VIVAVault.sol';
import './Testable.sol';

contract VIVACrowdsale is Testable {

  using SafeMath for uint256;

  // ms time constants
  uint256 public constant SECOND = 1000;
  uint256 public constant MINUTE = SECOND * 60;
  uint256 public constant HOUR = MINUTE * 60;
  uint256 public constant DAY = HOUR * 24;
  uint256 public constant WEEK = DAY * 7;

  // Crowdsale data store separated from logic
  VIVACrowdsaleData public data;

  // ===== Main TGE Parameters (Constant) =================================================
  uint256 public constant baseRate                 = 28000220000000;
  uint256 public constant minContributionWeiAmount = 1000000000000000;
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

  function privateInvestment(address beneficiary, uint256 tokens) public onlyOwner {
    // Marketing, private investment, etc.
    // This is of course subject to the predetermined token supply cap, so investors
    // are assured no flooding possible.
    // TODO 100 mil cap
    require(!data.isFinalized());
    require(tokens > 0);
    assert(data.mintTokens(beneficiary, tokens));
  }

  function () external payable {
    buyTokens();
  }

  function buyTokens() public payable {
    require(!data.isFinalized());
    VIVACrowdsaleRound round = getCurrentRound(getNow());
    require(round.initialized());
    uint256 tokens = getTokenAmount(round, baseRate, msg.value);
    require(validPurchase(round, msg.sender, msg.value, tokens));
    assert(data.purchased.value(msg.value)(round, msg.sender, msg.value, tokens));
    assert(data.mintTokens(msg.sender, tokens));
  }

  function validPurchase(VIVACrowdsaleRound round, address beneficiary, uint256 weiAmount, uint256 tokens) internal view returns (bool) {
    // Ensure exceeds min contribution size
    if(weiAmount < minContributionWeiAmount) {
      return false;
    }
    if(tokens <= 0) {
      return false;
    }

    // Ensure we have enough tokens left for sale
    if(tokens.add(data.mintedForSaleTokens()) > tokensForSale) {
      return false;
    }

    // TODO how will next round roll over before duration if hardcap cannot be excceded?

    // Ensure cap not exceeded
    if(weiAmount.add(data.weiRaisedForSale()) > round.capAtWei()) {
      return false;
    }

    uint256 contributed = weiAmount.add(data.getWeiContributed(beneficiary));
    // Ensure large investors are approved
    if(contributed > data.largeInvestorWei()) {
      if(data.getLargeInvestorApproval(beneficiary) < contributed) {
        return false;
      }
    }

    // It's valid!
    return true;
  }

  function getCurrentRound(uint256 valuationDate) public view returns (VIVACrowdsaleRound) {
    uint256 time = data.startTime();
    bool hadTimeRange = false;
    for(uint i = 0; i < data.getNumRounds(); i++) {
      bool inTimeRange = valuationDate >= time && valuationDate < time.add(data.rounds(i).capAtDuration());
      bool inCapRange = data.weiRaisedForSale() < data.rounds(i).capAtWei();
      if(inTimeRange) {
        if(inCapRange) {
          return data.rounds(i);
        }
        hadTimeRange = true;
      } else {
        if(hadTimeRange) {
          if(inCapRange) {
            return data.rounds(i);
          }
        }
      }
    }
  }

  function getTokenAmount(VIVACrowdsaleRound round, uint256 _baseRate, uint256 weiAmount) internal view returns(uint256) {
    return weiAmount.div(round.getBonusRate(_baseRate, weiAmount));
  }

  function cancel() onlyOwner public {
    require(!data.isFinalized());
    data.finalize(msg.sender, true);
  }

  function finalize() onlyOwner public {
    // TODO Time / hardcap
    require(!data.isFinalized());
    data.setBountyVault(createVault(msg.sender, tokensBounty));
    data.setReserveVault(createVault(msg.sender, tokensReserved));
    data.setTeamVault(createVestingVault(msg.sender, tokensTeam, getNow() + (365 * DAY), getNow() + (365 * DAY)));
    data.setAdvisorVault(createVestingVault(msg.sender, tokensAdvisor, getNow() + (30 * DAY), getNow() + (90 * DAY)));
    data.finalize(msg.sender, false);
    // Unsold tokens are burnt (i.e. never minted)
  }

  function createVestingVault(address admin, uint256 tokens, uint256 d1, uint256 d2) internal returns (VIVAVestingVault) {
    require(admin != address(0));
    require(tokens > 0);
    VIVAVestingVault vault = new VIVAVestingVault(data.token(), d1, d2, testing);
    assert(address(vault) != address(0));
    vault.setAdmin(admin, true);
    assert(data.mintTokens(address(vault), tokens));
  }

  function createVault(address admin, uint256 tokens) internal returns (VIVAVault) {
    require(admin != address(0));
    require(tokens > 0);
    VIVAVault vault = new VIVAVault(data.token());
    assert(address(vault) != address(0));
    vault.setAdmin(admin, true);
    assert(data.mintTokens(address(vault), tokens));
  }

}
