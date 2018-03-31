pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/token/ERC20/CappedToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';

contract VIVAToken is CappedToken, PausableToken {

  using SafeERC20 for ERC20;

  string public name = "VIVA Token";
  string public symbol = "VIVA";
  uint8 public decimals = 18;

  function VIVAToken(uint256 _cap) public
    CappedToken(_cap)
    PausableToken() { }

}
