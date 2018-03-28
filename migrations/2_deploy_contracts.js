const async = require('async');

const VIVACrowdsale = artifacts.require('./VIVACrowdsale.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');

const DAY = 1000 * 60 * 60 * 24;

module.exports = function(deployer, network, accounts) {

  // TODO Set me:
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1;
  const wallet = accounts[0];
  const testing = true;

  deployer.deploy(
    VIVACrowdsaleData,
    wallet,
    startTime,
    testing
  ).then(() => {
    // TODO Cleaner chain but... YOLO
    return deployer.deploy(VIVACrowdsale, VIVACrowdsaleData.address, testing).then(() => {
      return VIVACrowdsaleData.deployed().then((data) => {
        return data.setAdmin(VIVACrowdsaleData.address, true, {
          from: accounts[0]
        }).then(() => {
          return data.setAdmin(accounts[0], true, {
            from: accounts[0]
          }).then(() => {
            return VIVACrowdsale.deployed().then((crowdsale) => {
              return crowdsale.setAdmin(accounts[0], true, {
                from: accounts[0]
              });
            });
          });
        });
      });
    });
  });

};
