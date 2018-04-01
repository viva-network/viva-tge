const async = require('async');

const VIVAToken = artifacts.require('./VIVAToken.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');
const CrowdsaleTokenUtils = artifacts.require('./CrowdsaleTokenUtils.sol');

module.exports = function(deployer, network, accounts) {

  // TODO Set me:
  const startTime = 1522713600;
  const wallet = accounts[0];

  deployer.deploy(CrowdsaleTokenUtils);
  deployer.link(CrowdsaleTokenUtils, VIVACrowdsaleData);

  console.log('******* ACCOUNTS 0', accounts[0]);
  console.log(accounts);

  deployer.deploy(
    VIVACrowdsaleData,
    VIVAToken.address,
    wallet,
    startTime
  );

};
