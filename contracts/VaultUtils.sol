pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVACrowdsaleData.sol';
import './VIVAVestingVault.sol';
import './VIVAVault.sol';

library VaultUtils {

  using SafeMath for uint256;

  function createVestingVault(VIVACrowdsaleData data, address admin, uint256 tokens, uint256 d1, uint256 d2, bool testing) public returns (VIVAVestingVault) {
    require(admin != address(0));
    VIVAVestingVault vault = new VIVAVestingVault(data.token(), d1, d2, testing);
    vault.setAdmin(admin, true);
    assert(data.mintTokens(address(vault), tokens));
    return vault;
  }

  function createVault(VIVACrowdsaleData data, address admin, uint256 tokens) public returns (VIVAVault) {
    require(admin != address(0));
    VIVAVault vault = new VIVAVault(data.token());
    vault.setAdmin(admin, true);
    assert(data.mintTokens(address(vault), tokens));
    return vault;
  }

}
