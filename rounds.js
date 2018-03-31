const DAY = 1000 * 60 * 60 * 24;

const ROUNDS = [{
    refundable: false,
    capAtWei: '500000000000000000000',
    capAtDuration: 10 * DAY,
    bonuses: [{
      tier: '0',
      rate: '50000'
    }]
  },
  {
    refundable: false,
    capAtWei: '2570000000000000000000',
    capAtDuration: 10 * DAY,
    bonuses: [{
      tier: '0',
      rate: '48309'
    }]
  },
  {
    refundable: false,
    capAtWei: '6870000000000000000000',
    capAtDuration: 10 * DAY,
    bonuses: [{
      tier: '0',
      rate: '46511'
    }]
  },
  {
    refundable: true,
    capAtWei: '11200000000000000000000',
    capAtDuration: 20 * DAY,
    bonuses: [{
      tier: '0',
      rate: '44642'
    }]
  },
  {
    refundable: true,
    capAtWei: '33070000000000000000000',
    capAtDuration: 20 * DAY,
    bonuses: [{
      tier: '0',
      rate: '41152'
    }]
  },
  {
    refundable: true,
    capAtWei: '68770000000000000000000',
    capAtDuration: 20 * DAY,
    bonuses: [{
        tier: '0',
        rate: '35714'
      },
      {
        tier: '1000000000000000000', // 1 ETH
        rate: '37500'
      },
      {
        tier: '1900000000000000000', // 1.9 ETH
        rate: '39286'
      },
      {
        tier: '2900000000000000000', // 2.9 ETH
        rate: '41072'
      }
    ]
  }
];

module.exports = ROUNDS;
