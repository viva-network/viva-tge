pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVAVestingVault.sol';
import './VIVACrowdsaleData.sol';
import './VIVAVault.sol';
import './Testable.sol';

contract VIVACrowdsale is Administrated, Testable {

  using SafeMath for uint256;

  // Events (more bubble up from VIVACrowdsaleData)
  event Cancelled();

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

  function getCurrentRound(uint256 valuationDate, uint256 weiRaisedForSale) public view returns (VIVACrowdsaleRound) {
    uint256 time = data.startTime();
    bool hadTimeRange = false;
    for(uint i = 0; i < data.getNumRounds(); i++) {
      bool inTimeRange = valuationDate >= time && valuationDate < time.add(data.rounds(i).capAtDuration());
      bool inCapRange = weiRaisedForSale < data.rounds(i).capAtWei();
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
      time = time.add(data.rounds(i).capAtDuration());
    }
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
    require(validPurchase(round, msg.sender, msg.value, tokens));
    assert(data.registerPurchase.value(msg.value)(round, msg.sender, tokens));
    assert(data.mintTokens(msg.sender, tokens));
  }

  function validPurchase(VIVACrowdsaleRound round, address beneficiary, uint256 weiAmount, uint256 tokens) internal view returns (bool) {
    // Crowdsale must be active
    if(address(round) == address(0)) {
      return false;
    }
    if(data.isFinalized()) {
      return false;
    }

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

    if(data.isBlacklisted(beneficiary)) {
      return false;
    }

    // It's valid!
    return true;
  }

  function cancel() onlyAdmin public {
    require(!data.isFinalized());
    data.finalize(msg.sender, true);
    Cancelled();
  }

  function finalize() onlyAdmin public {
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

  function blacklist(address beneficiary) public onlyAdmin {
    require(beneficiary != address(0));
    require(!data.isFinalized());
    uint256 tokensOwned = data.token().balanceOf(beneficiary);
    if(tokensOwned > 0) {
      // Assumes these tokens were issued in the general sale (not private investment or otherwise)
      assert(data.revokeMint(beneficiary, tokensOwned));
    }
    assert(data.unregisterPurchase(beneficiary, tokensOwned, data.getWeiContributed(beneficiary)));
    data.blacklist(beneficiary, true);
  }

}
