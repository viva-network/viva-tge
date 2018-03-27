pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './VIVAToken.sol';
import './Administrated.sol';

contract VIVAVault is Administrated {

  using SafeMath for uint256;

  event Released(address beneficiary, uint256 amount);

  VIVAToken public token;

  function VIVAVault(
    VIVAToken _token
  ) public {
    token = _token;
  }

  function release(address beneficiary, uint256 amount) public onlyAdmin {
    require(beneficiary != address(0));
    require(amount > 0);

    uint256 releasable = releasableAmount(beneficiary);
    require(releasable > 0);
    require(token.balanceOf(this) >= releasable);
    require(amount <= releasable);

    assert(token.transfer(beneficiary, amount));

    Released(beneficiary, amount);
  }

  function releasableAmount(address beneficiary) public view returns (uint256) {
    require(beneficiary != address(0));
    // Any other restrictions we want
    return token.balanceOf(this);
  }

}
