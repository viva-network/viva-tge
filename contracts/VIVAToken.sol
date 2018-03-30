pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/token/ERC20/CappedToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';

contract VIVAToken is CappedToken, PausableToken {

  using SafeERC20 for ERC20;

  string public name = "VIVA Token";
  string public symbol = "VIVA";
  uint8 public decimals = 18;

  event RevokedMint(address indexed from, uint256 amount);

  function VIVAToken(uint256 _cap) public
    CappedToken(_cap)
    PausableToken() { }

  function revokeMint(address _from, uint256 _amount) public onlyOwner canMint returns (bool) {
    // This will allow 'undoing' of token minting (for legal situations)
    // Once token mint is finalized, this will never be possible
    require(_from != address(0));
    require(_amount > 0);
    require(_amount <= balanceOf(_from));
    totalSupply_ = totalSupply_.sub(_amount);
    balances[_from] = balances[_from].sub(_amount);
    RevokedMint(_from, _amount);
    return true;
  }

}
