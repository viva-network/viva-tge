const async = require('async');

const VIVAToken = artifacts.require('./VIVAToken.sol');
const VIVACrowdsale = artifacts.require('./VIVACrowdsale.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');
const CrowdsaleUtils = artifacts.require('./CrowdsaleUtils.sol');
const VaultUtils = artifacts.require('./VaultUtils.sol');
const CrowdsaleTokenUtils = artifacts.require('./CrowdsaleTokenUtils.sol');

const DAY = 1000 * 60 * 60 * 24;

module.exports = function(deployer, network, accounts) {

  // TODO Set me:
  const tokensTotalSupply = 4000000000;
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;
  const wallet = accounts[0];
  const testing = true;

  deployer.deploy(CrowdsaleUtils);
  deployer.deploy(VaultUtils);
  deployer.deploy(CrowdsaleTokenUtils);
  deployer.link(CrowdsaleUtils, VIVACrowdsale);
  deployer.link(VaultUtils, VIVACrowdsale);
  deployer.link(CrowdsaleTokenUtils, VIVACrowdsaleData);

  // TODO Promise hell but I just want it to work at this point
  deployer.deploy(VIVAToken, tokensTotalSupply).then(() => {
    return VIVAToken.deployed().then((token) => {
      // token.pause();
      // return deployer.deploy(
      //   VIVACrowdsaleData,
      //   token,
      //   wallet,
      //   startTime,
      //   testing
      // ).then(() => {
      //   return deployer.deploy(VIVACrowdsale, VIVACrowdsaleData.address, testing).then(() => {
      //     return VIVACrowdsaleData.deployed().then((data) => {
      //       token.transferOwnership(VIVACrowdsaleData.address);
      //       return data.setAdmin(VIVACrowdsaleData.address, true, {
      //         from: accounts[0]
      //       }).then(() => {
      //         return data.setAdmin(accounts[0], true, {
      //           from: accounts[0]
      //         }).then(() => {
      //           return VIVACrowdsale.deployed().then((crowdsale) => {
      //             return crowdsale.setAdmin(accounts[0], true, {
      //               from: accounts[0]
      //             });
      //           });
      //         });
      //       });
      //     });
      //   });
      // });
    });
  });


};
