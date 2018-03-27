pragma solidity 0.4.19;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Administrated is Ownable {

  mapping(address => bool) internal admins;

  function Administrated() public {
  }

  modifier onlyAdmin() {
    require(isAdmin(msg.sender));
    _;
  }

  function setAdmin(address _admin, bool _isAdmin) public {
    require(_admin != address(0));
    require(msg.sender == owner || admins[msg.sender] == true);
    admins[_admin] = _isAdmin;
  }

  function isAdmin(address _address) public view returns (bool) {
    return admins[_address];
  }

}
