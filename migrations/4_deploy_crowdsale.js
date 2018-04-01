const async = require('async');

const VIVACrowdsale = artifacts.require('./VIVACrowdsale.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');
const CrowdsaleUtils = artifacts.require('./CrowdsaleUtils.sol');
const VaultUtils = artifacts.require('./VaultUtils.sol');

module.exports = function(deployer, network, accounts) {

  // TODO Set me:
  const testing = false;

  deployer.deploy(CrowdsaleUtils);
  deployer.deploy(VaultUtils);
  deployer.link(CrowdsaleUtils, VIVACrowdsale);
  deployer.link(VaultUtils, VIVACrowdsale);

  console.log('******* ACCOUNTS 0', accounts[0]);
  console.log(accounts);

  deployer.deploy(VIVACrowdsale, VIVACrowdsaleData.address, testing);
  // .then(() => {
  // return VIVACrowdsale.deployed().then((crowdsale) => {
  // console.log(`*** Deployed VIVACrowdsale ${VIVACrowdsale.address}`);
  // console.log(`Setting ${accounts[0]} as admin on VIVACrowdsaleData`);
  // console.log(`Setting ${accounts[0]} as admin on VIVACrowdsale`);
  // console.log(`Setting VIVACrowdsale ${VIVACrowdsale.address} as admin on VIVACrowdsaleData`);
  // return Promise.all([
  //   token.pause(),
  //   token.transferOwnership(VIVACrowdsaleData.address),
  //   data.setAdmin(accounts[0], true),
  //   crowdsale.setAdmin(accounts[0], true),
  //   data.setAdmin(VIVACrowdsale.address, true)
  // ]);
  // });
  // });

};
