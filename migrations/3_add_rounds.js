const async = require('async');

const VIVACrowdsale = artifacts.require('./VIVACrowdsale.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');
const VIVACrowdsaleRound = artifacts.require('./VIVACrowdsaleRound.sol');

const rounds = require('../rounds');

const DAY = 1000 * 60 * 60 * 24;

module.exports = function(deployer, network, accounts) {

  // TODO Set me:
  const testing = true;

  function createRound(round) {
    return (createRoundCallback) => {
      VIVACrowdsaleRound.new(round.refundable, round.capAtWei, round.capAtDuration, testing).then((instance) => {
        async.series(round.bonuses.map(createBonus), (err) => {
          if (err) {
            createRoundCallback(err);
          }
          createRoundCallback(null, instance);
        });

        function createBonus(bonus) {
          return (createBonusCallback) => {
            instance.addBonus(bonus.tier, bonus.rate).then(() => {
              createBonusCallback();
            }).catch((err) => {
              createBonusCallback(err);
            });
          };
        }
      }).catch((err) => {
        createRoundCallback(err);
      });
    };
  }

  VIVACrowdsaleData.deployed().then((instance) => {
    return new Promise((fulfill, reject) => {
      async.series(rounds.map(createRound), (err, roundInstances) => {
        if (err) {
          reject(err);
          return;
        }
        async.series(roundInstances.map(addRound), (err) => {
          if (err) {
            reject(err);
            return;
          }
          fulfill();
        });

        function addRound(roundInstance) {
          return (addRoundCallback) => {
            instance.addRound(roundInstance.address, {
              from: accounts[0]
            }).then(() => {
              addRoundCallback();
            }).catch((err) => {
              addRoundCallback(err);
            });
          };
        }
      });
    });
  });

};
