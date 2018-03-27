pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/crowdsale/RefundVault.sol';

contract VIVARefundVault is RefundVault {

  function VIVARefundVault(
    address _wallet
  ) RefundVault(_wallet) public { }

  function setWallet(address _wallet) onlyOwner public {
    require(state == State.Active);
    require(_wallet != address(0));
    wallet = _wallet;
  }

  function getWallet() public view returns (address) {
    return wallet;
  }

}
