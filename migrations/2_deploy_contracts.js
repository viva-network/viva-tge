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
      console.log(`*** Deployed VIVAToken ${VIVAToken.address}`);
      return deployer.deploy(
        VIVACrowdsaleData,
        VIVAToken.address,
        wallet,
        startTime
      ).then(() => {
        return VIVACrowdsaleData.deployed().then((data) => {
          console.log(`*** Deployed VIVACrowdsaleData ${VIVACrowdsaleData.address}`);
          return deployer.deploy(VIVACrowdsale, VIVACrowdsaleData.address, testing).then(() => {
            return VIVACrowdsale.deployed().then((crowdsale) => {
              console.log(`*** Deployed VIVACrowdsale ${VIVACrowdsale.address}`);
              console.log(`Setting ${accounts[0]} as admin on VIVACrowdsaleData`);
              console.log(`Setting ${accounts[0]} as admin on VIVACrowdsale`);
              console.log(`Setting VIVACrowdsale ${VIVACrowdsale.address} as admin on VIVACrowdsaleData`);
              return Promise.all([
                token.pause(),
                token.transferOwnership(VIVACrowdsaleData.address),
                data.setAdmin(accounts[0], true),
                crowdsale.setAdmin(accounts[0], true),
                data.setAdmin(VIVACrowdsale.address, true)
              ]);
            });
          });
        });
      });
    });
  });


};
