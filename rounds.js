const DAY = 1000 * 60 * 60 * 24;

const ROUNDS = [{
    refundable: false,
    capAtWei: '500000000000000000000',
    capAtDuration: 10 * DAY,
    bonuses: [{
      tier: '0',
      rate: '20000000000000'
    }]
  },
  {
    refundable: false,
    capAtWei: '2570000000000000000000',
    capAtDuration: 10 * DAY,
    bonuses: [{
      tier: '0',
      rate: '20700076590283'
    }]
  },
  {
    refundable: false,
    capAtWei: '6870000000000000000000',
    capAtDuration: 10 * DAY,
    bonuses: [{
      tier: '0',
      rate: '21500290253918'
    }]
  },
  {
    refundable: true,
    capAtWei: '11200000000000000000000',
    capAtDuration: 20 * DAY,
    bonuses: [{
      tier: '0',
      rate: '22400430088257'
    }]
  },
  {
    refundable: true,
    capAtWei: '33070000000000000000000',
    capAtDuration: 20 * DAY,
    bonuses: [{
      tier: '0',
      rate: '24300155520995'
    }]
  },
  {
    refundable: true,
    capAtWei: '68770000000000000000000',
    capAtDuration: 20 * DAY,
    bonuses: [{
        tier: '0',
        rate: '28000224001792'
      },
      {
        tier: '1000000000000000000', // 1 ETH
        rate: '26666880001706'
      },
      {
        tier: '1900000000000000000', // 1.9 ETH
        rate: '25454749092538'
      },
      {
        tier: '2900000000000000000', // 2.9 ETH
        rate: '24300155520995'
      }
    ]
  }
];

module.exports = ROUNDS;
