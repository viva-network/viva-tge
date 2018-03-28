pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/token/ERC20/CappedToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';

import './FrozenUntil.sol';

contract VIVAToken is CappedToken, FrozenUntil {

  using SafeERC20 for ERC20;

  string public name = "VIVA Token";
  string public symbol = "VIVA";
  uint8 public decimals = 18;

  event RevokedMint(address indexed from, uint256 amount);

  function VIVAToken(uint256 _cap, uint256 _frozenUntil) public
    CappedToken(_cap)
    FrozenUntil(_frozenUntil) { }

  function transfer(address _to, uint256 _value) public whenNotFrozen returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public whenNotFrozen returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public whenNotFrozen returns (bool) {
    return super.approve(_spender, _value);
  }

  function increaseApproval(address _spender, uint256 _addedValue) public whenNotFrozen returns (bool success) {
    return super.increaseApproval(_spender, _addedValue);
  }

  function decreaseApproval(address _spender, uint256 _subtractedValue) public whenNotFrozen returns (bool success) {
    return super.decreaseApproval(_spender, _subtractedValue);
  }

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
