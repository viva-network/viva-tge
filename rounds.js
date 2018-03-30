const DAY = 1000 * 60 * 60 * 24;

const ROUNDS = [{
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
        tier: '1000000000000000000', // 1 ETH
        rate: '26666880000000'
      },
      {
        tier: '1900000000000000000', // 1.9 ETH
        rate: '25454740000000'
      },
      {
        tier: '2900000000000000000', // 2.9 ETH
        rate: '24348020000000'
      }
    ]
  }
];

module.exports = ROUNDS;
