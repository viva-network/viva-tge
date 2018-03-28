const async = require('async');

const VIVACrowdsale = artifacts.require('./VIVACrowdsale.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');
const VIVACrowdsaleRound = artifacts.require('./VIVACrowdsaleRound.sol');

const rounds = require('../rounds');

const DAY = 1000 * 60 * 60 * 24;

module.exports = function(deployer, network, accounts) {

  function createRound(round) {
    return (createRoundCallback) => {
      VIVACrowdsaleRound.new(round.refundable, round.capAtWei, round.capAtDuration).then((instance) => {
        async.series(round.bonuses.map(createBonus), (err) => {
          if (err) throw err;
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
      });
    };
  }

  async.series(rounds.map(createRound), (err, roundInstances) => {
    if (err) throw err;
    VIVACrowdsaleData.deployed().then((instance) => {
      async.series(roundInstances.map(addRound), (err) => {
        if (err) throw err;
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

};
