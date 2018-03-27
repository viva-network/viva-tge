const async = require('async');

const VIVACrowdsale = artifacts.require('./VIVACrowdsale.sol');
const VIVACrowdsaleData = artifacts.require('./VIVACrowdsaleData.sol');
const VIVACrowdsaleRound = artifacts.require('./VIVACrowdsaleRound.sol');

const DAY = 1000 * 60 * 60 * 24;

module.exports = function(deployer, network, accounts) {

  const rounds = [{
      refundable: false,
      capAtWei: '500000000000000000000',
      capAtDuration: 10 * DAY,
      bonuses: [{
        tier: '0',
        rate: '20000160000000'
      }]
    },
    {
      refundable: false,
      capAtWei: '2570000000000000000000',
      capAtDuration: 10 * DAY,
      bonuses: [{
        tier: '0',
        rate: '20740900000000'
      }]
    },
    {
      refundable: false,
      capAtWei: '6870000000000000000000',
      capAtDuration: 10 * DAY,
      bonuses: [{
        tier: '0',
        rate: '21538630000000'
      }]
    },
    {
      refundable: true,
      capAtWei: '11200000000000000000000',
      capAtDuration: 20 * DAY,
      bonuses: [{
        tier: '0',
        rate: '22400170000000'
      }]
    },
    {
      refundable: true,
      capAtWei: '33070000000000000000000',
      capAtDuration: 20 * DAY,
      bonuses: [{
        tier: '0',
        rate: '24348020000000'
      }]
    },
    {
      refundable: true,
      capAtWei: '68770000000000000000000',
      capAtDuration: 20 * DAY,
      bonuses: [{
          tier: '0',
          rate: '28000220000000'
        },
        {
          tier: '1000000000000000000',
          rate: '26666880000000'
        },
        {
          tier: '1900000000000000000',
          rate: '25454740000000'
        },
        {
          tier: '2900000000000000000',
          rate: '24348020000000'
        }
      ]
    }
  ];

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
