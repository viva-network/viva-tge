const BigNumber = require('bignumber.js');

const DAY = 1000 * 60 * 60 * 24;
const REQUIRE_FAIL = 'VM Exception while processing transaction: revert';
const _0x0 = '0x0000000000000000000000000000000000000000';

function now() {
  return web3.eth.getBlock(web3.eth.blockNumber).timestamp;
}

async function subContractHadEvent(instance, name, args) {
  const allEvents = instance.allEvents({
    fromBlock: 0,
    toBlock: 'latest'
  });
  return new Promise((fulfill, reject) => {
    allEvents.get((err, res) => {
      if (err) {
        reject(err);
        return;
      } else {
        fulfill(_hadEvent(res, name, args));
      }
    });
  });
}

function hadEvent(result, name, args) {
  return _hadEvent(result.logs, name, args);
}

function _hadEvent(events, name, args) {
  if (events) {
    for (const event of events) {
      if (event.event === name) {
        if (!args) {
          return true;
        } else if (event.args) {
          for (const arg of Object.keys(args)) {
            let expected = args[arg];
            let actual = event.args[arg];
            if (actual && typeof actual.toNumber === 'function') { // Use the toString though
              actual = actual.toString();
            }
            if (expected != actual) {
              return false;
            }
          }
          return true;
        }
      }
    }
  }
  return false;
}

function tokenWithDecimals(amount) {
  return new BigNumber(amount).multipliedBy(new BigNumber('1000000000000000000'));
}

module.exports = {
  DAY,
  REQUIRE_FAIL,
  _0x0,
  now,
  hadEvent,
  subContractHadEvent,
  tokenWithDecimals
};
