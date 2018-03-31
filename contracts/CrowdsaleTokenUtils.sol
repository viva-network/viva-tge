pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVACrowdsaleData.sol';
import './VIVAToken.sol';

library CrowdsaleTokenUtils {

  // Events
  event MintTokens(address beneficiary, uint256 tokens);

  using SafeMath for uint256;

  function mintTokens(VIVAToken token, address beneficiary, uint256 tokens) public returns (bool) {
    require(beneficiary != address(0));
    require(tokens > 0);
    MintTokens(beneficiary, tokens);
    return token.mint(beneficiary, tokens);
  }

}
