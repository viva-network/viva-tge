pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVACrowdsaleData.sol';
import './VIVAVestingVault.sol';
import './VIVAVault.sol';

library CrowdsaleUtils {

  using SafeMath for uint256;

  function getCurrentRound(VIVACrowdsaleData data, uint256 valuationDate, uint256 weiRaisedForSale) public view returns (VIVACrowdsaleRound) {
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

  function validPurchase(VIVACrowdsaleData data, VIVACrowdsaleRound round, address beneficiary, uint256 weiAmount, uint256 tokens, uint256 minContributionWeiAmount, uint256 tokensForSale) public view returns (bool) {
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

    // It's valid!
    return true;
  }

}
