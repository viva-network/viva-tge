const async = require('async');

const VIVAToken = artifacts.require('./VIVAToken.sol');

module.exports = function(deployer, network, accounts) {

  // TODO Set me:
  const tokensTotalSupply = 4000000000; // Note 10**18 multiplier in contract

  console.log('******* ACCOUNTS 0', accounts[0]);
  console.log(accounts);

  deployer.deploy(VIVAToken, tokensTotalSupply);

};
